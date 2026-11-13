import React, { useState, useEffect } from 'react';
import './AdminViews.css';
import './AdminUsageView.css';

const DEFAULT_RECIPE_RULES = [
  {
    id: 'rice_bowl',
    label: 'Rice Bowls (Signature, Orenji, Sesame)',
    matchKeywords: ['rice bowl'],
    chicken: 100,
    rice: 200,
    fries: 0
  },
  {
    id: 'snack_chicken_fries',
    label: 'Snack Box - Chicken & Fries',
    matchKeywords: ['chicken & fries'],
    chicken: 80,
    rice: 0,
    fries: 120
  },
  {
    id: 'snack_all_chicken',
    label: 'Snack Box - All Chicken',
    matchKeywords: ['all chicken'],
    chicken: 130,
    rice: 0,
    fries: 0
  },
  {
    id: 'snack_all_fries',
    label: 'Snack Box - All Fries',
    matchKeywords: ['all fries'],
    chicken: 0,
    rice: 0,
    fries: 180
  },
  {
    id: 'katsudon',
    label: 'Katsudon',
    matchKeywords: ['katsudon'],
    chicken: 100,
    rice: 200,
    fries: 0
  },
  {
    id: 'spamusubi',
    label: 'Spamusubi',
    matchKeywords: ['spamusubi'],
    chicken: 0,
    rice: 100,
    fries: 0
  }
];

const DEFAULT_BATTER_RATIO = {
  batterGrams: 500,   // 500g plastic pack of batter mix
  chickenGrams: 2000  // per 2kg (2000g) of chicken
};

