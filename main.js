const {app,BrowserWindow,ipcMain,dialog}=require('electron')
const path=require('path')
const fs=require('fs')
let mainWindow=null
function getConfigPath(){
 if(app.isPackaged){
  const appDataPath=app.getPath('appData')
  const appFolder=path.join(appDataPath,'PSBOX')
  if(!fs.existsSync(appFolder)){fs.mkdirSync(appFolder,{recursive:true})}
  return path.join(appFolder,'psbox_config.json')
 }else{
  return path.join(__dirname,'psbox_config.json')
 }
}
function getAppBasePath(){
 if(app.isPackaged){
  return path.dirname(process.execPath)
 }else{
  return __dirname
 }
}

// main.js o controllerTestLab.js

class ControllerTestLab {
  constructor() {
    this.activeTests = new Map(); // controllerId -> testData
    this.testHistory = [];
    this.isRunning = false;
    this.samplingRate = 60; // Hz
    this.testDuration = 10000; // 10 segundos por prueba
    
    console.log('🔬 Controller Test Lab inicializado');
  }

  // Iniciar prueba para un control específico
  startTest(controllerId, controllerData) {
    const testId = `test_${controllerId}_${Date.now()}`;
    
    const testData = {
      id: testId,
      controllerId,
      controllerData,
      startTime: Date.now(),
      endTime: null,
      status: 'running',
      inputs: [],
      stats: {
        totalInputs: 0,
        ghostInputs: 0,
        maxLatency: 0,
        avgLatency: 0,
        deadZoneIssues: [],
        pressureIssues: []
      },
      reports: {
        latency: {},
        deadzone: {},
        pressure: {},
        ghost: {},
        overall: {}
      }
    };
    
    this.activeTests.set(controllerId, testData);
    this.isRunning = true;
    
    console.log(`🔬 Iniciando test para control ${controllerId}`);
    
    // Iniciar loop de muestreo
    this.startSampling(controllerId);
    
    return testData;
  }

  // Loop de muestreo
  startSampling(controllerId) {
    const interval = setInterval(() => {
      if (!this.activeTests.has(controllerId)) {
        clearInterval(interval);
        return;
      }
      
      const testData = this.activeTests.get(controllerId);
      const gamepad = this.getGamepadById(controllerId);
      
      if (gamepad) {
        this.sampleInputs(testData, gamepad);
      }
      
      // Verificar si la prueba terminó
      if (Date.now() - testData.startTime >= this.testDuration) {
        this.completeTest(controllerId);
        clearInterval(interval);
      }
    }, 1000 / this.samplingRate);
  }

  // Muestrear inputs
  sampleInputs(testData, gamepad) {
    const sample = {
      timestamp: Date.now(),
      buttons: [],
      axes: [],
      triggers: [],
      timestampOffset: Date.now() - testData.startTime
    };
    
    // Capturar botones
    if (gamepad.buttons) {
      sample.buttons = gamepad.buttons.map((btn, index) => ({
        index,
        pressed: btn.pressed,
        value: btn.value,
        touched: btn.touched
      }));
    }
    
    // Capturar ejes (sticks)
    if (gamepad.axes) {
      sample.axes = gamepad.axes.map((axis, index) => ({
        index,
        value: axis,
        normalized: this.normalizeAxis(axis)
      }));
    }
    
    // Detectar triggers (generalmente ejes 2 y 5 en XInput)
    sample.triggers = this.extractTriggers(gamepad);
    
    // Agregar a historial de inputs
    testData.inputs.push(sample);
    testData.stats.totalInputs++;
    
    // Analizar muestra
    this.analyzeSample(testData, sample);
    
    // Enviar a UI
    this.sendSampleToUI(testData.controllerId, sample);
  }

  // Extraer triggers
  extractTriggers(gamepad) {
    const triggers = [];
    
    // XInput: Left Trigger = axes[2], Right Trigger = axes[5]
    if (gamepad.axes && gamepad.axes.length >= 6) {
      triggers.push({
        name: 'Left Trigger',
        index: 2,
        value: gamepad.axes[2],
        normalized: this.normalizeTrigger(gamepad.axes[2])
      });
      
      triggers.push({
        name: 'Right Trigger',
        index: 5,
        value: gamepad.axes[5],
        normalized: this.normalizeTrigger(gamepad.axes[5])
      });
    }
    
    return triggers;
  }

  // Analizar cada muestra
  analyzeSample(testData, sample) {
    // Detectar latencia
    const latency = this.calculateLatency(sample);
    if (latency > testData.stats.maxLatency) {
      testData.stats.maxLatency = latency;
    }
    
    // Detectar dead zones
    const deadzoneIssues = this.checkDeadZones(sample);
    if (deadzoneIssues.length > 0) {
      testData.stats.deadZoneIssues.push(...deadzoneIssues);
    }
    
    // Detectar problemas de presión
    const pressureIssues = this.checkPressure(sample);
    if (pressureIssues.length > 0) {
      testData.stats.pressureIssues.push(...pressureIssues);
    }
    
    // Detectar inputs fantasma
    if (this.detectGhostInput(testData, sample)) {
      testData.stats.ghostInputs++;
    }
  }

