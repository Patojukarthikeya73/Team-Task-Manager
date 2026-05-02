import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Task } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, isPast, parseISO } from "date-fns";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tasks").select("*").order("updated_at", { ascending: false });
      setTasks((data ?? []) as Task[]);
      setLoading(false);
    })();
  }, []);

  const myTasks = isAdmin ? tasks : tasks.filter((t) => t.assignee_id === user?.id);
  const completed = myTasks.filter((t) => t.status === "completed").length;
  const pending = myTasks.filter((t) => t.status !== "completed").length;
  const overdue = myTasks.filter(
    (t) => t.status !== "completed" && t.due_date && isPast(parseISO(t.due_date))
  ).length;

  const chartData = [
    { name: "To Do", value: myTasks.filter((t) => t.status === "todo").length },
    { name: "In Progress", value: myTasks.filter((t) => t.status === "in_progress").length },
    { name: "Completed", value: completed },
  ];

  const recent = myTasks.slice(0, 5);

  const stats = [
    { label: "Total tasks", value: myTasks.length, icon: ListTodo, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Pending", value: pending, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Overdue", value: overdue, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "Overview of all tasks across the team" : "Your tasks at a glance"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60 hover:shadow-md transition-smooth">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">{s.value}</p>
                  )}
                </div>
                <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">Productivity</CardTitle>
            </div>
            <CardDescription>Distribution of tasks by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Recent activity</CardTitle>
            <CardDescription>Latest task updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!loading && recent.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No tasks yet</p>
            )}
            {recent.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-smooth">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(t.updated_at), "MMM d, h:mm a")}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {t.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
