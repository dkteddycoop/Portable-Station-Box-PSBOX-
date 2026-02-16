function browseForGame(){if(window.psboxSystem)psboxSystem.browseForGame()}
function navigateCarousel(direction){if(window.psboxSystem)psboxSystem.navigateCarousel(direction)}
function closeQuickMenu(){if(window.psboxSystem)psboxSystem.closeQuickMenu()}
function editSelectedGame(){if(window.psboxSystem)psboxSystem.editSelectedGame()}
function removeSelectedGame(){if(window.psboxSystem)psboxSystem.removeSelectedGame()}
function launchSelectedGame(){if(window.psboxSystem)psboxSystem.launchSelectedGame()}
function cancelLoading(){if(window.psboxSystem)psboxSystem.cancelLoading()}
function closeConfigModal(){if(window.psboxSystem)psboxSystem.closeConfigModal()}
function restorePSBOX(){if(window.psboxSystem){psboxSystem.restorePSBOXWindow();psboxSystem.closeConfigModal()}}
function showAbout(){if(window.psboxSystem)psboxSystem.showAbout()}
function openAddGameModal(){if(window.psboxSystem)psboxSystem.openAddGameModal()}
function closeAddGameModal(){if(window.psboxSystem)psboxSystem.closeAddGameModal()}

if(typeof require!=='undefined'){window.fs=require('fs')}

// renderer.js - Sección Controller Test Lab
class ControllerTestLabUI {
  constructor() {
    this.currentTest = null;
    this.visualization = null;
    this.testHistory = [];
    this.initTestLab();
  }

  initTestLab() {
    // Escuchar eventos
    window.electronAPI.onTestLabSample((data) => {
      this.handleTestSample(data);
    });

    window.electronAPI.onTestLabResults((data) => {
      this.handleTestResults(data);
    });

    // Crear UI si no existe
    if (!document.getElementById('test-lab-modal')) {
      this.createTestLabModal();
    }
  }

  // Iniciar test desde el slot manager
  startTestFromSlot(controllerId, controllerData) {
    this.currentTest = {
      controllerId,
      controllerData,
      startTime: Date.now(),
      samples: [],
      visualization: this.createVisualization(controllerData)
    };

    // Mostrar modal
    this.showTestLabModal();
    
    // Iniciar test en main process
    window.electronAPI.startTestLab(controllerId, controllerData);
    
    // Iniciar loop de actualización UI
    this.startUpdateLoop();
  }

