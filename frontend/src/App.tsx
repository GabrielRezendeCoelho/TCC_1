import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PageContainer, PrivateRoute } from './components/layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Packages } from './pages/Packages';
import { Routes as RoutesPage } from './pages/Routes';
import { Drivers } from './pages/Drivers';
import './index.css';

/**
 * Componente raiz do TrackGo Web — define rotas e autenticação.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas com layout */}
          <Route
            element={
              <PrivateRoute>
                <PageContainer />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/drivers" element={<Drivers />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
