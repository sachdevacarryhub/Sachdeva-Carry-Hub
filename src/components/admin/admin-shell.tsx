"use client";

import { ExternalLink, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AdminNav } from "./admin-nav";
import { SignOutButton } from "./sign-out-button";

function SidebarContent({
  email,
  storeName,
  onNavigate,
}: {
  email: string | null;
  storeName: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 px-3 pt-1 pb-8">
        <Image src="/brand/logo-mark.png" alt="" width={512} height={439} className="h-8 w-auto" />
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-wide text-white">{storeName}</span>
          <span className="block text-[11px] tracking-wide text-gold">Showroom Admin</span>
        </span>
      </Link>
      <AdminNav onNavigate={onNavigate} />
      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink aria-hidden className="size-[18px]" strokeWidth={1.75} />
          View website
        </a>
        <SignOutButton />
        {email && <p className="truncate px-3 pt-3 text-xs text-white/40">{email}</p>}
      </div>
    </div>
  );
}

export function AdminShell({
  email,
  storeName,
  children,
}: {
  email: string | null;
  storeName: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <div className="min-h-dvh bg-[#f4f2ed] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh bg-ink px-4 py-6 lg:block">
        <SidebarContent email={email} storeName={storeName} />
      </aside>

      {/* Mobile header + drawer */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/brand/logo-mark-dark.png"
            alt=""
            width={512}
            height={439}
            className="h-7 w-auto"
          />
          <span className="text-sm font-semibold text-ink">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-lg text-ink hover:bg-ink/5"
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </header>

      <dialog
        ref={drawerRef}
        aria-label="Admin navigation"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === drawerRef.current) setOpen(false);
        }}
        className="m-0 h-dvh max-h-dvh w-[280px] max-w-[85vw] bg-ink p-0 backdrop:bg-ink/50 lg:hidden"
      >
        <div className="relative h-full px-4 py-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="absolute top-5 right-3 flex size-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
          >
            <X aria-hidden className="size-5" />
          </button>
          <SidebarContent email={email} storeName={storeName} onNavigate={() => setOpen(false)} />
        </div>
      </dialog>

      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
