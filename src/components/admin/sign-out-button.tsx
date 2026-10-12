"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const supabase = getBrowserSupabase();
    const { error } = supabase ? await supabase.auth.signOut() : { error: null };
    if (error) {
      setPending(false);
      toast.error("Could not sign out. Please try again.");
      return;
    }
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60",
        className,
      )}
    >
      {pending ? (
        <LoaderCircle aria-hidden className="size-[18px] animate-spin" />
      ) : (
        <LogOut aria-hidden className="size-[18px]" strokeWidth={1.75} />
      )}
      Sign out
    </button>
  );
}
