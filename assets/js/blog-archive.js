// blog-archive.js — WordPress REST API Archive with Blue Theme
(function() {
  const BASE = 'https://babussalam.sch.id/wp-json/wp/v2';
  const postsGrid = document.getElementById('posts-grid');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const searchInput = document.getElementById('search-input');
  const catTabs = document.querySelectorAll('.cat-tab');

  let currentPage = 1;
  let currentCat = 0;
  let currentSearch = '';
  let isLoading = false;
  let totalPages = 1;

  // --- SKELETON LOADERS ---
  function showSkeletons(count = 6) {
    postsGrid.innerHTML = Array(count).fill('').map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-title" style="margin-top:12px;"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text-short"></div>
      </div>
    `).join('');
  }

  // --- FORMAT DATE (Indonesian) ---
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // --- STRIP HTML ---
  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  // --- RENDER SINGLE CARD ---
  function renderCard(post) {
    const img = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
      || post.jetpack_featured_media_url
      || 'assets/Logo.png';
    const cat = post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Berita';
    const excerpt = stripHtml(post.excerpt?.rendered || '').slice(0, 120) + '...';
    const date = formatDate(post.date);
    const title = post.title?.rendered || 'Tanpa Judul';
    return `
      <article class="group bg-white rounded-2xl overflow-hidden border border-sky-100 hover:border-sky-300 transition-all duration-300 card-hover">
        <a href="baca.html?id=${post.id}" class="block overflow-hidden aspect-[16/9]">
          <img src="${img}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.src='assets/Logo.png'">
        </a>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-lg">${cat}</span>
            <span class="text-xs text-sky-400">${date}</span>
          </div>
          <h2 class="font-display font-bold text-sky-800 text-base leading-snug mb-2 group-hover:text-sky-600 transition-colors line-clamp-2">
            <a href="baca.html?id=${post.id}">${title}</a>
          </h2>
          <p class="text-sm text-slate-600 leading-relaxed line-clamp-3">${excerpt}</p>
          <a href="baca.html?id=${post.id}" class="inline-flex items-center gap-1 text-xs font-bold text-sky-500 hover:text-sky-700 mt-3 transition-colors">
            Baca selengkapnya &rarr;
          </a>
        </div>
      </article>
    `;
  }

  // --- FETCH POSTS ---
  async function fetchPosts(reset = false) {
    if (isLoading) return;
    isLoading = true;
    if (reset) {
      currentPage = 1;
      postsGrid.innerHTML = '';
      showSkeletons();
    }
    let url = `${BASE}/posts?_embed&per_page=9&page=${currentPage}`;
    if (currentCat > 0) url += `&categories=${currentCat}`;
    if (currentSearch.trim()) url += `&search=${encodeURIComponent(currentSearch.trim())}`;
    try {
      const res = await fetch(url);
      totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
      const posts = await res.json();
      if (reset) postsGrid.innerHTML = '';
      if (!posts.length && reset) {
        postsGrid.innerHTML = '<p class="col-span-3 text-center py-16 text-sky-400 font-semibold">Tidak ada artikel ditemukan.</p>';
      } else {
        posts.forEach(p => postsGrid.insertAdjacentHTML('beforeend', renderCard(p)));
      }
      loadMoreBtn.classList.toggle('hidden', currentPage >= totalPages);
    } catch (e) {
      if (reset) postsGrid.innerHTML = '<p class="col-span-3 text-center py-16 text-red-400">Gagal memuat artikel. Periksa koneksi internet.</p>';
    } finally {
      isLoading = false;
    }
  }

  // --- EVENTS ---
  catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      catTabs.forEach(t => {
        t.classList.remove('bg-sky-500', 'text-white');
        t.classList.add('bg-white', 'text-sky-700', 'border', 'border-sky-200', 'hover:bg-sky-50');
      });
      tab.classList.add('bg-sky-500', 'text-white');
      tab.classList.remove('bg-white', 'text-sky-700', 'border', 'border-sky-200', 'hover:bg-sky-50');
      currentCat = parseInt(tab.dataset.cat);
      fetchPosts(true);
    });
  });

  loadMoreBtn?.addEventListener('click', () => {
    currentPage++;
    fetchPosts(false);
  });

  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = searchInput.value;
      fetchPosts(true);
    }, 500);
  });

  // --- INIT ---
  fetchPosts(true);
})();
