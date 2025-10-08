(() => {
  const pageRoot = document.getElementById('product-page-root');

  const collectionEndpoint = pageRoot ? pageRoot.dataset.productsEndpoint : '';
  const resourceTemplate = pageRoot ? pageRoot.dataset.productResourceTemplate : '';
  const detailTemplate = pageRoot ? pageRoot.dataset.productDetailTemplate : '';
  const placeholderImage = pageRoot ? pageRoot.dataset.placeholderImage : '';

  const buildResourceUrl = (id) => (resourceTemplate
    ? resourceTemplate.replace('00000000-0000-0000-0000-000000000000', id)
    : '');
  const buildDetailUrl = (id) => (detailTemplate
    ? detailTemplate.replace('00000000-0000-0000-0000-000000000000', id)
    : '#');

  const getCookie = (name) => {
    const cookieString = document.cookie;
    if (!cookieString) return null;
    const cookies = cookieString.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  const csrfToken = getCookie('csrftoken');

  const state = {
    items: [],
    filter: 'all',
    editingId: null,
    deletingId: null,
    isFetching: false,
  };

  const elements = {
    loading: document.getElementById('product-loading'),
    error: document.getElementById('product-error'),
    empty: document.getElementById('product-empty'),
    grid: document.getElementById('product-grid'),
    filterButtons: Array.from(document.querySelectorAll('.filter-chip')),
    createButton: document.getElementById('product-create-button'),
    emptyCreateButton: document.querySelector('[data-action="empty-create"]'),
    refreshButton: document.getElementById('product-refresh-button'),
    errorRetryButton: document.querySelector('#product-error [data-action="retry"]'),
    modal: document.getElementById('crudModal'),
    modalContent: document.getElementById('crudModalContent'),
    modalTitle: document.getElementById('product-modal-title'),
    modalForm: document.getElementById('productForm'),
    submitButton: document.getElementById('product-submit-button'),
    deleteModal: document.getElementById('product-delete-modal'),
    deleteModalContent: document.getElementById('product-delete-modal-content'),
    deleteConfirmButton: document.getElementById('product-delete-confirm-button'),
    deleteCancelButtons: Array.from(document.querySelectorAll('#product-delete-modal [data-delete-cancel]')),
  };

  const rarityStyles = {
    common: 'bg-slate-200 text-slate-700',
    uncommon: 'bg-emerald-100 text-emerald-700',
    rare: 'bg-blue-100 text-blue-700',
    legendary: 'bg-amber-100 text-amber-700',
  };

  const categoryLabels = {
    photocard: 'Photocard',
    gear: 'Gear Card',
    jersey: 'Jersey Card',
    event: 'Event Card',
    sponsorship: 'Sponsorship',
    pack: 'Booster Pack',
  };

  const setViewState = (view) => {
    const views = {
      loading: view === 'loading',
      error: view === 'error',
      empty: view === 'empty',
      grid: view === 'grid',
    };

    if (elements.loading) {
      elements.loading.classList.toggle('hidden', !views.loading);
    }
    if (elements.error) {
      elements.error.classList.toggle('hidden', !views.error);
    }
    if (elements.empty) {
      elements.empty.classList.toggle('hidden', !views.empty);
    }
    if (elements.grid) {
      elements.grid.classList.toggle('hidden', !views.grid);
    }
  };

  const updateFilterButtons = () => {
    elements.filterButtons.forEach((button) => {
      const { filter } = button.dataset;
      if (filter === state.filter) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  };

  const closeModal = () => {
    if (typeof hideModal === 'function') {
      hideModal();
    }
  };

  const openModal = (mode, product = null) => {
    if (!elements.modalForm) return;
    clearFormErrors();
    elements.modalForm.reset();

    if (mode === 'edit' && product) {
      state.editingId = product.id;
      elements.modalTitle.textContent = 'Update Product';
      elements.submitButton.textContent = 'Update product';
      elements.modalForm.elements.name.value = product.name ?? '';
      elements.modalForm.elements.price.value = product.price ?? '';
      elements.modalForm.elements.description.value = product.description ?? '';
      elements.modalForm.elements.category.value = product.category ?? '';
      elements.modalForm.elements.rarity.value = product.rarity ?? '';
      elements.modalForm.elements.thumbnail.value = product.thumbnail ?? '';
      elements.modalForm.elements.is_featured.checked = Boolean(product.is_featured);
    } else {
      state.editingId = null;
      elements.modalTitle.textContent = 'Create Product';
      elements.submitButton.textContent = 'Save product';
    }

    if (typeof showModal === 'function') {
      showModal();
    }
  };

  const openDeleteModal = (productId) => {
    if (!elements.deleteModal) return;
    state.deletingId = productId;
    elements.deleteModal.classList.remove('hidden');

    window.requestAnimationFrame(() => {
      elements.deleteModalContent.classList.add('scale-95', 'opacity-0');
      window.requestAnimationFrame(() => {
        elements.deleteModalContent.classList.remove('scale-95', 'opacity-0');
        elements.deleteModalContent.classList.add('scale-100', 'opacity-100');
      });
    });
  };

  const closeDeleteModal = () => {
    if (!elements.deleteModal) return;
    elements.deleteModalContent.classList.remove('scale-100', 'opacity-100');
    elements.deleteModalContent.classList.add('scale-95', 'opacity-0');
    window.setTimeout(() => {
      elements.deleteModal.classList.add('hidden');
      elements.deleteModalContent.classList.remove('scale-95', 'opacity-0');
      state.deletingId = null;
    }, 160);
  };

  const clearFormErrors = () => {
    if (!elements.modalForm) return;
    elements.modalForm.querySelectorAll('[data-error-name],[data-error-price],[data-error-description],[data-error-category],[data-error-rarity],[data-error-thumbnail]').forEach((node) => {
      node.classList.add('hidden');
      node.textContent = '';
    });
  };

  const showFormErrors = (errors) => {
    if (!elements.modalForm || !errors) return;
    Object.entries(errors).forEach(([field, messages]) => {
      const target = elements.modalForm.querySelector(`[data-error-${field}]`);
      if (target) {
        target.textContent = Array.isArray(messages) ? messages.join(' ') : String(messages);
        target.classList.remove('hidden');
      }
    });
  };

  const buildBadge = (label, className) => {
    const span = document.createElement('span');
    span.className = `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`;
    span.textContent = label;
    return span;
  };

  const renderProducts = () => {
    const wrapper = elements.grid;
    if (!wrapper) {
      setViewState(filteredItems.length ? 'grid' : 'empty');
      return;
    }

    const filteredItems = state.filter === 'all'
      ? state.items
      : state.items.filter((item) => item.is_owner);

    if (filteredItems.length === 0) {
      setViewState('empty');
      return;
    }

    wrapper.innerHTML = '';
    filteredItems.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow transition hover:-translate-y-1 hover:shadow-xl';

      const detailUrl = buildDetailUrl(item.id);
      const thumbnailUrl = item.thumbnail ? DOMPurify.sanitize(item.thumbnail) : '';
      const safeName = DOMPurify.sanitize(item.name);
      const safeDescription = DOMPurify.sanitize(item.description);
      const createdAt = item.created_at ? new Date(item.created_at) : null;
      const formattedDate = createdAt
        ? createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'Unknown date';
      const rarityBadgeClass = rarityStyles[item.rarity] ?? 'bg-slate-200 text-slate-700';
      const categoryLabel = categoryLabels[item.category] ?? item.category;

      const media = document.createElement('div');
      media.className = 'relative aspect-[16/9] overflow-hidden';
      if (thumbnailUrl) {
        const img = document.createElement('img');
        img.src = thumbnailUrl;
        img.alt = safeName;
        img.className = 'h-full w-full object-cover transition duration-500 group-hover:scale-105';
        img.onerror = () => {
          img.onerror = null;
          if (placeholderImage) {
            img.src = placeholderImage;
          }
        };
        media.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 text-4xl';
        placeholder.textContent = '🎴';
        media.appendChild(placeholder);
      }

      const badgeContainer = document.createElement('div');
      badgeContainer.className = 'absolute top-3 left-3 flex flex-wrap gap-2';
      badgeContainer.appendChild(buildBadge(categoryLabel, 'bg-blue-600/95 text-white shadow-sm shadow-blue-600/20'));
      if (item.is_featured) {
        badgeContainer.appendChild(buildBadge('Featured', 'bg-amber-100 text-amber-700'));
      }
      media.appendChild(badgeContainer);

      const content = document.createElement('div');
      content.className = 'flex flex-1 flex-col space-y-4 p-6';

      const meta = document.createElement('div');
      meta.className = 'flex items-center justify-between text-xs text-gray-500';
      const author = DOMPurify.sanitize(item.owner_username ?? 'Anonymous');
      meta.innerHTML = `<span>${formattedDate}</span><span>by ${author}</span>`;

      const title = document.createElement('h3');
      title.className = 'text-lg font-semibold text-gray-900';
      const titleLink = document.createElement('a');
      titleLink.href = detailUrl;
      titleLink.textContent = safeName;
      titleLink.className = 'transition hover:text-blue-600';
      title.appendChild(titleLink);

      const pillRow = document.createElement('div');
      pillRow.className = 'flex flex-wrap items-center gap-2';
      pillRow.appendChild(buildBadge(DOMPurify.sanitize(item.rarity_label ?? ''), rarityBadgeClass));
      pillRow.appendChild(buildBadge(`$${item.price}`, 'bg-blue-600 text-white'));

      const description = document.createElement('p');
      description.className = 'line-clamp-3 text-sm leading-relaxed text-gray-600';
      description.textContent = safeDescription;

      const footer = document.createElement('div');
      footer.className = 'flex items-center justify-between border-t border-blue-50 pt-4';
      const detailLink = document.createElement('a');
      detailLink.href = detailUrl;
      detailLink.className = 'text-sm font-semibold text-blue-600 transition hover:text-blue-700';
      detailLink.textContent = 'View detail';
      footer.appendChild(detailLink);

      if (item.is_owner) {
        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-3 text-sm font-semibold';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.dataset.action = 'edit';
        editButton.className = 'text-blue-600 transition hover:text-blue-700';
        editButton.textContent = 'Edit';
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.dataset.action = 'delete';
        deleteButton.className = 'text-rose-600 transition hover:text-rose-700';
        deleteButton.textContent = 'Delete';

        editButton.addEventListener('click', () => openModal('edit', item));
        deleteButton.addEventListener('click', () => openDeleteModal(item.id));

        actions.append(editButton, deleteButton);
        footer.appendChild(actions);
      }

      content.append(meta, title, pillRow, description, footer);
      card.append(media, content);
      wrapper.appendChild(card);
    });

    setViewState('grid');
  };

  const fetchProducts = async ({ silent = false } = {}) => {
    if (!collectionEndpoint) {
      state.isFetching = false;
      return;
    }
    state.isFetching = true;
    if (!silent) {
      setViewState('loading');
    }
    try {
      const response = await fetch(collectionEndpoint, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      const data = await response.json();
      state.items = Array.isArray(data.items) ? data.items : [];
      renderProducts();
    } catch (error) {
      console.error(error);
      setViewState('error');
    } finally {
      state.isFetching = false;
    }
  };

  const buildPayload = () => {
    const form = elements.modalForm;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    payload.name = (payload.name || '').trim();
    payload.description = (payload.description || '').trim();
    payload.thumbnail = (payload.thumbnail || '').trim();
    payload.price = Number(payload.price);
    payload.is_featured = form.elements.is_featured.checked;

    return payload;
  };

  const mergeProductIntoState = (product) => {
    const existingIndex = state.items.findIndex((item) => item.id === product.id);
    if (existingIndex >= 0) {
      state.items.splice(existingIndex, 1, product);
    } else {
      state.items.unshift(product);
    }
  };

  const removeProductFromState = (productId) => {
    state.items = state.items.filter((item) => item.id !== productId);
  };

  const submitProduct = async () => {
    clearFormErrors();
    const payload = buildPayload();
    const isEdit = Boolean(state.editingId);
    const endpoint = isEdit ? buildResourceUrl(state.editingId) : collectionEndpoint;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      elements.submitButton.disabled = true;
      elements.submitButton.classList.add('opacity-75');
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showFormErrors(data.errors);
        showToast('Unable to save product', 'Please review the highlighted fields.', 'error');
        return;
      }

      if (data.item) {
        mergeProductIntoState(data.item);
      }
      closeModal();
      renderProducts();
      const message = isEdit ? 'Product updated successfully!' : 'Product created successfully!';
      showToast(message, '', 'success');
      if (data.item) {
        document.dispatchEvent(new CustomEvent('products:updated', { detail: data.item }));
      }
    } catch (error) {
      console.error(error);
      showToast('Network issue', 'We could not reach the server. Try again shortly.', 'error');
    } finally {
      elements.submitButton.disabled = false;
      elements.submitButton.classList.remove('opacity-75');
    }
  };

  const deleteProduct = async () => {
    if (!state.deletingId) return;
    const endpoint = buildResourceUrl(state.deletingId);
    try {
      elements.deleteConfirmButton.disabled = true;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      removeProductFromState(state.deletingId);
      document.dispatchEvent(new CustomEvent('products:deleted', { detail: state.deletingId }));
      closeDeleteModal();
      renderProducts();
      showToast('Product deleted', 'The product has been removed successfully.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Deletion failed', 'We could not remove the product. Please retry.', 'error');
    } finally {
      elements.deleteConfirmButton.disabled = false;
    }
  };

  if (elements.modal) {
    elements.modal.addEventListener('click', (event) => {
      if (event.target === elements.modal) {
        closeModal();
      }
    });
  }

  elements.deleteCancelButtons.forEach((button) => {
    button.addEventListener('click', closeDeleteModal);
  });

  if (elements.deleteModal) {
    elements.deleteModal.addEventListener('click', (event) => {
      if (event.target === elements.deleteModal) {
        closeDeleteModal();
      }
    });
  }

  if (elements.deleteConfirmButton) {
    elements.deleteConfirmButton.addEventListener('click', deleteProduct);
  }

  if (elements.createButton) {
    elements.createButton.addEventListener('click', () => openModal('create'));
  }

  if (elements.emptyCreateButton) {
    elements.emptyCreateButton.addEventListener('click', () => openModal('create'));
  }

  if (elements.refreshButton) {
    elements.refreshButton.addEventListener('click', () => {
      fetchProducts();
      showToast('Refreshing products', 'Fetching the latest product list.', 'info');
    });
  }

  if (elements.errorRetryButton) {
    elements.errorRetryButton.addEventListener('click', () => fetchProducts());
  }

  elements.filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter || 'all';
      updateFilterButtons();
      renderProducts();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (elements.modal && !elements.modal.classList.contains('hidden')) {
        closeModal();
      }
      if (elements.deleteModal && !elements.deleteModal.classList.contains('hidden')) {
        closeDeleteModal();
      }
    }
  });

  document.addEventListener('productForm:submit', submitProduct);
  document.addEventListener('productModal:closed', () => {
    state.editingId = null;
    if (elements.modalForm) {
      elements.modalForm.reset();
    }
    clearFormErrors();
  });
  document.addEventListener('products:refresh', () => fetchProducts({ silent: false }));
  document.addEventListener('products:openModal', () => openModal('create'));
  document.addEventListener('products:prefill', (event) => {
    const product = event.detail;
    if (product && product.id) {
      mergeProductIntoState(product);
      openModal('edit', product);
    }
  });
  document.addEventListener('products:requestDelete', (event) => {
    const product = event.detail;
    if (!product) return;
    if (typeof product === 'object' && product.id) {
      mergeProductIntoState(product);
      openDeleteModal(product.id);
    } else {
      openDeleteModal(product);
    }
  });

  updateFilterButtons();
  fetchProducts();
})();
