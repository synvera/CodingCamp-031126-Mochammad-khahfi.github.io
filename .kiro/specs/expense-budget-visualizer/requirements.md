# Requirements Document

## Introduction
A mobile-friendly single-page web app that allows users to track daily spending against a set budget. Built with HTML5, CSS3, and Vanilla JavaScript — no frameworks, no backend. Data persists in the browser via LocalStorage.

---

## Requirements

### 1. Input Form

#### 1.1 Transaction Fields
WHEN a user opens the app, THEN the input form SHALL display three fields: Item Name (text), Amount (number), and Category (dropdown).

#### 1.2 Default Categories
WHEN the category dropdown is rendered, THEN it SHALL include at minimum the default options: Food, Transport, and Fun.

#### 1.3 Form Validation
WHEN a user submits the form with one or more empty fields, THEN the app SHALL prevent submission and display an inline validation message indicating which fields are missing.

#### 1.4 Amount Validation
WHEN a user enters a non-positive or non-numeric value in the Amount field, THEN the app SHALL prevent submission and display an inline error message.

#### 1.5 Add Transaction on Submit
WHEN a user submits a valid form, THEN the app SHALL add the transaction to the transaction list, update the total balance, update the pie chart, and reset the form fields.

---

### 2. Transaction List

#### 2.1 Display Transactions
WHEN transactions exist, THEN the app SHALL display each transaction in a scrollable list showing: item name, amount, and category badge.

#### 2.2 Delete Transaction
WHEN a user clicks the delete button on a transaction, THEN the app SHALL remove that transaction from the list, update the total balance, and update the pie chart.

#### 2.3 Empty State
WHEN no transactions exist, THEN the app SHALL display an empty-state message (e.g., "No transactions yet").

---

### 3. Total Balance

#### 3.1 Budget Input
WHEN a user opens the app for the first time, THEN the app SHALL prompt or provide a field to set an initial budget amount.

#### 3.2 Balance Calculation
WHEN transactions are added or removed, THEN the app SHALL display the current balance as: balance = budget − total expenditure, and SHALL update it in real time.

#### 3.3 Negative Balance Indicator
WHEN the calculated balance drops below zero, THEN the balance display SHALL change to a visually distinct style (e.g., red color) to indicate overspending.

---

### 4. Pie Chart (Visual Chart)

#### 4.1 Chart Rendering
WHEN at least one transaction exists, THEN the app SHALL render a pie chart using Chart.js (loaded via CDN) showing spending distribution by category.

#### 4.2 Real-Time Chart Update
WHEN a transaction is added or deleted, THEN the pie chart SHALL update automatically without a page reload to reflect the current spending distribution.

#### 4.3 Empty Chart State
WHEN no transactions exist, THEN the pie chart area SHALL display a placeholder message (e.g., "Add transactions to see the chart").

---

### 5. Custom Categories

#### 5.1 Add Custom Category
WHEN a user types a new category name into the custom category input and submits it, THEN the app SHALL add that category to the category dropdown so it can be selected when creating a new transaction.

#### 5.2 Duplicate Prevention
WHEN a user submits a custom category name that already exists (case-insensitive), THEN the app SHALL reject it and display a brief error message.

#### 5.3 Persist Custom Categories
WHEN a custom category is added, THEN the app SHALL save it to LocalStorage so it persists across page reloads.

---

### 6. Sort Transactions

#### 6.1 Sort Controls
WHEN transactions exist, THEN the app SHALL provide sort controls allowing the user to sort the transaction list by: Amount (high to low), Amount (low to high), and Category (alphabetical).

#### 6.2 Apply Sort
WHEN a user selects a sort option, THEN the transaction list SHALL reorder immediately to reflect the chosen sort.

#### 6.3 Default Order
WHEN no sort option is selected, THEN transactions SHALL be displayed in the order they were added (most recent first).

---

### 7. Spending Limit & Highlights

#### 7.1 Set Spending Limit
WHEN a user enters a limit value in the spending limit field and confirms it, THEN the app SHALL store that limit and use it for both per-category and total-expenditure comparisons.

#### 7.2 Per-Category Limit Highlight
WHEN the total spending in any single category exceeds the spending limit, THEN the app SHALL visually highlight that category's transactions (e.g., red border or background) in the transaction list.

#### 7.3 Total Expenditure Limit Warning
WHEN the total expenditure across all categories exceeds the spending limit, THEN the app SHALL display a visible warning message in the UI (e.g., a banner or alert box).

#### 7.4 Per-Category Pie Chart Highlight
WHEN a category's spending exceeds the limit, THEN the corresponding slice in the pie chart SHALL be visually distinct (e.g., a different shade or border).

#### 7.5 Persist Limit Setting
WHEN a user sets a spending limit, THEN the app SHALL save it to LocalStorage so it persists across page reloads.

---

### 8. Data Persistence

#### 8.1 Save on Change
WHEN any transaction is added or deleted, or when the budget, spending limit, or custom categories are modified, THEN the app SHALL immediately save the updated state to LocalStorage.

#### 8.2 Restore on Load
WHEN the app loads, THEN it SHALL read all stored data from LocalStorage and restore: transactions, budget, custom categories, and spending limit.

---

## Technical Constraints

- TC-1: The app SHALL be built using only HTML5, CSS3, and Vanilla JavaScript. No JavaScript frameworks or libraries other than Chart.js via CDN are permitted. There is no backend.
- TC-2: All data persistence SHALL use the Browser LocalStorage API. No server-side storage.
- TC-3: The app SHALL function correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari.

---

## Non-Functional Requirements

- NFR-1: The interface SHALL be clean and minimal with no test setup required for the delivered project.
- NFR-2: The app SHALL load and respond to user interactions without perceptible delay on a modern device.
- NFR-3: The UI SHALL present a clear visual hierarchy with readable typography and accessible color contrast.
