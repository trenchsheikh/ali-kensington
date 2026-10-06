const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  nav.classList.toggle('open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
  document.body.classList.remove('menu-open');
}));

document.querySelector('[data-year]').textContent = new Date().getFullYear();

const heroVideo = document.querySelector('[data-hero-video]');

if (heroVideo) {
  const keepHeroPlaying = () => {
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.volume = 0;
    heroVideo.play().catch(() => {});
  };

  heroVideo.addEventListener('volumechange', keepHeroPlaying);
  heroVideo.addEventListener('pause', () => {
    if (!document.hidden) window.requestAnimationFrame(keepHeroPlaying);
  });
  heroVideo.addEventListener('canplay', keepHeroPlaying);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) keepHeroPlaying();
  });
  window.addEventListener('pageshow', keepHeroPlaying);
  ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
    document.addEventListener(eventName, keepHeroPlaying, { once: true, passive: true });
  });
  keepHeroPlaying();
}

const carousel = document.querySelector('[data-review-carousel]');

if (carousel) {
  const cards = [...carousel.querySelectorAll('.review-card')];
  const previousButton = document.querySelector('[data-carousel-prev]');
  const nextButton = document.querySelector('[data-carousel-next]');
  const status = document.querySelector('[data-carousel-status]');
  const dialog = document.querySelector('[data-review-dialog]');
  const dialogCopy = dialog.querySelector('[data-dialog-copy]');
  const dialogName = dialog.querySelector('[data-dialog-name]');
  const dialogSource = dialog.querySelector('[data-dialog-source]');
  const closeDialogButton = dialog.querySelector('[data-dialog-close]');
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = 0;
  let autoTimer;
  let resumeTimer;
  let scrollTimer;
  let lastTrigger;

  const cardStep = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(carousel).gap || 0);

  const visibleCards = () => Math.max(1, Math.round(carousel.clientWidth / cardStep()));

  const maxIndex = () => Math.max(0, cards.length - visibleCards());

  const announce = () => {
    status.textContent = `Showing review ${currentIndex + 1} of ${cards.length}`;
  };

  const goTo = (index, behavior = 'smooth') => {
    currentIndex = index > maxIndex() ? 0 : index < 0 ? maxIndex() : index;
    carousel.scrollTo({ left: currentIndex * cardStep(), behavior: reduceMotion.matches ? 'auto' : behavior });
    announce();
  };

  const stopAuto = () => {
    window.clearInterval(autoTimer);
    window.clearTimeout(resumeTimer);
  };

  const startAuto = () => {
    stopAuto();
    if (reduceMotion.matches || dialog.open) return;
    autoTimer = window.setInterval(() => goTo(currentIndex + 1), 8000);
  };

  const resumeAfterDelay = () => {
    stopAuto();
    resumeTimer = window.setTimeout(startAuto, 3000);
  };

  const setMobileTruncation = () => {
    cards.forEach((card) => {
      const quote = card.querySelector('blockquote');
      let button = card.querySelector('.review-more');
      const isLong = quote.textContent.trim().length > 360;
      quote.classList.toggle('is-truncated', mobileQuery.matches && isLong);

      if (mobileQuery.matches && isLong && !button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'review-more';
        button.textContent = 'View full review';
        button.setAttribute('aria-haspopup', 'dialog');
        quote.insertAdjacentElement('afterend', button);
      }

      if (button) button.hidden = !(mobileQuery.matches && isLong);
    });
  };

  const openReview = (card, trigger) => {
    const quote = card.querySelector('blockquote');
    const reviewer = card.querySelector('footer strong');
    const source = card.querySelector('footer span');
    dialogCopy.innerHTML = quote.innerHTML;
    dialogName.textContent = reviewer.textContent;
    dialogSource.textContent = source.textContent;
    lastTrigger = trigger;
    stopAuto();
    document.body.classList.add('dialog-open');
    dialog.showModal();
  };

  const closeReview = () => {
    dialog.close();
    document.body.classList.remove('dialog-open');
    lastTrigger?.focus();
    resumeAfterDelay();
  };

  previousButton.addEventListener('click', () => { goTo(currentIndex - 1); resumeAfterDelay(); });
  nextButton.addEventListener('click', () => { goTo(currentIndex + 1); resumeAfterDelay(); });

  carousel.addEventListener('click', (event) => {
    const trigger = event.target.closest('.review-more');
    if (trigger) openReview(trigger.closest('.review-card'), trigger);
  });

  carousel.addEventListener('scroll', () => {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      currentIndex = Math.min(maxIndex(), Math.max(0, Math.round(carousel.scrollLeft / cardStep())));
      announce();
    }, 120);
  }, { passive: true });

  ['pointerdown', 'mouseenter', 'focusin'].forEach((eventName) => carousel.addEventListener(eventName, stopAuto));
  ['pointerup', 'pointercancel', 'mouseleave', 'focusout'].forEach((eventName) => carousel.addEventListener(eventName, resumeAfterDelay));

  closeDialogButton.addEventListener('click', closeReview);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeReview();
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeReview();
  });

  mobileQuery.addEventListener('change', () => {
    setMobileTruncation();
    goTo(0, 'auto');
  });
  reduceMotion.addEventListener('change', startAuto);
  window.addEventListener('resize', () => goTo(Math.min(currentIndex, maxIndex()), 'auto'));

  setMobileTruncation();
  announce();
  startAuto();
}
