import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import Chart from 'chart.js/auto';
import "./Dashboard.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [datosHistoricos, setDatosHistoricos] = useState([]);
  const [ultimaLectura, setUltimaLectura] = useState(null);
  const [chartConsumo, setChartConsumo] = useState(null);
  
  const navigate = useNavigate();

  const firebaseConfig = {
    apiKey: "AIzaSyBbvd1srh6zLAPJACYJMVyL5o2GZ2zGUd0",
    authDomain: "smart-meter-power.firebaseapp.com",
    databaseURL: "https://smart-meter-power-default-rtdb.firebaseio.com",
    projectId: "smart-meter-power",
    storageBucket: "smart-meter-power.firebasestorage.app",
    messagingSenderId: "286614378307",
    appId: "1:286614378307:web:dd4a652ebc742d94f141f6"
  };

  const TARIFA_KWH = 500;

  useEffect(() => {
    // Verificar autenticación
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/login');
      return;
    }

    setUser(userData);

    // Actualizar fecha
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const sensoresRef = ref(database, 'sensores');
    
    onValue(sensoresRef, (snapshot) => {
      const datos = snapshot.val();
      
      if (datos) {
        actualizarDashboard(datos);
        setLoading(false);
        document.getElementById('statusText').textContent = 'Conectado';
      }
    });
  }, [navigate]);

  const actualizarDashboard = (datos) => {
    const corriente = [
      parseFloat(datos.corriente?.dato1) || 0,
      parseFloat(datos.corriente?.dato2) || 0,
      parseFloat(datos.corriente?.dato3) || 0
    ];
    
    const voltaje = [
      parseFloat(datos.voltaje?.dato1) || 0,
      parseFloat(datos.voltaje?.dato2) || 0
    ];

    const voltajeProm = (voltaje[0] + voltaje[1]) / 2;
    const corrienteTotal = corriente[0] + corriente[1] + corriente[2];
    const potenciaTotal = voltajeProm * corrienteTotal;

    // Actualizar métricas
    document.getElementById('potenciaActual').textContent = potenciaTotal.toFixed(0);
    document.getElementById('gaugeValue').textContent = potenciaTotal.toFixed(0);
    
    const progreso = Math.min((potenciaTotal / 5000) * 100, 100);
    document.getElementById('potenciaProgress').style.width = progreso + '%';

    const estadoEl = document.getElementById('estadoPotencia');
    if (potenciaTotal < 1500) {
      estadoEl.textContent = 'Bajo';
      estadoEl.className = 'badge bg-success';
    } else if (potenciaTotal < 3000) {
      estadoEl.textContent = 'Normal';
      estadoEl.className = 'badge bg-primary';
    } else {
      estadoEl.textContent = 'Alto';
      estadoEl.className = 'badge bg-warning';
    }

    actualizarGauge(potenciaTotal, 5000);

    document.getElementById('corriente1').textContent = corriente[0].toFixed(2) + ' A';
    document.getElementById('corriente2').textContent = corriente[1].toFixed(2) + ' A';
    document.getElementById('corriente3').textContent = corriente[2].toFixed(2) + ' A';

    document.getElementById('voltaje1').textContent = voltaje[0].toFixed(1) + ' V';
    document.getElementById('voltaje2').textContent = voltaje[1].toFixed(1) + ' V';

    const nuevaLectura = {
      potencia: potenciaTotal,
      corriente: corriente,
      voltaje: voltaje,
      timestamp: Date.now()
    };

    setUltimaLectura(nuevaLectura);

    setDatosHistoricos(prev => {
      const nuevos = [...prev, nuevaLectura];
      if (nuevos.length > 50) nuevos.shift();
      
      actualizarEstadisticas(nuevos);
      actualizarGrafica(nuevos);
      generarAlertas(potenciaTotal, voltaje);
      generarRecomendaciones(potenciaTotal, corriente, voltaje, nuevos);
      
      return nuevos;
    });

    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('es-ES');
  };

  const actualizarGauge = (valor, maxValor) => {
    const canvas = document.getElementById('gaugePotencia');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    const centerX = 100;
    const centerY = 100;
    const radius = 80;

    ctx.clearRect(0, 0, 200, 200);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.lineWidth = 20;
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.2)';
    ctx.lineCap = 'round';
    ctx.stroke();

    const porcentaje = Math.min(valor / maxValor, 1);
    const angulo = 0.75 * Math.PI + (porcentaje * 1.5 * Math.PI);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, angulo);
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    
    if (porcentaje < 0.3) {
      ctx.strokeStyle = '#10b981';
    } else if (porcentaje < 0.6) {
      ctx.strokeStyle = '#00d4ff';
    } else if (porcentaje < 0.8) {
      ctx.strokeStyle = '#f59e0b';
    } else {
      ctx.strokeStyle = '#ef4444';
    }
    
    ctx.stroke();
  };

  const actualizarEstadisticas = (historicos) => {
    if (historicos.length === 0) return;

    const consumoWh = historicos.reduce((sum, d) => sum + d.potencia, 0) / historicos.length * 24;
    const consumoKWh = (consumoWh / 1000).toFixed(2);
    document.getElementById('consumoHoy').textContent = consumoKWh;

    const costo = (consumoKWh * TARIFA_KWH).toFixed(0);
    document.getElementById('costoHoy').textContent = '$' + costo;

    const datoPico = historicos.reduce((max, d) => d.potencia > max.potencia ? d : max);
    document.getElementById('picoMaximo').textContent = datoPico.potencia.toFixed(0);
  };

  const actualizarGrafica = (historicos) => {
    if (historicos.length === 0) return;

    const ctx = document.getElementById('chartConsumo');
    if (!ctx) return;
    
    if (chartConsumo) {
      chartConsumo.destroy();
    }

    const labels = historicos.map((d) => {
      const fecha = new Date(d.timestamp);
      return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    });

    const datos = historicos.map(d => d.potencia);

    const nuevoChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Potencia (W)',
          data: datos,
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true,
            labels: { color: '#e0e0e0' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af',
              callback: function(value) {
                return value + ' W';
              }
            },
            grid: { color: 'rgba(102, 126, 234, 0.1)' }
          },
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(102, 126, 234, 0.1)' }
          }
        }
      }
    });

    setChartConsumo(nuevoChart);
  };

  const generarAlertas = (potencia, voltaje) => {
    const alertas = [];

    if (potencia > 4000) {
      alertas.push({
        icon: '🚨',
        titulo: 'Consumo Critico',
        texto: `Consumo muy elevado: ${potencia.toFixed(0)}W. Reduce el uso inmediatamente.`,
        clase: 'alert-danger'
      });
    } else if (potencia > 3000) {
      alertas.push({
        icon: '⚠️',
        titulo: 'Consumo Alto',
        texto: `Consumo elevado: ${potencia.toFixed(0)}W. Considera apagar dispositivos innecesarios.`,
        clase: 'alert-warning'
      });
    }

    const voltajeProm = (voltaje[0] + voltaje[1]) / 2;
    if (voltajeProm < 200 || voltajeProm > 240) {
      alertas.push({
        icon: '⚡',
        titulo: 'Voltaje Anormal',
        texto: `Voltaje fuera de rango: ${voltajeProm.toFixed(1)}V. Verifica tu instalacion electrica.`,
        clase: 'alert-danger'
      });
    }

    if (alertas.length === 0) {
      alertas.push({
        icon: '✅',
        titulo: 'Sistema Normal',
        texto: 'Todos los parametros dentro de rangos normales',
        clase: 'alert-success'
      });
    }

    const alertsList = document.getElementById('alertsList');
    if (alertsList) {
      alertsList.innerHTML = alertas.map(a => `
        <div class="alert-item ${a.clase}">
          <div class="d-flex align-items-center">
            <div class="fs-3 me-3">${a.icon}</div>
            <div>
              <div class="fw-bold">${a.titulo}</div>
              <small>${a.texto}</small>
            </div>
          </div>
        </div>
      `).join('');
    }
  };

  const generarRecomendaciones = (potencia, corriente, voltaje, historicos) => {
    const recomendaciones = [];

    if (historicos.length >= 10) {
      const promedio = historicos.slice(-10).reduce((sum, d) => sum + d.potencia, 0) / 10;
      const tendencia = (potencia - promedio) / promedio * 100;

      if (tendencia > 20) {
        recomendaciones.push({
          icon: '📈',
          titulo: 'Consumo en Aumento',
          texto: `Tu consumo aumento ${tendencia.toFixed(0)}% en los ultimos minutos. Identifica dispositivos de alto consumo.`,
          ahorro: 'Potencial ahorro: 15-25%'
        });
      } else if (tendencia < -20) {
        recomendaciones.push({
          icon: '📉',
          titulo: 'Excelente Gestion',
          texto: `Has reducido tu consumo en ${Math.abs(tendencia).toFixed(0)}%. Sigue asi!`,
          ahorro: 'Ahorro actual: Optimo'
        });
      }
    }

    const corrienteMax = Math.max(...corriente);
    const corrienteMin = Math.min(...corriente.filter(c => c > 0));
    const desequilibrio = ((corrienteMax - corrienteMin) / corrienteMax) * 100;

    if (desequilibrio > 20) {
      recomendaciones.push({
        icon: '⚖️',
        titulo: 'Desequilibrio de Cargas',
        texto: `Las fases tienen un desequilibrio del ${desequilibrio.toFixed(0)}%. Redistribuye tus cargas electricas.`,
        ahorro: 'Potencial ahorro: 5-10%'
      });
    }

    const hora = new Date().getHours();
    if (hora >= 18 && hora <= 22 && potencia > 2000) {
      recomendaciones.push({
        icon: '🕐',
        titulo: 'Horario Pico',
        texto: 'Estas en horario pico (6pm-10pm). Pospon tareas de alto consumo como lavadoras o secadoras.',
        ahorro: 'Potencial ahorro: 20-30%'
      });
    }

    if (recomendaciones.length === 0) {
      recomendaciones.push({
        icon: '🎯',
        titulo: 'Consumo Optimo',
        texto: 'Tu consumo esta optimizado. Manten estos habitos de eficiencia energetica.',
        ahorro: 'Estado: Excelente'
      });
    }

    const recomendacionesList = document.getElementById('recomendacionesList');
    if (recomendacionesList) {
      recomendacionesList.innerHTML = recomendaciones.map(r => `
        <div class="recommendation-card">
          <div class="fw-bold mb-2">
            ${r.icon} ${r.titulo}
          </div>
          <p class="mb-2" style="font-size: 0.9rem; color: #b0b8d4;">${r.texto}</p>
          <small class="text-primary fw-bold">
            <i class="bi bi-piggy-bank"></i> ${r.ahorro}
          </small>
        </div>
      `).join('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="container-fluid px-4">
        <div className="glass-card">
          <div className="spinner-container">
            <div className="loading-spinner"></div>
            <p className="mt-4 text-muted fw-semibold">Cargando datos en tiempo real...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-user">
      <div className="container-fluid px-4">
        {/* NAVBAR */}
        <div className="navbar-custom d-flex justify-content-between align-items-center">
          <h4 className="mb-0 text-white fw-bold">
            <i className="bi bi-lightning-charge-fill"></i>
            Optimizador de Energia
          </h4>
          <div className="d-flex align-items-center gap-3">
            <div className="user-badge">
              <i className="bi bi-person-circle"></i>
              <span>{user?.nombre}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i> Cerrar Sesion
            </button>
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="glass-card hero-card">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3">
                <i className="bi bi-lightning-charge-fill"></i>
                Monitor en Tiempo Real
              </h1>
              <p className="lead mb-4">Sistema Inteligente de Optimizacion Energetica</p>
              <div className="d-flex flex-wrap gap-3">
                <div className="status-badge">
                  <div className="status-dot" id="statusDot"></div>
                  <span id="statusText">Conectando...</span>
                </div>
                <div className="status-badge">
                  <i className="bi bi-clock"></i>
                  <span id="lastUpdate">--:--:--</span>
                </div>
                <div className="status-badge">
                  <i className="bi bi-calendar3"></i>
                  <span id="currentDate">--</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DASHBOARD CONTENT */}
        <div id="dashboardContent">
          {/* MÉTRICAS PRINCIPALES */}
          <div className="row g-4 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="glass-card metric-card">
                <div className="metric-icon primary">
                  <i className="bi bi-lightning-fill"></i>
                </div>
                <div className="metric-value" id="potenciaActual">0</div>
                <div className="metric-label">Potencia Actual (W)</div>
                <div className="progress-custom mt-3">
                  <div className="progress-bar progress-bar-animated-custom" id="potenciaProgress" style={{width: '0%'}}></div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6">
              <div className="glass-card metric-card">
                <div className="metric-icon success">
                  <i className="bi bi-battery-charging"></i>
                </div>
                <div className="metric-value" id="consumoHoy">0</div>
                <div className="metric-label">Consumo Hoy (kWh)</div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6">
              <div className="glass-card metric-card">
                <div className="metric-icon warning">
                  <i className="bi bi-cash-coin"></i>
                </div>
                <div className="metric-value" id="costoHoy">$0</div>
                <div className="metric-label">Costo Estimado</div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6">
              <div className="glass-card metric-card">
                <div className="metric-icon info">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <div className="metric-value" id="picoMaximo">0</div>
                <div className="metric-label">Pico Maximo (W)</div>
              </div>
            </div>
          </div>

          {/* GAUGE Y GRÁFICA */}
          <div className="row g-4 mb-4">
            <div className="col-lg-4">
              <div className="glass-card p-4">
                <h5 className="fw-bold mb-4">
                  <i className="bi bi-speedometer2 text-primary"></i>
                  Potencia en Tiempo Real
                </h5>
                <div className="gauge-container">
                  <canvas id="gaugePotencia"></canvas>
                  <div className="gauge-value">
                    <div className="gauge-number" id="gaugeValue">0</div>
                    <div className="gauge-unit">WATTS</div>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <span className="badge bg-primary" id="estadoPotencia">Normal</span>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="glass-card p-4">
                <h5 className="fw-bold mb-4">
                  <i className="bi bi-graph-up text-primary"></i>
                  Historial de Consumo
                </h5>
                <div className="chart-container">
                  <canvas id="chartConsumo"></canvas>
                </div>
              </div>
            </div>
          </div>

          {/* CORRIENTE Y VOLTAJE */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="glass-card p-4">
                <h5 className="fw-bold mb-4">
                  <i className="bi bi-plug text-primary"></i>
                  Corriente Electrica
                </h5>
                <div className="data-row">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">
                      <i className="bi bi-circle-fill text-primary" style={{fontSize: '8px'}}></i>
                      Corriente L1
                    </span>
                    <span className="fs-5 fw-bold" id="corriente1" style={{color: '#00d4ff'}}>0.00 A</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">
                      <i className="bi bi-circle-fill text-success" style={{fontSize: '8px'}}></i>
                      Corriente L2
                    </span>
                    <span className="fs-5 fw-bold" id="corriente2" style={{color: '#00d4ff'}}>0.00 A</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">
                      <i className="bi bi-circle-fill text-warning" style={{fontSize: '8px'}}></i>
                      Corriente L3
                    </span>
                    <span className="fs-5 fw-bold" id="corriente3" style={{color: '#00d4ff'}}>0.00 A</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="glass-card p-4">
                <h5 className="fw-bold mb-4">
                  <i className="bi bi-lightning text-warning"></i>
                  Voltaje
                </h5>
                <div className="data-row">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">
                      <i className="bi bi-circle-fill text-info" style={{fontSize: '8px'}}></i>
                      Voltaje L1-N
                    </span>
                    <span className="fs-5 fw-bold" id="voltaje1" style={{color: '#00d4ff'}}>0.0 V</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">
                      <i className="bi bi-circle-fill text-danger" style={{fontSize: '8px'}}></i>
                      Voltaje L2-N
                    </span>
                    <span className="fs-5 fw-bold" id="voltaje2" style={{color: '#00d4ff'}}>0.0 V</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ANÁLISIS Y ALERTAS */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="glass-card p-4">
                <h5 className="fw-bold mb-4">
                  <i className="bi bi-robot text-primary"></i>
                  Analisis Inteligente
                  <span className="ia-badge">IA</span>
                </h5>
                <div id="recomendacionesList">
                  <div className="recommendation-card">
                    <div className="fw-bold mb-2">
                      <i className="bi bi-lightbulb"></i>
                      Analizando patrones...
                    </div>
                    <small className="text-muted">Recopilando datos para generar recomendaciones</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="glass-card p-4">
                <h5 className="fw-bold mb-4">
                  <i className="bi bi-bell text-warning"></i>
                  Alertas del Sistema
                </h5>
                <div id="alertsList">
                  <div className="alert-item alert-success">
                    <div className="d-flex align-items-center">
                      <div className="fs-3 me-3">✅</div>
                      <div>
                        <div className="fw-bold">Sistema Operativo</div>
                        <small>Esperando datos del sensor...</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;