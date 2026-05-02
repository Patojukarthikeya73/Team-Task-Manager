import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function AppLayout() {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center gap-2 px-4 sticky top-0 bg-background/80 backdrop-blur z-10">
            <SidebarTrigger />
            <div className="flex-1" />
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs gradient-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
