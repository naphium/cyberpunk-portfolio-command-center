<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Secret interactions are isolated in the portfolio EasterEggs module; physics loads only on activation and restores DOM styles on reset or unmount. Why: keep normal navigation lightweight and reversible.

- All portfolio content, settings and theme live in one JSON row (`site_content`, id `main`); always read it through `mergeData()` in `src/lib/content.ts` so older documents stay compatible. Why: single source of truth with backwards-compatible schema growth.
- Admin auth is a shared password (`ADMIN_PASSWORD`) checked in server functions; success returns an HMAC token (`ADMIN_SESSION_SECRET`) the client sends with every admin call — not cookies. Why: the editor preview runs in a cross-site iframe where third-party cookies are blocked.
- Content writes and media uploads go only through server functions in `src/lib/content.functions.ts` using the admin client after token verification; the table has public read-only RLS. Why: visitors must never be able to write content.
- Media lives in a private `media` bucket served via long-lived signed URLs. Why: workspace policy blocks public buckets.
- Guestbook entries are a separate table with anon insert (length-checked by RLS) and admin-only delete via server function. Why: visitor writes stay isolated from the content document.
- Live CMS preview is the public `/` route in an iframe with `?preview=1`, fed drafts via same-origin `postMessage`. Why: isolates global hotkeys/effects from the editor.
- Runtime theme colors are injected as CSS variables by `ThemeStyle`; components use only semantic tokens/utilities from `src/styles.css`.
- Vercel builds (VERCEL env set) switch nitro to the `vercel` preset in vite.config.ts; Lovable builds ignore it. Why: owner also hosts on Vercel.
