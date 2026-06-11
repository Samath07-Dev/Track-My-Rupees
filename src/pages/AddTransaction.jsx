import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Calendar, Hash, Tag, Type, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AddTransaction({ onAdd }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    type: 'Expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [showToast, setShowToast] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const categories = {
    Income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'],
    Expense: ['Food', 'Home Rent', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Health', 'Other']
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'type') {
        newData.category = categories[value][0];
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount)) return;
    
    setIsLoading(true);
    const success = await onAdd({
      amount: parseFloat(formData.amount),
      type: formData.type.toLowerCase(),
      category: formData.category,
      date: new Date(formData.date).toISOString()
    });
    setIsLoading(false);
    
    if (success) {
      // Show success toast
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/transactions');
      }, 1500);
    } else {
      // Show error toast
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 3000);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
      
      {/* Success Toast */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--success)', color: 'white', padding: '12px 24px', borderRadius: '30px',
          display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-lg)',
          animation: 'fadeIn 0.3s ease forwards', zIndex: 1000, fontWeight: 500
        }}>
          <CheckCircle2 size={20} />
          Transaction Added Successfully!
        </div>
      )}

      {/* Error Toast */}
      {showError && (
        <div style={{
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          background: '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '30px',
          display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-lg)',
          animation: 'fadeIn 0.3s ease forwards', zIndex: 1000, fontWeight: 500
        }}>
          <AlertCircle size={20} />
          Failed to add transaction. Please try again.
        </div>
      )}

      <div className="card" style={{ padding: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '14px', borderRadius: '16px', color: 'white', boxShadow: 'var(--shadow-indigo)' }}>
            <PlusCircle size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>New Transaction</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Enter the details of your income or expense.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Type size={16} /> Transaction Type
              </label>
              <select name="type" className="form-control" value={formData.type} onChange={handleChange} disabled={isLoading}>
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} /> Date
              </label>
              <input type="date" name="date" className="form-control" required value={formData.date} onChange={handleChange} disabled={isLoading} />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={16} /> Amount
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)', fontSize: '18px', fontWeight: 500 }}>₹</span>
              <input 
                type="number" 
                name="amount" 
                className="form-control" 
                style={{ paddingLeft: '32px', fontSize: '18px', fontWeight: 500 }}
                placeholder="0.00" 
                step="0.01" 
                required 
                value={formData.amount} 
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={16} /> Category
            </label>
            <select name="category" className="form-control" value={formData.category} onChange={handleChange} disabled={isLoading}>
              {categories[formData.type].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '16px', fontSize: '16px', padding: '16px', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
