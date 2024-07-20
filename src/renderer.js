document.addEventListener('DOMContentLoaded', () => {
  // BASELINE DECLARATIONS
  const panel1 = document.getElementById('panel1');
  const panel2 = document.getElementById('panel2');
  const panel3 = document.getElementById('panel3');

  const fileNameInput = document.getElementById('fileNameInput');
  const locationInput = document.getElementById('locationInput');
  const runButton = document.getElementById('runButton');
  const cancelButton = document.getElementById('cancelButton');
  const debugButton = document.getElementById('debugButton');
  const selectFileButton = document.getElementById('selectFileButton');
  const selectFolderButton = document.getElementById('selectFolderButton');
  const progressBar = document.getElementById('progressBar');
  const stateLabel = document.getElementById('stateLabel');
  const progressLabel = document.getElementById('progressLabel');
  const browseButton = document.getElementById('browseButton');
  const modal = document.getElementById('errorModal');
  modal.style.display = 'none';

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  // ipc-auth
  const token = "vidcat";
  const token2 = "vidcat";

  // prevents output path text box from being able to detect drag and drop for files
  // without this, dropping a file in that text box immediately plays the video in a new window
  fileNameInput.addEventListener('dragenter', preventDefaultBehavior);
  fileNameInput.addEventListener('dragover', preventDefaultBehavior);
  fileNameInput.addEventListener('dragleave', preventDefaultBehavior);
  fileNameInput.addEventListener('drop', preventDefaultBehavior);
  locationInput.addEventListener('dragenter', preventDefaultBehavior);
  locationInput.addEventListener('dragover', preventDefaultBehavior);
  locationInput.addEventListener('dragleave', preventDefaultBehavior);
  locationInput.addEventListener('drop', preventDefaultBehavior);

  // start by using $dateTime as default output value for .mp4
  function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  // set output defaults
  locationInput.value = `/output/`;
  fileNameInput.value = `${getCurrentDateTime()}.mp4`;
  defaultOutputPath = locationInput.value + fileNameInput.value;
  progressLabel.textContent = "0%";

  // Declare Core variable in the proper scope
  let Core;

  // GET Core
  async function initializeCore() {
    try {
      Core = await window.api.getCore(token);
      console.log('Initial Core in Renderer.js:', Core);
      Core.outputPath = defaultOutputPath;
      updateCore({ outputPath: Core.outputPath });
      updateOrderedList();
    } catch (error) {
      console.error('Error initializing Core:', error.message);
    }
  }

  initializeCore();

  // SET Core
  async function updateCore(newData) {
    Core = { ...Core, ...newData };
    await window.api.setCore(Core, token);
    console.log('Updated Core in Renderer.js:', Core);
  }

  function removeItem(index) {
    Core.fileList.splice(index, 1);
    updateCore({ fileList: Core.fileList });
    updateOrderedList();
  }

  async function progressLoop() {
    console.log("Progress Loop started.");
    while (Core.state !== "idle" && Core.state !== "cancelled") {
      // Update Core state and percentages
      Core.state = await window.api.getCoreState(token);
      // Core.outputPath = await window.api.getCoreOutputPath();
      const percentages = await window.api.getCorePercents(token);

      Core.percentageEncode = percentages.percentageEncode;
      Core.percentageConcat = percentages.percentageConcat;

      // contextualized percentage progress
      // encoding takes about 60% of run time and concat 40%
      // weighting the percentage progress values to display
      // progress more accurately as a whole. 
      encodePercentContext = parseFloat((Core.percentageEncode * 0.6).toFixed(2));
      concatPercentContext = parseFloat((Core.percentageConcat * 0.4).toFixed(2));

      // update state label
      if (Core.state == "running-encode") {
        stateLabel.textContent = "State: Encoding";
      } else if (Core.state == "running-concat") {
        if (Core.percentageConcat == 100) {
          stateLabel.textContent = "State: Complete";
          progressLabel.textContent = `Exported to: ${Core.outputPath}`;
        } else {
          stateLabel.textContent = "State: Concatenating";
        }
      }

      // Ensure the progress values are finite numbers
      if (Core.state == "running-encode") {
        console.log("entered ProgressLoop running-encode");
        if (Core.percentageEncode >= 0) {
          if (encodePercentContext > progressBar.value) {
            progressBar.value = encodePercentContext;
            progressLabel.textContent = `${encodePercentContext}%`;
          }
        }
        console.log("Progress bar value: ", progressBar.value);
      } else if (Core.state == "running-concat") {
        if (Core.percentageConcat >= 0) {
          progressBar.value = parseFloat((encodePercentContext + concatPercentContext).toFixed(2));
          progressLabel.textContent = `${progressBar.value}%`;
        }
        console.log("Progress bar value: ", progressBar.value);
      }

      // Wait for a short delay before the next iteration
      await delay(100);
    }

    // Reset progress bar when Core state is idle
    if (stateLabel.textContent == "State: Complete") {
      progressBar.value = 100;
    } else if (stateLabel.textContent == "State: Cancelled") {
      progressBar.value = 0;
    }

    console.log("Exiting progress loop");

  }

  // Panel 3: Browse Button press
  browseButton.addEventListener('click', async () => {
    try {
      const folder = await window.api.selectFolder(token);
      if (folder) {
        if (isPathSafe(folder)) {
          locationInput.value = folder + "/";
        }
        else {
          showErrorModal("Cannot write to a protected directory");
        }

      }
    } catch (error) {
      console.error('Error selecting folder:', error.message);
    }
  })

  // PANEL 3: Handle runButton press
  runButton.addEventListener('click', async () => {
    if (Core.state !== "running-encode" && Core.state !== "running-concat") {
      const files = Core.fileList;

      const outputPath = locationInput.value + fileNameInput.value;
      Core.outputPath = outputPath;

      console.log(`Files: ${JSON.stringify(files)}`);
      console.log(`Output path: ${outputPath}`);

      if (!outputPath) {
        console.error('Output path is not set');
        return;
      }

      if (files.length < 2) {
        console.error('Not enough files defined');
        alert("Less than two filepaths defined!");
        return;
      }


      try {
        Core.state = "running-encode";
        Core.percentageConcat = 0;
        Core.percentageEncode = 0;
        progressBar.value = 0;
        progressLabel.textContent = `${Core.percentageEncode}%`;
        stateLabel.textContent = "State: Initializing";

        await updateCore({ state: Core.state });
        // Start the progress loop
        progressLoop();
        const result = await window.api.concatVideos(files, outputPath, token);

        console.log(result);
        Core.state = await window.api.getCoreState(token);
        console.log("Core State (Renderer): ", Core.state);
      } catch (error) {
        console.error(error);
      }
      if (Core.state == "idle") {
        stateLabel.textContent = "State: Complete";
        if (Core.outputPath.startsWith('C:\\') || Core.outputPath.startsWith('~')) {
          progressLabel.textContent = `Exported to: ${Core.outputPath}`;
        } else {
          progressLabel.textContent = `Exported to: ...${Core.outputPath}`;
        }

      } else if (Core.state == "cancelled") {
        stateLabel.textContent = "State: Cancelled";
        progressLabel.textContent = "0%";
        Core.state = "idle";
        await updateCore({ state: Core.state });
      }
    } else {
      alert("vidCat already running!");
    }
  });

  // PANEL 3: Handle cancelButton press
  cancelButton.addEventListener('click', async () => {
    console.log("cancelButton eventListener called");
    if (Core.state == 'running-encode' || Core.state == 'running-concat') {
      console.log('Cancel button pressed during "running"');
      try {
        const cancel = await window.api.cancelConcat(token);
        if (cancel) {
          console.log('Cancellation success!');

          Core.state = "cancelled";
          await updateCore({ state: Core.state });
          stateLabel.textContent = "State: Cancelled"
          progressLabel.textContent = "0%";

          // Additional logic if needed on successful cancellation
        } else {
          console.error('Cancel failed!');
        }
      } catch (error) {
        console.error('Error during cancellation:', error.message);
      }
    } else {
      console.log('Cancel button pressed while not "running"');
    }

    Core.state = await window.api.getCoreState(token);
    console.log("Core State (Renderer): ", Core.state);
  });

  // Panel 3 debug button for testing
  debugButton.addEventListener('click', async () => {
    console.log("Core in Renderer: ", Core);
    console.log("fileNameInput: ", fileNameInput.value);
    console.log("locationInput: ", locationInput.value);
    await window.api.printCore(token);
  });


  //* **************************************** *//
  //         PANEL 1: DRAG AND DROP AREA        //
  //* **************************************** *//

  // DRAGGED OVER, NO DROP
  panel1.addEventListener('dragover', (event) => {
    console.log("panel 1: dragover event fired");
    event.preventDefault();
    panel1.style.borderColor = '#00f'; // Change border color to indicate valid drop zone
  });

  // NO DROP, DRAGGED AWAY
  panel1.addEventListener('dragleave', () => {
    console.log("panel 1: dragleave event fired");
    panel1.style.borderColor = '#ccc'; // Revert border color when not dragging over
  });

  // DROPPED FILE PATH
  panel1.addEventListener('drop', async (event) => {

    console.log("panel 1: drop event fired");
    event.preventDefault();

    panel1.style.borderColor = '#ccc'; // Revert border color on drop

    const files = event.dataTransfer.files; // What did they drop?

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const filePath = files[i].path;

        if (isPathSafe(filePath)) {
          try {
            const stats = await window.api.getStats(filePath, token);

            if (stats.isDirectory) {
              // If it's a directory, query all files in the directory
              const newFiles = await window.api.queryFiles(filePath, ['.mp4'], token); // Adjust formats as needed
              newFiles.forEach(file => {
                if (!Core.fileList.includes(file)) { // Avoid duplicate entries
                  Core.fileList.push(file);
                }
              });
            } else if (stats.isFile) {
              // If it's a file, directly add the file to Core.fileList
              if (!Core.fileList.includes(filePath)) { // Avoid duplicate entries
                Core.fileList.push(filePath);
              }
            }

            await updateCore({ fileList: Core.fileList });
            updateOrderedList();    // update Panel 2
          } catch (error) {
            console.error('Error querying files:', error.message);
          }
        } else {
          showErrorModal("Cannot import file from a protected directory");
        }
      }
    }
  });

  const protectedDirectories = [
    "\\",
    "C:\\Windows",
    "C:\\Recovery",
    "C:\\Program Files",
    "C:\\Program Files (x86)",
    "C:\\AMD",
    "C:\\Nvidia",
    "/System",
    "/Library"
  ]

  function isPathSafe(filePath) {
    // Check if the filePath starts with any protected directory
    if (protectedDirectories.some(dir => filePath.startsWith(dir))) {
      return false;
    }
    // Additional check to prevent selecting C drive
    if (filePath === "C:\\") {
      return false;
    }
    return true;
  }

  function showErrorModal(message) {
    const modal = document.getElementById('errorModal');
    const messageElement = modal.querySelector('.modal-message');
    messageElement.textContent = message;
    modal.style.display = 'block';

    // Close modal on clicking close button
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    const okButton = modal.querySelector('#okButton');
    okButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  // SELECT FILE BUTTON
  selectFileButton.addEventListener('click', async () => {
    try {
      const file = await window.api.selectFile(token);
      if (file) {
        console.log("Selected file:", file);
        if (isPathSafe(file)) {
          Core.fileList.push(file);
          await updateCore({ fileList: Core.fileList });
          updateOrderedList();
        } else {
          showErrorModal("Cannot import file from a protected directory")
        }
      }
    } catch (error) {
      console.error('Error selecting file:', error.message);
    }
  });

  // SELECT FOLDER BUTTON
  selectFolderButton.addEventListener('click', async () => {
    try {

      const folder = await window.api.selectFolder(token);
      if (folder) {
        console.log("Selected folder: ", folder);
        if (isPathSafe(folder)) {
          const newFiles = await window.api.queryFiles(folder, ['.mp4'], token);
          newFiles.forEach(file => {
            if (!Core.fileList.includes(file)) {
              Core.fileList.push(file);
            }
          });
          await updateCore({ fileList: Core.fileList });
          updateOrderedList();
        } else {
          showErrorModal("Cannot import files from a protected directory")
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error.message);
    }
  })

  // Prevent dragover and drop events for the output path text box
  function preventDefaultBehavior(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  //* **************************************** *//
  //         PANEL 2: ORDERED LIST              //
  //* **************************************** *//

  // PANEL 2: Update HTML element with fileList
  function updateOrderedList() {
    const orderedList = document.getElementById('ordered_list');
    orderedList.innerHTML = ''; // Clear existing list items

    // iterate through each file of Core.fileList
    Core.fileList.forEach((filePath, index) => {
      // create a list item for each file of Core.fileList
      const li = document.createElement('li');
      li.classList.add('list-item');
      li.draggable = true;
      li.dataset.index = index;

      // Prevent default behavior for drag events on li elements
      li.addEventListener('dragenter', preventDefaultBehavior);
      li.addEventListener('dragover', preventDefaultBehavior);
      li.addEventListener('dragleave', preventDefaultBehavior);
      li.addEventListener('drop', preventDefaultBehavior);

      // create an item to be added to the ordered list
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('item-block');
      itemDiv.title = filePath; // Add title attribute for tooltip

      // create string for item name to parse
      const itemName = document.createElement('span');
      itemName.classList.add('item-name');

      const displayPath = filePath.replace(/^.*[\\\/]/, ''); // Regex to pull filename
      const pathParts = filePath.split(/[\\\/]/);            // Regex to split filepath into directories
      const lastDir = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';  // pull last directory of filepath
      itemName.textContent = `.../${lastDir}/${displayPath}`;   // declare "...\$lastDir\$filename"


      // declare delete button for item block
      const deleteButton = document.createElement('button');
      deleteButton.classList.add('delete-button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        removeItem(index);
      });

      // add itemName and deleteButton to item block
      itemDiv.appendChild(itemName);
      itemDiv.appendChild(deleteButton);
      li.appendChild(itemDiv);
      orderedList.appendChild(li);

      // Add drag and drop event listeners to li elements
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('dragend', handleDragEnd);
    });
  }

  // prevent default behavior for ordered list items
  function preventDefaultBehavior(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  //* **************************************** *//
  //         PANEL 2: ITEM BLOCKS               //
  //* **************************************** *//

  // declare drag scroll variable
  let dragSrcEl = null;

  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault(); // Necessary. Allows us to drop.
    }
    e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation(); // Stops some browsers from redirecting.
    }

    // Don't do anything if dropping the same column we're dragging.
    if (dragSrcEl !== this) {
      const dragSrcIndex = parseInt(dragSrcEl.dataset.index);
      const dropTargetIndex = parseInt(this.dataset.index);

      // Swap the items in Core.fileList
      const temp = Core.fileList[dragSrcIndex];
      Core.fileList[dragSrcIndex] = Core.fileList[dropTargetIndex];
      Core.fileList[dropTargetIndex] = temp;

      // Update the data-index attributes
      const allItems = document.querySelectorAll('#ordered_list .list-item');
      allItems.forEach((item, index) => {
        item.dataset.index = index;
      });

      // Re-render the ordered list
      updateCore({ fileList: Core.fileList }).then(() => {
        updateOrderedList();
      });
    }
    return false;
  }

  function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('#ordered_list .list-item').forEach(item => {
      item.classList.remove('dragging');
    });
  }
});
