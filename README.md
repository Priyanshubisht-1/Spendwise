# 💸 Spendwise – Personal Expense Tracker

<p align="center">
  <strong>Take control of your money, one transaction at a time.</strong><br>
  A simple, browser-based expense tracker for recording income, managing expenses and understanding spending habits.
</p>

<p align="center">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img alt="Storage" src="https://img.shields.io/badge/Storage-localStorage-6C5CE7?style=for-the-badge">
</p>

## 🌐 Live Demo

**Try Spendwise here:** [https://spendwise-brown-nu.vercel.app/](https://spendwise-brown-nu.vercel.app/)


## 🌱 About the Project

**Spendwise** is a browser-based personal expense tracker built using **HTML, CSS and vanilla JavaScript**. It provides a single place to record income and expenses, review a financial summary, and understand spending patterns by category.

The application runs directly in a modern web browser. It does not require a backend server, database setup, package installation or build command. Transaction records and the selected theme are saved in the browser's `localStorage`.

## 🎯 Objectives

- Make it easy to record and manage daily income and expenses.
- Provide a clear overview of balance, income and spending.
- Help users understand spending patterns through category-wise visualisations.
- Make transaction history easier to explore with search and filters.
- Allow users to export transaction records for their own reference.
- Demonstrate collaborative software development using Git, GitHub and Markdown.

## ✨ Features

| Feature | Description |
|---|---|
| 💰 **Income and expense entries** | Record the transaction type, name, amount and date. |
| 🧾 **Transaction details** | Choose a category and payment method, use the `Other / custom` option, and add an optional note. |
| ➕ **Add transactions** | Create a new income or expense entry using the transaction modal. |
| ✏️ **Edit transactions** | Update the details of an existing transaction. |
| 🗑️ **Delete transactions** | Remove an individual transaction or clear all entries after confirmation. |
| 📊 **Financial summary** | View total balance, total income, total expenses and expenses for the current month. |
| 📈 **Spending visualisations** | Explore category-wise spending using bar-style and doughnut-style charts. Switch between this month and all-time spending. |
| 🔎 **Search and filters** | Search transaction details and filter the list to show all activity, expenses or income. |
| 📥 **CSV export** | Download transaction history as a CSV file. |
| 💾 **Browser storage** | Keep transactions and light/dark theme preference in the current browser profile. |
| 📱 **Responsive navigation** | Use the sidebar on desktop and the menu toggle on smaller screens. |

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **HTML5** | Page structure, dashboard sections, transaction table and modal form |
| **CSS3** | Layout, styling, responsive behaviour, theme styles and chart presentation |
| **JavaScript (ES6+)** | Form handling, validation, calculations, rendering, search, filters and CSV export |
| **Browser `localStorage`** | Saving transactions and theme preference in the same browser profile |
| **Google Fonts** | DM Sans and Manrope typography (when an internet connection is available) |

> The charts are created using the project's JavaScript and CSS. No separate charting package is required.

## 📁 Project Structure

```text
Spendwise/
├── index.html          # Main page, dashboard markup and transaction modal
├── style.css           # Application styling, responsive layout and themes
├── script.js           # Transaction logic, calculations and UI interactions
├── abc.png             # Image asset used in the sidebar
├── .gitignore          # Files and folders excluded from Git
├── README.md           # Project overview and setup guide
└── CONTRIBUTING.md     # Team contributions and GitHub workflow
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, etc.).
- [Visual Studio Code](https://code.visualstudio.com/) is optional but recommended.

### Option 1: Open directly in a browser

1. Clone or download the repository.
2. Open the project folder.
3. Open `index.html` in your browser.

### Option 2: Run with Visual Studio Code Live Server

1. Open the cloned project folder in Visual Studio Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

### Clone the repository

```bash
git clone https://github.com/Priyanshubisht-1/Spendwise.git
cd Spendwise
```

There is no `npm install`, build step or backend configuration required for the current version.

## ⚠️ Data Storage and Limitations

- Transactions are stored in the browser's `localStorage` under the application's storage key.
- Data is local to the browser profile and is **not automatically synchronised** between devices or users.
- Clearing the browser's site data can remove locally stored transactions. Use **Export CSV** to keep a separate copy.
- The current project is a front-end application; it does not include user accounts, a remote database or cloud synchronisation.
- Google Fonts are loaded from Google Fonts. The application can still be opened locally if the font service is unavailable, but the external fonts may not load.

## 👥 Team Members and Individual Contributions

The project was developed collaboratively by two team members. Responsibilities were divided into two connected areas: **transaction management and interface development**, and **dashboard, analytics and reporting**. Both parts were integrated into the main application.

### 🧑‍💻 Student 1 — Priyanshu Bisht

**Roll No.:** 44 &nbsp; | &nbsp; **Batch:** 2  
**Role:** Transaction Management & Interface

The contribution allocated to Student 1 focused on the transaction-entry side of Spendwise and the navigation interface.

**Key contributions:**

- 🧭 Developed the **sidebar and navigation-related interface components**.
- ➕ Implemented the functionality to **add income and expense transactions**.
- ✏️ Implemented **editing** of existing transactions.
- 🗑️ Implemented **deletion** of existing transactions.
- 🏷️ Supported **transaction categories** and **payment-method options**.

### 🧑‍💻 Student 2 — Ayush Kapoor

**Roll No.:** 19 &nbsp; | &nbsp; **Batch:** 1  
**Role:** Dashboard, Analytics & Reporting

The contribution allocated to Student 2 focused on the dashboard and analysis side of Spendwise.

**Key contributions:**

- 💳 Developed the **dashboard summary cards** for balance, income and expenses.
- 📊 Implemented **monthly and category-wise spending charts**.
- 🔎 Added **transaction search, sorting and filtering** functionality.
- 📤 Implemented **CSV export and reporting** functionality.

### 🤝 Collaboration and Integration

The work was divided so that transaction-entry functionality and dashboard/analytics functionality could be developed as separate contributions and then integrated into the main branch. Individual contributions should be consistent with each member's actual GitHub commits, branches and pull requests.

For the collaboration workflow, branch details, pull requests and code reviews, see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 🔗 GitHub Repository

**Repository:** [Spendwise – GitHub](https://github.com/Priyanshubisht-1/Spendwise)

---

<p align="center">
  Made with 💙 by the Spendwise team<br>
  <em>Track your spending. Understand your habits. Make informed financial decisions.</em>
</p>
