import React, { useState } from 'react';
import { resolveProductImage } from '../admin/AdminMenuView';
import './POSCatalog.css';

export default function POSCatalog({
  products = [],
  category,
  setCategory,
  searchQuery,
  setSearchQuery,
  addToCart
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [chosenSize, setChosenSize] = useState(null);

  const filteredProducts = products.filter(
    p =>
      (p.category || '').toLowerCase() === category.toLowerCase() &&
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCardClick = (product) => {
    const hasSizes = product.sizes && typeof product.sizes === 'object' && Object.keys(product.sizes).length > 0;
    if (hasSizes) {
      setSelectedProduct(product);
      setChosenSize(Object.keys(product.sizes)[0]);
    } else {
      addToCart(product, null, product.price);
    }
  };

  const confirmSizeModal = () => {
    if (selectedProduct && chosenSize) {
      const price = selectedProduct.sizes[chosenSize];
      addToCart(selectedProduct, chosenSize, price);
      setSelectedProduct(null);
    }
  };

  return (
    <div className="catalog-section">
      <div className="search-filter-row">
        <input
          type="text"
          placeholder="🔍 Search menu..."
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
          const hasSizes = p.sizes && typeof p.sizes === 'object' && Object.keys(p.sizes).length > 0;
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
              <p>₱{p.price}{hasSizes ? '+' : ''}</p>
            </div>
          );
        })}
      </div>

      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>{selectedProduct.name}</h3>
            <div className="size-options">
              {Object.entries(selectedProduct.sizes).map(([size, price]) => (
                <button
                  key={size}
                  type="button"
                  className={chosenSize === size ? 'size-btn active' : 'size-btn'}
                  onClick={() => setChosenSize(size)}
                >
                  <span>{size}</span>
                  <strong>₱{price}</strong>
                </button>
              ))}
            </div>
            <div className="modal-buttons">
              <button onClick={() => setSelectedProduct(null)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmSizeModal} className="submit-btn">
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}