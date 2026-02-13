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
    { name: "Switch 1", icon: 'fas fa-sliders-h', entityId: "", active: false, state: null, _lastToggle: 0 },
    { name: "Switch 2", icon: 'fas fa-lightbulb', entityId: "", active: false, state: null, _lastToggle: 0 },
    { name: "Switch 3", icon: 'fas fa-power-off', entityId: "", active: false, state: null, _lastToggle: 0 },
    { name: "Switch 4", icon: 'fas fa-plug', entityId: "", active: false, state: null, _lastToggle: 0 },
    { name: "Switch 5", icon: 'fas fa-tv', entityId: "", active: false, state: null, _lastToggle: 0 },
    { name: "Switch 6", icon: 'fas fa-fan', entityId: "", active: false, state: null, _lastToggle: 0 }
  ];

  let instanceId = 1;
  let remotesData = new Map();
  let currentEditIndex = -1;
  let selectedIcon = 'fas fa-sliders-h';
  let currentRemoteId = null;
  let currentScene = 'scene1';
  
  // ========== HOME ASSISTANT CONFIGURATION ==========
  const HA_CONFIG = {
    url: "https://demo.lumihomepro1.com",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI0OWU5NDM5ZWRjNWM0YTM4OTgzZmE5NzIyNjU0ZjY5MiIsImlhdCI6MTc2ODI5NjI1NSwiZXhwIjoyMDgzNjU2MjU1fQ.5C9sFe538kogRIL63dlwweBJldwhmQ7eoW86GEWls8U",
    connected: false,
    socket: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    messageId: 1,
    pendingRequests: new Map(),
    autoReconnect: true,
    reconnectInterval: 5000
  };
  // ==================================================

  // Convert HTTP URL to WebSocket URL
  function convertToWebSocketUrl(httpUrl) {
    if (httpUrl.startsWith('https://')) {
      return httpUrl.replace('https://', 'wss://') + '/api/websocket';
    } else if (httpUrl.startsWith('http://')) {
      return httpUrl.replace('http://', 'ws://') + '/api/websocket';
    } else if (httpUrl.startsWith('ws://') || httpUrl.startsWith('wss://')) {
      return httpUrl;
    } else {
      return 'wss://' + httpUrl + '/api/websocket';
    }
  }

  // Initialize WebSocket connection to Home Assistant
  const initWebSocket = () => {
    if (HA_CONFIG.socket && (HA_CONFIG.socket.readyState === WebSocket.OPEN || HA_CONFIG.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    const wsUrl = convertToWebSocketUrl(HA_CONFIG.url);
    console.log('Connecting to Home Assistant WebSocket:', wsUrl);
    
    try {
      HA_CONFIG.socket = new WebSocket(wsUrl);
      
      HA_CONFIG.socket.onopen = () => {
        console.log('WebSocket connected to Home Assistant');
        HA_CONFIG.reconnectAttempts = 0;
        
        // Send authentication message
        const authMessage = {
          type: 'auth',
          access_token: HA_CONFIG.token
        };
        
        HA_CONFIG.socket.send(JSON.stringify(authMessage));
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
        updateAllSwitchStates(false);
        
        // Clear pending requests
        HA_CONFIG.pendingRequests.forEach((request, id) => {
          request.reject(new Error('WebSocket closed'));
        });
        HA_CONFIG.pendingRequests.clear();
        
        // Attempt to reconnect
        if (HA_CONFIG.autoReconnect && HA_CONFIG.reconnectAttempts < HA_CONFIG.maxReconnectAttempts) {
          HA_CONFIG.reconnectAttempts++;
          console.log(`Reconnecting attempt ${HA_CONFIG.reconnectAttempts} in ${HA_CONFIG.reconnectInterval/1000} seconds...`);
          setTimeout(initWebSocket, HA_CONFIG.reconnectInterval);
        }
      };
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      HA_CONFIG.connected = false;
    }
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
        HA_CONFIG.reconnectAttempts = 0;
        
        // Subscribe to state changes
        subscribeToStateChanges();
        
        // Fetch initial states for all entities
        fetchAllEntityStates();
        break;
        
      case 'auth_invalid':
        console.error('Authentication failed:', message.message);
        HA_CONFIG.connected = false;
        HA_CONFIG.socket.close();
        break;
        
      case 'event':
        if (message.event && message.event.event_type === 'state_changed') {
          const entityId = message.event.data.entity_id;
          const newState = message.event.data.new_state;
          
          // Update all switches with this entity ID
          updateSwitchState(entityId, newState);
        }
        break;
        
      case 'result':
        // Handle command results
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
    }
  };

  // Subscribe to state changes
  const subscribeToStateChanges = () => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) return;
    
    const subscribeMessage = {
      id: HA_CONFIG.messageId++,
      type: 'subscribe_events',
      event_type: 'state_changed'
    };
    
    return sendWebSocketMessage(subscribeMessage);
  };

  // Fetch initial states for all entities
  const fetchAllEntityStates = async () => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) return;
    
    try {
      const states = await getStatesViaWebSocket();
      if (states && Array.isArray(states)) {
        console.log('Received initial states:', states.length, 'entities');
        
        // Reset all switch states first
        remotesData.forEach((remoteData, remoteId) => {
          remoteData.switches.forEach((sw, index) => {
            if (sw.entityId) {
              remoteData.switches[index].active = false;
            }
          });
        });
        
        // Update states for all configured entities
        remotesData.forEach((remoteData, remoteId) => {
          remoteData.switches.forEach((sw, index) => {
            if (sw.entityId) {
              const entity = states.find(e => e.entity_id === sw.entityId);
              if (entity) {
                updateSwitchStateFromHA(sw.entityId, entity.state);
              }
            }
          });
        });
        
        // Update visual state after all initial states are processed
        setTimeout(() => {
          remotesData.forEach((remoteData, remoteId) => {
            remoteData.switches.forEach((sw, index) => {
              updateSwitchVisualState(remoteId, index, sw.active);
            });
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching initial states:', error);
    }
  };

  // Get entity state via WebSocket
  const getEntityStateViaWebSocket = (entityId) => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) return Promise.resolve(null);
    
    return getStatesViaWebSocket()
      .then(states => {
        if (states && Array.isArray(states)) {
          return states.find(e => e.entity_id === entityId) || null;
        }
        return null;
      })
      .catch(error => {
        console.error('Error getting entity state:', error);
        return null;
      });
  };

  // Get all states via WebSocket
  const getStatesViaWebSocket = () => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) return Promise.reject(new Error('Not connected'));
    
    const getStatesMessage = {
      id: HA_CONFIG.messageId++,
      type: 'get_states'
    };
    
    return sendWebSocketMessage(getStatesMessage)
      .then(result => result.result)
      .catch(error => {
        console.error('Error getting states:', error);
        throw error;
      });
  };

  // Send WebSocket message and wait for response
  const sendWebSocketMessage = (message) => {
    return new Promise((resolve, reject) => {
      if (!HA_CONFIG.socket || HA_CONFIG.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      HA_CONFIG.pendingRequests.set(message.id, { resolve, reject });
      HA_CONFIG.socket.send(JSON.stringify(message));
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (HA_CONFIG.pendingRequests.has(message.id)) {
          HA_CONFIG.pendingRequests.delete(message.id);
          reject(new Error('WebSocket timeout'));
        }
      }, 5000);
    });
  };

  // Update switch state when entity state changes
  const updateSwitchState = (entityId, newState) => {
    remotesData.forEach((remoteData, remoteId) => {
      remoteData.switches.forEach((sw, index) => {
        if (sw.entityId === entityId && newState) {
          updateSwitchStateFromHA(entityId, newState.state);
        }
      });
    });
  };

  // Update switch state from Home Assistant (REAL source of truth)
  const updateSwitchStateFromHA = (entityId, state) => {
    console.log(`HA Update: ${entityId} -> ${state}`);
    
    // Parse state correctly
    let isOn = false;
    
    if (typeof state === 'string') {
      state = state.toLowerCase().trim();
      isOn = state === 'on' || state === 'true' || state === '1' || state === 'yes' || state === 'unlocked' || state === 'open';
    } else if (typeof state === 'boolean') {
      isOn = state;
    } else if (typeof state === 'number') {
      isOn = state > 0;
    }
    
    console.log(`Parsed state for ${entityId}: ${isOn ? 'ON' : 'OFF'}`);
    
    // Find all switches with this entityId
    remotesData.forEach((remoteData, remoteId) => {
      remoteData.switches.forEach((sw, index) => {
        if (sw.entityId === entityId) {
          // Only update if different from current state
          if (sw.active !== isOn) {
            remoteData.switches[index].active = isOn;
            updateSwitchVisualState(remoteId, index, isOn);
            console.log(`Updated switch ${index} (${sw.name}) to ${isOn ? 'ON' : 'OFF'}`);
          }
        }
      });
    });
  };

  // Update switch visual state
  const updateSwitchVisualState = (remoteId, index, isActive) => {
    const switchBtn = document.querySelector(`#${remoteId}-switchGrid .remote-switch-button[data-index="${index}"]`);
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
  };

  // Update all switch states (used when disconnecting)
  const updateAllSwitchStates = (connected) => {
    remotesData.forEach((remoteData, remoteId) => {
      remoteData.switches.forEach((sw, index) => {
        if (!connected) {
          remoteData.switches[index].active = false;
          updateSwitchVisualState(remoteId, index, false);
        }
      });
    });
  };

  // Call Home Assistant service via WebSocket
  const callHAService = async (entityId, service, data = {}) => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
      console.error('Home Assistant not connected');
      return { success: false, message: 'Home Assistant not connected' };
    }
    
    const domain = entityId.split('.')[0];
    
    try {
      const result = await callServiceViaWebSocket(domain, service, { entity_id: entityId, ...data });
      return { success: true, message: 'Service call successful', result };
    } catch (error) {
      console.error('Service call failed:', error);
      return { success: false, message: error.message || 'Service call failed' };
    }
  };

  // Call service via WebSocket
  const callServiceViaWebSocket = (domain, service, serviceData) => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
      return Promise.reject(new Error('Not connected'));
    }
    
    const callServiceMessage = {
      id: HA_CONFIG.messageId++,
      type: 'call_service',
      domain: domain,
      service: service,
      service_data: serviceData
    };
    
    console.log(`Calling service: ${domain}.${service}`, serviceData);
    
    return sendWebSocketMessage(callServiceMessage);
  };

  // Test Home Assistant connection
  const testHAConnection = async () => {
    if (!HA_CONFIG.url || !HA_CONFIG.token) {
      console.error('Home Assistant URL or Token missing in configuration');
      return { success: false, message: 'Home Assistant not configured' };
    }
    
    if (HA_CONFIG.connected && HA_CONFIG.socket && HA_CONFIG.socket.readyState === WebSocket.OPEN) {
      return { success: true, message: 'Already connected to Home Assistant' };
    }
    
    // Initialize WebSocket connection
    initWebSocket();
    
    // Wait for connection
    return new Promise((resolve) => {
      const checkConnection = setInterval(() => {
        if (HA_CONFIG.connected) {
          clearInterval(checkConnection);
          resolve({ success: true, message: 'Connected to Home Assistant via WebSocket' });
        } else if (HA_CONFIG.socket && HA_CONFIG.socket.readyState === WebSocket.CLOSED) {
          clearInterval(checkConnection);
          resolve({ success: false, message: 'Failed to connect to Home Assistant' });
        }
      }, 1000);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkConnection);
        if (!HA_CONFIG.connected) {
          resolve({ success: false, message: 'Connection timeout' });
        }
      }, 10000);
    });
  };
