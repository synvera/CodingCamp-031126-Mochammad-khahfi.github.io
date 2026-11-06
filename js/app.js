// =============================================
//  Expense & Budget Visualizer — app.js
// =============================================

// ---------------------------------------------------------------------------
// Cross-browser polyfill — crypto.randomUUID()
// crypto.randomUUID() is supported in Chrome 92+, Firefox 95+, Edge 92+,
// and Safari 15.4+. For older Safari versions we fall back to a UUID v4
// implementation built on crypto.getRandomValues(), which has much broader
// support (Safari 11+).
// ---------------------------------------------------------------------------

if (typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = function randomUUID() {
    // Generate 16 random bytes
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set the version bits (version 4: 0100xxxx)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set the variant bits (10xxxxxx)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    // Format as xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'));
    return (
      hex.slice(0, 4).join('') + '-' +
      hex.slice(4, 6).join('') + '-' +
      hex.slice(6, 8).join('') + '-' +
      hex.slice(8, 10).join('') + '-' +
      hex.slice(10, 16).join('')
    );
  };
}

// ---------------------------------------------------------------------------
// State model
// ---------------------------------------------------------------------------

const defaultState = {
  budget: 0,
  spendingLimit: null,
  transactions: [],          // { id: string, name: string, amount: number, category: string, createdAt: number }[]
  categories: ['Food', 'Transport', 'Fun'],
};

const state = {
  budget: 0,
  spendingLimit: null,
  transactions: [],
  categories: ['Food', 'Transport', 'Fun'],
};

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ebv_state';

/**
 * Serialise current state to localStorage.
 * Called after every mutation.
 */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Parse stored JSON from localStorage and merge over defaults.
 * Silently falls back to default state if stored data is absent or malformed.
 * Called once on DOMContentLoaded.
 */
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  } catch (e) {
    // Parsing failed — keep default state, no crash
  }
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/**
 * Populate the <select id="category"> element from state.categories.
 * Preserves the currently selected value if it still exists in the updated list.
 */
function renderCategoryDropdown() {
  const select = document.getElementById('category');
  if (!select) return;

  const previousValue = select.value;

  // Clear existing options
  select.innerHTML = '';

  // Populate from state.categories
  state.categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  // Restore previously selected value if it still exists
  if (previousValue && state.categories.includes(previousValue)) {
    select.value = previousValue;
  }
}

// ---------------------------------------------------------------------------
// Sort preference (module-level, not persisted — used by Task 10)
// ---------------------------------------------------------------------------

let currentSort = 'latest';

/**
 * Handle sort select change.
 * Reads the selected value from #sort-select, stores it in currentSort,
 * then re-renders the transaction list.
 */
function handleSortChange() {
  const sortSelect = document.getElementById('sort-select');
  if (!sortSelect) return;
  currentSort = sortSelect.value;
  renderTransactionList();
}

// ---------------------------------------------------------------------------
// Chart.js instance (module-level)
// ---------------------------------------------------------------------------

let chartInstance = null;

// ---------------------------------------------------------------------------
// Transaction list rendering and delete
// ---------------------------------------------------------------------------

/**
 * Format a number as a currency string (USD).
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/**
 * Sort a copy of state.transactions according to currentSort.
 * @returns {Array} sorted transaction array
 */
function getSortedTransactions() {
  const txns = [...state.transactions];
  switch (currentSort) {
    case 'oldest':
      return txns.sort((a, b) => a.createdAt - b.createdAt);
    case 'amount-desc':
      return txns.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':
      return txns.sort((a, b) => a.amount - b.amount);
    case 'category-az':
      return txns.sort((a, b) => a.category.localeCompare(b.category));
    case 'latest':
    default:
      return txns.sort((a, b) => b.createdAt - a.createdAt);
  }
}

/**
 * Compute per-category spending totals from state.transactions.
 * @returns {Object} map of category → total amount
 */
function computeCategoryTotals() {
  return state.transactions.reduce((totals, txn) => {
    totals[txn.category] = (totals[txn.category] || 0) + txn.amount;
    return totals;
  }, {});
}

/**
 * Render the transaction list into <ul id="transaction-list">.
 * - Shows an empty-state message when no transactions exist.
 * - Applies CSS class `transaction--over-limit` when the item's category
 *   total exceeds state.spendingLimit (only when spendingLimit is not null).
 */
