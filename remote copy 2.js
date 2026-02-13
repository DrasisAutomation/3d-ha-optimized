// remote.js - Remote Control Module for 360 Scene Editor with Home Assistant Integration

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
  let currentScene = 'scene1';
  
  // Home Assistant Configuration
  let haConfig = {
    url: localStorage.getItem('ha_url') || '',
    token: localStorage.getItem('ha_token') || '',
    connected: false
  };

  // Test Home Assistant connection
  const testHAConnection = async () => {
    if (!haConfig.url || !haConfig.token) {
      return { success: false, message: 'URL or Token missing' };
    }
    
    try {
      const response = await fetch(`${haConfig.url}/api/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${haConfig.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        haConfig.connected = true;
        return { success: true, message: 'Connected to Home Assistant' };
      } else {
        haConfig.connected = false;
        return { success: false, message: `Connection failed: ${response.status}` };
      }
    } catch (error) {
      haConfig.connected = false;
      return { success: false, message: `Connection error: ${error.message}` };
    }
  };

  // Call Home Assistant service
  const callHAService = async (entityId, service, data = {}) => {
    if (!haConfig.connected || !haConfig.url || !haConfig.token) {
      console.error('Home Assistant not configured');
      return { success: false, message: 'Home Assistant not configured' };
    }
    
    const domain = entityId.split('.')[0];
    
    try {
      const response = await fetch(`${haConfig.url}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${haConfig.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entity_id: entityId,
          ...data
        })
      });
      
      if (response.ok) {
        return { success: true, message: 'Service call successful' };
      } else {
        return { success: false, message: `Service call failed: ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Service call error: ${error.message}` };
    }
  };

  // Get entity state from Home Assistant
  const getEntityState = async (entityId) => {
    if (!haConfig.connected || !haConfig.url || !haConfig.token) {
      console.error('Home Assistant not configured');
      return null;
    }
    
    try {
      const response = await fetch(`${haConfig.url}/api/states/${entityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${haConfig.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching entity state:', error);
      return null;
    }
  };

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
    container.dataset.visible = 'true';
    
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
              <div class="remote-form-note">Enter Home Assistant entity ID (e.g., light.bedroom, switch.living_room)</div>
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
      container: container,
      visible: true
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

      iconOption.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll(`#${iconGridElement.id} .remote-icon-option`).forEach(opt => {
          opt.classList.remove('selected');
        });
        iconOption.classList.add('selected');
        selectedIcon = icon.class;
      });

      iconOption.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
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

      // Touch events for mobile
      switchBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
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

      // Touch long press for edit
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

  // Setup event listeners for a remote instance
  const setupEventListeners = (id, modal, editModal, mainButton, closeModalBtn, 
                             closeEditModal, cancelEditBtn, editForm, 
                             switchNameInput, entityIdInput, switchGrid, iconGrid, remoteData) => {
    
    // Open main modal - click for desktop
    mainButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      modal.classList.add('show');
      mainButton.classList.add('active-main');
    });

    // Open main modal - touch for mobile
    mainButton.addEventListener('touchend', (e) => {
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

    closeModalBtn.addEventListener('touchend', (e) => {
      e.stopPropagation();
      e.preventDefault();
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
    
    closeEditModal.addEventListener('touchend', (e) => {
      e.stopPropagation();
      e.preventDefault();
      closeEditModalFunc();
    });
    
    cancelEditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeEditModalFunc();
    });

    cancelEditBtn.addEventListener('touchend', (e) => {
      e.stopPropagation();
      e.preventDefault();
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

      renderSwitches(switchGrid, remote.switches, id);
      closeEditModalFunc();
    });

    // Fix input field click issues
    [switchNameInput, entityIdInput].forEach(input => {
      // Allow clicks on the input itself
      input.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      input.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        input.focus();
      });
      
      // Allow focus on the input
      input.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      
      input.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      });
    });

    // Close modals when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        mainButton.classList.remove('active-main');
      }
    });

    modal.addEventListener('touchend', (e) => {
      if (e.target === modal) {
        e.preventDefault();
        modal.classList.remove('show');
        mainButton.classList.remove('active-main');
      }
    });

    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        closeEditModalFunc();
      }
    });

    editModal.addEventListener('touchend', (e) => {
      if (e.target === editModal) {
        e.preventDefault();
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
  const toggleSwitch = async (index, switchBtn, switchesData, remoteId) => {
    const sw = switchesData[index];
    
    if (!sw.entityId) {
      openEditModal(index, remoteId);
      return;
    }

    // Toggle active state
    const newActiveState = !switchesData[index].active;
    
    // Call Home Assistant service
    if (haConfig.connected) {
      const domain = sw.entityId.split('.')[0];
      const service = newActiveState ? 'turn_on' : 'turn_off';
      
      const result = await callHAService(sw.entityId, service);
      
      if (result.success) {
        switchesData[index].active = newActiveState;
        
        // Update visual state
        const icon = switchBtn.querySelector('i');
        if (switchesData[index].active) {
          switchBtn.classList.add('active');
          icon.style.color = '#FFC107';
        } else {
          switchBtn.classList.remove('active');
          icon.style.color = '#333';
        }
        
        console.log(`Switch ${sw.entityId} ${newActiveState ? 'ON' : 'OFF'}`);
      } else {
        alert(`Failed to control ${sw.entityId}: ${result.message}`);
      }
    } else {
      // If HA not connected, just toggle locally
      switchesData[index].active = newActiveState;
      
      // Update visual state
      const icon = switchBtn.querySelector('i');
      if (switchesData[index].active) {
        switchBtn.classList.add('active');
        icon.style.color = '#FFC107';
      } else {
        switchBtn.classList.remove('active');
        icon.style.color = '#333';
      }
      
      console.log(`Home Assistant not connected. Switch ${sw.entityId} toggled locally.`);
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
    
    // Focus on the first input field
    setTimeout(() => {
      switchNameInput.focus();
    }, 100);
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

    // Set current scene for visibility checks
    setCurrentScene: (sceneName) => {
      currentScene = sceneName;
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
        
        // Check if remote should be visible for current scene
        const shouldBeVisible = !remote.targetScene || remote.targetScene === currentScene;
        
        if (!shouldBeVisible) {
          container.style.display = 'none';
          return;
        }
        
        // Project 3D position to screen coordinates
        const screenPoint = remote.position.clone().project(camera);
        const x = (screenPoint.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPoint.y * 0.5 + 0.5) * window.innerHeight;
        
        // Only show if in front of camera and on screen
        if (screenPoint.z < 1 && 
            x >= -50 && x <= window.innerWidth + 50 && 
            y >= -50 && y <= window.innerHeight + 50) {
          container.style.display = 'block';
          container.style.left = x + 'px';
          container.style.top = y + 'px';
          container.style.opacity = '1';
          container.style.pointerEvents = 'auto';
        } else {
          container.style.display = 'none';
          container.style.pointerEvents = 'none';
        }
      });
    },

    // Update remote visibility based on current scene
    updateRemoteVisibility: (sceneName) => {
      currentScene = sceneName;
      remotesData.forEach((remoteData, remoteId) => {
        const container = document.getElementById(remoteId);
        if (container && remoteData) {
          const shouldBeVisible = !remoteData.targetScene || remoteData.targetScene === sceneName;
          container.dataset.visible = shouldBeVisible.toString();
          
          if (!shouldBeVisible) {
            container.style.display = 'none';
            container.style.pointerEvents = 'none';
          } else {
            container.style.pointerEvents = 'auto';
          }
        }
      });
    },

    // Home Assistant functions
    getHAConfig: () => {
      return { ...haConfig };
    },

    setHAConfig: (url, token) => {
      haConfig.url = url;
      haConfig.token = token;
      localStorage.setItem('ha_url', url);
      localStorage.setItem('ha_token', token);
      return testHAConnection();
    },

    testHAConnection: testHAConnection,

    callHAService: callHAService,

    getEntityState: getEntityState,

    // Sync all switches with Home Assistant state
    syncWithHA: async () => {
      if (!haConfig.connected) {
        console.log('Home Assistant not connected');
        return;
      }

      for (const [remoteId, remoteData] of remotesData.entries()) {
        for (let i = 0; i < remoteData.switches.length; i++) {
          const sw = remoteData.switches[i];
          if (sw.entityId) {
            const state = await getEntityState(sw.entityId);
            if (state && state.state) {
              const isActive = state.state === 'on';
              if (sw.active !== isActive) {
                sw.active = isActive;
                
                // Update visual state
                const switchBtn = document.querySelector(`#${remoteId}-switchGrid .remote-switch-button[data-index="${i}"]`);
                if (switchBtn) {
                  const icon = switchBtn.querySelector('i');
                  if (isActive) {
                    switchBtn.classList.add('active');
                    icon.style.color = '#FFC107';
                  } else {
                    switchBtn.classList.remove('active');
                    icon.style.color = '#333';
                  }
                }
              }
            }
          }
        }
      }
    }
  };
})();