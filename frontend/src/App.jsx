import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import CustomerMenu from './pages/CustomerMenu';

import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';
import KitchenView from './pages/KitchenView';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/menu/:tableId" element={<CustomerMenu />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/kitchen" element={<KitchenView />} />
      </Routes>
    </div>
  );
}

export default App;
