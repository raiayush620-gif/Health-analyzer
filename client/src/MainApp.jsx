import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import Analysis from './pages/Analysis';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

// Icons
import { 
  Home as HomeIcon, 
  Activity, 
  LayoutDashboard, 
  History as HistoryIcon, 
  User, 
  ShieldAlert, 
  LogOut, 
  LogIn 
} from 'lucide-react';

function MainApp() {
  const { user, loading, logout } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  // Monitor scroll for header blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Secure route switching
  useEffect(() => {
    const protectedPages = ['analysis', 'dashboard', 'history', 'profile', 'admin'];
    
    if (loading) return;

    if (protectedPages.includes(activePage) && !user) {
      // Redirect unauthenticated user to login
      setActivePage('auth');
    } else if (activePage === 'admin' && user?.role !== 'admin') {
      // Redirect non-admin users to home
      setActivePage('home');
    } else if (activePage === 'auth' && user) {
      // Redirect logged-in user away from auth to analysis
      setActivePage('analysis');
    }
  }, [activePage, user, loading]);

  const handlePageChange = (page) => {
    setEditRecord(null); // Clear editing context on tab change
    setActivePage(page);
  };

  const handleLogoutClick = () => {
    logout();
    handlePageChange('home');
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p className="loading-text">Restoring your session...</p>
      </div>
    );
  }

  return (
    <>
      <header id="navbar" className={isScrolled ? 'scrolled' : ''}>
        <nav className="nav-pill">
          <button 
            type="button" 
            className={activePage === 'home' ? 'active' : ''} 
            onClick={() => handlePageChange('home')}
          >
            <HomeIcon size={14} /> Home
          </button>
          
          {user ? (
            <>
              <button 
                type="button" 
                className={activePage === 'analysis' ? 'active' : ''} 
                onClick={() => handlePageChange('analysis')}
              >
                <Activity size={14} /> Analysis
              </button>
              <button 
                type="button" 
                className={activePage === 'dashboard' ? 'active' : ''} 
                onClick={() => handlePageChange('dashboard')}
              >
                <LayoutDashboard size={14} /> Dashboard
              </button>
              <button 
                type="button" 
                className={activePage === 'history' ? 'active' : ''} 
                onClick={() => handlePageChange('history')}
              >
                <HistoryIcon size={14} /> History
              </button>
              <button 
                type="button" 
                className={activePage === 'profile' ? 'active' : ''} 
                onClick={() => handlePageChange('profile')}
              >
                <User size={14} /> Profile
              </button>
              {user.role === 'admin' && (
                <button 
                  type="button" 
                  className={activePage === 'admin' ? 'active' : ''} 
                  onClick={() => handlePageChange('admin')}
                  style={{ color: '#b09eff', textShadow: activePage === 'admin' ? '0 0 15px #b09eff' : 'none' }}
                >
                  <ShieldAlert size={14} /> Admin
                </button>
              )}
              <button 
                type="button" 
                onClick={handleLogoutClick}
                style={{ color: '#ff4d4d' }}
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <button 
              type="button" 
              className={activePage === 'auth' ? 'active' : ''} 
              onClick={() => handlePageChange('auth')}
            >
              <LogIn size={14} /> Sign In
            </button>
          )}
        </nav>
      </header>

      <main>
        {activePage === 'home' && <Home setActivePage={handlePageChange} />}
        
        {activePage === 'auth' && <Auth setActivePage={handlePageChange} />}
        
        {activePage === 'analysis' && (
          <Analysis 
            setActivePage={handlePageChange} 
            editRecord={editRecord} 
            setEditRecord={setEditRecord} 
          />
        )}
        
        {activePage === 'dashboard' && <Dashboard setActivePage={handlePageChange} />}
        
        {activePage === 'history' && (
          <History 
            setActivePage={handlePageChange} 
            setEditRecord={setEditRecord} 
          />
        )}
        
        {activePage === 'profile' && <Profile />}
        
        {activePage === 'admin' && user?.role === 'admin' && <AdminDashboard />}
      </main>

      <footer>
        Developed by <strong>Ayush Rai</strong>
      </footer>
    </>
  );
}

export default MainApp;
