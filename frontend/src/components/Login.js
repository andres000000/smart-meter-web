import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const validarCorreo = (correo) => {
    const regex = /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/;
    return regex.test(correo);
  };

  const mostrarMensaje = (texto, tipo) => {
    setMessage(texto);
    setMessageType(tipo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpiar mensajes previos
    setMessage("");
    setMessageType("");

    if (!validarCorreo(correo)) {
      mostrarMensaje("❌ El correo no es válido", "error");
      return;
    }

    if (!password) {
      mostrarMensaje("❌ Por favor ingresa tu contraseña", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar token y usuario en localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        mostrarMensaje("✅ Login exitoso, redirigiendo...", "success");

        // Redirigir al dashboard usando React Router
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        mostrarMensaje("❌ " + (data.msg || "Error en login"), "error");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("⚠️ Error de conexión con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="form-container">
        <h2 className="title-black">⚡ Login</h2>
        <p className="subtitle">Optimizador Inteligente de Energía</p>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Email (ej: usuario@dominio.com)"
              required
            />
          </div>
          <div className="input-box">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="links">
          <Link to="/forgot">¿Olvidaste tu contraseña?</Link>
          <Link to="/register">Crear cuenta</Link>
        </div>

        {loading && (
          <div className="loading">
            <span className="spinner"></span>Verificando credenciales...
          </div>
        )}

        {message && (
          <p className={`message visible ${messageType}`}>{message}</p>
        )}
      </div>
    </div>
  );
}

export default Login;