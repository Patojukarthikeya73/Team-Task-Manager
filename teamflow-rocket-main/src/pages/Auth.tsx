import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, CheckSquare } from "lucide-react";

const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(100),
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(100),
});

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({ fullName: "", email: "", password: "" });
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(signInForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/dashboard");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(signUpForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Check your email to verify.");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 gradient-subtle">
      <div className="absolute inset-0 gradient-glow pointer-events-none" />
      <div className="relative w-full max-w-md animate-in-up">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <CheckSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TaskFlow</h1>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>Sign in or create an account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">Email</Label>
                    <Input id="si-email" type="email" autoComplete="email" required
                      value={signInForm.email}
                      onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-password">Password</Label>
                    <Input id="si-password" type="password" autoComplete="current-password" required
                      value={signInForm.password}
                      onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Full name</Label>
                    <Input id="su-name" required maxLength={100}
                      value={signUpForm.fullName}
                      onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" type="email" autoComplete="email" required
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" type="password" autoComplete="new-password" required minLength={6}
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })} />
                    <p className="text-xs text-muted-foreground">First account created becomes the admin.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground transition-smooth">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
