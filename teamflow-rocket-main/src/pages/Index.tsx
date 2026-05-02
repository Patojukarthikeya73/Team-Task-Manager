import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CheckSquare, Users, Kanban, BarChart3, ArrowRight, ShieldCheck } from "lucide-react";

export default function Index() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate("/dashboard", { replace: true });
  }, [session, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden gradient-subtle">
      <div className="absolute inset-0 gradient-glow pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
            <CheckSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">TaskFlow</span>
        </div>
        <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
      </header>

      <main className="relative z-10 px-6 lg:px-12 pt-12 pb-24 max-w-6xl mx-auto">
        <section className="text-center max-w-3xl mx-auto animate-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/50 backdrop-blur text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Built for modern teams
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            The team task manager <br />
            <span className="text-gradient">your team will love</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
            Plan projects, assign tasks, and ship work — all in one beautiful, lightning-fast workspace.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button asChild size="lg" className="gap-2 shadow-glow">
              <Link to="/auth">Get started <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20">
          {[
            { icon: Kanban, title: "Kanban boards", desc: "Drag-and-drop tasks across columns." },
            { icon: Users, title: "Team roles", desc: "Admin and Member access control." },
            { icon: BarChart3, title: "Live dashboard", desc: "Productivity charts & activity." },
            { icon: ShieldCheck, title: "Secure by default", desc: "Row-level security on every record." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-5 hover:shadow-md transition-smooth">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
