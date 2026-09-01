// single-post.js — WordPress Single Post Renderer (Blue Theme)
(function() {
  const BASE = 'https://babussalam.sch.id/wp-json/wp/v2';
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');
  const postSlug = params.get('slug');

  function formatDate(str) {
    return new Date(str).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
  }

  function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || '';
  }

  function renderRelated(posts) {
    const el = document.getElementById('related-posts');
    if (!el || !posts.length) return;
    el.innerHTML = posts.slice(0,3).map(p => {
      const img = p._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'assets/Logo.png';
      return `<a href="baca.html?id=${p.id}" class="group block bg-sky-50 rounded-xl overflow-hidden border border-sky-100 hover:border-sky-300 transition-all">
        <img src="${img}" alt="${p.title.rendered}" class="w-full aspect-video object-cover group-hover:opacity-90 transition-opacity" loading="lazy">
        <div class="p-4">
          <p class="text-xs text-sky-500 mb-1">${formatDate(p.date)}</p>
          <h4 class="font-display font-bold text-sm text-sky-800 leading-snug line-clamp-2">${p.title.rendered}</h4>
        </div>
      </a>`;
    }).join('');
  }

  async function loadPost() {
    if (!postId && !postSlug) {
      document.getElementById('article-body').innerHTML = '<p class="text-red-500">Artikel tidak ditemukan. Parameter ID tidak tersedia.</p>';
      return;
    }
    try {
      let url = postId
        ? `${BASE}/posts/${postId}?_embed`
        : `${BASE}/posts?slug=${postSlug}&_embed`;
      const res = await fetch(url);
      let post = await res.json();
      if (Array.isArray(post)) post = post[0];
      if (!post || !post.title) throw new Error('Post not found');

      // Update page title
      document.getElementById('page-title').textContent = `${stripHtml(post.title.rendered)} | Babussalam Depok`;
      document.title = `${stripHtml(post.title.rendered)} | Babussalam Depok`;

      // Hero
      document.getElementById('article-hero').innerHTML = `
        <div class="max-w-4xl mx-auto px-4 text-white">
          <div class="mb-4">
            <a href="berita.html" class="inline-flex items-center gap-1.5 text-white text-xs font-semibold hover:text-white transition-colors mb-4">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Kembali ke Berita
            </a>
            <br>
            <span class="inline-block bg-teal-400 text-sky-900 text-xs font-extrabold px-3 py-1 rounded-lg mt-2">
              ${post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Berita'}
            </span>
          </div>
          <h1 class="font-display text-2xl sm:text-4xl font-extrabold leading-tight mb-4">${post.title.rendered}</h1>
          <p class="text-white text-sm">${formatDate(post.date)} &bull; ${post._embedded?.author?.[0]?.name || 'Admin'}</p>
        </div>
      `;

      // Featured image
      const imgUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || post.jetpack_featured_media_url;
      if (imgUrl) {
        document.getElementById('featured-image-wrap').classList.remove('hidden');
        document.getElementById('featured-image').src = imgUrl;
        document.getElementById('featured-image').alt = stripHtml(post.title.rendered);
      }

      // Article meta
      const metaEl = document.getElementById('article-meta');
      if (metaEl) {
        const cat = post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Berita';
        const author = post._embedded?.author?.[0]?.name || 'Admin';
        metaEl.innerHTML = `
          <span class="text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 px-3 py-1 rounded-lg">${cat}</span>
          <span class="text-xs text-sky-500">${formatDate(post.date)}</span>
          <span class="text-xs text-sky-400">&bull;</span>
          <span class="text-xs text-sky-500">Oleh ${author}</span>
        `;
      }

      // Body
      document.getElementById('article-body').innerHTML = post.content?.rendered || '';

      // Share buttons
      const shareUrl = encodeURIComponent(window.location.href);
      const shareTitle = encodeURIComponent(stripHtml(post.title.rendered));
      document.getElementById('share-wa').onclick = () => window.open(`https://wa.me/?text=${shareTitle}%20${shareUrl}`, '_blank');
      document.getElementById('share-fb').onclick = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
      document.getElementById('share-copy').onclick = () => {
        navigator.clipboard.writeText(window.location.href);
        document.getElementById('share-copy').textContent = 'Tersalin!';
        setTimeout(() => { document.getElementById('share-copy').textContent = 'Salin Link'; }, 2000);
      };

      // Related posts (same category)
      const catId = post._embedded?.['wp:term']?.[0]?.[0]?.id;
      if (catId) {
        const relRes = await fetch(`${BASE}/posts?_embed&categories=${catId}&per_page=4&exclude=${post.id}`);
        const related = await relRes.json();
        renderRelated(related);
      }
    } catch(e) {
      document.getElementById('article-body').innerHTML = `<p class="text-red-500 py-10 text-center">Gagal memuat artikel. Coba muat ulang halaman.</p>`;
    }
  }

  loadPost();
})();
