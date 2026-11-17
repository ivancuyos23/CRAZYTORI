import React, { useState, useEffect } from 'react';
import { PaginationBar, showToast } from '../layout/UIFeedback';
import {
  DEFAULT_RECIPE_RULES,
  INITIAL_INVENTORY,
  UNIT_OPTIONS,
  loadInvSettings,
  InventoryUsageKPIs,
  InventoryToolbarCard,
  InventoryEditModal,
  InventoryPortionModal
} from './InventoryControls';
import './AdminViews.css';

const ITEMS_PER_PAGE = 10;

export default function InventoryView({
  transactions = [],
  selectedDate,
  setSelectedDate,
  role = 'Admin'
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const activeDate = selectedDate || todayStr;

  const [invSettings] = useState(() => loadInvSettings());

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_store_inventory');
    const rawList = saved ? JSON.parse(saved) : INITIAL_INVENTORY;

    // Ensure Pork (Katsudon slice) exists and every item has unit & unitType
    const hasPork = rawList.some(i => i.name.toLowerCase().includes('katsudon'));
    const listWithPork = hasPork
      ? rawList
      : [
          {
            id: 'tako-0',
            category: 'TAKOYAKI',
            name: 'Pork (Katsudon slice)',
            start: 0,
            end: 0,
            unitType: 'piece',
            unit: 'pcs',
            reqThreshold: null
          },
          ...rawList
        ];

    return listWithPork.map(item => {
      const defMatch = INITIAL_INVENTORY.find(
        d => d.id === item.id || d.name.toLowerCase() === item.name.toLowerCase()
      );
      const unit = item.unit || defMatch?.unit || 'pcs';
      const unitType =
        item.unitType || (unit === 'pcs' ? 'piece' : 'weight');
      return {
        ...item,
        unit,
        unitType,
        reqThreshold:
          item.reqThreshold !== undefined ? item.reqThreshold : null
      };
    });
  });

  const [recipeRules, setRecipeRules] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_recipe_rules');
    if (!saved) return DEFAULT_RECIPE_RULES;
    const parsed = JSON.parse(saved);
    return parsed.map(r =>
      r.id === 'katsudon'
        ? {
            ...r,
            label: 'Katsudon (1 Slice Pork + Rice)',
            chicken: 0,
            porkSlices: r.porkSlices !== undefined ? r.porkSlices : 1
          }
        : { ...r, porkSlices: r.porkSlices || 0 }
    );
  });

  const [showPortionModal, setShowPortionModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [selectedCat, setSelectedCat] = useState('ALL');
  const [onlyReq, setOnlyReq] = useState(false);
  const [search, setSearch] = useState('');

  // Create New Item States
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('TAKOYAKI');
  const [newUnit, setNewUnit] = useState('pcs');
  const [newReqThreshold, setNewReqThreshold] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    localStorage.setItem('crazy_tori_store_inventory', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('crazy_tori_recipe_rules', JSON.stringify(recipeRules));
  }, [recipeRules]);

  const dailyTxs = transactions.filter(t => (t.date || '').startsWith(activeDate));

  let totalChickenG = 0;
  let totalPorkSlices = 0;
  let totalRiceG = 0;
  let totalFriesG = 0;

  dailyTxs.forEach(tx => {
    (tx.items || []).forEach(item => {
      const lower = (item.name || '').toLowerCase();
      const rule = recipeRules.find(r =>
        r.matchKeywords.some(kw => lower.includes(kw.toLowerCase()))
      );
      if (!rule) return;

      const qty = Number(item.qty || item.quantity || 1);
      totalChickenG += (Number(rule.chicken) || 0) * qty;
      totalPorkSlices += (Number(rule.porkSlices) || 0) * qty;
      totalRiceG += (Number(rule.rice) || 0) * qty;
      totalFriesG += (Number(rule.fries) || 0) * qty;
    });
  });

  const totalBatterG = totalChickenG * (500 / 2000);
  const batterPacks = (totalBatterG / 500).toFixed(2);

  // Resolve the active REQ threshold for a given item (custom item limit OR Settings default)
  const getItemReqLimit = (item) => {
    if (item.reqThreshold !== null && item.reqThreshold !== undefined && item.reqThreshold !== '') {
      return Number(item.reqThreshold);
    }
    if (item.unit === 'g') return Number(invSettings.weightGramsReqLimit) || 500;
    if (item.unit === 'kg') return Number(invSettings.weightKgReqLimit) || 1;
    return Number(invSettings.pieceReqLimit) || 5;
  };

  // Determine if an item should display REQ based on Settings mode + item threshold
  const isReqNeeded = (item) => {
    const start = Number(item.start) || 0;
    const end = Number(item.end) || 0;
    if (start === 0 && end === 0) return false;

    const limit = getItemReqLimit(item);
    const pctLimit = Number(invSettings.percentReqLimit) || 50;
    const mode = invSettings.ruleMode || 'both';

    const byThreshold = end <= limit;
    const byPercent = start > 0 && end < start * (pctLimit / 100);

    if (mode === 'threshold') return byThreshold;
    if (mode === 'percent') return byPercent;
    return byThreshold || byPercent;
  };

  const updateValue = (id, field, rawVal) => {
    const val = rawVal === '' ? '' : Math.max(0, Number(rawVal) || 0);
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRuleChange = (ruleId, field, rawVal) => {
    const val = Math.max(0, Number(rawVal) || 0);
    setRecipeRules(prev =>
      prev.map(r => (r.id === ruleId ? { ...r, [field]: val } : r))
    );
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const unitObj = UNIT_OPTIONS.find(u => u.value === newUnit) || UNIT_OPTIONS[0];

    setItems(prev => [
      {
        id: 'inv-' + Date.now(),
        category: newCategory,
        name: newName.trim(),
        start: 0,
        end: 0,
        unit: unitObj.value,
        unitType: unitObj.unitType,
        reqThreshold: newReqThreshold === '' ? null : Number(newReqThreshold)
      },
      ...prev
    ]);
    showToast(`Added "${newName.trim()}" (${unitObj.label})`, 'success');
    setNewName('');
    setNewReqThreshold('');
  };

  const handleSaveEditItem = (e) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    setItems(prev =>
      prev.map(item =>
        item.id === editingItem.id
          ? { ...editingItem, name: editingItem.name.trim() }
          : item
      )
    );
    showToast(`Updated "${editingItem.name.trim()}"!`, 'success');
    setEditingItem(null);
  };

  const handleDeleteItem = (id, name) => {
    if (!window.confirm(`Delete "${name}" from inventory?`)) return;
    setItems(prev => prev.filter(item => item.id !== id));
    setEditingItem(null);
    showToast(`Deleted "${name}" from inventory.`, 'info');
  };

  const handleRolloverNextDay = () => {
    if (!window.confirm('Copy today’s END counts into tomorrow’s START counts?')) return;
    setItems(prev => prev.map(item => ({ ...item, start: Number(item.end) || 0 })));
    showToast('Copied END stock into START stock!', 'success');
  };

  const reqCount = items.filter(isReqNeeded).length;

  const visibleItems = items.filter(item => {
    const matchCat = selectedCat === 'ALL' || item.category === selectedCat;
    const matchReq = !onlyReq || isReqNeeded(item);
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchReq && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedItems = visibleItems.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  return (
    <div className="admin-page-container">
      {/* Top Header */}
      <div className="admin-header-bar">
        <div>
          <h2>Store Inventory & Kitchen Usage</h2>
          <p className="admin-subtitle">
            Track items <strong>By Piece (pcs)</strong> or <strong>By Weight (g/kg)</strong> • REQ rules configurable per item or in Settings
          </p>
        </div>

        <div className="inv-header-actions">
          {setSelectedDate && (
            <input
              type="date"
              value={activeDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="admin-date-input"
            />
          )}

          {role === 'Admin' && (
            <button
              type="button"
              className="btn-secondary-sm"
              onClick={() => setShowPortionModal(true)}
            >
              ⚖️ Portions
            </button>
          )}

          <button
            type="button"
            className="btn-danger-sm"
            style={{
              background: onlyReq ? '#dc2626' : '#fef2f2',
              color: onlyReq ? '#ffffff' : '#b91c1c'
            }}
            onClick={() => {
              setOnlyReq(!onlyReq);
              setCurrentPage(1);
            }}
          >
            🚨 {onlyReq ? 'REQ Only' : `REQ (${reqCount})`}
          </button>

          <button
            type="button"
            className="btn-secondary-sm"
            onClick={handleRolloverNextDay}
          >
            ↻ End → Start
          </button>
        </div>
      </div>

      {/* Daily Kitchen Usage KPI Strip */}
      <InventoryUsageKPIs
        totalChickenG={totalChickenG}
        totalPorkSlices={totalPorkSlices}
        totalRiceG={totalRiceG}
        totalFriesG={totalFriesG}
        totalBatterG={totalBatterG}
        batterPacks={batterPacks}
      />

      {/* Container 1: Filter & Create Inventory Item */}
      <InventoryToolbarCard
        visibleCount={visibleItems.length}
        selectedCat={selectedCat}
        setSelectedCat={setSelectedCat}
        search={search}
        setSearch={setSearch}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        newName={newName}
        setNewName={setNewName}
        newUnit={newUnit}
        setNewUnit={setNewUnit}
        newReqThreshold={newReqThreshold}
        setNewReqThreshold={setNewReqThreshold}
        onAddItem={handleAddItem}
        onResetPage={() => setCurrentPage(1)}
      />

      {/* Container 2: Responsive Daily Stock Sheet */}
      <div className="admin-card report-sheet">
        <div className="report-sheet-header">
          <div>
            <span className="report-tag">DAILY STOCK SHEET</span>
            <h3>Inventory Ledger (Start • End • REQ)</h3>
          </div>
          <span className="ledger-badge">
            Page {safePage} of {totalPages}
          </span>
        </div>

        <div className="inv-sheet-desktop-head">
          <span>ITEM, UNIT & REQ RULE</span>
          <span className="text-center">START</span>
          <span className="text-center">END</span>
          <span className="text-center">LEFT %</span>
          <span className="text-center">STATUS / EDIT</span>
        </div>

        <div className="inv-sheet-list">
          {pagedItems.length === 0 ? (
            <div className="pending-empty-box">
              No inventory items match your current filter.
            </div>
          ) : (
            pagedItems.map(item => {
              const req = isReqNeeded(item);
              const startNum = Number(item.start) || 0;
              const endNum = Number(item.end) || 0;
              const pct = startNum > 0 ? Math.round((endNum / startNum) * 100) : null;
              const unitLabel = item.unit || 'pcs';
              const isWeight = item.unitType === 'weight' || unitLabel === 'g' || unitLabel === 'kg';
              const itemLimit = getItemReqLimit(item);

              return (
                <div
                  key={item.id}
                  className={`inv-stock-row ${req ? 'is-req' : ''}`}
                >
                  <div className="inv-item-main">
                    <div className="inv-item-title-group">
                      <strong className="inv-item-name">{item.name}</strong>
                      <div className="inv-meta-tags">
                        <span className="inv-cat-tag">{item.category}</span>
                        <span className={`inv-unit-tag ${isWeight ? 'weight' : 'piece'}`}>
                          {isWeight ? `⚖️ Weight (${unitLabel})` : `🔢 Piece (${unitLabel})`}
                        </span>
                        <span className="inv-limit-tag">
                          REQ ≤ {itemLimit} {unitLabel}
                        </span>
                      </div>
                    </div>

                    <div className="inv-mobile-badges">
                      {pct !== null && (
                        <span className={`inv-pct-pill ${req ? 'danger' : ''}`}>
                          {pct}%
                        </span>
                      )}
                      <span className={`inv-status-badge ${req ? 'req' : 'ok'}`}>
                        {req ? '🚨 REQ' : '✓ OK'}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => setEditingItem(item)}
                        title="Edit item unit or REQ limit"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>

                  <div className="inv-inputs-pair">
                    <div className="inv-input-box">
                      <label>START ({unitLabel})</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        placeholder={`0 ${unitLabel}`}
                        value={item.start}
                        onChange={e => updateValue(item.id, 'start', e.target.value)}
                      />
                    </div>

                    <div className="inv-input-box">
                      <label>END ({unitLabel})</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        placeholder={`0 ${unitLabel}`}
                        className={req ? 'req-alert-input' : ''}
                        value={item.end}
                        onChange={e => updateValue(item.id, 'end', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="inv-desktop-pct">
                    <strong>{pct !== null ? `${pct}%` : '—'}</strong>
                  </div>

                  <div className="inv-desktop-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span className={`inv-status-badge ${req ? 'req' : 'ok'}`}>
                      {req ? 'REQ' : 'OK'}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      style={{ padding: '4px 8px' }}
                      onClick={() => setEditingItem(item)}
                      title="Edit item unit or REQ limit"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <PaginationBar
          currentPage={safePage}
          totalItems={visibleItems.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Edit Inventory Item Modal (Piece vs Weight + Custom REQ Limit) */}
      <InventoryEditModal
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onSaveEdit={handleSaveEditItem}
        onDeleteItem={handleDeleteItem}
        defaultLimitLabel={
          editingItem
            ? `${getItemReqLimit({ ...editingItem, reqThreshold: null })} ${editingItem.unit || 'pcs'}`
            : ''
        }
      />

      {/* Admin Portion Rules Modal */}
      {showPortionModal && (
        <InventoryPortionModal
          recipeRules={recipeRules}
          onRuleChange={handleRuleChange}
          onResetRules={() => setRecipeRules(DEFAULT_RECIPE_RULES)}
          onClose={() => setShowPortionModal(false)}
        />
      )}
    </div>
  );
}