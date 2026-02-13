// remote.js - Remote Control Module for 360 Scene Editor

const RemoteModule = (() => {
  // Available Font Awesome icons
  const ICONS = [
    { class: 'fas fa-sliders-h', name: 'Switch' },
    { class: 'fas fa-lightbulb', name: 'Light' },
    { class: 'fas fa-power-off', name: 'Power' },
    { class: 'fas fa-plug', name: 'Plug' },
    { class: 'fas fa-tv', name: 'TV' },
    { class: 'fas fa-fan', name: 'Fan' },
    { class: 'fas fa-thermometer-half', name: 'Thermometer' },
    { class: 'fas fa-lock', name: 'Lock' },
    { class: 'fas fa-unlock', name: 'Unlock' },
    { class: 'fas fa-door-open', name: 'Door' },
    { class: 'fas fa-window-maximize', name: 'Window' },
    { class: 'fas fa-bell', name: 'Bell' },
    { class: 'fas fa-camera', name: 'Camera' },
    { class: 'fas fa-music', name: 'Music' },
    { class: 'fas fa-volume-up', name: 'Volume' },
    { class: 'fas fa-robot', name: 'Robot' },
    { class: 'fas fa-gamepad', name: 'Gamepad' },
    { class: 'fas fa-desktop', name: 'Desktop' },
    { class: 'fas fa-laptop', name: 'Laptop' },
    { class: 'fas fa-mobile-alt', name: 'Phone' },
    { class: 'fas fa-tablet-alt', name: 'Tablet' },
    { class: 'fas fa-wifi', name: 'WiFi' },
    { class: 'fas fa-bluetooth', name: 'Bluetooth' },
    { class: 'fas fa-sun', name: 'Sun' },
    { class: 'fas fa-moon', name: 'Moon' },
    { class: 'fas fa-cloud', name: 'Cloud' },
    { class: 'fas fa-umbrella', name: 'Umbrella' },
    { class: 'fas fa-snowflake', name: 'Snow' },
    { class: 'fas fa-fire', name: 'Fire' },
    { class: 'fas fa-water', name: 'Water' },
    { class: 'fas fa-wind', name: 'Wind' },
    { class: 'fas fa-bolt', name: 'Bolt' },
    { class: 'fas fa-battery-full', name: 'Battery' }
  ];

  // Switches data - LOCAL to each remote instance
  const DEFAULT_SWITCHES = [
    { name: "Switch 1", icon: 'fas fa-sliders-h', entityId: "", active: false },
    { name: "Switch 2", icon: 'fas fa-lightbulb', entityId: "", active: false },
    { name: "Switch 3", icon: 'fas fa-power-off', entityId: "", active: false },
    { name: "Switch 4", icon: 'fas fa-plug', entityId: "", active: false },
    { name: "Switch 5", icon: 'fas fa-tv', entityId: "", active: false },
    { name: "Switch 6", icon: 'fas fa-fan', entityId: "", active: false }
  ];

  let instanceId = 1;
  let remotesData = new Map();
  let currentEditIndex = -1;
  let selectedIcon = 'fas fa-sliders-h';
  let currentRemoteId = null;

  // Create HTML structure for remote modal
  const createRemoteModal = (position, targetScene) => {
    const remoteId = `remote-${instanceId++}`;
    
    // Create switches for this remote
    const switches = JSON.parse(JSON.stringify(DEFAULT_SWITCHES));
    
    const container = document.createElement('div');
    container.className = 'remote-container';
    container.id = remoteId;
    container.dataset.position = JSON.stringify(position);
    container.dataset.targetScene = targetScene || '';
    
    container.innerHTML = `
      <!-- Main Button -->
      <button class="remote-main-button" id="${remoteId}-mainButton">
        <i class="fas fa-sliders-h"></i>
      </button>

      <!-- Main Switches Modal -->
      <div class="remote-modal" id="${remoteId}-switchModal">
        <div class="remote-modal-content">
          <button class="remote-close-btn" id="${remoteId}-closeModal">
            <i class="fas fa-times"></i>
          </button>
          <div class="remote-modal-title">Switch Panel</div>
          <div class="remote-switch-grid" id="${remoteId}-switchGrid">
            <!-- Switches will be dynamically added here -->
          </div>
        </div>
      </div>

      <!-- Edit Switch Modal -->
      <div class="remote-modal remote-edit-modal" id="${remoteId}-editModal">
        <div class="remote-modal-content">
          <button class="remote-close-btn" id="${remoteId}-closeEditModal">
            <i class="fas fa-times"></i>
          </button>
          <div class="remote-modal-title">Edit Switch</div>
          <form class="remote-edit-form" id="${remoteId}-editForm">
            <div class="remote-form-group">
              <label class="remote-form-label" for="${remoteId}-switchName">Switch Name (8 chars max)</label>
              <input type="text" class="remote-form-input" id="${remoteId}-switchName" maxlength="8" required>
            </div>
            <div class="remote-form-group">
              <label class="remote-form-label" for="${remoteId}-entityId">Entity ID</label>
              <input type="text" class="remote-form-input" id="${remoteId}-entityId" placeholder="light.bedroom" required>
              <div class="remote-form-note">Enter Home Assistant entity ID</div>
            </div>
            <div class="remote-form-group">
              <label class="remote-form-label">Select Icon</label>
              <div class="remote-icon-selection">
                <div class="remote-icon-grid" id="${remoteId}-iconGrid">
                  <!-- Icons will be dynamically added here -->
                </div>
              </div>
            </div>
            <div class="remote-form-actions">
              <button type="button" class="remote-form-btn cancel" id="${remoteId}-cancelEdit">Cancel</button>
              <button type="submit" class="remote-form-btn save">Save</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    
    // Store remote data
    remotesData.set(remoteId, {
      id: remoteId,
      position: position,
      targetScene: targetScene || '',
      switches: switches,
      active: false,
      container: container
    });
    
    // Initialize the modal
    initRemoteModal(remoteId);
    
    return remoteId;
  };

  // Initialize a remote modal
  const initRemoteModal = (remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    // Get DOM elements
    const modal = document.getElementById(`${remoteId}-switchModal`);
    const editModal = document.getElementById(`${remoteId}-editModal`);
    const switchGrid = document.getElementById(`${remoteId}-switchGrid`);
    const iconGrid = document.getElementById(`${remoteId}-iconGrid`);
    const mainButton = document.getElementById(`${remoteId}-mainButton`);
    const closeModalBtn = document.getElementById(`${remoteId}-closeModal`);
    const closeEditModal = document.getElementById(`${remoteId}-closeEditModal`);
    const cancelEditBtn = document.getElementById(`${remoteId}-cancelEdit`);
    const editForm = document.getElementById(`${remoteId}-editForm`);
    const switchNameInput = document.getElementById(`${remoteId}-switchName`);
    const entityIdInput = document.getElementById(`${remoteId}-entityId`);

    // Populate icon grid
    populateIconGrid(iconGrid);
    
    // Render switches
    renderSwitches(switchGrid, remoteData.switches, remoteId);

    // Setup event listeners
    setupEventListeners(remoteId, modal, editModal, mainButton, closeModalBtn, 
                       closeEditModal, cancelEditBtn, editForm, 
                       switchNameInput, entityIdInput, switchGrid, iconGrid, remoteData);
  };

  // Populate icon selection grid
  const populateIconGrid = (iconGridElement) => {
    if (!iconGridElement) return;
    
    iconGridElement.innerHTML = '';
    ICONS.forEach(icon => {
      const iconOption = document.createElement('div');
      iconOption.className = 'remote-icon-option';
      iconOption.dataset.icon = icon.class;

      const iconEl = document.createElement('i');
      iconEl.className = icon.class;

      const nameEl = document.createElement('div');
      nameEl.className = 'remote-icon-name';
      nameEl.textContent = icon.name;

      iconOption.appendChild(iconEl);
      iconOption.appendChild(nameEl);
      iconGridElement.appendChild(iconOption);

      iconOption.addEventListener('click', () => {
        document.querySelectorAll(`#${iconGridElement.id} .remote-icon-option`).forEach(opt => {
          opt.classList.remove('selected');
        });
        iconOption.classList.add('selected');
        selectedIcon = icon.class;
      });
    });
  };

  // Render switches
  const renderSwitches = (gridElement, switchesData, remoteId) => {
    if (!gridElement) return;
    
    gridElement.innerHTML = '';
    switchesData.forEach((sw, index) => {
      const switchItem = document.createElement('div');
      switchItem.className = 'remote-switch-item';

      const switchBtn = document.createElement('button');
      switchBtn.className = `remote-switch-button ${sw.active ? 'active' : ''}`;
      switchBtn.dataset.index = index;
      switchBtn.dataset.entityId = sw.entityId || '';

      const icon = document.createElement('i');
      icon.className = sw.icon;
      icon.style.color = sw.active ? '#FFC107' : '#333';

      switchBtn.appendChild(icon);

      const label = document.createElement('div');
      label.className = 'remote-switch-label';
      label.textContent = sw.name;

      switchItem.appendChild(switchBtn);
      switchItem.appendChild(label);
      gridElement.appendChild(switchItem);

      // Click event for toggle
      switchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSwitch(index, switchBtn, switchesData, remoteId);
      });

      // Long press for edit
      let pressTimer;
      
      switchBtn.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
          pressTimer = setTimeout(() => {
            openEditModal(index, remoteId);
          }, 1000);
        }
      });

      switchBtn.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
          clearTimeout(pressTimer);
        }
      });

      switchBtn.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
      });

      // Touch events
      let touchStartTime;
      
      switchBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartTime = Date.now();
      });

      switchBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touchDuration = Date.now() - touchStartTime;
        
        if (touchDuration >= 1000) {
          openEditModal(index, remoteId);
        }
      });
    });
  };

  // Setup event listeners for a remote modal
  const setupEventListeners = (remoteId, modal, editModal, mainButton, closeModalBtn, 
                             closeEditModal, cancelEditBtn, editForm, 
                             switchNameInput, entityIdInput, switchGrid, iconGrid, remoteData) => {
    
    if (!modal || !editModal || !mainButton || !closeModalBtn || !closeEditModal || !cancelEditBtn || !editForm) return;
    
    // Open main modal
    mainButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      modal.classList.add('show');
      mainButton.classList.add('active-main');
    });

    // Close main modal
    closeModalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modal.classList.remove('show');
      mainButton.classList.remove('active-main');
    });

    // Close edit modal
    const closeEditModalFunc = () => {
      editModal.classList.remove('show');
      currentEditIndex = -1;
      currentRemoteId = null;
    };

    closeEditModal.addEventListener('click', (e) => {
      e.stopPropagation();
      closeEditModalFunc();
    });
    
    cancelEditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeEditModalFunc();
    });

    // Save edit
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (currentEditIndex === -1 || !currentRemoteId) return;

      const name = switchNameInput.value.trim().substring(0, 8);
      const entityId = entityIdInput.value.trim();

      if (!name || !entityId) return;

      const remote = remotesData.get(currentRemoteId);
      if (!remote) return;

      remote.switches[currentEditIndex] = {
        ...remote.switches[currentEditIndex],
        name: name,
        icon: selectedIcon,
        entityId: entityId,
        active: false
      };

      renderSwitches(switchGrid, remote.switches, remoteId);
      closeEditModalFunc();
    });

    // Close modals when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        mainButton.classList.remove('active-main');
      }
    });

    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        closeEditModalFunc();
      }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modal.classList.contains('show')) {
          modal.classList.remove('show');
          mainButton.classList.remove('active-main');
        }
        if (editModal.classList.contains('show')) {
          closeEditModalFunc();
        }
      }
    });
  };

  // Toggle switch
  const toggleSwitch = (index, switchBtn, switchesData, remoteId) => {
    const sw = switchesData[index];
    
    if (!sw.entityId) {
      openEditModal(index, remoteId);
      return;
    }

    // Toggle active state
    switchesData[index].active = !switchesData[index].active;
    
    // Update visual state
    const icon = switchBtn.querySelector('i');
    if (switchesData[index].active) {
      switchBtn.classList.add('active');
      icon.style.color = '#FFC107';
    } else {
      switchBtn.classList.remove('active');
      icon.style.color = '#333';
    }
  };

  // Open edit modal
  const openEditModal = (index, remoteId) => {
    const remote = remotesData.get(remoteId);
    if (!remote) return;

    currentEditIndex = index;
    currentRemoteId = remoteId;
    const sw = remote.switches[index];

    const switchNameInput = document.getElementById(`${remoteId}-switchName`);
    const entityIdInput = document.getElementById(`${remoteId}-entityId`);
    const editModal = document.getElementById(`${remoteId}-editModal`);
    const iconGrid = document.getElementById(`${remoteId}-iconGrid`);

    if (!switchNameInput || !entityIdInput || !editModal || !iconGrid) return;

    switchNameInput.value = sw.name;
    entityIdInput.value = sw.entityId;
    selectedIcon = sw.icon;

    // Update icon selection
    document.querySelectorAll(`#${iconGrid.id} .remote-icon-option`).forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.icon === sw.icon) {
        opt.classList.add('selected');
      }
    });

    editModal.classList.add('show');
  };

  // Public API
  return {
    // Create a new remote at a specific position
    createRemote: (position, targetScene) => {
      const remoteId = createRemoteModal(position, targetScene);
      return {
        id: remoteId,
        position: position,
        targetScene: targetScene || ''
      };
    },

    // Open remote modal
    openRemoteModal: (remoteId) => {
      const modal = document.getElementById(`${remoteId}-switchModal`);
      const mainButton = document.getElementById(`${remoteId}-mainButton`);
      if (modal && mainButton) {
        modal.classList.add('show');
        mainButton.classList.add('active-main');
      }
    },

    // Get remote data for saving
    getRemotesData: () => {
      const remotes = [];
      remotesData.forEach(remoteData => {
        remotes.push({
          id: remoteData.id,
          position: remoteData.position.toArray ? remoteData.position.toArray() : remoteData.position,
          targetScene: remoteData.targetScene || '',
          switches: remoteData.switches
        });
      });
      return remotes;
    },

    // Get specific remote data
    getRemoteData: (remoteId) => {
      return remotesData.get(remoteId);
    },

    // Load remotes from data
    loadRemotes: (remotesDataArray) => {
      // Clear existing remotes
      document.querySelectorAll('.remote-container').forEach(el => el.remove());
      remotesData.clear();
      
      // Create new remotes
      remotesDataArray.forEach(remoteData => {
        const position = Array.isArray(remoteData.position) ? 
          new THREE.Vector3().fromArray(remoteData.position) : remoteData.position;
        
        const remoteId = createRemoteModal(position, remoteData.targetScene);
        
        // Update switches if provided
        if (remoteData.switches) {
          const remote = remotesData.get(remoteId);
          if (remote) {
            remote.switches = remoteData.switches;
          }
        }
      });
    },

    // Clear all remotes
    clearRemotes: () => {
      document.querySelectorAll('.remote-container').forEach(el => el.remove());
      remotesData.clear();
    },

    // Update remote positions on screen
    updateRemotePositions: (camera) => {
      remotesData.forEach((remoteData, remoteId) => {
        const container = document.getElementById(remoteId);
        if (!container) return;
        
        const remote = remotesData.get(remoteId);
        if (!remote || !remote.position) return;
        
        // Project 3D position to screen coordinates
        const screenPoint = remote.position.clone().project(camera);
        const x = (screenPoint.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPoint.y * 0.5 + 0.5) * window.innerHeight;
        
        // Only show if in front of camera
        if (screenPoint.z < 1) {
          container.style.display = 'block';
          container.style.left = x + 'px';
          container.style.top = y + 'px';
          
          // Update visibility based on scene
          const shouldBeVisible = !remote.targetScene || remote.targetScene === currentScene;
          container.style.opacity = shouldBeVisible ? '1' : '0.3';
        } else {
          container.style.display = 'none';
        }
      });
    },

    // Update remote visibility based on current scene
    updateRemoteVisibility: (currentScene) => {
      remotesData.forEach((remoteData, remoteId) => {
        const container = document.getElementById(remoteId);
        if (container && remoteData) {
          const shouldBeVisible = !remoteData.targetScene || remoteData.targetScene === currentScene;
          container.style.display = shouldBeVisible ? 'block' : 'none';
        }
      });
    }
  };
})();