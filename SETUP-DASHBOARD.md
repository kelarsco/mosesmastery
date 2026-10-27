# Analytics dashboard setup (about 10 minutes, free)

1. Create a free project at supabase.com.
2. SQL Editor: paste and run `supabase/schema.sql` (change the admin email at the top first).
3. Authentication > Providers > Email: keep "Confirm email" ON.
4. Settings > API: copy Project URL and the `anon` public key into `js/config.js`.
5. Commit and push. Sign up at /account.html with the admin email, confirm it, then open /admin.html.

Notes
- Anyone can sign up, but only emails in the `admins` table can see /admin.html or the data (enforced by row-level security, not by hiding the page).
- Tracking is anonymous: no cookies, no IP stored, Do Not Track is honored. Mention it in a privacy policy.
- Delete/restore in the dashboard is soft delete (`deleted_at`) with undo/redo and a log.
- Preview without Supabase: /admin.html?demo=1 shows sample data.

## Projects manager (Dashboard > Projects)
Run the whole of `supabase/schema.sql` again (section 4 is new, safe to re-run). Then open the dashboard > Projects > **Import the current projects** once. From then on the "All projects" grid on your site is driven from there: add, edit, hide, reorder, delete (with undo/redo), and upload images or MP4s (up to 50 MB each).
- If the database is unreachable or you haven't imported, the site keeps showing the built-in list, so it never goes blank.
- Not managed from here yet: the home-page store gallery, blog articles, and page text.
