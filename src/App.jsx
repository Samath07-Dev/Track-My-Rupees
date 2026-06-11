import { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Transactions from './pages/Transactions';
import Fab from './components/Fab';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Inner component so it can access AuthContext
function AppContent() {
  const { user } = useContext(AuthContext);

  const [transactions, setTransactions] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode for premium feel
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch transactions from MongoDB when user logs in
  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('https://track-my-rupees-backend.onrender.com/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      setTransactions(res.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Theme
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const addTransaction = async (newTx) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('https://track-my-rupees-backend.onrender.com/api/transactions', newTx, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      // Add the created transaction (with MongoDB _id) to state
      setTransactions([res.data, ...transactions]);
      return true;
    } catch (error) {
      console.error('Failed to add transaction:', error.message);
      return false;
    }
  };

  const deleteTransaction = async (txId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://track-my-rupees-backend.onrender.com/api/transactions/${txId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      setTransactions(transactions.filter(tx => tx._id !== txId));
      return true;
    } catch (error) {
      console.error('Failed to delete transaction:', error.message);
      return false;
    }
  };

  const updateTransaction = async (txId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`https://track-my-rupees-backend.onrender.com/api/transactions/${txId}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      setTransactions(transactions.map(tx => tx._id === txId ? res.data : tx));
      return true;
    } catch (error) {
      console.error('Failed to update transaction:', error.message);
      return false;
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes Wrapper */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
              
              <div className={`main-content ${!isSidebarOpen ? 'no-sidebar' : ''}`}>
                <Navbar 
                  isDarkMode={isDarkMode} 
                  toggleTheme={toggleTheme} 
                  toggleSidebar={toggleSidebar}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
                
                <div className="page-container">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard transactions={transactions} isDarkMode={isDarkMode} searchQuery={searchQuery} />} />
                    <Route path="/transactions" element={<Transactions transactions={transactions} searchQuery={searchQuery} />} />
                    <Route path="/add-expense" element={<AddTransaction onAdd={addTransaction} />} />
                  </Routes>
                </div>
                
                <Fab />
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

// Wrapper that provides AuthContext before AppContent consumes it
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
