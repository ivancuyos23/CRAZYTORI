import React, { useState } from 'react';
import { resolveProductImage } from '../admin/AdminMenuView';
import './POSCatalog.css';

const DEFAULT_SNACKBOX_FLAVORS = [
  'BBQ',
  'Sour Cream',
  'Rancho Cheddar',
  'Cheese',
  'Honey Butter',
  'Sriracha',
  'Garlic Parmesan'
];

export default function POSCatalog({
  products,
  category,
  setCategory,
  searchQuery,
  setSearchQuery,
  addToCart
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [chosenSize, setChosenSize] = useState(null);
  const [chosenSpice, setChosenSpice] = useState('Original');
  const [chosenFlavor, setChosenFlavor] = useState('');

  const filteredProducts = products.filter(
    p =>
      p.category.toLowerCase() === category.toLowerCase() &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine which options apply to a product
  const getProductOptions = (product) => {
    const lower = (product.name || '').toLowerCase();
    const isRiceBowl = lower.includes('rice bowl');
    const isSnackBox = lower.includes('snack box');

    const hasSizes = product.sizes && Object.keys(product.sizes).length > 0;
    const hasSpice = product.hasSpice !== undefined ? Boolean(product.hasSpice) : (isRiceBowl || isSnackBox);
    const flavors = Array.isArray(product.flavors) && product.flavors.length > 0
      ? product.flavors
      : (isSnackBox ? DEFAULT_SNACKBOX_FLAVORS : []);

    return { hasSizes, hasSpice, flavors };
  };

  const handleCardClick = (product) => {
    const { hasSizes, hasSpice, flavors } = getProductOptions(product);

    if (hasSizes || hasSpice || flavors.length > 0) {
      setSelectedProduct(product);
      setChosenSize(hasSizes ? Object.keys(product.sizes)[0] : null);
      setChosenSpice('Original');
      setChosenFlavor(flavors.length > 0 ? flavors[0] : '');
    } else {
      addToCart(product, null, product.price);
    }
  };

  const confirmOptionModal = () => {
    if (!selectedProduct) return;
    const { hasSizes, hasSpice, flavors } = getProductOptions(selectedProduct);

    const finalPrice = hasSizes && chosenSize
      ? selectedProduct.sizes[chosenSize]
      : selectedProduct.price;

    // Build variant tag for spice and flavor
    const variantTags = [];
    if (hasSpice && chosenSpice) variantTags.push(chosenSpice);
    if (flavors.length > 0 && chosenFlavor) variantTags.push(chosenFlavor);

    const variantLabel = variantTags.length > 0 ? ` (${variantTags.join(' • ')})` : '';
    const customizedProduct = {
      ...selectedProduct,
      name: `${selectedProduct.name}${variantLabel}`
    };

    addToCart(customizedProduct, chosenSize, finalPrice);
    setSelectedProduct(null);
  };

  const activeOpts = selectedProduct ? getProductOptions(selectedProduct) : null;

  return (
    <div className="catalog-section">
      <div className="search-filter-row">
        <input
          type="text"
          placeholder="🔍 Search menu items..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <div className="category-pills">
          <button
            className={category === 'Food' ? 'pill active' : 'pill'}
            onClick={() => setCategory('Food')}
          >
            Food
          </button>
          <button
            className={category === 'Drinks' ? 'pill active' : 'pill'}
            onClick={() => setCategory('Drinks')}
          >
            Drinks
          </button>
        </div>
      </div>

      <div className="product-grid">
        {filteredProducts.map((p, idx) => {
          const itemImg = resolveProductImage(p);
          return (
            <div key={p.id || idx} className="menu-card" onClick={() => handleCardClick(p)}>
              <div className="item-img-container">
                {itemImg ? (
                  <img src={itemImg} alt={p.name} className="menu-item-img" />
                ) : (
                  <span className="item-img-placeholder">
                    {p.category === 'Drinks' ? '🥤' : '🍱'}
                  </span>
                )}
              </div>
              <h4>{p.name}</h4>
              <p>₱{p.price}{p.sizes ? '+' : ''}</p>
            </div>
          );
        })}
      </div>

      {/* Unified Size, Spice & Flavor Selection Modal */}
      {selectedProduct && activeOpts && (
        <div className="modal-backdrop">
          <div className="modal-card option-modal-card">
            <h3>{selectedProduct.name}</h3>

            {/* 1. Drink Cup Size Selector (Clear High-Contrast Text) */}
            {activeOpts.hasSizes && (
              <div className="option-group">
                <label className="option-group-label">Select Cup Size (oz)</label>
                <div className="oz-options-grid">
                  {Object.entries(selectedProduct.sizes).map(([size, price]) => (
                    <button
                      type="button"
                      key={size}
                      className={chosenSize === size ? 'oz-choice-btn active' : 'oz-choice-btn'}
                      onClick={() => setChosenSize(size)}
                    >
                      <span className="oz-title">{size}</span>
                      <span className="oz-price">₱{price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Original vs Spicy Selector (Rice Bowl & Snack Box) */}
            {activeOpts.hasSpice && (
              <div className="option-group">
                <label className="option-group-label">Spice Level</label>
                <div className="spice-options-grid">
                  {['Original', 'Spicy'].map(level => (
                    <button
                      type="button"
                      key={level}
                      className={
                        chosenSpice === level
                          ? `spice-choice-btn active ${level === 'Spicy' ? 'spicy-mode' : ''}`
                          : 'spice-choice-btn'
                      }
                      onClick={() => setChosenSpice(level)}
                    >
                      {level === 'Spicy' ? '🌶️ Spicy' : '🍗 Original'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Snack Box Flavor Selector */}
            {activeOpts.flavors.length > 0 && (
              <div className="option-group">
                <label className="option-group-label">Select Flavor</label>
                <div className="flavor-options-grid">
                  {activeOpts.flavors.map(flv => (
                    <button
                      type="button"
                      key={flv}
                      className={chosenFlavor === flv ? 'flavor-choice-btn active' : 'flavor-choice-btn'}
                      onClick={() => setChosenFlavor(flv)}
                    >
                      {flv}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-buttons">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmOptionModal}
                className="submit-btn"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}