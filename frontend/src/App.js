import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./scr/components/Login";
import Register from "./scr/components/Register";
import Dashboard from "./scr/components/Dashboard";
import DashboardAdmin from "./scr/components/DashboardAdmin";
import { getUser } from "./utils/auth";
import "./App.css";

// Componente para proteger rutas
function ProtectedRoute({ children, adminOnly = false }) {
  const user = getUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user.rol !== 'administrador') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Componente para redirigir si ya está autenticado
function PublicRoute({ children }) {
  const user = getUser();
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta raíz redirige al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas públicas (solo accesibles si NO estás autenticado) */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Rutas protegidas (solo accesibles si ESTÁS autenticado) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Ruta de administrador (solo para rol administrador) */}
        <Route 
          path="/dashboard-admin" 
          element={
            <ProtectedRoute adminOnly={true}>
              <DashboardAdmin />
            </ProtectedRoute>
          } 
        />

        {/* Ruta 404 - cualquier otra ruta redirige al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;