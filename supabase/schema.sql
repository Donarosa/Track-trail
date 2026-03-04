-- ============================================================
-- TrackTrail - Schema completo para Supabase
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLAS
-- ============================================================

-- Perfil de usuario extendiendo auth.users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin','trainer','runner')) DEFAULT 'runner',
  status TEXT NOT NULL CHECK (status IN ('active','paused','deleted')) DEFAULT 'active',
  trainer_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entrenadores autorizados (whitelist gestionada por superadmin)
CREATE TABLE public.authorized_trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','paused')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entrenamientos
CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published')) DEFAULT 'draft',
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bloques de entrenamiento
CREATE TABLE public.training_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  block_name TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('distance_time','time','distance','comment')) DEFAULT 'comment',
  has_distance BOOLEAN NOT NULL DEFAULT false,
  has_time BOOLEAN NOT NULL DEFAULT false,
  has_elevation BOOLEAN NOT NULL DEFAULT false,
  repetitions INT DEFAULT 1,
  order_index INT NOT NULL
);

-- Asignaciones de entrenamiento a corredores
CREATE TABLE public.runner_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  runner_id UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending','completed','not_done')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resultados cargados por corredores
CREATE TABLE public.runner_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.runner_assignments(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES public.training_blocks(id) ON DELETE CASCADE,
  value_distance NUMERIC,
  value_time NUMERIC,
  value_elevation NUMERIC,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDICES
-- ============================================================

CREATE INDEX idx_users_trainer_id ON public.users(trainer_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_trainings_trainer_id ON public.trainings(trainer_id);
CREATE INDEX idx_trainings_date ON public.trainings(date);
CREATE INDEX idx_training_blocks_training_id ON public.training_blocks(training_id);
CREATE INDEX idx_runner_assignments_training_id ON public.runner_assignments(training_id);
CREATE INDEX idx_runner_assignments_runner_id ON public.runner_assignments(runner_id);
CREATE INDEX idx_runner_results_assignment_id ON public.runner_results(assignment_id);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runner_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runner_results ENABLE ROW LEVEL SECURITY;

-- Helper: obtener rol del usuario autenticado (SECURITY DEFINER evita recursión RLS en users)
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- Helper: verificar si el usuario actual es trainer de un training (evita recursión cruzada)
CREATE OR REPLACE FUNCTION public.is_trainer_of(p_training_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trainings
    WHERE id = p_training_id AND trainer_id = auth.uid()
  )
$$;

-- Helper: verificar si un runner tiene assignment para un training (evita recursión RLS trainings↔assignments)
CREATE OR REPLACE FUNCTION public.runner_has_assignment(p_training_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.runner_assignments
    WHERE training_id = p_training_id AND runner_id = auth.uid()
  );
$$;

-- Helper: verificar si un runner es dueño de un assignment (evita recursión RLS results↔assignments)
CREATE OR REPLACE FUNCTION public.runner_owns_assignment(p_assignment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.runner_assignments
    WHERE id = p_assignment_id AND runner_id = auth.uid()
  );
$$;

-- ---------- USERS ----------

-- Superadmin ve todo
CREATE POLICY "superadmin_users_all" ON public.users
  FOR ALL USING (public.auth_user_role() = 'superadmin');

-- Runners ven solo su propio perfil
CREATE POLICY "runner_users_select_own" ON public.users
  FOR SELECT USING (
    auth.uid() = id
  );

-- Trainers ven su perfil y todos los runners
CREATE POLICY "trainer_users_select" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR (public.auth_user_role() = 'trainer' AND role = 'runner')
  );

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------- AUTHORIZED_TRAINERS ----------

-- Superadmin gestiona todo
CREATE POLICY "superadmin_auth_trainers_all" ON public.authorized_trainers
  FOR ALL USING (public.auth_user_role() = 'superadmin');

-- Cualquier autenticado puede leer (para validar en login)
CREATE POLICY "auth_trainers_select" ON public.authorized_trainers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ---------- TRAININGS ----------

-- Superadmin ve todo
CREATE POLICY "superadmin_trainings_all" ON public.trainings
  FOR ALL USING (public.auth_user_role() = 'superadmin');

-- Trainers CRUD sus propios entrenamientos
CREATE POLICY "trainer_trainings_all" ON public.trainings
  FOR ALL USING (trainer_id = auth.uid());

-- Runners ven solo entrenamientos published que les fueron asignados
CREATE POLICY "runner_trainings_select" ON public.trainings
  FOR SELECT USING (
    status = 'published' AND public.runner_has_assignment(id)
  );

-- ---------- TRAINING_BLOCKS ----------

-- Superadmin ve todo
CREATE POLICY "superadmin_blocks_all" ON public.training_blocks
  FOR ALL USING (public.auth_user_role() = 'superadmin');

-- Trainers gestionan bloques de sus entrenamientos
CREATE POLICY "trainer_blocks_all" ON public.training_blocks
  FOR ALL USING (public.is_trainer_of(training_id));

-- Runners ven bloques de entrenamientos asignados
CREATE POLICY "runner_blocks_select" ON public.training_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.runner_assignments ra
      WHERE ra.training_id = training_id AND ra.runner_id = auth.uid()
    )
  );

