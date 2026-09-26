# Portal+ — notes for contributors and AI assistants

## UI consistency (@nuvriqo/ui)

This app uses the shared Nuvriqo UI kit (`@nuvriqo/ui`). Style guide: `node_modules/@nuvriqo/ui/docs/STYLE_GUIDE.md` (UI Kit apps: `docs/UI-KIT.md`).

- No hardcoded colours in app CSS. Use `var(--nq-*)` tokens. `npm run check:ui` must pass (part of `npm test`).
- New screens use the kit's classes/components: `nq-header`, `nq-tabs`, `nq-card`, `nq-notice`, `nq-empty`, `nq-loading`, `nq-table`, `nq-btn`, `nq-field`, `nq-actionbar`, `nq-footer`.
- Every Custom UI resource calls `enableTheme(view)` from `@nuvriqo/ui/theme` at start-up.
- If a pattern is missing, add it to the `nuvriqo-ui` repo and bump the version. Don't restyle it locally.

Portal+ specifics:

- CSS and HTML are hand-written in `static/*/dist/` (tracked). `npm run build` copies `nuvriqo-ui.css` into both dist folders. Link it before the app's own stylesheets.
- The customer portal is white-label. The top bar gradient, the N logo tile and the customer accent (`--brand`) are intentional fixed colours, listed in `nuvriqo-ui.json`. Everything else uses tokens.
- The admin version pill (`#appVersion`) must match `package.json`. `release:check` enforces this.
