/**
 * UI Interactions & Behavior - Pesantren & SIT Babussalam
 */

window.initSiteJS = () => {
  // ===== 1. Update Copyright Year =====
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // ===== 2. Header Scroll Transformation =====
  const header = document.getElementById('site-header');
  const brandText = document.getElementById('brand-text');
  const brandSub = document.getElementById('brand-sub');
  const desktopNav = document.getElementById('desktop-nav');
  const menuBtnEl = document.getElementById('menu-btn');

  if (header) {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 30;
      header.classList.toggle('bg-white/95', isScrolled);
      header.classList.toggle('backdrop-blur-md', isScrolled);
      header.classList.toggle('shadow-md', isScrolled);
      header.classList.toggle('py-2', isScrolled);
      header.classList.toggle('py-4', !isScrolled);

      if (brandText) {
        brandText.classList.toggle('text-white', !isScrolled);
        brandText.classList.toggle('text-sky-800', isScrolled);
      }
      if (brandSub) {
        brandSub.classList.toggle('text-sky-100', !isScrolled);
        brandSub.classList.toggle('text-sky-700', isScrolled);
      }
      if (desktopNav) {
        desktopNav.classList.toggle('text-white', !isScrolled);
        desktopNav.classList.toggle('text-sky-800', isScrolled);
      }
      if (menuBtnEl) {
        menuBtnEl.classList.toggle('text-white', !isScrolled);
        menuBtnEl.classList.toggle('text-sky-800', isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // ===== 3. Mobile Menu Toggle =====
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('icon-open');
  const iconClose = document.getElementById('icon-close');

  function toggleMobileMenu(forceState) {
    if (!mobileMenu) return;
    const willOpen = typeof forceState === 'boolean' ? forceState : !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', willOpen);
    if (iconOpen) iconOpen.classList.toggle('hidden', willOpen);
    if (iconClose) iconClose.classList.toggle('hidden', !willOpen);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(willOpen));
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });
  }

  // Close menu when clicking outside or clicking a menu link
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => toggleMobileMenu(false));
  });

  // ===== 4. Mobile Program Accordion =====
  const mobileProgramBtn = document.getElementById('mobile-program-btn');
  const mobileProgramPanel = document.getElementById('mobile-program-panel');
  if (mobileProgramBtn && mobileProgramPanel) {
    mobileProgramBtn.addEventListener('click', () => {
      const isOpen = mobileProgramPanel.classList.toggle('open');
      const chevron = mobileProgramBtn.querySelector('.dropdown-chevron');
      if (chevron) chevron.classList.toggle('rotate-180', isOpen);
    });
  }

  // ===== 5. Desktop Program Dropdown =====
  const programDropdown = document.getElementById('program-dropdown');
  if (programDropdown) {
    const trigger = programDropdown.querySelector('.dropdown-trigger');
    const panel = programDropdown.querySelector('.dropdown-panel');

    const closeDesktopDropdown = () => {
      programDropdown.classList.remove('open');
      if (panel) panel.classList.remove('open');
    };

    if (trigger && panel) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !panel.classList.contains('open');
        panel.classList.toggle('open', willOpen);
        programDropdown.classList.toggle('open', willOpen);
      });

      document.addEventListener('click', (e) => {
        if (!programDropdown.contains(e.target)) closeDesktopDropdown();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDesktopDropdown();
      });
    }
  }

  // ===== 6. Smooth Scroll for Anchor Links (with Header Offset) =====
  const HEADER_OFFSET = 85;
  function scrollToTarget(selector) {
    if (!selector || selector.length < 2) return;
    const targetEl = document.querySelector(selector);
    if (!targetEl) return;
    const elementPosition = targetEl.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - HEADER_OFFSET;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const hash = this.getAttribute('href');
      if (hash && hash !== '#' && document.querySelector(hash)) {
        e.preventDefault();
        scrollToTarget(hash);
      }
    });
  });

  if (window.location.hash) {
    setTimeout(() => scrollToTarget(window.location.hash), 100);
  }

  // ===== 7. Scroll Reveal Animation via IntersectionObserver =====
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback if IntersectionObserver not supported
    revealElements.forEach(el => el.classList.add('visible'));
  }

  // ===== 8. Floating Back To Top Button =====
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      const shouldShow = window.scrollY > 450;
      backToTopBtn.classList.toggle('opacity-0', !shouldShow);
      backToTopBtn.classList.toggle('invisible', !shouldShow);
      backToTopBtn.classList.toggle('opacity-100', shouldShow);
      backToTopBtn.classList.toggle('visible', shouldShow);
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== 9. Active Nav Matching =====
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-match]').forEach(link => {
    const patterns = link.getAttribute('data-nav-match').split(',');
    if (patterns.some(p => currentPage === p || (p.endsWith('*') && currentPage.startsWith(p.slice(0, -1))))) {
      link.classList.add('active');
    }
  });

  // ===== 10. Swiper Marquee (Alumni & Prestasi) =====
  function initSwipers() {
    if (typeof Swiper === 'undefined') {
      // Swiper not yet loaded, retry in 300ms
      setTimeout(initSwipers, 300);
      return;
    }

    // Alumni swiper
    const alumniEl = document.querySelector('.swiper-container-babussalam');
    if (alumniEl && !alumniEl.swiper) {
      new Swiper(alumniEl, {
        slidesPerView: 'auto',
        spaceBetween: 24,
        loop: true,
        speed: 8000,
        autoplay: {
          delay: 0,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        grabCursor: true,
        freeMode: {
          enabled: true,
          momentum: false,
        },
      });
    }

    // Prestasi swiper
    const prestasiEl = document.querySelector('.swiper-container-prestasi');
    if (prestasiEl && !prestasiEl.swiper) {
      new Swiper(prestasiEl, {
        slidesPerView: 'auto',
        spaceBetween: 24,
        loop: true,
        speed: 7000,
        autoplay: {
          delay: 0,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        grabCursor: true,
        freeMode: {
          enabled: true,
          momentum: false,
        },
      });
    }
  }

  initSwipers();
};
