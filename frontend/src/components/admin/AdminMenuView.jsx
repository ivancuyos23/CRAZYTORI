import React, { useState } from 'react';
import './AdminViews.css';
import './AdminMenuView.css';

import riceBowlImg from '../../assets/images/ricebowl.jfif';
import snackBoxImg from '../../assets/images/snackbox.jfif';
import spamMusubiImg from '../../assets/images/spamusubi.jpg';

const IMAGE_PRESETS = [
  { label: 'Auto / Default', value: '' },
  { label: 'Rice Bowl / Katsudon', value: '/images/ricebowl.jfif' },
  { label: 'Snack Box', value: '/images/snackbox.jfif' },
  { label: 'Spamusubi', value: '/images/spamusubi.jpg' }
];

export default function AdminMenuView({
  products = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) {
  // Form States
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [size8oz, setSize8oz] = useState('');
  const [size16oz, setSize16oz] = useState('');
  const [size22oz, setSize22oz] = useState('');

  // Table Filter States
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolve thumbnail for table preview
  const getProductThumb = (product) => {
    const pName = (product.name || '').toLowerCase();
    const pImg = (product.image || '').toLowerCase();
    if (pImg.includes('ricebowl') || pName.includes('rice bowl') || pName.includes('katsudon')) return riceBowlImg;
    if (pImg.includes('snackbox') || pName.includes('snack box')) return snackBoxImg;
    if (pImg.includes('spamusubi') || pName.includes('spamusubi')) return spamMusubiImg;
    return null;
  };

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    // Build sizes object if Drinks has cup sizes entered
    let sizesPayload = null;
    if (category === 'Drinks') {
      const builtSizes = {};
      if (size8oz) builtSizes['8oz'] = parseFloat(size8oz);
      if (size16oz) builtSizes['16oz'] = parseFloat(size16oz);
      if (size22oz) builtSizes['22oz'] = parseFloat(size22oz);
      if (Object.keys(builtSizes).length > 0) {
        sizesPayload = builtSizes;
      }
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

  // KPI Counts
  const foodItems = products.filter(p => p.category === 'Food');
  const drinkItems = products.filter(p => p.category === 'Drinks');

  // Filtered Table Items
  const filteredProducts = products.filter(p => {
    const matchesCat = filterCategory === 'All' || p.category === filterCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="admin-page-container">
      {/* Top Header */}
      <div className="admin-header-bar">
        <div>
          <h2>POS Menu & Catalog Manager</h2>
          <p className="admin-subtitle">
            Add new dishes, configure drink cup sizes (8oz / 16oz / 22oz), and update store pricing
          </p>
        </div>
        {editingId && (
          <button className="btn-secondary-sm" onClick={resetForm}>
            ✕ Cancel Editing
          </button>
        )}
      </div>

      {/* 3-Card Catalog KPI Summary */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span>Total Active Catalog</span>
          <h3>{products.length} Items</h3>
          <small className="kpi-sub">Synced with Cashier POS Register</small>
        </div>
        <div className="admin-kpi-card">
          <span>Food Menu (Bowls & Snacks)</span>
          <h3>{foodItems.length} Dishes</h3>
          <small className="kpi-sub">Rice bowls, snack boxes & sides</small>
        </div>
        <div className="admin-kpi-card">
          <span>Drinks & Beverages</span>
          <h3>{drinkItems.length} Drinks</h3>
          <small className="kpi-sub">Single & multi-size cup options</small>
        </div>
      </div>

      <div className="admin-two-col">
        {/* LEFT COLUMN: Add / Edit Product Form */}
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">{editingId ? 'UPDATING ITEM' : 'NEW CATALOG ENTRY'}</span>
              <h3>{editingId ? `Edit: ${name}` : 'Add Menu Item'}</h3>
            </div>
            <span className="ledger-badge">{category}</span>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <label>1. Select Menu Category</label>
            <div className="menu-category-toggle">
              <button
                type="button"
                className={`tier-select-card ${category === 'Food' ? 'active' : ''}`}
                onClick={() => setCategory('Food')}
              >
                <div className="tier-card-top">
                  <strong>🍱 Food Menu</strong>
                  <span className="tier-radio">{category === 'Food' ? '●' : '○'}</span>
                </div>
                <small>Rice bowls, snack boxes, sides</small>
              </button>

              <button
                type="button"
                className={`tier-select-card ${category === 'Drinks' ? 'active' : ''}`}
                onClick={() => setCategory('Drinks')}
              >
                <div className="tier-card-top">
                  <strong>🥤 Drinks Menu</strong>
                  <span className="tier-radio">{category === 'Drinks' ? '●' : '○'}</span>
                </div>
                <small>Lemonades, coffee, milk teas</small>
              </button>
            </div>

            <div className="form-split-row">
              <div>
                <label>2. Item Name</label>
                <input
                  type="text"
                  placeholder="e.g., Rice Bowl - Teriyaki"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>3. Base Price (₱)</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="e.g., 170"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Multi-Size Pricing Inputs for Drinks */}
            {category === 'Drinks' && (
              <div className="drink-sizes-box">
                <div className="ledger-section-title">
                  <span>Optional Cup Size Prices (₱)</span>
                  <small className="muted-by">Leave blank if single size</small>
                </div>
                <div className="size-inputs-grid">
                  <div>
                    <label>8oz Price</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="₱ --"
                      value={size8oz}
                      onChange={e => setSize8oz(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>16oz Price</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="₱ --"
                      value={size16oz}
                      onChange={e => setSize16oz(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>22oz Price</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="₱ --"
                      value={size22oz}
                      onChange={e => setSize22oz(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <label style={{ marginTop: '4px' }}>4. Thumbnail Image Preset</label>
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

            <div className="form-btn-row" style={{ marginTop: '8px' }}>
              {editingId && (
                <button type="button" className="btn-secondary-sm" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary-amber" style={{ flex: 1, marginTop: 0 }}>
                {editingId ? 'Save Menu Changes' : '+ Add Item to POS Menu'}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Active Catalog Ledger Table */}
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">LIVE POS CATALOG</span>
              <h3>Menu Items ({filteredProducts.length})</h3>
            </div>

            <div className="audit-controls-row">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="audit-filter-select"
              >
                <option value="All">All Categories</option>
                <option value="Food">🍱 Food Only</option>
                <option value="Drinks">🥤 Drinks Only</option>
              </select>

              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="audit-search-input"
              />
            </div>
          </div>

          <div className="audit-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Menu Item</th>
                  <th>Category</th>
                  <th>Pricing / Sizes</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-row">
                      No menu items match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const thumb = getProductThumb(p);
                    const hasSizes = p.sizes && typeof p.sizes === 'object' && Object.keys(p.sizes).length > 0;
                    return (
                      <tr key={p.id || p.name} className={editingId === p.id ? 'editing-row-highlight' : ''}>
                        <td>
                          <div className="menu-table-item">
                            <div className="menu-table-thumb">
                              {thumb ? (
                                <img src={thumb} alt={p.name} />
                              ) : (
                                <span>{p.category === 'Drinks' ? '🥤' : '🍱'}</span>
                              )}
                            </div>
                            <strong>{p.name}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="method-badge">{p.category}</span>
                        </td>
                        <td>
                          {hasSizes ? (
                            <div className="size-pills-wrap">
                              {Object.entries(p.sizes).map(([sz, pr]) => (
                                <span key={sz} className="item-pill">
                                  {sz}: <strong>₱{pr}</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <strong>₱{Number(p.price || 0).toFixed(2)}</strong>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn-secondary-sm" onClick={() => startEdit(p)}>
                              Edit
                            </button>
                            <button
                              className="btn-danger-sm"
                              onClick={() => {
                                if (window.confirm(`Remove "${p.name}" from the menu?`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ledger-total-box">
            <div>
              <span className="ledger-total-label">ACTIVE CATALOG SUMMARY</span>
              <small>Showing {filteredProducts.length} of {products.length} total items</small>
            </div>
            <div className="ledger-badge">
              {foodItems.length} Food • {drinkItems.length} Drinks
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}