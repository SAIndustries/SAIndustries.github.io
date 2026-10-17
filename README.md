# Vishal Sujatha Achimuthu — Portfolio

Static personal site (HTML + CSS + JS, no build step) for GitHub Pages.

```
index.html      page content — edit text here
styles.css      design; change colours in the :root tokens at the top
script.js       all motion: intro, smooth scroll, cursor, draggable shapes,
                pinned sections, horizontal projects, skills orbit, marquee
assets/         photos, CV PDF, favicon, social-share image
assets/js/      GSAP 3.12, ScrollTrigger, Lenis (bundled locally — no CDN needed)
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
- **Add a featured project card:** copy one `<article class="pcard">…</article>` block in the Projects
  carousel (the "01 / 07" counter updates itself). Add the repo name to `FEATURED` in `script.js`.
- **Repository index:** lists your public GitHub repos live on every visit — new repos appear
  automatically. Edit `OVERRIDES` (nicer names/descriptions) or `HIDE` (repos to skip) in `script.js`.
  If GitHub is unreachable, the static list in `index.html` (#reposList) is shown instead.
- **Change accent colour:** edit `--accent` in `styles.css` (dark and light themes each have one).
- **Preview locally:** `python3 -m http.server` in this folder, then open http://localhost:8000.

## Motion notes

- Visitors with "reduce motion" switched on (or if the scripts fail to load) get a calm, fully readable static version.
- The intro curtain plays once per browser session.
- To change the orbit skills, edit the `skills` array in `script.js`.
- To change the giant manifesto words, edit `.manifesto__track` in `index.html`.

## Contact form (one-time setup)

The form emails you through [FormSubmit](https://formsubmit.co) — free, no account or API key.

1. After the site is live, send yourself a test message from the form.
2. FormSubmit emails **arunganesh1956@gmail.com** an activation link — click it (check spam).
3. Done. Every future message arrives as an email titled "Portfolio message from <name>"
   with their name, email, mobile and message; hitting Reply answers the sender.

Optional: the activation email also gives you a random alias. Replace your address in
`data-endpoint="https://formsubmit.co/ajax/…"` in `index.html` with that alias to keep
your email out of the page source.

To change the recipient, edit that same `data-endpoint` attribute.
