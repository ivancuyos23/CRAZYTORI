import React, { useState, useEffect } from 'react';
import './AdminViews.css';
import './AdminUsageView.css';

const DEFAULT_RECIPE_RULES = [
  { id: 'rice_bowl', label: 'Rice Bowls', matchKeywords: ['rice bowl'], chicken: 100, rice: 200, fries: 0 },
  { id: 'snack_chicken_fries', label: 'Snack Box - Chicken & Fries', matchKeywords: ['chicken & fries'], chicken: 80, rice: 0, fries: 120 },
  { id: 'snack_all_chicken', label: 'Snack Box - All Chicken', matchKeywords: ['all chicken'], chicken: 130, rice: 0, fries: 0 },
  { id: 'snack_all_fries', label: 'Snack Box - All Fries', matchKeywords: ['all fries'], chicken: 0, rice: 0, fries: 180 },
  { id: 'katsudon', label: 'Katsudon', matchKeywords: ['katsudon'], chicken: 100, rice: 200, fries: 0 },
  { id: 'spamusubi', label: 'Spamusubi', matchKeywords: ['spamusubi'], chicken: 0, rice: 100, fries: 0 }
];

const DEFAULT_BATTER_RATIO = { batterGrams: 500, chickenGrams: 2000 };

export default function AdminUsageView({
  transactions = [],
  selectedDate,
  setSelectedDate,
  role = 'Admin'
}) {
  const [recipeRules, setRecipeRules] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_recipe_rules');
    return saved ? JSON.parse(saved) : DEFAULT_RECIPE_RULES;
  });

  const [batterRatio, setBatterRatio] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_batter_ratio');
    return saved ? JSON.parse(saved) : DEFAULT_BATTER_RATIO;
  });

  useEffect(() => {
    localStorage.setItem('crazy_tori_recipe_rules', JSON.stringify(recipeRules));
  }, [recipeRules]);

  useEffect(() => {
    localStorage.setItem('crazy_tori_batter_ratio', JSON.stringify(batterRatio));
  }, [batterRatio]);

  const findRuleForItem = (itemName = '') => {
    const lower = itemName.toLowerCase();
    return recipeRules.find(r => r.matchKeywords.some(kw => lower.includes(kw)));
  };

  const calcBatterFromChicken = (chickenG) => {
    const cBase = Number(batterRatio.chickenGrams) || 2000;
    const bPack = Number(batterRatio.batterGrams) || 500;
    return chickenG * (bPack / cBase);
  };

  const handlePortionChange = (ruleId, field, value) => {
    const numericVal = Math.max(0, Number(value) || 0);
    setRecipeRules(prev => prev.map(r => (r.id === ruleId ? { ...r, [field]: numericVal } : r)));
  };

  const handleRatioChange = (field, value) => {
    const numericVal = Math.max(1, Number(value) || 1);
    setBatterRatio(prev => ({ ...prev, [field]: numericVal }));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset default gram portions?')) {
      setRecipeRules(DEFAULT_RECIPE_RULES);
      setBatterRatio(DEFAULT_BATTER_RATIO);
    }
  };

  const dailyTxs = transactions.filter(t => t.date && t.date.startsWith(selectedDate));

  let totalChickenG = 0, totalRiceG = 0, totalFriesG = 0, totalBatterG = 0;
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
        itemUsageMap[item.name] = { qty: 0, chicken: 0, rice: 0, fries: 0, batterMix: 0 };
      }
      itemUsageMap[item.name].qty += qty;
      itemUsageMap[item.name].chicken += cG;
      itemUsageMap[item.name].rice += rG;
      itemUsageMap[item.name].fries += fG;
      itemUsageMap[item.name].batterMix += bG;
    });
  });

  const formatKg = (g) => (g / 1000).toFixed(2) + ' kg';
  const formatGrams = (g) => Number(g.toFixed(0)).toLocaleString() + ' g';
  const packSizeG = Number(batterRatio.batterGrams) || 500;
  const batterPacksUsed = (totalBatterG / packSizeG).toFixed(2);

  return (
    <div className="admin-page-container">
      <div className="admin-header-bar">
        <h2>Daily Usage</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="admin-date-input"
        />
      </div>

      <div className="expense-kpi-grid">
        <div className="admin-kpi-card usage-kpi-card">
          <span>🍗 Chicken</span>
          <h3>{formatKg(totalChickenG)}</h3>
          <small className="kpi-sub">{formatGrams(totalChickenG)}</small>
        </div>
        <div className="admin-kpi-card usage-kpi-card">
          <span>🍚 Rice</span>
          <h3>{formatKg(totalRiceG)}</h3>
          <small className="kpi-sub">{formatGrams(totalRiceG)}</small>
        </div>
        <div className="admin-kpi-card usage-kpi-card">
          <span>🍟 Fries</span>
          <h3>{formatKg(totalFriesG)}</h3>
          <small className="kpi-sub">{formatGrams(totalFriesG)}</small>
        </div>
        <div className="admin-kpi-card usage-kpi-card kpi-highlight-outflow">
          <span>🥣 Batter Mix</span>
          <h3>{formatKg(totalBatterG)}</h3>
          <small className="kpi-sub">{batterPacksUsed} packs ({packSizeG}g)</small>
        </div>
      </div>

      <div className="admin-two-col">
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <h3>Used by Item</h3>
            <span className="ledger-badge">{dailyTxs.length} Orders</span>
          </div>

          <div className="audit-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Chicken</th>
                  <th className="text-right">Rice</th>
                  <th className="text-right">Fries</th>
                  <th className="text-right">Batter</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(itemUsageMap).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-row">No items sold on this date.</td>
                  </tr>
                ) : (
                  Object.entries(itemUsageMap).map(([itemName, data]) => (
                    <tr key={itemName}>
                      <td><strong>{itemName}</strong></td>
                      <td className="text-center"><span className="method-badge">{data.qty}x</span></td>
                      <td className="text-right">{data.chicken > 0 ? `${data.chicken}g` : '—'}</td>
                      <td className="text-right">{data.rice > 0 ? `${data.rice}g` : '—'}</td>
                      <td className="text-right">{data.fries > 0 ? `${data.fries}g` : '—'}</td>
                      <td className="text-right">{data.batterMix > 0 ? `${Number(data.batterMix.toFixed(0))}g` : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ledger-total-box">
            <span className="ledger-total-label">TOTAL WEIGHT</span>
            <div className="ledger-total-figure">
              {formatKg(totalChickenG + totalRiceG + totalFriesG + totalBatterG)}
            </div>
          </div>
        </div>

        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <h3>Portion Rules (Grams)</h3>
            {role === 'Admin' && (
              <button type="button" className="btn-secondary-sm" onClick={handleResetDefaults}>
                ↺ Reset
              </button>
            )}
          </div>

          <div className="batter-ratio-banner">
            <strong>🥣 Batter Ratio</strong>
            <div className="batter-ratio-controls">
              <div className="ratio-field">
                <input
                  type="number"
                  value={batterRatio.batterGrams}
                  disabled={role !== 'Admin'}
                  onChange={e => handleRatioChange('batterGrams', e.target.value)}
                />
                <span>g Batter</span>
              </div>
              <span className="ratio-divider">per</span>
              <div className="ratio-field">
                <input
                  type="number"
                  value={batterRatio.chickenGrams}
                  disabled={role !== 'Admin'}
                  onChange={e => handleRatioChange('chickenGrams', e.target.value)}
                />
                <span>g Chicken</span>
              </div>
            </div>
          </div>

          <div className="recipe-editor-list">
            {recipeRules.map(rule => (
              <div key={rule.id} className="recipe-rule-card">
                <div className="recipe-rule-title">
                  <strong>{rule.label}</strong>
                </div>
                <div className="recipe-inputs-grid three-cols">
                  <div className="recipe-input-box">
                    <label>🍗 Chicken (g)</label>
                    <input
                      type="number"
                      value={rule.chicken}
                      disabled={role !== 'Admin'}
                      onChange={e => handlePortionChange(rule.id, 'chicken', e.target.value)}
                    />
                  </div>
                  <div className="recipe-input-box">
                    <label>🍚 Rice (g)</label>
                    <input
                      type="number"
                      value={rule.rice}
                      disabled={role !== 'Admin'}
                      onChange={e => handlePortionChange(rule.id, 'rice', e.target.value)}
                    />
                  </div>
                  <div className="recipe-input-box">
                    <label>🍟 Fries (g)</label>
                    <input
                      type="number"
                      value={rule.fries}
                      disabled={role !== 'Admin'}
                      onChange={e => handlePortionChange(rule.id, 'fries', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}