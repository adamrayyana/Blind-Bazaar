(() => {
  const form = document.querySelector('[data-auth-form]');
  if (!form) return;

  const submitButton = form.querySelector('[data-auth-submit]');
  const alertBox = document.getElementById('auth-alert');
  const csrfInput = form.querySelector('input[name="csrfmiddlewaretoken"]');
  const csrfToken = csrfInput ? csrfInput.value : null;
  const authType = form.dataset.authType || 'login';

  const showAlert = (type, message) => {
    if (!alertBox) return;
    if (!type) {
      alertBox.classList.add('hidden');
      alertBox.textContent = '';
      alertBox.classList.remove(
        'border-rose-200',
        'bg-rose-50',
        'text-rose-700',
        'border-emerald-200',
        'bg-emerald-50',
        'text-emerald-700',
      );
      return;
    }

    alertBox.classList.remove('hidden');
    alertBox.textContent = message;

    alertBox.classList.remove(
      'border-rose-200',
      'bg-rose-50',
      'text-rose-700',
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-700',
    );

    if (type === 'error') {
      alertBox.classList.add('border-rose-200', 'bg-rose-50', 'text-rose-700');
    } else {
      alertBox.classList.add('border-emerald-200', 'bg-emerald-50', 'text-emerald-700');
    }
  };

  const clearErrors = () => {
    form.querySelectorAll('[data-error-for]').forEach((node) => {
      node.textContent = '';
      node.classList.add('hidden');
    });
  };

  const renderErrors = (errors = {}) => {
    Object.entries(errors).forEach(([field, messages]) => {
      if (field === '__all__') {
        showAlert('error', Array.isArray(messages) ? messages.join(' ') : String(messages));
        return;
      }
      const target = form.querySelector(`[data-error-for="${field}"]`);
      if (target) {
        const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
        target.textContent = text;
        target.classList.remove('hidden');
      }
    });
  };

  const setSubmitting = (submitting) => {
    if (!submitButton) return;
    submitButton.disabled = submitting;
    submitButton.classList.toggle('opacity-70', submitting);
    submitButton.classList.toggle('cursor-not-allowed', submitting);
  };

  const handleSuccess = (data) => {
    const message =
      authType === 'login'
        ? 'Login successful. Redirecting to the homepage...'
        : 'Account created! Redirecting to the sign-in page.';

    showToast('All set!', message, 'success');
    showAlert('success', message);

    const redirectUrl = data && data.redirect ? data.redirect : '/';
    window.setTimeout(() => {
      window.location.href = redirectUrl;
    }, 750);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearErrors();
    showAlert(null);
    setSubmitting(true);

    const action = form.getAttribute('action') || window.location.href;
    const formData = new FormData(form);

    try {
      const response = await fetch(action, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        renderErrors(data.errors || {});
        if (!data.errors || (!data.errors.__all__ && Object.keys(data.errors).length === 0)) {
          showAlert('error', 'Please review the highlighted fields and try again.');
        }
        showToast('Authentication failed', 'Double-check your credentials and try again.', 'error');
        return;
      }

      handleSuccess(data);
    } catch (error) {
      console.error(error);
      showAlert('error', 'Network error. Please try again in a moment.');
      showToast('Connection issue', 'We could not reach the server. Try again shortly.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  form.addEventListener('submit', handleSubmit);
})();
