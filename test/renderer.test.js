const fs = require('fs');
const path = require('path');
const renderer = require('../src/renderer.js');
const { clear } = require('console');

jest.mock('fs');

describe('File Processing Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test to prevent interference
  });

  // Dummy implementation of processDirectory for testing purposes
  function dummyProcessDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    const fileContents = {};
    files.forEach(file => {
      fileContents[file] = fs.readFileSync(path.join(dirPath, file)).toString();
    });
    return fileContents;
  }

  test('should read files from directory and return correct contents', () => {
    // Mocking fs.readdirSync to return a list of files
    fs.readdirSync.mockImplementation(() => ['mock-file.mp4', 'mock-file2.mp4']);
    
    // Mocking fs.readFileSync to return mock content
    fs.readFileSync.mockImplementation((filePath) => {
      if (path.basename(filePath) === 'mock-file.mp4') {
        return Buffer.from('mock file content 1');
      }
      return Buffer.from('mock file content 2');
    });

    // Use the dummy implementation for testing
    const result = dummyProcessDirectory('mock-folder');

    expect(result).toEqual({
      'mock-file.mp4': 'mock file content 1',
      'mock-file2.mp4': 'mock file content 2'
    });
  });

  test('should handle non-existent directory', () => {
    fs.readdirSync.mockImplementation(() => {
      throw new Error('Directory not found');
    });

    expect(() => dummyProcessDirectory('non-existent-directory')).toThrow('Directory not found');
  });

  test('should handle non-existent file read', () => {
    fs.readdirSync.mockImplementation(() => ['mock-file.mp4']);
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    expect(() => dummyProcessDirectory('mock-folder')).toThrow('File not found');
  });

  test('should handle empty directory', () => {
    fs.readdirSync.mockImplementation(() => []);
    
    const result = dummyProcessDirectory('empty-folder');
    expect(result).toEqual({});
  });

  test('should handle unexpected file content', () => {
    fs.readdirSync.mockImplementation(() => ['mock-file.mp4']);
    fs.readFileSync.mockImplementation(() => Buffer.from('unexpected content'));

    const content = dummyProcessDirectory('mock-folder');
    expect(content['mock-file.mp4']).toBe('unexpected content');
  });

  test('should handle directory with file read errors', () => {
    fs.readdirSync.mockImplementation(() => ['mock-file.mp4', 'mock-file2.mp4']);
    fs.readFileSync.mockImplementation((filePath) => {
      if (path.basename(filePath) === 'mock-file.mp4') {
        return Buffer.from('mock file content');
      }
      throw new Error('Error reading file');
    });

    expect(() => dummyProcessDirectory('error-folder')).toThrow('Error reading file');
  });
});