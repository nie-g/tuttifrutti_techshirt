import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AdminDashboardPage from './pages/AdminDashboard';
import DesignerDashboardPage from './pages/DesignerDashboard';
import ClientDashboardPage from './pages/ClientDashboard';
import AboutPage from './pages/AboutPage';
import NotificationsPage from './pages/Notifications';
import UserRequests from './pages/UserRequests';
import Requests from './pages/Requests';
import Templates from './pages/Templates';
import InventoryPage from './pages/Inventory';
import Users from './pages/Users';
import DesignerCanvasPage from './pages/DesignCanvasPage';
import UserDesigns from './pages/UserDesigns';
import SeeDesign from './pages/SeeDesign';
import ClientProfile from './pages/ClientProfile';
import Portfolio from './pages/Potfolio';
import Gallery from './pages/Gallery';
import Designs from './pages/Designs';
import AdminDesigns from './pages/AdminDesigns';
import BrowseGallery from './pages/BrowseGallery';
import Register from './pages/Register';
import RegisterDesigner from './pages/RegisterDesigner';
import RegisterAdmin from './pages/RegisterAdmin';
import Login from './pages/Login';
import Reports from './pages/AdminReports';
import AdminOrdersReport from './pages/admin/SalesReports';
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/designer" element={<RegisterDesigner />} />
        <Route path="/register/admin" element={<RegisterAdmin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/designer" element={<DesignerDashboardPage />} />
        <Route path="/Client" element={<ClientDashboardPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/client/requests" element={<UserRequests />} />
        <Route path="/admin/requests" element={<Requests />} />
        <Route path="/admin/templates" element={<Templates />} />
        <Route path="/admin/inventory" element={<InventoryPage />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/designer/canvas/:requestId" element={<DesignerCanvasPage />} />
        <Route path="/client/designs" element={<UserDesigns />} />
        <Route path="/client/seeDesign/:designId" element={<SeeDesign />} />
        <Route path="/client/settings" element={<ClientProfile />} />
        <Route path="/designer/settings" element={<Portfolio />} />
        <Route path="/designer/gallery" element={<Gallery />} />
        <Route path="/designer/designs" element={<Designs />} />
        <Route path="/admin/designs" element={<AdminDesigns />} />
        <Route path="/client/browse" element={<BrowseGallery />} />
        <Route path="/admin/orders-report" element={<AdminOrdersReport />} />
        <Route path="/admin/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
