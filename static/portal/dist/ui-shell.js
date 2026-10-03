(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  q('.portal-page')?.classList.add('wrap');

  const navItems = () => qa('.topnav > .nav-item[data-scroll]');
  const sectionFor = (btn) => document.getElementById(btn.dataset.scroll);
  const isShown = (el) => Boolean(el) && !el.hidden && el.offsetParent !== null;

  function setActive(id) {
    navItems().forEach((btn) => {
      const active = btn.dataset.scroll === id;
      btn.classList.toggle('active', active);
      if (active) btn.setAttribute('aria-current', 'true'); else btn.removeAttribute('aria-current');
    });
  }

  // A tab only appears when its section has content (e.g. My Assets needs the
  // Asset Manager companion app; Reports needs reporting switched on).
  function syncTabs() {
    navItems().forEach((btn) => { btn.hidden = !isShown(sectionFor(btn)) && btn.dataset.scroll !== 'home'; });
    const active = navItems().find((btn) => btn.classList.contains('active'));
    if (!active || active.hidden) setActive('home');
    fitTabs();
  }

  // Tabs that don't fit the menu bar move into a "More" menu, instead of the bar
  // scrolling sideways (the portal column is often narrow).
  const nav = q('.topnav');
  const more = document.createElement('div');
  more.className = 'nav-more';
  more.hidden = true;
  more.innerHTML = '<button type="button" class="nav-item nav-more-btn" aria-haspopup="true" aria-expanded="false">More &#9662;</button><div class="nav-more-menu" role="menu" hidden></div>';
  nav?.appendChild(more);
  const moreBtn = more.querySelector('.nav-more-btn');
  const moreMenu = more.querySelector('.nav-more-menu');
  const closeMore = () => { moreMenu.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); };
  moreBtn.addEventListener('click', (event) => { event.stopPropagation(); moreMenu.hidden = !moreMenu.hidden; moreBtn.setAttribute('aria-expanded', String(!moreMenu.hidden)); window.dispatchEvent(new Event('resize')); });
  document.addEventListener('click', (event) => { if (!more.contains(event.target)) closeMore(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMore(); });

  function fitTabs() {
    if (!nav) return;
    const items = navItems().filter((btn) => !btn.hidden);
    items.forEach((btn) => btn.classList.remove('nav-overflow'));
    more.hidden = true;
    moreMenu.innerHTML = '';
    if (nav.scrollWidth <= nav.clientWidth + 1) return;
    more.hidden = false;
    const overflow = [];
    // Keep Home and the active tab; move the rest from the end until it fits.
    for (const btn of [...items].reverse()) {
      if (nav.scrollWidth <= nav.clientWidth + 1) break;
      if (btn.dataset.scroll === 'home' || btn.classList.contains('active')) continue;
      btn.classList.add('nav-overflow');
      overflow.unshift(btn);
    }
    if (!overflow.length) { more.hidden = true; return; }
    overflow.forEach((btn) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.setAttribute('role', 'menuitem');
      item.textContent = btn.textContent;
      item.addEventListener('click', () => { closeMore(); scrollToId(btn.dataset.scroll); fitTabs(); });
      moreMenu.appendChild(item);
    });
  }
  if (nav && 'ResizeObserver' in window) new ResizeObserver(() => fitTabs()).observe(nav);

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!isShown(el)) return false;
    setActive(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  // Delegated so tabs added later (companion apps) work too.
  q('.topnav')?.addEventListener('click', (event) => { const btn = event.target.closest('.nav-item[data-scroll]'); if (btn) scrollToId(btn.dataset.scroll); });
  qa('[data-focus-search]').forEach((btn) => btn.addEventListener('click', () => q('#hero-search-input')?.focus()));

  const hero = q('#hero-search-input');
  const request = q('#request-search');
  function runHeroSearch() {
    if (!hero || !request) return;
    request.value = hero.value;
    request.dispatchEvent(new Event('input', { bubbles: true }));
    scrollToId('requests-section');
    request.focus();
  }
  q('#hero-search-button')?.addEventListener('click', runHeroSearch);
  hero?.addEventListener('keydown', (event) => { if (event.key === 'Enter') runHeroSearch(); });

  // The highlight follows clicks only. Inside Jira the portal frame is sized to
  // fit its content and never scrolls itself (the Jira page does), so every
  // section always counts as "in view"; tracking visibility previously lit up
  // whichever small section was fully visible (usually Reports).

  const watcher = new MutationObserver(syncTabs);
  const watch = () => navItems().map(sectionFor).filter(Boolean).forEach((el) => watcher.observe(el, { attributes: true, attributeFilter: ['hidden'] }));
  watch();
  window.addEventListener('portalplus:nav-changed', () => { watch(); syncTabs(); });
  syncTabs();
})();
