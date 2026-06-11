import { Moon, Sun, Menu, Search, LogOut } from 'lucide-react';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar({ toggleSidebar, isDarkMode, toggleTheme, searchQuery, setSearchQuery }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Generate initials from user name or email
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

  // Generate a color based on user ID for the avatar
  const getAvatarColor = () => {
    if (!user?.id) return '#818cf8';
    const colors = ['#818cf8', '#10b981', '#ef4444', '#f59e0b', '#a855f7', '#06b6d4'];
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) {
      hash = user.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button 
          className="icon-btn" 
          onClick={toggleSidebar} 
        >
          <Menu size={20} />
        </button>
        <div className="search-bar">
          <Search size={18} className="text-muted" color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search transactions, insights..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="nav-profile">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Dark Mode">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="profile-dropdown"
            onClick={() => setShowProfile(!showProfile)}
            title="View Profile"
            style={{
              background: getAvatarColor(),
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: '16px',
              transition: 'transform 0.2s ease'
            }}
          >
            {initials}
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div style={{
              position: 'absolute',
              top: '50px',
              right: '0',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              minWidth: '280px',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease forwards',
              backdropFilter: 'none'
            }}>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    background: getAvatarColor(),
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '20px'
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
                      {user?.name || 'User'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '12px' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 500,
                      fontSize: '14px',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                    onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
