import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import UserDashboard from './pages/UserDashboard';
import ManageCatalog from './pages/ManageCatalog';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers';
import ManageLogs from './pages/ManageLogs';

function AppContent() {
  const { user, isAdmin } = useAuth();
  const [activePage, setActivePage] = useState(() => {
    if (user) {
      return user.role === 'admin' ? 'admin-dashboard' : 'user-dashboard';
    }
    return 'home';
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedUserForCatalog, setSelectedUserForCatalog] = useState(null);

  useEffect(() => {
    if (user) {
      if (activePage === 'home') {
        setActivePage(user.role === 'admin' ? 'admin-dashboard' : 'user-dashboard');
      }
    } else if (activePage !== 'home') {
      setActivePage('home');
    }
  }, [user, activePage]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSelectUserCatalog = (userId) => {
    setSelectedUserForCatalog(userId);
    setActivePage('manage-catalog');
  };

  const renderCurrentPage = () => {
    if (!user) {
      return <HomePage setActivePage={setActivePage} onOpenAuth={() => setIsAuthOpen(true)} />;
    }

    switch (activePage) {
      case 'user-dashboard':
        return <UserDashboard setActivePage={setActivePage} />;

      case 'manage-catalog':
        return (
          <ManageCatalog
            onNotify={showToast}
            initialSelectedUserId={selectedUserForCatalog}
          />
        );

      case 'admin-dashboard':
        if (!isAdmin) {
          return <UserDashboard setActivePage={setActivePage} />;
        }
        return <AdminDashboard setActivePage={setActivePage} />;

      case 'manage-users':
        if (!isAdmin) {
          return <UserDashboard setActivePage={setActivePage} />;
        }
        return (
          <ManageUsers
            onNotify={showToast}
            onSelectUserCatalog={handleSelectUserCatalog}
          />
        );

      case 'manage-logs':
        if (!isAdmin) {
          return <UserDashboard setActivePage={setActivePage} />;
        }
        return <ManageLogs onNotify={showToast} />;

      default:
        return isAdmin ? (
          <AdminDashboard setActivePage={setActivePage} />
        ) : (
          <UserDashboard setActivePage={setActivePage} />
        );
    }
  };

  return (
    <div className="app-wrapper">
      <Navbar
        activePage={activePage}
        setActivePage={(page) => {
          setSelectedUserForCatalog(null);
          setActivePage(page);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="main-container">
        {renderCurrentPage()}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          showToast('Authentication successful.');
        }}
      />

      {toast && (
        <div className="toast-notice" style={{ borderColor: toast.type === 'error' ? '#f43f5e' : 'var(--teal-primary)' }}>
          <span style={{ fontWeight: 600 }}>{toast.type === 'error' ? 'Notice:' : 'Status:'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
