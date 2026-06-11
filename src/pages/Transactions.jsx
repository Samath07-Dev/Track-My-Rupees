import { useState } from 'react';
import { Filter, Calendar, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function Transactions({ transactions = [], searchQuery = '' }) {
  const [filterType, setFilterType] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  // Ensure transactions is an array
  const txList = Array.isArray(transactions) ? transactions : [];
  const allCategories = ['All', ...new Set(txList.map(t => t.category))];

  const filteredTransactions = txList.filter(t => {
    // Check if matches search query from navbar
    const matchesSearch = !searchQuery.trim() || 
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.amount.toString().includes(searchQuery) ||
      t.description?.toLowerCase().includes(searchQuery) ||
      t.type?.toLowerCase().includes(searchQuery);
    
    const matchesType = filterType === 'All' || t.type?.toLowerCase() === filterType.toLowerCase();
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="card" style={{ minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Transaction History</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>View and manage all your financial activities.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {searchQuery && (
            <div style={{ 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: '#6366f1',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Searching: <strong>{searchQuery}</strong>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-main)', padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)' }}>
            <Filter size={16} color="var(--text-muted)" style={{ margin: '0 4px' }}/>
            <select 
              className="form-control" 
              style={{ padding: '8px 40px 8px 16px', border: 'none', background: 'transparent', boxShadow: 'none' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--card-border)' }}></div>

            <select 
              className="form-control" 
              style={{ padding: '8px 40px 8px 16px', border: 'none', background: 'transparent', boxShadow: 'none' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
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
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => {
                const CategoryIcon = t.category === 'Food' ? '🍔' : t.category === 'Home Rent' ? '🏠' : t.category === 'Salary' ? '💼' : t.category === 'Transport' ? '🚗' : t.category === 'Shopping' ? '🛍️' : '📁';
                return (
                  <tr key={t._id}>
                    <td style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} />
                      {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-main)' }}>{CategoryIcon}</span>
                        {t.category}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${t.type.toLowerCase()}`}>
                        {t.type.toLowerCase() === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : 'var(--text-main)', textAlign: 'right', fontSize: '15px' }}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <p style={{ fontSize: '16px', fontWeight: 500 }}>No transactions found</p>
                    <p style={{ fontSize: '14px' }}>{searchQuery ? `No results for "${searchQuery}". Try adjusting your filters.` : 'No transactions yet. Add one to get started!'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
