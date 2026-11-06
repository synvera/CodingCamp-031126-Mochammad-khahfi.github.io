# Implementation Plan: Expense & Budget Visualizer

## Overview
14 tasks covering scaffold, state/persistence, MVP features (form, list, balance, chart), and the three optional challenges (custom categories, sort, spending limit). Tasks are sequenced so each builds on the previous.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3", "5", "6", "7"] },
    { "wave": 4, "tasks": ["4", "8"] },
    { "wave": 5, "tasks": ["9", "10", "11"] },
    { "wave": 6, "tasks": ["12"] },
    { "wave": 7, "tasks": ["13"] },
    { "wave": 8, "tasks": ["14"] }
  ]
}
```

## Tasks

- [x] 1. Project scaffold — create `index.html`, `css/style.css`, `js/app.js`
  - Create `index.html` with semantic structure: header (app title + balance display), main (input form, settings panel, transaction list, chart container), footer
  - Link `css/style.css` and `js/app.js`; load Chart.js from CDN (`https://cdn.jsdelivr.net/npm/chart.js`)
  - Create empty `css/style.css` and `js/app.js` placeholder files
  - **Requirement:** TC-1

- [x] 2. State model and LocalStorage persistence
  - Define the `state` object in `app.js` with fields: `budget`, `spendingLimit`, `transactions`, `categories`
  - Implement `saveState()` — serialise state to `localStorage` under key `ebv_state`
  - Implement `loadState()` — parse stored JSON and merge over defaults; wrap in try/catch
  - Call `loadState()` on `DOMContentLoaded`
  - **Requirement:** 8.1, 8.2, TC-2

- [x] 3. Input form — HTML structure and basic rendering
  - Add form fields to `index.html`: Item Name (text input), Amount (number input), Category (select dropdown)
  - Add a submit button labeled "Add Transaction"
  - Implement `renderCategoryDropdown()` to populate the `<select>` from `state.categories`
  - **Requirement:** 1.1, 1.2

- [x] 4. Form validation and add-transaction logic
  - Implement `handleAddTransaction(event)`: prevent default, run validation, build transaction object `{ id, name, amount, category, createdAt }`, push to `state.transactions`, call `saveState()`, call `render()`, reset form
  - Validation: Item Name non-empty after trim (max 100 chars), Amount numeric and > 0, Category selected and valid
  - Show `<span class="field-error">` under each failing field; clear on next submit
  - **Requirement:** 1.3, 1.4, 1.5

- [x] 5. Transaction list rendering and delete
  - Add a `<ul id="transaction-list">` to `index.html`
  - Implement `renderTransactionList()`: clear list, iterate sorted transactions, create `<li>` for each with name, amount, category badge, and a delete button
  - Show empty-state message when `state.transactions` is empty
  - Implement `handleDeleteTransaction(id)`: filter out the transaction, call `saveState()`, call `render()`
  - **Requirement:** 2.1, 2.2, 2.3

- [x] 6. Budget field and balance display
  - Add budget input field (number) and a "Set Budget" button/blur handler to `index.html`
  - Implement `handleSetBudget()`: parse value, update `state.budget`, call `saveState()`, call `render()`
  - Implement `renderBalance()`: compute `balance = state.budget − Σ(transactions.amount)`, update balance element; add CSS class `balance--negative` when balance < 0
  - **Requirement:** 3.1, 3.2, 3.3

- [x] 7. Pie chart with Chart.js
  - Add `<canvas id="spending-chart">` and a placeholder `<p id="chart-placeholder">` to `index.html`
  - Declare module-level `let chartInstance = null` in `app.js`
  - Implement `renderChart()`: if no transactions, destroy chart and show placeholder; otherwise aggregate per-category totals, create or update the Chart.js Pie instance
  - **Requirement:** 4.1, 4.2, 4.3

- [x] 8. Master render function
  - Implement `render()` calling: `renderBalance()`, `renderTransactionList()`, `renderChart()`, `renderLimitWarning()`, `renderCategoryDropdown()`
  - Ensure `render()` is called after every state mutation (add, delete, set budget, set limit, add category)
  - **Requirement:** 1.5, 2.2, 3.2, 4.2

- [x] 9. Custom categories
  - Add a "Add Category" input (text) and button to `index.html`
  - Implement `handleAddCategory()`: trim input, reject empty or duplicate (case-insensitive) with inline error, push to `state.categories`, call `saveState()`, call `render()`
  - **Requirement:** 5.1, 5.2, 5.3

- [x] 10. Sort transactions
  - Add a sort `<select>` control to `index.html` with options: Latest (default), Oldest, Amount ↓, Amount ↑, Category A–Z
  - Implement `handleSortChange()`: store chosen sort in a local variable (not persisted in state), call `renderTransactionList()`
  - Apply sort inside `renderTransactionList()` based on current sort selection
  - **Requirement:** 6.1, 6.2, 6.3

- [x] 11. Spending limit — set and persist
  - Add a spending limit input (number) and "Set Limit" button to `index.html`
  - Implement `handleSetLimit()`: parse value, update `state.spendingLimit` (set to `null` if cleared), call `saveState()`, call `render()`
  - **Requirement:** 7.1, 7.5

- [x] 12. Spending limit — highlight and warning
  - In `renderTransactionList()`: compute per-category totals; add CSS class `transaction--over-limit` to `<li>` elements whose category total exceeds `state.spendingLimit`
  - In `renderChart()`: add a distinct border colour to pie slices for over-limit categories
  - Implement `renderLimitWarning()`: show warning banner when total expenditure > `state.spendingLimit`; hide it otherwise (or when limit is null)
  - **Requirement:** 7.2, 7.3, 7.4

- [x] 13. Styling — layout, typography, components
  - Implement mobile-first single-column layout in `css/style.css`
  - Add two-column desktop layout with media query at 600 px
  - Style: balance card, transaction list items, category badges, delete button, form fields, field-error messages, over-limit highlight, warning banner, empty states
  - Use CSS custom properties for colours and spacing
  - **Requirement:** NFR-1, NFR-2, NFR-3

- [x] 14. Cross-browser verification
  - Manually verify the app loads and all features work in Chrome, Firefox, Edge, and Safari
  - Fix any browser-specific issues found (e.g., input type compatibility, CSS prefixes)
  - **Requirement:** TC-3
