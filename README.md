# Jose Luis Villca Villegas — personal website

Bilingual (English / Spanish) static website with free evidence-synthesis calculators.
Plain HTML, CSS and JavaScript: no build step, no dependencies, ready for **GitHub Pages**.

## Deploy on GitHub Pages (5 minutes)

1. Create a new public repository on GitHub.
   - Name it `YOUR-USERNAME.github.io` to publish at `https://YOUR-USERNAME.github.io/`, or
   - use any name (e.g. `website`) to publish at `https://YOUR-USERNAME.github.io/website/`.
2. Upload **the contents of this folder** (not the folder itself) to the repository root:
   *Add file → Upload files*, drag everything in, then *Commit changes*.
   Make sure the hidden file `.nojekyll` is included (or run `git add .` from a terminal).
3. Go to *Settings → Pages*. Under *Build and deployment* choose
   *Source: Deploy from a branch*, *Branch: `main`*, folder `/ (root)`, then *Save*.
4. Wait one or two minutes and open the URL GitHub shows you.

From a terminal instead:

```bash
cd this-folder
git init && git add . && git commit -m "Personal website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-USERNAME.github.io.git
git push -u origin main
```

### Custom domain (optional)
Add a file named `CNAME` containing only your domain (e.g. `joseluisvillca.com`),
point your DNS to GitHub Pages, and set the domain in *Settings → Pages*.

## Edit your links — one file

Open `assets/js/config.js` and fill in LinkedIn, Google Scholar, ResearchGate and your GitHub
username. Empty values are hidden automatically. Your GitHub username also turns on the
"My repositories" section of the R toolkit page, listing your public repos live.

## How the language switch works

Every piece of text is written twice, side by side:

```html
<span data-l="en">Publications</span><span data-l="es">Publicaciones</span>
<p data-l="en">English paragraph…</p><p data-l="es">Párrafo en español…</p>
```

The EN/ES button in the header changes `<html lang>`, and the CSS hides the other language.
The choice is remembered on the visitor's device. To share a page in Spanish, add `?lang=es`
to the link (e.g. `tools.html?lang=es#median`). To edit text, change both versions.

## What's inside

| Path | What it is |
|---|---|
| `index.html` | Home: portrait, introduction, career forest plot, site directory |
| `about.html` | Trajectory, experience, education, publications (live from ORCID), contact |
| `tools.html` | 8 calculators (see below). Direct links: `tools.html#median`, `#combine`, `#sdfinder`, `#binary`, `#smd`, `#diagnostic`, `#kappa`, `#samplesize` |
| `toolkit.html` | Curated R packages with copy-ready code and downloadable templates |
| `projects.html` | Ventures, research in progress, teaching and community |
| `assets/js/stats.js` | Statistics engine (normal, t, Wilson, and the calculator formulas) |
| `assets/js/tools.js` | Calculator interface and bilingual results |
| `assets/js/main.js` | Language, dark mode, menu, profile links, ORCID and GitHub feeds |
| `assets/r/` | `pairwise_meta_analysis.R`, `dta_meta_analysis.R`, `extraction_template.csv` |

### Calculators
Median/IQR/range → mean & SD (Luo 2018; Wan 2014) · Combine subgroups (Cochrane Handbook 6.5.a) ·
SD finder from SE, CI, p or t (Cochrane 6.5.2) · RR, OR, RD, NNT with 95% CI (Altman 1998) ·
Hedges' g and OR↔SMD conversion (Borenstein 2009; Chinn 2000) · Diagnostic 2×2 with Wilson CIs,
likelihood ratios, DOR and post-test probability · Cohen's kappa and PABAK for screening ·
Sample size for one proportion, two proportions and two means.

The formulas were checked against reference values (e.g. t₀.₉₇₅,₁₀ = 2.228, n = 385 for p = 50% ± 5%).
Everything runs in the visitor's browser; no data is sent anywhere.

## Before you publish — please check

- [ ] Dates, roles and wording on `about.html` and `projects.html` are accurate and current.
- [ ] Your MSc status (currently: "coursework completed, thesis in final review").
- [ ] Your Sincromed description is what you want public.
- [ ] Social preview: after deploying, replace `assets/img/og-image.jpg` in the `og:image`
      tags with the full URL (e.g. `https://YOUR-USERNAME.github.io/assets/img/og-image.jpg`)
      so LinkedIn and WhatsApp show your photo.

---

# Resumen en español

Sitio estático bilingüe listo para GitHub Pages. **Para publicarlo:** crea un repositorio
(idealmente `TU-USUARIO.github.io`), sube el *contenido* de esta carpeta a la raíz
(incluido el archivo oculto `.nojekyll`), y en *Settings → Pages* elige *Deploy from a branch*,
rama `main`, carpeta `/ (root)`. En uno o dos minutos estará en línea.

**Para editar tus enlaces** (LinkedIn, Google Scholar, GitHub) abre `assets/js/config.js`.
**Para editar textos**, cada frase está en inglés y en español lado a lado
(`data-l="en"` / `data-l="es"`): cambia ambas versiones. Revisa la lista de verificación de arriba antes de publicar.
