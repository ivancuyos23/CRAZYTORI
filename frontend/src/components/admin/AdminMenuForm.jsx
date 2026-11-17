import React, { useRef } from 'react';
import './AdminViews.css';
import './AdminMenuView.css';

import riceBowlImg from '../../assets/images/ricebowl.jfif';
import snackBoxImg from '../../assets/images/snackbox.jfif';
import spamMusubiImg from '../../assets/images/spamusubi.jpg';

export const IMAGE_PRESETS = [
  { key: 'none', label: 'No Photo', src: null },
  { key: 'ricebowl', label: 'Rice Bowl', src: riceBowlImg },
  { key: 'snackbox', label: 'Snack Box', src: snackBoxImg },
  { key: 'spamusubi', label: 'Spamusubi', src: spamMusubiImg }
];

export const DEFAULT_SNACKBOX_FLAVORS = [
  'BBQ',
  'Sour Cream',
  'Rancho Cheddar',
  'Cheese',
  'Honey Butter',
  'Sriracha',
  'Garlic Parmesan'
];

export function resolveProductImage(product) {
  if (!product) return null;
  const img = product.image;
  if (img === 'none') return null;
  if (img && (img.startsWith('data:image') || img.startsWith('http') || img.startsWith('/'))) {
    if (img.includes('ricebowl')) return riceBowlImg;
    if (img.includes('snackbox')) return snackBoxImg;
    if (img.includes('spamusubi')) return spamMusubiImg;
    return img;
  }
  if (img === 'ricebowl') return riceBowlImg;
  if (img === 'snackbox') return snackBoxImg;
  if (img === 'spamusubi') return spamMusubiImg;

  const lower = (product.name || '').toLowerCase();
  if (lower.includes('rice bowl') || lower.includes('katsudon')) return riceBowlImg;
  if (lower.includes('snack box')) return snackBoxImg;
  if (lower.includes('spamusubi')) return spamMusubiImg;
  return null;
}

export const compressImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 420;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function AdminMenuForm({
  formCardRef,
  editingId,
  name,
  setName,
  category,
  setCategory,
  price,
  setPrice,
  size8oz,
  setSize8oz,
  size16oz,
  setSize16oz,
  size22oz,
  setSize22oz,
  imageValue,
  setImageValue,
  hasSpice,
  setHasSpice,
  flavorsText,
  setFlavorsText,
  onSubmit,
  onReset
}) {
  const fileInputRef = useRef(null);
  const previewImg = resolveProductImage({ name, category, image: imageValue });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setImageValue(dataUrl);
    } catch {
      alert('Could not process image file.');
    }
    e.target.value = '';
  };

  return (
    <div className="admin-card report-sheet" ref={formCardRef}>
      <div className="report-sheet-header">
        <div>
          <span className="report-tag">
            {editingId ? 'EDITING PRODUCT' : 'NEW PRODUCT'}
          </span>
          <h3>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
        </div>
        {editingId && (
          <button type="button" className="btn-secondary-sm" onClick={onReset}>
            ✕ Cancel
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="admin-form menu-add-form">
        {/* 1. Category Selector */}
        <div className="menu-form-section">
          <label>Category</label>
          <div className="menu-category-toggle">
            <button
              type="button"
              className={category === 'Food' ? 'tier-select-card active' : 'tier-select-card'}
              onClick={() => setCategory('Food')}
            >
              <div className="tier-card-top">
                <strong>🍱 Food</strong>
                <span className="tier-radio">{category === 'Food' ? '●' : '○'}</span>
              </div>
            </button>

            <button
              type="button"
              className={category === 'Drinks' ? 'tier-select-card active' : 'tier-select-card'}
              onClick={() => setCategory('Drinks')}
            >
              <div className="tier-card-top">
                <strong>🥤 Drinks</strong>
                <span className="tier-radio">{category === 'Drinks' ? '●' : '○'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Item Name & Base Price */}
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
              min="0"
              placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required={category === 'Food'}
            />
          </div>
        </div>

        {/* 3A. Food Options: Original/Spicy + Snack Box Flavors */}
        {category === 'Food' && (
          <div className="drink-sizes-box">
            <label className="spice-check-row">
              <input
                type="checkbox"
                className="spice-check-input"
                checked={hasSpice}
                onChange={e => setHasSpice(e.target.checked)}
              />
              <div className="spice-check-text">
                <strong>🌶️ Enable Original / Spicy Choice</strong>
                <small>Asks cashier to choose Original or Spicy when ordered</small>
              </div>
            </label>

            <div className="flavor-field-wrap">
              <div className="flavor-label-row">
                <label style={{ margin: 0 }}>Snack Box Flavors (Optional)</label>
                <button
                  type="button"
                  className="flavor-fill-btn"
                  onClick={() => setFlavorsText(DEFAULT_SNACKBOX_FLAVORS.join(', '))}
                >
                  + Fill All 7 Flavors
                </button>
              </div>
              <input
                type="text"
                placeholder="BBQ, Sour Cream, Rancho Cheddar, Cheese..."
                value={flavorsText}
                onChange={e => setFlavorsText(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 3B. Drink Cup Size Prices */}
        {category === 'Drinks' && (
          <div className="drink-sizes-box">
            <label>Cup Size Prices (Optional)</label>
            <div className="size-inputs-grid">
              <div>
                <small>8oz (₱)</small>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="—"
                  value={size8oz}
                  onChange={e => setSize8oz(e.target.value)}
                />
              </div>
              <div>
                <small>16oz (₱)</small>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="—"
                  value={size16oz}
                  onChange={e => setSize16oz(e.target.value)}
                />
              </div>
              <div>
                <small>22oz (₱)</small>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="—"
                  value={size22oz}
                  onChange={e => setSize22oz(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Product Photo & Presets */}
        <div className="menu-form-section">
          <label>Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />

          <div className="image-manager-box">
            <div className="image-preview-frame">
              {previewImg ? (
                <img src={previewImg} alt="Preview" />
              ) : (
                <span>{category === 'Drinks' ? '🥤' : '🍱'}</span>
              )}
            </div>

            <div className="image-manager-controls">
              <div className="image-btn-row">
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📷 Upload
                </button>
                {imageValue && imageValue !== 'none' && (
                  <button
                    type="button"
                    className="btn-danger-sm"
                    onClick={() => setImageValue('none')}
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>

              <div className="preset-chips-row">
                {IMAGE_PRESETS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    className={imageValue === p.key ? 'preset-chip active' : 'preset-chip'}
                    onClick={() => setImageValue(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Submit / Cancel Buttons */}
        <div className="form-btn-row" style={{ marginTop: '4px' }}>
          {editingId && (
            <button type="button" className="btn-secondary-sm" onClick={onReset}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-primary-amber"
            style={{ flex: 1, padding: '11px' }}
          >
            {editingId ? '✓ Save Changes' : '+ Add Menu Item'}
          </button>
        </div>
      </form>
    </div>
  );
}