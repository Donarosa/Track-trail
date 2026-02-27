-- ============================================================
-- Migración: Fix auto-asignación de runners a trainers
-- El trigger original solo buscaba role='trainer', ignorando superadmin.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

-- 1. Recrear trigger para incluir superadmin como trainer válido
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
  -- (se asigna al primer trainer disponible; se puede reasignar manualmente)
  IF v_role = 'runner' THEN
    SELECT id INTO v_trainer_id
    FROM public.users
    WHERE role IN ('trainer', 'superadmin') AND status = 'active'
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

-- 2. Asignar runners huérfanos (trainer_id NULL) al primer trainer/superadmin disponible
UPDATE public.users
SET trainer_id = (
  SELECT id FROM public.users
  WHERE role IN ('trainer', 'superadmin') AND status = 'active'
  LIMIT 1
)
WHERE role = 'runner' AND trainer_id IS NULL;