-- ---------- RUNNER_ASSIGNMENTS ----------

-- Superadmin ve todo
CREATE POLICY "superadmin_assignments_all" ON public.runner_assignments
  FOR ALL USING (public.auth_user_role() = 'superadmin');

-- Runners ven sus propias asignaciones
CREATE POLICY "runner_assignments_select" ON public.runner_assignments
  FOR SELECT USING (runner_id = auth.uid());

-- Runners pueden actualizar sus asignaciones (marcar completado)
CREATE POLICY "runner_assignments_update" ON public.runner_assignments
  FOR UPDATE USING (runner_id = auth.uid())
  WITH CHECK (runner_id = auth.uid());

-- Trainers ven y gestionan asignaciones de sus entrenamientos
CREATE POLICY "trainer_assignments_all" ON public.runner_assignments
  FOR ALL USING (public.is_trainer_of(training_id));

-- ---------- RUNNER_RESULTS ----------

-- Superadmin ve todo
CREATE POLICY "superadmin_results_all" ON public.runner_results
  FOR ALL USING (public.auth_user_role() = 'superadmin');

-- Runners CRUD sus propios resultados
CREATE POLICY "runner_results_all" ON public.runner_results
  FOR ALL USING (public.runner_owns_assignment(assignment_id));

-- Trainers ven resultados de sus runners
CREATE POLICY "trainer_results_select" ON public.runner_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.runner_assignments ra
      WHERE ra.id = assignment_id AND public.is_trainer_of(ra.training_id)
    )
  );

-- ============================================================
-- FUNCIONES RPC
-- ============================================================

