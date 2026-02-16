const {contextBridge,ipcRenderer}=require('electron')
contextBridge.exposeInMainWorld('psboxAPI',{
 getConfig:()=>ipcRenderer.invoke('get-config'),
 saveConfig:(config)=>ipcRenderer.invoke('save-config',config),
 showOpenDialog:(options)=>ipcRenderer.invoke('show-open-dialog',options),
 launchProgram:(program)=>ipcRenderer.invoke('launch-program',program),
 checkPathExists:(filePath)=>ipcRenderer.invoke('check-path-exists',filePath),
 enterFullscreen:()=>ipcRenderer.invoke('enter-fullscreen'),
 restoreWindow:()=>ipcRenderer.invoke('restore-window'),
 minimizeWindow:()=>ipcRenderer.invoke('minimize-window'),
 closeApp:()=>ipcRenderer.invoke('close-app'),
 getSystemInfo:()=>ipcRenderer.invoke('get-system-info'),
 getAppPath:()=>ipcRenderer.invoke('get-app-path'),
 getConfigPath:()=>ipcRenderer.invoke('get-config-path'),
   // XInput Slot Manager
  xinputUpdateFromRenderer: (gamepadsData) => 
    ipcRenderer.invoke('xinput-update-from-renderer', gamepadsData),
  xinputReassignSlot: (controllerUniqueId, newSlot) => 
    ipcRenderer.invoke('xinput-reassign-slot', controllerUniqueId, newSlot),
  xinputClearSlot: (slotNumber) => 
    ipcRenderer.invoke('xinput-clear-slot', slotNumber),
  xinputDisableController: (controllerUniqueId) => 
    ipcRenderer.invoke('xinput-disable-controller', controllerUniqueId),
  // Ghost Detection
  onGhostDetected: (callback) => ipcRenderer.on('ghost-detected', (_, data) => callback(data)),
  onControllerDisabled: (callback) => ipcRenderer.on('disable-controller', (_, data) => callback(data)),
  onControllerEnabled: (callback) => ipcRenderer.on('controller-enabled', (_, data) => callback(data)),
  
  setGhostAutoDisable: (enabled) => ipcRenderer.invoke('ghost-detector:enable', enabled),
  setGhostSensitivity: (sensitivity) => ipcRenderer.invoke('ghost-detector:set-sensitivity', sensitivity),
  analyzeGhostInputs: (controllerId, inputs) => ipcRenderer.invoke('ghost-detector:analyze', controllerId, inputs),
  enableGhostController: (controllerId) => ipcRenderer.invoke('ghost-detector:enable-controller', controllerId),
  getGhostHistory: () => ipcRenderer.invoke('ghost-detector:get-history'),
  getActiveGhosts: () => ipcRenderer.invoke('ghost-detector:get-active'),
  clearGhostHistory: () => ipcRenderer.invoke('ghost-detector:clear-history'),
  // Controller Test Lab
  onTestLabSample: (callback) => ipcRenderer.on('test-lab-sample', (_, data) => callback(data)),
  onTestLabResults: (callback) => ipcRenderer.on('test-lab-results', (_, data) => callback(data)),
  
  startTestLab: (controllerId, controllerData) => 
    ipcRenderer.invoke('test-lab:start', controllerId, controllerData),
  
  stopTestLab: (controllerId) => 
    ipcRenderer.invoke('test-lab:stop', controllerId),
  
  getTestLabActive: (controllerId) => 
    ipcRenderer.invoke('test-lab:get-active', controllerId),
  
  getTestLabHistory: () => 
    ipcRenderer.invoke('test-lab:get-history'),
  
  exportTestResults: (testId, format) => 
    ipcRenderer.invoke('test-lab:export', testId, format),
})
contextBridge.exposeInMainWorld('appInfo',{
 platform:process.platform,
 isDev:process.argv.includes('--dev'),
 isPackaged:require('electron').app.isPackaged
})
contextBridge.exposeInMainWorld('nodeModules',{
 path:require('path'),
 fs:require('fs'),
 child_process:require('child_process')
})