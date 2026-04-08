import React, { useState, useEffect } from 'react';
import './App.css';
import DonutChart from './components/DonutChart';

const CATEGORIES = ['Housing', 'Food', 'Utilities', 'Transport', 'Entertainment'];

const formatCurrency = (amount) => {
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const getCurrentMonthYYYYMM = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getExpenseMonth = (expense) => {
  if (!expense.timestamp) return getCurrentMonthYYYYMM();
  return expense.timestamp.slice(0, 7);
};

function App() {
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('budgetPlanner_budgets');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    const oldBudget = localStorage.getItem('budgetPlanner_budget');
    const defaultBudget = oldBudget !== null ? parseFloat(oldBudget) : 4500;
    return { [getCurrentMonthYYYYMM()]: defaultBudget };
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('budgetPlanner_expenses');
    return saved !== null ? JSON.parse(saved) : [];
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('budgetPlanner_darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [descInput, setDescInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState(CATEGORIES[0]);
  const [datetimeInput, setDatetimeInput] = useState(getCurrentDateTimeLocal);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYYYYMM());
  const [isAddingMonth, setIsAddingMonth] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('budgetPlanner_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('budgetPlanner_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('budgetPlanner_darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  const monthsFromExpenses = expenses.map(e => getExpenseMonth(e));
  const monthsFromBudgets = Object.keys(budgets);
  const availableMonths = Array.from(new Set([...monthsFromExpenses, ...monthsFromBudgets, getCurrentMonthYYYYMM()]));
  availableMonths.sort().reverse(); // Newest first

  const filteredExpenses = expenses.filter(e => getExpenseMonth(e) === selectedMonth);

  const getActiveBudget = () => {
    if (budgets[selectedMonth]) return budgets[selectedMonth];
    const sortedMonths = Object.keys(budgets).sort().reverse();
    if (sortedMonths.length > 0) return budgets[sortedMonths[0]];
    return 4500;
  };

  const activeBudget = getActiveBudget();
  const totalSpent = filteredExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const remaining = activeBudget - totalSpent;
  const spentPercentage = activeBudget > 0 ? (totalSpent / activeBudget) * 100 : 0;

  const handleEditBudget = () => {
    setBudgetInput(activeBudget.toString());
    setIsEditingBudget(true);
  };

  const handleSaveBudget = () => {
    const parsed = parseFloat(budgetInput);
    if (!isNaN(parsed) && parsed > 0) {
      setBudgets(prev => ({
        ...prev,
        [selectedMonth]: parsed
      }));
    }
    setIsEditingBudget(false);
  };

  const handleBudgetKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveBudget();
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!descInput.trim() || !amountInput || parseFloat(amountInput) <= 0) return;

    if (editingExpenseId) {
      setExpenses(expenses.map(exp =>
        exp.id === editingExpenseId
          ? {
            ...exp,
            description: descInput,
            amount: parseFloat(amountInput).toFixed(2),
            category: categoryInput,
            timestamp: new Date(datetimeInput).toISOString()
          }
          : exp
      ));
      setEditingExpenseId(null);
    } else {
      const newExpense = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        description: descInput,
        amount: parseFloat(amountInput).toFixed(2),
        category: categoryInput,
        timestamp: new Date(datetimeInput).toISOString()
      };
      setExpenses([newExpense, ...expenses]);
    }

    setDescInput('');
    setAmountInput('');
    setDatetimeInput(getCurrentDateTimeLocal());
  };

  const handleEditClick = (expense) => {
    setDescInput(expense.description);
    setAmountInput(expense.amount);
    setCategoryInput(expense.category);

    if (expense.timestamp) {
      const d = new Date(expense.timestamp);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setDatetimeInput(d.toISOString().slice(0, 16));
    } else {
      setDatetimeInput(getCurrentDateTimeLocal());
    }

    setEditingExpenseId(expense.id);

    const formSection = document.querySelector('.add-expense-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleClearMonth = () => {
    if (window.confirm("Are you sure you want to permanently delete all expenses for this month?")) {
      setExpenses(expenses.filter(e => getExpenseMonth(e) !== selectedMonth));
    }
  };

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;

    const headers = ["Date", "Description", "Category", "Amount (Rwf)"];

    const csvContent = [
      headers.join(","),
      ...filteredExpenses.map(e => {
        const desc = `"${e.description.replace(/"/g, '""')}"`;
        const date = e.timestamp
          ? new Date(e.timestamp).toLocaleString()
          : "Unknown Date";
        return `"${date}",${desc},"${e.category}",${e.amount}`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `budget_export_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Budget Planner_v2.0</h1>
        <button
          className="dark-mode-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="dashboard-controls">
        {isAddingMonth ? (
          <input
            type="month"
            className="month-selector"
            style={{ width: 'auto' }}
            onChange={(e) => {
              if (e.target.value) {
                const newMonth = e.target.value;
                setBudgets(prev => ({ ...prev, [newMonth]: activeBudget }));
                setSelectedMonth(newMonth);
              }
              setIsAddingMonth(false);
            }}
            onBlur={() => setIsAddingMonth(false)}
            autoFocus
          />
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map(m => {
                const [year, month] = m.split('-');
                const date = new Date(year, parseInt(month) - 1);
                const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{monthName}</option>;
              })}
            </select>
            <button
              className="month-selector add-month-btn"
              onClick={() => setIsAddingMonth(true)}
              aria-label="Add new month"
              title="Add a different month"
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-title">Total Budget</div>
          <div className="stat-amount budget">
            {isEditingBudget ? (
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onBlur={handleSaveBudget}
                onKeyDown={handleBudgetKeyDown}
                autoFocus
                style={{
                  width: '100px',
                  fontSize: '20px',
                  fontWeight: '700',
                  fontFamily: 'inherit',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  background: 'var(--app-bg)',
                  color: 'var(--text-primary)'
                }}
              />
            ) : (
              <>
                Rwf {formatCurrency(activeBudget)}
                <span className="edit-link" onClick={handleEditBudget}>Edit</span>
              </>
            )}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Spent</div>
          <div className="stat-amount spent">Rwf {formatCurrency(totalSpent)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Remaining</div>
          <div className="stat-amount remaining">Rwf {formatCurrency(remaining)}</div>
        </div>
      </div>

      <div className="progress-container">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(spentPercentage, 100)}%`,
            backgroundColor: spentPercentage < 50 ? 'var(--green-color)' : spentPercentage < 85 ? 'var(--category-utilities)' : 'var(--red-color)'
          }}
        ></div>
      </div>

      <div className="chart-section">
        <h2 className="chart-title">Spending Breakdown</h2>
        <DonutChart expenses={filteredExpenses} />
      </div>

      <div className="add-expense-section">
        <h2 className="section-title">{editingExpenseId ? 'Edit Expense' : 'Add New Expense'}</h2>
        <form className="expense-form" onSubmit={handleAddExpense}>
          <input
            type="text"
            placeholder="What did you buy?"
            value={descInput}
            onChange={(e) => setDescInput(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Amount"
            min="0.01"
            step="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            required
          />
          <select
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={datetimeInput}
            onChange={(e) => setDatetimeInput(e.target.value)}
            required
          />
          <button type="submit">{editingExpenseId ? 'Update' : 'Add'}</button>
          {editingExpenseId && (
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setEditingExpenseId(null);
                setDescInput('');
                setAmountInput('');
                setDatetimeInput(getCurrentDateTimeLocal());
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="recent-transactions">
        <div className="transactions-header">
          <h2 className="section-title">Recent Transactions</h2>
          {filteredExpenses.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="export-csv-btn" onClick={handleExportCSV}>
                Export CSV
              </button>
              <button className="clear-month-btn" onClick={handleClearMonth}>
                Clear Month
              </button>
            </div>
          )}
        </div>
        {filteredExpenses.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No transactions yet.</p>
        ) : (
          <ul className="transaction-list">
            {filteredExpenses.map(expense => (
              <li key={expense.id} className="transaction-item">
                <div className="transaction-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="transaction-name">{expense.description}</span>
                    <button
                      className="edit-btn"
                      onClick={() => handleEditClick(expense)}
                      aria-label="Edit expense"
                    >
                      ✎
                    </button>
                  </div>
                  <span className="transaction-category">
                    {expense.category}
                    {expense.timestamp && ` • ${new Date(expense.timestamp).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}`}
                  </span>
                </div>
                <div className="transaction-right">
                  <span className="transaction-amount">-Rwf {formatCurrency(expense.amount)}</span>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteExpense(expense.id)}
                    aria-label="Delete expense"
                  >
                    &times;
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer
        style={{
          textAlign: "center",
          marginTop: "30px",
          color: "#888888",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Created by @nsam
      </footer>
    </div>
  );
}

export default App;
