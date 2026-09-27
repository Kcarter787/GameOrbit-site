# GameOrbit website

Public GitHub Pages site for GameOrbit, served from the root of `main` at https://kcarter787.github.io/GameOrbit-site/. This repository is the only copy of the site. The iOS app and its backend live in a separate private repository.

This is Kevin Carter's personal project.

## Keep out of this repository

This repository and everything in it is public.

- No app source, build output, credentials, keys or account identifiers.
- No invite or friend-code rules. `invite.js` only shows a six-character code and opens the app; the app and server decide whether a code is valid. Don't add code formats, special codes, reward logic or tests of them here.
- No real players' names, handles, codes or notes, including in screenshots.

## Copy

- Every product claim must match what the current app does. Describe shipped behavior, not plans.
- The privacy policy and support answers must match the app's actual data handling. Check with Kevin before changing either.
- Plain, specific language. Don't add disclaimers, data-source or provider labels, or implementation details unless Kevin asks.
- Keep exact prices and membership limits out of the homepage.

## Design

- Dark only, matching the app. Colors come from the app's asset catalog; tokens are at the top of `styles.css`.
- Type is the system stack (SF on Apple devices, the app's typeface).
- Show only GameOrbit's own art: no third-party cover art, debug captions or sample data in images.
- Small text needs at least 4.5:1 contrast. Motion stops under Reduce Motion, off screen and in background tabs.

## Stable URLs

App Store Connect points at `index.html`, `support.html` and `privacy.html`, and the app generates links to `invite.html`. Don't rename or move these files.

## Checks

Before publishing, open every page at phone and desktop widths, confirm no console errors or broken links and assets, and check the invite page with a `?code=` link over HTTP.
