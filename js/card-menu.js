// Card Menu: a full-screen menu of photo cards arranged in 3D.
// Opening shrinks the page away; the cards slide with the mouse wheel, drag/swipe or arrow keys;
// the centre card tilts toward the pointer and zooms forward when chosen.
// No dependencies. Markup and options: see README.md and demo.html.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Compare pages by path + query, ignoring a trailing index.html.
  const pageKey = u => u.pathname.replace(/index\.html?$/, '') + u.search;

  function setup(dlg) {
    if (dlg.dataset.cmReady) return;
    const rail = dlg.querySelector('.cm-rail');
    const cards = rail ? [...rail.querySelectorAll('.cm-card')] : [];
    if (!cards.length) return;
    dlg.dataset.cmReady = '1';

    // Mark the card for the current page, unless the markup already did.
    if (!cards.some(c => c.hasAttribute('aria-current'))) {
      const here = pageKey(location);
      cards.find(c => pageKey(new URL(c.href, location.href)) === here)?.setAttribute('aria-current', 'page');
    }
    const start = Math.max(0, cards.findIndex(c => c.hasAttribute('aria-current')));
    let pos = start, target = start, raf = 0, idle = 0, drag = null, moved = false;
    const clamp = v => Math.min(Math.max(v, 0), cards.length - 1);
    const step = () => cards[0].offsetWidth + (parseFloat(getComputedStyle(dlg).getPropertyValue('--cm-gap')) || 28);

    // Place every card from the (fractional) centre position: side cards turn away and sink back.
    const layout = () => {
      const w = step();
      cards.forEach((c, i) => {
        const o = i - pos, a = Math.abs(o);
        c.style.transform = `translateX(${o * w}px) translateZ(${-a * 140}px) rotateY(${Math.max(-40, Math.min(40, -o * 16))}deg) translateY(${Math.min(a, 1) * 18}px)`;
        c.style.opacity = a > 3.2 ? 0 : 1 - Math.max(0, a - 2.2);
        c.style.zIndex = 100 - Math.round(a * 10);
        c.classList.toggle('cm-center', a < .5);
        if (a >= .5) c.querySelector('.cm-poster').style.transform = ''; // drop the tilt once off-centre
      });
    };
    const animate = () => {
      cancelAnimationFrame(raf);
      const tick = () => {
        pos += (target - pos) * (reduce ? 1 : .14);
        if (Math.abs(target - pos) < .001) pos = target;
        layout();
        if (pos !== target) raf = requestAnimationFrame(tick);
      };
      tick();
    };
    const go = i => { target = clamp(i); animate(); };
    const snap = () => { clearTimeout(idle); idle = setTimeout(() => go(Math.round(target)), 140); };

    const open = () => {
      // Shrink the page toward the centre of the screen, then bring in the menu.
      document.querySelectorAll(dlg.dataset.zoom || 'main, footer').forEach(el => {
        const r = el.getBoundingClientRect();
        el.style.transformOrigin = `${innerWidth / 2 - r.left}px ${innerHeight / 2 - r.top}px`;
        el.classList.add('cm-zoom-target');
      });
      void document.body.offsetWidth; // commit the transition before zooming
      document.documentElement.classList.add('cm-zoomed');
      pos = target = start;
      setTimeout(() => { dlg.showModal(); layout(); cards[start].focus({ preventScroll: true }); }, reduce ? 0 : 380);
    };
    const reset = () => {
      document.documentElement.classList.remove('cm-zoomed');
      dlg.classList.remove('cm-leaving');
      cards.forEach(c => c.classList.remove('cm-go'));
    };
    dlg.addEventListener('close', reset);
    // Back/forward cache can restore the page mid-transition (blank screen). Reset directly:
    // the dialog's close event can be deferred while the page is still hidden.
    addEventListener('pageshow', e => { if (e.persisted) { if (dlg.open) dlg.close(); reset(); } });

    // Openers: <button data-card-menu-open> opens the first menu; data-card-menu-open="id" a specific one.
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-card-menu-open]');
      if (!b) return;
      const id = b.dataset.cardMenuOpen;
      if (id ? id === dlg.id : dlg === document.querySelector('dialog.card-menu')) open();
    });

    dlg.addEventListener('wheel', e => { e.preventDefault(); target = clamp(target + (e.deltaY + e.deltaX) / 420); animate(); snap(); }, { passive: false });
    dlg.addEventListener('keydown', e => {
      const keys = { ArrowRight: Math.round(target) + 1, ArrowLeft: Math.round(target) - 1, Home: 0, End: cards.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      go(keys[e.key]);
      cards[target].focus({ preventScroll: true });
    });
    cards.forEach((c, i) => c.addEventListener('focus', () => go(i)));

    // Drag/swipe slides the rail; otherwise the centre card tilts toward the pointer.
    rail.addEventListener('pointerdown', e => { drag = { x: e.clientX, t: target }; moved = false; });
    addEventListener('pointermove', e => {
      if (drag) {
        const dx = e.clientX - drag.x;
        if (Math.abs(dx) > 6) moved = true;
        target = clamp(drag.t - dx / step());
        animate();
      } else if (dlg.open && !reduce) {
        const p = rail.querySelector('.cm-center .cm-poster');
        if (p) p.style.transform = `rotateY(${(e.clientX / innerWidth - .5) * 16}deg) rotateX(${-(e.clientY / innerHeight - .5) * 12}deg)`;
      }
    }, { passive: true });
    const endDrag = () => { if (drag) { drag = null; go(Math.round(target)); } };
    addEventListener('pointerup', endDrag);
    addEventListener('pointercancel', endDrag);
    addEventListener('resize', () => { if (dlg.open) layout(); });

    rail.addEventListener('click', e => {
      const card = e.target.closest('.cm-card');
      if (!card || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let new-tab clicks through
      e.preventDefault();
      if (moved) return; // that was a drag, not a click
      const i = cards.indexOf(card);
      if (Math.round(pos) !== i) return go(i); // side card: bring it to the centre first
      if (card.getAttribute('aria-current') === 'page') return dlg.close();
      // Chosen: the card swells toward the viewer while the rest fall away, then navigate.
      card.classList.add('cm-go');
      dlg.classList.add('cm-leaving');
      setTimeout(() => { location.href = card.href; }, reduce ? 0 : 520);
    });
  }

  // CardMenu.init() wires up menus rendered after page load (e.g. in single-page apps). Safe to call twice.
  window.CardMenu = { init: (root = document) => root.querySelectorAll('dialog.card-menu').forEach(setup) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => CardMenu.init());
  else CardMenu.init();
})();
