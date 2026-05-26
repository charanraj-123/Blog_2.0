const Comments = {
  // Fetch comments for a post
  async getComments(postId) {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error('Failed to load comments');
      return await res.json();
    } catch (err) {
      console.error(err);
      return { comments: [], total: 0 };
    }
  },

  // Submit a comment or nested reply
  async addComment(postId, text, parentId = null) {
    if (!Auth.isAuthenticated()) {
      UI.toast('Please log in to leave a comment', 'error');
      return null;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`
        },
        body: JSON.stringify({ text, parentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit comment');
      
      UI.toast('Comment posted successfully', 'success');
      return data.comment;
    } catch (err) {
      UI.toast(err.message, 'error');
      return null;
    }
  },

  // Delete a comment
  async deleteComment(postId, commentId) {
    const confirm = await UI.confirm(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      'Delete',
      'danger'
    );
    if (!confirm) return false;

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Auth.getToken()}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete comment');

      UI.toast('Comment deleted', 'success');
      return true;
    } catch (err) {
      UI.toast(err.message, 'error');
      return false;
    }
  },

  // Helper to render comments list
  renderComment(comment, postId) {
    const initial = UI.getInitials(comment.authorName);
    const dateStr = UI.formatDate(comment.createdAt);
    const currentUser = Auth.getUser();
    const canDelete = currentUser && currentUser.id === comment.authorId;

    // Build sub-replies HTML
    let repliesHtml = '';
    if (comment.replies && comment.replies.length > 0) {
      repliesHtml = `
        <div class="comment-replies">
          ${comment.replies.map(reply => {
            const replyInitial = UI.getInitials(reply.authorName);
            const replyDate = UI.formatDate(reply.createdAt);
            const canDeleteReply = currentUser && currentUser.id === reply.authorId;
            return `
              <div class="comment-item" id="comment-${reply.id}">
                <div class="avatar accent">${replyInitial}</div>
                <div class="comment-main">
                  <div class="comment-meta">
                    <span class="commenter-name">${reply.authorName}</span>
                    <span class="comment-date">${replyDate}</span>
                  </div>
                  <div class="comment-text">${reply.text}</div>
                  ${canDeleteReply ? `
                    <div class="comment-actions">
                      <button class="btn-delete-comment" data-id="${reply.id}"><i class="fa-regular fa-trash-can"></i> Delete</button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    return `
      <div class="comment-thread" id="comment-thread-${comment.id}">
        <div class="comment-item" id="comment-${comment.id}">
          <div class="avatar">${initial}</div>
          <div class="comment-main">
            <div class="comment-meta">
              <span class="commenter-name">${comment.authorName}</span>
              <span class="comment-date">${dateStr}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-actions">
              ${Auth.isAuthenticated() ? `
                <button class="btn-reply-comment" data-id="${comment.id}" data-author="${comment.authorName}"><i class="fa-solid fa-reply"></i> Reply</button>
              ` : ''}
              ${canDelete ? `
                <button class="btn-delete-comment" data-id="${comment.id}"><i class="fa-regular fa-trash-can"></i> Delete</button>
              ` : ''}
            </div>
          </div>
        </div>
        ${repliesHtml}
      </div>
    `;
  }
};