// Create HTML structure for remote modal
const createRemoteModal = (position, targetScene, switchesOverride = null) => {
  const remoteId = `remote-${instanceId++}`;
  
  // Create switches for this remote - use provided switches or defaults
  const switches = switchesOverride || JSON.parse(JSON.stringify(DEFAULT_SWITCHES));
  
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
      switchBtn.dataset.remoteId = remoteId;

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

      // Add event listeners for this switch
      setupSwitchEventListeners(switchBtn, index, switchesData, remoteId);
    });
  };

// Setup event listeners for a switch
const setupSwitchEventListeners = (switchBtn, index, switchesData, remoteId) => {
  const LONG_PRESS_DURATION = 1500; // 1.5 seconds for edit mode
  let pressTimer = null;
  let isLongPress = false;
  let touchStartTime = 0;
  let touchMoved = false;

  // Clean function to clear timer
  const clearPressTimer = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    isLongPress = false;
    touchMoved = false;
  };

  // Mouse click event for desktop
  switchBtn.addEventListener('click', (e) => {
    // Only process if not from touch device or it's a mouse click
    if (!('ontouchstart' in window) || e.pointerType === "mouse") {
      e.stopPropagation();
      e.preventDefault();
      
      // Clear any pending long press timer
      clearPressTimer();
      
      // Immediate toggle for click
      toggleSwitch(index, switchBtn, switchesData, remoteId);
    }
  });

  // Mouse events for desktop long press (1.5 seconds for edit)
  switchBtn.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left mouse button only
      isLongPress = false;
      touchMoved = false;
      
      // Set timer for long press
      pressTimer = setTimeout(() => {
        isLongPress = true;
        openEditModal(index, remoteId);
      }, LONG_PRESS_DURATION);
    }
  });

  switchBtn.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      clearPressTimer();
      
      // If it wasn't a long press and we're on desktop, toggle immediately
      // But ONLY if the click event didn't already handle it
      // Note: We're letting the click event handle toggling
    }
  });

  switchBtn.addEventListener('mouseleave', () => {
    clearPressTimer();
  });

  // Touch events for mobile
  switchBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    touchStartTime = Date.now();
    isLongPress = false;
    touchMoved = false;
    
    // Set timer for long press
    pressTimer = setTimeout(() => {
      isLongPress = true;
      openEditModal(index, remoteId);
    }, LONG_PRESS_DURATION);
  });

  switchBtn.addEventListener('touchend', (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const touchDuration = Date.now() - touchStartTime;
    clearPressTimer();
    
    // Only toggle if it was a short tap (not a long press and not moved)
    if (!isLongPress && !touchMoved && touchDuration < LONG_PRESS_DURATION) {
      // Check if touch ended within button bounds
      const touch = e.changedTouches[0];
      const rect = switchBtn.getBoundingClientRect();
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      // Only toggle if touch ended within button bounds
      if (touchX >= rect.left && touchX <= rect.right && 
          touchY >= rect.top && touchY <= rect.bottom) {
        toggleSwitch(index, switchBtn, switchesData, remoteId);
      }
    }
  });

  switchBtn.addEventListener('touchmove', (e) => {
    e.stopPropagation();
    
    // If finger moved, cancel the long press
    touchMoved = true;
    clearPressTimer();
  });

  switchBtn.addEventListener('touchcancel', () => {
    clearPressTimer();
    isLongPress = false;
    touchMoved = false;
  });

  // Prevent context menu on long press
  switchBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
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
        active: false,
        state: null,
        _lastToggle: 0
      };

      renderSwitches(switchGrid, remote.switches, id);
      closeEditModalFunc();

      // If HA is connected, fetch state for this entity
      if (HA_CONFIG.connected && remote.switches[currentEditIndex].entityId) {
        getEntityStateViaWebSocket(entityId);
      }
    });

    // Fix input field click issues
    [switchNameInput, entityIdInput].forEach(input => {
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
  
  // Check if the switch has a VALID entity ID (not empty string)
  const hasValidEntityId = sw.entityId && sw.entityId.trim() !== "";
  
  if (!hasValidEntityId) {
    // If no valid entity ID is set, open edit modal on tap
    openEditModal(index, remoteId);
    return;
  }

  // Prevent rapid multiple taps
  const now = Date.now();
  if (sw._lastToggle && (now - sw._lastToggle) < 500) {
    console.log("Too fast, ignoring toggle");
    return;
  }
  
  // Get current state for optimistic update
  const currentState = sw.active;
  
  // Optimistic update - show immediate visual feedback
  updateSwitchVisualState(remoteId, index, !currentState);
  
  // Send toggle command via WebSocket
  try {
    await callServiceViaWebSocket(sw.entityId.split('.')[0], 'toggle', { entity_id: sw.entityId });
    console.log(`Toggle successful for ${sw.entityId}`);
    // Update last toggle time
    switchesData[index]._lastToggle = Date.now();
  } catch (error) {
    console.error('Toggle failed:', error);
    // Revert optimistic update on failure
    updateSwitchVisualState(remoteId, index, currentState);
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
// Create a new remote at a specific position
createRemote: (position, targetScene, switchesOverride = null) => {
  const remoteId = createRemoteModal(position, targetScene, switchesOverride);
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
          switches: remoteData.switches.map(sw => ({
            name: sw.name,
            icon: sw.icon,
            entityId: sw.entityId,
            active: sw.active
          }))
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
  
  // Create new remotes with saved switch data
  remotesDataArray.forEach(remoteData => {
    const position = Array.isArray(remoteData.position) ? 
      new THREE.Vector3().fromArray(remoteData.position) : remoteData.position;
    
    // Convert saved switches to proper format
    let savedSwitches = [];
    if (remoteData.switches && Array.isArray(remoteData.switches)) {
      savedSwitches = remoteData.switches.map((sw, index) => ({
        name: sw.name || `Switch ${index + 1}`,
        icon: sw.icon || 'fas fa-sliders-h',
        entityId: sw.entityId || "", // Empty string if not provided
        active: false, // Will be updated from HA
        state: null,
        _lastToggle: 0
      }));
    } else {
      // Use defaults if no switches provided
      savedSwitches = JSON.parse(JSON.stringify(DEFAULT_SWITCHES));
    }
    
    // Create remote with saved switches
    const remoteId = createRemoteModal(position, remoteData.targetScene || '', savedSwitches);
    
    // Update the stored switches with the saved ones
    const remote = remotesData.get(remoteId);
    if (remote) {
      remote.switches = savedSwitches;
      
      // Re-render switches with updated data
      const switchGrid = document.getElementById(`${remoteId}-switchGrid`);
      if (switchGrid) {
        renderSwitches(switchGrid, remote.switches, remoteId);
      }
    }
  });
  
  // If HA is connected, fetch states for all loaded entities
  if (HA_CONFIG.connected) {
    fetchAllEntityStates();
  }
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
        container.style.display = 'block'; // Add this line
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

    testHAConnection: testHAConnection,

    callHAService: callHAService,

    // Sync all switches with Home Assistant state
    syncWithHA: async () => {
      if (!HA_CONFIG.connected) {
        console.log('Home Assistant not connected, attempting to connect...');
        const result = await testHAConnection();
        if (!result.success) {
          return { success: false, message: 'Failed to connect to HA' };
        }
      }
      
      // Fetch all entity states
      await fetchAllEntityStates();
      return { success: true, message: 'Sync completed' };
    },

    // Initialize Home Assistant connection (WebSocket)
    initHomeAssistant: async () => {
      console.log('Initializing Home Assistant WebSocket connection...');
      
      // Initialize WebSocket connection
      initWebSocket();
      
      // Wait for connection
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (HA_CONFIG.connected) {
            clearInterval(checkConnection);
            resolve({ success: true, message: 'Connected to Home Assistant via WebSocket' });
          } else if (HA_CONFIG.socket && (HA_CONFIG.socket.readyState === WebSocket.CLOSED || HA_CONFIG.socket.readyState === WebSocket.CLOSING)) {
            clearInterval(checkConnection);
            resolve({ success: false, message: 'Failed to connect to Home Assistant' });
          }
        }, 1000);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkConnection);
          if (!HA_CONFIG.connected) {
            resolve({ success: false, message: 'Connection timeout' });
          }
        }, 10000);
      });
    },

    // Close WebSocket connection
    disconnectHomeAssistant: () => {
      if (HA_CONFIG.socket) {
        HA_CONFIG.autoReconnect = false;
        HA_CONFIG.socket.close();
        HA_CONFIG.connected = false;
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
// In setupEventListeners function, add these lines:

// Open main modal - click for desktop
mainButton.addEventListener('click', (e) => {
  e.stopPropagation();
  e.preventDefault();
  modal.classList.add('show');
  mainButton.classList.add('active-main');
  mainButton.style.display = 'none'; // Hide main button
});

// Close main modal
closeModalBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  modal.classList.remove('show');
  mainButton.classList.remove('active-main');
  mainButton.style.display = 'flex'; // Show main button
});

