import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ArrowLeft, Mail, Lock, User, Phone, IdCard } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import authBackground from "@/assets/background2.png";
import logo from "@/assets/logo.jpg";

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
    <div
      className="relative flex min-h-screen flex-col"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(4,8,24,0.95) 0%, rgba(10,16,38,0.72) 16%, rgba(10,16,38,0.5) 40%, rgba(8,13,30,0.85) 100%), url(${authBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* ambient accent glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-blue-500/20 blur-3xl" />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 pt-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-14 pt-4">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 h-[72px] w-[72px] overflow-hidden rounded-full shadow-lg shadow-black/50 ring-1 ring-white/10">
            <img
              src={logo}
              alt="MESOB Hawassa"
              className="h-full w-full scale-[1.18] object-cover"
            />
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-white drop-shadow-sm">
            MESOB Hawassa
          </h1>
          <p className="mt-1.5 text-sm text-white/75">
            Sign in or create your account to book appointments.
          </p>
        </div>

        <div className="relative rounded-2xl border border-blue-400/15 bg-slate-900/45 p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-2xl before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as any);
              setError(null);
            }}
          >
            <TabsList className="grid w-full grid-cols-2 bg-black/25 p-1">
              <TabsTrigger
                value="signin"
                className="text-white/70 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                Sign in
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="text-white/70 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                Create account
              </TabsTrigger>
            </TabsList>

            {/* Sign in */}
            <TabsContent value="signin" className="mt-5">
              <form onSubmit={onSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="si-email" className="text-white/85">
                    Email
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="si-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={siEmail}
                      onChange={(e) => setSiEmail(e.target.value)}
                      className="border-white/10 bg-white/95 pl-9 placeholder:text-slate-400 focus-visible:ring-blue-400/50"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="si-password" className="text-white/85">
                    Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="si-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={siPassword}
                      onChange={(e) => setSiPassword(e.target.value)}
                      className="border-white/10 bg-white/95 pl-9 placeholder:text-slate-400 focus-visible:ring-blue-400/50"
                    />
                  </div>
                </div>
                {error && tab === "signin" && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-b from-accent to-accent/85 text-accent-foreground shadow-lg shadow-accent/25 transition-transform hover:from-accent/95 hover:to-accent/80 hover:shadow-accent/35 active:scale-[0.99]"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            {/* Sign up */}
            <TabsContent value="signup" className="mt-5">
              <form onSubmit={onSignUp} className="space-y-3.5">
                <div>
                  <Label htmlFor="su-name" className="text-white/85">
                    Full name
                  </Label>
                  <div className="relative mt-1.5">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="su-name"
                      required
                      value={suName}
                      onChange={(e) => setSuName(e.target.value)}
                      className="border-white/10 bg-white/95 pl-9 placeholder:text-slate-400 focus-visible:ring-blue-400/50"
                      placeholder="e.g. Abebe Bekele"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="su-email" className="text-white/85">
                    Email
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="su-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      className="border-white/10 bg-white/95 pl-9 placeholder:text-slate-400 focus-visible:ring-blue-400/50"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="su-password" className="text-white/85">
                    Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="su-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={suPassword}
                      onChange={(e) => setSuPassword(e.target.value)}
                      className="border-white/10 bg-white/95 pl-9 placeholder:text-slate-400 focus-visible:ring-blue-400/50"
                      placeholder="At least 8 characters"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="su-phone" className="text-white/85">
                      Phone
                    </Label>
                    <div className="relative mt-1.5">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="su-phone"
                        value={suPhone}
                        onChange={(e) => setSuPhone(e.target.value)}
                        className="border-white/10 bg-white/95 pl-9 placeholder:text-slate-400 focus-visible:ring-blue-400/50"
                        placeholder="+251 9XX…"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="su-nid" className="text-white/85">
                      National ID
                    </Label>
                    <div className="relative mt-1.5">
                      <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="su-nid"
                        value={suNid}
                        onChange={(e) => setSuNid(e.target.value)}
                        className="border-white/10 bg-white/95 pl-9 placeholder:text-slate-400 focus-visible:ring-blue-400/50"
                        placeholder="FAN"
                      />
                    </div>
                  </div>
                </div>
                {error && tab === "signup" && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-b from-accent to-accent/85 text-accent-foreground shadow-lg shadow-accent/25 transition-transform hover:from-accent/95 hover:to-accent/80 hover:shadow-accent/35 active:scale-[0.99]"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-white/40">
            <div className="h-px flex-1 bg-white/10" />
            or
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            disabled={loading}
            onClick={onGoogle}
          >
            <GoogleIcon />
            <span className="ml-2">Continue with Google</span>
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          Staff and administrators sign in here too — you'll be redirected to
          your console automatically.
        </p>
      </main>
    </div>
  );
}