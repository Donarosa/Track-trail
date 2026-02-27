-- ============================================================
-- Migración: Todos los trainers ven todos los runners
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Reemplazar policy: trainers ven su perfil + todos los runners
DROP POLICY IF EXISTS "trainer_users_select" ON public.users;

CREATE POLICY "trainer_users_select" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR (public.auth_user_role() = 'trainer' AND role = 'runner')
  );
