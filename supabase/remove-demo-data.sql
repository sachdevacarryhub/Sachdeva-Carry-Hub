-- Removes the DEMO products created by supabase/seed.sql.
-- Categories are kept because they are the real launch categories.
-- Product images cascade automatically (demo products have none by default).
delete from public.products where slug like 'demo-%';
