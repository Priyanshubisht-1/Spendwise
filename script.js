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


/******************* Sidebar Functionality *******************/

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


/******************* light/dark mode *******************/

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

$("todayLabel").textContent = new Date().toLocaleDateString("en-IN", {
  weekday: "short", day: "numeric", month: "short", year: "numeric"
});

/* -----------------------------
   Date, formatting and utilities
   ----------------------------- */

function isThisMonth(item) {
  const date = parseLocalDate(item.date);
  const now = new Date();
  return Boolean(date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear());
}

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

/* -----------------------------
   Rendering: transactions table
   ----------------------------- */
   
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


renderAll();