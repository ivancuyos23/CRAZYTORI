import React, { useState, useRef } from 'react';
import './AdminViews.css';
import './AdminMenuView.css';

import riceBowlImg from '../../assets/images/ricebowl.jfif';
import snackBoxImg from '../../assets/images/snackbox.jfif';
import spamMusubiImg from '../../assets/images/spamusubi.jpg';

const IMAGE_PRESETS = [
  { label: 'Rice Bowl', value: '/images/ricebowl.jfif' },
  { label: 'Snack Box', value: '/images/snackbox.jfif' },
  { label: 'Spamusubi', value: '/images/spamusubi.jpg' }
];

export const resolveProductImage = (product) => {
  if (!product) return null;
  const rawImg = product.image || '';
  if (rawImg === 'none') return null;
  if (rawImg.startsWith('data:image') || rawImg.startsWith('http')) return rawImg;

  const pImg = rawImg.toLowerCase();
  if (pImg.includes('ricebowl')) return riceBowlImg;
  if (pImg.includes('snackbox')) return snackBoxImg;
  if (pImg.includes('spamusubi')) return spamMusubiImg;

  const pName = (product.name || '').toLowerCase();
  if (pName.includes('rice bowl') || pName.includes('katsudon')) return riceBowlImg;
  if (pName.includes('snack box')) return snackBoxImg;
  if (pName.includes('spamusubi')) return spamMusubiImg;

  return null;
};

// Compress uploaded image so SQLite and localStorage stay fast
const compressImageFile = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const imgObj = new Image();
    imgObj.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 360;
      let width = imgObj.width;
      let height = imgObj.height;

      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgObj, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.82));
    };
    imgObj.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

