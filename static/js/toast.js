(() => {
  const toast = document.getElementById('toast-component');
  if (!toast) {
    window.showToast = () => {};
    return;
  }

  const titleNode = document.getElementById('toast-title');
  const messageNode = document.getElementById('toast-message');
  const iconNode = document.getElementById('toast-icon');

  const typeStyles = {
    success: {
      icon: '✅',
      border: 'border-green-300',
      bg: 'bg-green-50/90',
      text: 'text-green-800',
    },
    error: {
      icon: '⚠️',
      border: 'border-rose-300',
      bg: 'bg-rose-50/90',
      text: 'text-rose-800',
    },
    info: {
      icon: '✨',
      border: 'border-blue-300',
      bg: 'bg-blue-50/90',
      text: 'text-blue-800',
    },
  };

  let hideTimeout = null;

  const resetClasses = () => {
    toast.classList.remove(
      'border-green-300',
      'bg-green-50/90',
      'text-green-800',
      'border-rose-300',
      'bg-rose-50/90',
      'text-rose-800',
      'border-blue-300',
      'bg-blue-50/90',
      'text-blue-800',
    );
  };

  window.showToast = (title, message = '', type = 'info', duration = 3200) => {
    const styles = typeStyles[type] || typeStyles.info;
    resetClasses();

    titleNode.textContent = title;
    messageNode.textContent = message;
    iconNode.textContent = styles.icon;

    toast.classList.add(styles.border, styles.bg, styles.text);
    toast.classList.remove('opacity-0', 'translate-y-16');
    toast.classList.add('opacity-100', 'translate-y-0');

    window.clearTimeout(hideTimeout);
    hideTimeout = window.setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-16');
    }, duration);
  };
})();
