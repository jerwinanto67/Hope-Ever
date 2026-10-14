// Shared page behaviour. Classic script, no dependencies.
document.documentElement.classList.add('js');
window.siteReady = true; // tells the page's 5-second failsafe that this script is running
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Donation settings: fill in when the organisation provides them ----
// Bank/UPI QR image from the bank or UPI app, e.g. 'assets/images/donate/upi-qr.png'. Shown in the Donate pop-up.
const DONATE_QR_IMAGE = '';
// UPI ID, e.g. 'hopeever@sbi'. Without an image, the site draws the QR from this; on phones it also opens the UPI app.
const UPI_ID = '';
// Razorpay Payment Button ID (starts with "pl_"). Empty = no online card payments.
const RAZORPAY_BUTTON_ID = '';

// ---- Header: shadow line once scrolled, current page, mobile menu ----
const header = $('.site-header'), nav = $('.primary-nav'), toggle = $('.nav-toggle');
const page = document.body.dataset.page;
$$('.primary-nav a').forEach(a => { if (a.dataset.nav === page) a.setAttribute('aria-current', 'page'); });
const closeNav = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', nav.classList.toggle('open')));
nav.addEventListener('click', e => { if (e.target.closest('a')) closeNav(); });
document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeNav(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { closeNav(); toggle.focus(); } });

// ---- Back to top ----
const topBtn = document.createElement('button');
topBtn.className = 'scroll-top-btn';
topBtn.setAttribute('aria-label', 'Back to top');
topBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>';
topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
document.body.append(topBtn);

const onScroll = () => {
  header.classList.toggle('is-scrolled', scrollY > 10);
  topBtn.classList.toggle('visible', scrollY > 300);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---- Home hero: photo slider ----
const slides = $$('#hero-slider img');
if (slides.length > 1 && !reduce) {
  let current = 0;
  setInterval(() => {
    if (document.hidden) return;
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
}

// ---- Language switcher (Google Translate, Tamil / English): loaded after the page, so it never slows first paint ----
addEventListener('load', () => (window.requestIdleCallback || setTimeout)(() => {
  const box = document.createElement('div');
  box.className = 'translate-widget-wrapper';
  box.innerHTML = '<div id="google_translate_element"></div>';
  $('.brand').after(box);
  window.googleTranslateElementInit = () => new google.translate.TranslateElement(
    { pageLanguage: 'en', includedLanguages: 'ta,en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE, autoDisplay: false },
    'google_translate_element');
  const sc = document.createElement('script');
  sc.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  sc.async = true;
  document.body.append(sc);
}));

// ---- Client-editable content: data/content.json fills [data-render="stats"] and [data-render="team"] ----
// Edited through Pages CMS (see .pages.yml) or by hand on GitHub.
const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls; if (text != null) n.textContent = text; return n; };
const render = content => {
  $('[data-render="stats"]')?.append(...(content.stats || []).map((s, i) => {
    const box = el('div', 'stat reveal'), num = el('strong', '', '0' + (s.suffix || ''));
    box.style.setProperty('--d', (i % 4) * 0.08 + 's');
    num.dataset.count = String(s.number).replace(/,/g, '');
    num.dataset.suffix = s.suffix || '';
    box.append(num, el('span', '', s.label));
    return box;
  }));
  $('[data-render="team"]')?.append(...(content.team || []).flatMap(g => {
    const grid = el('div', 'people');
    grid.append(...(g.people || []).map(p => {
      const card = el('div', 'person');
      card.append(el('strong', '', p.name), el('span', '', p.role || ''));
      if (p.bio) card.append(el('p', 'bio', p.bio));
      return card;
    }));
    return [el('p', 'group-title reveal', g.title), grid];
  }));
};

// ---- Scroll reveal + counters ----
const countUp = el => {
  const end = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now(), dur = 1800;
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN') + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  reduce ? (el.textContent = end.toLocaleString('en-IN') + suffix) : requestAnimationFrame(tick);
};
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('is-in');
  if (e.target.dataset.count) countUp(e.target);
  io.unobserve(e.target);
}), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
const observe = () => $$('.reveal, [data-count]').forEach(el => { if (!el.hasAttribute('data-o')) { el.setAttribute('data-o', ''); io.observe(el); } });
observe(); // what is already on the page reveals straight away
// Editable blocks arrive a moment later: fill them in, then reveal those too.
if ($('[data-render]')) fetch('data/content.json', { cache: 'no-cache' }).then(r => r.json()).then(render).catch(console.error).finally(observe);

// ---- Filters (projects + gallery) ----
$$('[data-filter-group]').forEach(group => {
  const items = $$('[data-cat]', $(group.dataset.filterGroup));
  group.addEventListener('click', e => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    $$('[data-filter]', group).forEach(c => c.setAttribute('aria-pressed', c === chip));
    const f = chip.dataset.filter;
    items.forEach(it => { it.hidden = f !== 'all' && !it.dataset.cat.split(' ').includes(f); });
  });
});

