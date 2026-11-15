// Branded PDF (Print with Paper Size) & Excel (.xls) Export Service for Crazy Tori POS

const getTodayStr = () => new Date().toISOString().split('T')[0];

const PAPER_CONFIGS = {
  A4: { pageRule: 'A4 portrait', maxWidth: '210mm', padding: '18px' },
  Letter: { pageRule: 'letter portrait', maxWidth: '216mm', padding: '18px' },
  Legal: { pageRule: 'legal portrait', maxWidth: '216mm', padding: '18px' },
  '80mm': { pageRule: '80mm auto', maxWidth: '76mm', padding: '6px' }
};

// Shared Branded HTML Header (Logo + Store Name + Report Meta)
const buildBrandHeaderHTML = (title, subtitle) => `
  <div class="brand-banner">
    <div class="logo-box">
      <div class="logo-badge">
        <span class="crazy">CRAZY</span>
        <span class="tori">TORI</span>
      </div>
      <div class="logo-sub">
        <strong>チキンポッパー • CDU BRANCH</strong>
        <span>Official POS Financial Record</span>
      </div>
    </div>
    <div class="report-meta">
      <h2>${title}</h2>
      <p>${subtitle}</p>
      <small>Generated: ${new Date().toLocaleString()}</small>
    </div>
  </div>
`;

const getPrintStyles = (paperSize = 'A4') => {
  const cfg = PAPER_CONFIGS[paperSize] || PAPER_CONFIGS.A4;
  const isThermal = paperSize === '80mm';

  return `
    <style>
      @page { size: ${cfg.pageRule}; margin: ${isThermal ? '4mm' : '10mm'}; }
      * { box-sizing: border-box; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; }
      body {
        margin: 0 auto;
        padding: ${cfg.padding};
        max-width: ${cfg.maxWidth};
        background: #ffffff;
        font-size: ${isThermal ? '10px' : '12px'};
      }
      .brand-banner {
        display: flex;
        flex-direction: ${isThermal ? 'column' : 'row'};
        justify-content: space-between;
        align-items: ${isThermal ? 'flex-start' : 'center'};
        gap: 10px;
        padding: ${isThermal ? '10px' : '14px 18px'};
        background: #f8fafc;
        border: 2px solid #0f172a;
        border-top: 6px solid #ffb300;
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .logo-box { display: flex; align-items: center; gap: 10px; }
      .logo-badge {
        background: #ffb300; border: 2px solid #0f172a; border-radius: 6px;
        padding: 5px 10px; display: flex; flex-direction: column; line-height: 0.95;
        text-align: center;
      }
      .crazy, .tori {
        font-family: 'Arial Black', Impact, sans-serif; font-weight: 900;
        color: #ffffff; letter-spacing: 0.04em; font-size: ${isThermal ? '13px' : '15px'};
        text-shadow: 1.5px 1.5px 0 #0f172a, -1px -1px 0 #0f172a, 1px -1px 0 #0f172a, -1px 1px 0 #0f172a;
      }
      .tori { font-size: ${isThermal ? '14px' : '17px'}; }
      .logo-sub { display: flex; flex-direction: column; gap: 2px; }
      .logo-sub strong { font-size: ${isThermal ? '11px' : '12px'}; color: #0f172a; }
      .logo-sub span { font-size: 10px; color: #475569; }
      .report-meta { text-align: ${isThermal ? 'left' : 'right'}; }
      .report-meta h2 { margin: 0; font-size: ${isThermal ? '13px' : '15px'}; font-weight: 800; }
      .report-meta p { margin: 2px 0; font-size: 11px; font-weight: 700; color: #b45309; }
      .report-meta small { font-size: 9px; color: #64748b; }
      .kpi-row {
        display: grid;
        grid-template-columns: ${isThermal ? '1fr 1fr' : 'repeat(4, 1fr)'};
        gap: 8px;
        margin-bottom: 14px;
      }
      .kpi-box {
        padding: 8px 10px; border: 1px solid #cbd5e1;
        border-radius: 6px; background: #f8fafc;
      }
      .kpi-box span { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; }
      .kpi-box strong { font-size: ${isThermal ? '12px' : '14px'}; font-weight: 900; color: #0f172a; }
      .two-col-print {
        display: grid;
        grid-template-columns: ${isThermal ? '1fr' : '1fr 1fr'};
        gap: 14px;
      }
      h3 {
        margin: 12px 0 6px 0; font-size: ${isThermal ? '11px' : '12px'};
        text-transform: uppercase; letter-spacing: 0.04em;
        border-bottom: 1.5px solid #0f172a; padding-bottom: 4px;
      }
      table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: ${isThermal ? '10px' : '11px'}; }
      th { background: #f1f5f9; color: #0f172a; font-weight: 800; text-align: left; padding: 6px; border: 1px solid #cbd5e1; }
      td { padding: 6px; border: 1px solid #e2e8f0; vertical-align: top; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .text-danger { color: #dc2626; font-weight: 700; }
      .total-row td { background: #fef3c7; font-weight: 800; border-top: 2px solid #0f172a; }
      @media print { body { padding: 0; } }
    </style>
  `;
};

