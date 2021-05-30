This is the repository behind https://emmyft.github.io.

This site is built using [Poole](https://getpoole.com) by Mark Otto; usage instructions below taken from [Poole's Github repository](https://github.com/poole/poole).

## Usage

### 1. Install dependencies

Poole is built on Jekyll and uses its built-in SCSS compiler to generate our CSS. Before getting started, you'll need to install the Jekyll gem and related dependencies:

```bash
$ gem install jekyll jekyll-gist jekyll-sitemap jekyll-seo-tag
```

**Windows users:** Windows users have a bit more work to do, but luckily [@juthilo](https://github.com/juthilo) has your back with his [Run Jekyll on Windows](https://github.com/juthilo/run-jekyll-on-windows) guide.

**Need syntax highlighting?** Poole includes support for Pygments or Rouge, so install your gem of choice to make use of the built-in styling. Read more about this in the [Jekyll docs](https://jekyllrb.com/docs/liquid/tags/#code-snippet-highlighting).

### 2a. Quick start

To help anyone with any level of familiarity with Jekyll quickly get started, Poole includes everything you need for a basic Jekyll site. To that end, just download Poole and start up Jekyll.

### 2b. Roll your own Jekyll site

Folks wishing to use Jekyll's templates and styles can do so with a little bit of manual labor. Download Poole and then copy what you need (likely `_layouts/`, `*.html` files, `atom.xml` for RSS, and `assets/` for CSS, JS, etc.).

### 3. Running locally

To see your Jekyll site with Poole applied, start a Jekyll server. In Terminal, from `/poole` (or whatever your Jekyll site's root directory is named):

```bash
$ jekyll serve
```

Open <http://localhost:4000> in your browser, and voilà.

### 4. Serving it up

If you host your code on GitHub, you can use [GitHub Pages](https://pages.github.com) to host your project.

1. Fork this repo and switch to the `gh-pages` branch.
  1. If you're [using a custom domain name](https://help.github.com/articles/setting-up-a-custom-domain-with-github-pages), modify the `CNAME` file to point to your new domain.
  2. If you're not using a custom domain name, **modify the `baseurl` in `_config.yml`** to point to your GitHub Pages URL. Example: for a repo at `github.com/username/poole`, use `http://username.github.io/poole/`. **Be sure to include the trailing slash.**
3. Done! Head to your GitHub Pages URL or custom domain.

No matter your production or hosting setup, be sure to verify the `baseurl` option file and `CNAME` settings. Not applying this correctly can mean broken styles on your site.


## Author

Theme author is **Mark Otto**
- <https://github.com/mdo>
- <https://twitter.com/mdo>

Content author (except where otherwise stated) is Emmy Tsang.

## License

Open sourced under the [MIT license](LICENSE.md).

<3