  createTestLabModal() {
    const modal = document.createElement('div');
    modal.id = 'test-lab-modal';
    modal.className = 'test-lab-modal hidden';
    
    modal.innerHTML = `
      <div class="test-lab-container">
        <div class="test-lab-header">
          <h2>🎮 Controller Test Lab</h2>
          <div class="test-meta" id="test-meta">
            <span class="controller-id">Controller: <strong>#0</strong></span>
            <span class="test-timer">Time: <strong>0s</strong></span>
            <span class="test-status">Status: <strong>Preparing...</strong></span>
          </div>
          <button class="btn-close-test">✕</button>
        </div>
        
        <div class="test-lab-content">
          <!-- Visualización principal -->
          <div class="visualization-container" id="visualization-container">
            <div class="controller-visualization">
              <!-- Se llenará dinámicamente -->
            </div>
          </div>
          
          <!-- Paneles de métricas -->
          <div class="metrics-panels">
            <div class="metrics-left">
              <!-- Inputs en tiempo real -->
              <div class="realtime-panel card">
                <h3>📊 Live Inputs</h3>
                <div class="realtime-grid" id="realtime-grid">
                  <!-- Se llenará dinámicamente -->
                </div>
              </div>
              
              <!-- Gráficos -->
              <div class="charts-panel card">
                <h3>📈 Input History</h3>
                <div class="charts-container">
                  <canvas id="input-chart" width="400" height="200"></canvas>
                </div>
              </div>
            </div>
            
            <div class="metrics-right">
              <!-- Pruebas específicas -->
              <div class="tests-panel card">
                <h3>🔍 Specific Tests</h3>
                <div class="test-buttons">
                  <button class="test-btn" data-test="latency">⏱️ Latency Test</button>
                  <button class="test-btn" data-test="deadzone">🎯 Deadzone Test</button>
                  <button class="test-btn" data-test="pressure">💪 Pressure Test</button>
                  <button class="test-btn" data-test="ghost">👻 Ghost Test</button>
                  <button class="test-btn" data-test="vibration">📳 Vibration Test</button>
                </div>
                <div class="test-results" id="test-results">
                  <!-- Resultados de pruebas específicas -->
                </div>
              </div>
              
              <!-- Estadísticas -->
              <div class="stats-panel card">
                <h3>📋 Statistics</h3>
                <div class="stats-grid" id="stats-grid">
                  <div class="stat-item">
                    <span class="stat-label">Total Inputs:</span>
                    <span class="stat-value" id="stat-total">0</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Max Latency:</span>
                    <span class="stat-value" id="stat-latency">0ms</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Ghost Inputs:</span>
                    <span class="stat-value" id="stat-ghost">0</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Deadzone Issues:</span>
                    <span class="stat-value" id="stat-deadzone">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="test-lab-footer">
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" id="test-progress"></div>
            </div>
            <div class="progress-text" id="progress-text">0% Complete</div>
          </div>
          
          <div class="action-buttons">
            <button class="btn btn-secondary" id="pause-test">⏸️ Pause</button>
            <button class="btn btn-warning" id="cancel-test">❌ Cancel</button>
            <button class="btn btn-primary" id="export-results">💾 Export</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.setupTestLabEvents();
  }

  setupTestLabEvents() {
    // Botón cerrar
    document.querySelector('.btn-close-test').addEventListener('click', () => {
      this.hideTestLabModal();
    });
    
    // Botones de prueba específica
    document.querySelectorAll('.test-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const testType = e.target.dataset.test;
        this.runSpecificTest(testType);
      });
    });
    
    // Botones de acción
    document.getElementById('pause-test').addEventListener('click', () => {
      this.togglePauseTest();
    });
    
    document.getElementById('cancel-test').addEventListener('click', () => {
      this.cancelTest();
    });
    
    document.getElementById('export-results').addEventListener('click', () => {
      this.exportResults();
    });
  }

  showTestLabModal() {
    document.getElementById('test-lab-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  hideTestLabModal() {
    document.getElementById('test-lab-modal').classList.add('hidden');
    document.body.style.overflow = '';
    this.stopTest();
  }

  createVisualization(controllerData) {
    const container = document.querySelector('.controller-visualization');
    container.innerHTML = '';
    
    // Crear visualización basada en tipo de control
    if (controllerData.type && controllerData.type.includes('Xbox')) {
      this.createXboxVisualization(container);
    } else if (controllerData.type && controllerData.type.includes('PlayStation')) {
      this.createPlayStationVisualization(container);
    } else {
      this.createGenericVisualization(container);
    }
    
    return container;
  }

  createXboxVisualization(container) {
    container.innerHTML = `
      <div class="xbox-controller">
        <!-- Left Stick -->
        <div class="stick left-stick" id="stick-left">
          <div class="stick-inner" id="stick-left-inner"></div>
          <div class="stick-label">L</div>
        </div>
        
        <!-- Right Stick -->
        <div class="stick right-stick" id="stick-right">
          <div class="stick-inner" id="stick-right-inner"></div>
          <div class="stick-label">R</div>
        </div>
        
        <!-- D-Pad -->
        <div class="dpad" id="dpad">
          <div class="dpad-up" data-direction="up">↑</div>
          <div class="dpad-down" data-direction="down">↓</div>
          <div class="dpad-left" data-direction="left">←</div>
          <div class="dpad-right" data-direction="right">→</div>
          <div class="dpad-center"></div>
        </div>
        
        <!-- Face Buttons -->
        <div class="face-buttons">
          <div class="face-btn btn-a" data-button="0">A</div>
          <div class="face-btn btn-b" data-button="1">B</div>
          <div class="face-btn btn-x" data-button="2">X</div>
          <div class="face-btn btn-y" data-button="3">Y</div>
        </div>
        
        <!-- Shoulder Buttons -->
        <div class="shoulder-buttons">
          <div class="shoulder-btn btn-lb" data-button="4">LB</div>
          <div class="shoulder-btn btn-rb" data-button="5">RB</div>
        </div>
        
        <!-- Triggers -->
        <div class="triggers">
          <div class="trigger left-trigger" id="trigger-left">
            <div class="trigger-fill" id="trigger-left-fill"></div>
            <div class="trigger-label">LT</div>
          </div>
          <div class="trigger right-trigger" id="trigger-right">
            <div class="trigger-fill" id="trigger-right-fill"></div>
            <div class="trigger-label">RT</div>
          </div>
        </div>
        
        <!-- Start/Select -->
        <div class="menu-buttons">
          <div class="menu-btn btn-start" data-button="9">Start</div>
          <div class="menu-btn btn-select" data-button="8">Select</div>
        </div>
        
        <!-- Guide Button -->
        <div class="guide-btn" data-button="16">⌘</div>
      </div>
    `;
  }

  handleTestSample(data) {
    if (!this.currentTest || this.currentTest.controllerId !== data.controllerId) {
      return;
    }
    
    // Actualizar visualización
    this.updateVisualization(data.sample);
    
    // Actualizar métricas en tiempo real
    this.updateRealtimeMetrics(data.sample);
    
    // Actualizar estadísticas
    this.updateStats(data.sample);
    
    // Actualizar gráficos
    this.updateCharts(data.sample);
    
    // Agregar a muestras
    this.currentTest.samples.push(data.sample);
  }

  updateVisualization(sample) {
    // Actualizar sticks
    if (sample.axes && sample.axes.length >= 4) {
      this.updateStick('stick-left', sample.axes[0], sample.axes[1]);
      this.updateStick('stick-right', sample.axes[2], sample.axes[3]);
    }
    
    // Actualizar triggers
    sample.triggers.forEach(trigger => {
      if (trigger.name === 'Left Trigger') {
        this.updateTrigger('trigger-left', trigger.normalized);
      } else if (trigger.name === 'Right Trigger') {
        this.updateTrigger('trigger-right', trigger.normalized);
      }
    });
    
    // Actualizar botones
    sample.buttons.forEach(button => {
      this.updateButton(button.index, button.pressed, button.value);
    });
  }

  updateStick(stickId, xValue, yValue) {
    const stick = document.getElementById(stickId);
    const inner = document.getElementById(`${stickId}-inner`);
    
    if (!stick || !inner) return;
    
    const maxOffset = 30; // Máximo desplazamiento en píxeles
    const xOffset = xValue * maxOffset;
    const yOffset = yValue * maxOffset;
    
    inner.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    
    // Color basado en intensidad
    const intensity = Math.sqrt(xValue * xValue + yValue * yValue);
    const hue = 120 * (1 - intensity); // Verde a rojo
    inner.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
  }

  updateTrigger(triggerId, value) {
    const trigger = document.getElementById(triggerId);
    const fill = document.getElementById(`${triggerId}-fill`);
    
    if (!trigger || !fill) return;
    
    const height = value * 100;
    fill.style.height = `${height}%`;
    
    // Color basado en presión
    const hue = 120 * (1 - value); // Verde a rojo
    fill.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
  }

  updateButton(buttonIndex, pressed, value) {
    const button = document.querySelector(`[data-button="${buttonIndex}"]`);
    if (!button) return;
    
    if (pressed) {
      button.classList.add('pressed');
      
      // Intensidad basada en presión
      const intensity = Math.floor(value * 100);
      button.style.boxShadow = `0 0 ${intensity}px rgba(0, 200, 255, ${value})`;
    } else {
      button.classList.remove('pressed');
      button.style.boxShadow = '';
    }
  }

  updateRealtimeMetrics(sample) {
    const grid = document.getElementById('realtime-grid');
    
    // Crear o actualizar métricas
    let html = '';
    
    // Botones presionados
    const pressedButtons = sample.buttons
      .filter(b => b.pressed)
      .map(b => `B${b.index}: ${b.value.toFixed(2)}`);
    
    if (pressedButtons.length > 0) {
      html += `<div class="metric-group"><strong>Buttons:</strong> ${pressedButtons.join(', ')}</div>`;
    }
    
    // Valores de ejes
    sample.axes.forEach((axis, i) => {
      if (Math.abs(axis.value) > 0.1) {
        html += `<div class="metric-item">Axis ${i}: ${axis.value.toFixed(3)}</div>`;
      }
    });
    
    // Triggers
    sample.triggers.forEach(trigger => {
      if (trigger.normalized > 0.1) {
        html += `<div class="metric-item">${trigger.name}: ${trigger.normalized.toFixed(3)}</div>`;
      }
    });
    
    grid.innerHTML = html || '<div class="metric-placeholder">No active inputs</div>';
  }

  updateStats(sample) {
    // Actualizar estadísticas en tiempo real
    const total = document.getElementById('stat-total');
    if (total) {
      total.textContent = this.currentTest.samples.length;
    }
    
    // Aquí se actualizarían más estadísticas basadas en el análisis
  }

  updateCharts(sample) {
    // Implementar gráficos con Chart.js o similar
    // Mostrar historial de inputs
  }

  startUpdateLoop() {
    this.updateLoop = setInterval(() => {
      if (!this.currentTest) return;
      
      // Actualizar timer
      const elapsed = Date.now() - this.currentTest.startTime;
      const seconds = Math.floor(elapsed / 1000);
      document.querySelector('.test-timer strong').textContent = `${seconds}s`;
      
      // Actualizar progreso
      const progress = Math.min(100, (elapsed / 10000) * 100);
      document.getElementById('test-progress').style.width = `${progress}%`;
      document.getElementById('progress-text').textContent = `${Math.round(progress)}% Complete`;
    }, 100);
  }

  handleTestResults(testData) {
    // Mostrar resultados completos
    this.showResultsModal(testData);
    
    // Guardar en historial
    this.testHistory.push(testData);
    
    // Limpiar test actual
    this.currentTest = null;
    clearInterval(this.updateLoop);
  }

  showResultsModal(testData) {
    // Crear modal de resultados
    const modal = document.createElement('div');
    modal.className = 'results-modal';
    modal.innerHTML = `
      <div class="results-content">
        <div class="results-header">
          <h2>🎯 Controller Health Report</h2>
          <div class="overall-grade grade-${testData.reports.overall.grade}">
            ${testData.reports.overall.grade}
            <div class="grade-score">${testData.reports.overall.score}%</div>
          </div>
        </div>
        
        <div class="results-grid">
          <div class="result-card latency">
            <h3>⏱️ Latency</h3>
            <div class="result-grade">${testData.reports.latency.grade}</div>
            <div class="result-details">
              <p>Max: ${testData.reports.latency.max}ms</p>
              <p>Avg: ${testData.reports.latency.avg.toFixed(2)}ms</p>
            </div>
          </div>
          
          <div class="result-card deadzone">
            <h3>🎯 Deadzone</h3>
            <div class="result-grade">${testData.reports.deadzone.grade}</div>
            <div class="result-details">
              <p>Issues: ${testData.reports.deadzone.issues}</p>
            </div>
          </div>
          
          <div class="result-card pressure">
            <h3>💪 Pressure</h3>
            <div class="result-grade">${testData.reports.pressure.grade}</div>
            <div class="result-details">
              <p>Issues: ${testData.reports.pressure.issues}</p>
            </div>
          </div>
          
          <div class="result-card ghost">
            <h3>👻 Ghost Inputs</h3>
            <div class="result-grade">${testData.reports.ghost.grade}</div>
            <div class="result-details">
              <p>Count: ${testData.reports.ghost.count}</p>
              <p>Rate: ${testData.reports.ghost.percentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div class="results-actions">
          <button class="btn" onclick="this.closest('.results-modal').remove()">Close</button>
          <button class="btn btn-primary" onclick="window.electronAPI.exportTestResults('${testData.id}', 'html')">
            Export Report
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  runSpecificTest(testType) {
    // Ejecutar prueba específica
    switch (testType) {
      case 'latency':
        this.runLatencyTest();
        break;
      case 'deadzone':
        this.runDeadzoneTest();
        break;
      case 'pressure':
        this.runPressureTest();
        break;
      case 'ghost':
        this.runGhostTest();
        break;
      case 'vibration':
        this.runVibrationTest();
        break;
    }
  }

  runLatencyTest() {
    // Implementar prueba de latencia específica
    alert('Latency test started - Mash buttons quickly!');
  }

  runDeadzoneTest() {
    // Implementar prueba de deadzone
    alert('Deadzone test - Move sticks slowly in circles');
  }

  runPressureTest() {
    // Implementar prueba de presión
    alert('Pressure test - Press buttons with varying pressure');
  }

  runGhostTest() {
    // Implementar prueba de fantasmas
    alert('Ghost test - Checking for duplicate inputs');
  }

  runVibrationTest() {
    // Implementar prueba de vibración
    alert('Vibration test - Testing rumble motors');
  }

  togglePauseTest() {
    // Implementar pausa/reanudar
  }

  cancelTest() {
    if (this.currentTest) {
      window.electronAPI.stopTestLab(this.currentTest.controllerId);
      this.hideTestLabModal();
    }
  }

  stopTest() {
    if (this.currentTest) {
      window.electronAPI.stopTestLab(this.currentTest.controllerId);
      clearInterval(this.updateLoop);
      this.currentTest = null;
    }
  }

  exportResults() {
    if (this.currentTest) {
      window.electronAPI.exportTestResults(this.currentTest.controllerId, 'html');
    }
  }
}

// Inicializar en el slot manager
document.addEventListener('DOMContentLoaded', () => {
  window.controllerTestLab = new ControllerTestLabUI();
  
  // Agregar botón de test a cada slot
  document.querySelectorAll('.xinput-slot-card').forEach(slot => {
    const testBtn = document.createElement('button');
    testBtn.className = 'slot-test-btn';
    testBtn.innerHTML = '🔬 Test';
    testBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const controllerId = slot.dataset.controllerId;
      const controllerData = {
        type: slot.querySelector('.controller-type').textContent,
        id: controllerId
      };
      window.controllerTestLab.startTestFromSlot(controllerId, controllerData);
    });
    slot.appendChild(testBtn);
  });
});

// renderer.js - Sección Ghost Detection
class GhostDetectionUI {
  constructor() {
    this.ghostHistory = [];
    this.activeGhosts = new Map();
    this.initGhostDetection();
  }

  initGhostDetection() {
    // Escuchar eventos del main process
    window.electronAPI.onGhostDetected((data) => {
      this.handleGhostDetection(data);
    });

    window.electronAPI.onControllerDisabled((data) => {
      this.handleControllerDisabled(data);
    });

    window.electronAPI.onControllerEnabled((data) => {
      this.handleControllerEnabled(data);
    });

    // Configurar interfaz
    this.setupGhostDetectionUI();
  }

  handleGhostDetection(detection) {
    console.log('👻 Ghost detected in UI:', detection);
    
    // Agregar a historial
    this.ghostHistory.unshift(detection);
    if (this.ghostHistory.length > 100) {
      this.ghostHistory.pop();
    }
    
    // Marcar como fantasma activo
    this.activeGhosts.set(detection.ghostId, {
      ...detection,
      status: 'disabled'
    });
    
    // Actualizar UI
    this.updateGhostUI();
    
    // Mostrar notificación
    this.showGhostNotification(detection);
  }

  handleControllerDisabled(data) {
    const ghost = this.activeGhosts.get(data.controllerId);
    if (ghost) {
      ghost.status = 'disabled';
      this.updateGhostUI();
    }
  }

  handleControllerEnabled(data) {
    const ghost = this.activeGhosts.get(data.controllerId);
    if (ghost) {
      ghost.status = 'enabled';
      this.updateGhostUI();
    }
  }

  setupGhostDetectionUI() {
    // Crear elementos UI si no existen
    if (!document.getElementById('ghost-detection-panel')) {
      this.createGhostDetectionPanel();
    }
  }

