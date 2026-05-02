import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Project, Task, TaskPriority, TaskStatus, Profile, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Calendar as CalIcon, Trash2, Pencil, ListTodo } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, isPast } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  description: z.string().trim().max(2000).optional(),
  project_id: z.string().uuid("Project required"),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in_progress", "completed"]),
  due_date: z.string().optional().or(z.literal("")),
  assignee_id: z.string().uuid().optional().or(z.literal("")),
});

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "completed"];

export default function Tasks() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilter = searchParams.get("project") ?? "all";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", project_id: "", priority: "medium" as TaskPriority,
    status: "todo" as TaskStatus, due_date: "", assignee_id: "",
  });

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: p }, { data: pr }] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("name"),
      supabase.from("profiles").select("*"),
    ]);
    setTasks((t ?? []) as Task[]);
    setProjects((p ?? []) as Project[]);
    setProfiles((pr ?? []) as Profile[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (projectFilter !== "all" && t.project_id !== projectFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, projectFilter, priorityFilter, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "", description: "",
      project_id: projectFilter !== "all" ? projectFilter : (projects[0]?.id ?? ""),
      priority: "medium", status: "todo", due_date: "", assignee_id: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title, description: t.description ?? "",
      project_id: t.project_id, priority: t.priority, status: t.status,
      due_date: t.due_date ?? "", assignee_id: t.assignee_id ?? "",
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    const parsed = taskSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const payload = {
      title: parsed.data.title,
      description: parsed.data.description || null,
      project_id: parsed.data.project_id,
      priority: parsed.data.priority,
      status: parsed.data.status,
      due_date: parsed.data.due_date || null,
      assignee_id: parsed.data.assignee_id || null,
    };
    if (editing) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Task updated");
    } else {
      const { error } = await supabase.from("tasks").insert({ ...payload, created_by: user?.id });
      if (error) return toast.error(error.message);
      toast.success("Task created");
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (t: Task) => {
    if (!confirm(`Delete "${t.title}"?`)) return;
    const { error } = await supabase.from("tasks").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Task deleted");
    load();
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (e: DragStartEvent) => {
    const t = tasks.find((x) => x.id === e.active.id);
    if (t) setActiveTask(t);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    if (!COLUMNS.includes(newStatus)) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === newStatus) return;

    // Optimistic
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-in-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Drag cards between columns to update status</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2" disabled={projects.length === 0}>
            <Plus className="h-4 w-4" /> New task
          </Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks…" className="pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={projectFilter} onValueChange={(v) => {
          if (v === "all") searchParams.delete("project"); else searchParams.set("project", v);
          setSearchParams(searchParams);
        }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <ListTodo className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Create a project first to add tasks</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid md:grid-cols-3 gap-4">
            {COLUMNS.map((status) => (
              <Column
                key={status}
                status={status}
                tasks={filtered.filter((t) => t.status === status)}
                profiles={profiles}
                projects={projects}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={remove}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} profiles={profiles} projects={projects} isAdmin={false} dragging />}
          </DragOverlay>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
            <DialogDescription>Fill in the task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" value={form.title} maxLength={200}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea id="t-desc" rows={3} maxLength={2000} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={form.assignee_id || "none"} onValueChange={(v) => setForm({ ...form, assignee_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="t-due">Due date</Label>
                <Input id="t-due" type="date" value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Column({
  status, tasks, profiles, projects, isAdmin, onEdit, onDelete,
}: {
  status: TaskStatus;
  tasks: Task[];
  profiles: Profile[];
  projects: Project[];
  isAdmin: boolean;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef}
      className={`rounded-xl border border-border/60 bg-card/50 p-3 min-h-[400px] transition-smooth ${
        isOver ? "ring-2 ring-primary bg-accent/40" : ""
      }`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${
            status === "todo" ? "bg-muted-foreground" :
            status === "in_progress" ? "bg-primary" : "bg-success"
          }`} />
          <h3 className="font-semibold text-sm">{STATUS_LABELS[status]}</h3>
          <Badge variant="secondary" className="text-[10px]">{tasks.length}</Badge>
        </div>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <DraggableTaskCard
            key={t.id} task={t} profiles={profiles} projects={projects}
            isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
        )}
      </div>
    </div>
  );
}

function DraggableTaskCard(props: {
  task: Task; profiles: Profile[]; projects: Project[]; isAdmin: boolean;
  onEdit: (t: Task) => void; onDelete: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.task.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      className={isDragging ? "opacity-30" : ""}>
      <TaskCard {...props} />
    </div>
  );
}

function TaskCard({
  task, profiles, projects, isAdmin, onEdit, onDelete, dragging,
}: {
  task: Task; profiles: Profile[]; projects: Project[]; isAdmin: boolean;
  onEdit?: (t: Task) => void; onDelete?: (t: Task) => void; dragging?: boolean;
}) {
  const assignee = profiles.find((p) => p.id === task.assignee_id);
  const project = projects.find((p) => p.id === task.project_id);
  const overdue = task.status !== "completed" && task.due_date && isPast(parseISO(task.due_date));
  const priorityClass = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low: "bg-primary/10 text-primary border-primary/20",
  }[task.priority];

  const initials = assignee
    ? (assignee.full_name || assignee.email || "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()
    : null;

  return (
    <Card className={`border-border/60 hover:shadow-md transition-smooth cursor-grab active:cursor-grabbing group ${
      dragging ? "shadow-lg rotate-2" : ""
    }`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
          {isAdmin && onEdit && onDelete && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-smooth">
              <Button size="icon" variant="ghost" className="h-6 w-6"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onDelete(task); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className={`text-[10px] ${priorityClass}`}>
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            {project && <Badge variant="outline" className="text-[10px]">{project.name}</Badge>}
          </div>
          {assignee && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] gradient-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
          )}
        </div>
        {task.due_date && (
          <div className={`flex items-center gap-1 text-[11px] ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
            <CalIcon className="h-3 w-3" />
            {format(parseISO(task.due_date), "MMM d, yyyy")}
            {overdue && <span className="font-medium">• Overdue</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