-- Top 5 km del mes por trainer
CREATE OR REPLACE FUNCTION public.get_monthly_km_top5(p_trainer_id UUID)
RETURNS TABLE (
  runner_id UUID,
  runner_name TEXT,
  total_km NUMERIC
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    u.id AS runner_id,
    COALESCE(u.name, u.email) AS runner_name,
    COALESCE(SUM(rr.value_distance), 0) AS total_km
  FROM public.users u
  JOIN public.runner_assignments ra ON ra.runner_id = u.id
  JOIN public.runner_results rr ON rr.assignment_id = ra.id
  JOIN public.trainings t ON t.id = ra.training_id
  WHERE u.trainer_id = p_trainer_id
    AND u.status = 'active'
    AND rr.value_distance IS NOT NULL
    AND t.date >= date_trunc('month', CURRENT_DATE)
    AND t.date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY u.id, u.name, u.email
  ORDER BY total_km DESC
  LIMIT 5;
$$;

-- Top 5 entrenamientos completados del mes por trainer
CREATE OR REPLACE FUNCTION public.get_monthly_training_top5(p_trainer_id UUID)
RETURNS TABLE (
  runner_id UUID,
  runner_name TEXT,
  completed_count BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    u.id AS runner_id,
    COALESCE(u.name, u.email) AS runner_name,
    COUNT(ra.id) AS completed_count
  FROM public.users u
  JOIN public.runner_assignments ra ON ra.runner_id = u.id
  JOIN public.trainings t ON t.id = ra.training_id
  WHERE u.trainer_id = p_trainer_id
    AND u.status = 'active'
    AND ra.status = 'completed'
    AND t.date >= date_trunc('month', CURRENT_DATE)
    AND t.date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY u.id, u.name, u.email
  ORDER BY completed_count DESC
  LIMIT 5;
$$;

-- Verificar si un email está autorizado como entrenador (accesible sin auth)
CREATE OR REPLACE FUNCTION public.is_authorized_trainer(p_email TEXT)
RETURNS TABLE (authorized BOOLEAN, status TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT true, at.status
  FROM public.authorized_trainers at
  WHERE at.email = p_email
  LIMIT 1;
$$;

-- Publicar entrenamiento y auto-asignar a runners activos
CREATE OR REPLACE FUNCTION public.publish_training(p_training_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_trainer_id UUID;
BEGIN
  -- Obtener trainer_id del entrenamiento
  SELECT trainer_id INTO v_trainer_id
  FROM public.trainings
  WHERE id = p_training_id;

  IF v_trainer_id IS NULL THEN
    RAISE EXCEPTION 'Training not found';
  END IF;

  -- Verificar que el caller es el trainer
  IF v_trainer_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Actualizar estado a published
  UPDATE public.trainings
  SET status = 'published'
  WHERE id = p_training_id;

  -- Auto-asignar a TODOS los runners activos de la plataforma
  INSERT INTO public.runner_assignments (training_id, runner_id)
  SELECT p_training_id, u.id
  FROM public.users u
  WHERE u.role = 'runner'
    AND u.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.runner_assignments ra
      WHERE ra.training_id = p_training_id AND ra.runner_id = u.id
    );
END;
$$;

-- Seed superadmin
CREATE OR REPLACE FUNCTION public.seed_superadmin()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Solo crea si no existe ningún superadmin
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'superadmin') THEN
    -- Nota: el usuario debe existir previamente en auth.users
    -- Este seed se ejecuta tras crear el usuario en el dashboard de Supabase
    NULL;
  END IF;
END;
$$;

-- ============================================================
-- TRIGGER: Auto-crear perfil al registrarse
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT DEFAULT 'runner';
  v_trainer_id UUID;
BEGIN
  -- Verificar si es entrenador autorizado
  IF EXISTS (
    SELECT 1 FROM public.authorized_trainers
    WHERE email = NEW.email AND status = 'active'
  ) THEN
    v_role := 'trainer';
  END IF;

  -- Verificar si es superadmin (email específico)
  IF NEW.email = 'superadmin@trail.com' THEN
    v_role := 'superadmin';
  END IF;

  -- Para runners, buscar un trainer activo al cual asignarlos
  -- Prioriza trainers reales sobre superadmin
  IF v_role = 'runner' THEN
    SELECT id INTO v_trainer_id
    FROM public.users
    WHERE role IN ('trainer', 'superadmin') AND status = 'active'
    ORDER BY (role = 'trainer') DESC
    LIMIT 1;
  END IF;

  INSERT INTO public.users (id, email, name, role, trainer_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL),
    v_role,
    v_trainer_id
  );

  -- Auto-asignar últimos 3 entrenamientos publicados a runners nuevos
  IF v_role = 'runner' AND v_trainer_id IS NOT NULL THEN
    INSERT INTO public.runner_assignments (training_id, runner_id)
    SELECT t.id, NEW.id
    FROM public.trainings t
    WHERE t.status = 'published'
      AND t.trainer_id = v_trainer_id
    ORDER BY t.date DESC
    LIMIT 3;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED: Crear superadmin en auth.users
-- Nota: Ejecutar manualmente en Supabase Dashboard > Authentication
-- Email: superadmin@trail.com
-- Password: 1234
-- Esto triggereará handle_new_user y creará el perfil con role=superadmin
-- ============================================================