  // Calcular latencia
  calculateLatency(sample) {
    // Latencia aproximada basada en timestamp
    const now = Date.now();
    const latency = now - sample.timestamp;
    return Math.max(0, latency);
  }

  // Verificar dead zones
  checkDeadZones(sample) {
    const issues = [];
    const deadZoneThreshold = 0.1;
    
    // Verificar sticks
    sample.axes.forEach(axis => {
      if (Math.abs(axis.value) < deadZoneThreshold && axis.value !== 0) {
        issues.push({
          type: 'deadzone',
          input: `Axis ${axis.index}`,
          value: axis.value,
          timestamp: sample.timestampOffset
        });
      }
    });
    
    // Verificar triggers
    sample.triggers.forEach(trigger => {
      if (trigger.normalized < deadZoneThreshold && trigger.normalized > 0) {
        issues.push({
          type: 'deadzone',
          input: trigger.name,
          value: trigger.normalized,
          timestamp: sample.timestampOffset
        });
      }
    });
    
    return issues;
  }

  // Verificar presión
  checkPressure(sample) {
    const issues = [];
    const maxPressure = 1.0;
    const minPressure = 0.0;
    
    // Verificar botones
    sample.buttons.forEach(button => {
      if (button.value > maxPressure || button.value < minPressure) {
        issues.push({
          type: 'pressure',
          input: `Button ${button.index}`,
          value: button.value,
          expected: '0.0 - 1.0',
          timestamp: sample.timestampOffset
        });
      }
    });
    
    return issues;
  }

  // Detectar input fantasma
  detectGhostInput(testData, sample) {
    if (testData.inputs.length < 2) return false;
    
    const previousSample = testData.inputs[testData.inputs.length - 2];
    
    // Verificar si los inputs son idénticos (fantasma)
    const identicalButtons = JSON.stringify(sample.buttons) === JSON.stringify(previousSample.buttons);
    const identicalAxes = JSON.stringify(sample.axes) === JSON.stringify(previousSample.axes);
    
    return identicalButtons && identicalAxes;
  }

  // Completar prueba
  completeTest(controllerId) {
    const testData = this.activeTests.get(controllerId);
    if (!testData) return;
    
    testData.endTime = Date.now();
    testData.status = 'completed';
    
    // Generar reportes
    this.generateReports(testData);
    
    // Calcular estadísticas finales
    this.calculateFinalStats(testData);
    
    // Guardar en historial
    this.testHistory.push(testData);
    
    // Limitar historial
    if (this.testHistory.length > 50) {
      this.testHistory.shift();
    }
    
    // Enviar resultados a UI
    this.sendTestResults(testData);
    
    // Limpiar test activo
    this.activeTests.delete(controllerId);
    
    console.log(`✅ Test completado para control ${controllerId}`);
  }

  // Generar reportes
  generateReports(testData) {
    // Reporte de latencia
    testData.reports.latency = {
      max: testData.stats.maxLatency,
      avg: testData.stats.avgLatency,
      grade: this.gradeLatency(testData.stats.maxLatency)
    };
    
    // Reporte de deadzone
    testData.reports.deadzone = {
      issues: testData.stats.deadZoneIssues.length,
      details: testData.stats.deadZoneIssues.slice(0, 10),
      grade: this.gradeDeadzone(testData.stats.deadZoneIssues.length)
    };
    
    // Reporte de presión
    testData.reports.pressure = {
      issues: testData.stats.pressureIssues.length,
      details: testData.stats.pressureIssues.slice(0, 10),
      grade: this.gradePressure(testData.stats.pressureIssues.length)
    };
    
    // Reporte de fantasmas
    testData.reports.ghost = {
      count: testData.stats.ghostInputs,
      percentage: (testData.stats.ghostInputs / testData.stats.totalInputs) * 100,
      grade: this.gradeGhost(testData.stats.ghostInputs)
    };
    
    // Reporte general
    testData.reports.overall = this.calculateOverallGrade(testData);
  }

  // Calcular estadísticas finales
  calculateFinalStats(testData) {
    if (testData.inputs.length === 0) return;
    
    // Calcular latencia promedio
    const totalLatency = testData.inputs.reduce((sum, input) => {
      return sum + (Date.now() - input.timestamp);
    }, 0);
    
    testData.stats.avgLatency = totalLatency / testData.inputs.length;
  }

  // Grados para reportes
  gradeLatency(latency) {
    if (latency < 16) return 'A+'; // < 1 frame a 60fps
    if (latency < 33) return 'A';  // < 2 frames
    if (latency < 50) return 'B';
    if (latency < 100) return 'C';
    return 'D';
  }

  gradeDeadzone(issues) {
    if (issues === 0) return 'A+';
    if (issues < 5) return 'A';
    if (issues < 10) return 'B';
    if (issues < 20) return 'C';
    return 'D';
  }

