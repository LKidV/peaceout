(() => {
  const root = document.documentElement;
  const story = document.querySelector('.story');
  const stage = document.querySelector('.stage');
  const work = document.querySelector('.scene--work');
  const intro = document.querySelector('.scene--intro');
  const white = document.querySelector('.scene--white');
  const navigation = [...document.querySelectorAll('.main-nav a')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let framePending = false;

  const clamp = (value) => Math.max(0, Math.min(1, value));

  function updateScenes() {
    framePending = false;

    if (reducedMotion.matches) {
      root.classList.remove('has-scroll-scenes');
      [work, intro, white].forEach((scene) => { scene.inert = false; });
      navigation.forEach((link) => link.removeAttribute('aria-current'));
      return;
    }

    root.classList.add('has-scroll-scenes');
    const headerHeight = document.querySelector('.site-header').offsetHeight;
    const progress = (headerHeight - story.getBoundingClientRect().top) / stage.offsetHeight;
    const enter = clamp(progress);
    const wipe = clamp(progress - 1);

    stage.style.setProperty('--intro-enter', `${(1 - enter) * 100}%`);
    stage.style.setProperty('--intro-wipe', `${wipe * 100}%`);
    stage.style.setProperty('--work-visibility', progress >= 1 ? 'hidden' : 'visible');

    // Hidden layers must not receive keyboard focus or screen-reader navigation.
    work.inert = progress >= 1;
    intro.inert = progress <= 0 || progress >= 2;
    white.inert = progress <= 1;

    const current = progress < 0.5 ? '#home' : progress < 1 ? '#portfolio' : '#about';
    navigation.forEach((link) => {
      if (link.hash === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function requestUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateScenes);
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;

    event.preventDefault();
    history.pushState(null, '', link.hash);
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    // Keep subsequent keyboard navigation at the destination of the link.
    if (target.classList.contains('scene-anchor')) {
      const scene = link.hash === '#about' ? intro : link.hash === '#studio' ? white : work;
      scene.inert = false;
      scene.setAttribute('tabindex', '-1');
      scene.focus({ preventScroll: true });
    } else {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  reducedMotion.addEventListener('change', requestUpdate);
  updateScenes();
})();