function renderTransactionList() {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  // Sync sort select to reflect currentSort default
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.value = currentSort;
  }

  // Clear existing items
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  // Empty state
  if (state.transactions.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = 'No transactions yet.';
    list.appendChild(emptyItem);
    return;
  }

  // Pre-compute per-category totals for limit highlighting
  const categoryTotals = computeCategoryTotals();

  getSortedTransactions().forEach((transaction) => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.id = transaction.id;

    // Apply over-limit highlight when spendingLimit is set
    if (
      state.spendingLimit !== null &&
      categoryTotals[transaction.category] > state.spendingLimit
    ) {
      li.classList.add('transaction--over-limit');
    }

    // Name span
    const nameSpan = document.createElement('span');
    nameSpan.className = 'transaction-name';
    nameSpan.textContent = transaction.name;

    // Amount span
    const amountSpan = document.createElement('span');
    amountSpan.className = 'transaction-amount';
    amountSpan.textContent = formatCurrency(transaction.amount);

    // Category badge
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = transaction.category;

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn--delete';
    deleteBtn.setAttribute('aria-label', 'Delete transaction');
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => {
      handleDeleteTransaction(transaction.id);
    });

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categoryBadge);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

/**
 * Remove a transaction from state by id, persist, and re-render.
 * @param {string} id - The transaction id to remove
 */
function handleDeleteTransaction(id) {
  state.transactions = state.transactions.filter((txn) => txn.id !== id);
  saveState();
  render();
}

// ---------------------------------------------------------------------------
// Budget and balance
// ---------------------------------------------------------------------------

/**
 * Read the budget input, clamp invalid values to 0, persist, and re-render.
 * Triggered by the "Set Budget" button click and the budget input blur event.
 */
function handleSetBudget() {
  const budgetInput = document.getElementById('budget-input');
  if (!budgetInput) return;

  const parsed = parseFloat(budgetInput.value);
  // Clamp: NaN or negative → 0
  state.budget = (!isNaN(parsed) && parsed >= 0) ? parsed : 0;

  saveState();
  render();
}

/**
 * Compute and display the current balance.
 * balance = state.budget − sum of all transaction amounts
 * Adds CSS class `balance--negative` when balance < 0; removes it otherwise.
 * Also syncs the budget input field so the stored value is visible on reload.
 */
function renderBalance() {
  const balanceDisplay = document.getElementById('balance-display');
  if (!balanceDisplay) return;

  const totalExpenditure = state.transactions.reduce(
    (sum, txn) => sum + txn.amount,
    0
  );
  const balance = state.budget - totalExpenditure;

  balanceDisplay.textContent = formatCurrency(balance);

  if (balance < 0) {
    balanceDisplay.classList.add('balance--negative');
  } else {
    balanceDisplay.classList.remove('balance--negative');
  }

  // Keep the budget input in sync with persisted state
  const budgetInput = document.getElementById('budget-input');
  if (budgetInput) {
    budgetInput.value = state.budget;
  }

  // Keep the spending limit input in sync with persisted state
  const limitInput = document.getElementById('limit-input');
  if (limitInput) {
    limitInput.value = state.spendingLimit ?? '';
  }
}

// ---------------------------------------------------------------------------
// Chart rendering
// ---------------------------------------------------------------------------

/**
 * Colour palette used for pie chart slices (at least 8 distinct colours).
 */
const CHART_COLOURS = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#84cc16', // lime
];

/**
 * Render or update the Chart.js Pie chart in <canvas id="spending-chart">.
 *
 * Behaviour:
 * - No transactions: destroy any existing chart, show #chart-placeholder, hide canvas.
 * - Transactions exist: aggregate per-category totals, hide placeholder, show canvas.
 *   - If chartInstance exists: update data in-place and call chartInstance.update().
 *   - Otherwise: create a new Chart instance.
 * - Slices for categories whose total exceeds state.spendingLimit are marked with
 *   a red border (#ef4444).
 * - If Chart.js failed to load from CDN, shows a fallback message in the placeholder.
 */
