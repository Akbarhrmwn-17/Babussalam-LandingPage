/**
 * WordPress REST API Client for Babussalam (babussalam.sch.id)
 * Menangani penarikan data artikel, kategori, dan media secara asinkron.
 */

const WP_API = {
  baseUrl: 'https://babussalam.sch.id/wp-json/wp/v2',

  // Kategori ID mapping untuk kemudahan filter
  CATEGORY_IDS: {
    SEMUA: null,
    SDTQ: 7,
    SMPTQ: 49,
    MUTAWASITH: 4,
    TSANAWI: 5,
    TAHFIDZ: 6,
    PKBM: 76,
    KEGIATAN_SISWA: 497,
    INFORMASI: 1,
    KAJIAN: 9,
    ALUMNI: 68
  },

  /**
   * Mengambil daftar postingan berita
   */
  async getPosts(options = {}) {
    const {
      page = 1,
      perPage = 6,
      categoryId = null,
      excludeCategoryId = null,
      search = '',
      includeEmbed = true
    } = options;

    let url = `${this.baseUrl}/posts?page=${page}&per_page=${perPage}`;
    if (includeEmbed) url += '&_embed';
    if (categoryId) url += `&categories=${categoryId}`;
    if (excludeCategoryId) url += `&categories_exclude=${excludeCategoryId}`;
    if (search && search.trim() !== '') url += `&search=${encodeURIComponent(search.trim())}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
      const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0', 10);
      const posts = await response.json();

      return {
        posts: posts.map(p => this.formatPostData(p)),
        totalPages,
        totalPosts
      };
    } catch (error) {
      console.warn('Gagal mengambil data dari WordPress REST API:', error);
      return {
        posts: this.getFallbackPosts(categoryId),
        totalPages: 1,
        totalPosts: 3,
        isFallback: true
      };
    }
  },

  /**
   * Mengambil detail postingan berdasarkan ID
   */
  async getPostById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${id}?_embed`);
      if (!response.ok) throw new Error(`Post with ID ${id} not found`);
      const post = await response.json();
      return this.formatPostData(post);
    } catch (error) {
      console.warn(`Gagal mengambil detail post ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Mengambil detail postingan berdasarkan Slug
   */
  async getPostBySlug(slug) {
    try {
      const response = await fetch(`${this.baseUrl}/posts?slug=${encodeURIComponent(slug)}&_embed`);
      if (!response.ok) throw new Error(`Post with slug ${slug} not found`);
      const posts = await response.json();
      if (!posts || posts.length === 0) return null;
      return this.formatPostData(posts[0]);
    } catch (error) {
      console.warn(`Gagal mengambil post dengan slug ${slug}:`, error);
      return null;
    }
  },

  /**
   * Mengambil daftar kategori
   */
  async getCategories() {
    try {
      const response = await fetch(`${this.baseUrl}/categories?per_page=20&orderby=count&order=desc`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return await response.json();
    } catch (error) {
      console.warn('Gagal memuat kategori:', error);
      return [];
    }
  },

  /**
   * Normalisasi dan format data objek post WordPress
   */
  formatPostData(post) {
    // 1. Ekstrak gambar utama (Featured Image)
    let featuredImage = 'assets/Logo.png';
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
      const media = post._embedded['wp:featuredmedia'][0];
      featuredImage = media.source_url || (media.media_details?.sizes?.large?.source_url) || featuredImage;
    } else if (post.jetpack_featured_media_url) {
      featuredImage = post.jetpack_featured_media_url;
    }

    // 2. Ekstrak nama penulis
    let authorName = 'Humas Babussalam';
    if (post._embedded && post._embedded['author'] && post._embedded['author'][0]) {
      authorName = post._embedded['author'][0].name || authorName;
    }

    // 3. Ekstrak nama kategori utama
    let categoryName = 'Berita';
    let categoryId = null;
    if (post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0] && post._embedded['wp:term'][0].length > 0) {
      categoryName = post._embedded['wp:term'][0][0].name;
      categoryId = post._embedded['wp:term'][0][0].id;
    }

    // 4. Bersihkan ringkasan cuplikan teks (Excerpt)
    let excerpt = '';
    if (post.excerpt && post.excerpt.rendered) {
      excerpt = this.stripHtml(post.excerpt.rendered);
    }
    if (!excerpt && post.content && post.content.rendered) {
      excerpt = this.stripHtml(post.content.rendered).slice(0, 140) + '...';
    }

    return {
      id: post.id,
      slug: post.slug,
      title: this.cleanTitle(post.title?.rendered || 'Tanpa Judul'),
      content: post.content?.rendered || '',
      excerpt: excerpt.trim(),
      dateFormatted: this.formatDate(post.date),
      rawDate: post.date,
      featuredImage,
      authorName,
      categoryName,
      categoryId,
      link: `baca.html?id=${post.id}&slug=${encodeURIComponent(post.slug)}`,
      originalWpLink: post.link || `https://babussalam.sch.id/?p=${post.id}`
    };
  },

  /**
   * Format tanggal ke bahasa Indonesia
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  },

  /**
   * Menghilangkan tag HTML dan karakter entitas
   */
  stripHtml(html) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  },

  /**
   * Membersihkan entitas HTML pada judul
   */
  cleanTitle(title) {
    if (!title) return '';
    return title
      .replace(/&amp;/g, '&')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&#8216;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&quot;/g, '"');
  },

  /**
   * Data cadangan offline jika REST API sedang tidak terhubung
   */
  getFallbackPosts(categoryId) {
    return [
      {
        id: 4818,
        slug: 'keputrian-sdtq-babussalam-membentuk-generasi-muslimah-cerdas-lembut-dan-beradab',
        title: 'Keputrian SDTQ Babussalam: Membentuk Generasi Muslimah Cerdas, Lembut, dan Beradab',
        excerpt: 'SDTQ Babussalam kembali menyelenggarakan kegiatan Keputrian dengan tema Adab Keseharian Seorang Muslimah bersama Ustadzah Fathia Daffa Ramadhan...',
        dateFormatted: '25 Agustus 2026',
        featuredImage: 'https://i0.wp.com/babussalam.sch.id/wp-content/uploads/2026/08/snapsave-app_3970696338395786471_68553984946.webp?fit=1440%2C1920&ssl=1',
        authorName: 'Humas Babussalam',
        categoryName: 'SDTQ',
        categoryId: 7,
        link: 'baca.html?id=4818&slug=keputrian-sdtq-babussalam-membentuk-generasi-muslimah-cerdas-lembut-dan-beradab'
      },
      {
        id: 4805,
        slug: 'basma-smptq-putri-babussalam-bukan-sekadar-pelantikan-tapi-awal-dari-sebuah-tanggung-jawab',
        title: 'BASMA SMPTQ Putri Babussalam: Bukan Sekadar Pelantikan, Tapi Awal dari Sebuah Tanggung Jawab',
        excerpt: 'SMPTQ Putri Babussalam menyelenggarakan kegiatan BASMA (Babussalam Smart Muslimah Action), program LDKS bagi calon pemimpin pengurus OSIS...',
        dateFormatted: '21 Agustus 2026',
        featuredImage: 'https://i0.wp.com/babussalam.sch.id/wp-content/uploads/2026/08/SnapVideo.app_782542867_17942477466296587_4113260549006861824_n.webp?fit=1440%2C1920&ssl=1',
        authorName: 'Humas Babussalam',
        categoryName: 'SMPTQ',
        categoryId: 49,
        link: 'baca.html?id=4805&slug=basma-smptq-putri-babussalam-bukan-sekadar-pelantikan-tapi-awal-dari-sebuah-tanggung-jawab'
      },
      {
        id: 4707,
        slug: 'pengisian-survey-lingkungan-belajar-pkbm-plus-babussalam-kontribusi-untuk-pendidikan-yang-lebih-baik',
        title: 'Pengisian Survey Lingkungan Belajar PKBM Plus Babussalam untuk Pendidikan yang Lebih Baik',
        excerpt: 'PKBM Plus Babussalam melaksanakan Survei Lingkungan Belajar (Sulingjar) dalam rangka meningkatkan iklim belajar dan kualitas pendidikan...',
        dateFormatted: '13 Agustus 2026',
        featuredImage: 'https://i0.wp.com/babussalam.sch.id/wp-content/uploads/2026/08/okumentasi-Kegiatan-Tes-Kemampuan-Akademik-Siswa-Instagram-Post.jpg?fit=1080%2C1350&ssl=1',
        authorName: 'Humas Babussalam',
        categoryName: 'PKBM',
        categoryId: 76,
        link: 'baca.html?id=4707&slug=pengisian-survey-lingkungan-belajar-pkbm-plus-babussalam-kontribusi-untuk-pendidikan-yang-lebih-baik'
      }
    ];
  }
};
