# Hope Ever Foundation — website

Static site (plain HTML, CSS and JavaScript, no build step). The Tree of Hope 3D scene uses
Three.js from the jsDelivr CDN.

## Run locally

The 3D scene needs a web server; double-clicking the HTML files won't load it.

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Deploy (Vercel)

Import the repo in Vercel, choose the framework preset **Other**, and leave the build command empty.
`404.html` is served automatically for unknown addresses.

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
| `js/scene.js` | Tree of Hope background scene; the camera follows the scroll |
| `tree.html`, `tree-embed/` | The tree on its own, and a drop-in version for other websites |

## To do

- Real phone number and Instagram handle (contact page and footer)
- Income Tax 10AB approval order: the PDF is missing, so the About page offers "Request a copy".
  Add the file to `docs/` and link it from the certificate card in `about.html`.
