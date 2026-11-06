/**
 * Expense & Budget Visualizer
 * Vanilla JS — Local Storage, Chart.js
 *
 * Optional Challenges implemented:
 *  1. Allow users to add custom categories
 *  2. Sort transactions by amount or category
 *  3. Highlight spending over a set limit
 */

/* ============================================================
   State
   ============================================================ */
let transactions = [];
let customCategories = [];
let spendingLimit = 0;
let chart = null;

/* Chart colors per category (default + extras) */
const CATEGORY_COLORS = {
  Food:      '#4caf50',
  Transport: '#2196f3',
  Fun:       '#ff9800',
};
const EXTRA_COLORS = [
  '#9c27b0', '#f44336', '#00bcd4', '#795548',
  '#607d8b', '#e91e63', '#3f51b5', '#009688',
];

/* ============================================================
   DOM References
   ============================================================ */
const totalBalanceEl   = document.getElementById('totalBalance');
const limitAlertEl     = document.getElementById('limitAlert');
const limitDisplayEl   = document.getElementById('limitDisplay');
const transactionForm  = document.getElementById('transactionForm');
const itemNameInput    = document.getElementById('itemName');
const amountInput      = document.getElementById('amount');
const categorySelect   = document.getElementById('category');
const spendingLimitInput = document.getElementById('spendingLimit');
const transactionList  = document.getElementById('transactionList');
const emptyStateEl     = document.getElementById('emptyState');
const sortSelect       = document.getElementById('sortSelect');

// Custom category elements
const toggleCustomCategoryBtn = document.getElementById('toggleCustomCategory');
const customCategoryInputDiv  = document.getElementById('customCategoryInput');
const newCategoryNameInput    = document.getElementById('newCategoryName');
const addCategoryBtn          = document.getElementById('addCategoryBtn');

// Error elements
const nameError     = document.getElementById('nameError');
const amountError   = document.getElementById('amountError');
const categoryError = document.getElementById('categoryError');

// Chart
const spendingChartCanvas = document.getElementById('spendingChart');
const emptyChartEl        = document.getElementById('emptyChart');

/* ============================================================
   Local Storage Helpers
   ============================================================ */
function saveToStorage() {
  localStorage.setItem('ebv_transactions', JSON.stringify(transactions));
  localStorage.setItem('ebv_customCategories', JSON.stringify(customCategories));
  localStorage.setItem('ebv_spendingLimit', String(spendingLimit));
}

function loadFromStorage() {
  const savedTx  = localStorage.getItem('ebv_transactions');
  const savedCat = localStorage.getItem('ebv_customCategories');
  const savedLim = localStorage.getItem('ebv_spendingLimit');

  transactions      = savedTx  ? JSON.parse(savedTx)  : [];
  customCategories  = savedCat ? JSON.parse(savedCat) : [];
  spendingLimit     = savedLim ? parseFloat(savedLim) : 0;
}

/* ============================================================
   Utilities
   ============================================================ */
