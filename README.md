# Hope Ever Foundation — website

Static site (plain HTML, CSS and JavaScript, no build step).

## Run locally

Serve it rather than double-clicking the HTML files, so paths and fonts load as they do online.

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Deploy (Vercel)

Import the repo in Vercel, choose the framework preset **Other**, and leave the build command empty.
`404.html` is served automatically for unknown addresses.

## Editing the team and numbers (no developer needed)

The team (About page) and the impact numbers (Home page) live in `data/content.json`. The page shows however many entries are listed.

**Easy way: Pages CMS (forms, no code).** One-time setup by the repo owner:
1. Go to https://app.pagescms.org and sign in with GitHub.
2. Install the Pages CMS GitHub App on this repository, then open it.
3. Invite the client by email (collaborators do not need a GitHub account).

The client then opens the site's "Team & impact numbers" form, adds, edits or removes people (name, role, optional bio) and numbers, and saves.
Each save is committed to GitHub and Vercel redeploys in about a minute. The form layout is defined in `.pages.yml`.

**By hand:** edit `data/content.json` on GitHub (pencil icon). Keep every quote and comma in place; if a section goes blank, one is missing.

## Settings

| Where | Setting | What it does |
|---|---|---|
| top of `js/main.js` | `RAZORPAY_BUTTON_ID` | Razorpay Payment Button ID (`pl_…`, Razorpay Dashboard → Payment Button → Create). Empty = the Donate pop-up is an enquiry form only. |
| donate pop-up and `contact.html` | `access_key` | Web3Forms key; form messages go to contact@hopeever.org. |

## Files

| Path | Contents |
|---|---|
| `index.html` … `contact.html`, `404.html` | Pages |
| `projects/*.html` | Project detail pages (linked from each card's "Read more") |
| `docs/` | Certificates and policy PDFs |
| `assets/images/` | Photos, partner logos, icons |
| `css/style.css` | Site styles |
| `css/card-menu.css`, `js/card-menu.js` | 3D photo-card menu (the "Menu" button) |
| `js/main.js` | Loader, reveal, counters, filters, lightbox, donate and contact forms, audio, cursor |
| `data/content.json` | **Editable content**: the team (About page) and impact numbers (Home page) |
| `.pages.yml` | Pages CMS form layout for editing `data/content.json` |
| `tree.html`, `tree-embed/` | The tree on its own, and a drop-in version for other websites (not used by the site pages) |

## To do

- Real phone number and Instagram handle (contact page and footer)
- Income Tax 10AB approval order: the PDF is missing, so the About page offers "Request a copy".
  Add the file to `docs/` and link it from the certificate card in `about.html`.
