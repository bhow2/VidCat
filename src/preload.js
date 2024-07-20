const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  concatVideos: (files, outputPath, token) => ipcRenderer.invoke('concat-videos', files, outputPath, token),
  queryFiles: (dirPath, formats, token) => ipcRenderer.invoke('query-files', dirPath, formats, token),
  getCore: (token) => ipcRenderer.invoke('get-core', token),
  getCoreState: (token) => ipcRenderer.invoke('get-core-state', token),
  getCorePercents: (token) => ipcRenderer.invoke('get-core-percents', token),
  getCoreOutputPath: (token) => ipcRenderer.invoke('get-core-outputpath', token),
  printCore: (token) => ipcRenderer.invoke('print-core', token),
  setCore: (newCore, token) => ipcRenderer.invoke('set-core', newCore, token),
  getStats: (filePath, token) => ipcRenderer.invoke('get-stats', filePath, token),
  selectFile: (token) => ipcRenderer.invoke('select-file', token),
  selectFolder: (token) => ipcRenderer.invoke('select-folder', token, token),
  cancelConcat: (token) => ipcRenderer.invoke('cancel-concat', token) // Add cancelConcat function
});