function renderChart() {
  const canvas = document.getElementById('spending-chart');
  const placeholder = document.getElementById('chart-placeholder');
  if (!canvas || !placeholder) return;

  // No transactions — destroy chart and show placeholder
  if (state.transactions.length === 0) {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    canvas.style.display = 'none';
    placeholder.removeAttribute('hidden');
    placeholder.style.display = '';
    return;
  }

  // Check Chart.js availability (CDN may have failed to load)
  if (typeof Chart === 'undefined') {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    canvas.style.display = 'none';
    placeholder.removeAttribute('hidden');
    placeholder.style.display = '';
    placeholder.textContent = 'Chart unavailable — could not load Chart.js.';
    return;
  }

  // Transactions exist — show canvas, hide placeholder
  placeholder.setAttribute('hidden', '');
  placeholder.style.display = 'none';
  canvas.style.display = '';

  // Aggregate per-category totals
  const categoryTotals = computeCategoryTotals();
  const labels = Object.keys(categoryTotals);
  const data = labels.map((cat) => categoryTotals[cat]);

  // Assign background colours from palette (wrap around if more categories than colours)
  const backgroundColors = labels.map((_, i) => CHART_COLOURS[i % CHART_COLOURS.length]);

  // Determine border colours — red for over-limit categories, transparent otherwise
  const borderColors = labels.map((cat) => {
    if (
      state.spendingLimit !== null &&
      categoryTotals[cat] > state.spendingLimit
    ) {
      return '#ef4444';
    }
    return 'transparent';
  });

  const borderWidths = labels.map((cat) => {
    if (
      state.spendingLimit !== null &&
      categoryTotals[cat] > state.spendingLimit
    ) {
      return 3;
    }
    return 1;
  });

  if (chartInstance) {
    // Update existing chart in-place to avoid flicker
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.data.datasets[0].backgroundColor = backgroundColors;
    chartInstance.data.datasets[0].borderColor = borderColors;
    chartInstance.data.datasets[0].borderWidth = borderWidths;
    chartInstance.update();
  } else {
    // Create new Chart instance
    chartInstance = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: borderWidths,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                return ` ${context.label}: ${formatCurrency(value)}`;
              },
            },
          },
        },
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Spending limit
// ---------------------------------------------------------------------------

/**
 * Read the spending limit input, validate, persist, and re-render.
 * - Empty, NaN, or <= 0 → set state.spendingLimit to null (clears the limit).
 * - Valid positive number → set state.spendingLimit to the parsed float.
 */
function handleSetLimit() {
  const limitInput = document.getElementById('limit-input');
  if (!limitInput) return;

  const raw = limitInput.value;
  const parsed = parseFloat(raw);

  if (raw === '' || isNaN(parsed) || parsed <= 0) {
    state.spendingLimit = null;
  } else {
    state.spendingLimit = parsed;
  }

  saveState();
  render();
}

// ---------------------------------------------------------------------------
// Spending limit warning (stub — filled in Task 12)
// ---------------------------------------------------------------------------

/**
 * Show/hide the spending limit warning banner.
 * - Shows #limit-warning when state.spendingLimit is set AND total expenditure exceeds it.
 * - Hides it otherwise.
 */
function renderLimitWarning() {
  const banner = document.getElementById('limit-warning');
  if (!banner) return;

  // Sum all transaction amounts
  const totalExpenditure = state.transactions.reduce(
    (sum, txn) => sum + txn.amount,
    0
  );

  if (state.spendingLimit !== null && totalExpenditure > state.spendingLimit) {
    // Show the banner
    banner.removeAttribute('hidden');
    banner.style.display = '';
  } else {
    // Hide the banner
    banner.setAttribute('hidden', '');
    banner.style.display = 'none';
  }
}

// ---------------------------------------------------------------------------
// Master render
// ---------------------------------------------------------------------------

/**
 * Re-render all UI components from current state.
 * Call this after every state mutation.
 */
function render() {
  renderBalance();
  renderTransactionList();
  renderChart();
  renderLimitWarning();
  renderCategoryDropdown();
}

// ---------------------------------------------------------------------------
// Form validation and add-transaction logic
// ---------------------------------------------------------------------------

/**
 * Display a validation error message under a field.
 * @param {string} errorElementId - ID of the <span class="field-error"> element
 * @param {string} message - Error text to display
 */
function showFieldError(errorElementId, message) {
  const el = document.getElementById(errorElementId);
  if (!el) return;
  el.textContent = message;
}

/**
 * Clear all field-level validation errors before each submit attempt.
 */
