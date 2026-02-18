// lock.js - Lock Control Module for 360 Scene Editor with Home Assistant Integration

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
  let currentEditIndex = -1;
  let selectedIcon = 'fa-lock';
  let currentRemoteId = null;
  let currentScene = 'scene1';
  let longPressTimer = null;
  let longPressButton = null;
  let processing = false;
  let isLocked = true;
  let ws = null;
  let ready = false;

  // ========== HOME ASSISTANT CONFIGURATION ==========
  const HA_CONFIG = {
    url: "wss://demo.lumihomepro1.com/api/websocket",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI0OWU5NDM5ZWRjNWM0YTM4OTgzZmE5NzIyNjU0ZjY5MiIsImlhdCI6MTc2ODI5NjI1NSwiZXhwIjoyMDgzNjU2MjU1fQ.5C9sFe538kogRIL63dlwweBJldwhmQ7eoW86GEWls8U",
    connected: false,
    socket: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10, // Increased max attempts
    messageId: 1,
    pendingRequests: new Map(),
    autoReconnect: true,
    reconnectInterval: 3000, // Reduced reconnect interval
    connectionCheckInterval: null
  };
  // ==================================================

  // Initialize WebSocket connection to Home Assistant
  const initWebSocket = () => {
    if (HA_CONFIG.socket && (HA_CONFIG.socket.readyState === WebSocket.OPEN || HA_CONFIG.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    console.log('Connecting to Home Assistant WebSocket:', HA_CONFIG.url);

    try {
      HA_CONFIG.socket = new WebSocket(HA_CONFIG.url);

      HA_CONFIG.socket.onopen = () => {
        console.log('WebSocket connected to Home Assistant');
        HA_CONFIG.reconnectAttempts = 0;

        // Clear any existing connection check interval
        if (HA_CONFIG.connectionCheckInterval) {
          clearInterval(HA_CONFIG.connectionCheckInterval);
        }
      };

      HA_CONFIG.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      HA_CONFIG.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        HA_CONFIG.connected = false;
      };

      HA_CONFIG.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        HA_CONFIG.connected = false;
        ready = false;

        HA_CONFIG.pendingRequests.forEach((request, id) => {
          request.reject(new Error('WebSocket closed'));
        });
        HA_CONFIG.pendingRequests.clear();

        if (HA_CONFIG.autoReconnect && HA_CONFIG.reconnectAttempts < HA_CONFIG.maxReconnectAttempts) {
          HA_CONFIG.reconnectAttempts++;
          console.log(`Reconnecting attempt ${HA_CONFIG.reconnectAttempts} in ${HA_CONFIG.reconnectInterval / 1000} seconds...`);
          setTimeout(initWebSocket, HA_CONFIG.reconnectInterval);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      HA_CONFIG.connected = false;
    }
  };
const startPeriodicRefresh = () => {
  setInterval(() => {
    if (HA_CONFIG.connected) {
      fetchAllLockStates();
    }
  }, 30000); // Refresh every 30 seconds
};
  // Handle WebSocket messages from Home Assistant
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'auth_required':
        console.log('Authentication required');
        const authMessage = {
          type: 'auth',
          access_token: HA_CONFIG.token
        };
        HA_CONFIG.socket.send(JSON.stringify(authMessage));
        break;

case 'auth_ok':
  console.log('Authentication successful');
  HA_CONFIG.connected = true;
  ready = true;
  HA_CONFIG.reconnectAttempts = 0;

  // Get initial states immediately
  setTimeout(() => {
    fetchAllLockStates();
  }, 500); // Small delay to ensure connection is fully ready

  // Subscribe to state changes
  setTimeout(() => {
    if (HA_CONFIG.socket && HA_CONFIG.socket.readyState === WebSocket.OPEN) {
      HA_CONFIG.socket.send(JSON.stringify({
        id: HA_CONFIG.messageId++,
        type: "subscribe_events",
        event_type: "state_changed"
      }));
      
      // Fetch states again after subscription to be sure
      setTimeout(fetchAllLockStates, 200);
    }
  }, 100);
  startPeriodicRefresh();
  break;
      case 'auth_invalid':
        console.error('Authentication failed:', message.message);
        HA_CONFIG.connected = false;
        ready = false;
        HA_CONFIG.socket.close();
        break;

      case 'result':
        const pendingRequest = HA_CONFIG.pendingRequests.get(message.id);
        if (pendingRequest) {
          HA_CONFIG.pendingRequests.delete(message.id);
          if (message.success) {
            pendingRequest.resolve(message);

            // Handle get_states result
            if (message.id && message.result) {
              updateLockStatesFromResult(message.result);
            }
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

  // Fetch all lock states
  const fetchAllLockStates = () => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
      console.log('HA not connected, cannot fetch states');
      return;
    }

    const messageId = HA_CONFIG.messageId++;
    const message = {
      id: messageId,
      type: 'get_states'
    };

    HA_CONFIG.socket.send(JSON.stringify(message));
  };

const updateLockStatesFromResult = (states) => {
  console.log('Updating lock states from result');
  remotesData.forEach((remoteData, remoteId) => {
    const entityId = remoteData.config.entityId;
    if (entityId) {
      const lock = states.find(e => e.entity_id === entityId);
      if (lock) {
        const locked = lock.state === "locked";
        remoteData.isLocked = locked;
        remoteData.processing = false;
        // Force UI update for this specific remote
        updateLockUI(remoteId, locked, false);
        console.log(`Lock ${entityId} state: ${locked ? 'LOCKED' : 'UNLOCKED'}`);
        
        // Also update the toggle switch state
        const lockToggle = document.getElementById(`${remoteId}-lockToggle`);
        if (lockToggle) {
          lockToggle.checked = locked;
        }
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

  // Update Lock UI - centralized function
  const updateLockUI = (remoteId, locked, isProcessing) => {
    const lockToggle = document.getElementById(`${remoteId}-lockToggle`);
    const lockStatus = document.getElementById(`${remoteId}-lockStatus`);
    const mainButton = document.getElementById(`${remoteId}-mainButton`);
    const lockSwitchElement = document.getElementById(`${remoteId}-lockSwitch`);

    if (lockToggle) lockToggle.checked = locked;

    if (lockStatus) {
      if (isProcessing) {
        lockStatus.textContent = 'PROCESSING...';
        lockStatus.className = 'lock-status processing';
        lockStatus.style.color = '#ff9900';
      } else {
        lockStatus.textContent = locked ? 'LOCKED' : 'UNLOCKED';
        lockStatus.className = 'lock-status';
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
      } else if (locked) {
        mainButton.classList.add('locked');
        mainButton.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
        mainButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
      } else {
        mainButton.classList.add('unlocked');
        mainButton.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.3)';
        mainButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
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

  const fetchInitialLockState = async (remoteId, entityId, retryCount = 0) => {
  if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
    console.log('HA not connected, cannot fetch initial state for', entityId);
    
    // Try again after delay if within retry limit
    if (retryCount < 5) {
      setTimeout(() => {
        fetchInitialLockState(remoteId, entityId, retryCount + 1);
      }, 1000);
    }
    return;
  }

  const messageId = HA_CONFIG.messageId++;
  const message = {
    id: messageId,
    type: 'get_states'
  };

  try {
    const response = await new Promise((resolve, reject) => {
      HA_CONFIG.pendingRequests.set(messageId, { resolve, reject });
      HA_CONFIG.socket.send(JSON.stringify(message));
      
      setTimeout(() => {
        if (HA_CONFIG.pendingRequests.has(messageId)) {
          HA_CONFIG.pendingRequests.delete(messageId);
          reject(new Error('Timeout fetching states'));
        }
      }, 10000);
    });

    if (response.success && response.result) {
      const lock = response.result.find(e => e.entity_id === entityId);
      if (lock) {
        const isLocked = lock.state === "locked";
        const remoteData = remotesData.get(remoteId);
        if (remoteData) {
          remoteData.isLocked = isLocked;
          remoteData.processing = false;
          updateLockUI(remoteId, isLocked, false);
          
          // Force toggle switch update
          const lockToggle = document.getElementById(`${remoteId}-lockToggle`);
          if (lockToggle) {
            lockToggle.checked = isLocked;
          }
          
          console.log(`Lock state for ${entityId}: ${isLocked ? 'LOCKED' : 'UNLOCKED'}`);
        }
      } else {
        console.log(`Lock entity ${entityId} not found, retrying...`);
        if (retryCount < 5) {
          setTimeout(() => {
            fetchInitialLockState(remoteId, entityId, retryCount + 1);
          }, 1000);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching initial lock state:', error);
    if (retryCount < 5) {
      setTimeout(() => {
        fetchInitialLockState(remoteId, entityId, retryCount + 1);
      }, 1000);
    }
  }
};


  // Call service via WebSocket
  const callService = (domain, service, data) => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
      console.warn('Home Assistant not connected');
      return Promise.reject('Not connected');
    }

    const messageId = HA_CONFIG.messageId++;
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

      // Increased timeout to 10 seconds for lock operations
      setTimeout(() => {
        if (HA_CONFIG.pendingRequests.has(messageId)) {
          HA_CONFIG.pendingRequests.delete(messageId);
          reject(new Error('Command timeout - lock may still be processing'));
        }
      }, 10000);
    });
  };

  // Function to enable body for 3D rotation
  const enableBodyRotation = () => {
    document.body.classList.remove('lock-modal-active');
  };

  // Function to disable body for 3D rotation
  const disableBodyRotation = () => {
    document.body.classList.add('lock-modal-active');
  };

  // Show main panel
  const showMainPanel = (remoteId) => {
    const panelMain = document.getElementById(`${remoteId}-panelMain`);
    const panelEdit = document.getElementById(`${remoteId}-panelEdit`);

    if (panelMain && panelEdit) {
      panelMain.classList.remove('hidden');
      panelEdit.classList.add('hidden');
    }
  };

  // Create HTML structure for lock remote modal
  const createRemoteModal = (position, targetScene, configOverride = null) => {
    const remoteId = `lock-remote-${instanceId++}`;

    // Use provided config or defaults
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
        <i class="fas ${config.icon} icon" id="${remoteId}-lockIcon"></i>
      </button>

      <!-- Main Modal -->
      <div class="lock-remote-modal" id="${remoteId}-modal">
        <div class="lock-remote-modal-content">
          <button class="lock-remote-close-btn" id="${remoteId}-closeModal">
            <i class="fas fa-times"></i>
          </button>
          
          <button class="lock-remote-edit-btn" id="${remoteId}-editBtn">
            <i class="fas fa-edit" style="display:none;"></i>
          </button>

          <div class="lock-remote-title" id="${remoteId}-modalTitle">${config.friendlyName}</div>

          <!-- Panel 1: Main lock control -->
          <div id="${remoteId}-panelMain" class="lock-remote-panel">
            <div class="lock-switch-container">
              <label class="lock-switch" id="${remoteId}-lockSwitch">
                <input type="checkbox" id="${remoteId}-lockToggle" checked />
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
                <label class="lock-remote-form-label">Button Icon (long press)</label>
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
      isLocked: null, // Start with null (unknown state)
      processing: false,
      container: container,
      visible: true,
      isEditMode: false
    });
    // Initialize the modal
    initRemoteModal(remoteId);

    // Fetch initial lock state if HA is connected, otherwise set default
    setTimeout(() => {
      if (HA_CONFIG.connected && config.entityId) {
        setTimeout(() => {
          fetchInitialLockState(remoteId, config.entityId);
        }, 100);
      } else {
        // Default to unlocked state with red glow
        updateLockUI(remoteId, false, false);
      }
    }, 500);

    return remoteId;
  };

  // Initialize a remote modal
  const initRemoteModal = (remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    // Get DOM elements
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

    // Setup event listeners
    setupEventListeners(remoteId, modal, panelMain, panelEdit,
      mainButton, closeModalBtn, editBtn, cancelEditBtn, saveButton,
      lockSwitch, lockToggle, lockStatus, entityIdInput, friendlyNameInput,
      modalTitle, iconGrid, remoteData);
  };

  // Populate icon selection grid
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

  // Send lock/unlock command to Home Assistant
  const sendLockCommand = (remoteId, shouldLock) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
      console.warn('Home Assistant not connected');
      alert('Home Assistant not connected');

      // Toggle locally for demo purposes
      remoteData.isLocked = shouldLock;
      updateLockUI(remoteId, shouldLock, false);
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

    const service = shouldLock ? 'lock' : 'unlock';
    const serviceData = { entity_id: entityId };

    callService('lock', service, serviceData)
      .then(result => {
        console.log('Lock command sent successfully:', result);
        // State will be updated via state_changed event
      })
      .catch(error => {
        console.error('Failed to send lock command:', error);
        alert('Failed to send command: ' + error.message);

        // Reset processing state on error
        remoteData.processing = false;
        updateLockUI(remoteId, remoteData.isLocked, false);
      });
  };

  // Reset edit form
  const resetEditForm = (remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    document.getElementById(`${remoteId}-entityId`).value = remoteData.config.entityId;
    document.getElementById(`${remoteId}-friendlyName`).value = remoteData.config.friendlyName;

    // Reset icon selection
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

    // Update config
    remoteData.config.entityId = entityId;
    remoteData.config.friendlyName = friendlyName || 'Lock Control';
    remoteData.config.icon = selectedIcon;

    // Update UI
    document.getElementById(`${remoteId}-modalTitle`).textContent = remoteData.config.friendlyName;

    const mainButtonIcon = document.querySelector(`#${remoteId}-mainButton i`);
    if (mainButtonIcon) {
      mainButtonIcon.className = `${selectedIcon} icon`;
    }

    // Exit edit mode
    exitEditMode(remoteId);

    // Save to localStorage for persistence across sessions
    try {
      localStorage.setItem(`lockConfig_${remoteId}`, JSON.stringify(remoteData.config));
    } catch (e) { }

    console.log('Lock configuration saved:', remoteData.config);

    // Fetch initial state for the new entity
    if (HA_CONFIG.connected && entityId) {
      fetchInitialLockState(remoteId, entityId);
    } else {
      updateLockUI(remoteId, false, false);
    }
  };

  // Exit edit mode
  const exitEditMode = (remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    remoteData.isEditMode = false;

    document.getElementById(`${remoteId}-panelEdit`).classList.add('hidden');
    document.getElementById(`${remoteId}-panelMain`).classList.remove('hidden');
  };

  // Setup all event listeners
  const setupEventListeners = (remoteId, modal, panelMain, panelEdit,
    mainButton, closeModalBtn, editBtn, cancelEditBtn, saveButton,
    lockSwitch, lockToggle, lockStatus, entityIdInput, friendlyNameInput,
    modalTitle, iconGrid, remoteData) => {

    // Open modal
    const openModal = () => {
      modal.classList.add('show');
      mainButton.classList.add('active-main');
      mainButton.style.display = 'none';
      document.body.classList.add('lock-modal-active');
      showMainPanel(remoteId);
      disableBodyRotation();
    };

    mainButton.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal();
    });

    mainButton.addEventListener('touchend', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openModal();
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

    // Edit button - enter edit mode
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
      exitEditMode(remoteId);
    });

    cancelEditBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      exitEditMode(remoteId);
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

    // Lock switch click
    lockSwitch.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // If already processing, ignore
      if (remoteData.processing) {
        console.log('Already processing, ignoring click');
        return;
      }

      const newState = !lockToggle.checked;
      lockToggle.checked = newState;
      sendLockCommand(remoteId, newState);
    });

    // Long press on main button for edit - 800ms hold
    let longPressTimer = null;

    const startLongPress = (e) => {
      e.preventDefault();
      if (longPressTimer) clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => {
        openModal();
        // After modal opens, show edit panel
        setTimeout(() => {
          resetEditForm(remoteId);
          remoteData.isEditMode = true;
          panelMain.classList.add('hidden');
          panelEdit.classList.remove('hidden');
        }, 100);
        longPressTimer = null;
      }, 8000); // hold-edit
    };

    const cancelLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    mainButton.addEventListener('mousedown', startLongPress);
    mainButton.addEventListener('mouseup', cancelLongPress);
    mainButton.addEventListener('mouseleave', cancelLongPress);
    mainButton.addEventListener('touchstart', startLongPress);
    mainButton.addEventListener('touchend', cancelLongPress);
    mainButton.addEventListener('touchcancel', cancelLongPress);

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

    // Prevent propagation for form elements
    const formElements = [entityIdInput, friendlyNameInput];

    formElements.forEach(input => {
      if (input) {
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('touchstart', (e) => e.stopPropagation());
        input.addEventListener('touchend', (e) => e.stopPropagation());
      }
    });

    // Fix input field click issues
    [entityIdInput, friendlyNameInput].forEach(input => {
      if (input) {
        input.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        input.addEventListener('touchend', (e) => {
          e.stopPropagation();
          e.preventDefault();
          input.focus();
        });

        input.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });

        input.addEventListener('touchstart', (e) => {
          e.stopPropagation();
        });
      }
    });

    // Load saved config from localStorage
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
    } catch (e) { }
  };

  // Initialize WebSocket on module load
  initWebSocket();

  // Public API
  return {
    // Create a new remote at a specific position
    createRemote: (position, targetScene, configOverride = null) => {
      const remoteId = createRemoteModal(position, targetScene, configOverride);
      return {
        id: remoteId,
        position: position,
        targetScene: targetScene || ''
      };
    },

    // Force refresh all lock states
    refreshAllLockStates: () => {
      if (HA_CONFIG.connected) {
        fetchAllLockStates();
      }
    },

    // Open remote modal
    openRemoteModal: (remoteId) => {
      const modal = document.getElementById(`${remoteId}-modal`);
      const mainButton = document.getElementById(`${remoteId}-mainButton`);
      if (modal && mainButton) {
        modal.classList.add('show');
        mainButton.classList.add('active-main');
        mainButton.style.display = 'none';
        document.body.classList.add('lock-modal-active');
        disableBodyRotation();
      }
    },

    // Delete a remote by ID
    deleteRemote: (remoteId) => {
      const container = document.getElementById(remoteId);
      if (container) {
        container.remove();
      }
      return remotesData.delete(remoteId);
    },

    // Get remote data for saving
    getRemotesData: () => {
      const remotes = [];
      remotesData.forEach(remoteData => {
        remotes.push({
          id: remoteData.id,
          position: remoteData.position.toArray ? remoteData.position.toArray() : remoteData.position,
          targetScene: remoteData.targetScene || '',
          config: {
            entityId: remoteData.config.entityId,
            friendlyName: remoteData.config.friendlyName,
            icon: remoteData.config.icon
          }
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
      document.querySelectorAll('.lock-remote-container').forEach(el => el.remove());
      remotesData.clear();

      // Create new remotes with saved config data
      remotesDataArray.forEach(remoteData => {
        const position = Array.isArray(remoteData.position) ?
          new THREE.Vector3().fromArray(remoteData.position) : remoteData.position;

        // Create remote with saved config
        createRemoteModal(position, remoteData.targetScene || '', remoteData.config);
      });

      // After all remotes are created, fetch their initial states if HA is connected
      if (HA_CONFIG.connected) {
        setTimeout(() => {
          fetchAllLockStates();
        }, 1000);
} else {
  // Set default states for all remotes
  setTimeout(() => {
    remotesData.forEach((data, remoteId) => {
      updateLockUI(remoteId, false, false);
    });
  }, 500);
}
    },

    // Clear all remotes
    clearRemotes: () => {
      document.querySelectorAll('.lock-remote-container').forEach(el => el.remove());
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
            container.style.display = 'block';
            container.style.pointerEvents = 'auto';
          }
        }
      });
    },

    // Home Assistant functions
    getHAConfig: () => {
      return {
        url: HA_CONFIG.url,
        connected: HA_CONFIG.connected,
        socketState: HA_CONFIG.socket ? HA_CONFIG.socket.readyState : 'CLOSED'
      };
    },

    testHAConnection: () => {
      return new Promise((resolve) => {
        if (HA_CONFIG.connected) {
          resolve({ success: true, message: 'Already connected' });
        } else {
          initWebSocket();
          setTimeout(() => {
            resolve({ success: HA_CONFIG.connected, message: HA_CONFIG.connected ? 'Connected' : 'Failed to connect' });
          }, 3000);
        }
      });
    },

    callHAService: (domain, service, data) => {
      return callService(domain, service, data);
    },

    // Initialize Home Assistant connection
    initHomeAssistant: async () => {
      console.log('Initializing Home Assistant WebSocket connection...');
      initWebSocket();

      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (HA_CONFIG.connected) {
            clearInterval(checkConnection);
            resolve({ success: true, message: 'Connected to Home Assistant' });
          }
        }, 1000);

        setTimeout(() => {
          clearInterval(checkConnection);
          resolve({ success: false, message: 'Connection timeout' });
        }, 10000);
      });
    },

    // Close WebSocket connection
    disconnectHomeAssistant: () => {
      if (HA_CONFIG.socket) {
        HA_CONFIG.autoReconnect = false;
        HA_CONFIG.socket.close();
        HA_CONFIG.connected = false;
        ready = false;
        console.log('Home Assistant WebSocket disconnected');
      }
    },

    // Reconnect WebSocket connection
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
    margin-bottom: 25px;
    text-align: center;
    width: 100%;
  }

  .lock-remote-panel {
    width: 100%;
  }

  .lock-remote-panel.hidden {
    display: none !important;
  }

  /* Lock Switch Styles - Exact original design */
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
    background: #ffb347 !important;  /* orange */
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
    width: 18px;
    height: 12px;
    left: 3px;
    bottom: 17px;
    position: absolute;
    z-index: 1;
    transform-origin: 0 100%;
    transition: all 0.45s ease;
    transform: rotate(-35deg) translate(0, 3px);
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
  
  .lock-switch :before,
  .lock-switch :after {
    box-sizing: border-box;
  }

  .lock-status {
    font-size: 14px;
    margin-top: 10px;
    color: #333;
    text-align: center;
    font-weight: bold;
    width: 100%;
    margin-bottom: 20px;
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

  /* Body state when modal is open */
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

  /* Hide main button when modal is open */
  .lock-remote-container:has(.lock-remote-modal.show) .lock-remote-main-button {
    display: none !important;
  }

  .lock-remote-container .lock-remote-modal.show ~ .lock-remote-main-button {
    display: none !important;
  }

  .lock-remote-container .lock-remote-main-button {
    display: flex !important;
  }
`;

document.head.appendChild(lockStyle);