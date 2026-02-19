// lock.js - Fixed Lock Control Module with Processing State

const LockModule = (() => {
  // Available Font Awesome icons for lock button
  const ICONS = [
    { class: 'fas fa-lock', name: 'Lock' },
    { class: 'fas fa-unlock', name: 'Unlock' },
    { class: 'fas fa-door-closed', name: 'Door Closed' },
    { class: 'fas fa-door-open', name: 'Door Open' },
    { class: 'fas fa-key', name: 'Key' },
    { class: 'fas fa-shield', name: 'Shield' },
    { class: 'fas fa-home', name: 'Home' },
    { class: 'fas fa-building', name: 'Building' },
    { class: 'fas fa-car', name: 'Car' },
    { class: 'fas fa-motorcycle', name: 'Motorcycle' },
    { class: 'fas fa-bicycle', name: 'Bicycle' },
    { class: 'fas fa-cog', name: 'Settings' },
    { class: 'fas fa-bolt', name: 'Bolt' },
    { class: 'fas fa-bell', name: 'Bell' },
    { class: 'fas fa-lightbulb', name: 'Light' },
    { class: 'fas fa-temperature-high', name: 'Temperature' },
    { class: 'fas fa-fan', name: 'Fan' },
    { class: 'fas fa-water', name: 'Water' },
    { class: 'fas fa-fire', name: 'Fire' },
    { class: 'fas fa-snowflake', name: 'Snowflake' },
    { class: 'fas fa-tree', name: 'Tree' },
    { class: 'fas fa-paw', name: 'Paw' },
    { class: 'fas fa-dog', name: 'Dog' },
    { class: 'fas fa-cat', name: 'Cat' },
    { class: 'fas fa-star', name: 'Star' },
    { class: 'fas fa-heart', name: 'Heart' },
    { class: 'fas fa-smile', name: 'Smile' },
    { class: 'fas fa-moon', name: 'Moon' },
    { class: 'fas fa-sun', name: 'Sun' },
    { class: 'fas fa-cloud', name: 'Cloud' },
    { class: 'fas fa-umbrella', name: 'Umbrella' }
  ];

  // Default configuration
  const DEFAULT_CONFIG = {
    entityId: 'lock.m302_b6e10c_2',
    friendlyName: 'Front Door Lock',
    icon: 'fa-lock'
  };

  let instanceId = 1;
  let remotesData = new Map();
  let selectedIcon = 'fa-lock';
  let currentScene = 'scene1';

  // ========== HOME ASSISTANT CONFIGURATION ==========
  const HA_CONFIG = {
    url: "wss://demo.lumihomepro1.com/api/websocket",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI0OWU5NDM5ZWRjNWM0YTM4OTgzZmE5NzIyNjU0ZjY5MiIsImlhdCI6MTc2ODI5NjI1NSwiZXhwIjoyMDgzNjU2MjU1fQ.5C9sFe538kogRIL63dlwweBJldwhmQ7eoW86GEWls8U",
    connected: false,
    socket: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,
    messageId: 1,
    pendingRequests: new Map(),
    autoReconnect: true,
    reconnectInterval: 3000
  };
  // ==================================================

  // Initialize WebSocket connection
  const initWebSocket = () => {
    if (HA_CONFIG.socket && (HA_CONFIG.socket.readyState === WebSocket.OPEN || HA_CONFIG.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      HA_CONFIG.socket = new WebSocket(HA_CONFIG.url);

      HA_CONFIG.socket.onopen = () => {
        HA_CONFIG.reconnectAttempts = 0;
        HA_CONFIG.socket.send(JSON.stringify({ 
          type: "auth", 
          access_token: HA_CONFIG.token 
        }));
      };

      HA_CONFIG.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      HA_CONFIG.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        HA_CONFIG.connected = false;
      };

      HA_CONFIG.socket.onclose = () => {
        HA_CONFIG.connected = false;
        
        HA_CONFIG.pendingRequests.forEach((request) => {
          request.reject(new Error('WebSocket closed'));
        });
        HA_CONFIG.pendingRequests.clear();

        if (HA_CONFIG.autoReconnect && HA_CONFIG.reconnectAttempts < HA_CONFIG.maxReconnectAttempts) {
          HA_CONFIG.reconnectAttempts++;
          setTimeout(initWebSocket, HA_CONFIG.reconnectInterval);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'auth_required':
        HA_CONFIG.socket.send(JSON.stringify({ 
          type: 'auth', 
          access_token: HA_CONFIG.token 
        }));
        break;

      case 'auth_ok':
        console.log('Authentication successful');
        HA_CONFIG.connected = true;
        
        // Get initial states (ID 1)
        setTimeout(() => {
          HA_CONFIG.socket.send(JSON.stringify({
            id: 1,
            type: "get_states"
          }));

          // Subscribe to changes (ID 2)
          setTimeout(() => {
            HA_CONFIG.socket.send(JSON.stringify({
              id: 2,
              type: "subscribe_events",
              event_type: "state_changed"
            }));
          }, 100);
        }, 100);
        break;

      case 'auth_invalid':
        console.error('Authentication failed');
        HA_CONFIG.connected = false;
        HA_CONFIG.socket.close();
        break;

      case 'result':
        if (message.id === 1 && message.success && message.result) {
          // Handle get_states result
          updateLockStatesFromResult(message.result);
        } else if (message.id === 2) {
          console.log('Subscription confirmed');
        }
        
        // Handle any pending requests
        const pendingRequest = HA_CONFIG.pendingRequests.get(message.id);
        if (pendingRequest) {
          HA_CONFIG.pendingRequests.delete(message.id);
          if (message.success) {
            pendingRequest.resolve(message);
          } else {
            pendingRequest.reject(new Error(message.error?.message || 'Command failed'));
          }
        }
        break;

      case 'event':
        if (message.event?.event_type === 'state_changed') {
          handleStateChange(message.event.data);
        }
        break;
    }
  };

  // Update lock states from get_states result
  const updateLockStatesFromResult = (states) => {
    remotesData.forEach((remoteData, remoteId) => {
      const entityId = remoteData.config.entityId;
      if (entityId) {
        const lock = states.find(e => e.entity_id === entityId);
        if (lock) {
          const isLocked = lock.state === "locked";
          remoteData.isLocked = isLocked;
          remoteData.processing = false;
          updateLockUI(remoteId, isLocked, false);
          console.log(`Lock ${entityId}: ${isLocked ? 'LOCKED' : 'UNLOCKED'}`);
        }
      }
    });
  };

  // Handle state change events
  const handleStateChange = (data) => {
    const entityId = data.entity_id;

    remotesData.forEach((remoteData, remoteId) => {
      if (remoteData.config.entityId === entityId) {
        const newState = data.new_state.state;
        console.log(`State change for ${entityId}: ${newState}`);

        if (newState === "locked" || newState === "unlocked") {
          const locked = newState === "locked";
          remoteData.isLocked = locked;
          remoteData.processing = false;
          updateLockUI(remoteId, locked, false);
        } else {
          // Processing state (locking/unlocking)
          remoteData.processing = true;
          updateLockUI(remoteId, remoteData.isLocked, true);
        }
      }
    });
  };

// Update Lock UI - WITH PROCESSING STATE
const updateLockUI = (remoteId, locked, isProcessing) => {
  const lockToggle = document.getElementById(`${remoteId}-lockToggle`);
  const lockStatus = document.getElementById(`${remoteId}-lockStatus`);
  const mainButton = document.getElementById(`${remoteId}-mainButton`);
  const lockIcon = document.getElementById(`${remoteId}-lockIcon`);
  const lockSwitchElement = document.getElementById(`${remoteId}-lockSwitch`);
  const remoteData = remotesData.get(remoteId);

  if (lockToggle) lockToggle.checked = locked;

  if (lockStatus) {
    if (isProcessing) {
      lockStatus.textContent = 'PROCESSING...';
      lockStatus.className = 'lock-status processing';
      lockStatus.style.color = '#ff9900';
    } else {
      lockStatus.textContent = locked ? 'LOCKED' : 'UNLOCKED';
      lockStatus.className = `lock-status ${locked ? 'locked' : 'unlocked'}`;
      lockStatus.style.color = locked ? '#33cc33' : '#ff3333';
    }
  }

  if (mainButton) {
    // Remove all state classes
    mainButton.classList.remove('locked', 'unlocked', 'processing');

    if (isProcessing) {
      mainButton.classList.add('processing');
      mainButton.style.boxShadow = '0 0 15px rgba(255, 165, 0, 0.6)';
      mainButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
      if (lockIcon) {
        const originalIcon = remoteData?.config?.icon || 'fas fa-lock';
        lockIcon.className = `${originalIcon} icon`;
        lockIcon.style.color = '#ff9900';
      }
    } else if (locked) {
      mainButton.classList.add('locked');
      mainButton.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
      mainButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
      if (lockIcon) {
        const originalIcon = remoteData?.config?.icon || 'fas fa-lock';
        lockIcon.className = `${originalIcon} icon`;
        lockIcon.style.color = '#33cc33';
      }
    } else {
      mainButton.classList.add('unlocked');
      mainButton.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.3)';
      mainButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
      if (lockIcon) {
        const originalIcon = remoteData?.config?.icon || 'fas fa-unlock';
        lockIcon.className = `${originalIcon} icon`;
        lockIcon.style.color = '#ff3333';
      }
    }
  }

  if (lockSwitchElement) {
    if (isProcessing) {
      lockSwitchElement.classList.add('processing');
    } else {
      lockSwitchElement.classList.remove('processing');
    }
  }
};

  // Call service
  const callService = (domain, service, data) => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
      return Promise.reject('Not connected');
    }

    const messageId = Date.now();
    const message = {
      id: messageId,
      type: 'call_service',
      domain: domain,
      service: service,
      service_data: data
    };

    console.log('Sending command:', message);
    HA_CONFIG.socket.send(JSON.stringify(message));

    return new Promise((resolve, reject) => {
      HA_CONFIG.pendingRequests.set(messageId, { resolve, reject });

      // Longer timeout for lock operations
      setTimeout(() => {
        if (HA_CONFIG.pendingRequests.has(messageId)) {
          HA_CONFIG.pendingRequests.delete(messageId);
          reject(new Error('Command timeout'));
        }
      }, 10000);
    });
  };

  // Enable/disable body rotation
  const enableBodyRotation = () => document.body.classList.remove('lock-modal-active');
  const disableBodyRotation = () => document.body.classList.add('lock-modal-active');

  // Show main panel
  const showMainPanel = (remoteId) => {
    document.getElementById(`${remoteId}-panelMain`).classList.remove('hidden');
    document.getElementById(`${remoteId}-panelEdit`).classList.add('hidden');
  };

  // Send lock/unlock command - WITH PROCESSING STATE
  const sendLockCommand = (remoteId, shouldLock) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
      alert('Home Assistant not connected');
      return;
    }

    const entityId = remoteData.config.entityId;
    if (!entityId) {
      alert('No entity ID configured');
      return;
    }

    // Set processing state
    remoteData.processing = true;
    updateLockUI(remoteId, shouldLock, true);

    const service = shouldLock ? "lock" : "unlock";
    
    callService("lock", service, { entity_id: entityId })
      .then(result => {
        console.log('Command sent successfully');
        // State will be updated via state_changed event
      })
      .catch(error => {
        console.error('Failed to send command:', error);
        alert('Failed to send command: ' + error.message);
        
        // Reset processing state on error
        remoteData.processing = false;
        updateLockUI(remoteId, remoteData.isLocked, false);
      });
  };

  // Create remote modal
  const createRemoteModal = (position, targetScene, configOverride = null) => {
    const remoteId = `lock-remote-${instanceId++}`;
    const config = configOverride ? { ...DEFAULT_CONFIG, ...configOverride } : { ...DEFAULT_CONFIG };

    const container = document.createElement('div');
    container.className = 'lock-remote-container';
    container.id = remoteId;
    container.dataset.position = JSON.stringify(position);
    container.dataset.targetScene = targetScene || '';
    container.dataset.visible = 'true';
    container.setAttribute('data-remote-type', 'lock');
    container.style.position = 'absolute';
    container.style.zIndex = '1000';
    container.style.pointerEvents = 'auto';
    container.style.transform = 'translate(-50%, -50%)';

    container.innerHTML = `
      <!-- Main Button -->
      <button class="lock-remote-main-button" id="${remoteId}-mainButton">
        <i class="${config.icon} icon" id="${remoteId}-lockIcon"></i>
      </button>

      <!-- Modal -->
      <div class="lock-remote-modal" id="${remoteId}-modal">
        <div class="lock-remote-modal-content">
          <button class="lock-remote-close-btn" id="${remoteId}-closeModal">
            <i class="fas fa-times"></i>
          </button>
          
          <button class="lock-remote-edit-btn" id="${remoteId}-editBtn">
            <i class="fas fa-edit" style="display:none !important;"></i>
          </button>

          <div class="lock-remote-title" id="${remoteId}-modalTitle">${config.friendlyName}</div>

          <!-- Panel 1: Main lock control -->
          <div id="${remoteId}-panelMain" class="lock-remote-panel">
            <div class="lock-switch-container">
              <label class="lock-switch" id="${remoteId}-lockSwitch">
                <input type="checkbox" id="${remoteId}-lockToggle" />
                <span>
                  <em></em>
                </span>
              </label>
            </div>
            <div class="lock-status" id="${remoteId}-lockStatus">LOCKED</div>
          </div>

          <!-- Panel 2: Edit form -->
          <div id="${remoteId}-panelEdit" class="lock-remote-panel hidden">
            <div class="lock-remote-form" id="${remoteId}-editForm">
              <div class="lock-remote-form-group">
                <label class="lock-remote-form-label">Entity ID</label>
                <input type="text" class="lock-remote-form-input" id="${remoteId}-entityId" value="${config.entityId}" placeholder="lock.m302_b6e10c_2">
              </div>

              <div class="lock-remote-form-group">
                <label class="lock-remote-form-label">Friendly Name</label>
                <input type="text" class="lock-remote-form-input" id="${remoteId}-friendlyName" value="${config.friendlyName}" placeholder="Front Door Lock">
              </div>

              <div class="lock-remote-form-group">
                <label class="lock-remote-form-label">Button Icon</label>
                <div class="lock-remote-icon-grid" id="${remoteId}-iconGrid"></div>
              </div>

              <div class="lock-remote-form-actions">
                <button type="button" class="lock-remote-form-btn cancel" id="${remoteId}-cancelEdit">Cancel</button>
                <button type="submit" class="lock-remote-form-btn save" id="${remoteId}-saveButton">Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    remotesData.set(remoteId, {
      id: remoteId,
      position: position,
      targetScene: targetScene || '',
      config: config,
      isLocked: false,
      processing: false,
      container: container,
      visible: true,
      isEditMode: false
    });

    initRemoteModal(remoteId);
    
    // Set default state
    setTimeout(() => {
      updateLockUI(remoteId, true, false); 
    }, 100);
    
    return remoteId;
  };

  // Initialize remote modal
  const initRemoteModal = (remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    const modal = document.getElementById(`${remoteId}-modal`);
    const panelMain = document.getElementById(`${remoteId}-panelMain`);
    const panelEdit = document.getElementById(`${remoteId}-panelEdit`);
    const iconGrid = document.getElementById(`${remoteId}-iconGrid`);
    const mainButton = document.getElementById(`${remoteId}-mainButton`);
    const closeModalBtn = document.getElementById(`${remoteId}-closeModal`);
    const editBtn = document.getElementById(`${remoteId}-editBtn`);
    const cancelEditBtn = document.getElementById(`${remoteId}-cancelEdit`);
    const saveButton = document.getElementById(`${remoteId}-saveButton`);
    const lockSwitch = document.getElementById(`${remoteId}-lockSwitch`);
    const lockToggle = document.getElementById(`${remoteId}-lockToggle`);
    const lockStatus = document.getElementById(`${remoteId}-lockStatus`);
    const entityIdInput = document.getElementById(`${remoteId}-entityId`);
    const friendlyNameInput = document.getElementById(`${remoteId}-friendlyName`);
    const modalTitle = document.getElementById(`${remoteId}-modalTitle`);

    // Populate icon grid
    populateIconGrid(iconGrid, remoteId, remoteData.config.icon);

    // Open modal
    mainButton.addEventListener('click', (e) => {
      e.stopPropagation();
      modal.classList.add('show');
      mainButton.classList.add('active-main');
      mainButton.style.display = 'none';
      document.body.classList.add('lock-modal-active');
      showMainPanel(remoteId);
      disableBodyRotation();
    });

    mainButton.addEventListener('touchend', (e) => {
      e.stopPropagation();
      e.preventDefault();
      modal.classList.add('show');
      mainButton.classList.add('active-main');
      mainButton.style.display = 'none';
      document.body.classList.add('lock-modal-active');
      showMainPanel(remoteId);
      disableBodyRotation();
    });

    // Close modal
    const closeModal = () => {
      modal.classList.remove('show');
      mainButton.classList.remove('active-main');
      mainButton.style.display = 'flex';
      document.body.classList.remove('lock-modal-active');
      enableBodyRotation();
    };

    closeModalBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      closeModal();
    });

    // Edit button
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetEditForm(remoteId);
      remoteData.isEditMode = true;
      panelMain.classList.add('hidden');
      panelEdit.classList.remove('hidden');
    });

    editBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetEditForm(remoteId);
      remoteData.isEditMode = true;
      panelMain.classList.add('hidden');
      panelEdit.classList.remove('hidden');
    });

    // Cancel edit
    cancelEditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      remoteData.isEditMode = false;
      panelEdit.classList.add('hidden');
      panelMain.classList.remove('hidden');
    });

    cancelEditBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      remoteData.isEditMode = false;
      panelEdit.classList.add('hidden');
      panelMain.classList.remove('hidden');
    });

    // Save button
    saveButton.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSaveButton(remoteId);
    });

    saveButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSaveButton(remoteId);
    });

    // Lock switch click - WITH PROCESSING CHECK
    lockSwitch.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (remoteData.processing) {
        console.log('Already processing, ignoring click');
        return;
      }

      const newState = !remoteData.isLocked;
      lockToggle.checked = newState;
      sendLockCommand(remoteId, newState);
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    modal.addEventListener('touchend', (e) => {
      if (e.target === modal) {
        e.preventDefault();
        closeModal();
      }
    });

    // Input field handling
    [entityIdInput, friendlyNameInput].forEach(input => {
      if (input) {
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('touchstart', (e) => e.stopPropagation());
        input.addEventListener('touchend', (e) => {
          e.stopPropagation();
          e.preventDefault();
          input.focus();
        });
      }
    });

    // Load saved config
    try {
      const savedConfig = localStorage.getItem(`lockConfig_${remoteId}`);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        remoteData.config = { ...remoteData.config, ...parsed };
        entityIdInput.value = remoteData.config.entityId;
        friendlyNameInput.value = remoteData.config.friendlyName;
        modalTitle.textContent = remoteData.config.friendlyName;

        const mainButtonIcon = document.querySelector(`#${remoteId}-mainButton i`);
        if (mainButtonIcon) {
          mainButtonIcon.className = `${remoteData.config.icon} icon`;
        }
      }
    } catch (e) {}
  };

  // Populate icon grid
  const populateIconGrid = (iconGridElement, remoteId, selectedIconClass) => {
    if (!iconGridElement) return;

    iconGridElement.innerHTML = '';
    ICONS.forEach(icon => {
      const iconOption = document.createElement('div');
      iconOption.className = 'lock-remote-icon-option';
      iconOption.dataset.icon = icon.class;

      const iconEl = document.createElement('i');
      iconEl.className = icon.class;

      iconOption.appendChild(iconEl);
      iconGridElement.appendChild(iconOption);

      if (icon.class === selectedIconClass) {
        iconOption.classList.add('selected');
      }

      iconOption.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll(`#${iconGridElement.id} .lock-remote-icon-option`).forEach(opt => {
          opt.classList.remove('selected');
        });
        iconOption.classList.add('selected');
        selectedIcon = icon.class;
      });

      iconOption.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(`#${iconGridElement.id} .lock-remote-icon-option`).forEach(opt => {
          opt.classList.remove('selected');
        });
        iconOption.classList.add('selected');
        selectedIcon = icon.class;
      });
    });
  };

  // Reset edit form
  const resetEditForm = (remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    document.getElementById(`${remoteId}-entityId`).value = remoteData.config.entityId;
    document.getElementById(`${remoteId}-friendlyName`).value = remoteData.config.friendlyName;

    document.querySelectorAll(`#${remoteId}-iconGrid .lock-remote-icon-option`).forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.icon === remoteData.config.icon) {
        opt.classList.add('selected');
      }
    });
    selectedIcon = remoteData.config.icon;
  };

  // Save button handler
  const handleSaveButton = (remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    const entityId = document.getElementById(`${remoteId}-entityId`).value.trim();
    const friendlyName = document.getElementById(`${remoteId}-friendlyName`).value.trim();

    if (!entityId) {
      alert('Please enter an entity ID');
      return;
    }

    remoteData.config.entityId = entityId;
    remoteData.config.friendlyName = friendlyName || 'Lock Control';
    remoteData.config.icon = selectedIcon;

    document.getElementById(`${remoteId}-modalTitle`).textContent = remoteData.config.friendlyName;

    const mainButtonIcon = document.querySelector(`#${remoteId}-mainButton i`);
    if (mainButtonIcon) {
      mainButtonIcon.className = `${selectedIcon} icon`;
    }

    remoteData.isEditMode = false;
    document.getElementById(`${remoteId}-panelEdit`).classList.add('hidden');
    document.getElementById(`${remoteId}-panelMain`).classList.remove('hidden');

    try {
      localStorage.setItem(`lockConfig_${remoteId}`, JSON.stringify(remoteData.config));
    } catch (e) {}

    // Fetch updated state
    if (HA_CONFIG.connected && entityId) {
      setTimeout(() => {
        HA_CONFIG.socket.send(JSON.stringify({
          id: 1,
          type: "get_states"
        }));
      }, 500);
    }
  };

  // Initialize WebSocket
  initWebSocket();

  // Public API
  return {
    createRemote: (position, targetScene, configOverride = null) => {
      const remoteId = createRemoteModal(position, targetScene, configOverride);
      return { id: remoteId, position: position, targetScene: targetScene || '' };
    },

    refreshAllLockStates: () => {
      if (HA_CONFIG.connected) {
        HA_CONFIG.socket.send(JSON.stringify({
          id: 1,
          type: "get_states"
        }));
      }
    },

    deleteRemote: (remoteId) => {
      document.getElementById(remoteId)?.remove();
      return remotesData.delete(remoteId);
    },

    getRemotesData: () => {
      const remotes = [];
      remotesData.forEach(remoteData => {
        remotes.push({
          id: remoteData.id,
          position: remoteData.position.toArray ? remoteData.position.toArray() : remoteData.position,
          targetScene: remoteData.targetScene || '',
          config: { ...remoteData.config }
        });
      });
      return remotes;
    },

    setCurrentScene: (sceneName) => {
      currentScene = sceneName;
    },

    loadRemotes: (remotesDataArray) => {
      document.querySelectorAll('.lock-remote-container').forEach(el => el.remove());
      remotesData.clear();

      remotesDataArray.forEach(remoteData => {
        const position = Array.isArray(remoteData.position) ?
          new THREE.Vector3().fromArray(remoteData.position) : remoteData.position;
        createRemoteModal(position, remoteData.targetScene || '', remoteData.config);
      });

      if (HA_CONFIG.connected) {
        setTimeout(() => {
          HA_CONFIG.socket.send(JSON.stringify({
            id: 1,
            type: "get_states"
          }));
        }, 1000);
      }
    },

    clearRemotes: () => {
      document.querySelectorAll('.lock-remote-container').forEach(el => el.remove());
      remotesData.clear();
    },

    updateRemotePositions: (camera) => {
      remotesData.forEach((remoteData, remoteId) => {
        const container = document.getElementById(remoteId);
        if (!container || !remoteData.position) return;

        const shouldBeVisible = !remoteData.targetScene || remoteData.targetScene === currentScene;

        if (!shouldBeVisible) {
          container.style.display = 'none';
          return;
        }

        const screenPoint = remoteData.position.clone().project(camera);
        const x = (screenPoint.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPoint.y * 0.5 + 0.5) * window.innerHeight;

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

    updateRemoteVisibility: (sceneName) => {
      currentScene = sceneName;
      remotesData.forEach((remoteData, remoteId) => {
        const container = document.getElementById(remoteId);
        if (container) {
          const shouldBeVisible = !remoteData.targetScene || remoteData.targetScene === sceneName;
          container.dataset.visible = shouldBeVisible.toString();
          container.style.display = shouldBeVisible ? 'block' : 'none';
          container.style.pointerEvents = shouldBeVisible ? 'auto' : 'none';
        }
      });
    },

    getHAConfig: () => ({
      connected: HA_CONFIG.connected,
      socketState: HA_CONFIG.socket ? HA_CONFIG.socket.readyState : 'CLOSED'
    }),

    initHomeAssistant: async () => {
      initWebSocket();
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (HA_CONFIG.connected) {
            clearInterval(check);
            resolve({ success: true });
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          resolve({ success: false });
        }, 5000);
      });
    },

    disconnectHomeAssistant: () => {
      if (HA_CONFIG.socket) {
        HA_CONFIG.autoReconnect = false;
        HA_CONFIG.socket.close();
        HA_CONFIG.connected = false;
      }
    },

    reconnectHomeAssistant: () => {
      HA_CONFIG.autoReconnect = true;
      initWebSocket();
    }
  };
})();

