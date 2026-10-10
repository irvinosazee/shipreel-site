# shipreel-site

The public sales page for **shipreel**. This repo is deliberately separate from the product: the
product repo stays private, and nothing in here is part of the tool.

What's in it:

```
index.html              the page
styles.css              the launch site's stylesheet, plus a sales section at the bottom
main.js                 hero video play/mute controls
assets/hero.mp4         the 22s video shipreel made about itself (+ poster)
examples/<slug>/        three example videos with their poster and site thumbnail
```

## Before it goes live

1. **Checkout links.** Search for `POLAR-CHECKOUT` in `index.html` — four occurrences, two distinct
   links (solo and team). Replace with the real product links.
2. **Publish.** This repo must be public for GitHub Pages on a free plan:
   ```bash
   gh repo create shipreel-site --public --source . --push
   gh api -X POST repos/<you>/shipreel-site/pages -f "source[branch]=main" -f "source[path]=/"
   ```
3. **Custom domain (optional).** Add a `CNAME` file containing the domain, point a DNS `CNAME` at
   `<you>.github.io`, and set it in Settings → Pages.

Note: project pages serve under your user site's custom domain if one is configured. If
`<you>.github.io` has a custom domain set that points elsewhere, clear it or this page won't
resolve.

## Keeping it honest

Every claim on the page is checkable against the product repo: 26 platform presets, 234 tests, the
verification list, the fork credit. If the product changes, change the page — a sales page that
drifts from the thing it sells is how refunds start.

Credits: `/brag` by Shunit Haviv Hakimi (MIT) · Hyperframes · music by Sascha Ende (CC BY 4.0) ·
SFX by Kenney (CC0).
