import React from 'react';
import { showToast } from '../layout/UIFeedback';
import './AdminViews.css';

export const DEFAULT_INV_SETTINGS = {
  ruleMode: 'both', // 'both' | 'threshold' | 'percent'
  pieceReqLimit: 5,
  weightGramsReqLimit: 500,
  weightKgReqLimit: 1,
  percentReqLimit: 50
};

export function loadInvSettings() {
  try {
    const saved = localStorage.getItem('crazy_tori_inv_settings');
    return saved ? { ...DEFAULT_INV_SETTINGS, ...JSON.parse(saved) } : DEFAULT_INV_SETTINGS;
  } catch {
    return DEFAULT_INV_SETTINGS;
  }
}

export const DEFAULT_RECIPE_RULES = [
  {
    id: 'rice_bowl',
    label: 'Rice Bowls (Signature, Orenji, Sesame)',
    matchKeywords: ['rice bowl'],
    chicken: 100,
    porkSlices: 0,
    rice: 200,
    fries: 0
  },
  {
    id: 'katsudon',
    label: 'Katsudon (1 Slice Pork + Rice)',
    matchKeywords: ['katsudon'],
    chicken: 0,
    porkSlices: 1,
    rice: 200,
    fries: 0
  },
  {
    id: 'snack_chicken_fries',
    label: 'Snack Box - Chicken & Fries',
    matchKeywords: ['chicken & fries'],
    chicken: 80,
    porkSlices: 0,
    rice: 0,
    fries: 120
  },
  {
    id: 'snack_all_chicken',
    label: 'Snack Box - All Chicken',
    matchKeywords: ['all chicken'],
    chicken: 130,
    porkSlices: 0,
    rice: 0,
    fries: 0
  },
  {
    id: 'snack_all_fries',
    label: 'Snack Box - All Fries',
    matchKeywords: ['all fries'],
    chicken: 0,
    porkSlices: 0,
    rice: 0,
    fries: 180
  },
  {
    id: 'spamusubi',
    label: 'Spamusubi',
    matchKeywords: ['spamusubi'],
    chicken: 0,
    porkSlices: 0,
    rice: 100,
    fries: 0
  }
];

export const INITIAL_INVENTORY = [
  // TAKOYAKI & KITCHEN MEATS
  { id: 'tako-0', category: 'TAKOYAKI', name: 'Pork (Katsudon slice)', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'tako-1', category: 'TAKOYAKI', name: 'Tako mix', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'tako-2', category: 'TAKOYAKI', name: 'Tako sauce', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'tako-3', category: 'TAKOYAKI', name: 'Tako box', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'tako-4', category: 'TAKOYAKI', name: 'Egg', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'tako-5', category: 'TAKOYAKI', name: 'Pork floss', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'tako-6', category: 'TAKOYAKI', name: 'Cheese sauce', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'tako-7', category: 'TAKOYAKI', name: 'Cheese bar', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'tako-8', category: 'TAKOYAKI', name: 'Shrimp', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'tako-9', category: 'TAKOYAKI', name: 'Oil', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'tako-10', category: 'TAKOYAKI', name: 'Octobits', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },

  // SEASONING & DRY GOODS
  { id: 'seas-1', category: 'SEASONING & DRY GOODS', name: 'Chili powder', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'seas-2', category: 'SEASONING & DRY GOODS', name: 'Black seeds', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'seas-3', category: 'SEASONING & DRY GOODS', name: 'White seeds', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'seas-4', category: 'SEASONING & DRY GOODS', name: 'Nori flakes', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'seas-5', category: 'SEASONING & DRY GOODS', name: 'Black pepper', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'seas-6', category: 'SEASONING & DRY GOODS', name: 'Salt', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'seas-7', category: 'SEASONING & DRY GOODS', name: 'Red ginger', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'seas-8', category: 'SEASONING & DRY GOODS', name: 'Marmalade', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'seas-9', category: 'SEASONING & DRY GOODS', name: 'Bread crumbs', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'seas-10', category: 'SEASONING & DRY GOODS', name: 'Katsu mix', start: 0, end: 0, unitType: 'weight', unit: 'g', reqThreshold: null },
  { id: 'seas-11', category: 'SEASONING & DRY GOODS', name: 'Oil (kitchen)', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },

  // SUPPLIES & PACKAGING
  { id: 'supp-1', category: 'SUPPLIES & PACKAGING', name: 'Trash bag', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-2', category: 'SUPPLIES & PACKAGING', name: 'Vinyl gloves', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-3', category: 'SUPPLIES & PACKAGING', name: 'Plastic gloves', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-4', category: 'SUPPLIES & PACKAGING', name: 'Tissue roll', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-5', category: 'SUPPLIES & PACKAGING', name: 'Tiny bag', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-6', category: 'SUPPLIES & PACKAGING', name: 'Paper bag (small)', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-7', category: 'SUPPLIES & PACKAGING', name: 'Paper bag (big)', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-8', category: 'SUPPLIES & PACKAGING', name: 'Chopstick', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-9', category: 'SUPPLIES & PACKAGING', name: 'Spoon & fork', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-10', category: 'SUPPLIES & PACKAGING', name: 'Paddle pick', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-11', category: 'SUPPLIES & PACKAGING', name: 'Spam pouch', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-12', category: 'SUPPLIES & PACKAGING', name: 'Dome lid', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-13', category: 'SUPPLIES & PACKAGING', name: 'Masking tape', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-14', category: 'SUPPLIES & PACKAGING', name: 'Double-sided tape', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-15', category: 'SUPPLIES & PACKAGING', name: 'Stock request form', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null },
  { id: 'supp-16', category: 'SUPPLIES & PACKAGING', name: 'Labels', start: 0, end: 0, unitType: 'piece', unit: 'pcs', reqThreshold: null }
];

