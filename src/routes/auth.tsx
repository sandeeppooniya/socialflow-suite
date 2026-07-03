import { createFileRoute, Link, redirect, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

type Search = { redirect?: string; mode?: "signin" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    mode: s.mode === "signup" ? "signup" : "signin",
  }),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: search.redirect && search.redirect.startsWith("/") ? (search.redirect as "/app") : "/app" });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.mode) setMode(search.mode);
  }, [search.mode]);

  const goAfterAuth = () => {
    const dest = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/app";
    navigate({ to: dest as "/app" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        goAfterAuth();
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Password reset email sent.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      goAfterAuth();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[image:var(--gradient-hero)] relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold">SocialFlow</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight">Plan, schedule, and grow — from one calm workspace.</h2>
          <p className="mt-4 text-muted-foreground">Bring your team, your channels, and your calendar together. Zero context switching.</p>
        </div>
        <p className="text-xs text-muted-foreground relative z-10">© {new Date().getFullYear()} SocialFlow</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold">SocialFlow</span>
            </Link>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup" ? "Start scheduling in minutes." : mode === "forgot" ? "We'll email you a link." : "Sign in to your workspace."}
          </p>

          {mode !== "forgot" && (
            <>
              <button
                onClick={onGoogle}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition disabled:opacity-50"
              >
                <GoogleIcon /> Continue with Google
              </button>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>or with email</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Full name">
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Jane Doe" />
              </Field>
            )}
            <Field label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@company.com" />
            </Field>
            {mode !== "forgot" && (
              <Field label="Password" trailing={
                mode === "signin" && (
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">Forgot?</button>
                )
              }>
                <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
              </Field>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            {mode === "signup" ? (
              <>Already have an account? <button className="text-primary hover:underline" onClick={() => setMode("signin")}>Sign in</button></>
            ) : mode === "signin" ? (
              <>New to SocialFlow? <button className="text-primary hover:underline" onClick={() => setMode("signup")}>Create account</button></>
            ) : (
              <><button className="text-primary hover:underline" onClick={() => setMode("signin")}>Back to sign in</button></>
            )}
          </p>
        </div>
      </div>

      <style>{`.input{width:100%;border:1px solid var(--color-input);background:var(--color-background);color:var(--color-foreground);border-radius:0.75rem;padding:0.625rem 0.75rem;font-size:0.875rem;outline:none;transition:border-color .15s, box-shadow .15s}.input:focus{border-color:var(--color-ring);box-shadow:0 0 0 3px color-mix(in oklab,var(--color-ring) 25%,transparent)}`}</style>
    </div>
  );
}

function Field({ label, trailing, children }: { label: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-foreground/80">
        <span>{label}</span>
        {trailing}
      </span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.12A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.96l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
