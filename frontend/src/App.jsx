import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Horarios from './pages/Horarios';
import AdminPanel from './pages/AdminPanel';
import { AuthProvider } from './context/AuthContext';
import { AuthContext } from './context/auth-context';
import { useContext } from 'react';

// Componente para proteger las rutas privadas
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="h-screen flex items-center justify-center">Cargando Sistema...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useContext(AuthContext);
  if (loading) return <div className="h-screen flex items-center justify-center">Cargando Sistema...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Privadas Protegidas bajo el Layout Unificado */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="asistencia" element={<div className="p-8"><h1 className="text-2xl font-light">Módulo Asistencia en progreso...</h1></div>} />
            <Route path="sueldos" element={<div className="p-8"><h1 className="text-2xl font-light">Módulo Sueldos en progreso...</h1></div>} />
            <Route path="horarios" element={<Horarios />} />
            <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App;
