document.addEventListener('DOMContentLoaded', function() {
  const precisionSlider = document.getElementById('precisionSlider');
  const loopSlider = document.getElementById('loopSlider');
  const saveButton = document.getElementById('saveButton');
  const messageDiv = document.getElementById('messageDiv');
  const startShortcut = document.getElementById('startShortcut');
  const endShortcut = document.getElementById('endShortcut');
  const absoluteEndShortcut = document.getElementById('absoluteEndShortcut');
  const applyShortcut = document.getElementById('applyShortcut');

  // Detect OS for showing appropriate key symbols
  const isMac = navigator.userAgent.toLowerCase().includes('mac');
  
  // Define key symbols with proper encoding
  const keySymbols = {
    meta: isMac ? 'Cmd' : 'Ctrl',  // Using plain text instead of symbols
    shift: isMac ? 'Shift' : 'Shift',
    alt: isMac ? 'Option' : 'Alt',
  };

  // Default shortcuts. Identical copy used in content script.
  const defaultShortcuts = {
    start: {
      key: ',',
      modifiers: ['meta', 'shift']  // meta is Cmd on Mac, Ctrl on Windows
    },
    end: {
      key: '.',
      modifiers: ['meta', 'shift']
    },
    absoluteEnd: {
      key: ';',
      modifiers: ['meta', 'shift']
    },
    apply: {
      key: '\'',
      modifiers: ['meta', 'shift']
    }
  };

  shortcutNameMap = {
    'startShortcut':'start',
    'endShortcut':'end',
    'absoluteEndShortcut':'absoluteEnd',
    'applyShortcut':'apply'
  }
  shortcutAttrMap = {
    'startShortcut':o=>o.start,
    'endShortcut':o=>o.end,
    'absoluteEndShortcut':o=>o.absoluteEnd,
    'applyShortcut':o=>o.apply    
  }

  // Load initial values or defaults
  chrome.storage.sync.get({
    allowPrecision: true,
    loopDefault: false,
    shortcuts: defaultShortcuts
  }, function(items) {
    precisionSlider.value = items.allowPrecision ? 1 : 0;
    loopSlider.value = items.loopDefault ? 1 : 0;
    updateSliderColor(precisionSlider);
    updateSliderColor(loopSlider);
    updateSaveButtonState(false);

    // Display current shortcuts
    displayShortcut(startShortcut.querySelector('.shortcut-display'), items.shortcuts.start);
    displayShortcut(endShortcut.querySelector('.shortcut-display'), items.shortcuts.end);
    displayShortcut(absoluteEndShortcut.querySelector('.shortcut-display'), items.shortcuts.absoluteEnd);
    displayShortcut(applyShortcut.querySelector('.shortcut-display'), items.shortcuts.apply);
  });

  function displayShortcut(element, shortcut) {
    const modifierSymbols = shortcut.modifiers.map(mod => {
      return keySymbols[mod] || mod.charAt(0).toUpperCase() + mod.slice(1);
    });
    element.textContent = [...modifierSymbols, shortcut.key].join(' + ');
  }

  // Shortcut recording logic
  let isRecording = null;

  function startRecording(element) {
    if (isRecording) {
      isRecording.classList.remove('recording');
    }
    element.classList.add('recording');
    element.querySelector('.shortcut-display').textContent = 'Press keys...';
    isRecording = element;
    updateSaveButtonState(false);
  }

  function stopRecording() {
    if (isRecording) {
      isRecording.classList.remove('recording');
      isRecording = null;
    }
  }

  startShortcut.addEventListener('click', () => startRecording(startShortcut));
  endShortcut.addEventListener('click', () => startRecording(endShortcut));
  absoluteEndShortcut.addEventListener('click', () => startRecording(absoluteEndShortcut));
  applyShortcut.addEventListener('click', () => startRecording(applyShortcut));

  document.addEventListener('keydown', function(e) {
    if (!isRecording) return;

    if (e.key === 'Escape') {
      stopRecording();
      // Reload current shortcut
      chrome.storage.sync.get({shortcuts: defaultShortcuts}, function(items) {
        const shortcutType = shortcutNameMap[isRecording.id]; //isRecording.id === 'startShortcut') ? 'start' : 'end';
        displayShortcut(isRecording.querySelector('.shortcut-display'), items.shortcuts[shortcutType]);
      });
      return;
    }

    e.preventDefault();

    const modifiers = [];
    if ((isMac && e.metaKey) || (!isMac && e.ctrlKey)) modifiers.push('meta');
    if (e.shiftKey) modifiers.push('shift');
    if (e.altKey) modifiers.push('alt');

    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;

    // Only save if it's not just a modifier key
    if (!['Meta', 'Shift', 'Alt', 'Control'].includes(e.key)) {
      //const shortcutType = isRecording.id === 'startShortcut' ? 'start' : 'end';
      const newShortcut = { key, modifiers };

      // Update display
      displayShortcut(isRecording.querySelector('.shortcut-display'), newShortcut);

      // Store temporarily until save
      isRecording.dataset.pendingShortcut = JSON.stringify(newShortcut);

      stopRecording();
    }
  });

  // Rest of the code remains the same...
  saveButton.addEventListener('click', function() {
    const allowPrecision = precisionSlider.value === '1';
    const loopDefault = loopSlider.value === '1';

    chrome.storage.sync.get({shortcuts: defaultShortcuts}, function(items) {
      const shortcuts = items.shortcuts;

      // Reset any "Press keys..." messages before saving
      if (isRecording) {
        displayShortcut(isRecording.querySelector('.shortcut-display'), 
          shortcutAttrMap[isRecording.id](shortcuts));// isRecording.id === 'startShortcut' ? shortcuts.start : shortcuts.end);
        stopRecording();
      }

      if (startShortcut.dataset.pendingShortcut) {
        shortcuts.start = JSON.parse(startShortcut.dataset.pendingShortcut);
        delete startShortcut.dataset.pendingShortcut;
      }
      if (endShortcut.dataset.pendingShortcut) {
        shortcuts.end = JSON.parse(endShortcut.dataset.pendingShortcut);
        delete endShortcut.dataset.pendingShortcut;
      }
      if (absoluteEndShortcut.dataset.pendingShortcut) {
        shortcuts.absoluteEnd = JSON.parse(absoluteEndShortcut.dataset.pendingShortcut);
        delete absoluteEndShortcut.dataset.pendingShortcut;
      }
      if (applyShortcut.dataset.pendingShortcut) {
        shortcuts.apply = JSON.parse(applyShortcut.dataset.pendingShortcut);
        delete applyShortcut.dataset.pendingShortcut;
      }

      chrome.storage.sync.set({
        allowPrecision: allowPrecision,
        loopDefault: loopDefault,
        shortcuts: shortcuts
      }, function() {
        updateSaveButtonState(true);
        displayMessage("Refresh YouTube pages for the changes to reflect");
      });
    });
  });

  precisionSlider.addEventListener('input', () => {
    updateSliderColor(precisionSlider);
    updateSaveButtonState(false);
  });

  loopSlider.addEventListener('input', () => {
    updateSliderColor(loopSlider);
    updateSaveButtonState(false);
  });

  function updateSliderColor(slider) {
    slider.setAttribute('data-value', slider.value);
  }

  function updateSaveButtonState(isSaved) {
    if (isSaved) {
      saveButton.textContent = 'Saved';
      saveButton.disabled = true;
      saveButton.style.backgroundColor = '#ccc';
    } else {
      saveButton.textContent = 'Save';
      saveButton.disabled = false;
      saveButton.style.backgroundColor = '';
    }
  }

  function displayMessage(text) {
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    messageDiv.style.color = '#f47608ff';
    messageDiv.style.fontWeight = 'bold';
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }


});
