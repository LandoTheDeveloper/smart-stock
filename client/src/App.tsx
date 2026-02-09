import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import ShoppingList from './pages/ShoppingList';
import MealPlanner from './pages/MealPlanner';
import Settings from './pages/Settings';
import Household from './pages/Household';
import Scan from './pages/Scan';
import ProtectedRoute from './routes/ProtectedRoute';
import HomeRedirect from './routes/HomeRedirect';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import CheckEmail from './pages/CheckEmail';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import FeedbackButton from './pages/Feedback';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<HomeRedirect />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/oauth-callback' element={<AuthCallback />} />
            <Route path='/check-email' element={<CheckEmail />} />
            <Route path='/verify-email' element={<VerifyEmail />} />
            <Route path='/reset-password' element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/pantry' element={<Pantry />} />
                <Route path='/recipes' element={<Recipes />} />
                <Route path='/shopping-list' element={<ShoppingList />} />
                <Route path='/meal-planner' element={<MealPlanner />} />
                <Route path='/settings' element={<Settings />} />
                <Route path='/household' element={<Household />} />
                <Route path='/scan' element={<Scan />} />
              </Route>
            </Route>

            <Route path='*' element={<HomeRedirect />} />
          </Routes>
          <FeedbackButton />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