  gradePressure(issues) {
    if (issues === 0) return 'A+';
    if (issues < 3) return 'A';
    if (issues < 6) return 'B';
    if (issues < 10) return 'C';
    return 'D';
  }

  gradeGhost(count) {
    if (count === 0) return 'A+';
    if (count < 3) return 'A';
    if (count < 6) return 'B';
    if (count < 10) return 'C';
    return 'D';
  }

  // Calcular grado general
  calculateOverallGrade(testData) {
    const grades = {
      latency: testData.reports.latency.grade,
      deadzone: testData.reports.deadzone.grade,
      pressure: testData.reports.pressure.grade,
      ghost: testData.reports.ghost.grade
    };
    
    const gradeMap = { 'A+': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0 };
    const total = Object.values(grades).reduce((sum, grade) => sum + gradeMap[grade], 0);
    const avg = total / Object.keys(grades).length;
    
    let overallGrade;
    if (avg >= 3.5) overallGrade = 'A+';
    else if (avg >= 3) overallGrade = 'A';
    else if (avg >= 2) overallGrade = 'B';
    else if (avg >= 1) overallGrade = 'C';
    else overallGrade = 'D';
    
    return {
      grade: overallGrade,
      details: grades,
      score: Math.round((avg / 4) * 100)
    };
  }