  createGhostDetectionPanel() {
    const panel = document.createElement('div');
    panel.id = 'ghost-detection-panel';
    panel.className = 'ghost-panel hidden';
    
    panel.innerHTML = `
      <div class="ghost-header">
        <h3>👻 Ghost Detection</h3>
        <div class="ghost-stats">
          <span class="stat active">Active: <strong id="active-ghosts">0</strong></span>
          <span class="stat total">Total: <strong id="total-detections">0</strong></span>
        </div>
      </div>
      
      <div class="ghost-controls">
        <div class="toggle-group">
          <label>
            <input type="checkbox" id="ghost-auto-disable" checked>
            Auto-disable ghosts
          </label>
          <div class="sensitivity-slider">
            <label>Sensitivity:</label>
            <input type="range" id="ghost-sensitivity" min="1" max="100" value="95">
            <span id="sensitivity-value">95%</span>
          </div>
        </div>
        <button id="clear-ghost-history" class="btn btn-warning">Clear History</button>
      </div>
      
      <div class="ghost-history-container">
        <h4>Detection History</h4>
        <div class="ghost-history-list" id="ghost-history-list">
          <div class="empty-history">No ghost detections yet</div>
        </div>
      </div>
      
      <div class="ghost-notification" id="ghost-notification">
        <div class="notification-content">
          <span class="notification-icon">👻</span>
          <div class="notification-text">
            <strong>Ghost Detected!</strong>
            <span>Controller <span class="ghost-id">#0</span> mirroring Player <span class="original-id">1</span></span>
          </div>
          <button class="notification-action">Override</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.setupGhostEventListeners();
  }

  setupGhostEventListeners() {
    // Auto-disable toggle
    document.getElementById('ghost-auto-disable').addEventListener('change', (e) => {
      window.electronAPI.setGhostAutoDisable(e.target.checked);
    });
    
    // Sensitivity slider
    const sensitivitySlider = document.getElementById('ghost-sensitivity');
    const sensitivityValue = document.getElementById('sensitivity-value');
    
    sensitivitySlider.addEventListener('input', (e) => {
      const value = e.target.value;
      sensitivityValue.textContent = `${value}%`;
      window.electronAPI.setGhostSensitivity(value / 100);
    });
    
    // Clear history button
    document.getElementById('clear-ghost-history').addEventListener('click', async () => {
      const confirmed = confirm('Clear all ghost detection history?');
      if (confirmed) {
        await window.electronAPI.clearGhostHistory();
        this.ghostHistory = [];
        this.activeGhosts.clear();
        this.updateGhostUI();
      }
    });
  }

  updateGhostUI() {
    const activeCount = Array.from(this.activeGhosts.values())
      .filter(g => g.status === 'disabled').length;
    
    // Actualizar stats
    document.getElementById('active-ghosts').textContent = activeCount;
    document.getElementById('total-detections').textContent = this.ghostHistory.length;
    
    // Actualizar lista de historial
    this.updateHistoryList();
    
    // Actualizar slots afectados
    this.updateAffectedSlots();
  }

  updateHistoryList() {
    const list = document.getElementById('ghost-history-list');
    
    if (this.ghostHistory.length === 0) {
      list.innerHTML = '<div class="empty-history">No ghost detections yet</div>';
      return;
    }
    
    const items = this.ghostHistory.map(detection => `
      <div class="history-item ${detection.autoDisabled ? 'auto-disabled' : 'manual-override'}">
        <div class="history-time">${new Date(detection.detectedAt).toLocaleTimeString()}</div>
        <div class="history-details">
          <span class="ghost-indicator">👻</span>
          Controller <strong>${detection.ghostId}</strong> mirroring 
          Player <strong>${detection.originalId}</strong>
        </div>
        <div class="history-action">
          ${detection.autoDisabled ? 
            '<span class="badge auto">Auto-disabled</span>' : 
            '<span class="badge manual">Manual override</span>'}
        </div>
      </div>
    `).join('');
    
    list.innerHTML = items;
  }

  updateAffectedSlots() {
    // Marcar slots afectados en el grid de mandos
    document.querySelectorAll('.xinput-slot-card').forEach(slot => {
      const slotId = slot.dataset.controllerId;
      if (!slotId) return;
      
      const isGhost = this.activeGhosts.has(slotId);
      const ghostData = isGhost ? this.activeGhosts.get(slotId) : null;
      
      slot.classList.toggle('ghost-affected', isGhost);
      slot.classList.toggle('ghost-disabled', ghostData?.status === 'disabled');
      
      if (isGhost) {
        this.addGhostBadge(slot, ghostData);
      } else {
        this.removeGhostBadge(slot);
      }
    });
  }

  addGhostBadge(slot, ghostData) {
    // Remover badge anterior si existe
    this.removeGhostBadge(slot);
    
    const badge = document.createElement('div');
    badge.className = `ghost-badge ${ghostData.status}`;
    badge.innerHTML = `
      <span class="badge-icon">👻</span>
      <span class="badge-text">${ghostData.status === 'disabled' ? 'Ghost' : 'Override'}</span>
    `;
    
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showGhostContextMenu(slot, ghostData);
    });
    
    slot.appendChild(badge);
  }

  removeGhostBadge(slot) {
    const existingBadge = slot.querySelector('.ghost-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
  }

  showGhostNotification(detection) {
    const notification = document.getElementById('ghost-notification');
    const ghostId = notification.querySelector('.ghost-id');
    const originalId = notification.querySelector('.original-id');
    const actionBtn = notification.querySelector('.notification-action');
    
    ghostId.textContent = detection.ghostId;
    originalId.textContent = detection.originalId;
    
    // Configurar acción de override
    actionBtn.onclick = () => {
      window.electronAPI.enableGhostController(detection.ghostId);
      notification.classList.remove('show');
    };
    
    // Mostrar notificación
    notification.classList.add('show');
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  }

  showGhostContextMenu(slot, ghostData) {
    // Crear menú contextual para el fantasma
    const menu = document.createElement('div');
    menu.className = 'ghost-context-menu';
    menu.innerHTML = `
      <div class="menu-header">
        <span class="menu-icon">👻</span>
        Ghost Controller ${ghostData.ghostId}
      </div>
      <div class="menu-item" data-action="enable">
        ✅ Enable Controller
      </div>
      <div class="menu-item" data-action="details">
        🔍 View Details
      </div>
      <div class="menu-item" data-action="ignore">
        👁️ Ignore Future Detection
      </div>
    `;
    
    // Posicionar cerca del slot
    const rect = slot.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;
    
    // Manejar clics
    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      
      switch (action) {
        case 'enable':
          window.electronAPI.enableGhostController(ghostData.ghostId);
          break;
        case 'details':
          this.showGhostDetails(ghostData);
          break;
        case 'ignore':
          window.electronAPI.ignoreGhostController(ghostData.ghostId);
          break;
      }
      
      menu.remove();
    });
    
    // Cerrar al hacer clic fuera
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== slot) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
    
    document.body.appendChild(menu);
  }

  showGhostDetails(ghostData) {
    // Implementar modal de detalles
    console.log('Showing ghost details:', ghostData);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.ghostDetectorUI = new GhostDetectionUI();
});

// ============================================
// XINPUT SLOT MANAGER - FRONTEND CORREGIDO
// ============================================

class XInputSlotManager {
  constructor() {
    this.slots = null;
    this.ghosts = [];
    this.selectedSlot = 1;
    this.isOpen = false;
    this.refreshInterval = null;
    this.gamepadInterval = null;
    
    // Navegación
    this.lastDpadState = { left: false, right: false, up: false, down: false };
    this.lastButtonState = { a: false, b: false, x: false, y: false };
    this.navigationCooldown = false;
  }

  // ============================================
  // ABRIR/CERRAR PANEL
  // ============================================

  async open() {
    this.isOpen = true;
    
    // OCULTAR CURSOR
    this.hideCursor();
    
    // Crear modal
    this.createModal();
    
    // Cargar datos
    await this.refresh();
    
    // Auto-refresh cada 2 segundos
    this.refreshInterval = setInterval(() => this.refresh(), 2000);
    
    // Setup gamepad navigation
    this.setupGamepadNavigation();
    
    // Vibración de apertura
    this.vibrate(100, 0.4);
  }

  close() {
    this.isOpen = false;
    
    // Limpiar intervals
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    if (this.gamepadInterval) {
      clearInterval(this.gamepadInterval);
      this.gamepadInterval = null;
    }
    
    // Remover modal
    const modal = document.getElementById('xinputSlotManagerModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
    
    // RESTAURAR CURSOR (sigue oculto en PSBOX)
    this.restoreCursor();
    
    // Vibración de cierre
    this.vibrate(50, 0.3);
  }

  // ============================================
  // CURSOR MANAGEMENT
  // ============================================

  hideCursor() {
    document.body.style.cursor = 'none';
    document.body.classList.add('modal-open');
    document.body.classList.add('cursor-hidden');
    
    // Asegurar que todo tenga cursor none
    const modal = document.getElementById('xinputSlotManagerModal');
    if (modal) {
      modal.style.cursor = 'none';
      modal.querySelectorAll('*').forEach(el => {
        el.style.cursor = 'none';
      });
    }
  }

  restoreCursor() {
    document.body.classList.remove('modal-open');
    // PSBOX mantiene cursor oculto por defecto
    // No hacemos nada más aquí
  }

  // ============================================
  // CREAR UI
  // ============================================

  createModal() {
    const modal = document.createElement('div');
    modal.id = 'xinputSlotManagerModal';
    modal.className = 'modal-overlay active';
    modal.style.cursor = 'none';
    
    modal.innerHTML = `
      <div class="ps4-modal xinput-manager-modal">
        <div class="modal-header">
          <div class="modal-title">🎮 Gestión de Mandos</div>
          <div class="modal-subtitle">Detectando controles conectados...</div>
        </div>
        
        <div class="modal-content">
          <div class="xinput-slots-grid" id="xinputSlotsGrid">
            <!-- Slots se renderizan aquí -->
          </div>
          
          <div class="xinput-ghost-warning" id="xinputGhostWarning" style="display:none;">
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">
              <strong>Controles fantasma detectados</strong>
              <p>Se detectaron controles duplicados que pueden causar problemas.</p>
            </div>
            <button class="browse-button warning-btn" id="btnFixGhosts" style="cursor:none;">
              <span>🔧</span><span>Solucionar Automáticamente</span>
            </button>
          </div>
        </div>
        
        <div class="modal-actions">
          <div class="button-hints">
            <span class="hint"><span class="btn-icon">D-Pad</span> Navegar</span>
            <span class="hint"><span class="btn-icon">Ⓐ</span> Acción</span>
            <span class="hint"><span class="btn-icon">Ⓑ</span> Cerrar</span>
            <span class="hint"><span class="btn-icon">Ⓨ</span> Test</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Asegurar cursor none en todo
    modal.querySelectorAll('*').forEach(el => {
      el.style.cursor = 'none';
    });
    
    // Event listener solo para Fix Ghosts
    const fixBtn = document.getElementById('btnFixGhosts');
    if (fixBtn) {
      fixBtn.style.cursor = 'none';
      fixBtn.addEventListener('click', () => this.autoFixGhosts());
    }
  }

