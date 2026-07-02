import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2, ArrowLeft, ShieldCheck, AlertCircle, Check, X, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  national_id: z.string().trim().max(40).optional().or(z.literal("")),
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.8 2.4 2.7 6.5 2.7 11.7s4.1 9.3 9.3 9.3c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.7H12z"
      />
    </svg>
  );
}

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
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const redirectTo = search?.redirect || null;
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password visibility controls
  const [showSiPassword, setShowSiPassword] = useState(false);
  const [showSuPassword, setShowSuPassword] = useState(false);

  // Sign-in fields
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // Sign-up fields
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirmPassword, setSuConfirmPassword] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suNid, setSuNid] = useState("");

  // Live Password Strengths
  const hasMinLength = suPassword.length >= 8;
  const hasNumber = /\d/.test(suPassword);
  const hasMatch = suPassword === suConfirmPassword && suConfirmPassword.length > 0;

  // Smart Phone Formatting for Ethiopia (+251)
  const handlePhoneChange = (value: string) => {
    // Strip non-numeric values except the leading plus
    let cleaned = value.replace(/[^\d+]/g, "");
    
    // Automatically force country code if user starts typing local 09/07 numbers
    if (cleaned.startsWith("0")) {
      cleaned = "+251" + cleaned.substring(1);
    } else if (cleaned.length > 0 && !cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }
    setSuPhone(cleaned);
  };

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
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      const dest = redirectTo ?? (uid ? await getPostLoginDestination(uid) : "/");
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

    if (suPassword !== suConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

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
      toast.success("Account created successfully");
      navigate({ to: redirectTo ?? "/" });
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
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-muted/20">
      {/* Left Column: Premium Branding Sidebar */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-primary-foreground/10 z-0" />
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
        <div className="relative z-10 max-w-md space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">MESOB Hawassa</h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            Your gateway to securing reliable, quick, and verified digital appointments. Manage your bookings effortlessly from one central console.
          </p>
        </div>
        <div className="relative z-10 text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} MESOB Hawassa. All rights reserved.
        </div>
      </div>

      {/* Right Column: Focus Form UI */}
      <div className="flex flex-col justify-between p-4 sm:p-8 md:p-12 lg:p-16">
        <div className="flex lg:hidden justify-start mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md my-auto space-y-6">
          <div className="text-center lg:text-left space-y-1.5">
            <div className="lg:hidden mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              {tab === "signin" ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tab === "signin" 
                ? "Sign in to access your dashboard and appointments." 
                : "Fill out the fields below to schedule your sessions."}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-muted/50 backdrop-blur-sm">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as any);
                setError(null);
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 rounded-xl">
                <TabsTrigger value="signin" className="rounded-lg transition-all">Sign in</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg transition-all">Create account</TabsTrigger>
              </TabsList>

              {/* Sign In Form */}
              <TabsContent value="signin" className="mt-5 space-y-4 outline-none">
                <form onSubmit={onSignIn} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="si-email">Email Address</Label>
                    <Input
                      id="si-email"
                      type="email"
                      autoComplete="username"
                      required
                      placeholder="name@example.com"
                      value={siEmail}
                      onChange={(e) => setSiEmail(e.target.value)}
                      className="bg-muted/30 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="si-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="si-password"
                        type={showSiPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        value={siPassword}
                        onChange={(e) => setSiPassword(e.target.value)}
                        className="bg-muted/30 focus-visible:ring-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSiPassword(!showSiPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSiPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && tab === "signin" && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive animate-in fade-in-50 duration-200">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full font-medium h-10 shadow-sm" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in to Account
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup" className="mt-5 space-y-4 outline-none">
                <form onSubmit={onSignUp} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label htmlFor="su-name">Full Name</Label>
                    <Input
                      id="su-name"
                      required
                      autoComplete="name"
                      placeholder="Abebe Bekele"
                      value={suName}
                      onChange={(e) => setSuName(e.target.value)}
                      className="bg-muted/30 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="su-email">Email Address</Label>
                    <Input
                      id="su-email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@example.com"
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      className="bg-muted/30 focus-visible:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="su-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="su-password"
                        type={showSuPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        placeholder="Choose a strong password"
                        value={suPassword}
                        onChange={(e) => setSuPassword(e.target.value)}
                        className="bg-muted/30 focus-visible:ring-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSuPassword(!showSuPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSuPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="su-confirm-password">Confirm Password</Label>
                    <Input
                      id="su-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="Repeat password"
                      value={suConfirmPassword}
                      onChange={(e) => setSuConfirmPassword(e.target.value)}
                      className="bg-muted/30 focus-visible:ring-primary"
                    />
                  </div>

                  {suPassword.length > 0 && (
                    <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs border animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-2">
                        {hasMinLength ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-muted-foreground/60" />}
                        <span className={hasMinLength ? "text-foreground font-medium" : "text-muted-foreground"}>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasNumber ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-muted-foreground/60" />}
                        <span className={hasNumber ? "text-foreground font-medium" : "text-muted-foreground"}>Contains at least one number</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasMatch ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-muted-foreground/60" />}
                        <span className={hasMatch ? "text-foreground font-medium" : "text-muted-foreground"}>Passwords match correctly</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="su-phone">Phone Number</Label>
                      <Input
                        id="su-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+251 9XX…"
                        value={suPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="bg-muted/30 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="su-nid">National ID</Label>
                      <Input
                        id="su-nid"
                        placeholder="ID number"
                        value={suNid}
                        onChange={(e) => setSuNid(e.target.value)}
                        className="bg-muted/30 focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  {error && tab === "signup" && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full font-medium h-10 mt-2 shadow-sm" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground/70">
              <div className="h-px flex-1 bg-border" />
              <span>or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-background hover:bg-muted/40 font-medium h-10 transition-colors"
              disabled={loading}
              onClick={onGoogle}
            >
              <GoogleIcon />
              <span className="ml-2">Google</span>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 max-w-sm mx-auto px-4">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-4 hover:text-foreground transition-colors">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</Link>.
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground/50 mt-8 lg:hidden">
          &copy; {new Date().getFullYear()} MESOB Hawassa.
        </div>
      </div>
    </div>
  );
}