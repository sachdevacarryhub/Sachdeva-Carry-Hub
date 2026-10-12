#!/usr/bin/env node
/**
 * Creates (or promotes) an administrator for the Sachdeva Carry Hub admin panel.
 *
 * Usage:
 *   npm run admin:create -- owner@example.com 'a-strong-password'
 *
 * - Creates the auth user (email pre-confirmed) if it does not exist.
 * - Adds the user to public.admin_users.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * The service role key is only used by this local script and is never sent to
 * the browser.
 */
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!url || !serviceKey) {
  fail("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail("Usage: npm run admin:create -- <email> <password>");
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(target) {
  for (let page = 1; page < 50; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`Could not list users: ${error.message}`);
    const match = data.users.find((user) => user.email?.toLowerCase() === target.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

let user = await findUserByEmail(email);

if (!user) {
  if (!password || password.length < 10) {
    fail("The user does not exist yet. Provide a password with at least 10 characters.");
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) fail(`Could not create user: ${error.message}`);
  user = data.user;
  console.log(`✔ Created auth user ${email}`);
} else {
  console.log(`• User ${email} already exists`);
}

const { error: adminError } = await supabase
  .from("admin_users")
  .upsert({ user_id: user.id }, { onConflict: "user_id" });
if (adminError)
  fail(`Could not grant admin access: ${adminError.message}. Did you run the migration?`);

console.log(`✔ ${email} is now an administrator. Sign in at /admin/login\n`);
