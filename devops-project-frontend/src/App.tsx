/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, Routes, Route, useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole, useAuth } from './hooks/useAuth';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import FloorPlan from './pages/FloorPlan';
import Coaches from './pages/Coaches';
import Membership from './pages/Membership';
import BookingHistory from './pages/BookingHistory';
import Settings from './pages/Settings';
import PaymentReturn from './pages/PaymentReturn';
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffSchedule from './pages/staff/StaffSchedule';
import SessionManagement from './pages/staff/SessionManagement';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Screen } from './types';

function RootRedirect({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <Login onNavigate={onNavigate} />;
}

export default function App() {
  const navigate = useNavigate();

  // Temporary adapter connecting existing UI components to the new React Router
  const handleNavigate = (screen: Screen) => {
    switch (screen) {
      case 'membershipTiers':
        navigate('/membership');
        break;
      case 'bookingHistory':
        navigate('/bookings');
        break;
      case 'floorPlan':
        navigate('/floor-plan');
        break;
      case 'dashboard':
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate(`/${screen.toLowerCase()}`);
        break;
    }
  };

  return (
    <Routes>
      {/* Public / Unauthenticated Routes */}
      <Route path="/" element={<Home onNavigate={handleNavigate} />} />
      <Route path="/login" element={<RootRedirect onNavigate={handleNavigate} />} />
      <Route path="/register" element={<Register onNavigate={handleNavigate} />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public browse routes */}
      <Route path="/floor-plan" element={<FloorPlan onNavigate={handleNavigate} />} />
      <Route path="/coaches" element={<Coaches onNavigate={handleNavigate} />} />
      <Route path="/membership" element={<Membership onNavigate={handleNavigate} />} />
      <Route path="/payment/return" element={<PaymentReturn onNavigate={handleNavigate} />} />
      <Route path="/payment/cancel" element={<Navigate to="/floor-plan" replace />} />

      {/* Authenticated customer routes */}
      <Route element={<ProtectedRoute requiredRoles={['Customer']} />}>
        <Route path="/bookings" element={<BookingHistory onNavigate={handleNavigate} />} />
        <Route path="/settings" element={<Settings onNavigate={handleNavigate} />} />
      </Route>
      {/* Admin Specific Protected Route Example */}
      <Route element={<ProtectedRoute requiredRoles={['Admin']} />}>
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Route>

      {/* Staff Specific Protected Routes */}
      <Route element={<ProtectedRoute requiredRoles={['Staff']} />}>
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff/schedule" element={<StaffSchedule />} />
        <Route path="/staff/sessions" element={<SessionManagement />} />
      </Route>
    </Routes>
  );
}
