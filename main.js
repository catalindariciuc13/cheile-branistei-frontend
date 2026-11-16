/* Regulile de rezervare pe sezoane — aceleași ca în backend (ReguliSezon.java); calendarul le
   actualizează din răspunsul API-ului. O „noapte” e data în care începe (24 dec = de pe 24 pe 25). */
window.cbReguli = (() => {
  const md = k => +k.slice(5, 7) * 100 + +k.slice(8, 10);
  const r = {
    pretCamera: 250, pretCasa: 3000, pachetCraciun: 8000, minNoptiIarna: 2, minNoptiCraciun: 3,
    iarna: { start: '11-01', sfarsit: '03-31' }, craciun: { start: '12-23', sfarsit: '12-27' },
    // nopți blocate (Revelion 2026/27 rezervat integral: check-in 30 dec, check-out 3 ian) — ca în backend
    blocate: [['2026-12-30', '2027-01-03']],
  };
  const lz = s => +s.slice(0, 2) * 100 + +s.slice(3, 5);
  r.esteIarna   = k => { const m = md(k); return m >= lz(r.iarna.start) || m <= lz(r.iarna.sfarsit); };
  r.esteCraciun = k => { const m = md(k); return m >= lz(r.craciun.start) && m <= lz(r.craciun.sfarsit); };
  r.esteBlocata = k => r.blocate.some(([de, pana]) => k >= de && k < pana);
  r.minNopti = zile => zile.some(r.esteCraciun) ? r.minNoptiCraciun : zile.some(r.esteIarna) ? r.minNoptiIarna : 1;
  return r;
})();

