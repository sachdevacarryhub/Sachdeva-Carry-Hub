"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError(updateError.message || "Could not update the password.");
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Password updated");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-sm space-y-4">
      <Field label="New password" hint="At least 10 characters.">
        {(props) => (
          <TextInput
            {...props}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
      </Field>
      <Field label="Confirm new password" error={error ?? undefined}>
        {(props) => (
          <TextInput
            {...props}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        )}
      </Field>
      <Button type="submit" size="sm" disabled={pending || !password || !confirm}>
        {pending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
        Update password
      </Button>
    </form>
  );
}
