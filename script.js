/* ==========================================================
   Spendwise — Personal Expense Tracker
   Vanilla JavaScript: storage, validation, calculations,
   charts, transaction editing, export and UI interactions.
   ========================================================== */

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "spendwise_transactions_v1";
const THEME_KEY = "spendwise_dark";
const palette = ["#7765e8", "#f0a45d", "#45b891", "#6e9fea", "#e87989", "#b28be8", "#d5ae45", "#91a0b7"];
const CURRENCY = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

let transactions = loadTransactions();
let editingId = null;
let toastTimer = null;
let lastFocusedElement = null;

/* -----------------------------
   Date, formatting and utilities
   ----------------------------- */
function money(value) {
  return CURRENCY.format(Number(value) || 0);
}

function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function parseLocalDate(value) {
  if (!isValidDateString(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateLabel(value) {
  const date = parseLocalDate(value);
  return date
    ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Invalid date";
}

function isThisMonth(item) {
  const date = parseLocalDate(item.date);
  const now = new Date();
  return Boolean(date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear());
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `txn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showToast(message, type = "success") {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

/* -----------------------------
   Local storage
   ----------------------------- */
function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];

    // Normalize older saved records so the updated app remains backward compatible.
    return saved.filter((item) => item && typeof item === "object").map((item) => ({
      id: String(item.id || createId()),
      title: String(item.title || "").trim(),
      amount: Number(item.amount),
      category: String(item.category || "Other"),
      date: String(item.date || ""),
      note: String(item.note || ""),
      type: item.type === "income" ? "income" : "expense",
      paymentMethod: String(item.paymentMethod || "Not specified"),
      createdAt: Number(item.createdAt) || Date.now()
    })).filter((item) => item.title && Number.isFinite(item.amount) && item.amount > 0 && isValidDateString(item.date));
  } catch (error) {
    console.warn("Could not read saved transactions:", error);
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error("Could not save transactions:", error);
    showToast("Unable to save. Check your browser storage settings.", "error");
    return false;
  }
}

/* -----------------------------
   Calculations
   ----------------------------- */
function totals() {
  const income = transactions.filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const month = transactions.filter((item) => item.type === "expense" && isThisMonth(item))
    .reduce((sum, item) => sum + item.amount, 0);
  return { income, expenses, month, balance: income - expenses };
}

function getCategoryTotals(period) {
  const filtered = transactions.filter((item) =>
    item.type === "expense" && (period === "all" || isThisMonth(item))
  );
  return filtered.reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + item.amount;
    return result;
  }, {});
}

/* -----------------------------
   Rendering: summary and charts
   ----------------------------- */
function renderStats() {
  const result = totals();
  $("balanceValue").textContent = money(result.balance);
  $("incomeValue").textContent = money(result.income);
  $("expenseValue").textContent = money(result.expenses);
  $("monthValue").textContent = money(result.month);
  $("monthName").textContent = new Date().toLocaleDateString("en-IN", { month: "long" });

  const status = $("balanceStatus");
  status.className = "balance-status";
  if (result.balance > 0) {
    status.classList.add("positive");
    status.textContent = "● Positive net balance";
  } else if (result.balance < 0) {
    status.classList.add("negative");
    status.textContent = "● Expenses exceed income";
  } else {
    status.classList.add("neutral");
    status.textContent = "● Break-even balance";
  }
}

function compactRupees(value) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${Math.round(value)}`;
}

function renderYAxis(maxValue) {
  const axis = $("yAxis");
  axis.replaceChildren();
  for (let step = 4; step >= 0; step -= 1) {
    const label = document.createElement("span");
    label.textContent = compactRupees(maxValue * step / 4);
    axis.append(label);
  }
}

function renderCharts() {
  const entries = Object.entries(getCategoryTotals($("chartPeriod").value))
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  const bars = $("chartBars");
  const legend = $("chartLegend");
  const breakdown = $("breakdownList");
  const donut = $("donut");

  $("chartTotal").textContent = money(total);
  $("donutTotal").textContent = money(total);
  bars.replaceChildren();
  legend.replaceChildren();
  breakdown.replaceChildren();

  if (!entries.length || total <= 0) {
    bars.innerHTML = '<div class="empty-chart">Add expenses to see your spending breakdown.</div>';
    donut.style.background = "conic-gradient(#e9edf4 0 100%)";
    breakdown.innerHTML = '<div class="empty-state small-empty">Your categories will appear here.</div>';
    renderYAxis(0);
    return;
  }

  const maxValue = Math.max(...entries.map(([, amount]) => amount));
  renderYAxis(maxValue);

  entries.slice(0, 5).forEach(([name, amount], index) => {
    const color = palette[index % palette.length];

    const column = document.createElement("div");
    column.className = "bar-column";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${Math.max(3, (amount / maxValue) * 112)}px`;
    bar.style.background = color;
    bar.title = `${name}: ${money(amount)}`;
    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = name.length > 12 ? `${name.slice(0, 11)}…` : name;
    column.append(bar, label);
    bars.append(column);

    const legendItem = document.createElement("span");
    legendItem.className = "legend-item";
    const dot = document.createElement("i");
    dot.style.background = color;
    legendItem.append(dot, document.createTextNode(name));
    legend.append(legendItem);

    const row = document.createElement("div");
    row.className = "breakdown-item";
    const categoryName = document.createElement("span");
    categoryName.className = "breakdown-name";
    const categoryDot = document.createElement("i");
    categoryDot.style.background = color;
    categoryName.append(categoryDot, document.createTextNode(name));
    const categoryAmount = document.createElement("strong");
    categoryAmount.className = "breakdown-amount";
    categoryAmount.textContent = money(amount);
    row.append(categoryName, categoryAmount);
    breakdown.append(row);
  });

  let offset = 0;
  const segments = entries.map(([, amount], index) => {
    const start = offset;
    offset += (amount / total) * 100;
    return `${palette[index % palette.length]} ${start}% ${offset}%`;
  });
  donut.style.background = `conic-gradient(${segments.join(", ")})`;
}

/* -----------------------------
   Rendering: transactions table
   ----------------------------- */
function renderTransactions() {
  const query = $("searchInput").value.trim().toLowerCase();
  const filter = $("filterType").value;
  const rows = transactions
    .filter((item) => filter === "all" || item.type === filter)
    .filter((item) => `${item.title} ${item.category} ${item.note} ${item.paymentMethod}`.toLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  const body = $("transactionBody");
  body.replaceChildren();

  if (!rows.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "table-empty";
    cell.textContent = transactions.length
      ? "No transactions match your search or filter."
      : "No transactions yet. Add your first one to get started.";
    row.append(cell);
    body.append(row);
  } else {
    rows.forEach((item) => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      const nameWrap = document.createElement("div");
      nameWrap.className = "transaction-name";
      const avatar = document.createElement("span");
      avatar.className = `transaction-avatar ${item.type}`;
      avatar.textContent = item.type === "income" ? "↙" : "↗";
      const title = document.createElement("span");
      title.className = "transaction-title";
      title.textContent = item.title;
      nameWrap.append(avatar, title);
      nameCell.append(nameWrap);

      const categoryCell = document.createElement("td");
      const category = document.createElement("span");
      category.className = "category-pill";
      category.textContent = item.category;
      categoryCell.append(category);

      const paymentCell = document.createElement("td");
      paymentCell.textContent = item.paymentMethod || "Not specified";

      const dateCell = document.createElement("td");
      dateCell.textContent = dateLabel(item.date);

      const amountCell = document.createElement("td");
      amountCell.className = `amount-cell ${item.type}`;
      amountCell.textContent = `${item.type === "income" ? "+" : "−"} ${money(item.amount)}`;

      const actionCell = document.createElement("td");
      actionCell.className = "action-cell";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "edit-button";
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", `Edit ${item.title}`);
      editButton.addEventListener("click", () => openEditModal(item.id));
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-button";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete ${item.title}`);
      deleteButton.addEventListener("click", () => deleteTransaction(item.id));
      actionCell.append(editButton, deleteButton);

      row.append(nameCell, categoryCell, paymentCell, dateCell, amountCell, actionCell);
      body.append(row);
    });
  }

  $("transactionCount").textContent = `Showing ${rows.length} of ${transactions.length} transactions`;
  $("exportCsv").disabled = transactions.length === 0;
}

function renderAll() {
  renderStats();
  renderCharts();
  renderTransactions();
}

/* -----------------------------
   Modal and form state
   ----------------------------- */
function setEntryType(type, updateDefaultCategory = false) {
  $("entryType").value = type;
  document.querySelectorAll(".type-option").forEach((button) => {
    const selected = button.dataset.type === type;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  if (updateDefaultCategory) {
    $("categoryInput").value = type === "income" ? "Salary" : "Food & dining";
    $("customCategoryInput").value = "";
    syncCustomFields();
  }
}

function syncCustomFields() {
  const customCategory = $("categoryInput").value === "Other";
  const customPayment = $("paymentMethodInput").value === "Other";
  $("customCategoryWrap").hidden = !customCategory;
  $("customPaymentWrap").hidden = !customPayment;
  $("customCategoryInput").required = customCategory;
  $("customPaymentInput").required = customPayment;
}

function resetTransactionForm() {
  $("transactionForm").reset();
  $("dateInput").value = localDateInputValue();
  $("paymentMethodInput").value = "UPI";
  $("modalTitle").textContent = "Add transaction";
  $("submitLabel").textContent = "Save transaction";
  $("customCategoryInput").value = "";
  $("customPaymentInput").value = "";
  setEntryType("expense", true);
  syncCustomFields();
}

function showModal() {
  lastFocusedElement = document.activeElement;
  $("modalBackdrop").classList.add("show");
  $("modalBackdrop").setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  $("titleInput").focus();
}

function openModal() {
  editingId = null;
  resetTransactionForm();
  showModal();
}

function openEditModal(id) {
  const item = transactions.find((transaction) => transaction.id === id);
  if (!item) return;

  editingId = id;
  $("transactionForm").reset();
  $("titleInput").value = item.title;
  $("amountInput").value = String(item.amount);
  $("dateInput").value = item.date;
  $("noteInput").value = item.note || "";

  const categoryOptions = [...$("categoryInput").options].map((option) => option.value);
  if (categoryOptions.includes(item.category)) {
    $("categoryInput").value = item.category;
    $("customCategoryInput").value = "";
  } else {
    $("categoryInput").value = "Other";
    $("customCategoryInput").value = item.category;
  }

  const paymentOptions = [...$("paymentMethodInput").options].map((option) => option.value);
  if (paymentOptions.includes(item.paymentMethod)) {
    $("paymentMethodInput").value = item.paymentMethod;
    $("customPaymentInput").value = "";
  } else {
    $("paymentMethodInput").value = "Other";
    $("customPaymentInput").value = item.paymentMethod;
  }

  setEntryType(item.type);
  syncCustomFields();
  $("modalTitle").textContent = "Edit transaction";
  $("submitLabel").textContent = "Save changes";
  showModal();
}

function closeModal() {
  $("modalBackdrop").classList.remove("show");
  $("modalBackdrop").setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  editingId = null;
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  syncCustomFields();

  const title = $("titleInput").value.trim();
  const amount = Number($("amountInput").value);
  const date = $("dateInput").value;
  const category = $("categoryInput").value === "Other"
    ? $("customCategoryInput").value.trim()
    : $("categoryInput").value;
  const paymentMethod = $("paymentMethodInput").value === "Other"
    ? $("customPaymentInput").value.trim()
    : $("paymentMethodInput").value;

  if (!title) {
    $("titleInput").setCustomValidity("Enter a transaction name.");
    $("titleInput").reportValidity();
    $("titleInput").setCustomValidity("");
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    $("amountInput").setCustomValidity("Enter an amount greater than zero.");
    $("amountInput").reportValidity();
    $("amountInput").setCustomValidity("");
    return;
  }
  if (!isValidDateString(date)) {
    showToast("Please select a valid transaction date.", "error");
    return;
  }
  if (!category || !paymentMethod) {
    showToast("Please complete the custom category and payment fields.", "error");
    return;
  }

  const existing = editingId ? transactions.find((item) => item.id === editingId) : null;
  const updated = {
    id: existing?.id || createId(),
    title,
    amount,
    category,
    date,
    note: $("noteInput").value.trim(),
    type: $("entryType").value === "income" ? "income" : "expense",
    paymentMethod,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  if (existing) {
    transactions = transactions.map((item) => item.id === editingId ? updated : item);
  } else {
    transactions.push(updated);
  }

  if (saveTransactions()) {
    closeModal();
    renderAll();
    showToast(existing ? "Transaction updated successfully." : "Transaction added successfully.");
  }
}

/* -----------------------------
   Delete and CSV export
   ----------------------------- */
function deleteTransaction(id) {
  const item = transactions.find((transaction) => transaction.id === id);
  if (!item || !confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
  transactions = transactions.filter((transaction) => transaction.id !== id);
  if (saveTransactions()) {
    renderAll();
    showToast("Transaction deleted.");
  }
}

function csvCell(value) {
  let text = String(value ?? "");
  // Reduce spreadsheet formula-injection risk for user-entered text fields.
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '\"\"')}"`;
}

function exportCSV() {
  if (!transactions.length) return;
  const headers = ["Title", "Type", "Category", "Amount (INR)", "Date", "Payment Method", "Note"];
  const rows = transactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => [item.title, item.type, item.category, item.amount, item.date, item.paymentMethod, item.note]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `spendwise-transactions-${localDateInputValue()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("CSV export downloaded.");
}

/* -----------------------------
   Event listeners and startup
   ----------------------------- */
$("openModal").addEventListener("click", openModal);
$("closeModal").addEventListener("click", closeModal);
$("modalBackdrop").addEventListener("click", (event) => {
  if (event.target === $("modalBackdrop")) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $("modalBackdrop").classList.contains("show")) closeModal();
});

document.querySelectorAll(".type-option").forEach((button) => {
  button.addEventListener("click", () => setEntryType(button.dataset.type, true));
});
$("categoryInput").addEventListener("change", syncCustomFields);
$("paymentMethodInput").addEventListener("change", syncCustomFields);
$("titleInput").addEventListener("input", () => $("titleInput").setCustomValidity(""));
$("transactionForm").addEventListener("submit", handleFormSubmit);

$("searchInput").addEventListener("input", renderTransactions);
$("filterType").addEventListener("change", renderTransactions);
$("chartPeriod").addEventListener("change", renderCharts);
$("exportCsv").addEventListener("click", exportCSV);

$("clearAll").addEventListener("click", () => {
  if (!transactions.length || !confirm("Delete all transactions? This cannot be undone.")) return;
  transactions = [];
  if (saveTransactions()) {
    renderAll();
    showToast("All transactions cleared.");
  }
});

$("themeToggle").addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  try { localStorage.setItem(THEME_KEY, isDark ? "1" : "0"); } catch (error) { /* Theme still works for this session. */ }
  $("themeToggle").setAttribute("aria-pressed", String(isDark));
});

try {
  if (localStorage.getItem(THEME_KEY) === "1") {
    document.body.classList.add("dark");
    $("themeToggle").setAttribute("aria-pressed", "true");
  }
} catch (error) {
  console.warn("Could not restore theme preference:", error);
}

$("mobileMenu").addEventListener("click", () => {
  const isOpen = $("sidebar").classList.toggle("open");
  $("mobileMenu").setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    $("sidebar").classList.remove("open");
    $("mobileMenu").setAttribute("aria-expanded", "false");
    document.querySelectorAll(".nav-link").forEach((navLink) => navLink.classList.toggle("active", navLink === link));
  });
});

$("todayLabel").textContent = new Date().toLocaleDateString("en-IN", {
  weekday: "short", day: "numeric", month: "short", year: "numeric"
});
$("dateInput").value = localDateInputValue();
syncCustomFields();
renderAll();