export default function AdminMenuView({
  products = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) {
  const formCardRef = useRef(null);
  const fileInputRef = useRef(null);
  const quickRowFileRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [quickPhotoTarget, setQuickPhotoTarget] = useState(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [size8oz, setSize8oz] = useState('');
  const [size16oz, setSize16oz] = useState('');
  const [size22oz, setSize22oz] = useState('');

  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const startEdit = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category || 'Food');
    setPrice(String(product.price || ''));
    setImage(product.image || '');
    const sizesObj = product.sizes && typeof product.sizes === 'object' ? product.sizes : {};
    setSize8oz(sizesObj['8oz'] ? String(sizesObj['8oz']) : '');
    setSize16oz(sizesObj['16oz'] ? String(sizesObj['16oz']) : '');
    setSize22oz(sizesObj['22oz'] ? String(sizesObj['22oz']) : '');

    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('Food');
    setPrice('');
    setImage('');
    setSize8oz('');
    setSize16oz('');
    setSize22oz('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload photo inside the Add/Edit form
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFile(file, (compressedDataUrl) => {
      setImage(compressedDataUrl);
    });
  };

  // 1-Tap Quick Photo Upload directly from any row in the Menu List
  const triggerQuickRowPhoto = (product) => {
    setQuickPhotoTarget(product);
    quickRowFileRef.current?.click();
  };

  const handleQuickRowFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !quickPhotoTarget) return;

    compressImageFile(file, async (compressedDataUrl) => {
      await onUpdateProduct(quickPhotoTarget.id, {
        name: quickPhotoTarget.name,
        category: quickPhotoTarget.category,
        price: quickPhotoTarget.price,
        sizes: quickPhotoTarget.sizes || null,
        image: compressedDataUrl
      });
      if (editingId === quickPhotoTarget.id) setImage(compressedDataUrl);
      setQuickPhotoTarget(null);
      if (quickRowFileRef.current) quickRowFileRef.current.value = '';
    });
  };

  const handleQuickDeleteImage = async (product) => {
    if (!window.confirm(`Remove photo from "${product.name}"?`)) return;
    await onUpdateProduct(product.id, {
      name: product.name,
      category: product.category,
      price: product.price,
      sizes: product.sizes || null,
      image: 'none'
    });
    if (editingId === product.id) setImage('none');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    let sizesPayload = null;
    if (category === 'Drinks') {
      const builtSizes = {};
      if (size8oz) builtSizes['8oz'] = parseFloat(size8oz);
      if (size16oz) builtSizes['16oz'] = parseFloat(size16oz);
      if (size22oz) builtSizes['22oz'] = parseFloat(size22oz);
      if (Object.keys(builtSizes).length > 0) sizesPayload = builtSizes;
    }

    const payload = {
      name: name.trim(),
      category,
      price: parseFloat(price),
      sizes: sizesPayload,
      image: image.trim() || null
    };

    if (editingId) {
      await onUpdateProduct(editingId, payload);
    } else {
      await onAddProduct(payload);
    }
    resetForm();
  };

  const previewThumb = resolveProductImage({ name, category, image });
  const foodCount = products.filter(p => p.category === 'Food').length;
  const drinkCount = products.filter(p => p.category === 'Drinks').length;

  const filteredProducts = products.filter(p => {
    const matchesCat = filterCategory === 'All' || p.category === filterCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="admin-page-container">
      {/* Hidden input for 1-tap photo changes directly from the Menu List */}
      <input
        ref={quickRowFileRef}
        type="file"
        accept="image/*"
        onChange={handleQuickRowFileChange}
        style={{ display: 'none' }}
      />

      <div className="admin-header-bar">
        <h2>Menu Manager</h2>
        {editingId && (
          <button type="button" className="btn-secondary-sm" onClick={resetForm}>
            + New Item Mode
          </button>
        )}
      </div>

      <div className="admin-two-col">
        {/* LEFT: ADD / EDIT FORM */}
        <div ref={formCardRef} className="admin-card report-sheet">
          <div className="report-sheet-header">
            <h3>{editingId ? `Editing: ${name}` : 'Add Menu Item'}</h3>
            {editingId && (
              <button type="button" className="btn-secondary-sm" onClick={resetForm}>
                ✕ Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <label>Category</label>
            <div className="menu-category-toggle">
              <button
                type="button"
                className={`tier-select-card ${category === 'Food' ? 'active' : ''}`}
                onClick={() => setCategory('Food')}
              >
                <div className="tier-card-top">
                  <strong>🍱 Food</strong>
                  <span className="tier-radio">{category === 'Food' ? '●' : '○'}</span>
                </div>
              </button>
              <button
                type="button"
                className={`tier-select-card ${category === 'Drinks' ? 'active' : ''}`}
                onClick={() => setCategory('Drinks')}
              >
                <div className="tier-card-top">
                  <strong>🥤 Drinks</strong>
                  <span className="tier-radio">{category === 'Drinks' ? '●' : '○'}</span>
                </div>
              </button>
            </div>

            <div className="form-split-row">
              <div>
                <label>Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rice Bowl - Signature"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Base Price (₱)</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="0.00"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            {category === 'Drinks' && (
              <div className="drink-sizes-box">
                <div className="ledger-section-title">
                  <span>Cup Sizes (Optional)</span>
                </div>
                <div className="size-inputs-grid">
                  <div>
                    <label>8oz</label>
                    <input type="number" step="any" placeholder="₱" value={size8oz} onChange={e => setSize8oz(e.target.value)} />
                  </div>
                  <div>
                    <label>16oz</label>
                    <input type="number" step="any" placeholder="₱" value={size16oz} onChange={e => setSize16oz(e.target.value)} />
                  </div>
                  <div>
                    <label>22oz</label>
                    <input type="number" step="any" placeholder="₱" value={size22oz} onChange={e => setSize22oz(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <label>Photo</label>
            <div className="image-manager-box">
              <div
                className="image-preview-frame clickable-thumb"
                onClick={() => fileInputRef.current?.click()}
                title="Tap to upload photo"
              >
                {previewThumb ? (
                  <img src={previewThumb} alt="Preview" />
                ) : (
                  <span>{category === 'Drinks' ? '🥤' : '🍱'}</span>
                )}
              </div>

              <div className="image-manager-controls">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                <div className="image-btn-row">
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📷 {previewThumb ? 'Change' : 'Upload'}
                  </button>

                  {previewThumb && (
                    <button
                      type="button"
                      className="btn-danger-sm"
                      onClick={() => setImage('none')}
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>

                <div className="preset-chips-row">
                  {IMAGE_PRESETS.map(preset => (
                    <button
                      type="button"
                      key={preset.label}
                      className={`preset-chip ${image === preset.value ? 'active' : ''}`}
                      onClick={() => setImage(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-btn-row" style={{ marginTop: '6px' }}>
              <button type="submit" className="btn-primary-amber" style={{ flex: 1 }}>
                {editingId ? '✓ Save Changes' : '+ Add to Menu'}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: EASY-TO-NAVIGATE MENU LIST */}
        <div className="admin-card report-sheet">
          <div className="menu-nav-top">
            {/* 1-Tap Category Filter Tabs */}
            <div className="menu-filter-pills">
              <button
                type="button"
                className={`menu-tab-pill ${filterCategory === 'All' ? 'active' : ''}`}
                onClick={() => setFilterCategory('All')}
              >
                All <span>{products.length}</span>
              </button>
              <button
                type="button"
                className={`menu-tab-pill ${filterCategory === 'Food' ? 'active' : ''}`}
                onClick={() => setFilterCategory('Food')}
              >
                🍱 Food <span>{foodCount}</span>
              </button>
              <button
                type="button"
                className={`menu-tab-pill ${filterCategory === 'Drinks' ? 'active' : ''}`}
                onClick={() => setFilterCategory('Drinks')}
              >
                🥤 Drinks <span>{drinkCount}</span>
              </button>
            </div>

            {/* Instant Search Bar with Clear Button */}
            <div className="menu-search-box">
              <input
                type="text"
                placeholder="🔍 Search item..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Card List (No Horizontal Scrolling Needed) */}
          <div className="menu-cards-scroll">
            {filteredProducts.length === 0 ? (
              <div className="ledger-empty">No matching menu items.</div>
            ) : (
              filteredProducts.map(p => {
                const thumb = resolveProductImage(p);
                const hasSizes = p.sizes && typeof p.sizes === 'object' && Object.keys(p.sizes).length > 0;
                const isEditing = editingId === p.id;

                return (
                  <div
                    key={p.id || p.name}
                    className={`menu-list-card ${isEditing ? 'active-edit' : ''}`}
                  >
                    {/* Left: Tap Photo to Change Immediately */}
                    <div
                      className="menu-card-thumb"
                      onClick={() => triggerQuickRowPhoto(p)}
                      title="Tap to change photo"
                    >
                      {thumb ? (
                        <img src={thumb} alt={p.name} />
                      ) : (
                        <span>{p.category === 'Drinks' ? '🥤' : '🍱'}</span>
                      )}
                      <small className="thumb-cam-badge">📷</small>
                    </div>

                    {/* Middle: Name, Category & Price / Cup Sizes */}
                    <div className="menu-card-info" onClick={() => startEdit(p)}>
                      <div className="menu-card-title-row">
                        <strong>{p.name}</strong>
                        <span className="menu-cat-tag">{p.category}</span>
                      </div>

                      {hasSizes ? (
                        <div className="size-pills-wrap">
                          {Object.entries(p.sizes).map(([sz, pr]) => (
                            <span key={sz} className="item-pill">
                              {sz}: <strong>₱{pr}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="menu-single-price">
                          ₱{Number(p.price || 0).toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Right: Direct Action Buttons */}
                    <div className="menu-card-actions">
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        onClick={() => startEdit(p)}
                      >
                        ✏️ Edit
                      </button>

                      {thumb && (
                        <button
                          type="button"
                          className="btn-secondary-sm"
                          onClick={() => handleQuickDeleteImage(p)}
                          title="Remove photo"
                        >
                          🚫📷
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-danger-sm"
                        onClick={() => window.confirm(`Delete "${p.name}"?`) && onDeleteProduct(p.id)}
                        title="Delete item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}