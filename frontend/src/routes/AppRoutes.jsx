import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import UserLayout from '../layouts/UserLayout';
import Login from '../pages/Login';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import TableList from '../pages/admin/TableList';
import TableDetail from '../pages/admin/TableDetail';
import CriteriaVariables from '../pages/admin/CriteriaVariables';
import AdminAssessments from '../pages/admin/Assessments';

// User pages
import UserDashboard from '../pages/user/Dashboard';
import AssessmentForm from '../pages/user/AssessmentForm';
import AssessmentResult from '../pages/user/AssessmentResult';
import AssessmentHistory from '../pages/user/AssessmentHistory';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="tables" element={<TableList />} />
        <Route path="tables/:tableId" element={<TableDetail />} />
        <Route path="tables/:tableId/criteria/:criteriaId" element={<CriteriaVariables />} />
        <Route path="assessments" element={<AdminAssessments />} />
      </Route>

      {/* User routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="assessment/new" element={<AssessmentForm />} />
        <Route path="assessments" element={<AssessmentHistory />} />
        <Route path="assessments/:id" element={<AssessmentResult />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}