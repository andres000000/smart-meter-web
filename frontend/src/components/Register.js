import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

function Register() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("usuario");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  
  const navigate = useNavigate();

  const validarCorreo = (correo) => {
    const regex = /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/;
    return regex.test(correo);
  };

  const validarPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    return regex.test(password);
  };

  const mostrarMensaje = (texto, tipo) => {
    setMessage(texto);
    setMessageType(tipo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!nombre.trim()) {
      mostrarMensaje("❌ Por favor ingresa tu nombre", "error");
      return;
    }

    if (!validarCorreo(correo)) {
      mostrarMensaje("❌ Correo inválido", "error");
      return;
    }

    if (!validarPassword(password)) {
      mostrarMensaje("❌ Contraseña insegura (min. 8 caracteres, 1 mayúscula, 1 número, 1 símbolo)", "error");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, password, rol }),
      });

      const data = await response.json();

      if (response.ok) {
        mostrarMensaje(`✅ Registro exitoso como ${rol}. Redirigiendo...`, "success");

        // Guardar token
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        mostrarMensaje("❌ " + (data.msg || "Error en el registro"), "error");
      }
    } catch (err) {
      console.error("Error:", err);
      mostrarMensaje("⚠️ Error de conexión con el servidor", "error");
    }
  };

  return (
    <div className="register-container">
      <div className="form-container">
        <h2>Crear Cuenta</h2>
        <p className="subtitle">
          ⚡ Optimizador Inteligente de Energía en el Hogar
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              required
            />
          </div>

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
            <small className="password-hint">
              🔒 Min. 8 caracteres, 1 mayúscula, 1 número y 1 símbolo (!@#$%^&*)
            </small>
          </div>

          {/* SELECTOR DE ROL */}
          <div className="role-container">
            <span className="role-label">Tipo de Cuenta:</span>
            <div className="role-options">
              <div className="role-option">
                <input
                  type="radio"
                  id="rolUsuario"
                  name="rol"
                  value="usuario"
                  checked={rol === "usuario"}
                  onChange={(e) => setRol(e.target.value)}
                />
                <label htmlFor="rolUsuario">
                  👤 Usuario
                  <div className="role-description">Acceso al dashboard personal</div>
                </label>
              </div>

              <div className="role-option">
                <input
                  type="radio"
                  id="rolAdmin"
                  name="rol"
                  value="administrador"
                  checked={rol === "administrador"}
                  onChange={(e) => setRol(e.target.value)}
                />
                <label htmlFor="rolAdmin">
                  🔧 Administrador
                  <div className="role-description">Control total del sistema</div>
                </label>
              </div>
            </div>
          </div>

          <button type="submit">Registrarse</button>
        </form>

        <div className="links">
          <Link to="/login">← Volver al Login</Link>
        </div>

        {message && (
          <p className={`message visible ${messageType}`}>{message}</p>
        )}
      </div>
    </div>
  );
}

export default Register;