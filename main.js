document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     1) HERO reveal on scroll
     ========================= */
  (() => {
    const hero = document.querySelector('.hero');
    const box  = document.querySelector('.reveal-hero');
    if (!hero || !box) return;

    const revealAt = 40;

    const onScroll = () => {
      const show = window.scrollY > revealAt;
      box.classList.toggle('show', show);
      hero.classList.toggle('hero-scrolled', show);
    };

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
          current = sec.id === 'recenzii' ? '#cazare' : `#${sec.id}`;
          break;
        }
      }

      links.forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === current)
      );
    };

    window.addEventListener('scroll', setActive, { passive:true });
    setActive();
  })();


  /* =========================
     3) NAV shrink on scroll
     ========================= */
  (() => {
    const nav = document.querySelector('nav');
    if (!nav) return;

    const onScroll = () =>
      nav.classList.toggle('nav-scrolled', window.scrollY > 20);

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
    document.querySelectorAll('.mobile-link').forEach(link =>
      link.addEventListener('click', closeMenu)
    );
  })();


  /* =========================
     5) LIGHTBOX (gallery + carousel)
     ========================= */
  (() => {
    const lb    = document.getElementById('lightbox');
    const img   = document.getElementById('lbImg');
    const close = document.getElementById('lbClose');
    if (!lb || !img) return;

    const openLb = (src) => {
      if (!src) return;
      img.src = src;
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
    };

    const closeLb = () => {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      img.src = '';
    };

    document.querySelectorAll('[data-gallery-btn]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const src =
          btn.getAttribute('data-src') ||
          btn.querySelector('img')?.getAttribute('src');
        openLb(src);
      });
    });

    close?.addEventListener('click', closeLb);
    lb.addEventListener('click', e => e.target === lb && closeLb());
    document.addEventListener('keydown', e => e.key === 'Escape' && closeLb());
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

    // Calculator pret
    const calcPret = () => {
      const checkin  = document.getElementById('checkin')?.value;
      const checkout = document.getElementById('checkout')?.value;
      const guests   = parseInt(document.getElementById('guests')?.value || '2');
      if (!checkin || !checkout) return;

      const nopti  = Math.max(0, (new Date(checkout) - new Date(checkin)) / 86400000);
      const camere = Math.ceil(guests / 2);
      const total  = nopti * camere * 250;

      let priceEl = document.getElementById('price-estimate');
      if (!priceEl) {
        priceEl = document.createElement('div');
        priceEl.id = 'price-estimate';
        priceEl.className = 'price-estimate';
        const submitBtn = form.querySelector('button[type="submit"]');
        form.insertBefore(priceEl, submitBtn);
      }

      if (nopti > 0) {
        const strCamere = camere === 1 ? '1 cameră' : `${camere} camere`;
        const strNopti  = nopti  === 1 ? '1 noapte' : `${nopti} nopți`;
        priceEl.innerHTML = `
          <div class="price-row">
            <span>${strCamere} × ${strNopti} × 250 RON</span>
            <strong>${total.toLocaleString('ro-RO')} RON</strong>
          </div>
          <div class="price-note">* Estimare orientativă</div>
        `;
      } else {
        priceEl.innerHTML = '';
      }
    };

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
        const checkoutField = document.getElementById('checkout').closest('.field');
        checkoutField.after(dispEl);
      }

      dispEl.innerHTML = `<span style="opacity:.6">⏳ Se verifică disponibilitatea...</span>`;
      dispEl.className = 'disponibilitate';

      try {
        const r = await fetch(
          `https://cheile-branistei-backend-production.up.railway.app/api/rezervari/disponibilitate?checkin=${checkin}&checkout=${checkout}`
        );
        const data = await r.json();

        if (data.camereLibere === 0) {
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

});