document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     1) HERO reveal on scroll
     ========================= */
  (() => {
    const hero = document.querySelector('.hero');
    const box  = document.querySelector('.reveal-hero');
    if (!hero || !box) return;

    const revealAt = 40;

    // Caseta apare imediat la încărcare (fără „gol” la deschiderea site-ului)
    // și rămâne afișată; la scroll doar se întunecă puțin poza.
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('show')));

    const onScroll = () =>
      hero.classList.toggle('hero-scrolled', window.scrollY > revealAt);

    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();

    // Scroll indicator
    const scrollInd = document.querySelector('.scroll-indicator');
    if (scrollInd) {
      scrollInd.style.opacity = window.scrollY > 80 ? '0' : '1';
      window.addEventListener('scroll', () => {
        scrollInd.style.transition = 'opacity .4s ease';
        scrollInd.style.opacity = window.scrollY > 80 ? '0' : '1';
      }, { passive: true });
    }
  })();


  /* =========================
     2) Scroll spy (active link)
     ========================= */
  (() => {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;

    const links = [...nav.querySelectorAll('a[href^="#"]')];
    if (!links.length) return;

    const sections = [...document.querySelectorAll('section[id]')];

    const offset = 120;

    const setActive = () => {
      const y = window.scrollY + offset;
      let current = links[0].getAttribute('href');

      for (const sec of sections) {
        const top = sec.offsetTop;
        const bottom = top + sec.offsetHeight;
        if (y >= top && y < bottom) {
          current = sec.id === 'recenzii' ? '#zona' : `#${sec.id}`;
          break;
        }
      }

      links.forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === current)
      );
    };

    // Throttle pe requestAnimationFrame — o singură recalculare pe cadru
    let rafSpy = null;
    const onScrollSpy = () => {
      if (rafSpy) return;
      rafSpy = requestAnimationFrame(() => {
        rafSpy = null;
        setActive();
      });
    };

    window.addEventListener('scroll', onScrollSpy, { passive:true });
    setActive();
  })();


  /* =========================
     3) NAV shrink on scroll
     ========================= */
  (() => {
    const nav = document.querySelector('nav');
    if (!nav) return;

    // Două praguri (histerezis): când bara își schimbă înălțimea, pagina sare
    // cu ~24px — cu un singur prag, săritura îl retraversa și bara „tremura”.
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 60) nav.classList.add('nav-scrolled');
      else if (y < 8) nav.classList.remove('nav-scrolled');
    };

    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  })();


  /* =========================
     4) HAMBURGER MENU
     ========================= */
  (() => {
    const hamburger   = document.getElementById('hamburger');
    const mobileMenu  = document.getElementById('mobileMenu');
    const mobileClose = document.getElementById('mobileMenuClose');

    const openMenu  = () => {
      mobileMenu?.classList.add('open');
      hamburger?.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      mobileMenu?.classList.remove('open');
      hamburger?.classList.remove('open');
      document.body.style.overflow = '';
    };

    hamburger?.addEventListener('click', openMenu);
    mobileClose?.addEventListener('click', closeMenu);
    document.querySelectorAll('#mobileMenu a').forEach(link =>
      link.addEventListener('click', closeMenu)
    );
  })();


  /* =========================
     5) LIGHTBOX (gallery + carousel)
     ========================= */
  (() => {
    const lb      = document.getElementById('lightbox');
    const img     = document.getElementById('lbImg');
    const close   = document.getElementById('lbClose');
    const prev    = document.getElementById('lbPrev');
    const next    = document.getElementById('lbNext');
    const counter = document.getElementById('lbCounter');
    if (!lb || !img) return;

    const btns = Array.from(document.querySelectorAll('[data-gallery-btn]'));
    const srcOf = btn =>
      btn.getAttribute('data-src') ||
      btn.querySelector('img')?.getAttribute('src');

    let idx = -1;
    const preloaded = {};

    // Preîncarcă discret varianta mare a pozei vecine
    const preload = (i) => {
      const n = (i + btns.length) % btns.length;
      const src = srcOf(btns[n]);
      if (!src || preloaded[src]) return;
      preloaded[src] = true;
      new Image().src = src;
    };

    const show = (i) => {
      if (!btns.length) return;
      idx = (i + btns.length) % btns.length;
      const btn   = btns[idx];
      const full  = srcOf(btn);
      const thumb = btn.querySelector('img')?.getAttribute('src');
      if (!full && !thumb) return;

      img.alt = btn.querySelector('img')?.alt || 'Imagine galerie';
      if (counter) counter.textContent = `${idx + 1} / ${btns.length}`;
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');

      // Thumbnail-ul (deja în cache) apare instant, HD-ul intră când e gata
      img.src = thumb || full;
      if (full && full !== thumb) {
        const wanted = idx;
        const hd = new Image();
        hd.onload = () => {
          if (idx === wanted && lb.classList.contains('open')) img.src = full;
          preloaded[full] = true;
          preload(idx + 1);
          preload(idx - 1);
        };
        hd.src = full;
      } else {
        preload(idx + 1);
        preload(idx - 1);
      }
    };

    const closeLb = () => {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      img.src = '';
    };

    btns.forEach((btn, i) => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        show(i);
      });
    });

    prev?.addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
    next?.addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
    close?.addEventListener('click', closeLb);
    lb.addEventListener('click', e => e.target === lb && closeLb());

    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape')     closeLb();
      if (e.key === 'ArrowLeft')  show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });

    // Swipe pe mobil
    let touchX = null;
    lb.addEventListener('touchstart', e => {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();


  /* =========================
     6) REZERVĂ → Backend API + Modal
     ========================= */
  (() => {
    const form = document.getElementById('reserveForm');
    if (!form) return;

    const phone = '40733623000';

    // Modal helpers
    const modal      = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');

    const closeModal = () => {
      modal.classList.remove('open');

      const title = document.getElementById('modalTitle')?.textContent;

      if (title === 'Rezervare trimisă!') {
        form.reset();

        const priceEl = document.getElementById('price-estimate');
        if (priceEl) priceEl.remove();

        const dispEl = document.getElementById('disponibilitate');
        if (dispEl) dispEl.remove();
      }
    };

    const showModal = ({ icon, iconClass, title, msg, actions = [] }) => {
      document.getElementById('modalIcon').textContent  = icon;
      document.getElementById('modalIcon').className    = `modal-icon ${iconClass}`;
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalMsg').innerHTML     = msg;

      const actionsEl = document.getElementById('modalActions');
      actionsEl.className = 'modal-actions';
      actionsEl.innerHTML = actions.map((a, i) => `
        <a href="${a.href || '#'}"
           ${a.target ? `target="${a.target}"` : ''}
           class="btn ${a.primary ? 'primary' : ''}"
           data-action-index="${i}">
          ${a.icon ? `<svg class="icon" aria-hidden="true"><use href="#${a.icon}"></use></svg>` : ''} ${a.label}
        </a>
      `).join('');

      actionsEl.querySelectorAll('a').forEach((btn, i) => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          const action = actions[i];
          if (!action) return;
          if (action.action === 'close') {
            closeModal();
          } else if (action.action === 'reset') {
            closeModal();
            form.style.display = '';
            form.reset();
            const priceEl = document.getElementById('price-estimate');
            if (priceEl) priceEl.remove();
            const dispEl = document.getElementById('disponibilitate');
            if (dispEl) dispEl.remove();
          } else if (action.href && action.href !== '#') {
            if (action.target === '_blank') {
              window.open(action.href, '_blank');
            } else {
              window.location.href = action.href;
            }
          }
        });
      });

      modal.classList.add('open');
    };

    modalClose?.addEventListener('click', closeModal);
    modal?.addEventListener('click', e => e.target === modal && closeModal());
    document.addEventListener('keydown', e => e.key === 'Escape' && closeModal());

    // Data minima checkin = azi
    const azi = new Date().toISOString().split('T')[0];
    document.getElementById('checkin')?.setAttribute('min', azi);

    // Checkout minim = checkin + 1 zi
    document.getElementById('checkin')?.addEventListener('change', e => {
      const checkin = new Date(e.target.value);
      checkin.setDate(checkin.getDate() + 1);
      const minCheckout = checkin.toISOString().split('T')[0];
      const checkoutEl = document.getElementById('checkout');
      checkoutEl.setAttribute('min', minCheckout);
      if (checkoutEl.value && checkoutEl.value < minCheckout) {
        checkoutEl.value = minCheckout;
      }
      calcPret();
      verificaDisponibilitate();
    });

    // Calculator pret — pe nopți: iarna toată casa (pachet la Crăciun), în rest pe camere.
    // Reducerea câștigată la brad vine din sarbatori.js prin window.xmPretNoapte (dacă există).
    const R = window.cbReguli;
    const lei = n => `${n.toLocaleString('ro-RO')} RON`;
    const nopti = (ci, co) => {
      const z = [];
      for (const d = new Date(ci + 'T00:00:00'); d < new Date(co + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
        z.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }
      return z;
    };
    const calcPret = () => {
      const checkin  = document.getElementById('checkin')?.value;
      const checkout = document.getElementById('checkout')?.value;
      const guests   = parseInt(document.getElementById('guests')?.value || '2');
      if (!checkin || !checkout) return;

      const zile   = nopti(checkin, checkout);
      const camere = Math.ceil(guests / 2);

      let priceEl = document.getElementById('price-estimate');
      if (!priceEl) {
        priceEl = document.createElement('div');
        priceEl.id = 'price-estimate';
        priceEl.className = 'price-estimate';
        const submitBtn = form.querySelector('button[type="submit"]');
        form.insertBefore(priceEl, submitBtn);
      }
      if (!zile.length) { priceEl.innerHTML = ''; return; }

      const craciun = zile.filter(R.esteCraciun).length;
      const iarna   = zile.filter(k => R.esteIarna(k) && !R.esteCraciun(k));
      const vara    = zile.length - craciun - iarna.length;
      const nN = n => n === 1 ? '1 noapte' : `${n} nopți`;
      const randuri = [];
      let total = 0;

      if (craciun) {
        // prețul întreg pe nopți, apoi reducerea pachetului de Crăciun (3 nopți: 9.000 → 8.000)
        const intreg = craciun * R.pretCasa;
        const reducere = craciun >= 3 ? 3 * R.pretCasa - R.pachetCraciun : 0;
        randuri.push([`Toată casa de Crăciun · ${nN(craciun)} × ${lei(R.pretCasa)}`, intreg]);
        if (reducere > 0) randuri.push(['🎄 Oferta de Crăciun', -reducere]);
        total += intreg - reducere;
      }
      if (iarna.length) {
        const preturi = iarna.map(k => window.xmPretNoapte?.(k) ?? R.pretCasa);
        const reduse  = preturi.filter(p => p < R.pretCasa).length;
        const s = preturi.reduce((a, b) => a + b, 0);
        randuri.push([`Toată casa · ${nN(iarna.length)} × ${lei(R.pretCasa)}`, iarna.length * R.pretCasa]);
        if (reduse) randuri.push([`🎁 Cadoul de la brad · ${nN(reduse)}`, s - iarna.length * R.pretCasa]);
        total += s;
      }
      if (vara) {
        const s = vara * camere * R.pretCamera;
        randuri.push([`${camere === 1 ? '1 cameră' : `${camere} camere`} × ${nN(vara)} × ${R.pretCamera} RON`, s]);
        total += s;
      }

      const detaliat = randuri.length > 1;
      priceEl.innerHTML = `
        ${detaliat ? randuri.map(([t, s]) => `<div class="price-row price-sub"><span>${t}</span><span>${s < 0 ? '−' + lei(-s) : lei(s)}</span></div>`).join('') : ''}
        <div class="price-row">
          <span>${detaliat ? 'Total' : randuri[0][0]}</span>
          <strong>${lei(total)}</strong>
        </div>
        <div class="price-note">* Estimare orientativă${craciun || iarna.length ? ' · iarna se închiriază toată casa' : ''}</div>
      `;
      // „Vrei reducere? Împodobește bradul” (din sarbatori.js, doar în sezon și dacă nu a câștigat deja)
      const promo = window.xmPromoBrad?.(zile);
      if (promo) priceEl.appendChild(promo);
    };
    window.cbRecalcPret = calcPret;

    // Datele se afișează frumos („joi, 3 dec. 2026”); valoarea câmpului rămâne YYYY-MM-DD pentru server
    ['checkin', 'checkout'].forEach(id => {
      const inp = document.getElementById(id);
      const box = inp?.closest('.rv-input');
      if (!box) return;
      const lbl = document.createElement('span');
      lbl.className = 'rv-date';
      box.appendChild(lbl);
      const fmtAn = new Intl.DateTimeFormat('ro-RO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      const fmt   = new Intl.DateTimeFormat('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });   // anul doar dacă nu e cel curent
      const arata = () => {
        const ok = /^\d{4}-\d{2}-\d{2}$/.test(inp.value);
        const data = ok ? new Date(inp.value + 'T00:00:00') : null;
        lbl.textContent = data ? (data.getFullYear() === new Date().getFullYear() ? fmt : fmtAn).format(data) : '';
        box.classList.toggle('are-data', ok);
      };
      inp.addEventListener('change', arata);
      form.addEventListener('reset', () => setTimeout(arata));
      arata();
    });

    // Prețul din stânga: arătăm doar blocul sezonului de azi (iarna toată casa, în rest pe camere)
    {
      const d = new Date();
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const sezon = R.esteIarna(k) ? 'iarna' : 'vara';
      document.querySelectorAll('[data-sezon]').forEach(el => { el.hidden = el.dataset.sezon !== sezon; });
    }

    document.getElementById('checkout')?.addEventListener('change', () => {
      calcPret();
      verificaDisponibilitate();
    });
    document.getElementById('guests')?.addEventListener('change', calcPret);

    // Disponibilitate in timp real
    const verificaDisponibilitate = async () => {
      const checkin  = document.getElementById('checkin')?.value;
      const checkout = document.getElementById('checkout')?.value;
      if (!checkin || !checkout || checkout <= checkin) return;

      let dispEl = document.getElementById('disponibilitate');
      if (!dispEl) {
        dispEl = document.createElement('div');
        dispEl.id = 'disponibilitate';
        dispEl.className = 'disponibilitate';
        const checkoutField = document.getElementById('checkout').closest('.field-dates') || document.getElementById('checkout').closest('.field');
        checkoutField.after(dispEl);
      }

      dispEl.innerHTML = `<span style="opacity:.6">⏳ Se verifică disponibilitatea...</span>`;
      dispEl.className = 'disponibilitate';

      try {
        const r = await fetch(
          `https://cheile-branistei-backend-production.up.railway.app/api/rezervari/disponibilitate?checkin=${checkin}&checkout=${checkout}`
        );
        const data = await r.json();

        if (data.regula) {
          dispEl.className = 'disponibilitate indisponibil';
          dispEl.textContent = `❌ ${data.regula}`;
        } else if (data.casaIntreaga) {
          dispEl.className = `disponibilitate ${data.camereLibere > 0 ? 'disponibil' : 'indisponibil'}`;
          dispEl.innerHTML = data.camereLibere > 0
            ? `✅ <strong>Toată casa</strong> este liberă în perioada selectată`
            : `❌ Casa nu este liberă integral în perioada selectată`;
        } else if (data.camereLibere === 0) {
          dispEl.className = 'disponibilitate indisponibil';
          dispEl.innerHTML = `❌ Nu mai sunt camere disponibile în perioada selectată`;
        } else if (data.camereLibere <= 2) {
          dispEl.className = 'disponibilitate atentie';
          const strLib  = data.camereLibere === 1 ? '1 cameră' : `${data.camereLibere} camere`;
          const strDisp = data.camereLibere === 1 ? 'disponibilă' : 'disponibile';
          const strPers = data.persoaneMax  === 1 ? '1 persoană' : `${data.persoaneMax} persoane`;
          dispEl.innerHTML = `⚠️ Doar <strong>${strLib}</strong> ${strDisp} — maxim <strong>${strPers}</strong>`;
        } else {
          dispEl.className = 'disponibilitate disponibil';
          const strLibOk  = data.camereLibere === 1 ? '1 cameră' : `${data.camereLibere} camere`;
          const strDispOk = data.camereLibere === 1 ? 'disponibilă' : 'disponibile';
          dispEl.innerHTML = `✅ <strong>${strLibOk}</strong> ${strDispOk} în perioada selectată`;
        }
      } catch (err) {
        dispEl.innerHTML = '';
      }
    };

    // Submit formular
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const oldBtnHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<svg class="icon icon-spin" aria-hidden="true"><use href="#spinner"></use></svg> Se trimite...';

      const checkin  = document.getElementById('checkin')?.value;
      const checkout = document.getElementById('checkout')?.value;
      const guests   = document.getElementById('guests')?.value;
      const note     = document.getElementById('note')?.value    || '';
      const nume     = document.getElementById('nume')?.value    || '';
      const telefon  = document.getElementById('telefon')?.value || '';
      const email    = document.getElementById('email')?.value   || '';

      // Validare date
      const azi2 = new Date().toISOString().split('T')[0];
      if (checkin < azi2) {
        showModal({
          icon: '⚠', iconClass: 'error',
          title: 'Dată invalidă',
          msg: 'Check-in-ul nu poate fi în trecut.',
          actions: [{ href: '#', label: 'Închide', action: 'close' }]
        });
        return;
      }
      if (checkout <= checkin) {
        showModal({
          icon: '⚠', iconClass: 'error',
          title: 'Dată invalidă',
          msg: 'Check-out-ul trebuie să fie după check-in.',
          actions: [{ href: '#', label: 'Închide', action: 'close' }]
        });
        return;
      }

      try {
        const response = await fetch('https://cheile-branistei-backend-production.up.railway.app/api/rezervari', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nume,
            telefon,
            email,
            dataCheckin:  checkin,
            dataCheckout: checkout,
            nrPersoane:   parseInt(guests),
            mesaj:        note
          })
        });

        const data = await response.json();

        if (response.ok) {
          showModal({
            icon:      '✓',
            iconClass: 'success',
            title:     'Rezervare trimisă!',
            msg:       `Bună, <strong>${nume}</strong>! Am primit cererea ta pentru
                        <strong>${checkin}</strong> → <strong>${checkout}</strong>.<br><br>
                        Te contactăm la <strong>${telefon}</strong> pentru confirmare.`,
            actions: [
              {
                href:    `https://wa.me/${phone}?text=${encodeURIComponent(
                           `Bună! Am trimis o rezervare pentru ${nume}, ${checkin} → ${checkout}, ${guests} persoane.`
                         )}`,
                target:  '_blank',
                icon:    'whatsapp',
                label:   'Scrie-ne pe WhatsApp',
                primary: true
              },
              {
                href:   '#',
                label:  'Rezervare nouă',
                action: 'reset'
              }
            ]
          });

        } else {
          showModal({
            icon:      '⚠',
            iconClass: 'error',
            title:     'Rezervare indisponibilă',
            msg:       data.eroare || 'A apărut o eroare. Te rugăm să încerci din nou.',
            actions: [{ href: '#', label: 'Închide', action: 'close' }]
          });
        }

      } catch (err) {
        showModal({
          icon:      '⚠',
          iconClass: 'error',
          title:     'Eroare conexiune',
          msg:       'Nu s-a putut conecta la server. Încearcă din nou.',
          actions: [{ href: '#', label: 'Închide', action: 'close' }]
        });
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = oldBtnHTML;
      }
    });
  })();


  /* =========================
     7) SCROLL REVEAL – FEATURES
     ========================= */
  (() => {
    const items = document.querySelectorAll('.feature');
    if (!items.length) return;

    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('show');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });

    items.forEach(el => obs.observe(el));
  })();


  /* =========================
     8) SCROLL REVEAL – GLOBAL
     ========================= */
  (() => {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('show');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.18 });

    items.forEach(el => {
      const d = el.getAttribute('data-delay');
      if (d) el.style.setProperty('--d', `${d}ms`);
      obs.observe(el);
    });
  })();


  /* =========================
     9) CAROUSEL arrows
     ========================= */
  (() => {
    const root = document.querySelector('[data-carousel]');
    if (!root) return;

    const track = root.querySelector('[data-track]');
    const prev  = root.querySelector('[data-prev]');
    const next  = root.querySelector('[data-next]');
    if (!track || !prev || !next) return;

    const step = () => {
      const card = track.querySelector('.car-card');
      if (!card) return 300;
      const gap = parseFloat(getComputedStyle(track).gap || '0');
      return card.getBoundingClientRect().width + gap;
    };

    prev.addEventListener('click', () =>
      track.scrollBy({ left: -step(), behavior: 'smooth' })
    );

    next.addEventListener('click', () =>
      track.scrollBy({ left: step(), behavior: 'smooth' })
    );
  })();

  /* ==============================
     STICKY CTA (mobil)
     ============================== */
  (() => {
    const cta     = document.getElementById('stickyCta');
    const hero    = document.querySelector('.hero');
    const rezerva = document.getElementById('rezerva');
    if (!cta || !hero || !rezerva || !('IntersectionObserver' in window)) return;

    let heroVizibil = true;
    let formVizibil = false;

    const update = () => {
      cta.classList.toggle('show', !heroVizibil && !formVizibil);
    };

    new IntersectionObserver(([e]) => {
      heroVizibil = e.isIntersecting;
      update();
    }, { threshold: 0.1 }).observe(hero);

    new IntersectionObserver(([e]) => {
      formVizibil = e.isIntersecting;
      update();
    }, { threshold: 0.1 }).observe(rezerva);
  })();

  /* ==============================
     CALENDAR DISPONIBILITATE
     ============================== */
  (() => {
    const inCheckin  = document.getElementById('checkin');
    const inCheckout = document.getElementById('checkout');
    const form       = document.getElementById('reserveForm');
    if (!inCheckin || !inCheckout || !form) return;

    const API  = 'https://cheile-branistei-backend-production.up.railway.app/api';
    const LUNI = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
                  'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
    const ZILE = ['L','Ma','Mi','J','V','S','D'];

    let libere  = null;   // { 'YYYY-MM-DD': camere libere }
    let pret    = 250;
    let lunaOfs = 0;
    let maxOfs  = 3;
    let selIn   = '';
    let selOut  = '';

    const pop = document.createElement('div');
    pop.className = 'cal-pop';
    pop.innerHTML = `
      <button type="button" class="cal-inchide" aria-label="Închide">✕</button>
      <div class="cal-head">
        <button type="button" class="cal-nav" data-cal-prev aria-label="Luna anterioară">‹</button>
        <div class="cal-luna"></div>
        <button type="button" class="cal-nav" data-cal-next aria-label="Luna următoare">›</button>
      </div>
      <div class="cal-grid"></div>
      <div class="cal-hint"></div>`;
    document.body.appendChild(pop);

    const backdrop = document.createElement('div');
    backdrop.className = 'cal-backdrop';
    document.body.appendChild(backdrop);

    const grid    = pop.querySelector('.cal-grid');
    const lblLuna = pop.querySelector('.cal-luna');
    const hint    = pop.querySelector('.cal-hint');
    const btnPrev = pop.querySelector('[data-cal-prev]');
    const btnNext = pop.querySelector('[data-cal-next]');

    const azi = () => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };
    const iso = d =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Daca API-ul nu raspunde, revenim la calendarul nativ al browserului
    const fallbackNativ = () => {
      [inCheckin, inCheckout].forEach(el => {
        el.readOnly = false;
        el.type = 'date';
      });
      pop.remove();
      backdrop.remove();
    };

    // Se reincarca la fiecare deschidere, ca sa reflecte mereu rezervarile noi;
    // daca cererea esueaza dar avem date dintr-o deschidere anterioara, le pastram
    const incarca = async () => {
      try {
        const r = await fetch(`${API}/rezervari/calendar?zile=120`);
        if (!r.ok) return !!libere;
        const data = await r.json();
        const noi = data.libere || {};
        const chei = Object.keys(noi);
        if (!chei.length) return !!libere;
        libere = noi;
        pret   = data.pretCamera || 250;
        if (data.reguli) Object.assign(window.cbReguli, data.reguli);
        const ultima = new Date(chei[chei.length - 1] + 'T00:00:00');
        const a = azi();
        maxOfs = (ultima.getFullYear() * 12 + ultima.getMonth())
               - (a.getFullYear() * 12 + a.getMonth());
        return true;
      } catch {
        return !!libere;
      }
    };

    // Prima zi in care nu se mai poate innopta, pornind de la check-in:
    // check-out-ul poate fi cel mult ziua aceea
    const limitaCheckout = () => {
      if (!selIn) return null;
      const d = new Date(selIn + 'T00:00:00');
      for (let i = 0; i < 190; i++) {
        const k = iso(d);
        if (!(k in libere) || libere[k] === 0) return k;
        d.setDate(d.getDate() + 1);
      }
      return null;
    };

    const randeaza = () => {
      const a     = azi();
      const luna  = new Date(a.getFullYear(), a.getMonth() + lunaOfs, 1);
      lblLuna.textContent = `${LUNI[luna.getMonth()]} ${luna.getFullYear()}`;
      btnPrev.disabled = lunaOfs <= 0;
      btnNext.disabled = lunaOfs >= maxOfs;

      const limita = selIn && !selOut ? limitaCheckout() : null;
      const R = window.cbReguli;
      // check-out prea devreme față de minimul de nopți (iarna 2, Crăciun 3)
      const preaScurt = k => {
        if (!selIn || selOut || k <= selIn) return false;
        const z = [];
        for (const d = new Date(selIn + 'T00:00:00'); iso(d) < k; d.setDate(d.getDate() + 1)) z.push(iso(d));
        return z.length < R.minNopti(z);
      };

      let html = ZILE.map(z => `<div class="cal-zh">${z}</div>`).join('');
      const goluri = (luna.getDay() + 6) % 7;
      for (let i = 0; i < goluri; i++) html += '<button type="button" class="cal-zi gol" tabindex="-1"></button>';

      const nrZile = new Date(luna.getFullYear(), luna.getMonth() + 1, 0).getDate();
      for (let zi = 1; zi <= nrZile; zi++) {
        const d = new Date(luna.getFullYear(), luna.getMonth(), zi);
        const k = iso(d);
        const cunoscut = k in libere;
        const trecut   = d < a;
        const plin     = cunoscut && libere[k] === 0;

        let cls = 'cal-zi', jos = '', dis = '';
        if (trecut || !cunoscut) {
          cls += ' trecut'; dis = 'disabled';
        } else if (plin && k !== limita) {
          cls += ' plin'; dis = 'disabled';
          jos = '<span class="zi-pret">–</span>';
        } else if (preaScurt(k) && k !== limita) {
          cls += ' scurt'; dis = 'disabled';
          jos = `<span class="zi-pret">${R.esteIarna(k) ? (R.esteCraciun(k) ? 'pachet' : R.pretCasa) : pret}</span>`;
        } else {
          if (plin && k === limita) cls += ' plin-checkout';
          else if (R.esteIarna(k)) {
            // iarna: toată casa (la Crăciun, pachetul de 3 nopți)
            jos = `<span class="zi-pret">${R.esteCraciun(k) ? 'pachet' : R.pretCasa}</span>`;
            cls += ' casa';
          } else {
            jos = `<span class="zi-pret">${pret}</span>`;
            if (libere[k] <= 2) cls += ' putine';
          }
          if (k === selIn || k === selOut) cls += ' selectat';
          else if (selIn && selOut && k > selIn && k < selOut) cls += ' interval';
        }
        html += `<button type="button" class="${cls}" data-zi="${k}" ${dis}>
                   <span class="zi-nr">${zi}</span>${jos}
                 </button>`;
      }
      grid.innerHTML = html;

      const minim = selIn ? R.minNopti([selIn]) : 1;
      hint.textContent = !selIn
        ? 'Alege data de check-in · iarna se închiriază toată casa'
        : (!selOut ? `Acum alege data de check-out${minim > 1 ? ` · minim ${minim} nopți${R.esteCraciun(selIn) ? ' de Crăciun' : ''}` : ''}`
                   : `${Math.round((new Date(selOut) - new Date(selIn)) / 86400000)} nopți selectate`);
      if (!selIn && !Object.keys(libere).some(R.esteIarna)) hint.textContent = 'Alege data de check-in';
    };

    const aplica = () => {
      inCheckin.value  = selIn;
      inCheckout.value = selOut;
      inCheckin.dispatchEvent(new Event('change'));
      inCheckout.dispatchEvent(new Event('change'));
    };

    const deschide = async () => {
      // Dacă serverul nu răspunde, păstrăm același calendar (check-in + check-out în aceeași fereastră),
      // doar fără zilele ocupate — disponibilitatea reală o verifică oricum serverul la trimitere.
      if (!(await incarca())) {
        if (!libere) {
          libere = {};
          const d = azi();
          for (let i = 0; i < 180; i++) { const k = iso(d); libere[k] = window.cbReguli.esteBlocata(k) ? 0 : 7; d.setDate(d.getDate() + 1); }
          maxOfs = 5;
        }
        if (!libere) { fallbackNativ(); return; }
      }
      pop.classList.add('open');
      backdrop.classList.add('open');
      randeaza();
    };

    const inchide = () => {
      pop.classList.remove('open');
      backdrop.classList.remove('open');
    };

    grid.addEventListener('click', e => {
      const btn = e.target.closest('[data-zi]');
      if (!btn || btn.disabled) return;
      const k = btn.getAttribute('data-zi');
      const limita = selIn && !selOut ? limitaCheckout() : null;

      if (!selIn || selOut || k <= selIn || (limita && k > limita)) {
        if (libere[k] === 0) return;
        selIn  = k;
        selOut = '';
        aplica();
        randeaza();
      } else {
        selOut = k;
        aplica();
        randeaza();
        setTimeout(inchide, 350);
      }
    });

    btnPrev.addEventListener('click', () => { lunaOfs--; randeaza(); });
    btnNext.addEventListener('click', () => { lunaOfs++; randeaza(); });
    pop.querySelector('.cal-inchide').addEventListener('click', inchide);
    backdrop.addEventListener('click', inchide);

    [inCheckin, inCheckout].forEach(el =>
      el.addEventListener('click', deschide)
    );

    document.addEventListener('click', e => {
      if (!pop.classList.contains('open')) return;
      // Elementele redesenate intre timp (zilele din grila) nu mai sunt in DOM
      if (!document.body.contains(e.target)) return;
      if (pop.contains(e.target) || e.target === inCheckin || e.target === inCheckout) return;
      inchide();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') inchide();
    });

    form.addEventListener('reset', () => {
      selIn = ''; selOut = ''; lunaOfs = 0;
      randeaza();
    });

    // Deschidere directa pentru testare vizuala
    if (location.hash === '#caltest') deschide();
  })();

  /* ==============================
     PWA — service worker
     ============================== */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

});