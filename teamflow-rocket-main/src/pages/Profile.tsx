import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(1, "Name required").max(100),
});

export default function Profile() {
  const { user, isAdmin, refreshRole } = useAuth();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setFullName(data?.full_name ?? "");
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ full_name: fullName });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refreshRole();
  };

  const initials = (fullName || user?.email || "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto animate-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account details</p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg gradient-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate">{fullName || "Unnamed"}</CardTitle>
              <CardDescription className="truncate">{user?.email}</CardDescription>
              <Badge variant={isAdmin ? "default" : "secondary"} className="mt-2 text-[10px]">
                {isAdmin ? "Admin" : "Member"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <Button onClick={save} disabled={loading}>Save changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
