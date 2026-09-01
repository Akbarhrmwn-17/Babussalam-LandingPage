
document.addEventListener('DOMContentLoaded', async () => {
  const loadComponent = async (id, file) => {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const res = await fetch('components/' + file + '?v=' + new Date().getTime());
      if (res.ok) {
        el.innerHTML = await res.text();
      }
    } catch (e) {
      console.error('Error loading component ' + file, e);
    }
  };

    await loadComponent('navbar-placeholder', 'navbar.html');
  await loadComponent('swiper-alumni-placeholder', 'swiper-alumni.html');
  await loadComponent('swiper-prestasi-placeholder', 'swiper-prestasi.html');
  await loadComponent('profil-placeholder', 'profil-section.html');
  await loadComponent('global-footer', 'footer.html');

  // After components are loaded, initialize site.js logic
  if (typeof window.initSiteJS === 'function') {
    window.initSiteJS();
  }
});