  // ============================================
  // REFRESH Y DETECCIÓN
  // ============================================

  async refresh() {
    try {
      // Obtener gamepads del navegador
      const gamepads = this.getGamepadsArray();
      
      // Enviar al main process para procesar
      const data = await window.psboxAPI.xinputUpdateFromRenderer(gamepads);
      
      this.slots = data.slots;
      this.ghosts = data.ghosts;
      
      this.renderSlots();
      this.updateGhostWarning();
      this.updateSubtitle();
      
    } catch (error) {
      console.error('Error refreshing slots:', error);
    }
  }

  getGamepadsArray() {
    const gamepads = navigator.getGamepads();
    const result = [];
    
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        // Serializar gamepad para IPC
        result.push({
          index: i,
          id: gp.id,
          connected: gp.connected,
          timestamp: gp.timestamp,
          axes: gp.axes ? Array.from(gp.axes) : [],
          buttons: gp.buttons ? gp.buttons.map(b => ({
            pressed: b.pressed,
            touched: b.touched,
            value: b.value
          })) : []
        });
      }
    }
    
    return result;
  }

  updateSubtitle() {
    const subtitle = document.querySelector('.modal-subtitle');
    if (!subtitle) return;
    
    const totalControllers = Object.values(this.slots).filter(s => s !== null).length;
    
    if (totalControllers === 0) {
      subtitle.textContent = 'No se detectaron controles';
      subtitle.style.color = 'rgba(255, 107, 107, 0.8)';
    } else {
      subtitle.textContent = `${totalControllers} control${totalControllers !== 1 ? 'es' : ''} detectado${totalControllers !== 1 ? 's' : ''}`;
      subtitle.style.color = 'rgba(0, 212, 170, 0.8)';
    }
  }

  // ============================================
  // RENDERIZAR SLOTS
  // ============================================

  renderSlots() {
    const grid = document.getElementById('xinputSlotsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (let i = 1; i <= 4; i++) {
      const slotKey = `slot${i}`;
      const controller = this.slots[slotKey];
      const isSelected = this.selectedSlot === i;
      
      const slotCard = this.createSlotCard(i, controller, isSelected);
      grid.appendChild(slotCard);
    }
  }

  createSlotCard(slotNumber, controller, isSelected) {
    const card = document.createElement('div');
    card.className = `xinput-slot-card ${isSelected ? 'selected' : ''} ${controller ? 'occupied' : 'empty'}`;
    card.dataset.slot = slotNumber;
    card.style.cursor = 'none';
    
    if (controller) {
      // Slot ocupado
      const icon = this.getControllerIcon(controller.type);
      const connectionIcon = controller.isWired ? '🔌' : '📶';
      
      card.innerHTML = `
        <div class="slot-header">
          <div class="slot-number">SLOT ${slotNumber}</div>
          <div class="slot-status active">●</div>
        </div>
        
        <div class="slot-body">
          <div class="controller-icon">${icon}</div>
          <div class="controller-type">${controller.type}</div>
          
          <div class="controller-details">
            <div class="detail-row">
              <span class="detail-icon">${connectionIcon}</span>
              <span class="detail-text">${controller.isWired ? 'Cable' : 'Inalámbrico'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-icon">🎮</span>
              <span class="detail-text">Index: ${controller.index}</span>
            </div>
          </div>
          
          <div class="controller-status">
            <span class="status-badge success">✓ Activo</span>
          </div>
        </div>
        
        ${isSelected ? `
          <div class="slot-footer">
            <div class="action-hint">Ⓐ Test | Ⓧ Reasignar | Ⓨ Limpiar</div>
          </div>
        ` : ''}
      `;
    } else {
      // Slot vacío
      card.innerHTML = `
        <div class="slot-header">
          <div class="slot-number">SLOT ${slotNumber}</div>
          <div class="slot-status inactive">○</div>
        </div>
        
        <div class="slot-body empty-slot">
          <div class="empty-icon">❌</div>
          <div class="empty-text">Vacío</div>
          <div class="empty-hint">No hay control asignado</div>
        </div>
      `;
    }
    
    return card;
  }

  // ============================================
  // NAVEGACIÓN CON GAMEPAD - CORREGIDA
  // ============================================

  setupGamepadNavigation() {
    if (this.gamepadInterval) {
      clearInterval(this.gamepadInterval);
    }
    
    this.gamepadInterval = setInterval(() => {
      if (!this.isOpen) return;
      
      const gamepad = navigator.getGamepads()[0];
      if (!gamepad) return;
      
      this.processGamepadInput(gamepad);
    }, 50); // Poll cada 50ms
  }

  processGamepadInput(gamepad) {
    // D-Pad o Stick Izquierdo
    const left = gamepad.axes[0] < -0.5 || gamepad.buttons[14]?.pressed;
    const right = gamepad.axes[0] > 0.5 || gamepad.buttons[15]?.pressed;
    const up = gamepad.axes[1] < -0.5 || gamepad.buttons[12]?.pressed;
    const down = gamepad.axes[1] > 0.5 || gamepad.buttons[13]?.pressed;
    
    // Botones
    const aPressed = gamepad.buttons[0]?.pressed; // A/X
    const bPressed = gamepad.buttons[1]?.pressed; // B/Circle
    const xPressed = gamepad.buttons[2]?.pressed; // X/Square
    const yPressed = gamepad.buttons[3]?.pressed; // Y/Triangle
    
    // Navegación horizontal (entre slots)
    if (left && !this.lastDpadState.left && !this.navigationCooldown) {
      this.navigateLeft();
    }
    
    if (right && !this.lastDpadState.right && !this.navigationCooldown) {
      this.navigateRight();
    }
    
    // Navegación vertical (entre filas)
    if (up && !this.lastDpadState.up && !this.navigationCooldown) {
      this.navigateUp();
    }
    
    if (down && !this.lastDpadState.down && !this.navigationCooldown) {
      this.navigateDown();
    }
    
    // Acciones
    if (aPressed && !this.lastButtonState.a) {
      this.executeAction('test');
    }
    
    if (bPressed && !this.lastButtonState.b) {
      this.close();
    }
    
    if (xPressed && !this.lastButtonState.x) {
      this.executeAction('reassign');
    }
    
    if (yPressed && !this.lastButtonState.y) {
      this.executeAction('clear');
    }
    
    // Guardar estados
    this.lastDpadState = { left, right, up, down };
    this.lastButtonState = { a: aPressed, b: bPressed, x: xPressed, y: yPressed };
  }

  navigateLeft() {
    const newSlot = this.selectedSlot - 1;
    if (newSlot >= 1) {
      this.selectedSlot = newSlot;
      this.renderSlots();
      this.vibrate(30, 0.2);
      this.setCooldown();
    }
  }

  navigateRight() {
    const newSlot = this.selectedSlot + 1;
    if (newSlot <= 4) {
      this.selectedSlot = newSlot;
      this.renderSlots();
      this.vibrate(30, 0.2);
      this.setCooldown();
    }
  }

  navigateUp() {
    // Slot 3 o 4 → Slot 1 o 2
    if (this.selectedSlot === 3) {
      this.selectedSlot = 1;
      this.renderSlots();
      this.vibrate(30, 0.2);
      this.setCooldown();
    } else if (this.selectedSlot === 4) {
      this.selectedSlot = 2;
      this.renderSlots();
      this.vibrate(30, 0.2);
      this.setCooldown();
    }
  }

  navigateDown() {
    // Slot 1 o 2 → Slot 3 o 4
    if (this.selectedSlot === 1) {
      this.selectedSlot = 3;
      this.renderSlots();
      this.vibrate(30, 0.2);
      this.setCooldown();
    } else if (this.selectedSlot === 2) {
      this.selectedSlot = 4;
      this.renderSlots();
      this.vibrate(30, 0.2);
      this.setCooldown();
    }
  }

  setCooldown() {
    this.navigationCooldown = true;
    setTimeout(() => {
      this.navigationCooldown = false;
    }, 150); // 150ms cooldown entre navegaciones
  }

  // ============================================
  // ACCIONES
  // ============================================

  async executeAction(action) {
    const slotKey = `slot${this.selectedSlot}`;
    const controller = this.slots[slotKey];
    
    this.vibrate(50, 0.4);
    
    switch (action) {
      case 'test':
        if (controller) {
          await this.testController(controller);
        }
        break;
        
      case 'reassign':
        if (controller) {
          await this.reassignController(controller);
        }
        break;
        
      case 'clear':
        await this.clearSlot(this.selectedSlot);
        break;
    }
  }

  async testController(controller) {
    // Vibración de test en el control
    this.vibratePattern([100, 100, 100, 100, 200], [0.3, 0.5, 0.7, 0.9, 1.0]);
    
    // Mostrar confirmación
    this.showNotification('Test de Control', `Control en Slot ${this.selectedSlot}: ${controller.type}`, 'info');
  }

  async reassignController(controller) {
    // Ciclar al siguiente slot disponible
    let newSlot = this.selectedSlot + 1;
    if (newSlot > 4) newSlot = 1;
    
    const result = await window.psboxAPI.xinputReassignSlot(controller.uniqueId, newSlot);
    
    if (result.success) {
      this.vibrate(80, 0.6);
      await this.refresh();
      this.showNotification('Reasignado', `Control movido a Slot ${newSlot}`, 'success');
    }
  }

  async clearSlot(slotNumber) {
    const result = await window.psboxAPI.xinputClearSlot(slotNumber);
    
    if (result.success) {
      this.vibrate(50, 0.4);
      await this.refresh();
      this.showNotification('Limpiado', `Slot ${slotNumber} liberado`, 'info');
    }
  }

  async autoFixGhosts() {
    if (this.ghosts.length === 0) return;
    
    for (const ghost of this.ghosts) {
      await window.psboxAPI.xinputDisableController(ghost.ghost.uniqueId);
    }
    
    this.vibrate(100, 0.8);
    await this.refresh();
    this.showNotification('Corregido', 'Controles fantasma eliminados', 'success');
  }

  // ============================================
  // HELPERS
  // ============================================

  getControllerIcon(type) {
    const icons = {
      'Xbox 360/One': '🎮',
      'Xbox Elite': '🎮',
      'Xbox Series X/S': '🎮',
      'PS5 DualSense': '🎮',
      'PS4 DualShock 4': '🎮',
      'PS3 DualShock 3': '🎮',
      'Switch Pro Controller': '🎮',
      'Switch Joy-Con': '🕹️',
      'Logitech Gamepad': '🎮',
      '8BitDo Controller': '🎮',
      'Control Genérico': '🕹️'
    };
    return icons[type] || '🎮';
  }

  updateGhostWarning() {
    const warning = document.getElementById('xinputGhostWarning');
    if (!warning) return;
    
    warning.style.display = this.ghosts.length > 0 ? 'flex' : 'none';
  }

  showNotification(title, message, type) {
    if (window.psboxSystem) {
      window.psboxSystem.showNotification(title, message, type);
    }
  }

  vibrate(duration, intensity) {
    const gamepad = navigator.getGamepads()[0];
    if (gamepad && gamepad.vibrationActuator) {
      gamepad.vibrationActuator.playEffect('dual-rumble', {
        duration: duration,
        strongMagnitude: intensity,
        weakMagnitude: intensity * 0.7
      });
    }
  }

  vibratePattern(durations, intensities) {
    const gamepad = navigator.getGamepads()[0];
    if (!gamepad || !gamepad.vibrationActuator) return;
    
    let totalTime = 0;
    durations.forEach((duration, i) => {
      setTimeout(() => {
        gamepad.vibrationActuator.playEffect('dual-rumble', {
          duration: duration,
          strongMagnitude: intensities[i] || 0.5,
          weakMagnitude: (intensities[i] || 0.5) * 0.7
        });
      }, totalTime);
      totalTime += duration + 50;
    });
  }
}