export default function AdminUsageView({
  transactions = [],
  selectedDate,
  setSelectedDate,
  role = 'Admin'
}) {
  // Load editable dish portion rules from localStorage
  const [recipeRules, setRecipeRules] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_recipe_rules');
    return saved ? JSON.parse(saved) : DEFAULT_RECIPE_RULES;
  });

  // Load editable batter mix ratio (500g pack per 2000g chicken)
  const [batterRatio, setBatterRatio] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_batter_ratio');
    return saved ? JSON.parse(saved) : DEFAULT_BATTER_RATIO;
  });

  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    localStorage.setItem('crazy_tori_recipe_rules', JSON.stringify(recipeRules));
  }, [recipeRules]);

  useEffect(() => {
    localStorage.setItem('crazy_tori_batter_ratio', JSON.stringify(batterRatio));
  }, [batterRatio]);

  const triggerSavedFlash = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Match an ordered item name to its recipe rule
  const findRuleForItem = (itemName = '') => {
    const lower = itemName.toLowerCase();
    return recipeRules.find(rule =>
      rule.matchKeywords.some(kw => lower.includes(kw.toLowerCase()))
    );
  };

  // Calculate batter grams from chicken grams using Admin's ratio
  const calcBatterFromChicken = (chickenG) => {
    const cBase = Number(batterRatio.chickenGrams) || 2000;
    const bPack = Number(batterRatio.batterGrams) || 500;
    return chickenG * (bPack / cBase);
  };

  // Admin edits per-dish Chicken, Rice, or Fries grams
  const handlePortionChange = (ruleId, field, value) => {
    const numericVal = Math.max(0, Number(value) || 0);
    setRecipeRules(prev =>
      prev.map(r => (r.id === ruleId ? { ...r, [field]: numericVal } : r))
    );
    triggerSavedFlash();
  };

  // Admin edits Batter Mix ratio
  const handleRatioChange = (field, value) => {
    const numericVal = Math.max(1, Number(value) || 1);
    setBatterRatio(prev => ({ ...prev, [field]: numericVal }));
    triggerSavedFlash();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset portion weights and 500g:2kg batter mix ratio to defaults?')) {
      setRecipeRules(DEFAULT_RECIPE_RULES);
      setBatterRatio(DEFAULT_BATTER_RATIO);
      triggerSavedFlash();
    }
  };

  // Filter transactions for the selected date
  const dailyTxs = transactions.filter(t => t.date && t.date.startsWith(selectedDate));

  let totalChickenG = 0;
  let totalRiceG = 0;
  let totalFriesG = 0;
  let totalBatterG = 0;

  const itemUsageMap = {};

  dailyTxs.forEach(tx => {
    (tx.items || []).forEach(item => {
      const rule = findRuleForItem(item.name);
      if (!rule) return;

      const qty = Number(item.qty || item.quantity || 1);
      const cG = (Number(rule.chicken) || 0) * qty;
      const rG = (Number(rule.rice) || 0) * qty;
      const fG = (Number(rule.fries) || 0) * qty;
      const bG = calcBatterFromChicken(cG);

      totalChickenG += cG;
      totalRiceG += rG;
      totalFriesG += fG;
      totalBatterG += bG;

      if (!itemUsageMap[item.name]) {
        itemUsageMap[item.name] = {
          qty: 0,
          chicken: 0,
          rice: 0,
          fries: 0,
          batterMix: 0
        };
      }
      itemUsageMap[item.name].qty += qty;
      itemUsageMap[item.name].chicken += cG;
      itemUsageMap[item.name].rice += rG;
      itemUsageMap[item.name].fries += fG;
      itemUsageMap[item.name].batterMix += bG;
    });
  });

  const formatKg = (grams) => (grams / 1000).toFixed(2) + ' kg';
  const formatGrams = (grams) => Number(grams.toFixed(1)).toLocaleString() + ' g';
  const packSizeG = Number(batterRatio.batterGrams) || 500;
  const batterPacksUsed = (totalBatterG / packSizeG).toFixed(2);

  return (
    <div className="admin-page-container">
      {/* Top Header & Date Picker */}
      <div className="admin-header-bar">
        <div>
          <h2>Daily Ingredient Usage & Portion Control</h2>
          <p className="admin-subtitle">
            Automated daily consumption of Chicken, Rice, Fries, and Batter Mix ({packSizeG}g packs)
          </p>
        </div>

        <div className="expense-filter-bar">
          <span className="filter-label">Usage Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="admin-date-input"
          />
        </div>
      </div>

      {/* 4-Card Ingredient KPI Summary */}
      <div className="expense-kpi-grid">
        <div className="admin-kpi-card usage-kpi-card">
          <span>🍗 Chicken Used</span>
          <h3>{formatKg(totalChickenG)}</h3>
          <small className="kpi-sub">{formatGrams(totalChickenG)} total</small>
        </div>

        <div className="admin-kpi-card usage-kpi-card">
          <span>🍚 Rice Used</span>
          <h3>{formatKg(totalRiceG)}</h3>
          <small className="kpi-sub">{formatGrams(totalRiceG)} total</small>
        </div>

        <div className="admin-kpi-card usage-kpi-card">
          <span>🍟 Fries Used</span>
          <h3>{formatKg(totalFriesG)}</h3>
          <small className="kpi-sub">{formatGrams(totalFriesG)} total</small>
        </div>

        <div className="admin-kpi-card usage-kpi-card kpi-highlight-outflow">
          <span>🥣 Batter Mix Used</span>
          <h3>{formatKg(totalBatterG)}</h3>
          <small className="kpi-sub">
            {formatGrams(totalBatterG)} • <strong>{batterPacksUsed} packs</strong> ({packSizeG}g)
          </small>
        </div>
      </div>

      <div className="admin-two-col">
        {/* LEFT COLUMN: Daily Itemized Consumption Breakdown */}
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">DAILY KITCHEN TALLY ({selectedDate})</span>
              <h3>Consumption by Dish Sold</h3>
            </div>
            <span className="ledger-badge">{dailyTxs.length} Orders Processed</span>
          </div>

          <div className="audit-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Menu Item Sold</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Chicken</th>
                  <th className="text-right">Rice</th>
                  <th className="text-right">Fries</th>
                  <th className="text-right">Batter Mix</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(itemUsageMap).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      No food items with ingredient rules sold on {selectedDate}.
                    </td>
                  </tr>
                ) : (
                  Object.entries(itemUsageMap).map(([itemName, data]) => (
                    <tr key={itemName}>
                      <td><strong>{itemName}</strong></td>
                      <td className="text-center">
                        <span className="method-badge">{data.qty}x</span>
                      </td>
                      <td className="text-right">{data.chicken > 0 ? `${data.chicken}g` : '—'}</td>
                      <td className="text-right">{data.rice > 0 ? `${data.rice}g` : '—'}</td>
                      <td className="text-right">{data.fries > 0 ? `${data.fries}g` : '—'}</td>
                      <td className="text-right">
                        {data.batterMix > 0 ? `${Number(data.batterMix.toFixed(1))}g` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ledger-total-box">
            <div>
              <span className="ledger-total-label">TOTAL COMBINED RAW WEIGHT USED</span>
              <small>Chicken + Rice + Fries + Batter Mix for {selectedDate}</small>
            </div>
            <div className="ledger-total-figure">
              {formatKg(totalChickenG + totalRiceG + totalFriesG + totalBatterG)}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Admin Editable Recipe Portion & Batter Ratio Editor */}
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">PORTION STANDARDS (GRAMS / SERVING)</span>
              <h3>Admin Portion & Batter Mix Editor</h3>
            </div>

            {role === 'Admin' && (
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={handleResetDefaults}
              >
                ↺ Reset Defaults
              </button>
            )}
          </div>

          {/* Editable Batter Mix Pack Ratio Box */}
          <div className="batter-ratio-banner">
            <div className="batter-ratio-header">
              <strong>🥣 Batter Mix Pack Ratio (Auto-Calculated per Chicken Weight)</strong>
              {savedNotice && <span className="saved-pill">✓ Saved</span>}
            </div>
            <div className="batter-ratio-controls">
              <div className="ratio-field">
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={batterRatio.batterGrams}
                  disabled={role !== 'Admin'}
                  onChange={e => handleRatioChange('batterGrams', e.target.value)}
                />
                <span>g Batter Mix Pack</span>
              </div>
              <span className="ratio-divider">per</span>
              <div className="ratio-field">
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={batterRatio.chickenGrams}
                  disabled={role !== 'Admin'}
                  onChange={e => handleRatioChange('chickenGrams', e.target.value)}
                />
                <span>g Chicken (2kg)</span>
              </div>
            </div>
          </div>

          {/* Per-Dish Portion Editor */}
          <div className="recipe-editor-list">
            {recipeRules.map(rule => {
              const autoBatterPerDish = calcBatterFromChicken(rule.chicken);
              return (
                <div key={rule.id} className="recipe-rule-card">
                  <div className="recipe-rule-title">
                    <strong>{rule.label}</strong>
                    {autoBatterPerDish > 0 && (
                      <span className="auto-batter-tag">
                        🥣 {Number(autoBatterPerDish.toFixed(1))}g batter / order
                      </span>
                    )}
                  </div>

                  <div className="recipe-inputs-grid three-cols">
                    <div className="recipe-input-box">
                      <label>🍗 Chicken (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={rule.chicken}
                        disabled={role !== 'Admin'}
                        onChange={e => handlePortionChange(rule.id, 'chicken', e.target.value)}
                      />
                    </div>

                    <div className="recipe-input-box">
                      <label>🍚 Rice (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={rule.rice}
                        disabled={role !== 'Admin'}
                        onChange={e => handlePortionChange(rule.id, 'rice', e.target.value)}
                      />
                    </div>

                    <div className="recipe-input-box">
                      <label>🍟 Fries (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={rule.fries}
                        disabled={role !== 'Admin'}
                        onChange={e => handlePortionChange(rule.id, 'fries', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}