export type MemberRole = "owner" | "admin" | "member";
export type VentureCategory =
  | "dropshipping"
  | "printing_3d"
  | "story_books"
  | "clothing"
  | "saas"
  | "other";
export type LifecycleStage =
  | "idea"
  | "research"
  | "validation"
  | "planning"
  | "mvp"
  | "launch"
  | "growth"
  | "scale";
export type VentureState = "active" | "paused" | "archived";
export type ExecutionMode = "sequential" | "parallel";
export type TaskStatus = "backlog" | "research" | "doing" | "waiting" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type TxnType = "expense" | "revenue";
export type NoteType = "note" | "research" | "supplier" | "competitor" | "meeting";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  created_by: string;
  created_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
  profiles?: Profile;
}

export interface Venture {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  category: VentureCategory;
  current_stage: LifecycleStage;
  state: VentureState;
  execution_mode: ExecutionMode;
  next_action: string | null;
  owner_id: string | null;
  score_profit: number;
  score_demand: number;
  score_interest: number;
  score_low_cost: number;
  score_low_time: number;
  score_low_risk: number;
  est_launch_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  venture_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  stage: LifecycleStage | null;
  track: string | null;
  priority: TaskPriority;
  assignee_id: string | null;
  blocked_by: string | null;
  due_date: string | null;
  position: number;
  created_by: string;
  completed_at: string | null;
}

export interface Transaction {
  id: string;
  venture_id: string;
  type: TxnType;
  category: string | null;
  description: string | null;
  amount: number;
  currency: string;
  occurred_on: string;
}

export interface Note {
  id: string;
  venture_id: string;
  title: string;
  content: string | null;
  type: NoteType;
  url: string | null;
  created_at: string;
}
