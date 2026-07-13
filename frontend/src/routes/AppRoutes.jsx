import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import UserLayout from '../layouts/UserLayout';
import Login from '../pages/Login';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import CriteriaList from '../pages/admin/CriteriaList';
import VariableList from '../pages/admin/VariableList';
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
        <Route path="criteria" element={<CriteriaList />} />
        <Route path="variables" element={<VariableList />} />
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