// Instancia global
window.xinputManager = new XInputSlotManager();

// Función para abrir desde Quick Menu
function openXInputManager() {
  if (window.xinputManager) {
    window.xinputManager.open();
  }
}

class PSBOXSystem{
 constructor(){
  this.games=[]
  this.carouselItems=[]
  this.currentCenterIndex=0
  this.totalCarouselItems=0
  this.controlMode='gamepad'
  this.isInQuickMenu=false
  this.isQuickMenuOpen=false
  this.isInModal=false
  this.isLoading=false
  this.gamepads=[]
  this.activeGamepad=null
  this.isPolling=false
  this.quickMenuItems=[]
  this.quickMenuSelectedIndex=0
  this.cursorEnabled=false
  this.navigationDelay=200
  this.minNavigationDelay=50
  this.navigationAcceleration=0.85
  this.lastNavigationTime=0
  this.navigationDirection=0
  this.isHoldingDirection=false
  this.holdStartTime=0
  this.currentHoldDelay=this.navigationDelay
  this.init()
 }

 init(){
  this.loadConfig().then(()=>{
   this.initUI()
   this.initGamepad()
   this.setupCarousel()
   this.renderCarousel()
   this.setupQuickMenu()
   this.renderQuickMenu()
   this.setupEvents()
   this.updateTime()
   setInterval(()=>this.updateTime(),1000)
  }).catch(()=>{
   this.initUI()
   this.initGamepad()
   this.setupCarousel()
   this.renderCarousel()
   this.setupQuickMenu()
   this.renderQuickMenu()
   this.setupEvents()
   this.updateTime()
   setInterval(()=>this.updateTime(),1000)
  })
 }

 initUI(){
  this.setupModalEvents()
  this.forceHideCursor()
 }

 setupModalEvents(){
  const addGameBtn=document.getElementById('addGameButton')
  if(addGameBtn){
   const newBtn=addGameBtn.cloneNode(true)
   addGameBtn.parentNode.replaceChild(newBtn,addGameBtn)
   document.getElementById('addGameButton').addEventListener('click',()=>{this.handleAddNewGame()})
  }
 }

 async loadConfig(){
  try{
   if(window.psboxAPI&&psboxAPI.getConfig){
    const config=await psboxAPI.getConfig()
    if(config?.games){
     this.games=config.games
     return this.games
    }
   }
   this.games=[]
   return[]
  }catch{
   this.games=[]
   return[]
  }
 }

 async verifyGamePaths(games){
  const verifiedGames=[]
  for(const game of games){
   try{
    if(game.path&&window.psboxAPI?.checkPathExists){
     const result=await psboxAPI.checkPathExists(game.path)
     if(result.exists){verifiedGames.push(game)}
     else{game.unavailable=true;verifiedGames.push(game)}
    }else if(game.path){verifiedGames.push(game)}
   }catch{game.unavailable=true;verifiedGames.push(game)}
  }
  return verifiedGames
 }

 async saveConfig(){
  const config={games:this.games,settings:{controlMode:this.controlMode,theme:'ps4',language:'es'},windowState:{width:1280,height:720,isFullscreen:true}}
  try{if(window.psboxAPI?.saveConfig){await psboxAPI.saveConfig(config)}}catch{}
 }

 updateTime(){
  const now=new Date()
  const hours=String(now.getHours()).padStart(2,'0')
  const minutes=String(now.getMinutes()).padStart(2,'0')
  const timeElement=document.getElementById('currentTime')
  if(timeElement)timeElement.textContent=`${hours}:${minutes}`
 }

 setupEvents(){this.setupKeyboardEvents()}

 setupKeyboardEvents(){
  document.addEventListener('keydown',(e)=>{
   if(this.isInModal){
    switch(e.key){
     case 'Escape':e.preventDefault();this.closeAddGameModal();break
     case 'Enter':if(e.target.id==='gameName'){e.preventDefault();this.handleAddNewGame()}break
    }
    return
   }
   switch(e.key){
    case 'Tab':e.preventDefault();this.toggleQuickMenu();break
    case 'Escape':e.preventDefault();if(this.isQuickMenuOpen)this.closeQuickMenu();break
   }
  })
 }

 setupCarousel(){
  this.totalCarouselItems=1+this.games.length
  this.currentCenterIndex=0
  this.carouselItems=[]
  const carouselTrack=document.getElementById('carouselTrack')
  if(carouselTrack)carouselTrack.style.pointerEvents='auto'
 }

renderCarousel(){
 const carouselTrack=document.getElementById('carouselTrack')
 if(!carouselTrack)return
 carouselTrack.innerHTML=''
 this.carouselItems=[]
 const allItems=[{type:'app',name:'Agregar Juego',icon:'+',action:()=>this.openAddGameModal()}]
 this.games.forEach(game=>{
  allItems.push({
   type:'game',
   game:game,
   name:game.name,
   cover:game.cover,
   unavailable:game.unavailable||false,
   action:()=>{
    if(game.unavailable){
     this.showNotification('Juego no disponible',`"${game.name}" no se encuentra en la ruta especificada.\n\nRuta: ${game.path}\n\nPuedes editarlo o eliminarlo desde el Menú Rápido.`,'error')
    }else{this.launchGame(game)}
   }
  })
 })
 allItems.forEach((item,index)=>{
  const carouselItem=document.createElement('div')
  carouselItem.className='carousel-item'
  carouselItem.dataset.index=index
  if(item.type==='app'){
   carouselItem.innerHTML=`<div class="carousel-cover"><div class="carousel-icon">${item.icon}</div></div>`
  }else{
   const unavailableBadge=item.unavailable?'<div class="unavailable-badge">⚠️</div>':''
   const coverHTML=item.cover?`<img src="${item.cover}" alt="${item.name}" style="width:100%;height:100%;object-fit:fill;">`:'<div class="carousel-icon">🎮</div>'
   carouselItem.innerHTML=`
    <div class="carousel-cover">
     ${coverHTML}
     ${unavailableBadge}
    </div>`
  }
  carouselItem.addEventListener('click',()=>{
   if(index===this.currentCenterIndex)item.action()
   else{
    const diff=index-this.currentCenterIndex
    this.navigateCarousel(diff)
   }
  })
  carouselTrack.appendChild(carouselItem)
  this.carouselItems.push(carouselItem)
 })
 this.totalCarouselItems=this.carouselItems.length
 this.updateCarouselPositions()
}

 updateCarouselPositions(){
  if(!this.carouselItems?.length)return
  this.carouselItems.forEach((el,index)=>{
   el.classList.remove('left','center','right','hidden','left-side','right-side')
   const diff=index-this.currentCenterIndex
   if(diff===0)el.classList.add('center')
   else if(diff===-1)el.classList.add('left')
   else if(diff===1)el.classList.add('right')
   else if(diff<-1)el.classList.add('hidden','left-side')
   else el.classList.add('hidden','right-side')
  })
 }

 navigateCarousel(direction){
  if(this.isInQuickMenu||this.isInModal||this.isLoading)return
  const nextIndex=this.currentCenterIndex+direction
  if(nextIndex>=0&&nextIndex<this.totalCarouselItems){
   this.currentCenterIndex=nextIndex
   this.updateCarouselPositions()
  }
 }

 performAction(){
  if(this.isInQuickMenu||this.isInModal||this.isLoading)return
  if(this.currentCenterIndex===0)this.openAddGameModal()
  else{
   const gameIndex=this.currentCenterIndex-1
   if(gameIndex>=0&&gameIndex<this.games.length){
    const game=this.games[gameIndex]
    this.launchGame(game)
   }
  }
 }

setupQuickMenu() {
  this.quickMenuItems = [
    { icon: '✕', label: 'Iniciar Juego Seleccionado', action: () => this.launchSelectedGame() },
    { icon: '🎮', label: 'Gestión de Mandos', action: () => openXInputManager() }, // ← NUEVO
    { icon: '✎', label: 'Editar Juego', action: () => this.editSelectedGame() },
    { icon: '🗑️', label: 'Eliminar Juego', action: () => this.removeSelectedGame() },
    { icon: 'ℹ️', label: 'Acerca de PSBOX', action: () => this.showAbout() },
    { icon: '🔴', label: 'Cerrar PSBOX', action: () => this.closePSBOX() }
  ];
}

