import { NavLink, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, Wallet, LogOut, ArrowRightLeft } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Sidebar({ isOpen, closeSidebar }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={closeSidebar}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 99 }}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Wallet size={20} strokeWidth={2.5} />
          </div>
          TrackMy₹
        </div>

        <nav className="sidebar-nav">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <Home size={18} />
            Dashboard
          </NavLink>
          <NavLink 
            to="/transactions" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <ArrowRightLeft size={18} />
            Transactions
          </NavLink>
          <NavLink 
            to="/add-expense" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <PlusCircle size={18} />
            Add Entity
          </NavLink>
          
          <div style={{ flex: 1 }}></div>


          <button 
            onClick={handleLogout}
            className="nav-item" 
            style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
          >
            <LogOut size={18} />
            Log Out
          </button>
        </nav>
      </aside>
    </>
  );
}
