# Design Document

## Overview
The Expense & Budget Visualizer is a single-page application (SPA) with no build step. All logic lives in `js/app.js`, all styling in `css/style.css`, and the entry point is `index.html`. State is held in memory as a plain JavaScript object and mirrored to `localStorage` on every mutation.

---

## Architecture

### File Structure
```
├── index.html          # Single HTML page, loads Chart.js CDN and links css/js
├── css/
│   └── style.css       # All styles — layout, components, responsive, states
└── js/
    └── app.js          # All logic — state, rendering, event handling, persistence
```

## Data Models

### State Object
A single `state` object is the source of truth in `app.js`:

```js
const state = {
  budget: 0,               // number — user-set initial budget
  spendingLimit: null,     // number | null — optional limit for alerts
  transactions: [],        // Transaction[]
  categories: [
    'Food & Beverage',
    'Transport',
    'Entertainment',
    'Shopping',
    'Bills & Utilities',
    'Health',
    'Education',
    'Others'
  ],                       // string[] — includes custom categories
};
```

### Transaction
```js
// { id: string, name: string, amount: number, category: string, createdAt: number }
```

State is serialised to `localStorage` under the key `ebv_state` after every mutation. On app load, stored state is parsed and merged over defaults.

---

## Components and Interfaces

All UI is rendered by plain DOM manipulation functions — no template literals injected as `innerHTML` for security-sensitive data; text nodes and `createElement` are used for dynamic content.

### `render()` — Master Render
Called after every state change. Delegates to all sub-renders:
- `renderBalance()`
- `renderTransactionList()`
- `renderChart()`
- `renderLimitWarning()`
- `renderCategoryDropdown()`

### `renderBalance()`
Computes `balance = state.budget − Σ(transactions.amount)`. Updates the balance display element. Adds a CSS class `balance--negative` when balance < 0.

### `renderTransactionList()`
Iterates `state.transactions` (sorted per current sort selection). For each item, creates a list element with name, amount, category badge, and a delete button. Adds CSS class `transaction--over-limit` when the item's category total exceeds `state.spendingLimit`.

### `renderChart()`
Aggregates spending per category from `state.transactions`. Updates or creates the Chart.js `Pie` instance. Marks slices with a distinct border colour when that category's total exceeds `state.spendingLimit`.

### `renderLimitWarning()`
Shows a warning banner when total expenditure exceeds `state.spendingLimit`. Hides it otherwise.

### `renderCategoryDropdown()`
Populates the `<select>` in the input form with `state.categories`.

---

## Event Handling

| Event | Handler | Action |
|---|---|---|
| Form `submit` | `handleAddTransaction` | Validate → create transaction → mutate state → render |
| Delete button `click` | `handleDeleteTransaction` | Remove from state.transactions → render |
| Budget field `change` | `handleSetBudget` | Update state.budget → render |
| Spending limit field `change` | `handleSetLimit` | Update state.spendingLimit → render |
| Add category `submit` | `handleAddCategory` | Validate uniqueness → push to state.categories → render |
| Sort `change` | `handleSortChange` | Update sort preference (local, not in state) → renderTransactionList |

---

## Data Persistence

```js
function saveState() {
  localStorage.setItem('ebv_state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('ebv_state');
  if (saved) Object.assign(state, JSON.parse(saved));
}
```

`loadState()` is called once on `DOMContentLoaded`. `saveState()` is called at the end of every mutation handler.

---

## Chart.js Integration

Chart.js is loaded from CDN in `index.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

A single `Chart` instance is stored in a module-level variable `chartInstance`. On each `renderChart()` call:
1. If no transactions exist, destroy any existing chart and show the placeholder.
2. Otherwise, aggregate `{ category → total }` from `state.transactions`.
3. If `chartInstance` exists, update `chartInstance.data` and call `chartInstance.update()`.
4. If not, create a new `Chart` on the canvas element.

---

## Validation Rules

| Field | Rule |
|---|---|
| Item Name | Required, non-empty after trim, max 100 chars |
| Amount | Required, numeric, > 0 |
| Category | Required, must be one of `state.categories` |
| Budget | Numeric, ≥ 0 |
| Spending Limit | Numeric, > 0 (or clear to disable) |
| Custom Category | Non-empty, not duplicate (case-insensitive), max 50 chars |

Validation errors are shown as `<span class="field-error">` immediately below the offending field. Errors are cleared on next valid submit.

---

## Spending Limit Logic

```
perCategoryTotal[category] = Σ amount where transaction.category === category
totalExpenditure = Σ all transaction amounts

// Per-category highlight
if (perCategoryTotal[category] > spendingLimit) → mark transactions of that category

// Global warning
if (totalExpenditure > spendingLimit) → show warning banner
```

Both checks run inside `render()` on every state change.

---

## Error Handling

- **Form validation errors** are shown as `<span class="field-error">` immediately below the offending field. They are cleared on the next submission attempt.
- **LocalStorage parse errors** are caught with try/catch; if parsing fails, the app silently uses default state rather than crashing.
- **Chart.js unavailable** (CDN load failure): the chart container shows a fallback message; the rest of the app remains functional.

---

## Responsive Layout Strategy

- Single-column layout on mobile (≤ 600 px): form → balance → chart → list stacked vertically.
- Two-column layout on desktop (> 600 px): left column = form + settings; right column = balance + chart + list.
- CSS custom properties for colours, spacing, and typography to keep consistency.

---

## Correctness Properties

Property 1: Balance Accuracy — For any set of N transactions with amounts a₁…aₙ and budget B, `renderBalance()` SHALL display exactly `B − (a₁ + … + aₙ)`.
**Validates: Requirements 3.2**

Property 2: List Completeness — After every `render()`, the number of `<li>` elements in the transaction list SHALL equal `state.transactions.length`.
**Validates: Requirements 2.1**

Property 3: Chart Consistency — The sum of all pie chart segment values SHALL equal the total expenditure computed from `state.transactions`.
**Validates: Requirements 4.1, 4.2**

Property 4: Persistence Round-Trip — Any state serialised by `saveState()` and immediately deserialised by `loadState()` SHALL produce a state object deeply equal to the original.
**Validates: Requirements 8.1, 8.2**

Property 5: Limit Invariant — If `spendingLimit` is null, no transaction SHALL be highlighted and no warning banner SHALL be visible regardless of transaction amounts.
**Validates: Requirements 7.2, 7.3**