function clearFieldErrors() {
  ['item-name-error', 'amount-error', 'category-error'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

/**
 * Validate the add-transaction form fields.
 * Returns true if all fields pass; false otherwise.
 * Sets inline error messages for any failing fields.
 *
 * @param {string} name    - Trimmed item name value
 * @param {string} rawAmount - Raw string from the amount input
 * @param {string} category - Selected category value
 * @returns {boolean} Whether all fields are valid
 */
function validateTransactionForm(name, rawAmount, category) {
  let valid = true;

  // Item Name: required, non-empty after trim, max 100 chars
  if (!name) {
    showFieldError('item-name-error', 'Item name is required.');
    valid = false;
  } else if (name.length > 100) {
    showFieldError('item-name-error', 'Item name must be 100 characters or fewer.');
    valid = false;
  }

  // Amount: required, numeric, > 0
  const amount = parseFloat(rawAmount);
  if (rawAmount === '' || rawAmount === null || rawAmount === undefined) {
    showFieldError('amount-error', 'Amount is required.');
    valid = false;
  } else if (isNaN(amount) || amount <= 0) {
    showFieldError('amount-error', 'Amount must be a number greater than 0.');
    valid = false;
  }

  // Category: required, must be one of state.categories
  if (!category || !state.categories.includes(category)) {
    showFieldError('category-error', 'Please select a valid category.');
    valid = false;
  }

  return valid;
}

/**
 * Handle add-transaction form submission.
 * Validates input, builds a transaction object, updates state, and re-renders.
 *
 * @param {Event} event - The form submit event
 */
function handleAddTransaction(event) {
  event.preventDefault();

  // Clear all field errors at the start of each submit attempt
  clearFieldErrors();

  const nameInput = document.getElementById('item-name');
  const amountInput = document.getElementById('amount');
  const categoryInput = document.getElementById('category');

  const name = nameInput ? nameInput.value.trim() : '';
  const rawAmount = amountInput ? amountInput.value.trim() : '';
  const category = categoryInput ? categoryInput.value : '';

  // Run validation — abort if any field fails
  if (!validateTransactionForm(name, rawAmount, category)) {
    return;
  }

  // Build transaction object
  const transaction = {
    id: crypto.randomUUID(),
    name,
    amount: parseFloat(rawAmount),
    category,
    createdAt: Date.now(),
  };

  // Mutate state
  state.transactions.push(transaction);
  saveState();
  render();

  // Reset the form fields
  if (nameInput) nameInput.value = '';
  if (amountInput) amountInput.value = '';
  // Leave category at its current selection (common UX pattern for expense entry)
}

// ---------------------------------------------------------------------------
// Custom categories
// ---------------------------------------------------------------------------

/**
 * Handle adding a custom category.
 * - Trims the input value.
 * - Rejects empty values with an inline error.
 * - Rejects duplicates (case-insensitive) with an inline error.
 * - On success: pushes to state.categories, saves, re-renders, clears input and error.
 */
function handleAddCategory() {
  const categoryInput = document.getElementById('category-input');
  const categoryError = document.getElementById('category-input-error');

  if (!categoryInput || !categoryError) return;

  const trimmed = categoryInput.value.trim();

  // Clear previous error
  categoryError.textContent = '';

  // Validate: non-empty
  if (!trimmed) {
    categoryError.textContent = 'Category name cannot be empty.';
    return;
  }

  // Validate: no duplicate (case-insensitive)
  const isDuplicate = state.categories.some(
    (cat) => cat.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDuplicate) {
    categoryError.textContent = 'Category already exists.';
    return;
  }

  // Success: add category, persist, re-render, reset input
  state.categories.push(trimmed);
  saveState();
  render();
  categoryInput.value = '';
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  render();

  // Wire up form submission
  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', handleAddTransaction);
  }

  // Wire up budget button (click) and budget input (blur)
  const setBudgetBtn = document.getElementById('set-budget-btn');
  if (setBudgetBtn) {
    setBudgetBtn.addEventListener('click', handleSetBudget);
  }

  const budgetInput = document.getElementById('budget-input');
  if (budgetInput) {
    budgetInput.addEventListener('blur', handleSetBudget);
  }

  // Wire up add category button
  const addCategoryBtn = document.getElementById('add-category-btn');
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', handleAddCategory);
  }

  // Wire up spending limit button
  const setLimitBtn = document.getElementById('set-limit-btn');
  if (setLimitBtn) {
    setLimitBtn.addEventListener('click', handleSetLimit);
  }

  // Wire up sort select
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', handleSortChange);
  }
});
