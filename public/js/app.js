const App = {
  routes: {},
  currentCategory: 'All',
  currentSearch: '',
  currentPage: 1,
  replyingToCommentId: null,

  init() {
    // Setup routing definitions
    this.routes = {
      '/': () => this.viewHome(),
      '/blog': () => this.viewBlog(),
      '/about': () => this.viewAbout(),
      '/login': () => this.viewLogin(),
      '/register': () => this.viewRegister(),
      '/create-post': () => this.viewCreatePost(),
      '/edit-post/:id': (params) => this.viewEditPost(params.id),
      '/post/:id': (params) => this.viewSinglePost(params.id)
    };

    // Sticky header shadow on scroll
    window.addEventListener('scroll', () => {
      const header = document.getElementById('site-header');
      if (header) {
        if (window.scrollY > 20) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    });

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
    }

    // Intercept navigation links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.host === window.location.host) {
        // Exclude specific links if needed
        if (link.getAttribute('target') === '_blank') return;
        
        e.preventDefault();
        const path = link.pathname;
        this.navigate(path);
      }
    });

    // Listen for browser popstate (back/forward button)
    window.addEventListener('popstate', () => {
      this.route();
    });

    // Initial auth navbar setup
    Auth.updateNavbar();

    // Run first route resolution
    this.route();
  },

  // Perform route lookup and display corresponding view
  route() {
    // Close mobile nav menu
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) navMenu.classList.remove('active');

    const path = window.location.pathname;
    
    // Exact routes match check
    let handler = this.routes[path];
    let params = {};

    if (!handler) {
      // RegEx route match check (e.g. /post/:id)
      for (const routePattern of Object.keys(this.routes)) {
        if (routePattern.includes(':')) {
          const parts = routePattern.split('/');
          const pathParts = path.split('/');
          if (parts.length === pathParts.length) {
            let match = true;
            for (let i = 0; i < parts.length; i++) {
              if (parts[i].startsWith(':')) {
                const paramName = parts[i].substring(1);
                params[paramName] = pathParts[i];
              } else if (parts[i] !== pathParts[i]) {
                match = false;
                break;
              }
            }
            if (match) {
              handler = this.routes[routePattern];
              break;
            }
          }
        }
      }
    }

    // Set navigation active indicator
    this.updateActiveNavIndicator(path);

    if (handler) {
      handler(params);
    } else {
      this.viewNotFound();
    }
  },

  navigate(path) {
    window.history.pushState({}, '', path);
    this.route();
  },

  refreshCurrentView() {
    this.route();
  },

  updateActiveNavIndicator(path) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (path === '/') {
      const el = document.getElementById('nav-home');
      if (el) el.classList.add('active');
    } else if (path === '/blog') {
      const el = document.getElementById('nav-blog');
      if (el) el.classList.add('active');
    } else if (path === '/about') {
      const el = document.getElementById('nav-about');
      if (el) el.classList.add('active');
    } else if (path === '/login') {
      const el = document.getElementById('nav-login');
      if (el) el.classList.add('active');
    } else if (path === '/register') {
      const el = document.getElementById('nav-register');
      if (el) el.classList.add('active');
    }
  },

  // ─── VIEWS ─────────────────────────────────────────────────────────────────

  // 1. Homepage View
  async viewHome() {
    const viewport = document.getElementById('app-viewport');
    viewport.innerHTML = `
      <section class="hero">
        <div class="hero-content">
          <h1>Welcome to BlogSphere — Share Your Story</h1>
          <p>Explore ideas, insights, and stories from our passionate writers. Discover deep tech tutorials, travel journals, lifestyle changes, and more.</p>
          <a href="/blog" class="btn btn-primary btn-lg"><i class="fa-regular fa-compass"></i> Start Reading</a>
        </div>
      </section>

      <div class="container">
        <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="fa-regular fa-star" style="color: var(--primary-color);"></i> Featured Posts
        </h2>
        <div class="posts-grid three-cols" id="featured-posts-container">
          <!-- Post cards injected here -->
        </div>
        <div style="text-align: center; margin-top: 3rem;">
          <a href="/blog" class="btn btn-secondary">View All Posts <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </div>
    `;

    // Fetch and display latest 3 posts
    const { posts } = await Posts.getPosts(1, '', '');
    const featuredContainer = document.getElementById('featured-posts-container');
    if (featuredContainer) {
      if (posts.length === 0) {
        featuredContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-light);">No posts found. Be the first to create one!</p>`;
      } else {
        featuredContainer.innerHTML = posts.slice(0, 3).map(p => Posts.renderPostCard(p)).join('');
      }
    }
  },

  // 2. Blog View with Filters and Search
  async viewBlog() {
    const viewport = document.getElementById('app-viewport');
    viewport.innerHTML = `
      <div class="container">
        <div class="content-grid">
          
          <!-- Blog Main List -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
              <h2 id="blog-title-header">All Articles</h2>
              <div class="auth-only-show" style="display: none;">
                <a href="/create-post" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Create Post</a>
              </div>
            </div>
            
            <div class="posts-grid" id="blog-posts-container">
              <!-- Post cards injected here -->
            </div>

            <div class="pagination" id="blog-pagination">
              <!-- Pagination controls injected here -->
            </div>
          </div>

          <!-- Sidebar -->
          <div class="sidebar">
            
            <!-- Search Widget -->
            <div class="widget">
              <h3 class="widget-title">Search</h3>
              <form class="search-form" id="search-form">
                <input type="text" class="search-input" placeholder="Type keyword..." value="${this.currentSearch}" id="search-input">
                <button type="submit" class="btn btn-primary" aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
              </form>
            </div>

            <!-- Categories Widget -->
            <div class="widget">
              <h3 class="widget-title">Categories</h3>
              <ul class="category-list" id="category-list">
                <li class="category-item ${this.currentCategory === 'All' ? 'active' : ''}" data-cat="All">All <span class="category-count">*</span></li>
                <li class="category-item ${this.currentCategory === 'Tech' ? 'active' : ''}" data-cat="Tech">Tech <span class="category-count">#</span></li>
                <li class="category-item ${this.currentCategory === 'Lifestyle' ? 'active' : ''}" data-cat="Lifestyle">Lifestyle <span class="category-count">#</span></li>
                <li class="category-item ${this.currentCategory === 'Travel' ? 'active' : ''}" data-cat="Travel">Travel <span class="category-count">#</span></li>
                <li class="category-item ${this.currentCategory === 'General' ? 'active' : ''}" data-cat="General">General <span class="category-count">#</span></li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    `;

    // Re-verify authorization nodes visibility
    Auth.updateNavbar();

    // Load initial list
    this.loadBlogArticles();

    // Attach search handlers
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.currentSearch = document.getElementById('search-input').value.trim();
        this.currentPage = 1;
        this.loadBlogArticles();
      });
    }

    // Attach category handlers
    document.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        this.currentCategory = item.getAttribute('data-cat');
        this.currentPage = 1;
        this.loadBlogArticles();
      });
    });
  },

  async loadBlogArticles() {
    const postContainer = document.getElementById('blog-posts-container');
    const paginationContainer = document.getElementById('blog-pagination');
    if (!postContainer) return;

    // Heading update
    const header = document.getElementById('blog-title-header');
    if (header) {
      if (this.currentCategory !== 'All') {
        header.innerText = `${this.currentCategory} Articles`;
      } else if (this.currentSearch) {
        header.innerText = `Search Results for "${this.currentSearch}"`;
      } else {
        header.innerText = `All Articles`;
      }
    }

    const data = await Posts.getPosts(this.currentPage, this.currentCategory, this.currentSearch);
    
    if (data.posts.length === 0) {
      postContainer.innerHTML = `<div style="text-align: center; grid-column: 1/-1; padding: 3rem 0; color: var(--text-light);"><i class="fa-solid fa-magnifying-glass fa-3x" style="margin-bottom:1rem;"></i><p>No articles matching your criteria.</p></div>`;
      paginationContainer.innerHTML = '';
      return;
    }

    postContainer.innerHTML = data.posts.map(p => Posts.renderPostCard(p)).join('');

    // Pagination render
    let paginationHtml = `
      <button class="page-btn" ${data.page <= 1 ? 'disabled' : ''} id="prev-page-btn" aria-label="Previous page">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;

    for (let i = 1; i <= data.pages; i++) {
      paginationHtml += `
        <button class="page-btn ${data.page === i ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    paginationHtml += `
      <button class="page-btn" ${data.page >= data.pages ? 'disabled' : ''} id="next-page-btn" aria-label="Next page">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    paginationContainer.innerHTML = paginationHtml;

    // Attach pagination listeners
    paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.id === 'prev-page-btn') {
          this.currentPage = Math.max(1, this.currentPage - 1);
        } else if (btn.id === 'next-page-btn') {
          this.currentPage = Math.min(data.pages, this.currentPage + 1);
        } else {
          this.currentPage = parseInt(btn.getAttribute('data-page'));
        }
        this.loadBlogArticles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  },

  // 3. About View
  viewAbout() {
    const viewport = document.getElementById('app-viewport');
    viewport.innerHTML = `
      <div class="container" style="max-width: 800px; padding-top: 4rem; padding-bottom: 4rem;">
        <div style="background-color: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 3rem; box-shadow: var(--shadow-sm);">
          <h2 style="margin-bottom: 1.5rem; text-align: center; color: var(--primary-color);">About BlogSphere</h2>
          <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem; color: var(--text-muted);">
            Welcome to BlogSphere, a modern and professional publishing space. Built from the ground up to empower voices, foster discussion, and share knowledge cleanly across all devices.
          </p>
          <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem; color: var(--text-muted);">
            Our platform features sharp typography, an elegant minimalistic design system inspired by premium layouts, lightning-fast navigation, SQLite persistence, and real-time nested commenting.
          </p>
          <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem; color: var(--text-muted);">
            Whether you are here to browse interesting topics, read tutorials, or start your own journal — we are glad to have you in the Sphere.
          </p>
          <div style="text-align: center;">
            <a href="/blog" class="btn btn-primary"><i class="fa-solid fa-book-open"></i> Read the Blog</a>
          </div>
        </div>
      </div>
    `;
  },

  // 4. Register View
  viewRegister() {
    if (Auth.isAuthenticated()) {
      return this.navigate('/');
    }

    const viewport = document.getElementById('app-viewport');
    viewport.innerHTML = `
      <div class="auth-container">
        <div class="auth-header">
          <h2>Create Account</h2>
          <p>Get started with BlogSphere today</p>
        </div>
        <form id="register-form">
          <div class="form-group">
            <label class="form-label" for="reg-name">Full Name</label>
            <input type="text" id="reg-name" class="form-control" placeholder="John Doe" required>
            <span class="form-error" id="reg-name-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-email">Email Address</label>
            <input type="email" id="reg-email" class="form-control" placeholder="john@example.com" required>
            <span class="form-error" id="reg-email-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-password">Password</label>
            <input type="password" id="reg-password" class="form-control" placeholder="Min. 6 characters" required>
            <span class="form-error" id="reg-password-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-confirm">Confirm Password</label>
            <input type="password" id="reg-confirm" class="form-control" placeholder="Repeat your password" required>
            <span class="form-error" id="reg-confirm-error"></span>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; margin-top: 1rem;">Register</button>
        </form>
        <div class="auth-footer">
          Already have an account? <a href="/login">Login here</a>
        </div>
      </div>
    `;

    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fullName = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm').value;

      // Validation
      let isValid = true;
      
      if (!fullName) {
        this.showFormError('reg-name-error', 'Full name is required');
        isValid = false;
      } else {
        this.hideFormError('reg-name-error');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.showFormError('reg-email-error', 'Please enter a valid email address');
        isValid = false;
      } else {
        this.hideFormError('reg-email-error');
      }

      if (password.length < 6) {
        this.showFormError('reg-password-error', 'Password must be at least 6 characters long');
        isValid = false;
      } else {
        this.hideFormError('reg-password-error');
      }

      if (password !== confirmPassword) {
        this.showFormError('reg-confirm-error', 'Passwords do not match');
        isValid = false;
      } else {
        this.hideFormError('reg-confirm-error');
      }

      if (!isValid) return;

      const res = await Auth.register(fullName, email, password, confirmPassword);
      if (res.success) {
        this.navigate('/');
      }
    });
  },

  // 5. Login View
  viewLogin() {
    if (Auth.isAuthenticated()) {
      return this.navigate('/');
    }

    const viewport = document.getElementById('app-viewport');
    viewport.innerHTML = `
      <div class="auth-container">
        <div class="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to manage posts and write comments</p>
        </div>
        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Email Address</label>
            <input type="email" id="login-email" class="form-control" placeholder="john@example.com" required>
            <span class="form-error" id="login-email-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="Your password" required>
            <span class="form-error" id="login-password-error"></span>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; margin-top: 1rem;">Login</button>
        </form>
        <div class="auth-footer">
          Don't have an account? <a href="/register">Register here</a>
        </div>
      </div>
    `;

    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      let isValid = true;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.showFormError('login-email-error', 'Please enter a valid email address');
        isValid = false;
      } else {
        this.hideFormError('login-email-error');
      }

      if (!password) {
        this.showFormError('login-password-error', 'Password is required');
        isValid = false;
      } else {
        this.hideFormError('login-password-error');
      }

      if (!isValid) return;

      const res = await Auth.login(email, password);
      if (res.success) {
        this.navigate('/');
      }
    });
  },

  // 6. Create Post View
  viewCreatePost() {
    if (!Auth.isAuthenticated()) {
      UI.toast('You must be logged in to create a post', 'error');
      return this.navigate('/login');
    }

    const viewport = document.getElementById('app-viewport');
    viewport.innerHTML = `
      <div class="container">
        <div class="form-container">
          <h2>Create New Post</h2>
          <form id="create-post-form">
            <div class="form-group">
              <label class="form-label" for="post-title">Title</label>
              <input type="text" id="post-title" class="form-control" placeholder="Enter post title" required>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="post-category">Category</label>
              <select id="post-category" class="form-control" required>
                <option value="General">General</option>
                <option value="Tech">Tech</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Travel">Travel</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="post-cover">Cover Image URL</label>
              <input type="url" id="post-cover" class="form-control" placeholder="https://images.unsplash.com/... (optional)">
            </div>

            <div class="form-group">
              <label class="form-label" for="post-tags">Tags (comma separated)</label>
              <input type="text" id="post-tags" class="form-control" placeholder="javascript, webdev, setup">
            </div>

            <div class="form-group">
              <label class="form-label" for="post-content">Article Content (Markdown supported)</label>
              <textarea id="post-content" class="form-control" placeholder="Write your post details here..." required></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" id="btn-cancel-post">Cancel</button>
              <button type="submit" class="btn btn-primary">Publish Post</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('btn-cancel-post').addEventListener('click', () => {
      this.navigate('/blog');
    });

    const form = document.getElementById('create-post-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('post-title').value.trim();
      const category = document.getElementById('post-category').value;
      const coverImage = document.getElementById('post-cover').value.trim();
      const tags = document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t);
      const content = document.getElementById('post-content').value.trim();

      if (!title || !content) {
        return UI.toast('Title and content are required', 'error');
      }

      const res = await Posts.createPost({ title, category, coverImage, tags, content });
      if (res.success) {
        this.navigate(`/post/${res.post.id}`);
      }
    });
  },

  // 7. Edit Post View
  async viewEditPost(id) {
    if (!Auth.isAuthenticated()) {
      UI.toast('You must be logged in to edit a post', 'error');
      return this.navigate('/login');
    }

    const post = await Posts.getPost(id);
    if (!post) return this.navigate('/blog');

    if (!Auth.isOwner(post.authorId)) {
      UI.toast('You are not authorized to edit this article', 'error');
      return this.navigate(`/post/${id}`);
    }

    const viewport = document.getElementById('app-viewport');
    viewport.innerHTML = `
      <div class="container">
        <div class="form-container">
          <h2>Edit Post</h2>
          <form id="edit-post-form">
            <div class="form-group">
              <label class="form-label" for="post-title">Title</label>
              <input type="text" id="post-title" class="form-control" value="${post.title}" required>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="post-category">Category</label>
              <select id="post-category" class="form-control" required>
                <option value="General" ${post.category === 'General' ? 'selected' : ''}>General</option>
                <option value="Tech" ${post.category === 'Tech' ? 'selected' : ''}>Tech</option>
                <option value="Lifestyle" ${post.category === 'Lifestyle' ? 'selected' : ''}>Lifestyle</option>
                <option value="Travel" ${post.category === 'Travel' ? 'selected' : ''}>Travel</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="post-cover">Cover Image URL</label>
              <input type="url" id="post-cover" class="form-control" value="${post.coverImage || ''}" placeholder="https://images.unsplash.com/... (optional)">
            </div>

            <div class="form-group">
              <label class="form-label" for="post-tags">Tags (comma separated)</label>
              <input type="text" id="post-tags" class="form-control" value="${(post.tags || []).join(', ')}">
            </div>

            <div class="form-group">
              <label class="form-label" for="post-content">Article Content (Markdown supported)</label>
              <textarea id="post-content" class="form-control" required>${post.content}</textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" id="btn-cancel-post">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('btn-cancel-post').addEventListener('click', () => {
      this.navigate(`/post/${id}`);
    });

    const form = document.getElementById('edit-post-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('post-title').value.trim();
      const category = document.getElementById('post-category').value;
      const coverImage = document.getElementById('post-cover').value.trim();
      const tags = document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t);
      const content = document.getElementById('post-content').value.trim();

      if (!title || !content) {
        return UI.toast('Title and content are required', 'error');
      }

      const res = await Posts.updatePost(id, { title, category, coverImage, tags, content });
      if (res.success) {
        this.navigate(`/post/${id}`);
      }
    });
  },

  // 8. Single Post View (with author details, dynamic tags, comments)
  async viewSinglePost(id) {
    const post = await Posts.getPost(id);
    if (!post) {
      return this.viewNotFound();
    }

    const coverUrl = post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop';
    const authorInitials = UI.getInitials(post.authorName);
    const postDate = UI.formatDate(post.createdAt);
    
    // Parse markdown paragraphs / headings / code blocks / list items simply for client presentation
    const formattedContent = this.parseSimpleMarkdown(post.content);

    const viewport = document.getElementById('app-viewport');
    viewport.innerHTML = `
      <div class="container" style="max-width: 900px;">
        <article class="post-detail">
          
          <div class="post-header">
            <span class="category-tag">${post.category}</span>
            <h1 class="post-title">${post.title}</h1>
            <div class="post-meta">
              <div class="author-info">
                <div class="avatar">${authorInitials}</div>
                <span>By ${post.authorName}</span>
              </div>
              <span><i class="fa-regular fa-calendar"></i> Published: ${postDate}</span>
              <span><i class="fa-regular fa-comments"></i> <span id="meta-comment-count">0</span> Comments</span>
            </div>
          </div>

          <div class="post-cover-wrapper">
            <img src="${coverUrl}" alt="${post.title}" class="post-cover" loading="lazy">
          </div>

          <div class="post-content">
            ${formattedContent}
          </div>

          <!-- Tags list -->
          <div class="post-tags" id="post-tags-list">
            ${(post.tags || []).map(t => `<span class="tag-badge">#${t}</span>`).join('')}
          </div>

          <!-- Edit/Delete for authorized post owners -->
          <div class="post-admin-actions" id="post-admin-actions" style="display: none;">
            <a href="/edit-post/${post.id}" class="btn btn-secondary"><i class="fa-regular fa-pen-to-square"></i> Edit Post</a>
            <button class="btn btn-danger" id="btn-delete-post"><i class="fa-regular fa-trash-can"></i> Delete Post</button>
          </div>

        </article>

        <!-- Comments Section -->
        <section class="comments-container">
          <div class="comments-header">
            <h3><i class="fa-regular fa-comments"></i> Discussion (<span id="discussion-comment-count">0</span>)</h3>
          </div>

          <div class="comments-list" id="comments-list-root">
            <!-- Dynamic comments stream -->
          </div>

          <div class="comment-form-wrapper">
            <h4 class="comment-form-title" id="comment-form-title">Leave a Comment</h4>
            
            <div id="replying-info-bar" class="replying-to-info" style="display: none;">
              <span>Replying to <strong id="replying-to-author"></strong></span>
              <button class="cancel-reply-btn" id="cancel-reply-btn"><i class="fa-solid fa-xmark"></i> Cancel</button>
            </div>

            <div id="comment-form-section">
              <!-- Rendered depending on login status -->
            </div>
          </div>
        </section>
      </div>
    `;

    // Show admin controls if current logged-in user is owner
    if (Auth.isAuthenticated() && Auth.isOwner(post.authorId)) {
      const adminActions = document.getElementById('post-admin-actions');
      adminActions.style.display = 'flex';
      
      document.getElementById('btn-delete-post').addEventListener('click', async () => {
        const deleted = await Posts.deletePost(post.id);
        if (deleted) {
          this.navigate('/blog');
        }
      });
    }

    // Load comments list
    this.loadPostComments(post.id);

    // Render comment form dynamically
    this.renderCommentForm(post.id);
  },

  async loadPostComments(postId) {
    const listRoot = document.getElementById('comments-list-root');
    const metaCount = document.getElementById('meta-comment-count');
    const discussionCount = document.getElementById('discussion-comment-count');
    if (!listRoot) return;

    const data = await Comments.getComments(postId);
    
    if (metaCount) metaCount.innerText = data.total;
    if (discussionCount) discussionCount.innerText = data.total;

    if (data.comments.length === 0) {
      listRoot.innerHTML = `<p style="text-align: center; color: var(--text-light); padding: 1.5rem 0;">No comments yet. Start the conversation!</p>`;
      return;
    }

    listRoot.innerHTML = data.comments.map(c => Comments.renderComment(c, postId)).join('');

    // Attach click handlers on comments buttons
    listRoot.querySelectorAll('.btn-reply-comment').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.getAttribute('data-id');
        const author = btn.getAttribute('data-author');
        this.setupReplyMode(commentId, author);
      });
    });

    listRoot.querySelectorAll('.btn-delete-comment').forEach(btn => {
      btn.addEventListener('click', async () => {
        const commentId = btn.getAttribute('data-id');
        const success = await Comments.deleteComment(postId, commentId);
        if (success) {
          this.loadPostComments(postId);
        }
      });
    });
  },

  renderCommentForm(postId) {
    const section = document.getElementById('comment-form-section');
    if (!section) return;

    if (Auth.isAuthenticated()) {
      section.innerHTML = `
        <form class="comment-form" id="new-comment-form">
          <textarea class="form-control" placeholder="Add your perspective..." id="comment-text" required></textarea>
          <button type="submit" class="btn btn-primary"><i class="fa-regular fa-paper-plane"></i> Post Comment</button>
        </form>
      `;

      const form = document.getElementById('new-comment-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('comment-text').value.trim();
        if (!text) return UI.toast('Comment cannot be empty', 'error');

        const comment = await Comments.addComment(postId, text, this.replyingToCommentId);
        if (comment) {
          document.getElementById('comment-text').value = '';
          this.clearReplyMode();
          this.loadPostComments(postId);
        }
      });
    } else {
      section.innerHTML = `
        <div class="comment-login-prompt">
          <p style="margin-bottom: 1rem;">Join the conversation. Please sign in to submit a comment.</p>
          <a href="/login" class="btn btn-secondary">Login to Comment</a>
        </div>
      `;
    }
  },

  setupReplyMode(commentId, author) {
    this.replyingToCommentId = commentId;
    const bar = document.getElementById('replying-info-bar');
    const authorEl = document.getElementById('replying-to-author');
    const formTitle = document.getElementById('comment-form-title');

    if (bar && authorEl && formTitle) {
      authorEl.innerText = author;
      bar.style.display = 'flex';
      formTitle.innerText = 'Reply to Comment';
      
      const txt = document.getElementById('comment-text');
      if (txt) {
        txt.focus();
        txt.placeholder = `Replying to ${author}...`;
      }

      // Attach cancel reply
      document.getElementById('cancel-reply-btn').onclick = () => this.clearReplyMode();
    }
  },

  clearReplyMode() {
    this.replyingToCommentId = null;
    const bar = document.getElementById('replying-info-bar');
    const formTitle = document.getElementById('comment-form-title');

    if (bar && formTitle) {
      bar.style.display = 'none';
      formTitle.innerText = 'Leave a Comment';
      
      const txt = document.getElementById('comment-text');
      if (txt) {
        txt.placeholder = 'Add your perspective...';
      }
    }
  },

  // 9. Page Not Found View
  viewNotFound() {
    const viewport = document.getElementById('app-viewport');
    viewport.innerHTML = `
      <div class="container" style="text-align: center; padding-top: 5rem; padding-bottom: 5rem;">
        <h2 style="font-size: 5rem; color: var(--primary-color); margin-bottom: 1rem;">404</h2>
        <p style="font-size: 1.5rem; color: var(--text-muted); margin-bottom: 2rem;">Page not found or article does not exist.</p>
        <a href="/" class="btn btn-primary"><i class="fa-solid fa-house"></i> Back to Safety</a>
      </div>
    `;
  },

  // Form error UI helpers
  showFormError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
      el.innerText = msg;
      el.style.display = 'block';
    }
  },

  hideFormError(id) {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
    }
  },

  // Quick custom client markdown content renderer (supports headings, code blocks, lists, quotes, paragraphs)
  parseSimpleMarkdown(text) {
    if (!text) return '';
    let html = text;

    // Escaping html tags safely to prevent script injections
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks with syntax highlighting placeholders
    html = html.replace(/```javascript([\s\S]*?)```/g, '<pre><code class="language-javascript">$1</code></pre>');
    html = html.replace(/```python([\s\S]*?)```/g, '<pre><code class="language-python">$1</code></pre>');
    html = html.replace(/```css([\s\S]*?)```/g, '<pre><code class="language-css">$1</code></pre>');
    html = html.replace(/```html([\s\S]*?)```/g, '<pre><code class="language-html">$1</code></pre>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Blockquotes
    html = html.replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>');

    // List items (simple translation)
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');

    // Group adjacent list items in <ul>
    html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

    // Split text into paragraphs (avoiding pre and headings/lists)
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<pre>') || block.startsWith('<h2>') || block.startsWith('<h3>') || block.startsWith('<blockquote>') || block.startsWith('<ul>')) {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
  }
};

// Start application logic
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
