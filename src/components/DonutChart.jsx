import React, { useState } from 'react';

const CATEGORY_COLORS = {
  Housing: 'var(--category-housing)',
  Food: 'var(--category-food)',
  Utilities: 'var(--category-utilities)',
  Transport: 'var(--category-transport)',
  Entertainment: 'var(--category-entertainment)'
};

const formatCurrency = (amount) => {
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const DonutChart = ({ expenses }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Aggregate expenses by category
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
    return acc;
  }, {});

  const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return <div className="no-expenses-msg">No expenses added yet.</div>;
  }

  let currentOffset = 0;
  // Circumference of a circle with r=15.9155 is ~100
  // Standard SVG donut chart trick: r=15.91549430918954
  const radius = 15.91549430918954;
  const circumference = 100;

  const chartSegments = Object.keys(categoryTotals).map((category, index) => {
    const value = categoryTotals[category];
    const percentage = (value / total) * 100;

    // Create the stroke dasharray and offset for the current segment
    const dasharray = `${percentage} ${circumference - percentage}`;
    const strokeDashoffset = -currentOffset;

    // Update offset for next segment
    currentOffset += percentage;

    return (
      <circle
        key={index}
        cx="21"
        cy="21"
        r={radius}
        fill="transparent"
        stroke={CATEGORY_COLORS[category] || '#94a3b8'}
        strokeWidth="6"
        strokeDasharray={dasharray}
        strokeDashoffset={strokeDashoffset}
        style={{
          transition: 'stroke-dasharray 1.6s cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease',
          cursor: 'pointer',
          opacity: selectedCategory ? (selectedCategory === category ? 1 : 0.4) : 1
        }}
        onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
      />
    );
  });

  return (
    <>
      <div className="chart-svg-container">
        <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
          {/* Background ring */}
          <circle
            cx="21" cy="21" r={radius}
            fill="transparent"
            stroke="var(--border-color)"
            strokeWidth="6"
          />
          {/* Data segments */}
          {chartSegments}

          {/* Center text */}
          {selectedCategory ? (
            <text x="21" y="21" textAnchor="middle" dominantBaseline="middle" fontSize="2.5" fill="var(--text-primary)" style={{ pointerEvents: 'none' }}>
              <tspan x="21" dy="-3" fontWeight="600" opacity="0.8">{selectedCategory}</tspan>
              <tspan x="21" dy="3.5" fontSize="3.5" fontWeight="700">Rwf {formatCurrency(categoryTotals[selectedCategory])}</tspan>
              <tspan x="21" dy="3.5" opacity="0.8">{((categoryTotals[selectedCategory] / total) * 100).toFixed(1)}%</tspan>
            </text>
          ) : (
            <text x="21" y="21" textAnchor="middle" dominantBaseline="middle" fontSize="3" fill="var(--text-secondary)" style={{ pointerEvents: 'none' }}>
              <tspan x="21" dy="0">Total:</tspan>
              <tspan x="21" dy="4" fontSize="3.5" fontWeight="700" fill="var(--text-primary)">Rwf {formatCurrency(total)}</tspan>
            </text>
          )}
        </svg>
      </div>
      <div className="chart-legend">
        {Object.keys(categoryTotals).map(category => (
          <div
            key={category}
            className="legend-item"
            style={{
              cursor: 'pointer',
              opacity: selectedCategory ? (selectedCategory === category ? 1 : 0.4) : 1,
              transition: 'opacity 0.2s'
            }}
            onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
          >
            <span className="legend-color" style={{ background: CATEGORY_COLORS[category] || '#94a3b8' }}></span>
            {category}
          </div>
        ))}
      </div>
    </>
  );
};

export default DonutChart;
