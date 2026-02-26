CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin','trainer','runner')) DEFAULT 'runner',
  status TEXT NOT NULL CHECK (status IN ('active','paused','deleted')) DEFAULT 'active',
  trainer_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.authorized_trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','paused')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE public.training_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  block_name TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('distance_time','time','distance','comment')),
  repetitions INT DEFAULT 1,
  order_index INT NOT NULL
);

CREATE TABLE public.runner_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES public.trainings(id),
  runner_id UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending','completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.runner_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.runner_assignments(id),
  block_id UUID NOT NULL REFERENCES public.training_blocks(id),
  value_distance NUMERIC,
  value_time NUMERIC,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_trainer_id ON public.users(trainer_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_trainings_trainer_id ON public.trainings(trainer_id);
CREATE INDEX idx_trainings_date ON public.trainings(date);
CREATE INDEX idx_training_blocks_training_id ON public.training_blocks(training_id);
CREATE INDEX idx_runner_assignments_training_id ON public.runner_assignments(training_id);
CREATE INDEX idx_runner_assignments_runner_id ON public.runner_assignments(runner_id);
CREATE INDEX idx_runner_results_assignment_id ON public.runner_results(assignment_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runner_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runner_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_users_all" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'superadmin')
  );

CREATE POLICY "runner_users_select_own" ON public.users
  FOR SELECT USING (
    auth.uid() = id
  );

CREATE POLICY "trainer_users_select" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR trainer_id = auth.uid()
  );

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "superadmin_auth_trainers_all" ON public.authorized_trainers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'superadmin')
  );

CREATE POLICY "auth_trainers_select" ON public.authorized_trainers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "superadmin_trainings_all" ON public.trainings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'superadmin')
  );

CREATE POLICY "trainer_trainings_all" ON public.trainings
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY "runner_trainings_select" ON public.trainings
  FOR SELECT USING (
    status = 'published' AND EXISTS (
      SELECT 1 FROM public.runner_assignments ra
      WHERE ra.training_id = id AND ra.runner_id = auth.uid()
    )
  );

CREATE POLICY "superadmin_blocks_all" ON public.training_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'superadmin')
  );

CREATE POLICY "trainer_blocks_all" ON public.training_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.trainings t
      WHERE t.id = training_id AND t.trainer_id = auth.uid()
    )
  );

CREATE POLICY "runner_blocks_select" ON public.training_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.runner_assignments ra
      JOIN public.trainings t ON t.id = ra.training_id
      WHERE t.id = training_id AND ra.runner_id = auth.uid() AND t.status = 'published'
    )
  );

CREATE POLICY "superadmin_assignments_all" ON public.runner_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'superadmin')
  );

CREATE POLICY "runner_assignments_select" ON public.runner_assignments
  FOR SELECT USING (runner_id = auth.uid());

CREATE POLICY "runner_assignments_update" ON public.runner_assignments
  FOR UPDATE USING (runner_id = auth.uid())
  WITH CHECK (runner_id = auth.uid());

CREATE POLICY "trainer_assignments_all" ON public.runner_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.trainings t
      WHERE t.id = training_id AND t.trainer_id = auth.uid()
    )
  );

CREATE POLICY "superadmin_results_all" ON public.runner_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'superadmin')
  );

CREATE POLICY "runner_results_all" ON public.runner_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.runner_assignments ra
      WHERE ra.id = assignment_id AND ra.runner_id = auth.uid()
    )
  );

CREATE POLICY "trainer_results_select" ON public.runner_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.runner_assignments ra
      JOIN public.trainings t ON t.id = ra.training_id
      WHERE ra.id = assignment_id AND t.trainer_id = auth.uid()
    )
  );

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
    AND rr.created_at >= date_trunc('month', CURRENT_DATE)
    AND rr.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY u.id, u.name, u.email
  ORDER BY total_km DESC
  LIMIT 5;
$$;

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
    AND ra.created_at >= date_trunc('month', CURRENT_DATE)
    AND ra.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY u.id, u.name, u.email
  ORDER BY completed_count DESC
  LIMIT 5;
$$;

CREATE OR REPLACE FUNCTION public.publish_training(p_training_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_trainer_id UUID;
BEGIN
  SELECT trainer_id INTO v_trainer_id
  FROM public.trainings
  WHERE id = p_training_id;

  IF v_trainer_id IS NULL THEN
    RAISE EXCEPTION 'Training not found';
  END IF;

  IF v_trainer_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.trainings
  SET status = 'published'
  WHERE id = p_training_id;

  INSERT INTO public.runner_assignments (training_id, runner_id)
  SELECT p_training_id, u.id
  FROM public.users u
  WHERE u.trainer_id = v_trainer_id
    AND u.role = 'runner'
    AND u.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.runner_assignments ra
      WHERE ra.training_id = p_training_id AND ra.runner_id = u.id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT DEFAULT 'runner';
  v_trainer_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.authorized_trainers
    WHERE email = NEW.email AND status = 'active'
  ) THEN
    v_role := 'trainer';
  END IF;

  IF NEW.email = 'superadmin@trail.com' THEN
    v_role := 'superadmin';
  END IF;

  IF v_role = 'runner' THEN
    SELECT id INTO v_trainer_id
    FROM public.users
    WHERE role = 'trainer' AND status = 'active'
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

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.users (id, email, name, role, status)
VALUES (
  'f3200693-7d53-436f-ba30-5ebfd5d20ff4',
  'superadmin@trail.com',
  'Super Admin',
  'superadmin',
  'active'
);
