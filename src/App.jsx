import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import our Restored Black Star Views
import BlackStarLogin from './features/PrivateEquity/views/BlackStarLogin';
import BlackStarHub from './views/BlackStarHub';

// Dashboards
import AdminDashboard from './features/PrivateEquity/views/AdminDashboard';
import StatementSummary from './features/PrivateEquity/components/StatementSummary';
import ContractorPortal from './features/PrivateEquity/views/ContractorPortal';

export default function App() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-black font-sans">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<BlackStarLogin />} />
            <Route path="/hub" element={<BlackStarHub />} />
            
            {/* Multi-Tenant Dashboards */}
            <Route path="/tenant/:tenantId/command-center" element={<AdminDashboard />} />
            <Route path="/tenant/:tenantId/statement-view" element={<StatementSummary />} />
            <Route path="/tenant/:tenantId/contractor-pipeline" element={<ContractorPortal />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}