// ---- Lightbox ----
const lb = $('#lightbox');
if (lb) {
  const img = $('img', lb), cap = $('figcaption', lb);
  let list = [], idx = 0;
  const show = i => {
    idx = (i + list.length) % list.length;
    const src = $('img', list[idx]);
    img.src = src.src; // the full-size photo, not the grid thumbnail
    img.alt = src.alt;
    cap.textContent = list[idx].parentElement.querySelector('figcaption').textContent;
  };
  $('.masonry').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    list = $$('.masonry figure:not([hidden]) button');
    show(list.indexOf(b));
    lb.showModal();
  });
  $('.lb-prev', lb).onclick = () => show(idx - 1);
  $('.lb-next', lb).onclick = () => show(idx + 1);
  $('.lb-close', lb).onclick = () => lb.close();
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
}

// ---- Donate dialog: Web3Forms enquiry, plus Razorpay when configured ----
const donate = $('#donate');
if (donate) {
  let rzp = false;
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-donate]')) return;
    e.preventDefault();
    if (RAZORPAY_BUTTON_ID && !rzp) { // the button script only runs when added as a real <script>
      rzp = true;
      const sc = document.createElement('script');
      sc.src = 'https://checkout.razorpay.com/v1/payment-button.js';
      sc.async = true;
      sc.dataset.payment_button_id = RAZORPAY_BUTTON_ID;
      $('.rzp-slot', donate).append(sc);
      $('.pay', donate).hidden = false;
    }
    donate.showModal();
  });
  // Bank / UPI QR: hidden until DONATE_QR_IMAGE or UPI_ID is set.
  if (DONATE_QR_IMAGE || UPI_ID) {
    const qr = $('.qr', donate), img = $('.qr-img', qr);
    const upiLink = UPI_ID && `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent('Hope Ever Foundation')}&cu=INR`;
    if (UPI_ID) {
      $('.qr-upi', qr).textContent = 'UPI ID: ' + UPI_ID;
      const app = $('.qr-app', qr);
      app.href = upiLink;
      app.hidden = !matchMedia('(pointer: coarse)').matches; // UPI links only open on phones
    }
    if (DONATE_QR_IMAGE) img.src = DONATE_QR_IMAGE;
    else { // draw the QR from the UPI ID
      const sc = document.createElement('script');
      sc.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
      sc.onload = () => { const q = qrcode(0, 'M'); q.addData(upiLink); q.make(); img.src = q.createDataURL(6, 2); };
      document.head.append(sc);
    }
    qr.hidden = false;
  }
  $('.close', donate).onclick = () => donate.close();
  donate.addEventListener('click', e => { if (e.target === donate) donate.close(); });
}

// ---- Contact page: preselect the subject from ?subject= ----
const contactForm = $('#contact-form');
const subj = new URLSearchParams(location.search).get('subject');
if (contactForm && subj && [...contactForm.subject.options].some(o => o.value === subj)) contactForm.subject.value = subj;

// ---- Forms: submit to Web3Forms without leaving the page (contact + donate) ----
document.addEventListener('submit', async e => {
  const form = e.target;
  if (form.id !== 'contact-form' && !form.classList.contains('w3f')) return;
  e.preventDefault();
  if (!form.reportValidity()) return;
  const fb = $('.form-feedback', form), btn = $('button[type=submit]', form);
  btn.disabled = true;
  fb.className = 'form-feedback';
  fb.textContent = 'Sending…';
  try {
    const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Submission failed');
    form.reset();
    fb.className = 'form-feedback ok';
    fb.textContent = 'Thank you — your message has been sent. We will get back to you soon.';
  } catch {
    fb.className = 'form-feedback err';
    fb.textContent = 'Sorry, something went wrong. Please email contact@hopeever.org directly.';
  } finally { btn.disabled = false; }
});

$$('.year').forEach(el => { el.textContent = new Date().getFullYear(); });
