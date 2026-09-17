# Kitchen Index

A recipe site where the folders are the navigation and every recipe is a Markdown file you can read
without a browser. GitHub Pages builds it with Jekyll, so there's nothing to install and nothing to
run before pushing.

## Structure

```
.
├── _config.yml              site title and tagline
├── index.html               home page
├── assets/
│   ├── style.css
│   └── site.js
├── _layouts/
│   ├── default.html         header, footer, search
│   ├── section.html         list of recipes in one folder
│   └── recipe.html          a single recipe
│
├── breakfast/               ← each of these folders is a section
│   ├── index.html           ← 5 lines of front matter; names the section
│   ├── buttermilk-pancakes.md
│   └── soft-scrambled-eggs.md
├── dinners/
│   └── …
└── baking/
    └── …
```

The top-level folders are the sections. They appear in the header nav and on the home page in the
order set by `order:` in each folder's `index.html`. Nothing else needs updating when you add one.

## Put it online

1. Push this to a GitHub repo.
2. **Settings → Pages → Source:** *Deploy from a branch*, `main` / `/ (root)`, save.
3. A minute later it's at `https://<username>.github.io/<repo>/`.

GitHub builds the Jekyll site itself. Every push republishes.

## Add a recipe

Make a `.md` file in one of the section folders. The filename becomes the URL.

```markdown
---
layout: recipe
title: Tomato and bread soup
summary: One line about why this one is worth making.
time: 40 min
servings: 4
tags: [vegetarian, soup]
added: 2026-04-02
---

## Ingredients

- 2 tbsp olive oil
- 1/2 tsp chilli flakes

## Method

1. First thing you do.
2. Second thing you do.

## Notes

Optional. Substitutions, make-ahead, what to do with the leftovers.
```

Only `layout` and `title` are required. Useful things to know:

- The heading named **Ingredients** moves into the left column. Everything else stacks in the right
  one. Change the heading text and it just renders as one column, which is fine too.
- Ingredients become tappable and cross off as you cook. So do the numbered steps.
- **`servings: 4`** as a number turns on the +/– scaler, which rewrites the quantities in place.
  Quantities have to lead the line — `2`, `1.5`, `1/2`, `1 1/2` and `½` all work. Write text instead
  (`servings: 1 loaf`) and the scaler stays off.
- **`added:`** only feeds the "Added recently" list on the home page.
- The Markdown body is ordinary Markdown. Sub-headings, notes, paragraphs between steps — all fine.

## Add a section

Make a folder, put an `index.html` in it with nothing but front matter:

```html
---
layout: section
title: Soups
summary: Optional line shown under the heading.
order: 4
---
```

That's the whole step. The nav, the home page and the recipe count pick it up on the next build.

## Change the look

`assets/style.css` starts with the palette as CSS variables — white ground, one blue accent, light
grey rules. Type is Lato for headings and interface, Source Serif 4 for recipe text, both loaded
from Google Fonts in `_layouts/default.html`.

## A couple of notes

- Don't set `permalink: pretty` in `_config.yml`. It changes what Jekyll reports as a page's folder,
  which is how sections are worked out here, and the grouping stops matching.
- Search runs in the browser over an index built into each page at build time. It covers titles,
  summaries and ingredients. Past a few hundred recipes it's worth moving that to a separate file.
- To preview locally you need Ruby: `gem install bundler jekyll`, then `jekyll serve`. Or skip it —
  the Markdown reads perfectly well on its own, which was rather the point.
