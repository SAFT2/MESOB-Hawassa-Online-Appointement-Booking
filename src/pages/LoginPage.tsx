import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  national_id: z.string().trim().max(40).optional().or(z.literal("")),
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.8 2.4 2.7 6.5 2.7 11.7s4.1 9.3 9.3 9.3c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.7H12z"
      />
    </svg>
  );
}

/** After sign-in, check the user's role and redirect accordingly. */
async function getPostLoginDestination(userId: string): Promise<string> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role as string);
  if (roles.includes("admin") || roles.includes("agent")) {
    return "/admin/dashboard";
  }
  return "/";
}

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sign-in fields
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // sign-up fields
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suNid, setSuNid] = useState("");

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = signInSchema.safeParse({ email: siEmail, password: siPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      // Get the session to know the user id immediately
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      const dest = uid ? await getPostLoginDestination(uid) : "/";
      toast.success("Welcome back");
      navigate({ to: dest });
    } catch (err: any) {
      setError(err?.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = signUpSchema.safeParse({
      full_name: suName,
      email: suEmail,
      password: suPassword,
      phone: suPhone,
      national_id: suNid,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await signUp({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        password: parsed.data.password,
        phone: parsed.data.phone || undefined,
        national_id: parsed.data.national_id || undefined,
      });
      toast.success("Account created — you're signed in");
      // New signups are always citizens — go to home
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message || "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      // OAuth redirect handles navigation automatically
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-4 py-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MESOB Hawassa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in or create your account to book appointments.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as any);
              setError(null);
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            {/* Sign in */}
            <TabsContent value="signin" className="mt-4">
              <form onSubmit={onSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input
                    id="si-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="si-password">Password</Label>
                  <Input
                    id="si-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={siPassword}
                    onChange={(e) => setSiPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {error && tab === "signin" && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            {/* Sign up */}
            <TabsContent value="signup" className="mt-4">
              <form onSubmit={onSignUp} className="space-y-3">
                <div>
                  <Label htmlFor="su-name">Full name</Label>
                  <Input
                    id="su-name"
                    required
                    value={suName}
                    onChange={(e) => setSuName(e.target.value)}
                    className="mt-1"
                    placeholder="e.g. Abebe Bekele"
                  />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input
                    id="su-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="su-password">Password</Label>
                  <Input
                    id="su-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={suPassword}
                    onChange={(e) => setSuPassword(e.target.value)}
                    className="mt-1"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="su-phone">Phone</Label>
                    <Input
                      id="su-phone"
                      value={suPhone}
                      onChange={(e) => setSuPhone(e.target.value)}
                      className="mt-1"
                      placeholder="+251 9XX…"
                    />
                  </div>
                  <div>
                    <Label htmlFor="su-nid">National ID</Label>
                    <Input
                      id="su-nid"
                      value={suNid}
                      onChange={(e) => setSuNid(e.target.value)}
                      className="mt-1"
                      placeholder="FAN"
                    />
                  </div>
                </div>
                {error && tab === "signup" && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={onGoogle}
          >
            <GoogleIcon />
            <span className="ml-2">Continue with Google</span>
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Staff and administrators sign in here too — you'll be redirected to
          your console automatically.
        </p>
      </main>
    </div>
  );
}
