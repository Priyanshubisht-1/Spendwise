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

renderAll();