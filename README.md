# shipreel-site

The landing page for **shipreel**, the free and open-source launch-video tool at
[github.com/irvinosazee/shipreel](https://github.com/irvinosazee/shipreel). It asks a visitor for
two things: run the one-line install, and star the repo. The footer links the author's GitHub,
LinkedIn, Medium and portfolio, the same accounts irvinosazee.me links to.

What's in it:

```
index.html              the page
styles.css              the launch site's stylesheet, plus the landing sections at the bottom
main.js                 hero video controls and the copy buttons
assets/hero.mp4         the 23s video shipreel made, and checked, about itself (+ poster, og.jpg)
examples/<slug>/        three example videos with their poster and site thumbnail
```

## Publishing

It is served by GitHub Pages from `main`. Pushing is the release:

```bash
git push origin main
```

## Keeping it honest

Every claim on the page is checkable against the product repo: 26 platform presets, 260 tests,
36 scripts, the verification list, the fork credit. `npm test` there fails if the README's counts
drift, and this page copies them — change both together. The install command is always the scoped
`@irvinosazee/shipreel`; the unscoped `shipreel` on npm is someone else's package.

Credits: `/brag` by Shunit Haviv Hakimi (MIT) · Hyperframes · music by Sascha Ende (CC BY 4.0) ·
SFX by Kenney (CC0).
