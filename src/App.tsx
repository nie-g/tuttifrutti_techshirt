import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignUpPage from './pages/SignUpPage';
import SignInPage from './pages/SignInPage';
import DesignerSignUpPage from './pages/DesignerSignUpPage';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AdminDashboardPage from './pages/AdminDashboard';
import DesignerDashboardPage from './pages/DesignerDashboard';
import ClientDashboardPage from './pages/ClientDashboard';
import AboutPage from './pages/AboutPage';
import NotificationsPage from './pages/Notifications';
import UserRequests from './pages/UserRequests';
import DesignerTasks from './pages/DesignerTasks';
import Requests from './pages/Requests';
import Templates from './pages/Templates';
import InventoryPage from './pages/Inventory';
import Users from './pages/Users';
import DesignerCanvasPage from './pages/DesignCanvasPage';
import UserDesigns from './pages/UserDesigns';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/signup/designer" element={<DesignerSignUpPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/designer" element={<DesignerDashboardPage />} />
        <Route path="/Client" element={<ClientDashboardPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/client/requests" element={<UserRequests />} />
        <Route path="/designer/tasks" element={<DesignerTasks />} />
        <Route path="/admin/requests" element={<Requests />} />
        <Route path="/admin/templates" element={<Templates />} />
        <Route path="/admin/inventory" element={<InventoryPage />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/designer/canvas/:requestId" element={<DesignerCanvasPage />} />
        <Route path="/client/designs" element={<UserDesigns />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
