(() => {
  const root = document.getElementById('product-detail-root');
  if (!root) return;

  const productId = root.dataset.productId;
  const resourceTemplate = root.dataset.resourceTemplate;
  const placeholderImage = root.dataset.placeholderImage;
  const homeUrl = root.dataset.homeUrl;

  if (!productId || !resourceTemplate) return;

  const endpoint = resourceTemplate.replace('00000000-0000-0000-0000-000000000000', productId);

  const elements = {
    loading: document.getElementById('detail-loading'),
    error: document.getElementById('detail-error'),
    retry: document.querySelector('[data-detail-retry]'),
    article: document.getElementById('detail-article'),
    thumbnail: document.getElementById('detail-thumbnail'),
    placeholder: document.getElementById('detail-placeholder'),
    featured: document.getElementById('detail-featured'),
    description: document.getElementById('detail-description'),
    title: document.getElementById('detail-title'),
    subtitle: document.getElementById('detail-subtitle'),
    price: document.getElementById('detail-price'),
    rarity: document.getElementById('detail-rarity'),
    category: document.getElementById('detail-category'),
    created: document.getElementById('detail-created'),
    owner: document.getElementById('detail-owner'),
    badges: document.getElementById('detail-badges'),
    actions: document.getElementById('detail-actions'),
    actionEdit: document.querySelector('#detail-actions [data-action="edit"]'),
    actionDelete: document.querySelector('#detail-actions [data-action="delete"]'),
  };

  const setState = (state) => {
    elements.loading.classList.toggle('hidden', state !== 'loading');
    elements.error.classList.toggle('hidden', state !== 'error');
    elements.article.classList.toggle('hidden', state !== 'ready');
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const categoryLabels = {
    photocard: 'Photocard',
    gear: 'Gear Card',
    jersey: 'Jersey Card',
    event: 'Event Card',
    sponsorship: 'Sponsorship',
    pack: 'Booster Pack',
  };

  const rarityPhrases = {
    common: 'Common item',
    uncommon: 'Uncommon item',
    rare: 'Rare item',
    legendary: 'Legendary item',
  };

  const rarityLabels = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    legendary: 'Legendary',
  };

  const buildBadge = (text) => {
    const span = document.createElement('span');
    span.className = 'inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white';
    span.textContent = text;
    return span;
  };

  const openEditModal = (product) => {
    document.dispatchEvent(new CustomEvent('products:openModal'));
    document.dispatchEvent(new CustomEvent('products:prefill', { detail: product }));
  };

  const openDeleteModal = (productIdValue) => {
    document.dispatchEvent(new CustomEvent('products:requestDelete', { detail: productIdValue }));
  };

  const render = (product) => {
    const safeTitle = DOMPurify.sanitize(product.name || 'Unnamed product');
    const safeDescription = DOMPurify.sanitize(product.description || 'No description provided.');
    const safeOwner = DOMPurify.sanitize(product.owner_username || 'Anonymous');

    elements.title.textContent = safeTitle;
    document.title = `${safeTitle} · Blind Bazaar`;
    elements.subtitle.textContent = rarityPhrases[product.rarity] || 'Product overview';
    elements.description.textContent = safeDescription;
    elements.price.textContent = `$${product.price}`;
    elements.rarity.textContent = rarityLabels[product.rarity] || product.rarity || '-';
    elements.category.textContent = categoryLabels[product.category] || product.category || '-';
    elements.created.textContent = formatDateTime(product.created_at);
    elements.owner.textContent = safeOwner;

    elements.badges.innerHTML = '';
    elements.badges.appendChild(buildBadge(categoryLabels[product.category] || product.category || 'Category'));
    if (product.is_featured) {
      elements.badges.appendChild(buildBadge('Featured'));
    }

    if (product.thumbnail) {
      elements.thumbnail.src = DOMPurify.sanitize(product.thumbnail);
      elements.thumbnail.alt = safeTitle;
      elements.thumbnail.classList.remove('hidden');
      elements.placeholder.classList.add('hidden');
      elements.thumbnail.onerror = () => {
        elements.thumbnail.classList.add('hidden');
        if (placeholderImage) {
          elements.placeholder.classList.remove('hidden');
          elements.thumbnail.src = placeholderImage;
        }
      };
    } else {
      elements.thumbnail.classList.add('hidden');
      elements.placeholder.classList.remove('hidden');
    }

    elements.featured.classList.toggle('hidden', !product.is_featured);

    if (product.is_owner) {
      elements.actions.classList.remove('hidden');
      if (elements.actionEdit) {
        elements.actionEdit.onclick = () => openEditModal(product);
      }
      if (elements.actionDelete) {
        elements.actionDelete.onclick = () => openDeleteModal(product.id);
      }
    } else {
      elements.actions.classList.add('hidden');
    }
  };

  const fetchDetail = async () => {
    try {
      setState('loading');
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      const data = await response.json();
      if (!data.item) throw new Error('Invalid payload');
      render(data.item);
      setState('ready');
    } catch (error) {
      console.error(error);
      setState('error');
    }
  };

  if (elements.retry) {
    elements.retry.addEventListener('click', fetchDetail);
  }

  document.addEventListener('products:updated', (event) => {
    const updated = event.detail;
    if (updated && updated.id === productId) {
      fetchDetail();
    }
  });

  document.addEventListener('products:deleted', (event) => {
    const deletedId = typeof event.detail === 'object' ? event.detail?.id : event.detail;
    if (deletedId === productId) {
      showToast('Product removed', 'Returning to the catalogue.', 'info');
      if (homeUrl) {
        window.location.href = homeUrl;
      }
    }
  });

  document.addEventListener('products:refresh', fetchDetail);

  fetchDetail();
})();