 renderQuickMenu(){
  const quickMenuItems=document.getElementById('quickMenuItems')
  if(!quickMenuItems)return
  quickMenuItems.innerHTML=''
  this.quickMenuItems.forEach((item,index)=>{
   const itemElement=document.createElement('div')
   itemElement.className='quick-menu-item'
   itemElement.dataset.index=index
   if(index===this.quickMenuSelectedIndex)itemElement.classList.add('selected')
   itemElement.innerHTML=`<div class="menu-item-icon">${item.icon}</div><div class="menu-item-label">${item.label}</div>`
   itemElement.addEventListener('click',()=>{
    this.quickMenuSelectedIndex=index
    this.renderQuickMenu()
    setTimeout(()=>item.action(),100)
   })
   quickMenuItems.appendChild(itemElement)
  })
 }

 toggleQuickMenu(){
  if(this.isQuickMenuOpen)this.closeQuickMenu()
  else this.openQuickMenu()
 }

 openQuickMenu(){
  if(this.isQuickMenuOpen||this.isInModal||this.isLoading)return
  this.isQuickMenuOpen=true
  this.isInQuickMenu=true
  this.quickMenuSelectedIndex=0
  const quickMenu=document.getElementById('quickMenu')
  const overlay=document.getElementById('quickMenuOverlay')
  if(quickMenu){quickMenu.classList.add('active');quickMenu.style.pointerEvents='auto'}
  if(overlay){overlay.classList.add('active');overlay.style.pointerEvents='auto'}
  this.renderQuickMenu()
 }

 closeQuickMenu(){
  if(!this.isQuickMenuOpen)return
  this.isQuickMenuOpen=false
  this.isInQuickMenu=false
  this.quickMenuSelectedIndex=0
  const quickMenu=document.getElementById('quickMenu')
  const overlay=document.getElementById('quickMenuOverlay')
  if(quickMenu)quickMenu.classList.remove('active')
  if(overlay)overlay.classList.remove('active')
 }

 navigateQuickMenuUp(){
  if(!this.isInQuickMenu||!this.quickMenuItems.length)return
  if(this.quickMenuSelectedIndex>0)this.quickMenuSelectedIndex--
  else this.quickMenuSelectedIndex=this.quickMenuItems.length-1
  this.renderQuickMenu()
 }

 navigateQuickMenuDown(){
  if(!this.isInQuickMenu||!this.quickMenuItems.length)return
  if(this.quickMenuSelectedIndex<this.quickMenuItems.length-1)this.quickMenuSelectedIndex++
  else this.quickMenuSelectedIndex=0
  this.renderQuickMenu()
 }

 selectQuickMenuItem(){
  if(!this.isInQuickMenu)return
  const item=this.quickMenuItems[this.quickMenuSelectedIndex]
  if(item?.action){this.closeQuickMenu();setTimeout(()=>item.action(),100)}
 }

 launchSelectedGame(){
  if(this.currentCenterIndex<1||!this.games.length){this.showNotification('Error','Selecciona un juego primero','error');return}
  const gameIndex=this.currentCenterIndex-1
  const game=this.games[gameIndex]
  if(game)this.launchGame(game)
 }

 editSelectedGame(){
  if(this.currentCenterIndex<1||this.games.length===0){this.showNotification('Error','Selecciona un juego primero','error');return}
  const gameIndex=this.currentCenterIndex-1
  const game=this.games[gameIndex]
  if(game)this.openEditGameModal(game)
 }

 async browseForExecutable(pathInputId,nameInputId){
  try{
   if(window.psboxAPI?.showOpenDialog){
    const result=await psboxAPI.showOpenDialog({
     title:'Seleccionar nuevo ejecutable',
     filters:[{name:'Ejecutables',extensions:['exe','lnk','bat','msi']},{name:'Todos los archivos',extensions:['*']}],
     properties:['openFile']
    })
    if(!result.canceled&&result.filePaths.length>0){
     const path=result.filePaths[0]
     document.getElementById(pathInputId).value=path
     const nameInput=document.getElementById(nameInputId)
     if(!nameInput.value.trim()){
      const fileName=path.split('\\').pop().split('/').pop()
      const nameWithoutExt=fileName.replace(/\.[^/.]+$/,"")
      const friendlyName=nameWithoutExt.replace(/[_-]/g,' ').replace(/\b\w/g,l=>l.toUpperCase()).trim()
      nameInput.value=friendlyName
     }
    }
   }
  }catch{this.showNotification('Error','No se pudo seleccionar el archivo','error')}
 }

 async handleSaveEdit(originalGame,gameIndex){
  const name=document.getElementById('editGameName')?.value.trim()
  const path=document.getElementById('editGamePath')?.value.trim()
  const coverFile=document.getElementById('editCoverFile')?.files[0]
  const loadingFile=document.getElementById('editLoadingImageFile')?.files[0]
  if(!name||!path){this.showNotification('Error','Nombre y ruta del juego son requeridos','error');return}
  try{
   let coverData=originalGame.cover
   let loadingImageData=originalGame.loadingImage
   if(coverFile)coverData=await this.readImageAsBase64(coverFile)
   if(loadingFile)loadingImageData=await this.readImageAsBase64(loadingFile)
   this.games[gameIndex]={...originalGame,name:name,path:path,cover:coverData,loadingImage:loadingImageData}
   await this.saveConfig()
   this.renderCarousel()
   this.closeEditModal()
   this.showNotification('✅ Juego actualizado',`"${name}" se actualizó correctamente`,'success')
  }catch(error){this.showNotification('Error','No se pudo actualizar el juego: '+error.message,'error')}
 }

 handleDeleteGame(game,gameIndex){
  this.games.splice(gameIndex,1)
  this.saveConfig()
  this.renderCarousel()
  this.closeEditModal()
  this.showNotification('🗑️ Juego eliminado',`"${game.name}" se eliminó permanentemente`,'success')
 }

 closeEditModal(){
  const modal=document.getElementById('editGameModal')
  if(modal)modal.remove()
  this.isInModal=false
  document.body.classList.remove('modal-open')
  this.forceHideCursor()
 }

 openEditGameModal(game){
  this.isInModal=true
  this.createEditModal(game)
  this.showCursor()
  document.body.classList.add('modal-open')
 }

 createEditModal(game){
  const modalOverlay=document.createElement('div')
  modalOverlay.className='modal-overlay active'
  modalOverlay.id='editGameModal'
  modalOverlay.innerHTML=`
   <div class="ps4-modal">
    <div class="modal-header"><div class="modal-title">✏️ Editar Juego</div></div>
    <div class="modal-content">
     <div class="form-group">
      <label class="form-label"><span class="form-label-icon">📝</span>Nombre del Juego</label>
      <input type="text" class="form-input" id="editGameName" value="${this.escapeHtml(game.name)}" autocomplete="off">
     </div>
     <div class="form-group">
      <label class="form-label"><span class="form-label-icon">📁</span>Ruta del Ejecutable</label>
      <input type="text" class="form-input" id="editGamePath" value="${this.escapeHtml(game.path)}" readonly>
      <button class="browse-button" id="btnEditSelectGame"><span>🔍</span><span>Cambiar Ejecutable</span></button>
     </div>
     <div class="images-section">
      <div class="image-option">
       <label class="form-label"><span class="form-label-icon">🖼️</span>Portada del Juego</label>
       <div class="image-preview" id="editCoverPreview">
        ${game.cover?`<img src="${game.cover}" alt="Portada" style="width:100%;height:100%;object-fit:cover;">`:
        '<div class="preview-placeholder"><i>📷</i><div>Haz clic para cambiar</div></div>'}
       </div>
       <div class="preview-title">Portada (800x450px recomendado)</div>
       <input type="file" id="editCoverFile" accept="image/*" style="display:none;">
      </div>
      <div class="image-option">
       <label class="form-label"><span class="form-label-icon">⏳</span>Imagen de Carga (Opcional)</label>
       <div class="image-preview" id="editLoadingImagePreview">
        ${game.loadingImage?`<img src="${game.loadingImage}" alt="Carga" style="width:100%;height:100%;object-fit:cover;">`:
        '<div class="preview-placeholder"><i>🔄</i><div>Haz clic para cambiar</div></div>'}
       </div>
       <div class="preview-title">Pantalla de carga (1920x1080px recomendado)</div>
       <input type="file" id="editLoadingImageFile" accept="image/*" style="display:none;">
      </div>
     </div>
     <div class="form-group" style="margin-top:20px;">
      <label class="form-label"><span class="form-label-icon">📊</span>Estadísticas</label>
      <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;margin-top:10px;">
       <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;color:rgba(255,255,255,0.8);">
        <div>Agregado: <strong>${new Date(game.added).toLocaleDateString()}</strong></div>
        ${game.lastPlayed?`<div>Última vez: <strong>${new Date(game.lastPlayed).toLocaleDateString()}</strong></div>`:''}
        <div>Veces jugado: <strong>${game.playCount||0}</strong></div>
        <div>ID: <strong style="font-size:11px;">${game.id}</strong></div>
       </div>
      </div>
     </div>
    </div>
    <div class="modal-actions">
     <button class="browse-button" style="background:rgba(255,55,95,0.2);border-color:#ff375f;" id="btnDeleteGame">
      <span>🗑️</span><span>Eliminar</span>
     </button>
     <button class="browse-button" style="background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.3);" id="btnCancelEdit">Cancelar</button>
     <button class="browse-button" id="btnSaveEdit">Guardar Cambios</button>
    </div>
   </div>`
  document.body.appendChild(modalOverlay)
  this.setupEditModalEvents(game)
  setTimeout(()=>document.getElementById('editGameName').focus(),100)
 }