function formatCurrency(value) {
  return '$' + Math.abs(value).toFixed(2);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getCategoryColor(category) {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  const idx = customCategories.indexOf(category);
  return EXTRA_COLORS[idx % EXTRA_COLORS.length] || '#9e9e9e';
}

/* ============================================================
   Validation
   ============================================================ */
function validateForm() {
  let valid = true;

  const name = itemNameInput.value.trim();
  const amt  = parseFloat(amountInput.value);
  const cat  = categorySelect.value;

  // Name
  if (!name) {
    itemNameInput.classList.add('invalid');
    nameError.classList.add('visible');
    valid = false;
  } else {
    itemNameInput.classList.remove('invalid');
    nameError.classList.remove('visible');
  }

  // Amount
  if (!amountInput.value || isNaN(amt) || amt <= 0) {
    amountInput.classList.add('invalid');
    amountError.classList.add('visible');
    valid = false;
  } else {
    amountInput.classList.remove('invalid');
    amountError.classList.remove('visible');
  }

  // Category
  if (!cat) {
    categorySelect.classList.add('invalid');
    categoryError.classList.add('visible');
    valid = false;
  } else {
    categorySelect.classList.remove('invalid');
    categoryError.classList.remove('visible');
  }

  return valid;
}

/* ============================================================
   Transactions CRUD
   ============================================================ */
function addTransaction(name, amount, category) {
  const tx = {
    id: generateId(),
    name,
    amount,
    category,
    date: Date.now(),
  };
  transactions.push(tx);
  saveToStorage();
  renderAll();
}

function deleteTransaction(id) {
  transactions = transactions.filter(tx => tx.id !== id);
  saveToStorage();
  renderAll();
}

/* ============================================================
   Sorting
   ============================================================ */
function getSortedTransactions() {
  const mode = sortSelect.value;
  const copy = [...transactions];

  switch (mode) {
    case 'date-asc':
      return copy.sort((a, b) => a.date - b.date);
    case 'date-desc':
      return copy.sort((a, b) => b.date - a.date);
    case 'amount-asc':
      return copy.sort((a, b) => a.amount - b.amount);
    case 'amount-desc':
      return copy.sort((a, b) => b.amount - a.amount);
    case 'category':
      return copy.sort((a, b) => a.category.localeCompare(b.category));
    default:
      return copy;
  }
}

/* ============================================================
   Balance & Limit Check
   ============================================================ */
function getTotalBalance() {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

function updateBalance() {
  const total = getTotalBalance();
  totalBalanceEl.textContent = formatCurrency(total);

  // Spending limit alert
  if (spendingLimit > 0 && total > spendingLimit) {
    limitDisplayEl.textContent = formatCurrency(spendingLimit);
    limitAlertEl.classList.remove('hidden');
  } else {
    limitAlertEl.classList.add('hidden');
  }
}

/* ============================================================
   Render Transaction List
   ============================================================ */
function renderTransactions() {
  const sorted = getSortedTransactions();

  // Clear list (keep emptyState node)
  transactionList.innerHTML = '';

  if (sorted.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.id = 'emptyState';
    p.textContent = 'No transactions yet. Add one above!';
    transactionList.appendChild(p);
    return;
  }

  sorted.forEach(tx => {
    const item = document.createElement('div');
    item.className = 'transaction-item';

    // Highlight if over individual spending limit
    if (spendingLimit > 0 && tx.amount > spendingLimit) {
      item.classList.add('over-limit');
    }

    item.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-name">${escapeHtml(tx.name)}</div>
        <div class="transaction-amount">${formatCurrency(tx.amount)}</div>
        <span class="transaction-badge" data-cat="${escapeHtml(tx.category)}">${escapeHtml(tx.category)}</span>
      </div>
      <button class="btn-delete" aria-label="Delete ${escapeHtml(tx.name)}">Delete</button>
    `;

    item.querySelector('.btn-delete').addEventListener('click', () => {
      deleteTransaction(tx.id);
    });

    transactionList.appendChild(item);
  });
}

/* Prevent XSS */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

/* ============================================================
   Render Chart
   ============================================================ */
function renderChart() {
  // Aggregate spending by category
  const categoryTotals = {};
  transactions.forEach(tx => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data   = Object.values(categoryTotals);
  const colors = labels.map(l => getCategoryColor(l));

  if (labels.length === 0) {
    emptyChartEl.classList.remove('hidden');
    if (chart) {
      chart.destroy();
      chart = null;
    }
    spendingChartCanvas.style.display = 'none';
    return;
  }

  emptyChartEl.classList.add('hidden');
  spendingChartCanvas.style.display = 'block';

  if (chart) {
    chart.data.labels  = labels;
    chart.data.datasets[0].data            = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
    return;
  }

  chart = new Chart(spendingChartCanvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            font: { size: 12 },
            boxWidth: 14,
          },
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const val   = ctx.parsed;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${formatCurrency(val)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

/* ============================================================
   Render All
   ============================================================ */
function renderAll() {
  updateBalance();
  renderTransactions();
  renderChart();
}

/* ============================================================
   Custom Categories
   ============================================================ */
function populateCategoryDropdown() {
  // Remove any options beyond the 3 defaults + placeholder
  while (categorySelect.options.length > 4) {
    categorySelect.remove(4);
  }

  customCategories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function addCustomCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  // Prevent duplicates (case-insensitive)
  const existing = ['Food', 'Transport', 'Fun', ...customCategories]
    .map(c => c.toLowerCase());
  if (existing.includes(trimmed.toLowerCase())) {
    alert(`Category "${trimmed}" already exists.`);
    return;
  }

  customCategories.push(trimmed);
  saveToStorage();
  populateCategoryDropdown();

  // Auto-select the new category
  categorySelect.value = trimmed;

  newCategoryNameInput.value = '';
  customCategoryInputDiv.classList.add('hidden');
  toggleCustomCategoryBtn.textContent = '+ Add Custom Category';
}

/* ============================================================
   Spending Limit
   ============================================================ */
function loadSpendingLimitInput() {
  if (spendingLimit > 0) {
    spendingLimitInput.value = spendingLimit;
  }
}

/* ============================================================
   Event Listeners
   ============================================================ */

// Form submit
transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const name     = itemNameInput.value.trim();
  const amount   = parseFloat(amountInput.value);
  const category = categorySelect.value;

  // Save spending limit if changed
  const limitVal = parseFloat(spendingLimitInput.value);
  spendingLimit  = isNaN(limitVal) || limitVal < 0 ? 0 : limitVal;

  addTransaction(name, amount, category);

  // Reset form fields (keep limit value)
  itemNameInput.value = '';
  amountInput.value   = '';
  categorySelect.value = '';
});

// Sort change
sortSelect.addEventListener('change', () => {
  renderTransactions();
});

// Toggle custom category input
toggleCustomCategoryBtn.addEventListener('click', () => {
  const isHidden = customCategoryInputDiv.classList.contains('hidden');
  if (isHidden) {
    customCategoryInputDiv.classList.remove('hidden');
    toggleCustomCategoryBtn.textContent = '− Cancel';
    newCategoryNameInput.focus();
  } else {
    customCategoryInputDiv.classList.add('hidden');
    toggleCustomCategoryBtn.textContent = '+ Add Custom Category';
    newCategoryNameInput.value = '';
  }
});

// Add custom category button
addCategoryBtn.addEventListener('click', () => {
  addCustomCategory(newCategoryNameInput.value);
});

// Allow pressing Enter in the custom category input
newCategoryNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addCustomCategory(newCategoryNameInput.value);
  }
});

// Clear validation state on input
itemNameInput.addEventListener('input', () => {
  itemNameInput.classList.remove('invalid');
  nameError.classList.remove('visible');
});

amountInput.addEventListener('input', () => {
  amountInput.classList.remove('invalid');
  amountError.classList.remove('visible');
});

categorySelect.addEventListener('change', () => {
  categorySelect.classList.remove('invalid');
  categoryError.classList.remove('visible');
});

/* ============================================================
   Init
   ============================================================ */
function init() {
  loadFromStorage();
  populateCategoryDropdown();
  loadSpendingLimitInput();
  renderAll();
}

init();
