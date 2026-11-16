/* =========================================================
   SĂRBĂTORI — decor de iarnă + oferta de Crăciun
   Fișier independent: ca să dezactivezi tot, scoate linia
   <script src="sarbatori.js"> din index.html.
   Test oricând: ?sarbatori=on  /  ?sarbatori=off
   Mod test:     ?sarbatori=test — sania și jocul apar la fiecare refresh, de la zero
   ========================================================= */
(() => {
  'use strict';

  /* ---------- CONFIGURARE ---------- */
  const SEZON = { start: [11, 15], sfarsit: [1, 10] };  // [luna, zi] — decorul apare în intervalul ăsta
  // Perioada premiului de la brad (folosită la calculul prețului). Nopțile de Crăciun sunt excluse: pentru ele e pachetul de Crăciun.
  const PERIOADA_SARBATORI = { start: [11, 30], sfarsit: [1, 10], exclus: [[12, 23], [12, 27]], text: '30 nov – 22 dec și 28 dec – 10 ian' };

  const API = 'https://cheile-branistei-backend-production.up.railway.app/api';
  const URL_SITE = 'https://cheilebranistei.ro/';

  // Cadoul câștigat la jocul cu bradul (pop-up-ul de la intrare)
  const CADOU = {
    activPanaLa: '2027-01-08',                  // ultima zi în care jocul apare (minim 2 nopți până pe 10 ian)
    reducere:  '-500 RON',
    perioada:  '30 nov – 22 dec și 28 dec – 10 ian',
    pret:      { vechi: '3.000', nou: '2.500', unitate: 'pe noapte · închiriere integrală', economie: 'Economisești 1.000 RON la 2 nopți' },
    conditii:  'Reducerea se aplică la închirierea integrală a casei, pentru minim 2 nopți, între 30 noiembrie – 22 decembrie și 28 decembrie – 10 ianuarie. Pentru Crăciun (23 – 27 decembrie) avem pachetul de Crăciun. Revelionul este deja rezervat integral.',
    mesajRezervare: 'Cadoul de la brad 🎁 — 500 RON/noapte reducere, închiriere integrală, minim 2 nopți (30 nov – 22 dec sau 28 dec – 10 ian)',
    whatsapp: 'Bună! Am câștigat cadoul de la brad 🎁 (500 RON/noapte reducere la închirierea integrală, minim 2 nopți) și aș dori detalii.',
  };

  // Oferta de Crăciun (butonul din hero): pachet toată casa, 3 nopți, în jurul Crăciunului
  const OFERTA = {
    activaPanaLa: '2026-12-27',                 // după Crăciun butonul dispare (jocul cu bradul rămâne până pe 10 ian)
    nume:     'Oferta de Crăciun',
    kicker:   'Ofertă de Crăciun',
    titlu:    'Crăciun ca-n povești, la munte',
    teaser:   'Toată casa doar pentru voi, trei nopți de sărbătoare în inima Bucovinei. Deschide cadoul și vezi ce te așteaptă.',
    hook:     'Toată casa · 3 nopți de Crăciun',
    perioada: 'De Crăciun · minim 3 nopți (ex. 24 – 27 decembrie)',
    reducere: '-1.000 RON',
    include: [
      ['xm-house',      'Toată casa doar pentru voi',  'Închiriere integrală — perfectă pentru familie sau prieteni.'],
      ['moon',          '3 nopți de Crăciun',          'Alegi tu zilele din jurul Crăciunului, de exemplu 24 – 27 decembrie.'],
      ['xm-tree',       'Casă de sărbătoare',          'Brad împodobit și atmosferă de poveste în toată casa.'],
      ['fire',          'Seri la foc în foișor',       'Grătar, povești și cer înstelat.'],
      ['xm-snowflake',  'Pârtia Rarău la 35 de minute','Schi ziua, liniște seara.'],
    ],
    pret:     { vechi: '9.000', nou: '8.000', unitate: 'pachet 3 nopți · toată casa', economie: 'Economisești 1.000 RON' },
    conditii: 'Pachet pentru închirierea integrală a casei, 3 nopți în perioada Crăciunului (în limita disponibilității).',
    mesajRezervare: 'Doresc Oferta de Crăciun 🎄 — toată casa, pachet 3 nopți (8.000 RON)',
    whatsapp: 'Bună! Aș dori detalii despre Oferta de Crăciun 🎄 (toată casa, pachet 3 nopți, 8.000 RON)',
  };

  const TELEFON_WA = '40733623000';
  const PAUZA_DUPA_INCHIDERE = 864e5;            // după ce sare peste joc, intro-ul nu mai apare singur o zi

  /* ---------- ACTIVARE ---------- */
  const param = new URLSearchParams(location.search).get('sarbatori');
  const azi = new Date();
  const md = (azi.getMonth() + 1) * 100 + azi.getDate();
  const inSezon = md >= SEZON.start[0] * 100 + SEZON.start[1] || md <= SEZON.sfarsit[0] * 100 + SEZON.sfarsit[1];
  const modTest = param === 'test';   // intro + joc la fiecare încărcare, cadoul „uitat”
  if (param === 'off' || (!inSezon && param !== 'on' && !modTest)) return;

  const panaLa = d => param === 'on' || modTest || azi <= new Date(d + 'T23:59:59');
  const ofertaActiva = panaLa(OFERTA.activaPanaLa);
  const jocActiv = panaLa(CADOU.activPanaLa);
  const fataMiscare = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const AN = azi.getMonth() === 0 ? azi.getFullYear() - 1 : azi.getFullYear();
  const CRACIUN = new Date(AN, 11, 24);

  // Prețul unei nopți cu premiul de la brad (folosit de calculatorul de preț din main.js).
  // null = fără reducere (nu a câștigat sau noaptea nu e în perioada premiului).
  const noapteCuPremiu = k => {
    const P = PERIOADA_SARBATORI, md = +k.slice(5, 7) * 100 + +k.slice(8, 10);
    const start = `${AN}-${String(P.start[0]).padStart(2, '0')}-${String(P.start[1]).padStart(2, '0')}`;
    const sfarsit = `${AN + 1}-${String(P.sfarsit[0]).padStart(2, '0')}-${String(P.sfarsit[1]).padStart(2, '0')}`;
    if (k < start || k >= sfarsit) return false;
    return !(md >= P.exclus[0][0] * 100 + P.exclus[0][1] && md <= P.exclus[1][0] * 100 + P.exclus[1][1]);
  };
  const aCastigat = () => stoc.get(localStorage, 'xm-cadou') === '1';
  const reducerePeNoapte = () => +CADOU.pret.vechi.replace('.', '') - +CADOU.pret.nou.replace('.', '');

  window.xmPretNoapte = k => aCastigat() && noapteCuPremiu(k) ? +CADOU.pret.nou.replace('.', '') : null;

  // Sub prețul din formular: „Vrei reducere? Împodobește bradul” — doar dacă nu a câștigat încă
  // și perioada aleasă are nopți în perioada premiului. Întoarce un element sau null.
  window.xmPromoBrad = zile => {
    if (aCastigat() || !stare.deschideJoc) return null;
    const n = zile.filter(noapteCuPremiu).length;
    if (!n) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'xm-promo';
    b.innerHTML = `<span class="xm-promo-ico">🎄</span><span><strong>Vrei ${(n * reducerePeNoapte()).toLocaleString('ro-RO')} RON reducere?</strong>Împodobește bradul și câștigi ${reducerePeNoapte()} RON pe noapte</span><span class="xm-promo-go">›</span>`;
    b.addEventListener('click', () => stare.deschideJoc());
    return b;
  };

  // Stare comună (modul „Seară de iarnă” influențează ninsoarea)
  const stare = { noapte: false, reinit: null, deschideOferta: null, deschideJoc: null };

  const stoc = {
    get: (s, k) => { try { return s.getItem(k); } catch { return null; } },
    set: (s, k, v) => { try { s.setItem(k, v); } catch {} },
  };

  /* ---------- UTILE ---------- */
  const rng = seed => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const f = n => n.toFixed(1);
  let uid = 0;

  /* ---------- CSS ---------- */
  const css = `
.xm-snow{position:fixed;top:0;left:0;width:100%;height:100vh;height:100lvh;pointer-events:none;z-index:1500}

.xm-garland{position:absolute;left:0;right:0;top:calc(100% - 12px);height:66px;pointer-events:none;z-index:1}
.xm-garland svg,.xm-card-garland svg{display:block;width:100%;height:100%;overflow:visible}
.xm-gl{position:relative;width:100%;height:100%}
/* ghirlanda din meniul de pe telefon, sub logo */
.xm-mm-garland{position:absolute;left:0;right:0;top:calc(100% - 12px);height:56px;pointer-events:none;z-index:1}
.xm-on .mobile-nav{padding-top:48px}
.xm-gl svg{position:absolute;inset:0;display:block;width:100%;height:100%;overflow:visible}
.xm-gl-n,.xm-gl-l{pointer-events:none}
.xm-gl-n{will-change:transform}   /* crenguța: strat propriu, desenat o singură dată */
/* beculețele din brad nu sclipesc „pe ascuns” cât steaua e stinsă (oricum nu se văd) */
.xm-tree-svg:not(.lit) .xm-light{animation:none}
.xm-bauble{pointer-events:auto;cursor:pointer;animation:xmSwing 3.4s ease-in-out infinite alternate}
.xm-bauble.jingle{animation:xmJingle 1.3s ease-out}
@keyframes xmSwing{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
@keyframes xmJingle{0%{transform:rotate(0)}12%{transform:rotate(18deg)}30%{transform:rotate(-14deg)}50%{transform:rotate(9deg)}70%{transform:rotate(-5deg)}100%{transform:rotate(0)}}
.xm-light{animation:xmTwinkle 2.2s ease-in-out infinite}
/* la scroll globulețele de sub meniu se strâng; rămâne doar crenguța cu beculețe */
.xm-garland{transition:transform .4s ease}
.xm-garland .xm-baubles{transition:transform .55s cubic-bezier(.3,1.5,.5,1),opacity .3s ease}
nav.nav-scrolled .xm-garland{transform:translateY(-3px)}
nav.nav-scrolled .xm-garland .xm-baubles{transform:translateY(-30px);opacity:0;pointer-events:none;transition:transform .35s ease-in,opacity .3s ease}
nav.nav-scrolled .xm-garland .xm-bauble{pointer-events:none}
@keyframes xmTwinkle{0%,100%{opacity:1}50%{opacity:.3}}

.xm-cap{position:absolute;left:10px;right:10px;top:-9px;height:20px;pointer-events:none;z-index:3;filter:drop-shadow(0 2px 2px rgba(0,0,0,.28))}
.xm-cap svg{display:block;width:100%;height:100%}
.zona-card,.review-card{position:relative}

.xm-on .divider{position:relative;width:110px;background:linear-gradient(90deg,transparent,rgba(214,179,106,.85) 20%,rgba(214,179,106,.85) 38%,transparent 38%,transparent 62%,rgba(214,179,106,.85) 62%,rgba(214,179,106,.85) 80%,transparent)}
.xm-on .divider::after{content:"";position:absolute;left:50%;top:50%;width:18px;height:18px;transform:translate(-50%,-50%);background:no-repeat center/contain url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d6b36a' stroke-width='1.6' stroke-linecap='round'%3E%3Cpath d='M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 2l-2.4 2.4M12 2l2.4 2.4M12 22l-2.4-2.4M12 22l2.4-2.4M3.3 7l3.3.9M3.3 7l.9-3.3M20.7 17l-3.3-.9M20.7 17l-.9 3.3M3.3 17l.9 3.3M3.3 17l3.3-.9M20.7 7l-.9-3.3M20.7 7l-3.3.9'/%3E%3C/svg%3E")}

.xm-hero-chip{display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:.55rem 1rem;border-radius:999px;border:1px solid rgba(214,179,106,.55);background:linear-gradient(180deg,rgba(176,46,58,.55),rgba(120,26,36,.55));color:#fff;font:700 .68rem 'Montserrat',sans-serif;letter-spacing:1.8px;text-transform:uppercase;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}
.xm-hero-chip:hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(0,0,0,.4)}
.xm-hero-chip .icon{color:#f0d58f;font-size:1rem}

.xm-overlay{position:fixed;inset:0;z-index:4100;display:none;place-items:center;padding:34px 16px 20px;background:rgba(4,12,9,.68);backdrop-filter:blur(6px);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain}
.xm-overlay.open{display:grid}
html.xm-modal body{overflow:hidden}
.xm-card:focus{outline:none}
.xm-card{position:relative;margin:auto;width:min(100%,440px);padding:50px 26px 24px;text-align:center;border-radius:22px;border:1px solid rgba(214,179,106,.42);background:radial-gradient(520px 280px at 50% 0%,rgba(214,179,106,.16),transparent 70%),linear-gradient(165deg,#173323,#0c1e16);box-shadow:0 30px 80px rgba(0,0,0,.55);animation:xmIn .5s cubic-bezier(.2,.9,.3,1.15)}
@keyframes xmIn{from{opacity:0;transform:translateY(24px) scale(.95)}to{opacity:1;transform:none}}
.xm-card-garland{position:absolute;left:-12px;right:-12px;top:-20px;height:60px;pointer-events:none;z-index:2}
.xm-flurry{position:absolute;inset:0;overflow:hidden;border-radius:22px;pointer-events:none}
.xm-flurry i{position:absolute;top:-8px;border-radius:50%;background:#fff;opacity:.7;animation:xmFall linear infinite}
@keyframes xmFall{to{transform:translate(var(--dx),560px)}}
.xm-x{position:absolute;top:-13px;right:-13px;z-index:4;width:34px;height:34px;border-radius:50%;border:1px solid rgba(214,179,106,.5);background:#16301f;color:var(--muted);display:grid;place-items:center;cursor:pointer;font-size:14px;transition:.18s ease}
.xm-x:hover{color:var(--text);border-color:var(--accent)}

.xm-stage{position:relative;z-index:1}
.xm-stage[hidden]{display:none}
.xm-s2{animation:xmRise .55s ease both}
@keyframes xmRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

.xm-gift{position:relative;display:block;width:150px;height:140px;margin:-6px auto 6px;padding:0;border:0;background:none;cursor:pointer}
.xm-gift::before{content:"";position:absolute;inset:-10px;border-radius:50%;background:radial-gradient(circle,rgba(240,213,143,.45),transparent 65%);opacity:0;transition:opacity .5s ease}
.xm-gift:hover::before{opacity:.5}
.xm-gift svg{position:relative;width:100%;height:100%;overflow:visible;transform-origin:50% 92%;animation:xmShake 3s ease-in-out infinite}
.xm-gift:hover svg{animation-duration:1.2s}
@keyframes xmShake{0%,68%,100%{transform:rotate(0)}74%{transform:rotate(-6deg)}80%{transform:rotate(6deg)}86%{transform:rotate(-4deg)}92%{transform:rotate(2deg)}}
.xm-lid{transform-box:fill-box;transform-origin:50% 100%;transition:transform .75s cubic-bezier(.3,1.5,.5,1),opacity .45s ease .35s}
.xm-gift.opened svg{animation:none}
.xm-gift.opened::before{opacity:1}
.xm-gift.opened .xm-lid{transform:translate(22px,-78px) rotate(26deg);opacity:0}
.xm-burst{position:absolute;left:50%;top:44%;width:0;height:0}
.xm-burst i{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;animation:xmBurst .9s cubic-bezier(.2,.8,.3,1) forwards}
@keyframes xmBurst{from{transform:rotate(var(--a)) translateY(0) scale(1);opacity:1}to{transform:rotate(var(--a)) translateY(calc(var(--d) * -1)) scale(.25);opacity:0}}

.xm-kicker{color:rgba(214,179,106,.95);font:700 .7rem 'Montserrat',sans-serif;letter-spacing:.22em;text-transform:uppercase;margin-bottom:6px}
.xm-card h3{font-family:'Prata',serif;color:var(--text);font-size:1.5rem;line-height:1.25;margin:0 0 10px;letter-spacing:.4px}
.xm-text{color:var(--muted);font-size:.92rem;line-height:1.65;margin:0 auto 16px;max-width:34ch}
.xm-hook{display:inline-flex;align-items:center;gap:10px;padding:.45rem .9rem;border-radius:999px;background:rgba(214,179,106,.12);border:1px solid rgba(214,179,106,.35);color:var(--text);font-size:.78rem;font-weight:600;margin-bottom:16px}
.xm-hook b{color:#10241c;background:linear-gradient(180deg,#ddbc77,#c6a054);padding:.1rem .5rem;border-radius:999px;font-size:.75rem}

.xm-count{display:flex;justify-content:center;gap:8px;margin:0 0 18px}
.xm-count div{min-width:62px;padding:8px 6px 6px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid var(--line)}
.xm-count strong{display:block;font-family:'Prata',serif;font-size:1.35rem;color:var(--accent);line-height:1.1}
.xm-count span{font-size:.58rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}
.xm-count-lbl{font-size:.68rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin:-8px 0 8px}

.xm-later{display:block;margin:12px auto 0;border:0;background:none;color:var(--muted);font:500 .78rem 'Montserrat',sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.xm-later:hover{color:var(--text)}

.xm-period{display:inline-flex;align-items:center;gap:8px;color:var(--text);font-size:.85rem;font-weight:600;margin-bottom:16px}
.xm-period .icon{color:var(--accent)}
.xm-list{list-style:none;margin:0 0 16px;padding:0;text-align:left;display:grid;gap:10px}
.xm-list li{display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border-radius:14px;background:rgba(0,0,0,.18);border:1px solid var(--line);opacity:0;animation:xmRise .45s ease forwards}
.xm-list .icon{box-sizing:border-box;flex:0 0 34px;width:34px;height:34px;padding:9px;border-radius:10px;border:1px solid rgba(214,179,106,.28);background:rgba(214,179,106,.1);color:var(--accent)}
.xm-list strong{display:block;color:var(--text);font-size:.86rem}
.xm-list span{display:block;color:var(--muted);font-size:.8rem;line-height:1.45}
.xm-price{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-radius:14px;border:1px solid rgba(214,179,106,.4);background:linear-gradient(180deg,rgba(214,179,106,.14),rgba(214,179,106,.05));text-align:left;margin-bottom:10px}
.xm-price s{color:var(--muted);font-size:.8rem;margin-right:6px}
.xm-price strong{color:var(--accent);font-family:'Prata',serif;font-size:1.45rem}
.xm-price small{display:block;color:var(--muted);font-size:.72rem;letter-spacing:.5px}
.xm-badge{flex:0 0 auto;display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d9505a,#8a2029);color:#fff;font-weight:700;font-size:.95rem;border:2px solid rgba(240,213,143,.7);transform:rotate(-10deg);box-shadow:0 8px 20px rgba(0,0,0,.35)}
.xm-ins{display:flex;flex-direction:column;align-items:center;line-height:1}
.xm-ins small{font-size:.5em;letter-spacing:1px;margin-top:2px;font-weight:700}
.xm-badge{width:64px;height:64px;font-size:.92rem}
.xm-save{display:block;margin-top:4px;font-style:normal;font-size:.74rem;font-weight:600;color:#8fe0a8}
/* „Vrei reducere? Împodobește bradul” sub prețul din formular */
.xm-promo{display:flex;align-items:center;gap:12px;width:100%;margin:12px 0 0;padding:12px 14px;border-radius:12px;border:1px solid rgba(226,96,106,.45);background:linear-gradient(135deg,rgba(168,40,52,.35),rgba(168,40,52,.12));color:var(--text);text-align:left;cursor:pointer;font-family:inherit;transition:transform .18s ease,border-color .18s ease}
.xm-promo:hover{transform:translateY(-1px);border-color:rgba(243,220,157,.6)}
.xm-promo-ico{font-size:1.4rem;line-height:1}
.xm-promo strong{display:block;color:#f3dc9d;font-size:.88rem}
.xm-promo span:nth-child(2){flex:1;font-size:.76rem;color:var(--muted);line-height:1.4}
.xm-promo-go{font-size:1.5rem;color:#f3dc9d;line-height:1}
/* Revelion — sold out */
.xm-nye{position:relative;display:flex;align-items:center;gap:12px;margin:0 0 16px;padding:12px 14px;border-radius:14px;text-align:left;border:1px dashed rgba(243,220,157,.4);background:radial-gradient(240px 120px at 20% 50%,rgba(243,220,157,.10),transparent 70%),rgba(0,0,0,.2);overflow:hidden}
.xm-nye-art{flex:0 0 74px;width:74px;height:auto}
.xm-nye-txt strong{display:block;font-family:"Prata",serif;font-weight:400;color:#f3dc9d;font-size:1.05rem}
.xm-nye-txt > span{display:block;color:var(--muted);font-size:.76rem;line-height:1.4;margin-top:2px}
.xm-stamp{display:inline-block;vertical-align:middle;margin-left:8px;transform:rotate(-8deg);padding:2px 8px;border:2.5px solid #e2606a;border-radius:8px;color:#e2606a;font:800 .64rem "Montserrat",sans-serif;letter-spacing:1.6px;text-transform:uppercase;background:rgba(10,14,20,.55);box-shadow:0 0 0 2px rgba(226,96,106,.18) inset;opacity:.92}
@media (max-width:380px){ .xm-nye-art{flex-basis:58px;width:58px} }
.xm-terms{color:rgba(245,241,232,.55);font-size:.72rem;line-height:1.5;margin:0 0 16px}
.xm-actions{display:grid;gap:10px}
.xm-back{right:auto;left:-13px;font-size:20px;line-height:1;padding-bottom:3px}
.xm-back[hidden]{display:none}

.xm-fab{position:fixed;left:18px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:1900;width:56px;height:56px;padding:0;border-radius:50%;border:1px solid rgba(240,213,143,.7);background:radial-gradient(circle at 35% 30%,#c9424d,#7d1d26);color:#f7e2a8;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.4);transform:scale(0);transition:transform .4s cubic-bezier(.3,1.6,.5,1)}
.xm-fab.show{transform:scale(1)}
.xm-fab .icon{width:26px;height:26px}
.xm-fab::after{content:"";position:absolute;inset:-1px;border-radius:50%;border:2px solid rgba(240,213,143,.7);animation:xmPing 2.6s ease-out infinite}
@keyframes xmPing{0%{transform:scale(1);opacity:.8}70%,100%{transform:scale(1.6);opacity:0}}
.xm-fab-tip{position:absolute;left:68px;top:50%;transform:translateY(-50%);white-space:nowrap;background:#162e22;color:#fff;padding:7px 12px;border-radius:10px;border:1px solid rgba(245,241,232,.12);font-size:.74rem;opacity:0;pointer-events:none;transition:.2s ease}
.xm-fab:hover .xm-fab-tip{opacity:1}
/* paleta de sărbători: accente de roșu-catifea peste verde și auriu */
html.xm-on body{background:radial-gradient(800px 520px at 100% 22%,rgba(168,40,52,.13),transparent 62%),radial-gradient(800px 520px at 0% 64%,rgba(168,40,52,.10),transparent 62%),radial-gradient(1100px 600px at 15% 0%,rgba(214,179,106,.10),transparent 62%),linear-gradient(180deg,var(--bg),var(--bg2))}
.xm-on .section h2::before{content:"";display:block;width:46px;height:28px;margin:0 auto 6px;background:no-repeat center/contain url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 22'%3E%3Cellipse cx='10' cy='14' rx='9' ry='4' transform='rotate(-20 10 14)' fill='%232a7248'/%3E%3Cellipse cx='26' cy='14' rx='9' ry='4' transform='rotate(20 26 14)' fill='%231d5e3b'/%3E%3Cpath d='M2.5 17L17 11.5M33.5 17L19 11.5' stroke='%230f3b26' stroke-width='.9'/%3E%3Ccircle cx='14.5' cy='10' r='3' fill='%23c8414b'/%3E%3Ccircle cx='21.5' cy='10' r='3' fill='%23b8343f'/%3E%3Ccircle cx='18' cy='5.5' r='3' fill='%23d9505a'/%3E%3Ccircle cx='17' cy='4.6' r='.9' fill='%23fff' opacity='.7'/%3E%3C/svg%3E")}

/* fulgii de la click încurajează click-urile — imaginile nu se mai selectează la dublu-click */
.xm-on img{-webkit-user-select:none;user-select:none;-webkit-user-drag:none}

/* caseta din hero nu mai intră sub bară + ghirlandă (globulețele atârnă ~60px) */
.xm-on .hero{padding-top:125px}   /* poza de iarnă e în index.html, ca să apară de la prima afișare */
@media (max-height:820px){ .xm-on .hero{padding-bottom:8vh} }
/* pe telefon caseta stă centrată, cu loc jos pentru cadoul plutitor și WhatsApp (altfel acopereau butonul de ofertă) */
@media (max-width:600px){ .xm-on .hero{padding-top:115px;padding-bottom:112px;justify-content:center} }


/* nopți libere de sărbători */

/* confirmare festivă la rezervare */
.xm-confirm{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;font-family:'Prata',serif;color:#f3dc9d;font-size:1.08rem}
.xm-confirm .icon{color:#6fd08c}
.xm-confetti{position:absolute;inset:0;overflow:hidden;border-radius:20px;pointer-events:none}
.xm-confetti i{position:absolute;top:-12px;border-radius:50%;animation:xmConf linear forwards}
@keyframes xmConf{to{transform:translate(var(--dx),540px) rotate(320deg);opacity:0}}

/* brad de împodobit + felicitare */
.xm-extra{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-top:22px;text-align:center}
.xm-box{position:relative;border-radius:18px;border:1px solid var(--line);background:rgba(0,0,0,.16);padding:22px 20px 20px}
.xm-box h3{font-family:'Prata',serif;color:var(--accent);font-size:1.25rem;margin:0 0 6px}
.xm-box p{font-size:.9rem!important;line-height:1.6!important;margin:0 auto 12px!important}
.xm-tree-svg{display:block;width:min(100%,250px);height:auto;margin:0 auto;cursor:pointer;touch-action:manipulation;outline:none;border-radius:12px}
.xm-tree-svg:focus-visible{box-shadow:0 0 0 2px rgba(214,179,106,.8)}
.xm-tstar{transition:fill .4s ease,filter .4s ease;transform-box:fill-box;transform-origin:center}
.xm-tree-svg.lit .xm-tstar{fill:#f6d77e;filter:drop-shadow(0 0 6px rgba(255,220,120,.95));animation:xmStar 2.4s ease-in-out infinite}
@keyframes xmStar{50%{transform:scale(1.12) rotate(8deg)}}
.xm-tlights{opacity:0;transition:opacity .6s ease}
.xm-tree-svg.lit .xm-tlights{opacity:1}
.xm-tb{transform-box:fill-box;transform-origin:50% 0;animation:xmPop .45s cubic-bezier(.3,1.7,.5,1)}
@keyframes xmPop{from{transform:scale(0)}to{transform:scale(1)}}
.xm-tree-bar{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:.78rem;color:var(--muted)}
.xm-tree-bar b{color:var(--accent)}
.xm-linkbtn{border:0;background:none;color:var(--muted);font:500 .76rem 'Montserrat',sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.xm-linkbtn:hover{color:var(--text)}
.xm-win{margin-top:12px;animation:xmRise .5s ease both}
.xm-win strong{display:block;font-family:'Prata',serif;color:#f3dc9d;font-size:1.05rem;margin-bottom:10px}
/* închidere lină a ferestrelor */
.xm-overlay.closing{animation:xmOut .38s ease forwards}
@keyframes xmOut{to{opacity:0}}

/* intro: sania lui Moș Crăciun aduce jocul */
/* fără blur în intro: blurul se recalcula la fiecare cadru și sacada animația pe telefon */
.xm-intro{-webkit-backdrop-filter:none;backdrop-filter:none;background:radial-gradient(900px 520px at 50% 8%,rgba(120,150,215,.2),transparent 60%),rgba(3,8,20,.84)}
/* cardul e pregătit (rasterizat) dinainte, cât zboară sania — altfel telefonul îl desena abia la cădere */
.xm-card.xm-wait{opacity:.001;pointer-events:none;animation:none;will-change:transform,opacity}
.xm-card.xm-drop{animation:xmDrop 1.1s cubic-bezier(.22,.8,.3,1) both;will-change:transform,opacity}
/* cât timp vine cardul, fereastra nu arată bare de derulare */
.xm-overlay.xm-anim{overflow:hidden}
.xm-card.xm-landed{animation:none;will-change:transform}   /* rămâne pe stratul pregătit — fără redesenare la aterizare */
/* pe telefon, decorul de pe card stă pe loc (globulețe, beculețe, fulgi): pe ecran mic nu se simte lipsa, dar cardul e fluid */
@media (pointer:coarse){ .xm-card-garland .xm-bauble,.xm-card-garland .xm-light,.xm-flurry i{animation:none!important} .xm-flurry{display:none} }

@keyframes xmDrop{0%{opacity:0;transform:translate(var(--fx),var(--fy)) scale(.7) rotate(-10deg)}40%{opacity:1}82%{transform:translate(0,6px) scale(1) rotate(0)}100%{opacity:1;transform:none}}
.xm-sleigh{position:fixed;left:0;top:0;z-index:5;width:min(442px,83vw);pointer-events:none;transform:translate(-120%,24vh);will-change:transform}
.xm-sleigh{aspect-ratio:390/112}
.xm-sleigh img{position:absolute;inset:0;display:block;width:100%;height:100%;will-change:opacity}
.xm-sleigh img+img,.xm-sleigh.alt img{opacity:0}
.xm-sleigh.alt img+img{opacity:1}
/* cât e deschisă o fereastră, decorul din spate stă pe loc (pe telefon redesenarea lui încetinea animațiile) */
.xm-modal .xm-garland *,.xm-modal .xm-sky i,.xm-modal .hero-logo,.xm-modal .xm-play-art i,.xm-modal .car-card::after,
.xm-card.xm-wait *,.xm-card.xm-drop *{animation-play-state:paused!important}
.xm-sleigh::before{content:"";position:absolute;inset:-10% 0 0 16%;background:radial-gradient(closest-side,rgba(255,220,140,.22),transparent);pointer-events:none}
.xm-spark{position:fixed;z-index:4;width:5px;height:5px;border-radius:50%;will-change:transform,opacity;pointer-events:none;animation:xmSpark .9s ease-out forwards}
@keyframes xmSpark{to{transform:translate(-14px,26px) scale(.2);opacity:0}}
.xm-skip{position:fixed;left:0;right:0;margin:0 auto;width:max-content;bottom:calc(16px + env(safe-area-inset-bottom));z-index:5;display:flex;flex-direction:column;align-items:center;gap:8px;color:rgba(245,241,232,.82);font:600 .68rem 'Montserrat',sans-serif;letter-spacing:2.2px;text-transform:uppercase;white-space:nowrap;pointer-events:none;animation:xmRise .6s 2.2s ease both}
/* textul „Derulează…” apare doar pe ecranul cu bradul, nu și peste cadou */
.xm-overlay:not([data-etapa="1"]) .xm-skip{display:none}
.xm-skip span{display:block;width:14px;height:14px;border-right:2px solid rgba(214,179,106,.9);border-bottom:2px solid rgba(214,179,106,.9);animation:scrollBounce 1.4s ease infinite}
@media (max-height:720px){ .xm-joc .xm-tree-svg{width:min(100%,180px)} .xm-joc .xm-card{padding-top:38px} }

.xm-card.wide{width:min(100%,480px)}
.xm-j2,.xm-j3{animation:xmRise .55s ease both}
.xm-extra:has(> :only-child){grid-template-columns:minmax(0,520px);justify-content:center}
.xm-tree-wrap{position:relative}
.xm-tree-wrap .xm-burst{left:50%;top:22px}
.xm-joc .xm-tree-svg{width:min(100%,230px)}
.xm-joc .xm-card{padding-top:44px}
.xm-joc h3{margin-bottom:6px}
.xm-xmas{font-size:.72rem;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted);margin-top:12px}
.xm-xmas b{color:var(--accent)}
.xm-big{display:inline-grid;place-items:center;width:92px;height:92px;margin:2px auto 12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d9505a,#8a2029);color:#fff;font:700 1.6rem 'Montserrat',sans-serif;border:3px solid rgba(240,213,143,.75);box-shadow:0 12px 30px rgba(0,0,0,.4),0 0 40px rgba(240,213,143,.25);transform:rotate(-8deg);animation:xmIn .6s cubic-bezier(.3,1.6,.5,1)}
.xm-j2 .xm-gift{margin-top:4px}
.xm-play-box{display:flex;flex-direction:column;align-items:center;justify-content:center}
.xm-play-art{position:relative;width:130px;height:130px;margin:0 auto 12px;border-radius:50%;background:radial-gradient(circle,rgba(111,208,140,.16),transparent 70%);display:grid;place-items:center}
.xm-play-art .icon{width:110px;height:110px;color:#2f8152;filter:drop-shadow(0 6px 10px rgba(0,0,0,.3))}
.xm-play-art i{position:absolute;width:10px;height:10px;border-radius:50%;animation:xmTwinkle 2s ease-in-out infinite}
.xm-play-art i:nth-child(2){left:55px;top:44px;background:#e2606a}
.xm-play-art i:nth-child(3){left:69px;top:62px;background:#f3dc9d;animation-delay:-.5s}
.xm-play-art i:nth-child(4){left:48px;top:76px;background:#8fd3ff;animation-delay:-1s}
.xm-play-art i:nth-child(5){left:61px;top:14px;width:8px;height:8px;background:#f6d77e;box-shadow:0 0 10px #f6d77e;animation-delay:-1.4s}

.xm-postcard{position:relative;margin:4px auto 16px;max-width:300px;aspect-ratio:3/2;border-radius:14px;overflow:hidden;border:1px solid rgba(214,179,106,.5);background:radial-gradient(240px 140px at 50% 120%,rgba(255,170,80,.28),transparent 70%),linear-gradient(160deg,#a8323a,#5e1219);box-shadow:0 14px 34px rgba(0,0,0,.35);transform:rotate(-2deg);transition:transform .3s ease}
.xm-postcard:hover{transform:rotate(0) scale(1.02)}
.xm-postcard-g{position:absolute;left:-6px;right:-6px;top:-8px;height:46px}
.xm-postcard-g svg{display:block;width:100%;height:100%}
.xm-postcard-t{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:20px;color:#fff}
.xm-postcard-t strong{font-family:'Prata',serif;font-weight:400;font-size:1.45rem;color:#f6e3a8;letter-spacing:.5px}
.xm-postcard-t span{font-size:.62rem;letter-spacing:2.5px;text-transform:uppercase;opacity:.85;margin-top:4px}
.xm-postcard i{position:absolute;border-radius:50%;background:#fff;opacity:.7}
.xm-send-or{display:block;margin-top:10px;font-size:.76rem;color:var(--muted)}
.xm-send-or a{color:var(--accent);text-decoration:underline;text-underline-offset:3px}

@media (max-width:980px){ .xm-extra{grid-template-columns:1fr} }

/* strălucire caldă, care „respiră”, în jurul logo-ului din hero */
.xm-on .hero-logo{animation:xmGlow 4.5s ease-in-out infinite}
/* în sezon caseta din hero are urarea și butonul de ofertă — ascundem rândul care repetă textul din logo */
.xm-on .hero-tagline{display:none}
/* … dar caseta rămâne la fel de înaltă: spațiul acelui rând se împarte între elemente, ca să respire */
.xm-on .hero-box{padding-top:36px;padding-bottom:34px}
.xm-on .hero-logo{margin-bottom:28px}
.xm-on .xm-greet{margin-top:20px}
.xm-on .hero-rating{margin-top:10px}
.xm-on .hero-actions{margin-top:28px}
.xm-on .xm-hero-chip{margin-top:18px}
@media (max-width:600px){ .xm-on .hero-box{padding-top:32px;padding-bottom:30px} .xm-on .hero-logo{margin-bottom:30px} .xm-on .hero-actions{margin-top:24px} }
@keyframes xmGlow{0%,100%{filter:brightness(0) invert(1) drop-shadow(0 0 3px rgba(255,214,140,.35)) drop-shadow(0 0 12px rgba(255,190,100,.18))}50%{filter:brightness(0) invert(1) drop-shadow(0 0 6px rgba(255,214,140,.7)) drop-shadow(0 0 24px rgba(255,190,100,.38))}}

.xm-greet{display:flex;align-items:center;justify-content:center;gap:10px;margin:12px 0 0;font-family:'Prata',serif;color:#f3dc9d;font-size:.98rem;letter-spacing:.6px}
.xm-greet .icon{font-size:.8rem;color:rgba(243,220,157,.8)}

.xm-iarna{background:radial-gradient(700px 320px at 50% 0%,rgba(168,40,52,.14),transparent 70%)}
.xm-trad-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:10px;text-align:left}
.xm-trad .icon{box-sizing:border-box;display:block;width:40px;height:40px;padding:10px;border-radius:12px;border:1px solid rgba(214,179,106,.3);background:rgba(168,40,52,.28);color:#f3dc9d;margin-bottom:12px}

.xm-on .car-card{position:relative}
.xm-on .car-card::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(130% 80% at 50% 115%,rgba(255,165,70,.32),transparent 60%);mix-blend-mode:screen;animation:xmFlicker 4s ease-in-out infinite}
@keyframes xmFlicker{0%,100%{opacity:.75}25%{opacity:1}45%{opacity:.8}60%{opacity:.95}80%{opacity:.7}}

.xm-night-btn{flex:0 0 auto;margin-left:auto;position:relative;z-index:3;width:40px;height:40px;padding:0;border-radius:12px;border:1px solid var(--line);background:rgba(0,0,0,.2);color:var(--muted);display:grid;place-items:center;cursor:pointer;transition:.2s ease}
.xm-night-btn .icon{width:16px;height:16px}
@media (min-width:601px){ .xm-night-btn{margin-left:22px} }
@media (min-width:1200px){ .xm-night-btn{position:absolute;right:24px;top:50%;transform:translateY(-50%);margin:0} }
.xm-night-btn:hover{color:var(--accent);border-color:rgba(214,179,106,.45)}
.xm-night-btn[aria-pressed="true"]{color:#10241c;background:linear-gradient(180deg,#f3dc9d,#c6a054);border-color:transparent;box-shadow:0 0 18px rgba(243,220,157,.45)}
.xm-night-tip{position:absolute;z-index:5;top:50%;right:calc(100% + 10px);transform:translateY(-50%);box-shadow:0 6px 18px rgba(0,0,0,.35);white-space:nowrap;background:#162e22;color:#fff;padding:6px 10px;border-radius:8px;font:500 .7rem 'Montserrat',sans-serif;letter-spacing:.5px;opacity:0;pointer-events:none;transition:.2s ease}
.xm-night-btn:hover .xm-night-tip{opacity:1}

.xm-sky{position:absolute;inset:0 0 50% 0;overflow:hidden;pointer-events:none;z-index:1;opacity:0;transition:opacity .8s ease}
.xm-sky i{position:absolute;border-radius:50%;background:#fff;animation:xmTwinkle 3s ease-in-out infinite}
.xm-moon{position:absolute;left:14%;top:130px;width:54px;height:54px;border-radius:50%;background:radial-gradient(circle at 38% 35%,#fffdf0,#e6dcb8 72%);box-shadow:0 0 40px 12px rgba(255,248,215,.22),0 0 120px 40px rgba(255,248,215,.08)}
.xm-veil{position:fixed;inset:0;z-index:5000;background:#050c12;opacity:0;pointer-events:none;transition:opacity .38s ease}
.xm-veil.on{opacity:.92}

/* ---- Seară de iarnă ---- */
.xm-night .xm-sky{opacity:1}
html.xm-night body{background:radial-gradient(1000px 600px at 50% -5%,rgba(120,150,215,.13),transparent 60%),radial-gradient(800px 520px at 100% 30%,rgba(168,40,52,.08),transparent 62%),linear-gradient(180deg,#0b1a22,#060f13)}
.xm-night .hero::before{opacity:1!important;background:linear-gradient(180deg,rgba(6,14,40,.30),rgba(8,16,36,.12) 55%,rgba(4,10,18,.35))}
.xm-night .hero::after{background:radial-gradient(700px 420px at 18% 12%,rgba(255,244,210,.12),transparent 65%)}
.xm-night nav.nav{background:rgba(6,14,22,.78)}
.xm-night .mobile-menu{background:radial-gradient(520px 300px at 50% 0%,rgba(120,150,215,.16),transparent 70%),radial-gradient(500px 360px at 100% 100%,rgba(168,40,52,.10),transparent 70%),linear-gradient(180deg,#0f1d2c,#060d16)}
/* calendarul, fereastra de confirmare și etichetele — fără verdele de bază în modul de seară */
.xm-night .cal-pop{background:linear-gradient(160deg,#14243c,#080f1a);border-color:rgba(205,218,255,.28)}
.xm-night .cal-inchide{background:#14243c;border-color:rgba(205,218,255,.35)}
.xm-night .cal-zi{background:rgba(10,20,40,.55)}
.xm-night .cal-zi.selectat{background:linear-gradient(180deg,rgba(214,179,106,.9),rgba(198,160,84,.9))}
.xm-night .cal-zi.interval{background:rgba(214,179,106,.2)}
.xm-night .cal-zi.plin,.xm-night .cal-zi.trecut,.xm-night .cal-zi:disabled{background:rgba(10,20,40,.25)}
.xm-night .cal-nav{background:rgba(10,20,40,.55)}
.xm-night .cal-backdrop{background:rgba(3,8,18,.62)}
.xm-night .modal-box{background:linear-gradient(160deg,#14243c,#080f1a);border-color:rgba(205,218,255,.2)}
.xm-night .xm-fab-tip,.xm-night .xm-night-tip{background:#14243c}
.xm-night .section.alt{background:rgba(140,170,230,.035)}
.xm-night .xm-light circle:first-child{opacity:.6}
.xm-night .xm-overlay{background:rgba(3,8,18,.74)}
.xm-night .xm-card{border-color:rgba(205,218,255,.3);background:radial-gradient(380px 220px at 88% 4%,rgba(255,244,210,.14),transparent 60%),radial-gradient(520px 300px at 50% 105%,rgba(168,40,52,.16),transparent 70%),linear-gradient(165deg,#14243c,#080f1a)}
.xm-night .xm-flurry{background-image:radial-gradient(1.2px 1.2px at 12% 22%,#fff,transparent),radial-gradient(1px 1px at 28% 9%,#fff,transparent),radial-gradient(1.4px 1.4px at 44% 30%,#fff,transparent),radial-gradient(1px 1px at 63% 14%,#fff,transparent),radial-gradient(1.2px 1.2px at 9% 48%,#fff,transparent),radial-gradient(1px 1px at 92% 40%,#fff,transparent),radial-gradient(1.3px 1.3px at 74% 56%,#fff,transparent),radial-gradient(1px 1px at 18% 72%,#fff,transparent),radial-gradient(1.2px 1.2px at 86% 80%,#fff,transparent),radial-gradient(1px 1px at 52% 88%,#fff,transparent)}
.xm-night .xm-flurry i{opacity:.9!important}
.xm-night .xm-flurry::before{content:"";position:absolute;top:40px;left:22px;width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 38% 35%,#fffdf0,#e6dcb8 72%);box-shadow:0 0 26px 8px rgba(255,248,215,.22)}
.xm-night .xm-x{background:#14243c;border-color:rgba(205,218,255,.35)}
.xm-night .xm-count div,.xm-night .xm-list li{background:rgba(10,20,40,.45);border-color:rgba(205,218,255,.14)}
.xm-night .car-card::after{background:radial-gradient(130% 80% at 50% 115%,rgba(255,165,70,.48),transparent 62%)}

@media (max-width:980px){ .xm-trad-grid{grid-template-columns:repeat(2,minmax(0,1fr))} }
@media (max-width:600px){
  .xm-trad-grid{grid-template-columns:1fr}
  .xm-night-btn{width:38px;height:38px}
  .xm-night-tip{display:none}
  .xm-moon{display:none}
  .xm-fab{width:50px;height:50px;left:14px}
  .xm-fab-tip{display:none}
  .xm-card{padding:46px 18px 20px}
  .xm-card h3{font-size:1.3rem}
  .xm-count div{min-width:56px}
}
@media (prefers-reduced-motion:reduce){
  .xm-on .hero-logo{animation:none;filter:brightness(0) invert(1) drop-shadow(0 0 5px rgba(255,214,140,.55)) drop-shadow(0 0 18px rgba(255,190,100,.28))}
  .xm-bauble,.xm-light,.xm-gift svg,.xm-fab::after,.xm-flurry,.xm-sky i,.xm-on .car-card::after,.xm-tstar,.xm-tb{animation:none!important}
  .xm-flurry{display:none}
}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- ICOANE suplimentare ---------- */
  const sprite = `
<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
  <symbol id="xm-gift" viewBox="0 0 24 24"><path d="M4 13h7v8H5a1 1 0 0 1-1-1zM13 13h7v7a1 1 0 0 1-1 1h-6zM3 9h8v3H3zM13 9h8v3h-8zM12 8.6C10.8 5.6 7 4.2 5.8 6.3c-1 1.8 1.4 2.8 6.2 2.3zm0 0c1.2-3 5-4.4 6.2-2.3 1 1.8-1.4 2.8-6.2 2.3z"/></symbol>
  <symbol id="xm-house" viewBox="0 0 24 24"><path d="M12 2.5l10 8.3-1.3 1.5L19.5 11.3V21a1 1 0 0 1-1 1H15v-6.5H9V22H5.5a1 1 0 0 1-1-1v-9.7L3.3 12.3 2 10.8z"/></symbol>
  <symbol id="xm-star" viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 16.9l-6.1 3.5 1.5-6.8L2.2 9l6.9-.7z"/></symbol>
  <symbol id="xm-bowl" viewBox="0 0 24 24"><path d="M2.5 11h19a9.5 9 0 0 1-6 8.4V21h-7v-1.6A9.5 9 0 0 1 2.5 11zM8 3.5c1.1 1.1 1.1 2.2 0 3.3s-1.1 2.2 0 3.2H6.6c-1.1-1-1.1-2.1 0-3.2s1.1-2.2 0-3.3zM12.7 3.5c1.1 1.1 1.1 2.2 0 3.3s-1.1 2.2 0 3.2h-1.4c-1.1-1-1.1-2.1 0-3.2s1.1-2.2 0-3.3zM17.4 3.5c1.1 1.1 1.1 2.2 0 3.3s-1.1 2.2 0 3.2H16c-1.1-1-1.1-2.1 0-3.2s1.1-2.2 0-3.3z"/></symbol>
  <symbol id="xm-tree" viewBox="0 0 24 24"><path d="M12 1.5l4.2 5.3h-2.3l3.8 4.8h-2.3L19.6 17H4.4l4.2-5.4H6.3l3.8-4.8H7.8zM10.5 17.5h3V22h-3z"/></symbol>
  <symbol id="xm-mug" viewBox="0 0 24 24"><path d="M3.5 8h13v6.5A5.5 5.5 0 0 1 11 20H9a5.5 5.5 0 0 1-5.5-5.5zM16.5 9.5h1.3a3 3 0 0 1 0 6h-1.6a6.8 6.8 0 0 0 .3-2h1.3a1 1 0 0 0 0-2h-1.3zM7 2.5c1 1 1 2 0 3s-1 2 0 3h-1.4c-1-1-1-2 0-3s1-2 0-3zM11 2.5c1 1 1 2 0 3s-1 2 0 3H9.6c-1-1-1-2 0-3s1-2 0-3z"/></symbol>
  <symbol id="xm-snowflake" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 2L9.6 4.4M12 2l2.4 2.4M12 22l-2.4-2.4M12 22l2.4-2.4M3.3 7l3.3.9M3.3 7l.9-3.3M20.7 17l-3.3-.9M20.7 17l-.9 3.3M3.3 17l.9 3.3M3.3 17l3.3-.9M20.7 7l-.9-3.3M20.7 7l-3.3.9"/></g></symbol>
</svg>`;
  const ico = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"></use></svg>`;
  // „-500 RON” în cercurile roșii: suma mare, moneda mică dedesubt
  const insigna = r => r.replace(/^(\S+)\s+(.+)$/, '<span class="xm-ins">$1<small>$2</small></span>');

  /* ---------- GHIRLANDĂ DE BRAD ---------- */
  function ghirlanda(W, o = {}) {
    const id = 'xmg' + (++uid);
    const r = rng(o.seed || 11);
    const H = o.h || 66, top = o.top ?? 10, sag = o.sag ?? 10;
    const nr = Math.max(2, Math.round(W / (o.span || 240)));
    const seg = W / nr;
    const yAt = x => top + sag * Math.sin(Math.PI * (((x % seg) + seg) % seg) / seg);

    // ace de brad — 4 nuanțe, câte un path fiecare (ieftin de randat)
    const verzi = ['#0a2a1b', '#123f28', '#1b5836', '#2a7248'];
    const ace = ['', '', '', ''];
    for (let x = -8; x <= W + 8; x += 3.5) {
      const y = yAt(x);
      for (let k = 0; k < 8; k++) {
        const a = r() * Math.PI * 2, L = 6 + r() * 9;
        const c = Math.min(3, Math.floor(r() * 4.2));
        ace[c] += `M${f(x + (r() - .5) * 3)} ${f(y + (r() - .5) * 3)}l${f(Math.cos(a) * L)} ${f(Math.sin(a) * L * .7)}`;
      }
    }

    let zapada = '';
    for (let x = -4; x <= W + 4; x += 8) {
      if (r() < .28) continue;
      zapada += `<ellipse cx="${f(x + (r() - .5) * 4)}" cy="${f(yAt(x) - 3.5 + r() * 2)}" rx="${f(3.5 + r() * 4)}" ry="${f(2 + r() * 1.4)}"/>`;
    }

    let lumini = '';
    const culoriLumini = ['#ffd98a', '#ffb35c', '#fff1c9', '#ffcf6e'];
    for (let x = 14; x < W; x += 30 + r() * 14) {
      const y = yAt(x) + (r() - .5) * 6, c = culoriLumini[Math.floor(r() * 4)];
      lumini += `<g class="xm-light" style="animation-delay:-${f(r() * 2.2)}s"><circle cx="${f(x)}" cy="${f(y)}" r="5" fill="${c}" opacity=".28"/><circle cx="${f(x)}" cy="${f(y)}" r="2" fill="${c}"/></g>`;
    }

    const glob = [['#f3dc9d', '#b8903f'], ['#e2606a', '#7d1d26'], ['#ffffff', '#b9c6cd']];
    let defs = '', baubles = '';
    glob.forEach((g, i) => {
      defs += `<radialGradient id="${id}c${i}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></radialGradient>`;
    });
    const puncte = [];
    for (let i = 0; i < nr; i++) {
      puncte.push([seg * (i + .5), 1]);
      if (o.mici !== false && r() < .7) puncte.push([seg * (i + .5) + (r() < .5 ? -1 : 1) * seg * (.22 + r() * .08), .62]);
    }
    puncte.forEach(([x, s], i) => {
      const y0 = yAt(x) + 2, len = (s === 1 ? 12 : 4) + r() * 10, rad = (s === 1 ? 7.5 : 5) * (o.scale || 1);
      const c = s === 1 ? i % 2 : (i % 3);
      const cy = y0 + len + 2 + rad;
      baubles += `<g class="xm-bauble" style="transform-origin:${f(x)}px ${f(y0)}px;animation-delay:-${f(r() * 3.4)}s">
        <line x1="${f(x)}" y1="${f(y0)}" x2="${f(x)}" y2="${f(y0 + len)}" stroke="#d6b36a" stroke-width=".8" opacity=".8"/>
        <rect x="${f(x - 2.2)}" y="${f(y0 + len - .5)}" width="4.4" height="3.2" rx="1" fill="#c9a55a"/>
        <circle cx="${f(x)}" cy="${f(cy)}" r="${f(rad)}" fill="url(#${id}c${c})"/>
        <ellipse cx="${f(x - rad * .35)}" cy="${f(cy - rad * .4)}" rx="${f(rad * .28)}" ry="${f(rad * .18)}" fill="#fff" opacity=".7" transform="rotate(-30 ${f(x - rad * .35)} ${f(cy - rad * .4)})"/>
      </g>`;
    });

    // Trei straturi suprapuse: globulețe (în spate, animate), crenguța cu zăpadă (grea, dar statică — desenată
    // o singură dată) și beculețele (în față, animate). Așa telefonul nu redesenează sutele de ace la fiecare cadru.
    const svg = (cls, continut) => `<svg class="${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${continut}</svg>`;
    return `<div class="xm-gl">
      ${svg('xm-gl-b', `<defs>${defs}</defs><g class="xm-baubles">${baubles}</g>`)}
      ${svg('xm-gl-n', `<g fill="none" stroke-width="1.9" stroke-linecap="round">${ace.map((d, i) => `<path stroke="${verzi[i]}" d="${d}"/>`).join('')}</g><g fill="#f4f8fb" opacity=".95">${zapada}</g>`)}
      ${svg('xm-gl-l', lumini)}
    </div>`;
  }

  const legaGlobulete = root => root.addEventListener('click', e => {
    const b = e.target.closest('.xm-bauble');
    if (!b) return;
    b.classList.remove('jingle');
    void b.getBBox();                      // repornește animația
    b.classList.add('jingle');
    b.addEventListener('animationend', () => b.classList.remove('jingle'), { once: true });
  });

  /* ---------- CĂCIULĂ DE ZĂPADĂ (pe carduri) ---------- */
  function capac(W, seed) {
    const r = rng(seed), H = 20;
    const grd = 'xmc' + (++uid);
    let d = 'M0 10', x = 0;
    while (x < W) {
      const s = 22 + r() * 30, nx = Math.min(W, x + s);
      d += ` Q${f(x + s / 2)} ${f(-1 + r() * 4)} ${f(nx)} ${f(4 + r() * 3)}`;
      x = nx;
    }
    d += ` L${W} 10`;
    while (x > 0) {
      const s = 16 + r() * 36, nx = Math.max(0, x - s);
      if (r() < .35 && s > 26) {
        const m = (x + nx) / 2, dy = 13 + r() * 6;
        d += ` Q${f(x - 4)} 11 ${f(m + 5)} 12 Q${f(m + 4)} ${f(dy)} ${f(m)} ${f(dy)} Q${f(m - 4)} ${f(dy)} ${f(m - 5)} 12 Q${f(nx + 4)} 11 ${f(nx)} 11`;
      } else {
        d += ` Q${f((x + nx) / 2)} ${f(11 + r() * 3)} ${f(nx)} ${f(10 + r() * 1.5)}`;
      }
      x = nx;
    }
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${grd}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9e4ea"/></linearGradient></defs>
      <path d="${d} Z" fill="url(#${grd})"/></svg>`;
  }

  /* ---------- NINSOARE ---------- */
  function ninsoare() {
    if (fataMiscare) return;
    const cv = document.createElement('canvas');
    cv.className = 'xm-snow';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, fulgi = [], vant = 0, mx = null, rulare = true;
    let particule = [];                       // fulgii împrăștiați la click
    const COL = 6;                            // lățimea unei coloane din stratul de zăpadă
    let stratul = new Float32Array(0), maxStrat = 16;

    const fulg = (sus) => {
      const r = .8 + Math.random() ** 2 * 2.6;
      return { x: Math.random() * W, y: sus ? -10 - Math.random() * H * .3 : Math.random() * H,
               r, vy: (.25 + r * .32 + Math.random() * .25) * (stare.noapte ? 1.3 : 1), faza: Math.random() * 6.28,
               amp: .3 + Math.random() * .7, a: .45 + Math.random() * .5 };
    };
    // Pe telefon, la scroll bara de adrese apare/dispare și schimbă înălțimea ferestrei. Nu redimensionăm
    // ninsoarea pentru asta (fulgii „săreau”): canvasul are înălțimea maximă a ecranului (100lvh) și se
    // recalculează doar când se schimbă lățimea (rotire, fereastră redimensionată) sau numărul de fulgi.
    const dimensiune = (fortat) => {
      const latimeNoua = innerWidth !== W;
      if (!latimeNoua && !fortat) return;
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = Math.max(cv.clientHeight, innerHeight);
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const k = stare.noapte ? 2 : 1;
      const tinta = Math.round(Math.min(130 * k, W * H / 9500 * k));
      while (fulgi.length < tinta) fulgi.push(fulg(false));
      fulgi.length = tinta;
      if (latimeNoua) {
        stratul = new Float32Array(Math.ceil(W / COL) + 1);
        maxStrat = W < 600 ? 11 : 16;
      }
    };
    stare.reinit = () => dimensiune(true);
    dimensiune(true);
    addEventListener('resize', () => dimensiune(false), { passive: true });

    // un fulg ajuns jos se adaugă stratului (distribuit pe câteva coloane vecine)
    const aseaza = (x, r) => {
      const c = Math.round(x / COL), w = [.35, .7, 1, .7, .35];
      for (let i = -2; i <= 2; i++) {
        const j = c + i;
        if (j >= 0 && j < stratul.length) stratul[j] = Math.min(maxStrat * (.75 + .25 * Math.sin(j * .7) * Math.cos(j * .23)), stratul[j] + r * .8 * w[i + 2]);
      }
    };
    const deseneazaStrat = () => {
      if (!stratul.some(v => v > .4)) return;
      ctx.globalAlpha = .93;
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, H - stratul[0]);
      for (let i = 1; i < stratul.length; i++) {
        const x0 = (i - 1) * COL, x1 = i * COL;
        ctx.quadraticCurveTo(x0, H - stratul[i - 1], (x0 + x1) / 2, H - (stratul[i - 1] + stratul[i]) / 2);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    };

    // la click/atingere se împrăștie câțiva fulgi
    addEventListener('pointerdown', e => {
      if (e.target.closest('input, select, textarea, .xm-overlay, .lightbox, .cal-pop, .mobile-menu')) return;
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * 6.283, v = 1.2 + Math.random() * 2.8;
        particule.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.2,
                         r: 1.6 + Math.random() * 2, viata: 1, rot: Math.random() * 6.283 });
      }
      if (particule.length > 120) particule.splice(0, particule.length - 120);
    }, { passive: true });

    const fulgStea = p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI / 3, L = p.r * 1.8;
        ctx.moveTo(-Math.cos(a) * L, -Math.sin(a) * L);
        ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L);
      }
      ctx.stroke();
      ctx.restore();
    };

    // vântul urmează mișcarea mouse-ului (doar desktop)
    addEventListener('mousemove', e => {
      if (mx !== null) vant += (e.clientX - mx) * .012;
      vant = Math.max(-3, Math.min(3, vant));
      mx = e.clientX;
    }, { passive: true });

    let t0 = performance.now();
    const pas = t => {
      if (!rulare) return;
      if (stare.pauzaZapada) { t0 = t; return requestAnimationFrame(pas); }   // sub o fereastră deschisă: pauză
      const dt = Math.min(3, (t - t0) / 16.67); t0 = t;
      vant *= .96;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      for (const p of fulgi) {
        p.faza += .02 * dt;
        p.y += p.vy * dt;
        p.x += (Math.sin(p.faza) * p.amp * .5 + vant * p.r * .35) * dt;
        if (p.x > W + 6) p.x = -6; else if (p.x < -6) p.x = W + 6;
        const sol = H - (stratul[Math.round(p.x / COL)] || 0);
        if (p.y >= sol) {
          if (p.x >= 0 && p.x <= W) aseaza(p.x, p.r);
          Object.assign(p, fulg(true), { y: -6 });
        }
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }
      deseneazaStrat();
      if (particule.length) {
        for (const p of particule) {
          p.vy += .07 * dt;
          p.vx *= .985;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += .05 * dt;
          p.viata -= .016 * dt;
          ctx.globalAlpha = Math.max(0, p.viata);
          fulgStea(p);
        }
        particule = particule.filter(p => p.viata > 0);
      }
      requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
    document.addEventListener('visibilitychange', () => {
      rulare = !document.hidden;
      if (rulare) { t0 = performance.now(); requestAnimationFrame(pas); }
    });
  }

  /* ---------- URARE ÎN HERO (se schimbă după dată) ---------- */
  function urare() {
    const tinta = document.querySelector('.hero-rating');
    if (!tinta) return;
    const zi = azi.getDate(), luna = azi.getMonth();
    let text;
    if (luna === 11 && zi >= 27) text = 'La mulți ani din Bucovina!';
    else if (luna === 0) text = `La mulți ani ${AN + 1}!`;
    else if (luna === 11 && zi >= 24) text = 'Crăciun fericit din Bucovina!';
    else text = 'Sărbători fericite din Bucovina';
    const p = document.createElement('p');
    p.className = 'xm-greet';
    p.innerHTML = `${ico('xm-snowflake')}<span>${text}</span>${ico('xm-snowflake')}`;
    tinta.insertAdjacentElement('beforebegin', p);
  }

  /* ---------- SECȚIUNEA „IARNA ÎN BUCOVINA” ---------- */
  const TRADITII = [
    ['xm-star', 'Colindătorii', 'În Ajunul Crăciunului, cetele de colindători merg din casă în casă cu Steaua și urări de bine.'],
    ['paw',     'Jocul Ursului și al Caprei', 'Între Crăciun și Anul Nou, satele bucovinene se umplu de măști, tobe și dansuri vechi de sute de ani.'],
    ['xm-bowl', 'Bucate de sărbătoare', 'Sarmale, cozonac, colaci și piftie — masa de Crăciun din Bucovina e o poveste în sine.'],
    ['xm-snowflake', 'Zăpadă și pârtie', 'Pârtia Rarău e la ~35 de minute, iar după o zi pe zăpadă te așteaptă căldura casei.'],
  ];
  // Secțiunea vine imediat după hero, cu link „Iarna” în meniu (desktop + mobil).
  // Rulează înainte de main.js, deci animațiile de apariție și meniul o preiau automat.
  function traditii() {
    const hero = document.getElementById('acasa');
    if (!hero) return;
    const s = document.createElement('section');
    s.id = 'iarna';
    s.className = 'section xm-iarna';
    s.innerHTML = `
      <div class="wrap">
        <h2 class="reveal">Iarna în Bucovina</h2>
        <div class="divider reveal" data-delay="80"></div>
        <p class="reveal" data-delay="140" style="margin-bottom:18px;">Sărbătorile aici au alt gust — tradiții vii, zăpadă adevărată și seri lungi la căldură.</p>
        <div class="xm-trad-grid">
          ${TRADITII.map(([i, t, d], k) => `<div class="zona-card xm-trad reveal" data-delay="${80 + k * 80}">${ico(i)}<h3>${t}</h3><p class="zona-tip">${d}</p></div>`).join('')}
        </div>
        <div class="xm-extra">
          ${jocActiv ? `<div class="xm-box xm-play-box reveal" data-delay="120">
            <div class="xm-play-art" aria-hidden="true">${ico('xm-tree')}<i></i><i></i><i></i><i></i></div>
            <h3>Împodobește bradul și vezi ce câștigi</h3>
            <p>Agață globulețe, aprinde steaua din vârf și primești un cadou de sărbători de la noi.</p>
            <button type="button" class="btn primary" data-play>${ico('xm-gift')} Joacă acum</button>
          </div>` : ''}
          <div class="xm-box xm-send-box reveal" data-delay="200">
            <div class="xm-postcard" aria-hidden="true">
              <div class="xm-postcard-g"></div>
              <div class="xm-postcard-t"><strong>Sărbători fericite</strong><span>din Bucovina · Cheile Braniștei</span></div>
            </div>
            <h3>Trimite o felicitare</h3>
            <p>Fă-i cuiva drag o surpriză de sărbători — și poate vă vedeți la munte.</p>
            <button type="button" class="btn primary" data-send>${ico('xm-gift')} Trimite felicitarea</button>
            <span class="xm-send-or">sau <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(FELICITARE)}" target="_blank" rel="noopener">direct pe WhatsApp</a></span>
          </div>
        </div>
      </div>`;
    hero.insertAdjacentElement('afterend', s);

    // în meniul de sus: primul link; în meniul de pe mobil: după „Acasă”
    const link = cls => Object.assign(document.createElement('a'), { href: '#iarna', className: cls, textContent: 'Iarna' });
    document.querySelector('.nav-links')?.prepend(link(''));
    const linkMobil = link('mobile-link');
    linkMobil.innerHTML = `${ico('xm-snowflake')}<span>Iarna</span>`;
    document.querySelector('.mobile-nav a[href="#acasa"]')?.insertAdjacentElement('afterend', linkMobil);
    meniuMobilDeSezon();
  }

  /* ---------- MENIUL DE PE TELEFON: GHIRLANDĂ ---------- */
  function meniuMobilDeSezon() {
    const sus = document.querySelector('.mm-top');
    if (!sus) return;
    const g = document.createElement('div');
    g.className = 'xm-mm-garland';
    sus.appendChild(g);
    legaGlobulete(g);
    // meniul ocupă toată lățimea ecranului; ghirlanda se desenează la prima deschidere și la rotire
    let latime = 0;
    const deseneaza = () => {
      if (innerWidth === latime) return;
      latime = innerWidth;
      g.innerHTML = ghirlanda(latime, { span: 130, sag: 8, top: 10, h: 56, seed: 5 });
    };
    document.getElementById('hamburger')?.addEventListener('click', deseneaza);
  }

  /* ---------- BRADUL DE ÎMPODOBIT ---------- */
  const BRAD_TINTA = 6;
  // nivelurile bradului: [vârf y, bază y, jumătate de lățime la bază]
  const NIVELURI = [[30, 104, 54], [64, 150, 70], [100, 198, 86]];
  const CULORI_GLOB = [['#f3dc9d', '#b8903f'], ['#e2606a', '#7d1d26'], ['#ffffff', '#b9c6cd'], ['#8fd3ff', '#2a6f9e']];

  function bradSVG() {
    const nivel = ([y0, yB, w]) => {
      // margine de jos ondulată
      let d = `M100 ${y0} L${100 + w} ${yB}`;
      const n = Math.round(w / 12);
      for (let i = 0; i < n; i++) {
        const x1 = 100 + w - (2 * w * (i + 1)) / n, xm = 100 + w - (2 * w * (i + .5)) / n;
        d += ` Q${f(xm)} ${yB + 7} ${f(x1)} ${yB}`;
      }
      return d + ' Z';
    };
    const zapada = ([y0, yB, w]) => {
      let d = '';
      const n = Math.round(w / 12);
      for (let i = 0; i < n; i++) {
        const x0 = 100 - w + (2 * w * i) / n, x1 = 100 - w + (2 * w * (i + 1)) / n;
        d += `M${f(x0 + 2)} ${yB + 1} Q${f((x0 + x1) / 2)} ${yB + 6} ${f(x1 - 2)} ${yB + 1}`;
      }
      return d;
    };
    let lumini = '';
    NIVELURI.forEach(([y0, yB, w], k) => {
      for (let i = 1; i <= 5; i++) {
        const t = i / 6, y = y0 + (yB - y0) * (.45 + .1 * k), x = 100 - w * .8 + 1.6 * w * .8 * t;
        lumini += `<circle class="xm-light" cx="${f(x)}" cy="${f(y + Math.sin(t * 6.28) * 4)}" r="2.2" fill="${['#ffd98a', '#ffb35c', '#fff1c9'][i % 3]}" style="animation-delay:-${(i * .37 + k).toFixed(2)}s"/>`;
      }
    });
    return `<svg class="xm-tree-svg" viewBox="0 0 200 232" tabindex="0" role="img" aria-label="Brad de împodobit: atinge bradul ca să adaugi globulețe, apoi steaua ca s-o aprinzi">
      <defs>
        <linearGradient id="xmTreeG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f8152"/><stop offset="1" stop-color="#0d3622"/></linearGradient>
        ${CULORI_GLOB.map((c, i) => `<radialGradient id="xmTb${i}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></radialGradient>`).join('')}
      </defs>
      <ellipse cx="100" cy="224" rx="74" ry="6" fill="rgba(0,0,0,.3)"/>
      <rect x="90" y="196" width="20" height="26" rx="3" fill="#6b4226"/>
      ${NIVELURI.slice().reverse().map(n => `<path d="${nivel(n)}" fill="url(#xmTreeG)" stroke="#0a2a1b" stroke-width="1"/>`).join('')}
      <path d="${NIVELURI.map(zapada).join('')}" fill="none" stroke="#f4f8fb" stroke-width="3.6" stroke-linecap="round" opacity=".92"/>
      <g class="xm-tlights">${lumini}</g>
      <g data-baubles></g>
      <path class="xm-tstar" d="M100 6l4.1 8.9 9.7 1-7.3 6.5 2.1 9.6L100 27l-8.6 5 2.1-9.6-7.3-6.5 9.7-1z" fill="#7d7766" stroke="#b8903f" stroke-width=".8"/>
    </svg>`;
  }

  // Leagă logica jocului de un container care are bradul, contorul, indiciul și butonul de reset.
  // `laCastig` e apelat o singură dată, când bradul are destule globulețe și steaua e aprinsă.
  function brad(box, laCastig) {
    const svg = box.querySelector('.xm-tree-svg');
    const grup = svg.querySelector('[data-baubles]');
    const nr = box.querySelector('[data-tree-count]');
    const hint = box.querySelector('[data-tree-hint]');
    const HINT = hint.textContent;
    let globuri = [], aprins = false, castigat = false;

    const inBrad = (x, y) => NIVELURI.some(([y0, yB, w]) =>
      y >= y0 + 8 && y <= yB && Math.abs(x - 100) <= (w * (y - y0)) / (yB - y0) - 5);
    const liber = (x, y) => !globuri.some(([gx, gy]) => Math.hypot(gx - x, gy - y) < 13);

    const adauga = (x, y) => {
      if (globuri.length >= 14 || !liber(x, y)) return;
      const c = globuri.length % CULORI_GLOB.length, r = 6.5;
      globuri.push([x, y]);
      grup.insertAdjacentHTML('beforeend', `<g class="xm-tb">
        <rect x="${f(x - 1.8)}" y="${f(y - r - 2.6)}" width="3.6" height="3" rx="1" fill="#c9a55a"/>
        <circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#xmTb${c})"/>
        <ellipse cx="${f(x - 2.2)}" cy="${f(y - 2.4)}" rx="1.8" ry="1.1" fill="#fff" opacity=".75"/></g>`);
      actualizeaza();
    };
    const stea = () => { aprins = !aprins; svg.classList.toggle('lit', aprins); actualizeaza(); };

    const actualizeaza = () => {
      nr.textContent = Math.min(globuri.length, BRAD_TINTA);
      if (globuri.length >= BRAD_TINTA && !aprins) hint.textContent = 'Arată superb! Acum aprinde steaua din vârf ⭐';
      else if (globuri.length < BRAD_TINTA && aprins) hint.textContent = `Steaua strălucește! Mai agață ${BRAD_TINTA - globuri.length} globulețe.`;
      if (castigat || !aprins || globuri.length < BRAD_TINTA) return;
      castigat = true;
      hint.textContent = 'Ce brad frumos! 🎄';
      scantei(box.querySelector('.xm-burst'), 26);
      setTimeout(laCastig, fataMiscare ? 0 : 1100);
    };

    svg.addEventListener('click', e => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
      if (Math.hypot(x - 100, y - 18) < 16) return stea();
      if (inBrad(x, y)) adauga(x, y);
    });
    // tastatură: Enter/Space agață un globuleț, S aprinde steaua
    svg.addEventListener('keydown', e => {
      if (e.key === 's' || e.key === 'S') return stea();
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      for (let i = 0; i < 40; i++) {
        const x = 20 + Math.random() * 160, y = 40 + Math.random() * 155;
        if (inBrad(x, y) && liber(x, y)) { adauga(x, y); break; }
      }
    });
    box.querySelector('[data-tree-reset]').addEventListener('click', () => {
      globuri = []; aprins = false; castigat = false;
      grup.innerHTML = '';
      svg.classList.remove('lit');
      hint.textContent = HINT;
      actualizeaza();
    });
  }

  // Scântei care țâșnesc din centrul unui element .xm-burst
  function scantei(b, n = 22) {
    if (!b || fataMiscare) return;
    b.innerHTML = '';
    const culori = ['#f3dc9d', '#ffffff', '#e2606a', '#8fd3ff'];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.style.cssText = `--a:${i * (360 / n) + Math.random() * 10}deg;--d:${55 + Math.random() * 75}px;background:${culori[i % 4]};animation-delay:${Math.random() * .12}s`;
      b.appendChild(p);
    }
  }

  /* ---------- FELICITARE ---------- */
  const FELICITARE = `🎄 Sărbători fericite! Ți-am găsit un colț de liniște în Bucovina — poate ne vedem acolo ❄ ${URL_SITE}`;
  function felicitare() {
    const box = document.querySelector('.xm-send-box');
    if (!box) return;
    const pc = box.querySelector('.xm-postcard');
    const g = box.querySelector('.xm-postcard-g');
    requestAnimationFrame(() => { g.innerHTML = ghirlanda(Math.max(200, g.clientWidth), { span: 90, sag: 6, top: 10, h: 46, seed: 9, scale: .8 }); });
    for (let i = 0; i < 16; i++) {
      const s = 1.5 + Math.random() * 2.5;
      pc.insertAdjacentHTML('beforeend', `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(25 + Math.random() * 72).toFixed(1)}%;width:${s}px;height:${s}px"></i>`);
    }
    box.querySelector('[data-send]').addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({ title: 'Sărbători fericite!', text: FELICITARE.replace(URL_SITE, '').trim(), url: URL_SITE }).catch(() => {});
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(FELICITARE)}`, '_blank', 'noopener');
      }
    });
  }


  /* ---------- TITLUL TAB-ULUI ---------- */
  function titluTab() {
    const original = document.title;
    document.addEventListener('visibilitychange', () => {
      document.title = document.hidden ? '❄ Te așteptăm la munte!' : original;
    });
  }

  /* ---------- ICONIȚĂ CU CĂCIULĂ DE MOȘ CRĂCIUN ---------- */
  function iconita() {
    const img = new Image();
    // Pe site (https) desenăm peste iconița reală. Local (file://) browserul blochează citirea imaginii,
    // așa că desenăm atunci o cheie simplă — ca iconița cu căciulă să se vadă și la testare.
    const deseneaza = cuImagine => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const x = c.getContext('2d');
        if (cuImagine) x.drawImage(img, 5, 10, 54, 54);
        else {
          x.fillStyle = '#244a36';
          x.beginPath(); x.arc(32, 37, 27, 0, 6.283); x.fill();
          x.strokeStyle = '#ffffff'; x.fillStyle = '#ffffff'; x.lineWidth = 3.4; x.lineCap = 'round';
          x.beginPath(); x.arc(32, 26, 8, 0, 6.283); x.stroke();
          x.beginPath(); x.moveTo(32, 34); x.lineTo(32, 56); x.stroke();
          x.fillRect(32, 45, 7, 3.4); x.fillRect(32, 51, 5, 3.4);
        }
        x.save();
        x.translate(24, 12);
        x.rotate(-.32);
        x.fillStyle = '#d42a35';
        x.beginPath();
        x.moveTo(-17, 4);
        x.quadraticCurveTo(-9, -17, 9, -16);
        x.quadraticCurveTo(22, -15, 27, -3);
        x.lineTo(15, 4);
        x.closePath();
        x.fill();
        x.fillStyle = '#ffffff';
        x.beginPath();
        x.arc(-15, 6.5, 4.5, Math.PI / 2, Math.PI * 1.5);
        x.arc(15, 6.5, 4.5, -Math.PI / 2, Math.PI / 2);
        x.closePath();
        x.fill();
        x.beginPath();
        x.arc(27, -3, 5, 0, 6.283);
        x.fill();
        x.restore();
        const url = c.toDataURL('image/png');
        document.querySelectorAll('link[rel="icon"]').forEach(l => l.remove());
        document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon', type: 'image/png', href: url }));
      } catch {
        if (cuImagine) deseneaza(false);
      }
    };
    img.onload = () => deseneaza(true);
    img.onerror = () => deseneaza(false);
    img.src = 'favicon-96x96.png';
  }

  /* ---------- CONFIRMARE FESTIVĂ LA REZERVARE ---------- */
  function confirmareFestiva() {
    const ov = document.getElementById('modalOverlay');
    if (!ov) return;
    const verifica = () => {
      if (!ov.classList.contains('open') || !document.getElementById('modalIcon')?.classList.contains('success')) return;
      const msg = document.getElementById('modalMsg');
      if (!msg || msg.querySelector('.xm-confirm')) return;
      msg.insertAdjacentHTML('beforeend', `<span class="xm-confirm">${ico('xm-tree')} Ne vedem de sărbători!</span>`);
      if (fataMiscare) return;
      const box = ov.querySelector('.modal-box');
      const ploaie = document.createElement('div');
      ploaie.className = 'xm-confetti';
      for (let i = 0; i < 46; i++) {
        const s = 3 + Math.random() * 5;
        ploaie.insertAdjacentHTML('beforeend', `<i style="left:${(Math.random() * 100).toFixed(1)}%;width:${s}px;height:${s}px;background:${['#f3dc9d', '#d6b36a', '#ffffff', '#e2606a'][i % 4]};--dx:${((Math.random() - .5) * 80).toFixed(0)}px;animation-duration:${(2.2 + Math.random() * 2).toFixed(2)}s;animation-delay:${(Math.random() * 1.2).toFixed(2)}s"></i>`);
      }
      box.appendChild(ploaie);
      setTimeout(() => ploaie.remove(), 5000);
    };
    new MutationObserver(() => setTimeout(verifica, 30)).observe(ov, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- MODUL „SEARĂ DE IARNĂ” ---------- */
  function seara() {
    const hero = document.querySelector('.hero');
    if (hero) {
      const cer = document.createElement('div');
      cer.className = 'xm-sky';
      cer.setAttribute('aria-hidden', 'true');
      let stele = '<b class="xm-moon"></b>';
      for (let i = 0; i < 70; i++) {
        const s = (.8 + Math.random() * 1.6).toFixed(1);
        stele += `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;width:${s}px;height:${s}px;animation-delay:-${(Math.random() * 3).toFixed(1)}s"></i>`;
      }
      cer.innerHTML = stele;
      hero.prepend(cer);
    }

    const voal = document.createElement('div');
    voal.className = 'xm-veil';
    document.body.appendChild(voal);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'xm-night-btn';
    const navInner = document.querySelector('.nav-inner');
    navInner?.insertBefore(btn, document.getElementById('hamburger'));

    const aplica = (on, animat) => {
      const schimba = () => {
        stare.noapte = on;
        document.documentElement.classList.toggle('xm-night', on);
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', on ? '#070f17' : '#0a1712');
        btn.setAttribute('aria-pressed', String(on));
        btn.setAttribute('aria-label', on ? 'Oprește modul Seară de iarnă' : 'Pornește modul Seară de iarnă');
        btn.innerHTML = `${ico('moon')}<span class="xm-night-tip">${on ? 'Înapoi la zi' : 'Seară de iarnă'}</span>`;
        stare.reinit?.();
      };
      if (!animat || fataMiscare) return schimba();
      voal.classList.add('on');
      setTimeout(() => { schimba(); voal.classList.remove('on'); }, 380);
    };
    // „Seară de iarnă” e modul implicit; varianta clasică rămâne la un click și se ține minte
    aplica(stoc.get(localStorage, 'xm-noapte') !== '0', false);
    btn.addEventListener('click', () => {
      const on = !stare.noapte;
      stoc.set(localStorage, 'xm-noapte', on ? '1' : '0');
      aplica(on, true);
    });
  }

  /* ---------- GALERIE: POZELE DE IARNĂ PRIMELE ÎN SEZON ---------- */
  // Pozele cu data-iarna sunt permanent în galerie; în sezon le mutăm la început, în ordinea de mai jos.
  // Rulează înainte de main.js, deci și afișarea pe tot ecranul (lightbox) le ia în ordinea nouă.
  const ORDINE_IARNA = ['hero-iarna.jpg', 'iarna-ciubar.jpg', 'iarna-curte.jpg', 'camera-iarna.jpg', 'salon-brad.jpg'];
  function galerieIarna() {
    const pista = document.querySelector('[data-track]');
    if (!pista) return;
    ORDINE_IARNA.slice().reverse().forEach(src => {
      const el = pista.querySelector(`[data-iarna][data-src="${src}"]`);
      if (el) pista.prepend(el);
    });
    pista.querySelectorAll('[data-gallery-btn]').forEach((b, i) => b.setAttribute('aria-label', `Foto ${i + 1}`));
    // la refresh browserul poate reveni la poziția veche a caruselului (la pozele de vară) — pornim de la început
    const laInceput = () => { pista.scrollLeft = 0; };
    addEventListener('load', () => requestAnimationFrame(laInceput));
    addEventListener('pageshow', e => e.persisted && laInceput());
  }

  /* ---------- DECOR PE PAGINĂ ---------- */
  function decor() {
    document.body.insertAdjacentHTML('afterbegin', sprite);
    document.documentElement.classList.add('xm-on');

    const nav = document.querySelector('nav.nav');
    if (nav) {
      const g = document.createElement('div');
      g.className = 'xm-garland';
      nav.appendChild(g);
      let latime = 0;
      const deseneaza = () => {
        const w = nav.clientWidth;
        if (w === latime) return;
        latime = w;
        g.innerHTML = ghirlanda(w, { span: w < 600 ? 150 : 240, seed: 7 });
      };
      deseneaza();
      let tm;
      addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(deseneaza, 200); }, { passive: true });
      legaGlobulete(g);
    }

    urare();
    traditii();
    seara();
    galerieIarna();

    document.querySelectorAll('.hero-box, .zona-card, .review-card').forEach((el, i) => {
      const c = document.createElement('div');
      c.className = 'xm-cap';
      c.innerHTML = capac(Math.max(200, el.offsetWidth || 340), 31 + i * 17);
      el.appendChild(c);
    });

    ninsoare();
  }


  /* ---------- CADOUL (svg) — id-uri unice pe instanță, altfel gradientele dispar în ferestre ascunse ---------- */
  const giftSVG = p => `
<svg viewBox="0 0 140 130" aria-hidden="true">
  <defs>
    <linearGradient id="${p}R" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8414b"/><stop offset="1" stop-color="#7f1c25"/></linearGradient>
    <linearGradient id="${p}L" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9545e"/><stop offset="1" stop-color="#982530"/></linearGradient>
    <linearGradient id="${p}G" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8903f"/><stop offset=".5" stop-color="#f3dc9d"/><stop offset="1" stop-color="#b8903f"/></linearGradient>
  </defs>
  <ellipse cx="70" cy="123" rx="48" ry="6" fill="rgba(0,0,0,.35)"/>
  <rect x="24" y="58" width="92" height="63" rx="6" fill="url(#${p}R)"/>
  <rect x="24" y="58" width="92" height="8" fill="rgba(0,0,0,.2)"/>
  <rect x="63" y="58" width="14" height="63" fill="url(#${p}G)"/>
  <g class="xm-lid">
    <rect x="18" y="42" width="104" height="20" rx="5" fill="url(#${p}L)"/>
    <rect x="63" y="42" width="14" height="20" fill="url(#${p}G)"/>
    <path d="M70 42C55 21 37 26 44 37c4 6 15 6 26 5z" fill="url(#${p}G)"/>
    <path d="M70 42c15-21 33-16 26-5-4 6-15 6-26 5z" fill="url(#${p}G)"/>
    <circle cx="70" cy="41" r="6.5" fill="#e6c77f"/>
    <g fill="#f6fafc"><ellipse cx="32" cy="42.5" rx="11" ry="3.4"/><ellipse cx="50" cy="42" rx="8" ry="2.8"/><ellipse cx="92" cy="42.3" rx="10" ry="3.2"/><ellipse cx="111" cy="43" rx="9" ry="3"/></g>
  </g>
</svg>`;

  // Deschide capacul cadoului cu scântei, apoi cheamă `dupa`
  function deschideCapac(gift, dupa) {
    if (gift.classList.contains('opened')) return;
    if (fataMiscare) return dupa();
    gift.classList.add('opened');
    scantei(gift.querySelector('.xm-burst'), 22);
    setTimeout(dupa, 800);
  }

  /* ---------- FEREASTRĂ (pop-up) COMUNĂ ---------- */
  const ferestre = [];
  function fereastra(clasa, titluId) {
    const ov = document.createElement('div');
    ov.className = `xm-overlay ${clasa}`;
    ov.innerHTML = `
<div class="xm-card" role="dialog" aria-modal="true" aria-labelledby="${titluId}" tabindex="-1">
  <div class="xm-flurry"></div>
  <div class="xm-card-garland"></div>
  <button type="button" class="xm-x" aria-label="Închide">✕</button>
  <button type="button" class="xm-x xm-back" aria-label="Înapoi" hidden>‹</button>
  <div class="xm-body"></div>
</div>`;
    document.body.appendChild(ov);
    const card = ov.querySelector('.xm-card');
    const flurry = ov.querySelector('.xm-flurry');
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('i');
      const s = 2 + Math.random() * 3;
      el.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;--dx:${(Math.random() - .5) * 60}px;animation-duration:${6 + Math.random() * 6}s;animation-delay:-${Math.random() * 10}s;opacity:${.3 + Math.random() * .5}`;
      flurry.appendChild(el);
    }
    legaGlobulete(ov.querySelector('.xm-card-garland'));

    let ultimFocus = null;
    const w = {
      ov, card, body: ov.querySelector('.xm-body'), back: ov.querySelector('.xm-back'),
      laInchidere: null,
      etapa(n) {
        w.etapaCurenta = n;
        ov.dataset.etapa = n;
        w.body.querySelectorAll('.xm-stage').forEach((s, i) => { s.hidden = i + 1 !== n; });
        w.back.hidden = !w.body.querySelector(`.xm-stage:nth-child(${n})`)?.hasAttribute('data-back');
        card.classList.toggle('wide', !!w.body.querySelector(`.xm-stage:nth-child(${n})`)?.hasAttribute('data-wide'));
      },
      deschide() {
        ferestre.forEach(x => x !== w && x.inchide(true));
        ultimFocus = document.activeElement;
        ov.classList.add('open');
        stare.pauzaZapada = true;             // ninsoarea de sub fereastră nu se mai desenează (e acoperită oricum)
        document.documentElement.classList.add('xm-modal');
        // ghirlanda cardului se desenează acum, sincron, ca să nu „taie” primele cadre ale animațiilor;
        // o refacem doar dacă s-a schimbat lățimea
        const cg = ov.querySelector('.xm-card-garland');
        if (cg.dataset.w !== String(cg.clientWidth)) {
          cg.dataset.w = cg.clientWidth;
          cg.innerHTML = ghirlanda(cg.clientWidth, { span: 150, sag: 7, top: 12, h: 60, seed: 3, scale: .9 });
        }
        card.focus({ preventScroll: true });
      },
      inchide(tacit) {
        if (!ov.classList.contains('open') || ov.classList.contains('closing')) return;
        const gata = () => { ov.classList.remove('open', 'closing'); stare.pauzaZapada = false; document.documentElement.classList.remove('xm-modal'); };
        if (tacit || fataMiscare) gata();
        else { ov.classList.add('closing'); setTimeout(gata, 380); }
        if (!tacit) w.laInchidere?.();
        ultimFocus?.focus?.({ preventScroll: true });
      },
    };
    ov.querySelector('.xm-x').addEventListener('click', () => w.inchide());
    ov.addEventListener('click', e => e.target === ov && w.inchide());
    document.addEventListener('keydown', e => e.key === 'Escape' && w.inchide());
    ferestre.push(w);
    return w;
  }

  // Completează mesajul în formular, derulează la rezervare și deschide calendarul
  function rezervaCu(mesaj) {
    const note = document.getElementById('note');
    if (note && !note.value.includes(mesaj)) note.value = mesaj + (note.value ? '\n' + note.value : '');
    document.getElementById('rezerva')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const ci = document.getElementById('checkin');
      if (ci && !ci.value) ci.click();
    }, 900);
  }
  const linkWA = text => `https://api.whatsapp.com/send?phone=${TELEFON_WA}&text=${encodeURIComponent(text)}`;

  /* ---------- „REVELION — SOLD OUT” (ilustrație + ștampilă) ---------- */
  const REVELION_SOLD_OUT = `
  <div class="xm-nye" role="note" aria-label="Revelionul este deja rezervat integral">
    <svg class="xm-nye-art" viewBox="0 0 120 96" aria-hidden="true">
      <g stroke-linecap="round" fill="none">
        <g stroke="#f3dc9d" stroke-width="1.8" opacity=".9"><path d="M84 18v-8M84 26v8M76 22h-8M92 22h8M78 16l-5-5M90 28l5 5M90 16l5-5M78 28l-5 5"/></g>
        <g stroke="#e2606a" stroke-width="1.5" opacity=".8"><path d="M24 14v-6M24 20v6M18 17h-6M30 17h6M20 13l-4-4M28 21l4 4M28 13l4-4M20 21l-4 4"/></g>
        <g stroke="#8fd3ff" stroke-width="1.3" opacity=".7"><path d="M104 46v-4M104 50v4M100 48h-4M108 48h4"/></g>
      </g>
      <g transform="rotate(-12 48 60)">
        <path d="M38 34h20l-2 18a8 8 0 0 1-16 0z" fill="rgba(243,220,157,.22)" stroke="#f3dc9d" stroke-width="1.6"/>
        <path d="M40 44h16l-1 8a7 7 0 0 1-14 0z" fill="#f3dc9d" opacity=".75"/>
        <path d="M48 60v20M40 82h16" stroke="#f3dc9d" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="45" cy="47" r="1" fill="#fff"/><circle cx="51" cy="42" r=".9" fill="#fff"/><circle cx="48" cy="38" r=".8" fill="#fff"/>
      </g>
      <g transform="rotate(14 72 60)">
        <path d="M62 36h20l-2 18a8 8 0 0 1-16 0z" fill="rgba(243,220,157,.22)" stroke="#f3dc9d" stroke-width="1.6"/>
        <path d="M64 46h16l-1 8a7 7 0 0 1-14 0z" fill="#f3dc9d" opacity=".75"/>
        <path d="M72 62v20M64 84h16" stroke="#f3dc9d" stroke-width="1.8" stroke-linecap="round"/>
      </g>
    </svg>
    <div class="xm-nye-txt"><strong>Revelion ${AN + 1} <span class="xm-stamp">Sold out</span></strong><span>Casa e rezervată integral. Mulțumim!</span></div>
  </div>`;

  /* ---------- OFERTA DE CRĂCIUN (din butonul din hero) ---------- */
  function oferta() {
    const w = fereastra('xm-oferta', 'xmTitluOf');
    w.body.innerHTML = `
  <div class="xm-stage xm-s1">
    <button type="button" class="xm-gift" aria-label="Deschide cadoul">${giftSVG('xmOf')}<span class="xm-burst"></span></button>
    <div class="xm-kicker">${OFERTA.kicker}</div>
    <h3 id="xmTitluOf">${OFERTA.titlu}</h3>
    <p class="xm-text">${OFERTA.teaser}</p>
    <div class="xm-hook">${ico('xm-house')} ${OFERTA.hook} <b>${OFERTA.reducere}</b></div>
    <button type="button" class="btn primary full xm-open">${ico('xm-gift')} Deschide cadoul</button>
    <button type="button" class="xm-later">Poate mai târziu</button>
  </div>
  <div class="xm-stage xm-s2" data-back data-wide hidden>
    <div class="xm-kicker">${OFERTA.kicker}</div>
    <h3>${OFERTA.titlu}</h3>
    <div class="xm-period">${ico('calendar-check')} ${OFERTA.perioada}</div>
    <ul class="xm-list">
      ${OFERTA.include.map(([i, t, d], k) => `<li style="animation-delay:${120 + k * 90}ms">${ico(i)}<div><strong>${t}</strong><span>${d}</span></div></li>`).join('')}
    </ul>
    <div class="xm-price">
      <div><s>${OFERTA.pret.vechi} RON</s><strong>${OFERTA.pret.nou} RON</strong><small>${OFERTA.pret.unitate}</small><em class="xm-save">${OFERTA.pret.economie}</em></div>
      <span class="xm-badge">${insigna(OFERTA.reducere)}</span>
    </div>
    <p class="xm-terms">${OFERTA.conditii}</p>
    ${REVELION_SOLD_OUT}
    <div class="xm-actions">
      <button type="button" class="btn primary full xm-book">${ico('calendar-check')} Rezervă oferta</button>
      <a class="btn full" href="${linkWA(OFERTA.whatsapp)}" target="_blank" rel="noopener">${ico('whatsapp')} Întreabă pe WhatsApp</a>
    </div>
  </div>`;
    const gift = w.body.querySelector('.xm-gift');
    const deschideCadou = () => deschideCapac(gift, () => { stoc.set(sessionStorage, 'xm-of-deschis', '1'); w.etapa(2); });
    gift.addEventListener('click', deschideCadou);
    w.body.querySelector('.xm-open').addEventListener('click', deschideCadou);
    w.body.querySelector('.xm-later').addEventListener('click', () => w.inchide());
    w.back.addEventListener('click', () => { gift.classList.remove('opened'); w.etapa(1); });
    w.body.querySelector('.xm-book').addEventListener('click', () => { w.inchide(); rezervaCu(OFERTA.mesajRezervare); });

    const deschide = () => {
      gift.classList.remove('opened');
      w.etapa(stoc.get(sessionStorage, 'xm-of-deschis') ? 2 : 1);
      w.deschide();
    };

    const actiuni = document.querySelector('.hero-actions');
    if (actiuni) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'xm-hero-chip';
      chip.innerHTML = `${ico('xm-gift')} ${OFERTA.nume}`;
      chip.addEventListener('click', deschide);
      actiuni.insertAdjacentElement('afterend', chip);
    }
  }

  /* ---------- JOCUL CU BRADUL (pop-up-ul de la intrare) + CADOUL ---------- */
  function joc() {
    const w = fereastra('xm-joc', 'xmTitluJoc');
    const pana = Math.ceil((CRACIUN - new Date(azi.getFullYear(), azi.getMonth(), azi.getDate())) / 864e5);
    w.body.innerHTML = `
  <div class="xm-stage xm-j1">
    <div class="xm-kicker">Joc de sărbători</div>
    <h3 id="xmTitluJoc">Împodobește bradul și vezi ce câștigi</h3>
    <p class="xm-text" data-tree-hint>Atinge bradul ca să agăți ${BRAD_TINTA} globulețe, apoi aprinde steaua din vârf.</p>
    <div class="xm-tree-wrap">${bradSVG()}<span class="xm-burst"></span></div>
    <div class="xm-tree-bar"><span><b data-tree-count>0</b> / ${BRAD_TINTA} globulețe</span><button type="button" class="xm-linkbtn" data-tree-reset>Ia-o de la capăt</button></div>
    ${pana > 0 ? `<div class="xm-xmas">🎄 <b>${pana} ${pana === 1 ? 'zi' : 'zile'}</b> până în Ajunul Crăciunului</div>` : ''}
    <button type="button" class="xm-later">Poate mai târziu</button>
  </div>
  <div class="xm-stage xm-j2" hidden>
    <div class="xm-kicker">Bravo!</div>
    <h3>Ai împodobit bradul — iar sub el te așteaptă ceva</h3>
    <button type="button" class="xm-gift" aria-label="Deschide cadoul">${giftSVG('xmJc')}<span class="xm-burst"></span></button>
    <button type="button" class="btn primary full xm-open">${ico('xm-gift')} Deschide cadoul</button>
  </div>
  <div class="xm-stage xm-j3" data-wide hidden>
    <div class="xm-kicker">Cadoul tău de sărbători</div>
    <div class="xm-big">${insigna(CADOU.reducere)}</div>
    <h3>500 RON reducere pe noapte la închirierea întregii case</h3>
    <div class="xm-period">${ico('calendar-check')} ${CADOU.perioada}</div>
    <ul class="xm-list">
      <li style="animation-delay:120ms">${ico('xm-house')}<div><strong>Toată casa doar pentru voi</strong><span>Închiriere integrală — perfectă pentru familie sau prieteni.</span></div></li>
      <li style="animation-delay:210ms">${ico('moon')}<div><strong>Minim 2 nopți</strong><span>Alegi tu zilele: ${CADOU.perioada}.</span></div></li>
      <li style="animation-delay:300ms">${ico('xm-tree')}<div><strong>Casă de sărbătoare</strong><span>Brad împodobit, seri la foc în foișor și liniște la munte.</span></div></li>
    </ul>
    <div class="xm-price">
      <div><s>${CADOU.pret.vechi} RON</s><strong>${CADOU.pret.nou} RON</strong><small>${CADOU.pret.unitate}</small><em class="xm-save">${CADOU.pret.economie}</em></div>
      <span class="xm-badge">${insigna(CADOU.reducere)}</span>
    </div>
    <p class="xm-terms">${CADOU.conditii}</p>
    <div class="xm-actions">
      <button type="button" class="btn primary full xm-book">${ico('calendar-check')} Revendică reducerea</button>
      <a class="btn full" href="${linkWA(CADOU.whatsapp)}" target="_blank" rel="noopener">${ico('whatsapp')} Întreabă pe WhatsApp</a>
    </div>
  </div>`;

    if (modTest) stoc.set(localStorage, 'xm-cadou', '0');
    const castigat = () => stoc.get(localStorage, 'xm-cadou') === '1';
    const gift = w.body.querySelector('.xm-j2 .xm-gift');
    const arataCadou = () => deschideCapac(gift, () => w.etapa(3));

    brad(w.body.querySelector('.xm-j1'), () => {
      stoc.set(localStorage, 'xm-cadou', '1');
      window.cbRecalcPret?.();                  // prețul din formular trece pe reducere
      actualizeazaFab();
      w.etapa(2);
    });
    gift.addEventListener('click', arataCadou);
    w.body.querySelector('.xm-j2 .xm-open').addEventListener('click', arataCadou);
    w.body.querySelector('.xm-later').addEventListener('click', () => w.inchide());
    w.body.querySelector('.xm-book').addEventListener('click', () => { w.inchide(); rezervaCu(CADOU.mesajRezervare); });

    // cadoul plutitor
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'xm-fab';
    document.body.appendChild(fab);
    const actualizeazaFab = () => {
      const tip = castigat() ? 'Cadoul tău: -500 RON/noapte 🎁' : 'Împodobește bradul și câștigă 🎄';
      fab.setAttribute('aria-label', tip);
      fab.innerHTML = `${ico('xm-gift')}<span class="xm-fab-tip">${tip}</span>`;
    };
    actualizeazaFab();
    const arataFab = () => requestAnimationFrame(() => fab.classList.add('show'));

    const deschide = intro => {
      gift.classList.remove('opened');
      w.etapa(castigat() ? 3 : 1);
      fab.classList.remove('show');
      stoc.set(sessionStorage, 'xm-vazut', '1');
      w.deschide();
      if (intro === true) {
        document.documentElement.classList.add('xm-intro-on');    // caseta din hero așteaptă finalul intro-ului
        introSanie(w);
      }
    };
    w.laInchidere = () => {
      stoc.set(localStorage, 'xm-inchis', String(Date.now()));
      document.documentElement.classList.remove('xm-intro-on');   // caseta din hero urcă în pagină
      arataFab();
    };
    fab.addEventListener('click', () => deschide());
    stare.deschideJoc = () => deschide();
    document.querySelector('[data-play]')?.addEventListener('click', () => deschide());

    // „Dacă nu vrei, derulezi”: prima derulare în jos închide jocul și arată hero-ul —
    // DOAR pe ecranul cu bradul. După câștig (cadoul, reducerea) derularea doar coboară prin card.
    const ov = w.ov;
    const peBrad = () => w.etapaCurenta === 1;
    const laCapat = () => ov.scrollHeight - ov.scrollTop - ov.clientHeight < 4;
    ov.addEventListener('wheel', e => {
      if (peBrad() && e.deltaY > 0 && laCapat()) { e.preventDefault(); w.inchide(); }
    }, { passive: false });
    let y0 = null;
    ov.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
    ov.addEventListener('touchmove', e => {
      if (peBrad() && y0 !== null && y0 - e.touches[0].clientY > 45 && laCapat()) { y0 = null; w.inchide(); }
    }, { passive: true });
    document.addEventListener('keydown', e => {
      if (!ov.classList.contains('open') || !peBrad()) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); w.inchide(); }
    });

    // apariție automată — o dată pe sesiune, nu mai des de 2 zile după închidere, nu după ce a câștigat
    const inchisRecent = Date.now() - (+stoc.get(localStorage, 'xm-inchis') || 0) < PAUZA_DUPA_INCHIDERE;
    const automat = modTest || (!castigat() && !stoc.get(sessionStorage, 'xm-vazut') && !inchisRecent && !location.hash);
    if (!automat) { arataFab(); return; }
    const incearca = () => {
      const ocupat = document.querySelector('.modal-overlay.open, .lightbox.open, .mobile-menu.open, .cal-pop.open, .xm-overlay.open')
                  || document.activeElement?.closest?.('form');
      if (ocupat) return setTimeout(incearca, 4000);
      deschide(true);
    };
    introProgramat = true;
    setTimeout(incearca, 250);
  }

  /* ---------- INTRO: SANIA LUI MOȘ CRĂCIUN ADUCE JOCUL ---------- */
  const ren = (x, y, rudolf, p) => `
  <g transform="translate(${x} ${y})">
    <g transform="rotate(${14 * p} 8 6)"><path d="M10 6l9 9M5 7l4 13" stroke="#5c3a22" stroke-width="3.2" stroke-linecap="round"/></g>
    <g transform="rotate(${-14 * p} -14 5)"><path d="M-12 6l-11 8M-16 4l-15 3" stroke="#5c3a22" stroke-width="3.2" stroke-linecap="round"/></g>
    <ellipse cx="0" cy="0" rx="20" ry="9.5" fill="#8a5a3c"/>
    <ellipse cx="-2" cy="3" rx="13" ry="4.5" fill="#a87652" opacity=".6"/>
    <circle cx="-20" cy="-4" r="3.4" fill="#f1e4d0"/>
    <path d="M13 -4Q21 -13 25 -20" stroke="#8a5a3c" stroke-width="7.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="30" cy="-22" rx="8.5" ry="5.2" fill="#8a5a3c" transform="rotate(-14 30 -22)"/>
    <path d="M26 -26l-3 -10m1.5 4.5l-6 -3M30 -27l3 -11m-1.2 5l5 -4" stroke="#d6b36a" stroke-width="1.7" stroke-linecap="round" fill="none"/>
    <circle cx="31" cy="-24" r="1.2" fill="#1a1a1a"/>
    ${rudolf ? '<circle cx="38.5" cy="-20.5" r="4" fill="#ff4d4d" opacity=".35"/><circle cx="38.5" cy="-20.5" r="2.6" fill="#ff3030"/>' : '<circle cx="38" cy="-20.5" r="2" fill="#3a2414"/>'}
    <path d="M-6 -6h14" stroke="#c8414b" stroke-width="3" stroke-linecap="round"/>
  </g>`;
  // Dâra de scântei din spatele saniei, desenată direct în imagine (pe telefon înlocuiește scânteile animate)
  const DARA = (() => {
    const r = rng(21), culori = ['#ffe39a', '#ffffff', '#ffd36b', '#ffb35c'];
    let s = '';
    for (let i = 0; i < 30; i++) {
      const x = 16 - i * 3.4 + (r() - .5) * 4, y = 93 + i * .55 + (r() - .5) * 10;
      const raza = Math.max(.6, 2.8 - i * .075) * (.7 + r() * .6), op = Math.max(.08, 1 - i / 30);
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(raza * 2.2)}" fill="${culori[i % 4]}" opacity="${f(op * .18)}"/>`;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(raza)}" fill="${culori[i % 4]}" opacity="${f(op)}"/>`;
    }
    return s;
  })();
  // Sania e randată ca imagine (două cadre pentru galop): o imagine care doar se mută e aproape gratuită
  // pentru telefon, pe când un SVG cu părți animate se redesena la fiecare cadru.
  const sanieSVG = p => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-90 0 390 112">
  <defs>
    <linearGradient id="xmSnR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23a46"/><stop offset="1" stop-color="#7f1c25"/></linearGradient>
  </defs>
  <g opacity=".95">${DARA}</g>
  <g>
    <path d="M108 60L196 36M108 64L272 30" stroke="#d6b36a" stroke-width="1.3" fill="none" opacity=".9"/>
    ${ren(186, 62, false, p)}
    ${ren(258, 54, true, -p)}
    <ellipse cx="38" cy="46" rx="15" ry="17" fill="#7a5232"/>
    <path d="M30 32h22" stroke="#d6b36a" stroke-width="2"/>
    <rect x="27" y="22" width="11" height="11" rx="1.5" fill="#c8414b"/><rect x="31" y="22" width="3" height="11" fill="#f3dc9d"/>
    <rect x="40" y="25" width="10" height="9" rx="1.5" fill="#f3dc9d"/><rect x="40" y="28.5" width="10" height="2.4" fill="#c8414b"/>
    <circle cx="66" cy="49" r="14" fill="#c8414b"/>
    <rect x="53" y="52" width="26" height="4" fill="#2b1a10"/><rect x="63" y="51.5" width="5" height="5" fill="#d6b36a"/>
    <circle cx="68" cy="31" r="7.2" fill="#f2c9a0"/>
    <ellipse cx="71" cy="37.5" rx="7.5" ry="6" fill="#ffffff"/>
    <path d="M60 27L76 27Q72 15 58 12Z" fill="#c8414b"/>
    <circle cx="57" cy="12" r="3.2" fill="#ffffff"/>
    <rect x="59" y="25" width="18" height="4.2" rx="2" fill="#ffffff"/>
    <path d="M72 46L86 33" stroke="#c8414b" stroke-width="5.5" stroke-linecap="round"/><circle cx="87" cy="32" r="3.4" fill="#1d5e3b"/>
    <path d="M22 58L96 58Q112 58 114 44L121 44Q121 76 100 84L34 84Q22 84 22 72Z" fill="url(#xmSnR)"/>
    <path d="M26 62L100 62" stroke="#f3dc9d" stroke-width="2" opacity=".85"/>
    <path d="M40 84v10M92 84v10" stroke="#b8903f" stroke-width="2.4"/>
    <path d="M14 95L106 95Q124 95 127 80" stroke="#d6b36a" stroke-width="3.4" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

  function introSanie(w) {
    if (fataMiscare) return;
    const { ov, card } = w;
    card.classList.add('xm-wait');
    ov.classList.add('xm-anim');               // fără bare de derulare cât vine cardul
    const telefon = matchMedia('(pointer: coarse)').matches || innerWidth < 700;
    card.classList.add('xm-wait');

    const sanie = document.createElement('div');
    sanie.className = 'xm-sleigh';
    const cadru = p => `<img alt="" decoding="async" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanieSVG(p))}">`;
    sanie.innerHTML = cadru(1) + cadru(-1);
    ov.appendChild(sanie);

    const skip = document.createElement('div');
    skip.className = 'xm-skip';
    skip.innerHTML = 'Derulează ca să intri pe site<span></span>';
    ov.appendChild(skip);

    // Zborul e calculat pe un singur ceas (rAF), ca sania, scânteile și căderea cardului să rămână sincronizate
    // și pe telefoane lente: curbă Bézier de la stânga-jos, prin centru-sus, spre dreapta-sus.
    const DURATA = 3300, CADERE = .42;
    const culori = ['#ffe39a', '#ffffff', '#ffd36b', '#ffb35c'];
    const usor = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    let t0 = null, ultimaScanteie = 0, aterizat = false;
    const aterizeaza = (sx, sy) => {
      aterizat = true;
      const c = card.getBoundingClientRect();
      card.style.setProperty('--fx', `${(sx - (c.left + c.width / 2)).toFixed(0)}px`);
      card.style.setProperty('--fy', `${(sy - (c.top + c.height / 2)).toFixed(0)}px`);
      card.classList.replace('xm-wait', 'xm-drop');
      // după aterizare cardul rămâne pe loc (fără să repornească animația normală de apariție)
      card.addEventListener('animationend', e => { if (e.target === card) { card.classList.replace('xm-drop', 'xm-landed'); ov.classList.remove('xm-anim'); } });
    };
    let W, H, sw, sh, cadruGalop = 0;
    const zbor = acum => {
      if (t0 === null) {                      // dimensiunile o singură dată (citirea lor la fiecare cadru forța relayout)
        t0 = acum;
        W = innerWidth; H = innerHeight; sw = sanie.offsetWidth; sh = sanie.offsetHeight;
      }
      const t = Math.min(1, (acum - t0) / DURATA), u = usor(t);
      const g = Math.floor((acum - t0) / 150) % 2;   // galop: alternăm cele două cadre
      if (g !== cadruGalop) { cadruGalop = g; sanie.classList.toggle('alt', g === 1); }
      const P0 = [-sw * 1.1, H * .24], M = [W / 2 - sw / 2, H * .07], P2 = [W * 1.04, -H * .14];
      const P1 = [2 * M[0] - (P0[0] + P2[0]) / 2, 2 * M[1] - (P0[1] + P2[1]) / 2];
      const x = (1 - u) ** 2 * P0[0] + 2 * (1 - u) * u * P1[0] + u * u * P2[0];
      const y = (1 - u) ** 2 * P0[1] + 2 * (1 - u) * u * P1[1] + u * u * P2[1] + Math.sin((acum - t0) / 90) * 3;
      const rot = u < .5 ? -5 + 4 * u : -3 - 16 * (u - .5);
      sanie.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;

      if (!telefon && acum - ultimaScanteie > 50) {   // pe telefon dâra e desenată în imaginea saniei
        ultimaScanteie = acum;
        const p = document.createElement('i');
        p.className = 'xm-spark';
        p.style.cssText = `left:${(x + sw * .31).toFixed(0)}px;top:${(y + sh * (.7 + Math.random() * .2)).toFixed(0)}px;background:${culori[Math.floor(Math.random() * 4)]}`;
        ov.appendChild(p);
        setTimeout(() => p.remove(), 900);
      }
      if (!aterizat && t >= CADERE) aterizeaza(x + sw * .38, y + sh);

      if (t < 1 && ov.classList.contains('open')) requestAnimationFrame(zbor);
      else {
        sanie.remove();
        if (!aterizat) { card.classList.remove('xm-wait'); ov.classList.remove('xm-anim'); }
      }
    };
    // pornim zborul abia după ce imaginile saniei sunt decodate (altfel primele cadre sacadează)
    Promise.all([...sanie.querySelectorAll('img')].map(i => i.decode().catch(() => {})))
      .then(() => requestAnimationFrame(zbor));

    // la închidere curățăm intro-ul ca fereastra să revină la normal
    const cand = new MutationObserver(() => {
      if (ov.classList.contains('open')) return;
      ov.classList.remove('xm-intro', 'xm-anim');
      card.classList.remove('xm-wait', 'xm-drop', 'xm-landed');
      ov.querySelectorAll('.xm-sleigh, .xm-skip, .xm-spark').forEach(el => el.remove());
      cand.disconnect();
    });
    cand.observe(ov, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- START ---------- */
  let introProgramat = false;
  const start = () => {
    decor();
    if (ofertaActiva) oferta();
    if (jocActiv) joc();
    felicitare();
    titluTab();
    iconita();
    confirmareFestiva();
    // scriptul din <head> ascunde caseta din hero pentru intro; dacă intro-ul nu pornește, o arătăm
    if (!introProgramat) document.documentElement.classList.remove('xm-intro-on');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
