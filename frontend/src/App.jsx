import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './layout/AdminLayout';
import WorkerLayout from './layout/WorkerLayout';
import Dashboard from './pages/Dashboard';
import Horarios from './pages/Horarios';
import Asistencias from './pages/Asistencias';
import Sueldos from './pages/Sueldos';
import AdminPanel from './pages/AdminPanel';
import { AuthProvider } from './context/AuthContext';
import { AuthContext } from './context/auth-context';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Cargando Sistema...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useContext(AuthContext);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Cargando Sistema...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<PrivateRoute><WorkerLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="asistencia" element={<Asistencias />} />
            <Route path="sueldos" element={<Sueldos />} />
            <Route path="horarios" element={<Horarios />} />
          </Route>

          <Route path="/dashboard/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminPanel />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
