import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './components/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AssetsPage from './pages/AssetsPage';
import DebtsPage from './pages/DebtsPage';
import BudgetsPage from './pages/BudgetsPage';
import QuizzesPage from './pages/QuizzesPage';
import RetirementPage from './pages/RetirementPage';
import SimulationPage from './pages/SimulationPage';
import AdminTipsPage from './pages/AdminTipsPage';
import ProfilePage from './pages/ProfilePage';
import { formatINR } from './utils/currency';
import './App.css';

// Make formatINR globally accessible for easy use in components
window.formatINR = formatINR;

function App() {
  return (
    <AuthContextProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/resetpassword" element={<ResetPasswordPage />} />

        {/* Protected routes with MainLayout */}
        <Route
          path="/app"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="debts" element={<DebtsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="quizzes" element={<QuizzesPage />} />
          <Route path="retirement" element={<RetirementPage />} />
          <Route path="simulations" element={<SimulationPage />} />
          <Route path="admin/tips" element={<AdminTipsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch all - redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContextProvider>
  );
}

export default App;