 setupEditModalEvents(game){
  const gameIndex=this.currentCenterIndex-1
  document.getElementById('btnEditSelectGame').addEventListener('click',()=>{this.browseForExecutable('editGamePath','editGameName')})
  const editCoverPreview=document.getElementById('editCoverPreview')
  const editLoadingImagePreview=document.getElementById('editLoadingImagePreview')
  const editCoverFile=document.getElementById('editCoverFile')
  const editLoadingImageFile=document.getElementById('editLoadingImageFile')
  editCoverPreview.addEventListener('click',async()=>{await this.selectImageFile('Seleccionar nueva portada',editCoverFile,editCoverPreview)})
  editLoadingImagePreview.addEventListener('click',async()=>{await this.selectImageFile('Seleccionar nueva imagen de carga',editLoadingImageFile,editLoadingImagePreview)})
  editCoverFile.addEventListener('change',(e)=>{const file=e.target.files[0];if(file)this.handleImageUpload(file,editCoverPreview)})
  editLoadingImageFile.addEventListener('change',(e)=>{const file=e.target.files[0];if(file)this.handleImageUpload(file,editLoadingImagePreview)})
  document.getElementById('btnSaveEdit').addEventListener('click',async()=>{await this.handleSaveEdit(game,gameIndex)})
  document.getElementById('btnDeleteGame').addEventListener('click',()=>{
   if(confirm(`¿Eliminar permanentemente "${game.name}"?\nEsta acción no se puede deshacer.`)){this.handleDeleteGame(game,gameIndex)}
  })
  document.getElementById('btnCancelEdit').addEventListener('click',()=>{this.closeEditModal()})
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&this.isInModal){this.closeEditModal()}},{once:false})
  document.getElementById('editGameModal').addEventListener('click',(e)=>{if(e.target.id==='editGameModal'){this.closeEditModal()}})
 }

 cancelLoading(){
  this.isLoading=false
  this.hideLoadingScreen()
  if(this.loadingInterval)clearInterval(this.loadingInterval)
  this.showNotification('Cancelado','Inicio de juego cancelado','info')
 }

 escapeHtml(text){
  const div=document.createElement('div')
  div.textContent=text
  return div.innerHTML
 }

 removeSelectedGame(){
  if(this.currentCenterIndex<1||this.games.length===0){this.showNotification('Error','Selecciona un juego primero','error');return}
  const gameIndex=this.currentCenterIndex-1
  const game=this.games[gameIndex]
  if(game){
   const gameName=game.name
   this.games.splice(gameIndex,1)
   this.renderCarousel()
   this.saveConfig()
   this.showNotification('Eliminado',`"${gameName}" removido`,'success')
  }
 }

 openAddGameModal(){
  this.isInModal=true
  const modal=document.getElementById('addGameModal')
  if(!modal)return
  modal.classList.add('active')
  document.body.classList.add('modal-open')
  this.showCursor()
  this.resetAddForm()
  this.setupAddModalEvents()
  setTimeout(()=>document.getElementById('gameName').focus(),100)
 }

 closeAddGameModal(){
  this.isInModal=false
  const modal=document.getElementById('addGameModal')
  if(modal)modal.classList.remove('active')
  this.resetAddForm()
  document.body.classList.remove('modal-open')
  this.forceHideCursor()
 }

 forceHideCursor(){
  document.body.style.cursor='none'
  document.body.style.pointerEvents='none'
  document.querySelectorAll('*').forEach(el=>{
   el.style.cursor='none'
   if(!el.classList.contains('carousel-item')&&!el.classList.contains('nav-arrow')&&!el.classList.contains('quick-menu')){el.style.pointerEvents='none'}
  })
  setTimeout(()=>document.body.style.cursor='none',50)
  document.body.classList.add('cursor-hidden')
  document.body.classList.remove('cursor-visible')
 }

 setupAddModalEvents(){
  const elements=['btnSelectGame','coverPreview','loadingImagePreview','btnSaveGame','btnCancelGame']
  elements.forEach(id=>{
   const el=document.getElementById(id)
   if(el){const newEl=el.cloneNode(true);el.parentNode.replaceChild(newEl,el)}
  })
  document.getElementById('btnSelectGame').addEventListener('click',()=>this.browseForGame())
  const coverPreview=document.getElementById('coverPreview')
  const loadingImagePreview=document.getElementById('loadingImagePreview')
  const coverFileInput=document.getElementById('coverFile')
  const loadingImageFileInput=document.getElementById('loadingImageFile')
  coverPreview.addEventListener('click',async()=>await this.selectImageFile('Seleccionar portada del juego',coverFileInput,coverPreview))
  loadingImagePreview.addEventListener('click',async()=>await this.selectImageFile('Seleccionar imagen de carga',loadingImageFileInput,loadingImagePreview))
  coverFileInput.addEventListener('change',(e)=>{const file=e.target.files[0];if(file)this.handleImageUpload(file,coverPreview)})
  loadingImageFileInput.addEventListener('change',(e)=>{const file=e.target.files[0];if(file)this.handleImageUpload(file,loadingImagePreview)})
  document.getElementById('btnSaveGame').addEventListener('click',()=>this.handleAddNewGame())
  document.getElementById('btnCancelGame').addEventListener('click',()=>this.closeAddGameModal())
  document.getElementById('gameName').addEventListener('keypress',(e)=>{if(e.key==='Enter')this.handleAddNewGame()})
 }

 async selectImageFile(title,fileInput,previewElement){
  try{
   if(window.psboxAPI?.showOpenDialog){
    const result=await psboxAPI.showOpenDialog({
     title:title,
     filters:[{name:'Imágenes',extensions:['jpg','jpeg','png','gif','bmp','webp']},{name:'Todos los archivos',extensions:['*']}],
     properties:['openFile']
    })
    if(!result.canceled&&result.filePaths.length>0){
     const path=result.filePaths[0]
     previewElement.innerHTML=`<img src="file://${path}" alt="Vista previa" style="width:100%;height:100%;object-fit:cover;">`
     try{
      const response=await fetch(`file://${path}`)
      const blob=await response.blob()
      const file=new File([blob],path.split('\\').pop().split('/').pop(),{type:blob.type})
      const dataTransfer=new DataTransfer()
      dataTransfer.items.add(file)
      fileInput.files=dataTransfer.files
     }catch{}
    }
   }else fileInput.click()
  }catch{this.showNotification('Error','No se pudo seleccionar la imagen','error')}
 }

 handleContinuousNavigation(){
  const now=Date.now()
  if(!this.isHoldingDirection||now-this.lastNavigationTime<this.currentHoldDelay)return
  this.navigateCarousel(this.navigationDirection)
  this.lastNavigationTime=now
  if(this.currentHoldDelay>this.minNavigationDelay){this.currentHoldDelay=Math.max(this.minNavigationDelay,this.currentHoldDelay*this.navigationAcceleration)}
 }

 handleImageUpload(file,previewElement){
  if(!file.type.startsWith('image/')){this.showNotification('Error','Por favor selecciona un archivo de imagen','error');return}
  if(file.size>5*1024*1024){this.showNotification('Error','La imagen es demasiado grande (máximo 5MB)','error');return}
  const reader=new FileReader()
  reader.onload=(event)=>previewElement.innerHTML=`<img src="${event.target.result}" alt="Vista previa" style="width:100%;height:100%;object-fit:cover;">`
  reader.onerror=()=>this.showNotification('Error','Error al leer la imagen','error')
  reader.readAsDataURL(file)
 }

 async browseForGame(){
  try{
   if(window.psboxAPI?.showOpenDialog){
    const result=await psboxAPI.showOpenDialog({
     title:'Seleccionar ejecutable del juego',
     filters:[{name:'Ejecutables',extensions:['exe','lnk','bat','msi']},{name:'Todos los archivos',extensions:['*']}],
     properties:['openFile']
    })
    if(!result.canceled&&result.filePaths.length>0){
     const path=result.filePaths[0]
     document.getElementById('gamePath').value=path
     const nameInput=document.getElementById('gameName')
     if(!nameInput.value.trim()){
      const fileName=path.split('\\').pop().split('/').pop()
      const nameWithoutExt=fileName.replace(/\.[^/.]+$/,"")
      const friendlyName=nameWithoutExt.replace(/[_-]/g,' ').replace(/\b\w/g,l=>l.toUpperCase()).trim()
      nameInput.value=friendlyName
     }
     setTimeout(async()=>{
      if(window.psboxAPI?.checkPathExists){
       const checkResult=await psboxAPI.checkPathExists(path)
       if(!checkResult.exists){this.showNotification('Advertencia','La ruta seleccionada podría no ser accesible después de mover la aplicación','warning')}
      }
     },500)
    }
   }else{
    document.getElementById('gamePath').value='C:\\Juegos\\Ejemplo\\game.exe'
    const nameInput=document.getElementById('gameName')
    if(!nameInput.value.trim())nameInput.value='Mi Juego Ejemplo'
    this.showNotification('Modo desarrollo','Simulando selección de archivo','info')
   }
  }catch(error){this.showNotification('Error','No se pudo seleccionar el archivo: '+error.message,'error')}
 }

 readImageAsBase64(file){
  return new Promise((resolve,reject)=>{
   if(!file){resolve(null);return}
   if(file.size>5*1024*1024){this.showNotification('Advertencia','La imagen es muy grande (máx. 5MB)','warning')}
   const reader=new FileReader()
   reader.onload=(event)=>resolve(event.target.result)
   reader.onerror=()=>reject(new Error('No se pudo leer la imagen'))
   reader.readAsDataURL(file)
  })
 }

 resetAddForm(){
  document.getElementById('gameName').value=''
  document.getElementById('gamePath').value=''
  document.getElementById('coverFile').value=''
  document.getElementById('loadingImageFile').value=''
  const previews={'coverPreview':'📷','loadingImagePreview':'🔄'}
  Object.entries(previews).forEach(([id,icon])=>{
   const preview=document.getElementById(id)
   if(preview)preview.innerHTML=`<div class="preview-placeholder"><i>${icon}</i><div>Haz clic para seleccionar</div></div>`
  })
 }

 async handleAddNewGame(){
  const name=document.getElementById('gameName')?.value.trim()
  const path=document.getElementById('gamePath')?.value.trim()
  const coverFile=document.getElementById('coverFile')?.files[0]
  const loadingFile=document.getElementById('loadingImageFile')?.files[0]
  if(!name||!path){this.showNotification('Error','Nombre y ruta del juego son requeridos','error');return}
  try{
   let coverData=null,loadingImageData=null
   if(coverFile)coverData=await this.readImageAsBase64(coverFile)
   if(loadingFile)loadingImageData=await this.readImageAsBase64(loadingFile)
   const newGame={
    id:'game_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
    name:name,
    path:path,
    cover:coverData,
    loadingImage:loadingImageData,
    added:new Date().toISOString(),
    lastPlayed:null,
    playCount:0
   }
   this.games.push(newGame)
   await this.saveConfig()
   this.renderCarousel()
   this.currentCenterIndex=this.games.length
   this.updateCarouselPositions()
   this.closeAddGameModal()
   this.showNotification('✅ Juego agregado',`"${name}" se agregó correctamente`,'success')
  }catch(error){this.showNotification('Error','No se pudo agregar el juego: '+error.message,'error')}
 }

 hideCursor(){
  document.body.style.cursor='none'
  document.body.classList.add('no-cursor')
  document.body.classList.remove('has-cursor')
  document.querySelectorAll('*').forEach(el=>el.style.cursor='none')
  setTimeout(()=>document.body.style.cursor='none',10)
  this.cursorEnabled=false
 }

 showCursor(){
  document.body.style.cursor='default'
  document.body.classList.add('has-cursor')
  document.body.classList.remove('no-cursor')
  document.querySelectorAll('*').forEach(el=>el.style.cursor='')
  this.cursorEnabled=true
 }

 initGamepad(){
  window.addEventListener('gamepadconnected',(e)=>{
   this.gamepads.push(e.gamepad)
   this.activeGamepad=e.gamepad
   this.startGamepadPolling()
   this.showNotification('Mando conectado',e.gamepad.id,'success')
  })
  window.addEventListener('gamepaddisconnected',(e)=>{
   this.gamepads=this.gamepads.filter(gp=>gp.id!==e.gamepad.id)
   this.activeGamepad=this.gamepads.length>0?this.gamepads[0]:null
   if(this.gamepads.length===0)this.showNotification('Mando desconectado','Conecta un mando para jugar','info')
  })
  if(navigator.getGamepads){
   const gamepads=navigator.getGamepads()
   gamepads.forEach(gp=>{
    if(gp){
     this.gamepads.push(gp)
     if(!this.activeGamepad){
      this.activeGamepad=gp
      this.startGamepadPolling()
     }
    }
   })
  }
 }

 startGamepadPolling(){
  if(this.isPolling)return
  this.isPolling=true
  const poll=()=>{
   if(!this.isPolling)return
   try{
    const gamepads=navigator.getGamepads()
    if(this.activeGamepad){
     const gp=gamepads[this.activeGamepad.index]
     if(gp)this.processGamepadInput(gp)
    }
    requestAnimationFrame(poll)
   }catch{this.isPolling=false}
  }
  poll()
 }

 processGamepadInput(gamepad){
  if(this.isInModal)return
  const buttons=gamepad.buttons,axes=gamepad.axes,now=Date.now()
  if(this.lastGamepadUpdate&&(now-this.lastGamepadUpdate<50))return
  let direction=0
  const leftPressed=axes[0]<-0.5||buttons[14]?.pressed
  const rightPressed=axes[0]>0.5||buttons[15]?.pressed
  if(leftPressed)direction=-1
  else if(rightPressed)direction=1
  if(direction!==0){
   if(direction!==this.navigationDirection||!this.isHoldingDirection){
    this.isHoldingDirection=true
    this.navigationDirection=direction
    this.holdStartTime=now
    this.currentHoldDelay=this.navigationDelay
    this.navigateCarousel(direction)
    this.lastNavigationTime=now
   }
  }else{this.isHoldingDirection=false;this.navigationDirection=0}
  this.handleContinuousNavigation()
  const optionsButton=buttons[9]||buttons[7]
  if(optionsButton?.pressed){
   if(!this.optionsPressed){this.toggleQuickMenu();this.optionsPressed=true;this.lastGamepadUpdate=now;return}
  }else this.optionsPressed=false
  if(this.isInQuickMenu){
   if(axes[1]<-0.5||buttons[12]?.pressed){
    if(!this.dpadUpPressed){this.navigateQuickMenuUp();this.dpadUpPressed=true;this.lastGamepadUpdate=now}
   }else this.dpadUpPressed=false
   if(axes[1]>0.5||buttons[13]?.pressed){
    if(!this.dpadDownPressed){this.navigateQuickMenuDown();this.dpadDownPressed=true;this.lastGamepadUpdate=now}
   }else this.dpadDownPressed=false
   if(buttons[0]?.pressed&&!this.buttonAPressed){this.selectQuickMenuItem();this.buttonAPressed=true;this.lastGamepadUpdate=now}
   else if(!buttons[0]||!buttons[0].pressed)this.buttonAPressed=false
   if(buttons[1]?.pressed&&!this.buttonBPressed){this.closeQuickMenu();this.buttonBPressed=true;this.lastGamepadUpdate=now}
   else if(!buttons[1]||!buttons[1].pressed)this.buttonBPressed=false
   return
  }
  if(!this.isHoldingDirection&&buttons[0]?.pressed&&!this.buttonAPressed){this.performAction();this.buttonAPressed=true;this.lastGamepadUpdate=now}
  else if(!buttons[0]||!buttons[0].pressed)this.buttonAPressed=false
 }

 setupKeyboardEvents(){
  let keyHoldInterval
  let currentKey=null
  document.addEventListener('keydown',(e)=>{
   if(this.isInModal){
    switch(e.key){
     case 'Escape':e.preventDefault();this.closeAddGameModal();break
     case 'Enter':if(e.target.id==='gameName'){e.preventDefault();this.handleAddNewGame()}break
    }
    return
   }
   if(['ArrowLeft','ArrowRight','Tab','Escape'].includes(e.key)){
    e.preventDefault()
    if(['ArrowLeft','ArrowRight'].includes(e.key)&&!currentKey){
     currentKey=e.key
     const direction=e.key==='ArrowLeft'?-1:1
     this.navigateCarousel(direction)
     keyHoldInterval=setInterval(()=>{this.navigateCarousel(direction)},150)
    }
    switch(e.key){
     case 'Tab':this.toggleQuickMenu();break
     case 'Escape':if(this.isQuickMenuOpen)this.closeQuickMenu();break
    }
   }
  })
  document.addEventListener('keyup',(e)=>{
   if(['ArrowLeft','ArrowRight'].includes(e.key)){
    if(keyHoldInterval){
     clearInterval(keyHoldInterval)
     keyHoldInterval=null
     currentKey=null
    }
   }
  })
 }

 async launchGame(game){
  if(this.isLoading)return
  this.isLoading=true
  this.showLoadingScreen(game)
  try{
   if(window.psboxAPI&&psboxAPI.launchProgram){
    const result=await psboxAPI.launchProgram(game)
    if(result.success){
     const gameIndex=this.games.findIndex(g=>g.id===game.id)
     if(gameIndex!==-1){
      this.games[gameIndex].lastPlayed=new Date().toISOString()
      this.games[gameIndex].playCount=(this.games[gameIndex].playCount||0)+1
      await this.saveConfig()
     }
     this.showNotification('✅ Juego iniciado',`${game.name} se está ejecutando`,'success')
    }else{this.showNotification('❌ Error',`No se pudo iniciar ${game.name}: ${result.error}`,'error')}
   }else{this.showNotification('Modo desarrollo',`Simulando ejecución de ${game.name}`,'info')}
  }catch(error){this.showNotification('❌ Error crítico',`Error: ${error.message}`,'error')}
  setTimeout(()=>{this.completeLoadingScreen();this.isLoading=false},1500)
 }

 showLoadingScreen(game){
  const loadingScreen=document.getElementById('loadingScreen')
  loadingScreen.innerHTML=`
   <div class="loading-fullscreen-cover">
    ${game.loadingImage?`<img src="${game.loadingImage}" alt="${game.name}" class="loading-background-image">`:
    '<div class="loading-placeholder">🎮</div>'}
   </div>
   <div class="loading-bottom-container">
    <div class="loading-text" id="loadingText">Iniciando juego...</div>
    <div class="loading-progress-container">
     <div class="loading-progress-bar" id="loadingProgress"></div>
    </div>
    <div class="loading-controls">
     <div class="loading-spinner"></div>
     <button class="loading-cancel" onclick="cancelLoading()">Cancelar</button>
    </div>
   </div>`
  if(loadingScreen)loadingScreen.classList.add('active')
  const progressBar=document.getElementById('loadingProgress')
  let progress=0
  this.loadingInterval=setInterval(()=>{
   if(progress>=90)return
   progress+=2
   if(progressBar)progressBar.style.width=`${progress}%`
  },100)
 }

 completeLoadingScreen(){
  if(this.loadingInterval)clearInterval(this.loadingInterval)
  const progressBar=document.getElementById('loadingProgress')
  const loadingText=document.getElementById('loadingText')
  if(progressBar){progressBar.style.width='100%';progressBar.style.animation='none';progressBar.style.boxShadow='0 0 25px rgba(0,168,255,0.7)'}
  if(loadingText)loadingText.textContent='¡Listo!'
  setTimeout(()=>this.hideLoadingScreen(),1000)
 }

 hideLoadingScreen(){
  const loadingScreen=document.getElementById('loadingScreen')
  if(loadingScreen)loadingScreen.classList.remove('active')
  const progressBar=document.getElementById('loadingProgress')
  if(progressBar)progressBar.style.width='0%'
 }

 showNotification(title,message,type='info'){
  const notification=document.getElementById('notification')
  const icon=document.getElementById('notificationIcon')
  const titleEl=document.getElementById('notificationTitle')
  const messageEl=document.getElementById('notificationMessage')
  if(!notification)return
  notification.className='notification'
  notification.classList.add(`notification-${type}`)
  const icons={'success':'✅','error':'❌','warning':'⚠️','info':'ℹ️'}
  if(icon)icon.textContent=icons[type]||'ℹ️'
  if(titleEl)titleEl.textContent=title
  if(messageEl)messageEl.textContent=message
  notification.classList.add('show')
  setTimeout(()=>notification.classList.remove('show'),3000)
 }

 showAbout(){
  this.showNotification('Acerca de PSBOX','Versión 1.0\nInterfaz estilo PlayStation 4\nDesarrollado por PSBOX Team','info')
 }

 closePSBOX(){
  this.showNotification('Cerrando PSBOX','Hasta pronto...','info')
  setTimeout(()=>{
   if(window.psboxAPI?.closeApp)psboxAPI.closeApp()
   else window.close()
  },1000)
 }

 enterFullscreen(){
  if(window.psboxAPI?.enterFullscreen)psboxAPI.enterFullscreen()
  else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen()
 }
}

let psboxSystem
window.onload=async function(){
 try{
  psboxSystem=new PSBOXSystem()
  window.psboxSystem=psboxSystem
  await psboxSystem.init()
 }catch{}
}