// Add CSS styles
const lockStyle = document.createElement('style');
lockStyle.textContent = `
  .lock-remote-container {
    position: absolute;
    z-index: 1000;
    pointer-events: auto;
    transition: opacity 0.2s;
    transform: translate(-50%, -50%);
  }

  .lock-remote-main-button {
    width: 60px;
    height: 60px;
    background-color: rgba(255, 255, 255, 0.4);
    border: none;
    border-radius: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    padding: 0;
  }

  @media (max-width: 768px) {
    .lock-remote-main-button {
      width: 56px;
      height: 56px;
    }
  }

  .lock-remote-main-button:active {
    transform: scale(0.95);
  }

  .lock-remote-main-button i {
    font-size: 24px;
    transition: color 0.2s;
  }

  .lock-remote-main-button.locked {
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
    background-color: rgba(0, 255, 0, 0.1);
  }

  .lock-remote-main-button.locked i {
    color: #33cc33;
  }

  .lock-remote-main-button.unlocked {
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
    background-color: rgba(255, 0, 0, 0.1);
  }

  .lock-remote-main-button.unlocked i {
    color: #ff3333;
  }

  .lock-remote-main-button.processing {
    box-shadow: 0 0 15px rgba(255, 165, 0, 0.6);
    background-color: rgba(255, 165, 0, 0.1);
    animation: pulse 1.5s infinite;
  }

  .lock-remote-main-button.processing i {
    color: #ff9900;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  .lock-remote-main-button.active-main {
    box-shadow: 0 0 20px 8px rgba(33, 150, 243, 0.7);
    border: 2px solid rgba(33, 150, 243, 0.4);
    display: none;
  }

  .lock-remote-main-button.active-main i {
    color: #2196F3;
  }

  .lock-remote-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2000;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(3px);
  }

  .lock-remote-modal.show {
    display: flex;
  }

  .lock-remote-modal-content {
    background: rgba(255, 255, 255, 0.4);
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    min-width: 290px;
    max-height: 85vh;
    overflow-y: auto;
    padding: 24px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 15px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .lock-remote-close-btn,
  .lock-remote-edit-btn {
    position: absolute;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #333;
    z-index: 1001;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .lock-remote-close-btn {
    top: 16px;
    right: 16px;
  }

  .lock-remote-edit-btn {
    top: 16px;
    left: 16px;
  }

  .lock-remote-close-btn:active,
  .lock-remote-edit-btn:active {
    background-color: rgba(0, 0, 0, 0.1);
    transform: scale(0.95);
  }

  .lock-remote-title {
    color: #333;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    width: 100%;
  }

  .lock-remote-panel {
    width: 100%;
  }

  .lock-remote-panel.hidden {
    display: none !important;
  }

  /* Lock Switch Styles */
  .lock-switch-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 220px;
    margin-top: 10px;
  }

  .lock-switch {
    width: 70px;
    height: 140px;
    display: block;
    position: relative;
    cursor: pointer;
  }
  
  .lock-switch input {
    display: none;
  }
  
  .lock-switch input + span {
    width: 70px;
    height: 140px;
    display: block;
    position: relative;
    vertical-align: middle;
    white-space: nowrap;
    transition: color 0.3s ease;
  }
  
  .lock-switch input + span:before,
  .lock-switch input + span:after {
    content: "";
    display: block;
    position: absolute;
    border-radius: 35px;
  }
  
  /* Base color - RED for UNLOCKED (unchecked) */
  .lock-switch input + span:before {
    top: 0;
    left: 0;
    width: 70px;
    height: 140px;
    border-radius: 8px;
    background: #ff9c9c;
    transition: all 0.3s ease;
  }
  
  /* GREEN for LOCKED (checked) */
  .lock-switch input:checked + span:before {
    background: #8eff98;
  }
  
  /* ORANGE for PROCESSING - overrides both */
  .lock-switch.processing input + span:before {
    background: #ffb347 !important;
  }
  
  /* Handle position */
  .lock-switch input + span:after {
    width: 58px;
    height: 58px;
    background: #ffffff;
    border-radius: 8px;
    top: 76px;
    left: 6px;
    box-shadow: 0 3px 8px rgba(18, 22, 33, 0.2);
    transition: all 0.45s ease;
  }
  
  /* UP position - LOCKED (green) */
  .lock-switch input:checked + span:after {
    background: #fff;
    transform: translate(0, -70px);
  }
  
  /* Lock icon styling */
  .lock-switch input + span em {
    width: 24px;
    height: 20px;
    background: #f80000;
    position: absolute;
    left: 23px;
    bottom: 20px;
    border-radius: 6px;
    display: block;
    z-index: 1;
    transition: all 0.45s ease;
  }
  
  .lock-switch input + span em:before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: #ffffff;
    position: absolute;
    display: block;
    left: 50%;
    top: 50%;
    margin: -3px 0 0 -3px;
  }
  
  .lock-switch input + span em:after {
    content: "";
    display: block;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    border: 3px solid #f60000;
    border-bottom: 0;
    width: 14px;
    height: 12px;
    left: 2.5px;
    bottom: 16px;
    position: absolute;
    z-index: 1;
    transform-origin: 0 100%;
    transition: all 0.45s ease;
    transform: rotate(-35deg) translate(0px, 3px);
  }
  
  /* GREEN for LOCKED */
  .lock-switch input:checked + span em {
    transform: translate(0, -70px);
    background: #02923c;
  }
  
  .lock-switch input:checked + span em:after {
    border-color: #02923c;
    transform: rotate(0deg) translate(0, 0);
  }
  
  /* PROCESSING styles for the lock icon */
  .lock-switch.processing input + span em {
    background: #cc7b00 !important;
  }
  
  .lock-switch.processing input + span em:after {
    border-color: #cc7b00 !important;
  }
  
  .lock-switch.processing input + span:after {
    box-shadow: 0 3px 8px rgba(255, 165, 0, 0.4);
  }

  .lock-status {
    font-size: 14px;
    color: #333;
    text-align: center;
    font-weight: bold;
    width: 100%;
  }

  .lock-status.locked {
    color: #33cc33;
  }

  .lock-status.unlocked {
    color: #ff3333;
  }

  .lock-status.processing {
    color: #ff9900;
  }

  /* Form Styles */
  .lock-remote-form {
    width: 100%;
  }

  .lock-remote-form-group {
    margin-bottom: 20px;
    width: 100%;
  }

  .lock-remote-form-label {
    display: block;
    margin-bottom: 8px;
    color: #333;
    font-weight: bold;
    font-size: 14px;
  }

  .lock-remote-form-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    box-sizing: border-box;
    background-color: white;
  }

  .lock-remote-form-input:focus {
    outline: none;
    border-color: #007aff;
  }

  /* Icon grid */
  .lock-remote-icon-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 5px;
    max-height: 150px;
    overflow-y: auto;
    padding: 10px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
    margin-top: 10px;
  }

  .lock-remote-icon-option {
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 18px;
    color: #666;
    background: white;
    border: 2px solid transparent;
  }

  .lock-remote-icon-option:active {
    background: #e3f2fd;
    color: #007aff;
    transform: scale(0.95);
  }

  .lock-remote-icon-option.selected {
    background: #007aff;
    color: white;
    border-color: #0056cc;
  }

  .lock-remote-form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .lock-remote-form-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
    min-width: 100px;
  }

  .lock-remote-form-btn:active {
    transform: scale(0.95);
  }

  .lock-remote-form-btn.save {
    background: #007aff;
    color: white;
  }

  .lock-remote-form-btn.save:active {
    background: #0056cc;
  }

  .lock-remote-form-btn.cancel {
    background: #f0f0f0;
    color: #333;
  }

  .lock-remote-form-btn.cancel:active {
    background: #e0e0e0;
  }

  body.lock-modal-active {
    touch-action: none !important;
    overflow: hidden !important;
  }

  body.lock-modal-active canvas {
    pointer-events: none !important;
  }

  body.lock-modal-active .lock-remote-modal {
    pointer-events: auto;
  }

  .lock-remote-modal {
    pointer-events: auto !important;
    z-index: 2000;
  }

  .lock-remote-modal-content {
    pointer-events: auto !important;
  }

  .lock-remote-modal.show {
    background-color: rgba(0, 0, 0, 0.5);
    pointer-events: auto !important;
  }

  .lock-remote-modal * {
    pointer-events: auto !important;
  }

  .lock-remote-container:has(.lock-remote-modal.show) .lock-remote-main-button {
    display: none !important;
  }

  .lock-remote-container .lock-remote-main-button {
    display: flex !important;
  }
`;

document.head.appendChild(lockStyle);