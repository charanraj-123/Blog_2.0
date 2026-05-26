const UI = {
  // Toast notifications
  toast(message, type = 'success', duration = 3000) {
    const root = document.getElementById('toast-root');
    if (!root) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    
    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    `;

    root.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      });
    }, duration);
  },

  // Loader spinner
  showLoader() {
    const spinner = document.getElementById('spinner-root');
    if (spinner) spinner.classList.add('active');
  },

  hideLoader() {
    const spinner = document.getElementById('spinner-root');
    if (spinner) spinner.classList.remove('active');
  },

  // Confirm dialog
  confirm(title, text, confirmText = 'Delete', type = 'danger') {
    return new Promise((resolve) => {
      const overlay = document.getElementById('dialog-root');
      const titleEl = document.getElementById('dialog-title');
      const textEl = document.getElementById('dialog-text');
      const cancelBtn = document.getElementById('dialog-cancel-btn');
      const confirmBtn = document.getElementById('dialog-confirm-btn');

      if (!overlay) return resolve(false);

      titleEl.innerText = title;
      textEl.innerText = text;
      confirmBtn.innerText = confirmText;

      // Reset button classes
      confirmBtn.className = 'btn';
      if (type === 'danger') {
        confirmBtn.classList.add('btn-danger');
      } else {
        confirmBtn.classList.add('btn-primary');
      }

      overlay.classList.add('active');

      const cleanup = (value) => {
        overlay.classList.remove('active');
        // Remove event listeners
        cancelBtn.removeEventListener('click', handleCancel);
        confirmBtn.removeEventListener('click', handleConfirm);
        resolve(value);
      };

      const handleCancel = () => cleanup(false);
      const handleConfirm = () => cleanup(true);

      cancelBtn.addEventListener('click', handleCancel);
      confirmBtn.addEventListener('click', handleConfirm);
    });
  },

  // Date formatter
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Generate Author initials
  getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
};
