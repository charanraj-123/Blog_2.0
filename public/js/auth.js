const Auth = {
  // Get active token
  getToken() {
    return localStorage.getItem('token');
  },

  // Get active user details
  getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Check if authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Check if active user is owner of a post
  isOwner(authorId) {
    const user = this.getUser();
    return user && user.id === authorId;
  },

  // Save auth session details
  saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.updateNavbar();
  },

  // Clear auth session (Logout)
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.updateNavbar();
    UI.toast('Logged out successfully', 'success');
    // Navigate home if on a protected route
    const path = window.location.pathname;
    if (path.includes('create-post') || path.includes('edit-post')) {
      App.navigate('/');
    } else {
      App.refreshCurrentView();
    }
  },

  // Register user API call
  async register(fullName, email, password, confirmPassword) {
    UI.showLoader();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      this.saveSession(data.token, data.user);
      UI.toast(data.message || 'Account created!', 'success');
      return { success: true };
    } catch (err) {
      UI.toast(err.message, 'error');
      return { success: false, error: err.message };
    } finally {
      UI.hideLoader();
    }
  },

  // Login user API call
  async login(email, password) {
    UI.showLoader();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      this.saveSession(data.token, data.user);
      UI.toast(data.message || 'Welcome back!', 'success');
      return { success: true };
    } catch (err) {
      UI.toast(err.message, 'error');
      return { success: false, error: err.message };
    } finally {
      UI.hideLoader();
    }
  },

  // Dynamic navbar updates based on auth state
  updateNavbar() {
    const authSection = document.getElementById('nav-auth-section');
    if (!authSection) return;

    const user = this.getUser();
    if (user) {
      authSection.innerHTML = `
        <span class="user-name"><i class="fa-regular fa-user"></i> ${user.fullName}</span>
        <a href="/create-post" class="btn btn-primary" id="btn-nav-create"><i class="fa-solid fa-plus"></i> Create Post</a>
        <button class="btn btn-secondary" id="btn-logout"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</button>
      `;
      // Attach logout listener
      document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
      
      // Update footer / route permissions visibility
      document.querySelectorAll('.auth-only-show').forEach(el => el.style.display = 'block');
      document.querySelectorAll('.auth-only-hide').forEach(el => el.style.display = 'none');
    } else {
      authSection.innerHTML = `
        <a href="/login" class="nav-item" id="nav-login">Login</a>
        <a href="/register" class="btn btn-primary" id="nav-register">Register</a>
      `;
      document.querySelectorAll('.auth-only-show').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.auth-only-hide').forEach(el => el.style.display = 'block');
    }

    // Attach SPA router clicks to links inside navbar
    authSection.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const url = link.getAttribute('href');
        App.navigate(url);
      });
    });
  }
};
