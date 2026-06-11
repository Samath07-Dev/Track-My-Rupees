import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, PlusCircle, Wallet } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const COLORS = ['#818cf8', '#10b981', '#ef4444', '#f59e0b', '#94a3b8', '#a855f7'];

// Simple Animated Counter Component
const AnimatedCounter = ({ value, prefix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1000;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(value * easeProgress);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>;
};

export default function Dashboard({ transactions = [], isDarkMode, searchQuery }) {
  const navigate = useNavigate();
  
  // Ensure transactions is an array
  const txList = Array.isArray(transactions) ? transactions : [];
  
  // Debug logging
  console.log('Dashboard received transactions:', txList);
  console.log('Transaction types:', txList.map(t => ({ type: t.type, amount: t.amount, typeof: typeof t.amount })));
  
  // Filter transactions based on search query
  const filteredTransactions = txList.filter(t => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.category.toLowerCase().includes(query) ||
      t.amount.toString().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.type.toLowerCase().includes(query)
    );
  });

  const isEmpty = filteredTransactions.length === 0;
  const totalIncome = filteredTransactions.filter(t => t.type?.toLowerCase() === 'income').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalExpense = filteredTransactions.filter(t => t.type?.toLowerCase() === 'expense').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalBalance = totalIncome - totalExpense;
  
  console.log('Totals:', { totalIncome, totalExpense, totalBalance });

  const expenseByCategory = filteredTransactions
    .filter(t => t.type?.toLowerCase() === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
      return acc;
    }, {});
    
  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  }));

  const { user } = useContext(AuthContext);

  // Build months dynamically from min(signup, transactions) → max(now+1, transactions)
  const monthlyData = (() => {
    const now = new Date();
    const signupDate = user?.createdAt ? new Date(user.createdAt) : now;
    
    // Find absolute min and max years/months for the chart
    const transactionDates = filteredTransactions.map(t => new Date(t.date));
    const allDates = [
      new Date(signupDate.getFullYear(), signupDate.getMonth() - 1, 1), // One month before signup
      new Date(now.getFullYear(), now.getMonth() + 1, 1),           // One month after now
      ...transactionDates
    ];

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    const months = [];
    let y = minDate.getFullYear();
    let m = minDate.getMonth();
    
    const targetY = maxDate.getFullYear();
    const targetM = maxDate.getMonth();

    while (y < targetY || (y === targetY && m <= targetM)) {
      months.push({ year: y, month: m, name: new Date(y, m, 1).toLocaleString('default', { month: 'short' }) });
      m++;
      if (m > 11) { m = 0; y++; }
    }

    return months.map(({ year, month, name }) => {
      const income = filteredTransactions
        .filter(t => { const td = new Date(t.date); return t.type?.toLowerCase() === 'income' && td.getFullYear() === year && td.getMonth() === month; })
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const expense = filteredTransactions
        .filter(t => { const td = new Date(t.date); return t.type?.toLowerCase() === 'expense' && td.getFullYear() === year && td.getMonth() === month; })
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      return { name, income: Math.round(income), expense: Math.round(expense) };
    });
  })();

  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    color: isDarkMode ? '#f1f5f9' : '#334155'
  };

  return (
    <div className="dashboard-grid">

      {/* Empty State for new users */}
      {isEmpty && (
        <div style={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '2px dashed var(--border-color)',
          gap: '20px'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '24px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(99,102,241,0.3)'
          }}>
            <Wallet size={36} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Welcome! Your wallet is ready 🎉</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '380px', lineHeight: 1.6 }}>
              You don't have any transactions yet. Add your first income or expense to start tracking your finances.
            </p>
          </div>
          <button
            onClick={() => navigate('/add-expense')}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', fontSize: '15px' }}
          >
            <PlusCircle size={20} />
            Add Your First Transaction
          </button>
        </div>
      )}
      <div className="summary-cards-wrapper">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), #b4b4ff)', padding: '18px', borderRadius: '50%', color: 'white', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)' }}>
            <DollarSign size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title" style={{ marginBottom: '4px' }}>Total Balance</div>
            <h2 style={{ fontSize: '32px', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-1px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <AnimatedCounter value={totalBalance} prefix="₹" />
            </h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', padding: '18px', borderRadius: '50%', color: 'white', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)' }}>
            <ArrowUpRight size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title" style={{ marginBottom: '4px' }}>Total Income</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
              <h2 style={{ fontSize: '32px', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-1px' }}>
                <AnimatedCounter value={totalIncome} prefix="₹" />
              </h2>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--success)', background: 'var(--success-light)', padding: '4px 8px', borderRadius: '20px' }}>
                <TrendingUp size={14} style={{ marginRight: '4px' }}/> +12.5%
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)', padding: '18px', borderRadius: '50%', color: 'white', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)' }}>
            <ArrowDownRight size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title" style={{ marginBottom: '4px' }}>Total Expenses</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
              <h2 style={{ fontSize: '32px', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-1px' }}>
                <AnimatedCounter value={totalExpense} prefix="₹" />
              </h2>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--danger)', background: 'var(--danger-light)', padding: '4px 8px', borderRadius: '20px' }}>
                <ArrowDownRight size={14} style={{ marginRight: '4px' }}/> -4.2%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-wrapper">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '28px' }}>
          
          {/* Animated Line Chart */}
          <div className="card" style={{ gridColumn: 'span 7' }}>
            <h3 className="card-title">Cash Flow Trends</h3>
            <div style={{ height: '320px', width: '100%', marginTop: '20px', display: 'flex' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 13 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 13 }} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 600 }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="income" stroke="var(--success)" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0 }} dot={{ r: 4, strokeWidth: 2 }} animationDuration={1500} />
                  <Line type="monotone" dataKey="expense" stroke="var(--danger)" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0 }} dot={{ r: 4, strokeWidth: 2 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart — hidden when no expenses */}
          <div className="card" style={{ gridColumn: 'span 5' }}>
            <h3 className="card-title">Expense Breakdown</h3>
            <div style={{ height: '320px', width: '100%', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pieData.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No expenses to display yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}  
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDarkMode ? '#fff' : '#000', fontWeight: 600 }} />
                    <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card" style={{ padding: '14px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <h3 className="card-title">Recent Transactions</h3>
          <div className="table-wrapper">
            {filteredTransactions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0', textAlign: 'center' }}>{searchQuery ? 'No matching transactions found.' : 'No transactions yet. Add one to get started!'}</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 5).map((t) => {
                    const CategoryIcon = t.category === 'Food' ? '🍔' : t.category === 'Home Rent' ? '🏠' : t.category === 'Salary' ? '💼' : t.category === 'Transport' ? '🚗' : t.category === 'Shopping' ? '🛍️' : '📁';
                    return (
                      <tr key={t._id}>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-main)' }}>{CategoryIcon}</span>
                          {t.category}
                        </td>
                        <td>
                          <span className={`badge badge-${t.type.toLowerCase()}`}>
                            {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)', textAlign: 'right' }}>
                          {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>



    </div>
  );
}