  // Obtener gamepad por ID
  getGamepadById(controllerId) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    return gamepads.find(gp => gp && gp.id.includes(controllerId));
  }

  // Normalizar valores
  normalizeAxis(value) {
    return Math.max(-1, Math.min(1, value));
  }

  normalizeTrigger(value) {
    // Triggers van de -1 a 1, normalizar a 0-1
    return (value + 1) / 2;
  }

  // Enviar datos a UI
  sendSampleToUI(controllerId, sample) {
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('test-lab-sample', {
        controllerId,
        sample,
        timestamp: Date.now()
      });
    }
  }

  sendTestResults(testData) {
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('test-lab-results', testData);
    }
  }

  // Obtener test activo
  getActiveTest(controllerId) {
    return this.activeTests.get(controllerId);
  }

  // Cancelar test
  cancelTest(controllerId) {
    if (this.activeTests.has(controllerId)) {
      this.activeTests.delete(controllerId);
      return true;
    }
    return false;
  }

  // Obtener historial
  getTestHistory() {
    return this.testHistory;
  }

  // Exportar resultados
  exportResults(testId, format = 'json') {
    const test = this.testHistory.find(t => t.id === testId);
    if (!test) return null;
    
    switch (format) {
      case 'json':
        return JSON.stringify(test, null, 2);
      case 'csv':
        return this.generateCSV(test);
      case 'html':
        return this.generateHTMLReport(test);
      default:
        return JSON.stringify(test);
    }
  }

  generateCSV(testData) {
    let csv = 'Timestamp,Input Type,Input Index,Value,Status\n';
    
    testData.inputs.forEach(input => {
      // Botones
      input.buttons.forEach(btn => {
        csv += `${input.timestampOffset},Button,${btn.index},${btn.value},${btn.pressed ? 'PRESSED' : 'RELEASED'}\n`;
      });
      
      // Ejes
      input.axes.forEach(axis => {
        csv += `${input.timestampOffset},Axis,${axis.index},${axis.value},ACTIVE\n`;
      });
    });
    
    return csv;
  }

  generateHTMLReport(testData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Controller Test Report - ${testData.controllerId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .report-header { background: #2c3e50; color: white; padding: 20px; border-radius: 10px; }
          .grade { font-size: 48px; font-weight: bold; margin: 10px 0; }
          .grade-A { color: #2ecc71; }
          .grade-B { color: #f39c12; }
          .grade-C { color: #e74c3c; }
          .grade-D { color: #c0392b; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: #ecf0f1; padding: 15px; border-radius: 8px; }
          .issues-list { margin-top: 20px; }
          .issue-item { padding: 10px; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>Controller Health Report</h1>
          <p>Controller: ${testData.controllerId}</p>
          <p>Test Date: ${new Date(testData.startTime).toLocaleString()}</p>
          <div class="grade grade-${testData.reports.overall.grade}">
            ${testData.reports.overall.grade} (${testData.reports.overall.score}%)
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Latency</h3>
            <p>Max: ${testData.reports.latency.max}ms</p>
            <p>Grade: ${testData.reports.latency.grade}</p>
          </div>
          <div class="stat-card">
            <h3>Deadzone</h3>
            <p>Issues: ${testData.reports.deadzone.issues}</p>
            <p>Grade: ${testData.reports.deadzone.grade}</p>
          </div>
          <div class="stat-card">
            <h3>Pressure</h3>
            <p>Issues: ${testData.reports.pressure.issues}</p>
            <p>Grade: ${testData.reports.pressure.grade}</p>
          </div>
          <div class="stat-card">
            <h3>Ghost Inputs</h3>
            <p>Count: ${testData.reports.ghost.count}</p>
            <p>Grade: ${testData.reports.ghost.grade}</p>
          </div>
        </div>
        
        <div class="issues-list">
          <h2>Detailed Issues</h2>
          ${testData.stats.deadZoneIssues.map(issue => `
            <div class="issue-item">
              <strong>${issue.type.toUpperCase()}</strong>: ${issue.input} = ${issue.value}
              <small>(${issue.timestamp}ms)</small>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;
  }
}

// Instancia global
const controllerTestLab = new ControllerTestLab();

// IPC Handlers
ipcMain.handle('test-lab:start', (event, controllerId, controllerData) => {
  return controllerTestLab.startTest(controllerId, controllerData);
});

ipcMain.handle('test-lab:stop', (event, controllerId) => {
  return controllerTestLab.cancelTest(controllerId);
});

ipcMain.handle('test-lab:get-active', (event, controllerId) => {
  return controllerTestLab.getActiveTest(controllerId);
});

ipcMain.handle('test-lab:get-history', (event) => {
  return controllerTestLab.getTestHistory();
});

ipcMain.handle('test-lab:export', (event, testId, format) => {
  return controllerTestLab.exportResults(testId, format);
});

// Escuchar eventos de gamepad
ipcMain.on('gamepad-data', (event, controllerId, gamepadData) => {
  // Si hay un test activo para este control, procesar datos
  if (controllerTestLab.activeTests.has(controllerId)) {
    const testData = controllerTestLab.activeTests.get(controllerId);
    // El sampling se maneja internamente, pero podemos usar esto para validación
  }
});

module.exports = controllerTestLab;

// main.js o ghostDetector.js

class GhostDetector {
  constructor() {
    this.detectionHistory = [];
    this.ghostControllers = new Map(); // id -> { type, originalId, detectedAt }
    this.isEnabled = true;
    this.sensitivity = 0.95; // 95% similitud para considerar fantasma
    this.detectionWindow = 100; // ms para comparar inputs
    this.recentInputs = new Map(); // controllerId -> {inputs, timestamp}
    
    console.log('👻 Ghost Detector inicializado');
  }

  // Método principal para analizar inputs
  analyzeInputs(controllerId, inputs) {
    if (!this.isEnabled) return null;
    
    const timestamp = Date.now();
    const inputSignature = this.createInputSignature(inputs);
    
    // Guardar input reciente
    this.recentInputs.set(controllerId, {
      inputs,
      signature: inputSignature,
      timestamp
    });
    
    // Buscar fantasmas
    const ghost = this.detectGhost(controllerId, inputSignature, timestamp);
    
    if (ghost) {
      this.handleGhostDetection(ghost, controllerId);
      return ghost;
    }
    
    return null;
  }

  // Crear firma única de inputs para comparación
  createInputSignature(inputs) {
    // Normalizar inputs para comparación
    const normalized = {
      buttons: inputs.buttons?.map(b => Math.round(b * 100) / 100) || [],
      axes: inputs.axes?.map(a => Math.round(a * 1000) / 1000) || [],
      timestamp: Date.now()
    };
    
    return JSON.stringify(normalized);
  }

  // Detectar si es fantasma
  detectGhost(controllerId, signature, timestamp) {
    let possibleGhost = null;
    
    // Comparar con inputs recientes de otros controles
    for (const [otherId, data] of this.recentInputs.entries()) {
      if (otherId === controllerId) continue;
      
      // Verificar si los inputs son idénticos en la misma ventana de tiempo
      const timeDiff = Math.abs(timestamp - data.timestamp);
      const signatureMatch = signature === data.signature;
      
      if (timeDiff < this.detectionWindow && signatureMatch) {
        // Determinar cuál es el fantasma (el que apareció después)
        const isGhost = timestamp > data.timestamp;
        const ghostId = isGhost ? controllerId : otherId;
        const originalId = isGhost ? otherId : controllerId;
        
        possibleGhost = {
          ghostId,
          originalId,
          signature,
          timestamp,
          confidence: 1.0
        };
        
        break;
      }
    }
    
    return possibleGhost;
  }

  // Manejar detección de fantasma
  handleGhostDetection(ghostData, currentControllerId) {
    const { ghostId, originalId } = ghostData;
    
    // Verificar si ya fue detectado recientemente
    if (this.ghostControllers.has(ghostId)) {
      return; // Ya está marcado como fantasma
    }
    
    // Guardar en historial
    const detection = {
      ghostId,
      originalId,
      detectedAt: new Date().toISOString(),
      inputSignature: ghostData.signature,
      autoDisabled: true
    };
    
    this.detectionHistory.push(detection);
    this.ghostControllers.set(ghostId, detection);
    
    console.log(`👻 GHOST DETECTED: ${ghostId} mirroring ${originalId}`);
    
    // Notificar al renderer
    this.notifyRenderer('ghost-detected', detection);
    
    // Auto-disable (opcional, configurable)
    if (this.isEnabled) {
      this.disableGhostController(ghostId);
    }
  }

  // Deshabilitar control fantasma
  disableGhostController(ghostId) {
    console.log(`🚫 Auto-disabling ghost controller: ${ghostId}`);
    
    // Enviar comando para deshabilitar este control
    this.notifyRenderer('disable-controller', { controllerId: ghostId });
    
    // Actualizar estado
    const ghost = this.ghostControllers.get(ghostId);
    if (ghost) {
      ghost.autoDisabled = true;
      ghost.disabledAt = new Date().toISOString();
    }
  }

  // Habilitar control manualmente (override)
  enableController(controllerId) {
    if (this.ghostControllers.has(controllerId)) {
      const ghost = this.ghostControllers.get(controllerId);
      ghost.autoDisabled = false;
      ghost.manuallyEnabled = true;
      ghost.enabledAt = new Date().toISOString();
      
      console.log(`✅ Controller ${controllerId} manually re-enabled`);
      this.notifyRenderer('controller-enabled', { controllerId });
      
      return true;
    }
    return false;
  }

  // Notificar al renderer
  notifyRenderer(event, data) {
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send(event, data);
    }
  }

  // Obtener historial de detecciones
  getDetectionHistory(limit = 50) {
    return this.detectionHistory.slice(-limit);
  }

  // Obtener fantasmas activos
  getActiveGhosts() {
    return Array.from(this.ghostControllers.entries())
      .filter(([_, data]) => data.autoDisabled)
      .map(([id, data]) => ({ id, ...data }));
  }

  // Configurar sensibilidad
  setSensitivity(value) {
    this.sensitivity = Math.max(0.1, Math.min(1.0, value));
  }

  // Limpiar historial
  clearHistory() {
    this.detectionHistory = [];
    this.ghostControllers.clear();
    console.log('🧹 Ghost detection history cleared');
  }
}

// Instancia global
const ghostDetector = new GhostDetector();

// IPC Handlers para comunicación con renderer
ipcMain.handle('ghost-detector:enable', (event, enabled) => {
  ghostDetector.isEnabled = enabled;
  return { success: true, enabled };
});

ipcMain.handle('ghost-detector:set-sensitivity', (event, sensitivity) => {
  ghostDetector.setSensitivity(sensitivity);
  return { success: true, sensitivity: ghostDetector.sensitivity };
});

ipcMain.handle('ghost-detector:analyze', (event, controllerId, inputs) => {
  return ghostDetector.analyzeInputs(controllerId, inputs);
});

ipcMain.handle('ghost-detector:enable-controller', (event, controllerId) => {
  return ghostDetector.enableController(controllerId);
});

ipcMain.handle('ghost-detector:get-history', (event) => {
  return ghostDetector.getDetectionHistory();
});

ipcMain.handle('ghost-detector:get-active', (event) => {
  return ghostDetector.getActiveGhosts();
});

ipcMain.handle('ghost-detector:clear-history', (event) => {
  ghostDetector.clearHistory();
  return { success: true };
});

module.exports = ghostDetector;
// ============================================
// XINPUT SLOT MANAGER - BACKEND CORREGIDO
// ============================================

const { powerMonitor } = require('electron');

// Estado global de slots
let xinputSlots = {
  slot1: null,
  slot2: null,
  slot3: null,
  slot4: null
};

// Cache de información de controles
let controllerCache = new Map();

// Polling activo de gamepads
let gamepadPollingActive = false;
let lastGamepadsState = [];

// ============================================
// DETECCIÓN DE CONTROLES - CORREGIDA
// ============================================

ipcMain.handle('xinput-get-slots', async (event) => {
  // El renderer nos enviará los gamepads porque solo están disponibles ahí
  return {
    slots: xinputSlots,
    ghosts: [],
    needsGamepads: true // Indicamos que necesitamos datos del renderer
  };
});

ipcMain.handle('xinput-update-from-renderer', async (event, gamepadsData) => {
  // Recibimos los gamepads del renderer y actualizamos nuestro estado
  
  const controllers = parseGamepadsData(gamepadsData);
  updateSlotAssignments(controllers);
  
  const ghosts = detectGhostControllers(controllers);
  
  return {
    slots: xinputSlots,
    ghosts: ghosts
  };
});

function parseGamepadsData(gamepadsData) {
  const controllers = [];
  
  if (!gamepadsData || !Array.isArray(gamepadsData)) {
    return controllers;
  }
  
  gamepadsData.forEach((gamepad, index) => {
    if (gamepad && gamepad.connected) {
      const controllerInfo = {
        index: index,
        id: gamepad.id,
        timestamp: gamepad.timestamp,
        axes: gamepad.axes ? gamepad.axes.length : 0,
        buttons: gamepad.buttons ? gamepad.buttons.length : 0,
        type: detectControllerType(gamepad.id),
        battery: null, // No disponible en Gamepad API
        isWired: detectConnectionType(gamepad.id),
        uniqueId: generateUniqueId(gamepad.id, index)
      };
      
      controllers.push(controllerInfo);
      
      // Actualizar caché
      const cached = controllerCache.get(controllerInfo.uniqueId);
      if (cached) {
        cached.lastSeen = Date.now();
        controllerCache.set(controllerInfo.uniqueId, cached);
      } else {
        controllerCache.set(controllerInfo.uniqueId, {
          ...controllerInfo,
          firstSeen: Date.now(),
          lastSeen: Date.now()
        });
      }
    }
  });
  
  return controllers;
}

function detectControllerType(id) {
  const idLower = id.toLowerCase();
  
  // Xbox
  if (idLower.includes('xbox') || idLower.includes('xinput') || idLower.includes('045e')) {
    if (idLower.includes('elite')) return 'Xbox Elite';
    if (idLower.includes('series')) return 'Xbox Series X/S';
    return 'Xbox 360/One';
  }
  
  // PlayStation
  if (idLower.includes('dualsense') || idLower.includes('054c-0ce6')) {
    return 'PS5 DualSense';
  }
  if (idLower.includes('dualshock') || idLower.includes('ps4') || idLower.includes('054c-09cc') || idLower.includes('054c-05c4')) {
    return 'PS4 DualShock 4';
  }
  if (idLower.includes('054c-0268')) {
    return 'PS3 DualShock 3';
  }
  
  // Nintendo
  if (idLower.includes('pro controller') || idLower.includes('057e-2009')) {
    return 'Switch Pro Controller';
  }
  if (idLower.includes('joy-con') || idLower.includes('057e-2006') || idLower.includes('057e-2007')) {
    return 'Switch Joy-Con';
  }
  
  // Genéricos comunes
  if (idLower.includes('logitech')) {
    return 'Logitech Gamepad';
  }
  if (idLower.includes('8bitdo')) {
    return '8BitDo Controller';
  }
  
  // Genéricos por ID de fabricante
  if (idLower.includes('0079')) return 'DragonRise Gamepad';
  if (idLower.includes('0e8f')) return 'GreenAsia Gamepad';
  if (idLower.includes('0810')) return 'Personal Communication Systems';
  
  return 'Control Genérico';
}

function detectConnectionType(id) {
  const idLower = id.toLowerCase();
  // Si menciona wireless, bluetooth = inalámbrico
  if (idLower.includes('wireless') || idLower.includes('bluetooth')) {
    return false; // inalámbrico
  }
  return true; // asumimos cable por defecto
}

function generateUniqueId(id, index) {
  // Genera ID único más robusto
  const idHash = simpleHash(id);
  return `ctrl_${idHash}_${index}`;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

// ============================================
// GESTIÓN DE SLOTS
// ============================================

function updateSlotAssignments(controllers) {
  // Limpiar slots de controllers que ya no existen
  const currentUniqueIds = controllers.map(c => c.uniqueId);
  
  for (let i = 1; i <= 4; i++) {
    const slotKey = `slot${i}`;
    if (xinputSlots[slotKey] && !currentUniqueIds.includes(xinputSlots[slotKey].uniqueId)) {
      xinputSlots[slotKey] = null;
    }
  }
  
  // Asignar controles a slots
  controllers.forEach((controller) => {
    const cached = controllerCache.get(controller.uniqueId);
    
    if (cached && cached.assignedSlot) {
      // Usar slot previamente asignado
      const slotKey = `slot${cached.assignedSlot}`;
      if (!xinputSlots[slotKey] || xinputSlots[slotKey].uniqueId === controller.uniqueId) {
        xinputSlots[slotKey] = controller;
      }
    } else {
      // Asignar a primer slot disponible
      for (let i = 1; i <= 4; i++) {
        const slotKey = `slot${i}`;
        if (!xinputSlots[slotKey]) {
          xinputSlots[slotKey] = controller;
          
          // Actualizar caché
          if (cached) {
            cached.assignedSlot = i;
          } else {
            controllerCache.set(controller.uniqueId, {
              ...controller,
              assignedSlot: i,
              firstSeen: Date.now(),
              lastSeen: Date.now()
            });
          }
          break;
        }
      }
    }
  });
}

function detectGhostControllers(controllers) {
  const ghosts = [];
  
  // Detectar duplicados por ID similar
  const seenIds = new Map();
  
  controllers.forEach((ctrl) => {
    const baseId = ctrl.id.toLowerCase().replace(/\s+/g, '');
    
    if (seenIds.has(baseId)) {
      const original = seenIds.get(baseId);
      ghosts.push({
        original: original,
        ghost: ctrl,
        confidence: 0.9
      });
    } else {
      seenIds.set(baseId, ctrl);
    }
  });
  
  return ghosts;
}

// ============================================
// ACCIONES
// ============================================

ipcMain.handle('xinput-reassign-slot', async (event, controllerUniqueId, newSlot) => {
  const cached = controllerCache.get(controllerUniqueId);
  
  if (!cached) {
    return { success: false, error: 'Control no encontrado' };
  }
  
  if (newSlot < 1 || newSlot > 4) {
    return { success: false, error: 'Slot inválido' };
  }
  
  const slotKey = `slot${newSlot}`;
  const currentOccupant = xinputSlots[slotKey];
  
  // Si hay ocupante, hacer swap
  if (currentOccupant && currentOccupant.uniqueId !== controllerUniqueId) {
    const oldSlot = cached.assignedSlot;
    
    if (oldSlot) {
      const oldSlotKey = `slot${oldSlot}`;
      
      // Swap
      const temp = xinputSlots[slotKey];
      xinputSlots[slotKey] = xinputSlots[oldSlotKey];
      xinputSlots[oldSlotKey] = temp;
      
      // Actualizar caché del ocupante
      const occupantCache = controllerCache.get(currentOccupant.uniqueId);
      if (occupantCache) {
        occupantCache.assignedSlot = oldSlot;
      }
    }
  }
  
  // Actualizar caché
  cached.assignedSlot = newSlot;
  controllerCache.set(controllerUniqueId, cached);
  
  return { success: true };
});

ipcMain.handle('xinput-clear-slot', async (event, slotNumber) => {
  const slotKey = `slot${slotNumber}`;
  const controller = xinputSlots[slotKey];
  
  if (controller) {
    const cached = controllerCache.get(controller.uniqueId);
    if (cached) {
      delete cached.assignedSlot;
    }
  }
  
  xinputSlots[slotKey] = null;
  return { success: true };
});

ipcMain.handle('xinput-disable-controller', async (event, controllerUniqueId) => {
  const cached = controllerCache.get(controllerUniqueId);
  
  if (cached) {
    cached.disabled = true;
    cached.disabledAt = Date.now();
    
    // Remover de slots
    for (let i = 1; i <= 4; i++) {
      const slotKey = `slot${i}`;
      if (xinputSlots[slotKey]?.uniqueId === controllerUniqueId) {
        xinputSlots[slotKey] = null;
      }
    }
    
    return { success: true };
  }
  
  return { success: false, error: 'Control no encontrado' };
});

// Exportar para testing
module.exports = {
  updateSlotAssignments,
  detectGhostControllers
};

const configPath=getConfigPath()
const appBasePath=getAppBasePath()
let config={
 games:[],
 settings:{controlMode:'gamepad',theme:'ps4',language:'es'},
 windowState:{width:1280,height:720,isFullscreen:true}
}
function loadConfig(){
 try{
  if(fs.existsSync(configPath)){
   const data=fs.readFileSync(configPath,'utf8')
   config=JSON.parse(data)
   console.log('Configuración cargada desde:',configPath)
  }else{
   saveConfig()
   console.log('Nueva configuración creada en:',configPath)
  }
 }catch(error){
  console.error('Error cargando configuración:',error)
  saveConfig()
 }
}
function saveConfig(){
 try{
  const data=JSON.stringify(config,null,2)
  fs.writeFileSync(configPath,data,'utf8')
  console.log('Configuración guardada en:',configPath)
  return true
 }catch(error){
  console.error('Error guardando configuración:',error)
  return false
 }
}
function toRelativePath(absolutePath){
 try{
  if(!absolutePath)return absolutePath
  if(absolutePath.startsWith('data:image/'))return absolutePath
  const relative=path.relative(appBasePath,absolutePath)
  if(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative))return relative
  return absolutePath
 }catch{return absolutePath}
}
function toAbsolutePath(relativePath){
 try{
  if(!relativePath)return relativePath
  if(path.isAbsolute(relativePath))return relativePath
  if(relativePath.startsWith('data:image/'))return relativePath
  return path.join(appBasePath,relativePath)
 }catch{return relativePath}
}
function ensureAppStructure(){
 const configDir=path.dirname(configPath)
 if(!fs.existsSync(configDir)){
  fs.mkdirSync(configDir,{recursive:true})
 }
}
ensureAppStructure()
loadConfig()
function createWindow(){
 mainWindow=new BrowserWindow({
  width:config.windowState.width,
  height:config.windowState.height,
  minWidth:1024,
  minHeight:600,
  frame:false,
  webPreferences:{
   nodeIntegration:false,
   contextIsolation:true,
   preload:path.join(__dirname,'preload.js'),
   webSecurity:false,
   allowRunningInsecureContent:true,
   enableRemoteModule:false,
   sandbox:false,
   nodeIntegrationInWorker:true,
   nodeIntegrationInSubFrames:true
  },
  show:false,
  backgroundColor:'#000000',
  fullscreen:config.windowState.isFullscreen,
  autoHideMenuBar:true
 })
 if(app.isPackaged){
  mainWindow.loadFile(path.join(__dirname,'index.html'))
 }else{
  mainWindow.loadFile('index.html')
 }
 mainWindow.once('ready-to-show',()=>{
  mainWindow.show()
  if(config.windowState.isFullscreen){mainWindow.setFullScreen(true)}
 })
 if(process.argv.includes('--dev')){mainWindow.webContents.openDevTools()}
 return mainWindow
}
app.whenReady().then(()=>{
 createWindow()
 app.on('activate',()=>{
  if(BrowserWindow.getAllWindows().length===0){createWindow()}
 })
})

app.on('window-all-closed',()=>{
 if(process.platform!=='darwin'){app.quit()}
})
ipcMain.handle('get-config',()=>{
 const configToSend={
  ...config,
  games:config.games.map(game=>({
   ...game,
   path:toAbsolutePath(game.path),
   cover:game.cover&&!game.cover.startsWith('data:image/')?toAbsolutePath(game.cover):game.cover,
   loadingImage:game.loadingImage&&!game.loadingImage.startsWith('data:image/')?toAbsolutePath(game.loadingImage):game.loadingImage
  }))
 }
 return configToSend
})

ipcMain.handle('save-config',(event,newConfig)=>{
 try{
  if(newConfig.games){
   newConfig.games=newConfig.games.map(game=>({
    ...game,
    path:toRelativePath(game.path),
    cover:game.cover&&!game.cover.startsWith('data:image/')?toRelativePath(game.cover):game.cover,
    loadingImage:game.loadingImage&&!game.loadingImage.startsWith('data:image/')?toRelativePath(game.loadingImage):game.loadingImage
   }))
  }
  if(newConfig.games)config.games=newConfig.games
  if(newConfig.settings)config.settings={...config.settings,...newConfig.settings}
  if(newConfig.windowState)config.windowState={...config.windowState,...newConfig.windowState}
  const saved=saveConfig()
  return{success:saved,message:saved?'Configuración guardada':'Error guardando'}
 }catch(error){return{success:false,error:error.message}}
})
ipcMain.handle('show-open-dialog',async(event,options)=>{
 const result=await dialog.showOpenDialog(mainWindow,{
  title:options?.title||'Seleccionar archivo',
  defaultPath:appBasePath,
  filters:options?.filters||[
   {name:'Ejecutables',extensions:['exe','lnk','bat']},
   {name:'Todos los archivos',extensions:['*']}
  ],
  properties:options?.properties||['openFile']
 })
 return result
})
ipcMain.handle('launch-program',async(event,program)=>{
 return new Promise((resolve)=>{
  try{
   const {exec}=require('child_process')
   const fs=require('fs')
   if(!program?.path){resolve({success:false,error:'Ruta no especificada'});return}
   const absolutePath=toAbsolutePath(program.path)
   if(!fs.existsSync(absolutePath)){resolve({success:false,error:'Archivo no encontrado: '+absolutePath});return}
   const isWindows=process.platform==='win32'
   const command=isWindows?`start "" "${absolutePath}"`:`"${absolutePath}"`
   exec(command,(error,stdout,stderr)=>{
    if(error){
     if(isWindows){
      try{
       const {spawn}=require('child_process')
       const gameProcess=spawn(absolutePath,[],{detached:true,stdio:'ignore',shell:true})
       gameProcess.unref()
       resolve({success:true,message:'Juego lanzado'})
      }catch(spawnError){resolve({success:false,error:spawnError.message})}
     }else{resolve({success:false,error:error.message})}
    }else{
     const gameIndex=config.games.findIndex(g=>g.id===program.id)
     if(gameIndex!==-1){
      config.games[gameIndex].lastPlayed=new Date().toISOString()
      config.games[gameIndex].playCount=(config.games[gameIndex].playCount||0)+1
      saveConfig()
     }
     resolve({success:true,message:'Juego lanzado exitosamente'})
    }
   })
  }catch(error){resolve({success:false,error:error.message})}
 })
})
ipcMain.handle('enter-fullscreen',()=>{
 if(mainWindow){
  mainWindow.setFullScreen(true)
  config.windowState.isFullscreen=true
  saveConfig()
  return{success:true}
 }
 return{success:false}
})
ipcMain.handle('restore-window',()=>{
 if(mainWindow){
  mainWindow.setFullScreen(false)
  mainWindow.show()
  mainWindow.focus()
  config.windowState.isFullscreen=false
  saveConfig()
  return{success:true}
 }
 return{success:false}
})
ipcMain.handle('minimize-window',()=>{
 if(mainWindow){mainWindow.minimize();return{success:true}}
 return{success:false}
})
ipcMain.handle('close-app',()=>{
 saveConfig()
 app.quit()
 return{success:true}
})
ipcMain.handle('get-system-info',()=>{
 return{
  platform:process.platform,
  arch:process.arch,
  electronVersion:process.versions.electron,
  appVersion:app.getVersion(),
  isPackaged:app.isPackaged,
  appPath:appBasePath
 }
})
ipcMain.handle('get-app-path',()=>{
 return{
  appPath:appBasePath,
  exePath:process.execPath,
  isPortable:true,
  isPackaged:app.isPackaged
 }
})
ipcMain.handle('check-path-exists',async(event,filePath)=>{
 try{
  const fs=require('fs')
  const path=require('path')
  if(!filePath){return{exists:false,error:'Ruta no especificada'}}
  const absolutePath=toAbsolutePath(filePath)
  const exists=fs.existsSync(absolutePath)
  return{exists:exists,absolutePath:absolutePath,message:exists?'Ruta válida':'Ruta no encontrada'}
 }catch(error){return{exists:false,error:error.message}}
})
app.on('before-quit',()=>{saveConfig()})