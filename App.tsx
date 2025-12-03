import React from 'react';
import { ToastProvider } from './components/ui/Toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { NewAudit } from './pages/NewAudit';
import { NewVisit } from './pages/NewVisit';
import { SelectVisitType } from './pages/SelectVisitType';
import { AuditExecution } from './pages/AuditExecution';
import { AuditList } from './pages/AuditList';
import { ActionPlan } from './pages/ActionPlan';
import { ActionsList } from './pages/ActionsList';
import { AderenteAuditView } from './pages/AderenteAuditView';
import { AderenteDashboard } from './pages/AderenteDashboard';
import { AderenteActionList } from './pages/AderenteActionList';
import { AderenteNewVisit } from './pages/AderenteNewVisit';
import { AmontDashboard } from './pages/AmontDashboard';
import { AmontAuditView } from './pages/AmontAuditView';
import { AmontImportCSV } from './pages/AmontImportCSV';
import { AmontImportTasksCSV } from './pages/AmontImportTasksCSV';
import { VisitDetail } from './pages/VisitDetail';
import { Reports } from './pages/Reports';
import { getDefaultDashboard, canAccessDOTDashboard, canAccessAderenteDashboard, canAccessAmontDashboard, canViewReports, canAccessAdminDashboard } from './utils/permissions';
import { AdminDashboard } from './pages/AdminDashboard';

// Role-based protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireRole?: () => boolean }> = ({ children, requireRole }) => {
  const auth = localStorage.getItem('ontrack_auth');
  if (!auth) {
    return <Navigate to="/" replace />;
  }
  
  // Check role permission if specified
  if (requireRole && !requireRole()) {
    return <Navigate to={getDefaultDashboard()} replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <ToastProvider>
        <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <Dashboard />
            </ProtectedRoute>
        } />
        {/* Alias route for DOT dashboard to avoid navigation mismatches */}
        <Route path="/dot/dashboard" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <Dashboard />
            </ProtectedRoute>
        } />
        <Route path="/dot/new-audit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <NewAudit />
            </ProtectedRoute>
        } />
        <Route path="/new-audit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <NewAudit />
            </ProtectedRoute>
        } />
        <Route path="/dot/select-visit-type" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <SelectVisitType />
            </ProtectedRoute>
        } />
        <Route path="/amont/select-visit-type" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <SelectVisitType />
            </ProtectedRoute>
        } />
        <Route path="/select-visit-type" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <SelectVisitType />
            </ProtectedRoute>
        } />
        <Route path="/dot/new-visit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <NewVisit />
            </ProtectedRoute>
        } />
        <Route path="/amont/new-visit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <NewVisit />
            </ProtectedRoute>
        } />
        <Route path="/new-visit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <NewVisit />
            </ProtectedRoute>
        } />
        <Route path="/dot/audit/:id" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <AuditExecution />
            </ProtectedRoute>
        } />
         <Route path="/audit/:id/actions" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <ActionPlan />
            </ProtectedRoute>
        } />
         <Route path="/actions" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <ActionsList />
            </ProtectedRoute>
        } />
         <Route path="/history" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <AuditList />
            </ProtectedRoute>
        } />
        <Route path="/aderente/dashboard" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AderenteDashboard />
            </ProtectedRoute>
        } />
        <Route path="/aderente/audit/:id" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AderenteAuditView />
            </ProtectedRoute>
        } />
        <Route path="/aderente/actions" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AderenteActionList />
            </ProtectedRoute>
        } />
        <Route path="/aderente/new-visit" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AderenteNewVisit />
            </ProtectedRoute>
        } />
        <Route path="/aderente/visit/:id" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AuditExecution />
            </ProtectedRoute>
        } />
        <Route path="/amont/dashboard" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AmontDashboard />
            </ProtectedRoute>
        } />
        <Route path="/amont/import-visitas" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AmontImportTasksCSV />
            </ProtectedRoute>
        } />
        <Route path="/amont/audit/:id" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AmontAuditView />
            </ProtectedRoute>
        } />
        <Route path="/amont/visit/:id" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <VisitDetail />
            </ProtectedRoute>
        } />
        <Route path="/amont/reports" element={
            <ProtectedRoute requireRole={canViewReports}>
                <Reports />
            </ProtectedRoute>
        } />
      </Routes>
            <Routes>
                <Route path="/admin/dashboard" element={
                        <ProtectedRoute requireRole={canAccessAdminDashboard}>
                                <AdminDashboard />
                        </ProtectedRoute>
                } />
            </Routes>
        </Router>
        </ToastProvider>
  );
};

export default App;