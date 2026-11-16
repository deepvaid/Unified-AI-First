# BKM report: infographics and Confluence page

Rebuilds the five infographics and the page body of the Confluence copy of the BKM Health gap report
([DES 6973554714](https://maropost.atlassian.net/wiki/spaces/DES/pages/6973554714)). The rows come from the
`ROWS` array in `public/bkm-health-requirements.html`, so change a row there first. Needs `python3` and Google Chrome.
Everything is written to `output/bkm-figs/` (git-ignored).

```bash
python3 scripts/bkm-report/figures.py          # one HTML page per infographic
zsh scripts/bkm-report/render.sh               # each page to a 1920px PNG (2x) with headless Chrome
python3 scripts/bkm-report/confluence-body.py  # page body, Confluence HTML format
```

## Putting it on Confluence

1. **Images.** Confluence rejects attachment uploads made from a script in the browser ("XSRF check failed").
   Open the page in the editor, insert the PNGs, and publish. Then read the page as HTML (Atlassian MCP
   `getConfluencePage`, `contentFormat: html`) and copy each image's `data-id` into `MEDIA` in `confluence-body.py`.
   Images uploaded again get new ids.
2. **Body.** Send `output/bkm-figs/confluence-body.html` with the Atlassian MCP `updateConfluencePage`
   (`contentFormat: html`). It replaces the whole page, so do it before anyone comments inline.
3. **Small fixes.** A JSON `PUT /wiki/rest/api/content/6973554714` with the storage body works from the page's own
   browser tab, which is cheaper than resending the whole body.

The repo doc (`docs/store-builder/bkm-health-requirements.md`), the public page and the Confluence page are three
copies of one matrix: a changed row needs all three.