const openPDFWindow = (title, bodyHTML, paperSize = 'A4') => {
  const printWin = window.open('', '_blank', 'width=920,height=720');
  if (!printWin) {
    alert('Please allow pop-ups to print or save as PDF.');
    return;
  }
  printWin.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title} - Crazy Tori POS</title>
        ${getPrintStyles(paperSize)}
      </head>
      <body>
        ${bodyHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 250);
          };
        </script>
      </body>
    </html>
  `);
  printWin.document.close();
};

const downloadExcelFile = (filename, title, subtitle, tableHTML) => {
  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt; }
          .brand-head { background-color: #ffb300; color: #111827; font-weight: bold; font-size: 14pt; text-align: left; padding: 10px; border: 1px solid #111827; }
          .sub-head { background-color: #f8fafc; color: #334155; font-weight: bold; font-size: 10pt; padding: 6px; border: 1px solid #cbd5e1; }
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #0f172a; }
          td { padding: 6px 8px; border: 1px solid #cbd5e1; }
          .total-cell { background-color: #fef3c7; font-weight: bold; border-top: 2px solid #0f172a; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="6" class="brand-head">CRAZY TORI (チキンポッパー) — CDU BRANCH</td></tr>
          <tr><td colspan="6" class="sub-head">${title} • ${subtitle} (Generated: ${new Date().toLocaleString()})</td></tr>
          <tr><td colspan="6"></td></tr>
        </table>
        ${tableHTML}
      </body>
    </html>
  `;
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${getTodayStr()}.xls`;
  a.click();
  URL.revokeObjectURL(url);
};

// 1. EXPORT DSR & MONTHLY P&L REPORT (PDF WITH PAPER SIZE OR EXCEL)
export const exportDSRAndPnLReport = (data, format = 'pdf', paperSize = 'A4') => {
  const {
    activeDate,
    activeMonth,
    itemizedMap = {},
    totalItemsSold = 0,
    dailyOrderCount = 0,
    totalGCash = 0,
    gcashCount = 0,
    totalCash = 0,
    cashCount = 0,
    grossDailySales = 0,
    dailyExps = [],
    totalDailyExpenses = 0,
    netDailyRevenue = 0,
    monthlyOrderCount = 0,
    monthlyCash = 0,
    monthlyGCash = 0,
    monthlyRevenue = 0,
    expDailyStore = 0,
    expFixedOverhead = 0,
    expMajorOps = 0,
    monthlyExpenses = 0,
    monthlyNetProfit = 0,
    profitMargin = '0.0'
  } = data;

  const itemRows = Object.entries(itemizedMap).map(([name, info]) => `
    <tr>
      <td>${name}</td>
      <td class="text-center">${info.qty}</td>
      <td class="text-right">₱${info.revenue.toFixed(2)}</td>
    </tr>
  `).join('');

  const expRows = dailyExps.map(e => `
    <tr>
      <td colspan="2">• ${e.description}</td>
      <td class="text-right text-danger">-₱${Number(e.amount || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const dsrTableHTML = `
    <h3>Daily Sales Report (DSR — ${activeDate})</h3>
    <table>
      <thead>
        <tr><th>1. Itemized Sales (${dailyOrderCount} Orders)</th><th class="text-center">Qty (${totalItemsSold})</th><th class="text-right">Sales</th></tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="3">No sales on this date.</td></tr>'}
        <tr><td colspan="2"><strong>2. GCash Result (${gcashCount})</strong></td><td class="text-right">₱${totalGCash.toFixed(2)}</td></tr>
        <tr><td colspan="2"><strong>3. Cash on Hand (${cashCount})</strong></td><td class="text-right">₱${totalCash.toFixed(2)}</td></tr>
        <tr><td colspan="2"><strong>Gross Daily Sales</strong></td><td class="text-right"><strong>₱${grossDailySales.toFixed(2)}</strong></td></tr>
        <tr><td colspan="2"><strong>4. Daily Expenses (${dailyExps.length})</strong></td><td class="text-right text-danger">-₱${totalDailyExpenses.toFixed(2)}</td></tr>
        ${expRows}
        <tr class="total-row">
          <td colspan="2" class="total-cell">5. NET DAILY SALES</td>
          <td class="text-right total-cell">₱${netDailyRevenue.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `;

  const pnlTableHTML = `
    <h3>Monthly Profit & Loss (P&L — ${activeMonth})</h3>
    <table>
      <thead>
        <tr><th colspan="2">Monthly Statement (${monthlyOrderCount} Orders)</th><th class="text-right">Amount</th></tr>
      </thead>
      <tbody>
        <tr><td colspan="2">Physical Cash Sales</td><td class="text-right">₱${monthlyCash.toFixed(2)}</td></tr>
        <tr><td colspan="2">GCash Digital Sales</td><td class="text-right">₱${monthlyGCash.toFixed(2)}</td></tr>
        <tr><td colspan="2"><strong>Total Gross Revenue</strong></td><td class="text-right"><strong>₱${monthlyRevenue.toFixed(2)}</strong></td></tr>
        <tr><td colspan="2">Daily Store Expenses</td><td class="text-right text-danger">-₱${expDailyStore.toFixed(2)}</td></tr>
        <tr><td colspan="2">Fixed Monthly Overhead</td><td class="text-right text-danger">-₱${expFixedOverhead.toFixed(2)}</td></tr>
        <tr><td colspan="2">Major Operational Costs</td><td class="text-right text-danger">-₱${expMajorOps.toFixed(2)}</td></tr>
        <tr><td colspan="2"><strong>Total Monthly Expenses</strong></td><td class="text-right text-danger"><strong>-₱${monthlyExpenses.toFixed(2)}</strong></td></tr>
        <tr class="total-row">
          <td colspan="2" class="total-cell">NET MONTHLY PROFIT (Margin: ${profitMargin}%)</td>
          <td class="text-right total-cell">₱${monthlyNetProfit.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `;

  if (format === 'excel') {
    downloadExcelFile(
      `crazy-tori-dsr-pnl-${activeDate}`,
      `DSR (${activeDate}) & Monthly P&L (${activeMonth})`,
      `Net Daily: PHP ${netDailyRevenue.toFixed(2)} | Monthly Profit: PHP ${monthlyNetProfit.toFixed(2)}`,
      dsrTableHTML + '<br/>' + pnlTableHTML
    );
  } else {
    const kpiHTML = `
      <div class="kpi-row">
        <div class="kpi-box"><span>DSR Date</span><strong>${activeDate}</strong></div>
        <div class="kpi-box"><span>Net Daily Sales</span><strong>₱${netDailyRevenue.toFixed(2)}</strong></div>
        <div class="kpi-box"><span>P&L Month</span><strong>${activeMonth}</strong></div>
        <div class="kpi-box"><span>Monthly Net Profit</span><strong>₱${monthlyNetProfit.toFixed(2)}</strong></div>
      </div>
    `;
    const layoutHTML = `<div class="two-col-print"><div>${dsrTableHTML}</div><div>${pnlTableHTML}</div></div>`;
    openPDFWindow(
      `DSR & P&L (${activeDate})`,
      buildBrandHeaderHTML('DSR & Monthly P&L Report', `Date: ${activeDate} • Month: ${activeMonth} (${paperSize})`) + kpiHTML + layoutHTML,
      paperSize
    );
  }
};

// 2. EXPORT SALES TRANSACTIONS (PDF or EXCEL)
export const exportSalesReport = (transactions = [], format = 'pdf', paperSize = 'A4') => {
  const totalRev = transactions.reduce((s, t) => s + Number(t.total || 0), 0);
  const cashTotal = transactions.filter(t => t.paymentMethod === 'Cash').reduce((s, t) => s + Number(t.total || 0), 0);
  const gcashTotal = transactions.filter(t => t.paymentMethod === 'GCash').reduce((s, t) => s + Number(t.total || 0), 0);

  const rowsHTML = transactions.map(t => {
    const items = (t.items || []).map(i => `${i.qty || i.quantity || 1}x ${i.name}${i.size ? ` (${i.size})` : ''}`).join(', ');
    return `
      <tr>
        <td>${t.id}</td>
        <td>${t.date ? new Date(t.date).toLocaleString() : '-'}</td>
        <td>#${t.servingNo || 1}</td>
        <td>${t.paymentMethod}${t.referenceNo ? ` (Ref: ${t.referenceNo})` : ''}</td>
        <td>${items}</td>
        <td class="text-right">₱${Number(t.total || 0).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const tableHTML = `
    <table>
      <thead>
        <tr><th>Order ID</th><th>Date & Time</th><th>Serving</th><th>Payment</th><th>Ordered Items</th><th class="text-right">Total</th></tr>
      </thead>
      <tbody>
        ${rowsHTML || '<tr><td colspan="6">No sales records.</td></tr>'}
        <tr class="total-row">
          <td colspan="5" class="total-cell">TOTAL SALES (${transactions.length} Orders)</td>
          <td class="text-right total-cell">₱${totalRev.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `;

  if (format === 'excel') {
    downloadExcelFile('crazy-tori-sales', 'Sales Transactions Report', `${transactions.length} Orders`, tableHTML);
  } else {
    const kpiHTML = `
      <div class="kpi-row">
        <div class="kpi-box"><span>Total Orders</span><strong>${transactions.length}</strong></div>
        <div class="kpi-box"><span>Cash Sales</span><strong>₱${cashTotal.toFixed(2)}</strong></div>
        <div class="kpi-box"><span>GCash Sales</span><strong>₱${gcashTotal.toFixed(2)}</strong></div>
        <div class="kpi-box"><span>Gross Revenue</span><strong>₱${totalRev.toFixed(2)}</strong></div>
      </div>
    `;
    openPDFWindow('Sales Transactions Backup', buildBrandHeaderHTML('Sales Transactions Report', 'All Recorded Orders') + kpiHTML + tableHTML, paperSize);
  }
};

// 3. EXPORT EXPENSES REPORT (PDF or EXCEL)
export const exportExpensesReport = (expenses = [], format = 'pdf', paperSize = 'A4') => {
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const rowsHTML = expenses.map(e => `
    <tr>
      <td>${e.id}</td>
      <td>${e.date ? e.date.split('T')[0] : '-'}</td>
      <td>${e.category ? e.category.split(' (')[0] : 'Expense'}</td>
      <td>${e.description}</td>
      <td>${e.loggedBy || 'Admin'}</td>
      <td class="text-right text-danger">-₱${Number(e.amount || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const tableHTML = `
    <table>
      <thead>
        <tr><th>ID</th><th>Date</th><th>Category Tier</th><th>Item / Description</th><th>Logged By</th><th class="text-right">Amount</th></tr>
      </thead>
      <tbody>
        ${rowsHTML || '<tr><td colspan="6">No expense records.</td></tr>'}
        <tr class="total-row">
          <td colspan="5" class="total-cell">TOTAL EXPENSES (${expenses.length} Items)</td>
          <td class="text-right text-danger total-cell">-₱${totalExp.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `;

  if (format === 'excel') {
    downloadExcelFile('crazy-tori-expenses', 'Store Expenses Audit Report', `${expenses.length} Entries`, tableHTML);
  } else {
    openPDFWindow('Expenses Backup Report', buildBrandHeaderHTML('Store Expenses Report', `${expenses.length} Recorded Outflows`) + tableHTML, paperSize);
  }
};

// 4. EXPORT FULL STORE BACKUP REPORT (PDF OR EXCEL)
export const exportFullBackupReport = ({ transactions = [], expenses = [], products = [] }, format = 'pdf', paperSize = 'A4') => {
  const totalSales = transactions.reduce((s, t) => s + Number(t.total || 0), 0);
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netProfit = totalSales - totalExp;

  const salesRows = transactions.map(t => {
    const items = (t.items || []).map(i => `${i.qty || 1}x ${i.name}`).join(', ');
    return `<tr><td>${t.id}</td><td>${t.date ? t.date.split('T')[0] : '-'}</td><td>${t.paymentMethod}</td><td>${items}</td><td class="text-right">₱${Number(t.total || 0).toFixed(2)}</td></tr>`;
  }).join('');

  const expRows = expenses.map(e => `
    <tr><td>${e.date ? e.date.split('T')[0] : '-'}</td><td>${e.category ? e.category.split(' (')[0] : ''}</td><td>${e.description}</td><td class="text-right text-danger">-₱${Number(e.amount || 0).toFixed(2)}</td></tr>
  `).join('');

  const combinedTables = `
    <h3>1. Sales Summary (${transactions.length} Orders)</h3>
    <table>
      <thead><tr><th>Order ID</th><th>Date</th><th>Payment</th><th>Items</th><th class="text-right">Total</th></tr></thead>
      <tbody>
        ${salesRows || '<tr><td colspan="5">No sales recorded.</td></tr>'}
        <tr class="total-row"><td colspan="4" class="total-cell">GROSS SALES</td><td class="text-right total-cell">₱${totalSales.toFixed(2)}</td></tr>
      </tbody>
    </table>
    <h3>2. Expenses Summary (${expenses.length} Entries)</h3>
    <table>
      <thead><tr><th>Date</th><th>Category</th><th>Description</th><th class="text-right">Amount</th></tr></thead>
      <tbody>
        ${expRows || '<tr><td colspan="4">No expenses recorded.</td></tr>'}
        <tr class="total-row"><td colspan="3" class="total-cell">TOTAL EXPENSES</td><td class="text-right text-danger total-cell">-₱${totalExp.toFixed(2)}</td></tr>
      </tbody>
    </table>
  `;

  if (format === 'excel') {
    downloadExcelFile('crazy-tori-full-backup', 'Complete Store Backup (Sales & Expenses)', `Net Profit: PHP ${netProfit.toFixed(2)}`, combinedTables);
  } else {
    const kpiHTML = `
      <div class="kpi-row">
        <div class="kpi-box"><span>Gross Sales</span><strong>₱${totalSales.toFixed(2)}</strong></div>
        <div class="kpi-box"><span>Total Expenses</span><strong>-₱${totalExp.toFixed(2)}</strong></div>
        <div class="kpi-box"><span>Net Profit</span><strong>₱${netProfit.toFixed(2)}</strong></div>
        <div class="kpi-box"><span>Active Menu</span><strong>${products.length} Items</strong></div>
      </div>
    `;
    openPDFWindow('Crazy Tori Full Store Backup', buildBrandHeaderHTML('Full Store Backup Report', 'Sales, Expenses & Net Summary') + kpiHTML + combinedTables, paperSize);
  }
};