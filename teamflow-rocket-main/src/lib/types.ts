export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed";
export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  assignee_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
