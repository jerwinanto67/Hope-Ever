// Shared page behaviour. Classic script, no dependencies.
document.documentElement.classList.add('js');
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

// ---- Loader: hide once the 3D scene paints (or give up after 3.5s) ----
let loaded = false;
const done = () => { if (!loaded) { loaded = true; document.body.classList.add('is-loaded'); } };
addEventListener('scene-ready', done);
setTimeout(() => { if (!loaded) document.documentElement.classList.add('no-webgl'); done(); }, 3500);

// ---- Header ----
const header = $('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const page = document.body.dataset.page;
$$('.primary-nav a').forEach(a => { if (a.dataset.nav === page) a.setAttribute('aria-current', 'page'); });


// ---- Split headline words for the intro animation ----
$$('.split-words').forEach(el => {
  let i = 0;
  const wrap = node => { const w = document.createElement('span'); w.className = 'w'; const s = document.createElement('span'); s.style.setProperty('--i', i++); s.append(node); w.append(s); return w; };
  [...el.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => frag.append(/^\s*$/.test(part) ? document.createTextNode(part) : wrap(document.createTextNode(part))));
      n.replaceWith(frag);
    } else el.replaceChild(wrap(n.cloneNode(true)), n);
  });
});

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
$$('.reveal, [data-count]').forEach(el => io.observe(el));

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
    img.src = src.currentSrc || src.src;
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
    $('#card-menu')?.open && $('#card-menu').close();
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

// ---- Ambient sound (generated, off by default) ----
const soundBtn = $('.sound-toggle');
let audio;
soundBtn?.addEventListener('click', () => {
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', on);
  if (!audio) {
    const ctx = new AudioContext(), master = ctx.createGain(), lp = ctx.createBiquadFilter();
    master.gain.value = 0;
    lp.type = 'lowpass'; lp.frequency.value = 800;
    lp.connect(master).connect(ctx.destination);
    [110, 164.81, 220, 277.18, 329.63].forEach((hz, i) => { // soft A-major pad with slow swells
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = hz; o.detune.value = (i - 2) * 4;
      g.gain.value = 0.05; lfo.frequency.value = 0.04 + i * 0.027; lg.gain.value = 0.045;
      lfo.connect(lg).connect(g.gain); o.connect(g).connect(lp); o.start(); lfo.start();
    });
    audio = { ctx, master };
  }
  audio.ctx.resume();
  audio.master.gain.setTargetAtTime(on ? 0.5 : 0, audio.ctx.currentTime, on ? 1.2 : 0.3);
});

// ---- Cursor ring (fine pointers only; native cursor stays visible) ----
if (matchMedia('(pointer: fine)').matches && !reduce) {
  const c = document.createElement('div');
  c.className = 'cursor';
  c.setAttribute('aria-hidden', 'true');
  document.body.append(c);
  let x = 0, y = 0, cx = 0, cy = 0;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; c.classList.add('is-on'); c.classList.toggle('is-hover', !!e.target.closest('a, button, label, select, .chip')); }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  (function loop() { cx += (x - cx) * 0.18; cy += (y - cy) * 0.18; c.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); })();
}

$$('.year').forEach(el => { el.textContent = new Date().getFullYear(); });
