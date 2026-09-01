/**
 * Home News Renderer - Pesantren & SIT Babussalam
 * Menarik berita dari WordPress REST API dan merender ke dalam grid
 */

document.addEventListener('DOMContentLoaded', () => {
  const feedContainer = document.getElementById('home-news-container');
  const kegiatanContainer = document.getElementById('kegiatan-siswa-container');

  function getSkeletonHTML() {
    return `
      <div class="grid md:grid-cols-3 gap-6">
        ${[1, 2, 3].map(() => `
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-sky-100 flex flex-col justify-between h-[360px]">
            <div>
              <div class="skeleton h-40 w-full rounded-xl mb-4"></div>
              <div class="skeleton h-6 w-5/6 rounded mb-2"></div>
              <div class="skeleton h-4 w-full rounded mb-2"></div>
              <div class="skeleton h-4 w-2/3 rounded"></div>
            </div>
            <div class="skeleton h-4 w-24 rounded mt-4"></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function getErrorHTML() {
    return `
      <div class="text-center py-8 bg-white rounded-2xl border border-red-100 p-8">
        <p class="text-sky-800 font-semibold mb-2">Gagal memuat berita terbaru saat ini.</p>
        <button onclick="window.location.reload()" class="text-sm text-sky-700 underline font-bold">Coba Muat Ulang</button>
      </div>
    `;
  }

  function getEmptyHTML() {
    return `
      <div class="text-center py-8 bg-white rounded-2xl border border-sky-100 p-8">
        <p class="text-sky-800/70">Belum ada artikel yang dipublikasikan di kategori ini.</p>
      </div>
    `;
  }

  function renderPostsHTML(posts) {
    return `
      <div class="grid md:grid-cols-3 gap-6">
        ${posts.map(post => `
          <article class="reveal card-hover bg-white rounded-2xl overflow-hidden shadow-sm border border-sky-100 flex flex-col group h-full">
            <a href="${post.link}" class="block relative aspect-[4/3] overflow-hidden bg-sky-50">
              <img 
                src="${post.featuredImage}" 
                alt="${post.title}" 
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                loading="lazy"
                onerror="this.src='assets/Logo.png'"
              >
            </a>
            
            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 class="font-display font-bold text-lg text-sky-800 group-hover:text-sky-600 transition-colors mb-2 leading-snug line-clamp-3">
                  <a href="${post.link}">${post.title}</a>
                </h3>
              </div>
              
              <div class="pt-3 mt-3">
                <a href="${post.link}" class="inline-flex items-center gap-1 text-sm font-medium text-sky-500 group-hover:text-sky-700 transition-colors">
                  selengkapnya
                </a>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  async function loadSection(container, params) {
    if (!container) return;
    container.innerHTML = getSkeletonHTML();
    
    try {
      const fetchParams = { page: 1, perPage: 3, ...params };
      
      const data = await WP_API.getPosts(fetchParams);
      const posts = data.posts;

      if (!posts || posts.length === 0) {
        container.innerHTML = getEmptyHTML();
        return;
      }

      container.innerHTML = renderPostsHTML(posts);

      // Trigger observer for new reveals
      const newReveals = container.querySelectorAll('.reveal');
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
              obs.unobserve(e.target);
            }
          });
        }, { threshold: 0.1 });
        newReveals.forEach(el => observer.observe(el));
      } else {
        newReveals.forEach(el => el.classList.add('visible'));
      }

    } catch (err) {
      console.error('Error rendering section:', err);
      container.innerHTML = getErrorHTML();
    }
  }

  // ID 497 is Kegiatan Siswa (Hanya mengambil kategori 497)
  loadSection(kegiatanContainer, { categoryId: 497 });
  // Feed (Mengambil semua berita KECUALI kegiatan siswa 497)
  loadSection(feedContainer, { excludeCategoryId: 497 });

});
