import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Project, Profile } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban, Users, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  description: z.string().trim().max(1000).optional(),
});

interface ProjectWithStats extends Project {
  taskCount: number;
  completedCount: number;
  memberCount: number;
}

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [memberDialog, setMemberDialog] = useState<Project | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const [{ data: projectsData }, { data: tasksData }, { data: membersData }, { data: profilesData }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("project_id, status"),
      supabase.from("project_members").select("project_id, user_id"),
      supabase.from("profiles").select("*"),
    ]);

    const tasks = tasksData ?? [];
    const members = membersData ?? [];

    const enriched: ProjectWithStats[] = (projectsData ?? []).map((p) => {
      const projectTasks = tasks.filter((t) => t.project_id === p.id);
      return {
        ...(p as Project),
        taskCount: projectTasks.length,
        completedCount: projectTasks.filter((t) => t.status === "completed").length,
        memberCount: members.filter((m) => m.project_id === p.id).length,
      };
    });

    setProjects(enriched);
    setProfiles((profilesData ?? []) as Profile[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "" });
    setDialogOpen(true);
  };

  const submit = async () => {
    const parsed = projectSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const payload = {
      name: parsed.data.name,
      description: parsed.data.description || null,
    };
    if (editing) {
      const { error } = await supabase.from("projects").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Project updated");
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("projects").insert({ ...payload, owner_id: user?.id });
      if (error) return toast.error(error.message);
      toast.success("Project created");
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (p: Project) => {
    if (!confirm(`Delete project "${p.name}"? This will delete all its tasks.`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Project deleted");
    load();
  };

  const openMembers = async (p: Project) => {
    setMemberDialog(p);
    const { data } = await supabase.from("project_members").select("user_id").eq("project_id", p.id);
    setSelectedMembers(new Set((data ?? []).map((m) => m.user_id)));
  };

  const toggleMember = (userId: string) => {
    const next = new Set(selectedMembers);
    next.has(userId) ? next.delete(userId) : next.add(userId);
    setSelectedMembers(next);
  };

  const saveMembers = async () => {
    if (!memberDialog) return;
    const { data: existing } = await supabase
      .from("project_members").select("user_id").eq("project_id", memberDialog.id);
    const existingIds = new Set((existing ?? []).map((m) => m.user_id));

    const toAdd = [...selectedMembers].filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !selectedMembers.has(id));

    if (toAdd.length) {
      const { error } = await supabase.from("project_members").insert(
        toAdd.map((user_id) => ({ project_id: memberDialog.id, user_id }))
      );
      if (error) return toast.error(error.message);
    }
    if (toRemove.length) {
      const { error } = await supabase
        .from("project_members").delete().eq("project_id", memberDialog.id).in("user_id", toRemove);
      if (error) return toast.error(error.message);
    }

    toast.success("Members updated");
    setMemberDialog(null);
    load();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Manage all team projects" : "Projects you belong to"}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
                <DialogDescription>
                  {editing ? "Update the project details" : "Create a new project for your team"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="p-name">Name</Label>
                  <Input id="p-name" value={form.name} maxLength={100}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-desc">Description</Label>
                  <Textarea id="p-desc" rows={4} maxLength={1000} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={submit}>{editing ? "Save" : "Create"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isAdmin ? "No projects yet — create your first one" : "You don't belong to any projects yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const progress = p.taskCount > 0 ? (p.completedCount / p.taskCount) * 100 : 0;
            return (
              <Card key={p.id} className="border-border/60 hover:shadow-md transition-smooth group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/tasks?project=${p.id}`} className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate hover:text-primary transition-smooth">{p.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {p.description || "No description"}
                      </CardDescription>
                    </Link>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{p.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{p.completedCount}/{p.taskCount} tasks</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {p.memberCount} member{p.memberCount === 1 ? "" : "s"}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openMembers(p)}>
                          <Users className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!memberDialog} onOpenChange={(o) => !o && setMemberDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage members</DialogTitle>
            <DialogDescription>
              Select team members for {memberDialog?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-auto">
            {profiles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No team members yet</p>
            )}
            {profiles.map((p) => {
              const initials = (p.full_name || p.email || "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
              return (
                <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-smooth">
                  <Checkbox
                    checked={selectedMembers.has(p.id)}
                    onCheckedChange={() => toggleMember(p.id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs gradient-primary text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                  </div>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMemberDialog(null)}>Cancel</Button>
            <Button onClick={saveMembers}>Save members</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
