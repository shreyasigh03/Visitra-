# VISITRA — UI Redesign Handoff

Drop-in replacements for your existing React + Vite project. **No functionality, APIs, routing, state, or file names were changed** — only markup/classNames and one new stylesheet.

## Files

```
src/
  index.css                        ← REPLACE (new design tokens + utility classes)
  Components/
    Navbar.jsx                     ← REPLACE (adds dark-mode toggle)
    Landingpg.jsx                  ← REPLACE (clay hero, no background photo)
    Feature.jsx                    ← REPLACE
    Howitworks.jsx                 ← REPLACE
    VisitorRegsiterationPg.jsx     ← REPLACE
    Otpverification.jsx            ← REPLACE
    verify.jsx                     ← REPLACE (unused draft — restyled as-is)
    AdminLogin.jsx                 ← REPLACE
    Admindashboard.jsx             ← REPLACE
    Adminnavbar.jsx                ← REPLACE (adds dark-mode toggle)
    Adminprofile.jsx               ← REPLACE
    Adminentry.jsx                 ← REPLACE
    Facerecognition.jsx            ← REPLACE
```

Copy each file over its counterpart in `src/`. Nothing else needs to change
(`App.jsx`, `config.js`, backend, `package.json` all stay as-is).

## Design system

- Palette: indigo accent (#5457D6), mist background, ink text — all exposed as
  CSS variables in `index.css` (`--accent`, `--bg`, `--ink`, `--ok-bg`, …).
- Typography: Sora (display) + Manrope (body), loaded via Google Fonts in `index.css`.
- Claymorphism: `.clay` / `.clay-sm` card classes (soft outer + inset shadows);
  `.glass` for the frosted navbars; `.tile` for small info tiles.
- Reusable utilities: `.btn-primary`, `.btn-soft`, `.input-clay`, `.nav-link`,
  `.th-clay` / `.td-clay` for tables.
- Dark mode: toggle in both navbars adds `.dark` on `<html>` and persists to
  `localStorage("visitra-theme")`. All tokens re-map automatically.

## Notes

- `index.css` keeps your legacy variables (`--bg-color`, `--hover-color`,
  `--primary-color`) mapped to the new palette, so any component I didn't touch
  still renders in-theme.
- Tailwind v4 dark variant is declared via `@custom-variant dark` — no
  `tailwind.config` change needed.
- `verify.jsx` was a non-wired draft (missing imports); restyled without fixing
  its logic, per "keep logic exactly the same".
