const Posts = {
  // Fetch posts from API
  async getPosts(page = 1, category = '', search = '') {
    UI.showLoader();
    try {
      let url = `/api/posts?page=${page}&limit=6`;
      if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load posts');
      return await res.json();
    } catch (err) {
      UI.toast(err.message, 'error');
      return { posts: [], total: 0, page: 1, limit: 6, pages: 0 };
    } finally {
      UI.hideLoader();
    }
  },

  // Fetch single post details
  async getPost(id) {
    UI.showLoader();
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) throw new Error('Post not found');
      return await res.json();
    } catch (err) {
      UI.toast(err.message, 'error');
      return null;
    } finally {
      UI.hideLoader();
    }
  },

  // Create post api call
  async createPost(postData) {
    UI.showLoader();
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`
        },
        body: JSON.stringify(postData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create post');
      
      UI.toast('Post created successfully!', 'success');
      return { success: true, post: data.post };
    } catch (err) {
      UI.toast(err.message, 'error');
      return { success: false, error: err.message };
    } finally {
      UI.hideLoader();
    }
  },

  // Update post api call
  async updatePost(id, postData) {
    UI.showLoader();
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`
        },
        body: JSON.stringify(postData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update post');
      
      UI.toast('Post updated successfully!', 'success');
      return { success: true, post: data.post };
    } catch (err) {
      UI.toast(err.message, 'error');
      return { success: false, error: err.message };
    } finally {
      UI.hideLoader();
    }
  },

  // Delete post api call
  async deletePost(id) {
    const confirm = await UI.confirm(
      'Delete Post',
      'Are you sure you want to permanently delete this blog post?',
      'Delete Post',
      'danger'
    );
    if (!confirm) return false;

    UI.showLoader();
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Auth.getToken()}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete post');
      
      UI.toast('Post deleted successfully', 'success');
      return true;
    } catch (err) {
      UI.toast(err.message, 'error');
      return false;
    } finally {
      UI.hideLoader();
    }
  },

  // Helpers to render blog cards
  renderPostCard(post) {
    const coverUrl = post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop';
    const cleanExcerpt = post.excerpt ? post.excerpt.replace(/[#*`]/g, '') : '';
    const initial = UI.getInitials(post.authorName);
    
    // Choose badge color class (General/Tech/Lifestyle/Travel/etc.)
    let badgeClass = '';
    if (['Tech', 'Productivity', 'Business'].includes(post.category)) badgeClass = 'green';

    return `
      <article class="card">
        <div class="card-img-wrapper">
          <img src="${coverUrl}" alt="${post.title}" class="card-img" loading="lazy">
        </div>
        <div class="card-body">
          <span class="category-tag ${badgeClass}">${post.category}</span>
          <h3 class="card-title">
            <a href="/post/${post.id}" class="post-link" data-id="${post.id}">${post.title}</a>
          </h3>
          <p class="card-excerpt">${cleanExcerpt}...</p>
          <div class="card-footer">
            <div class="author-info">
              <div class="avatar">${initial}</div>
              <span class="author-name">${post.authorName}</span>
            </div>
            <div class="card-meta">
              <span><i class="fa-regular fa-calendar"></i> ${UI.formatDate(post.createdAt)}</span>
              <span><i class="fa-regular fa-comment"></i> ${post.commentCount} Comments</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }
};