export const CATEGORIES = [
  { key: 'ALL', label: 'All Items' },
  { key: 'TAKOYAKI', label: '🐙 Takoyaki & Meat' },
  { key: 'SEASONING & DRY GOODS', label: '🧂 Seasoning & Dry' },
  { key: 'SUPPLIES & PACKAGING', label: '📦 Supplies & Pack' }
];

export const UNIT_OPTIONS = [
  { value: 'pcs', unitType: 'piece', label: '🔢 By Piece (pcs)' },
  { value: 'g', unitType: 'weight', label: '⚖️ By Weight (g)' },
  { value: 'kg', unitType: 'weight', label: '⚖️ By Weight (kg)' }
];

export function InventoryUsageKPIs({
  totalChickenG,
  totalPorkSlices,
  totalRiceG,
  totalFriesG,
  totalBatterG,
  batterPacks
}) {
  return (
    <div
      className="expense-kpi-grid"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))' }}
    >
      <div className="admin-kpi-card">
        <span>🍗 Chicken Used</span>
        <h3>{(totalChickenG / 1000).toFixed(2)} kg</h3>
        <small style={{ color: '#64748b', fontWeight: 700 }}>{totalChickenG}g today</small>
      </div>

      <div className="admin-kpi-card">
        <span>🥩 Pork (Katsudon)</span>
        <h3>{totalPorkSlices} {totalPorkSlices === 1 ? 'Slice' : 'Slices'}</h3>
        <small style={{ color: '#64748b', fontWeight: 700 }}>1 slice / Katsudon</small>
      </div>

      <div className="admin-kpi-card">
        <span>🍚 Rice Used</span>
        <h3>{(totalRiceG / 1000).toFixed(2)} kg</h3>
        <small style={{ color: '#64748b', fontWeight: 700 }}>{totalRiceG}g today</small>
      </div>

      <div className="admin-kpi-card">
        <span>🍟 Fries Used</span>
        <h3>{(totalFriesG / 1000).toFixed(2)} kg</h3>
        <small style={{ color: '#64748b', fontWeight: 700 }}>{totalFriesG}g today</small>
      </div>

      <div className="admin-kpi-card">
        <span>🥣 Batter Mix</span>
        <h3>{batterPacks} Packs</h3>
        <small style={{ color: '#64748b', fontWeight: 700 }}>
          {totalBatterG.toFixed(0)}g (500g / 2kg)
        </small>
      </div>
    </div>
  );
}

export function InventoryToolbarCard({
  visibleCount,
  selectedCat,
  setSelectedCat,
  search,
  setSearch,
  newCategory,
  setNewCategory,
  newName,
  setNewName,
  newUnit,
  setNewUnit,
  newReqThreshold,
  setNewReqThreshold,
  onAddItem,
  onResetPage
}) {
  return (
    <div className="admin-card report-sheet">
      <div className="report-sheet-header">
        <div>
          <span className="report-tag">STOCK CONTROLS</span>
          <h3>Filter & Create Inventory Item</h3>
        </div>
        <span className="ledger-badge">{visibleCount} Items Found</span>
      </div>

      <div className="inv-toolbar-grid">
        <div className="inv-cat-pills-scroll">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setSelectedCat(cat.key);
                onResetPage();
              }}
              className={selectedCat === cat.key ? 'pill active' : 'pill'}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="inv-search-add-row">
          <input
            type="text"
            className="inv-search-input"
            placeholder="🔍 Search inventory item..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              onResetPage();
            }}
          />
        </div>

        {/* Create New Inventory Item Form with Piece/Weight & REQ Threshold */}
        <form onSubmit={onAddItem} className="inv-create-grid">
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            title="Category"
          >
            <option value="TAKOYAKI">TAKOYAKI</option>
            <option value="SEASONING & DRY GOODS">SEASONING & DRY GOODS</option>
            <option value="SUPPLIES & PACKAGING">SUPPLIES & PACKAGING</option>
          </select>

          <input
            type="text"
            placeholder="New item name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />

          <select
            value={newUnit}
            onChange={e => setNewUnit(e.target.value)}
            title="Track By Piece or By Weight"
          >
            {UNIT_OPTIONS.map(u => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            step="any"
            placeholder={`REQ ≤ (${newUnit})`}
            title="Optional custom REQ limit (leave blank for Settings default)"
            value={newReqThreshold}
            onChange={e => setNewReqThreshold(e.target.value)}
          />

          <button type="submit" className="btn-primary-amber">
            + Add Item
          </button>
        </form>
      </div>
    </div>
  );
}

