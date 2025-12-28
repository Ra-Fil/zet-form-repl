
import React, { useState, useEffect } from 'react';
import CustomerFormPage from './pages/CustomerFormPage';
import AdminPage from './pages/AdminPage';
import PriceListPage from './pages/PriceListPage';

const App: React.FC = () => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('locationchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('locationchange', handleLocationChange);
    };
  }, []);

  switch (path) {
    case '/admin':
      return <AdminPage />;
    case '/cenik':
      return <PriceListPage />;
    default:
      return <CustomerFormPage />;
  }
};

export default App;