"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/supabase/browser";

interface LoginFormProps {
  next: string;
  notice: string | null;
  disabled?: boolean;
  signedInNonAdmin?: boolean;
}

export function LoginForm({ next, notice, disabled, signedInNonAdmin }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    setPending(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setPending(false);
      setError(
        signInError.status === 429
          ? "Too many attempts. Please wait a minute and try again."
          : "Incorrect email or password.",
      );
      return;
    }

    // Signing in is not enough: confirm this user is an administrator.
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
    if (adminError || isAdmin !== true) {
      await supabase.auth.signOut();
      setPending(false);
      setError("This account does not have admin access.");
      return;
    }

    router.replace(next);
    router.refresh();
  }

  async function switchAccount() {
    await getBrowserSupabase()?.auth.signOut();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      {notice && (
        <div
          role="status"
          className="flex gap-3 rounded-xl border border-gold/40 bg-gold-soft/60 p-4 text-sm text-ink"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-deep" />
          <div>
            <p>{notice}</p>
            {signedInNonAdmin && (
              <button
                type="button"
                onClick={switchAccount}
                className="mt-2 font-medium underline underline-offset-4"
              >
                Sign out and use another account
              </button>
            )}
          </div>
        </div>
      )}

      <Field label="Email" required>
        {(props) => (
          <TextInput
            {...props}
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={disabled || pending}
          />
        )}
      </Field>
      <Field label="Password" required>
        {(props) => (
          <TextInput
            {...props}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={disabled || pending}
          />
        )}
      </Field>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-danger/8 px-3 py-2.5 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={disabled || pending || !email || !password}
      >
        {pending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
