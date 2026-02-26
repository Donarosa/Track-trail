export type UserRole = 'superadmin' | 'trainer' | 'runner';
export type UserStatus = 'active' | 'paused' | 'deleted';
export type TrainingStatus = 'draft' | 'published';
export type AssignmentStatus = 'pending' | 'completed';
export type BlockInputType = 'distance_time' | 'time' | 'distance' | 'comment';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  trainer_id: string | null;
  created_at: string;
}

export interface AuthorizedTrainer {
  id: string;
  email: string;
  status: 'active' | 'paused';
  created_at: string;
}

export interface Training {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  date: string;
  status: TrainingStatus;
  version: number;
  created_at: string;
}

export interface TrainingBlock {
  id: string;
  training_id: string;
  block_name: string;
  input_type: BlockInputType;
  repetitions: number;
  order_index: number;
}

export interface RunnerAssignment {
  id: string;
  training_id: string;
  runner_id: string;
  status: AssignmentStatus;
  created_at: string;
}

export interface RunnerResult {
  id: string;
  assignment_id: string;
  block_id: string;
  value_distance: number | null;
  value_time: number | null;
  comment: string | null;
  created_at: string;
}

// Extended types for joins
export interface TrainingWithBlocks extends Training {
  training_blocks: TrainingBlock[];
}

export interface AssignmentWithTraining extends RunnerAssignment {
  training: TrainingWithBlocks;
}

export interface AssignmentWithRunner extends RunnerAssignment {
  user: Pick<User, 'id' | 'name' | 'email'>;
}
