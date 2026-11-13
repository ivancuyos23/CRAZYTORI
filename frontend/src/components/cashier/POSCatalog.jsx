import React, { useState } from 'react';
import './POSCatalog.css';

// Import local images directly so Vite bundles them natively
import riceBowlImg from '../../assets/images/ricebowl.jfif';
import snackBoxImg from '../../assets/images/snackbox.jfif';
import spamMusubiImg from '../../assets/images/spamusubi.jpg';

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

  // Helper function to map product names to imported local assets
  const getProductImage = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('rice bowl') || name.includes('katsudon')) {
      return riceBowlImg;
    }
    if (name.includes('snack box')) {
      return snackBoxImg;
    }
    if (name.includes('spamusubi')) {
      return spamMusubiImg;
    }
    return null; // Falls back to emoji placeholder if it's a drink or unmapped item
  };

  // Filter products by active category (Food / Drinks) and search query
  const filteredProducts = products.filter(p => 
    p.category.toLowerCase() === category.toLowerCase() &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCardClick = (product) => {
    if (product.sizes) {
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
          const imageSrc = getProductImage(p.name);
          return (
            <div key={idx} className="menu-card" onClick={() => handleCardClick(p)}>
              <div className="item-img-container">
                {imageSrc ? (
                  <img src={imageSrc} alt={p.name} className="menu-item-img" />
                ) : (
                  <span className="item-img-placeholder">🥤</span>
                )}
              </div>
              <div className="menu-card-content">
                <h4>{p.name}</h4>
                <p>₱{p.price}{p.sizes ? '+' : ''}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Size Selection Modal for Drinks */}
      {selectedProduct && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Select Size for {selectedProduct.name}</h3>
            <div className="size-options">
              {Object.entries(selectedProduct.sizes).map(([size, price]) => (
                <button 
                  key={size} 
                  className={chosenSize === size ? 'size-btn active' : 'size-btn'}
                  onClick={() => setChosenSize(size)}
                >
                  <span>{size}</span>
                  <span>₱{price}</span>
                </button>
              ))}
            </div>
            <div className="modal-buttons">
              <button onClick={() => setSelectedProduct(null)} className="cancel-btn">Cancel</button>
              <button onClick={confirmSizeModal} className="submit-btn">Add to Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}