import React, { useState, useEffect } from 'react';
import './App.css';
import DonutChart from './components/DonutChart';

const CATEGORIES = ['Housing', 'Food', 'Utilities', 'Transport', 'Entertainment'];

function App() {
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem('budgetPlanner_budget');
    return saved !== null ? parseFloat(saved) : 4500;
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

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('budgetPlanner_budget', budget);
  }, [budget]);

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

  const totalSpent = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const remaining = budget - totalSpent;

  const handleEditBudget = () => {
    const newBudgetStr = window.prompt("Enter new total budget:", budget);
    if (newBudgetStr !== null) {
      const parsed = parseFloat(newBudgetStr);
      if (!isNaN(parsed) && parsed > 0) {
        setBudget(parsed);
      }
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!descInput.trim() || !amountInput || parseFloat(amountInput) <= 0) return;

    const newExpense = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      description: descInput,
      amount: parseFloat(amountInput).toFixed(2),
      category: categoryInput
    };

    setExpenses([newExpense, ...expenses]);
    setDescInput('');
    setAmountInput('');
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Budget Manager_v2.0</h1>
        <button 
          className="dark-mode-toggle" 
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-title">Total Budget</div>
          <div className="stat-amount budget">
            Rwf {budget.toFixed(2)}
            <span className="edit-link" onClick={handleEditBudget}>Edit</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Spent</div>
          <div className="stat-amount spent">Rwf {totalSpent.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Remaining</div>
          <div className="stat-amount remaining">Rwf {remaining.toFixed(2)}</div>
        </div>
      </div>

      <div className="chart-section">
        <h2 className="chart-title">Spending Breakdown</h2>
        <DonutChart expenses={expenses} />
      </div>

      <div className="add-expense-section">
        <h2 className="section-title">Add New Expense</h2>
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
          <button type="submit">Add</button>
        </form>
      </div>

      <div className="recent-transactions">
        <h2 className="section-title">Recent Transactions</h2>
        {expenses.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No transactions yet.</p>
        ) : (
          <ul className="transaction-list">
            {expenses.map(expense => (
              <li key={expense.id} className="transaction-item">
                <div className="transaction-info">
                  <span className="transaction-name">{expense.description}</span>
                  <span className="transaction-category">{expense.category}</span>
                </div>
                <div className="transaction-right">
                  <span className="transaction-amount">-Rwf {expense.amount}</span>
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
