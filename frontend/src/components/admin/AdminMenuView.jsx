import React, { useState, useRef } from 'react';
import * as api from '../../services/api';
import { PaginationBar, showToast } from '../layout/UIFeedback';
import AdminMenuForm, {
  IMAGE_PRESETS,
  DEFAULT_SNACKBOX_FLAVORS,
  resolveProductImage,
  compressImageFile
} from './AdminMenuForm';
import './AdminViews.css';
import './AdminMenuView.css';

export { IMAGE_PRESETS, DEFAULT_SNACKBOX_FLAVORS, resolveProductImage };

const MENU_ITEMS_PER_PAGE = 8;

export default function AdminMenuView({
  products = [],
  onRefreshProducts,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food');
  const [price, setPrice] = useState('');
  const [size8oz, setSize8oz] = useState('');
  const [size16oz, setSize16oz] = useState('');
  const [size22oz, setSize22oz] = useState('');
  const [imageValue, setImageValue] = useState('');
  const [hasSpice, setHasSpice] = useState(false);
  const [flavorsText, setFlavorsText] = useState('');

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [quickPhotoTarget, setQuickPhotoTarget] = useState(null);

  const quickFileInputRef = useRef(null);
  const formCardRef = useRef(null);

  const saveNewProduct = onAddProduct || api.createProductAPI || api.addProductAPI;
  const saveUpdatedProduct = onUpdateProduct || api.updateProductAPI;
  const removeProduct = onDeleteProduct || api.deleteProductAPI;

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('Food');
    setPrice('');
    setSize8oz('');
    setSize16oz('');
    setSize22oz('');
    setImageValue('');
    setHasSpice(false);
    setFlavorsText('');
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setName(product.name || '');
    setCategory(product.category || 'Food');
    setPrice(String(product.price ?? ''));

    const sizes = product.sizes || {};
    setSize8oz(sizes['8oz'] ? String(sizes['8oz']) : '');
    setSize16oz(sizes['16oz'] ? String(sizes['16oz']) : '');
    setSize22oz(sizes['22oz'] ? String(sizes['22oz']) : '');
    setImageValue(product.image || '');

    const lower = (product.name || '').toLowerCase();
    const isRB = lower.includes('rice bowl');
    const isSB = lower.includes('snack box');
    setHasSpice(
      product.hasSpice !== undefined ? Boolean(product.hasSpice) : isRB || isSB
    );

    const existingFlavors = Array.isArray(product.flavors)
      ? product.flavors
      : isSB
      ? DEFAULT_SNACKBOX_FLAVORS
      : [];
    setFlavorsText(existingFlavors.join(', '));

    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleQuickRowPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !quickPhotoTarget) return;
    try {
      const dataUrl = await compressImageFile(file);
      await saveUpdatedProduct(quickPhotoTarget.id, {
        ...quickPhotoTarget,
        image: dataUrl
      });
      if (onRefreshProducts) await onRefreshProducts();
      showToast(`Updated photo for "${quickPhotoTarget.name}"!`, 'success');
    } catch {
      showToast('Failed to update product photo.', 'error');
    }
    setQuickPhotoTarget(null);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return showToast('Please enter an item name.', 'error');

    let sizesObj = null;
    if (category === 'Drinks') {
      const temp = {};
      if (size8oz !== '' && !isNaN(Number(size8oz))) temp['8oz'] = Number(size8oz);
      if (size16oz !== '' && !isNaN(Number(size16oz))) temp['16oz'] = Number(size16oz);
      if (size22oz !== '' && !isNaN(Number(size22oz))) temp['22oz'] = Number(size22oz);
      if (Object.keys(temp).length > 0) sizesObj = temp;
    }

    const computedBasePrice =
      price !== '' && !isNaN(Number(price))
        ? Number(price)
        : sizesObj
        ? Object.values(sizesObj)[0]
        : 0;

    const parsedFlavors =
      category === 'Food'
        ? flavorsText
            .split(',')
            .map(f => f.trim())
            .filter(Boolean)
        : [];

    const payload = {
      name: name.trim(),
      category,
      price: computedBasePrice,
      sizes: sizesObj,
      image: imageValue || null,
      hasSpice: category === 'Food' ? Boolean(hasSpice) : false,
      flavors: parsedFlavors.length > 0 ? parsedFlavors : null
    };

    try {
      if (editingId) {
        await saveUpdatedProduct(editingId, payload);
        showToast(`Updated "${payload.name}"!`, 'success');
      } else {
        await saveNewProduct(payload);
        showToast(`Added "${payload.name}" to Menu!`, 'success');
      }
      resetForm();
      if (onRefreshProducts) await onRefreshProducts();
    } catch (err) {
      showToast('Failed to save menu item: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id, itemName) => {
    if (!window.confirm(`Delete "${itemName}" from the menu?`)) return;
    await removeProduct(id);
    if (editingId === id) resetForm();
    if (onRefreshProducts) await onRefreshProducts();
    showToast(`Deleted "${itemName}" from menu.`, 'info');
  };

  const foodCount = products.filter(p => p.category === 'Food').length;
  const drinkCount = products.filter(p => p.category === 'Drinks').length;

  const filteredProducts = products.filter(p => {
    const matchesCat =
      filterCategory === 'ALL' ||
      (p.category || '').toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch = (p.name || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / MENU_ITEMS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedProducts = filteredProducts.slice(
    (safePage - 1) * MENU_ITEMS_PER_PAGE,
    safePage * MENU_ITEMS_PER_PAGE
  );

  return (
    <div className="admin-page-container">
      <input
        ref={quickFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleQuickRowPhotoUpload}
      />

      <div className="admin-header-bar">
        <div>
          <h2>Menu Manager</h2>
          <p className="admin-subtitle">
            Add, edit, or customize prices, drink sizes, spice choices, and Snack Box flavors
          </p>
        </div>
        <span className="ledger-badge">
          {products.length} Total ({foodCount} Food • {drinkCount} Drinks)
        </span>
      </div>

      <div className="admin-two-col">
        <AdminMenuForm
          formCardRef={formCardRef}
          editingId={editingId}
          name={name}
          setName={setName}
          category={category}
          setCategory={setCategory}
          price={price}
          setPrice={setPrice}
          size8oz={size8oz}
          setSize8oz={setSize8oz}
          size16oz={size16oz}
          setSize16oz={setSize16oz}
          size22oz={size22oz}
          setSize22oz={setSize22oz}
          imageValue={imageValue}
          setImageValue={setImageValue}
          hasSpice={hasSpice}
          setHasSpice={setHasSpice}
          flavorsText={flavorsText}
          setFlavorsText={setFlavorsText}
          onSubmit={handleSubmit}
          onReset={resetForm}
        />

        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">ACTIVE CATALOG</span>
              <h3>Menu Items ({filteredProducts.length})</h3>
            </div>
            <span className="ledger-badge">
              Page {safePage} of {totalPages}
            </span>
          </div>

          <div className="tx-filter-bar">
            <div className="tx-payment-pills">
              {[
                { key: 'ALL', label: `All (${products.length})` },
                { key: 'Food', label: `🍱 Food (${foodCount})` },
                { key: 'Drinks', label: `🥤 Drinks (${drinkCount})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  className={
                    filterCategory === tab.key ? 'tx-tab-pill active' : 'tx-tab-pill'
                  }
                  onClick={() => {
                    setFilterCategory(tab.key);
                    setCurrentPage(1);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="tx-search-box">
              <input
                type="text"
                placeholder="🔍 Search menu item..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="tx-ledger-list">
            {pagedProducts.map(item => {
              const thumb = resolveProductImage(item);
              const lower = (item.name || '').toLowerCase();
              const itemHasSpice =
                item.hasSpice !== undefined
                  ? Boolean(item.hasSpice)
                  : lower.includes('rice bowl') || lower.includes('snack box');
              const itemFlavors = Array.isArray(item.flavors)
                ? item.flavors
                : lower.includes('snack box')
                ? DEFAULT_SNACKBOX_FLAVORS
                : [];

              return (
                <div key={item.id} className="tx-order-card">
                  <div className="tx-card-top">
                    <div className="tx-id-group">
                      <div
                        className="image-preview-frame"
                        style={{ width: '44px', height: '44px', cursor: 'pointer' }}
                        title="Tap to change photo"
                        onClick={() => {
                          setQuickPhotoTarget(item);
                          quickFileInputRef.current?.click();
                        }}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span>{item.category === 'Drinks' ? '🥤' : '🍱'}</span>
                        )}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.92rem' }}>{item.name}</strong>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {item.sizes &&
                            Object.entries(item.sizes).map(([sz, pr]) => (
                              <span key={sz} className="method-badge">
                                {sz}: ₱{pr}
                              </span>
                            ))}
                          {itemHasSpice && (
                            <span className="method-badge">🌶️ Original / Spicy</span>
                          )}
                          {itemFlavors.length > 0 && (
                            <span className="method-badge">
                              🧀 {itemFlavors.length} Flavors
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="tx-actions-group" style={{ alignItems: 'center' }}>
                      <span className="tx-serving-badge">₱{item.price}</span>
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        onClick={() => startEdit(item)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger-sm"
                        onClick={() => handleDelete(item.id, item.name)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <PaginationBar
            currentPage={safePage}
            totalItems={filteredProducts.length}
            pageSize={MENU_ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}