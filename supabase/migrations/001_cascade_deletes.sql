-- ============================================================
-- Migración: Agregar CASCADE a FKs para permitir eliminar entrenamientos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. runner_assignments.training_id → ON DELETE CASCADE
ALTER TABLE public.runner_assignments
  DROP CONSTRAINT runner_assignments_training_id_fkey,
  ADD CONSTRAINT runner_assignments_training_id_fkey
    FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;

-- 2. runner_results.assignment_id → ON DELETE CASCADE
ALTER TABLE public.runner_results
  DROP CONSTRAINT runner_results_assignment_id_fkey,
  ADD CONSTRAINT runner_results_assignment_id_fkey
    FOREIGN KEY (assignment_id) REFERENCES public.runner_assignments(id) ON DELETE CASCADE;

-- 3. runner_results.block_id → ON DELETE CASCADE
ALTER TABLE public.runner_results
  DROP CONSTRAINT runner_results_block_id_fkey,
  ADD CONSTRAINT runner_results_block_id_fkey
    FOREIGN KEY (block_id) REFERENCES public.training_blocks(id) ON DELETE CASCADE;
