(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  q('.portal-page')?.classList.add('wrap');

  const navItems = () => qa('.nav-item[data-scroll]');
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
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!isShown(el)) return false;
    setActive(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  navItems().forEach((btn) => btn.addEventListener('click', () => scrollToId(btn.dataset.scroll)));
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
  navItems().map(sectionFor).filter(Boolean).forEach((el) => watcher.observe(el, { attributes: true, attributeFilter: ['hidden'] }));
  syncTabs();
})();
