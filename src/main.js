// main.js (node layer)
// test

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');                     // needed to query file system
const { homedir } = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const tokenAuth = "vidcat"

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

//* **************************************** *//
//                   CORE                     //
//* **************************************** *//
let Core = {
  state: "idle",
  fileList: [],
  outputPath: "",
  percentageEncode: 0,
  percentageConcat: 0,
  ffmpegProcess: null, // Store the ffmpeg encode here
  encodingProcesses: [],
};

//* **************************************** *//
//             WINDOW LAUNCH                  //
//* **************************************** *//

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frameless: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true
    }
  });
  splashWindow.loadFile('src/splash.html');

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'src/preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile('src/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createSplashWindow();
  setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
    }
    createMainWindow();
  }, 1500); // Splash Duration Time
});

app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  app.quit();
  // }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});


//* **************************************** *//
//             MAIN.JS HELP FUNCTIONS         //
//* **************************************** *//

// getAllFiles:
// Renderer.js.Panel1 -> IPC.query-files() -> main.js.getAllFiles()
// Recursive Function
function getAllFiles(dirPath, formats, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // recurse here
      arrayOfFiles = getAllFiles(fullPath, formats, arrayOfFiles);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (formats.includes(ext)) {
        // add to array
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// resolve homeDir
function resolveHome(filepath) {
  if (filepath.startsWith('~')) {
    return path.join(homedir(), filepath.slice(1));
  }
  return filepath;
}

// resolve Relative Path
function resolveRelativePath(filepath) {
  if (filepath.startsWith('/') && !filepath.startsWith('/Users')) {
    const resolvedPath = path.resolve(process.cwd(), `.${filepath}`);
    const directory = path.dirname(resolvedPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    return resolvedPath;
  }
  return filepath;
}

// ensure directory existence
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}


// try to delete a given file repeatedly
async function deleteFileWithRetry(filePath, retries = 5, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log("tempDirCleanup: attempting delete of: ", filePath);
      fs.unlinkSync(filePath);
      return;
    } catch (err) {
      if (err.code === 'EBUSY' && i < retries - 1) {
        console.warn(`File ${filePath} is busy, retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        console.error(`Error deleting file ${filePath}: ${err.message}`);
        return;
      }
    }
  }
}

// clean up temp dir
async function cleanUpTempDir() {
  const tempDir = path.resolve('./tempDir');
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      await deleteFileWithRetry(filePath);
    }
  }
}

//* **************************************** *//
//                IPC ROUTES                  //
//* **************************************** *//

// query-files
// Renderer.js.Panel1 -> IPC.query-files() -> main.js.getAllFiles()
// calls getAllFiles() function, returns an array of strings. 
ipcMain.handle('query-files', async (event, dirPath, formats, token) => {
  if (token == tokenAuth) {
    console.log("Valid request");
    try {
      const files = getAllFiles(dirPath, formats);
      return files;
    } catch (error) {
      throw new Error('Failed to read directory contents: ' + error.message);
    }
  } else {
    console.error("Invalid request");
  }
});

// get-core
// Renderer.js -> IPC.get-core() -> main.js.Core
// reads property "Core" from main. Returns Core object.
ipcMain.handle('get-core', async (event, token) => {
  if (token == tokenAuth) {
    console.log("Valid request");
    console.log('Core in main process:', Core);
    return Core;
  } else {
    console.error("Invalid request");
  }
});

// get-core-state
// Renderer.js -> IPC.get-core-state()
// Reads only the state of "Core" from main.
// Necessary because get-core cannot return complex properties like encoded files
ipcMain.handle('get-core-state', async (event, token) => {
  if (token == tokenAuth) {
    return Core.state;
  } else {
    console.error("Invalid request!!");
  }
});

// get-core-percents
// Renderer.js -> IPC.get-core-percents()
// Reads the percents of "Core" from main.
ipcMain.handle('get-core-percents', async () => {
  return {
    percentageEncode: Core.percentageEncode,
    percentageConcat: Core.percentageConcat
  };
});

// get-core-outputPath
// Renderer.js -> IPC.get-core-outputpath()
// Reads the (likely disambiguated) output path from main
ipcMain.handle('get-core-outputpath', async () => {
  return Core.outputPath;
});

// set-core
// Renderer.js -> IPC.set-core() -> main.js.Core
// writes status of Core struct from renderer.js to main.js
ipcMain.handle('set-core', async (event, newCore, token) => {
  if (token == tokenAuth) {
    Core = { ...Core, ...newCore };
    console.log('Updated Core in main process:', Core);
  } else {
    console.error("Invalid request");
  }
});

// get-stats
// Renderer.js.Panel1 -> IPC.get-stats() -> main.js()
// renderer.js needs to us 'fs' library in order to read file properties
ipcMain.handle('get-stats', async (event, filePath, token) => {
  if (token == tokenAuth) {
    try {
      const stats = fs.statSync(filePath);
      return {
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };
    } catch (error) {
      throw new Error('Failed to get file stats: ' + error.message);
    }
  } else {
    console.error("Invalid request");
  }
});

// concat-videos
// Renderer.js.Panel3 -> IPC.concat-videos() -> ffmpeg
// Calls ffmpeg concat execution
ipcMain.handle('concat-videos', async (event, files, outputPath, token) => {
  if (token == tokenAuth) {
    console.log("Valid request");
    // Variables to store progress information
    let encodeProgress = {}; // Object to store encoding progress
    let concatProgress = {}; // Object to store concatenation progress

    // Handle ambiguous filepath
    if (Core.outputPath.startsWith('~')) {
      Core.outputPath = resolveHome(Core.outputPath);
    } else if (Core.outputPath.startsWith('/')) {
      Core.outputPath = resolveRelativePath(Core.outputPath);
    }
    // if folder for output doesn't exist, create it
    ensureDirectoryExistence(Core.outputPath);

    outputPath = Core.outputPath;
    console.log("Disambiguated outputPath:", Core.outputPath);

    return new Promise((resolve, reject) => {
      console.log('Files:', files);
      console.log('Output Path:', outputPath);

      if (!Array.isArray(files) || files.length === 0) {
        return reject('No files provided');
      }

      if (typeof outputPath !== 'string' || outputPath.trim() === '') {
        return reject(new Error('Invalid output path'));
      }

      files.forEach(file => {
        if (typeof file !== 'string' || file.trim() === '') {
          return reject(new Error('Invalid file path'));
        }
      });

      if (!fs.existsSync('./tempDir')) {
        fs.mkdirSync('./tempDir');
      }

      const encodedFiles = files.map((file, index) => path.join('./tempDir', `encoded${index}.mp4`));

      // Re-encode all files to the same format and resolution
      const encodeFile = (file, index) => {
        return new Promise((resolve, reject) => {
          const process = ffmpeg(file)
            .outputOptions([
              '-c:v libx264',
              '-c:a aac',
              '-b:a 192k',
              '-s 1280x720' // Adjust resolution as needed
            ])
            .on('progress', progress => {
              if (progress.percent !== undefined) {
                encodeProgress[index] = { percent: (progress.percent).toFixed(2) };
                // console.log(encodeProgress[index]);
                Core.percentageEncode = encodeProgress[index].percent;
                console.log("Core percent Encode: ", Core.percentageEncode, "%");
              }
            })
            .on('end', () => {
              console.log(`Encoding complete for file: ${file}`);
              Core.encodingProcesses[index] = null;
              resolve(encodedFiles[index]);
            })
            .on('error', (err) => {
              console.error(`Error encoding ${file}: ${err.message}`);
              Core.encodingProcesses[index] = null;
              reject(`Error encoding ${file}: ${err.message}`);
            })
            .save(encodedFiles[index]);

          // Store the ffmpeg process for later cancellation
          Core.ffmpegProcess = process;
          Core.encodingProcesses[index] = process;
        });
      };

      // Encode all files sequentially
      Promise.all(files.map((file, index) => encodeFile(file, index)))
        .then(() => {
          const command = ffmpeg();

          encodedFiles.forEach(file => {
            command.input(file);
          });

          // Create the filter_complex string for concatenation
          const filterComplex = encodedFiles.map((_, index) => `[${index}:v][${index}:a]`).join('') + `concat=n=${encodedFiles.length}:v=1:a=1[outv][outa]`;

          command
            .complexFilter(filterComplex)
            .outputOptions('-map', '[outv]', '-map', '[outa]')
            .on('progress', progress => {
              if (progress.percent !== undefined) {
                concatProgress = { percent: (progress.percent / encodedFiles.length).toFixed(2) }; // Update concat progress
                Core.state = "running-concat";
                Core.percentageConcat = concatProgress.percent;
                console.log("Core percent Concat: ", Core.percentageConcat, "%");
              }
            })
            .on('end', () => {
              Core.state = "idle";
              Core.encodingProcesses = [];
              Core.ffmpegProcess = null;
              console.log(`Concatenation complete for file`);
              console.log("File written to: ", Core.outputPath);
              console.log("Core State (Main): ", Core.state);
              cleanUpTempDir();
              resolve('vidCat Complete!');
            })
            .on('error', (err) => {
              cleanUpTempDir();
              console.log(`Concatenation error for file`);
              reject(`Error: ${err.message}`);
            })
            .save(outputPath);

          // Store the ffmpeg process for later cancellation
          Core.ffmpegProcess = command;

          // Listen for SIGINT signal to cancel the ffmpeg process
          process.on('SIGINT', () => {
            if (Core.ffmpegProcess) {
              Core.ffmpegProcess.kill('SIGINT'); // Send SIGINT to terminate the process
              Core.ffmpegProcess = null; // Clear the ffmpeg process
            }
          });
        })
        .catch(err => reject(err));
    });
  } else {
    console.error("Invalid request");
  }
});

// Cancel video concatenation
ipcMain.handle('cancel-concat', async (event, token) => {
  if (token == tokenAuth) {
    console.log("cancel-concat called");
    Core.state = "idle";

    // Cancel all encoding processes
    Core.encodingProcesses.forEach(process => {
      if (process) {
        process.kill('SIGINT');
      }
    });
    Core.encodingProcesses = [];

    // Cancel concatenation process
    if (Core.ffmpegProcess) {
      Core.ffmpegProcess.kill('SIGINT'); // Send SIGINT to terminate the process
      Core.ffmpegProcess = null; // Clear the ffmpeg process
    }
    cleanUpTempDir();
    console.log("cancellation complete.");
    sleep(1000);
    Core.encodingProcesses = [];
    Core.percentageEncode = 0;
    Core.percentageConcat = 0;
    cleanUpTempDir();
    return 'FFmpeg process cancelled';

  } else {
    console.error("Invalid request");
  }
});

// select-file
// Renderer.js.Panel1 -> IPC.select-file()
// opens windows file select dialogue
ipcMain.handle('select-file', async (event, token) => {
  if (token == tokenAuth) {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Videos', extensions: ['mkv', 'avi', 'mp4', 'mov'] }
      ]
    });

    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  } else {
    console.error("Invalid request");
  }

});

// select-folder
// Renderer.js.Panel1 -> IPC.select-folder()
// opens windows file select dialogue
ipcMain.handle('select-folder', async (event, token) => {
  if (token == tokenAuth) {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });

    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  } else {
    console.error("Invalid request");
  }

});

// print core
// Renderer.js.Panel3.DebugButton -> IPC.print-core() -> output to console
ipcMain.handle('print-core', async (event, token) => {
  if (token == tokenAuth) {
    console.log("main core: ", Core);
  } else {
    console.error("Invalid request");
  }
})