// Do the same for touch events:
mainButton.addEventListener('touchend', (e) => {
  e.stopPropagation();
  e.preventDefault();
  modal.classList.add('show');
  mainButton.classList.add('active-main');
  mainButton.style.display = 'none'; // Hide main button
});

closeModalBtn.addEventListener('touchend', (e) => {
  e.stopPropagation();
  e.preventDefault();
  modal.classList.remove('show');
  mainButton.classList.remove('active-main');
  mainButton.style.display = 'flex'; // Show main button
});

// Also handle when clicking outside the modal to close
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('show');
    mainButton.classList.remove('active-main');
    mainButton.style.display = 'flex'; // Show main button
  }
});

modal.addEventListener('touchend', (e) => {
  if (e.target === modal) {
    e.preventDefault();
    modal.classList.remove('show');
    mainButton.classList.remove('active-main');
    mainButton.style.display = 'flex'; // Show main button
  }
});

// Also handle edit modal show/hide
const closeEditModalFunc = () => {
  editModal.classList.remove('show');
  currentEditIndex = -1;
  currentRemoteId = null;
  mainButton.style.display = 'flex'; // Show main button when edit modal closes
};

// When opening edit modal, hide main button
const originalOpenEditModal = openEditModal;
window.openEditModal = function(index, remoteId) {
  originalOpenEditModal(index, remoteId);
  mainButton.style.display = 'none'; // Hide main button
};