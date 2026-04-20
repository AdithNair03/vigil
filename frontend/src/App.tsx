import { TenantProvider } from './lib/TenantContext';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LiveFeed from './pages/LiveFeed';
import CustomerTimeline from './pages/CustomerTimeline';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import IntegrationDocs from './pages/IntegrationDocs';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import CustomerList from './pages/CustomerList';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import ModelPerformance from './pages/ModelPerformance';
import { ThemeProvider } from './context/ThemeContext';

// Protected Route Wrapper for Admin
const ProtectedAdmin = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('vigil_admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

// Protected Route Wrapper for App Users
const ProtectedUser = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('vigil_user_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/admin/login'].includes(location.pathname);

  return (
    <ThemeProvider>
      <TenantProvider>
        <div className="flex h-screen w-full bg-vigil-content text-vigil-base overflow-hidden transition-colors duration-300">
        {!isAuthPage && <Sidebar />}
        <main className={`flex-1 ${!isAuthPage ? 'ml-64' : ''} bg-vigil-content relative overflow-hidden transition-colors duration-300`}>
        <Routes>
          <Route path="/" element={<ProtectedUser><LiveFeed /></ProtectedUser>} />
          <Route path="/customer/:userId" element={<ProtectedUser><CustomerTimeline /></ProtectedUser>} />
          <Route path="/analytics" element={<ProtectedUser><Analytics /></ProtectedUser>} />
          <Route path="/customers" element={<ProtectedUser><CustomerList /></ProtectedUser>} />
          <Route path="/alerts" element={<ProtectedUser><Alerts /></ProtectedUser>} />
          <Route path="/settings" element={<ProtectedUser><Settings /></ProtectedUser>} />
          <Route path="/docs" element={<ProtectedUser><IntegrationDocs /></ProtectedUser>} />
          <Route 
            path="/admin" 
            element={
              <ProtectedAdmin>
                <Admin />
              </ProtectedAdmin>
            } 
          />
          <Route 
            path="/model-performance" 
            element={
              <ProtectedAdmin>
                <ModelPerformance />
              </ProtectedAdmin>
            } 
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      </div>
      </TenantProvider>
    </ThemeProvider>
  );
}

export default App;
