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