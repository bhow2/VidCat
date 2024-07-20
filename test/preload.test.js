const { contextBridge, ipcRenderer } = require('electron');

jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  ipcRenderer: {
    invoke: jest.fn(),
  },
}));

// Load the preload script
require('../src/preload.js');

describe('Preload script', () => {
  it('should expose the api in the main world', () => {
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith('api', expect.any(Object));
  });

  it('should expose concatVideos method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.concatVideos(['file1', 'file2'], 'outputPath', 'token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('concat-videos', ['file1', 'file2'], 'outputPath', 'token');
  });

  it('should expose queryFiles method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.queryFiles('dirPath', ['mp4'], 'token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('query-files', 'dirPath', ['mp4'], 'token');
  });

  // Add similar tests for all other exposed methods
  it('should expose getCore method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.getCore('token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-core', 'token');
  });

  it('should expose getCoreState method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.getCoreState('token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-core-state', 'token');
  });

  it('should expose getCorePercents method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.getCorePercents('token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-core-percents', 'token');
  });

  it('should expose getCoreOutputPath method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.getCoreOutputPath('token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-core-outputpath', 'token');
  });

  it('should expose printCore method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.printCore('token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('print-core', 'token');
  });

  it('should expose setCore method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.setCore('newCore', 'token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('set-core', 'newCore', 'token');
  });

  it('should expose getStats method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.getStats('filePath', 'token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-stats', 'filePath', 'token');
  });

  it('should expose selectFile method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.selectFile('token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('select-file', 'token');
  });

  it('should expose selectFolder method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.selectFolder('token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('select-folder', 'token', 'token');
  });

  it('should expose cancelConcat method', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.cancelConcat('token');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('cancel-concat', 'token');
  });
});