export function InventoryEditModal({
  editingItem,
  setEditingItem,
  onSaveEdit,
  onDeleteItem,
  defaultLimitLabel
}) {
  if (!editingItem) return null;

  return (
    <div className="modal-backdrop" onClick={() => setEditingItem(null)}>
      <form
        className="modal-card"
        style={{ maxWidth: '420px', textAlign: 'left' }}
        onClick={e => e.stopPropagation()}
        onSubmit={onSaveEdit}
      >
        <h3>✏️ Edit Inventory Item</h3>

        <div className="admin-form">
          <div>
            <label>Item Name</label>
            <input
              type="text"
              value={editingItem.name}
              onChange={e =>
                setEditingItem({ ...editingItem, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label>Category</label>
            <select
              value={editingItem.category}
              onChange={e =>
                setEditingItem({ ...editingItem, category: e.target.value })
              }
            >
              <option value="TAKOYAKI">TAKOYAKI</option>
              <option value="SEASONING & DRY GOODS">SEASONING & DRY GOODS</option>
              <option value="SUPPLIES & PACKAGING">SUPPLIES & PACKAGING</option>
            </select>
          </div>

          <div>
            <label>Measurement Type (By Piece or By Weight)</label>
            <div className="inv-unit-choice-grid">
              {UNIT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={
                    (editingItem.unit || 'pcs') === opt.value
                      ? 'inv-unit-btn active'
                      : 'inv-unit-btn'
                  }
                  onClick={() =>
                    setEditingItem({
                      ...editingItem,
                      unit: opt.value,
                      unitType: opt.unitType
                    })
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label>
              Custom REQ Alert Threshold ({editingItem.unit || 'pcs'})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder={`Default from Settings (${defaultLimitLabel})`}
              value={
                editingItem.reqThreshold === null ||
                editingItem.reqThreshold === undefined
                  ? ''
                  : editingItem.reqThreshold
              }
              onChange={e =>
                setEditingItem({
                  ...editingItem,
                  reqThreshold: e.target.value === '' ? null : Number(e.target.value)
                })
              }
            />
            <small style={{ color: '#64748b', fontWeight: 700, fontSize: '0.74rem' }}>
              Leave blank to use the global REQ threshold configured in Settings.
            </small>
          </div>
        </div>

        <div className="modal-buttons" style={{ marginTop: '8px' }}>
          <button
            type="button"
            className="btn-danger-sm"
            onClick={() => onDeleteItem(editingItem.id, editingItem.name)}
          >
            🗑️ Delete
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setEditingItem(null)}
          >
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            ✓ Save
          </button>
        </div>
      </form>
    </div>
  );
}

export function InventoryPortionModal({
  recipeRules,
  onRuleChange,
  onResetRules,
  onClose
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '480px', textAlign: 'left' }}
        onClick={e => e.stopPropagation()}
      >
        <h3>⚖️ Dish Portion Rules (Per Order)</h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '60dvh',
            overflowY: 'auto'
          }}
        >
          {recipeRules.map(rule => (
            <div
              key={rule.id}
              style={{
                background: '#f8fafc',
                border: '2px solid #cbd5e1',
                borderRadius: '10px',
                padding: '10px'
              }}
            >
              <strong style={{ display: 'block', marginBottom: '6px', fontSize: '0.86rem' }}>
                {rule.label}
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                <div>
                  <small style={{ fontWeight: 800, fontSize: '0.7rem' }}>🍗 Chicken(g)</small>
                  <input
                    type="number"
                    value={rule.chicken}
                    onChange={e => onRuleChange(rule.id, 'chicken', e.target.value)}
                    style={{ width: '100%', padding: '4px 6px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <small style={{ fontWeight: 800, fontSize: '0.7rem' }}>🥩 Pork(slice)</small>
                  <input
                    type="number"
                    value={rule.porkSlices || 0}
                    onChange={e => onRuleChange(rule.id, 'porkSlices', e.target.value)}
                    style={{ width: '100%', padding: '4px 6px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <small style={{ fontWeight: 800, fontSize: '0.7rem' }}>🍚 Rice(g)</small>
                  <input
                    type="number"
                    value={rule.rice}
                    onChange={e => onRuleChange(rule.id, 'rice', e.target.value)}
                    style={{ width: '100%', padding: '4px 6px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <small style={{ fontWeight: 800, fontSize: '0.7rem' }}>🍟 Fries(g)</small>
                  <input
                    type="number"
                    value={rule.fries}
                    onChange={e => onRuleChange(rule.id, 'fries', e.target.value)}
                    style={{ width: '100%', padding: '4px 6px', textAlign: 'center' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-buttons">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => {
              onResetRules();
              showToast('Portions reset to defaults!', 'info');
            }}
          >
            Reset Defaults
          </button>
          <button
            type="button"
            className="submit-btn"
            onClick={() => {
              onClose();
              showToast('Portion rules saved!', 'success');
            }}
          >
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
}