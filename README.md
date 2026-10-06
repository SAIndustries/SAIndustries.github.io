# Vishal Sujatha Achimuthu — Portfolio

Static personal site (HTML + CSS + JS, no build step) for GitHub Pages.

```
index.html      page content — edit text here
styles.css      design; change colours in the :root tokens at the top
script.js       theme toggle, mobile menu, scroll effects
assets/         photo, CV PDF, favicon, social-share image
.nojekyll       tells GitHub Pages to serve files as-is
```

## Publish on GitHub Pages

1. On GitHub, create a **public** repo named exactly `SAIndustries.github.io`.
2. Upload everything in this folder (keep the `assets/` folder) to the repo root and commit.
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `(root)` → Save.
4. After ~1 minute the site is live at **https://saindustries.github.io**.

Then add that URL to your LinkedIn "Website" field and the header of your CV.

## Common edits

- **Swap the CV:** replace `assets/Vishal_Sujatha_Achimuthu_CV.pdf` with a new file of the same name.
- **Add a project:** copy one `<article class="card reveal">…</article>` block in the Projects section.
  Add a repo link by copying the `card__link` anchor from the featured card.
- **Change accent colour:** edit `--accent` in `styles.css` (dark and light themes each have one).
- **Preview locally:** `python3 -m http.server` in this folder, then open http://localhost:8000.
