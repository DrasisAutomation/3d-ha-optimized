// sensor.js - Sensor Module for 360 Scene Editor with Home Assistant Integration

const SensorModule = (() => {
  // Available Font Awesome icons
  const ICONS = [
    { class: 'fas fa-door-open', name: 'Door Open' },
    { class: 'fas fa-door-closed', name: 'Door Closed' },
    { class: 'fas fa-lock', name: 'Lock' },
    { class: 'fas fa-lock-open', name: 'Lock Open' },
    { class: 'fas fa-circle-check', name: 'Check' },
    { class: 'fas fa-circle-exclamation', name: 'Exclamation' },
    { class: 'fas fa-circle-question', name: 'Question' },
    { class: 'fas fa-bell', name: 'Bell' },
    { class: 'fas fa-volume-high', name: 'Volume High' },
    { class: 'fas fa-volume-xmark', name: 'Mute' },
    { class: 'fas fa-lightbulb', name: 'Lightbulb' },
    { class: 'fas fa-bolt', name: 'Bolt' },
    { class: 'fas fa-plug', name: 'Plug' },
    { class: 'fas fa-snowflake', name: 'Snowflake' },
    { class: 'fas fa-fire', name: 'Fire' },
    { class: 'fas fa-fan', name: 'Fan' },
    { class: 'fas fa-wind', name: 'Wind' },
    { class: 'fas fa-droplet', name: 'Droplet' },
    { class: 'fas fa-temperature-high', name: 'Temp High' },
    { class: 'fas fa-temperature-low', name: 'Temp Low' },
    { class: 'fas fa-battery-full', name: 'Battery Full' },
    { class: 'fas fa-battery-quarter', name: 'Battery Low' },
    { class: 'fas fa-wifi', name: 'WiFi' },
    { class: 'fas fa-signal', name: 'Signal' },
    { class: 'fas fa-eye', name: 'Eye' },
    { class: 'fas fa-eye-slash', name: 'Eye Slash' },
    { class: 'fas fa-video', name: 'Video' },
    { class: 'fas fa-camera', name: 'Camera' },
    { class: 'fas fa-microphone', name: 'Mic' },
    { class: 'fas fa-microphone-slash', name: 'Mic Mute' },
    { class: 'fas fa-music', name: 'Music' },
    { class: 'fas fa-film', name: 'Film' },
    { class: 'fas fa-tv', name: 'TV' },
    { class: 'fas fa-display', name: 'Display' },
    { class: 'fas fa-mobile', name: 'Mobile' },
    { class: 'fas fa-clock', name: 'Clock' },
    { class: 'fas fa-calendar', name: 'Calendar' },
    { class: 'fas fa-sun', name: 'Sun' },
    { class: 'fas fa-moon', name: 'Moon' },
    { class: 'fas fa-cloud', name: 'Cloud' },
    { class: 'fas fa-cloud-rain', name: 'Rain' },
    { class: 'fas fa-cloud-sun', name: 'Cloud Sun' },
    { class: 'fas fa-smog', name: 'Smog' },
    { class: 'fas fa-tree', name: 'Tree' },
    { class: 'fas fa-leaf', name: 'Leaf' },
    { class: 'fas fa-water', name: 'Water' },
    { class: 'fas fa-house', name: 'House' },
    { class: 'fas fa-building', name: 'Building' },
    { class: 'fas fa-warehouse', name: 'Warehouse' },
    { class: 'fas fa-person-walking', name: 'Walking' },
    { class: 'fas fa-person-running', name: 'Running' },
    { class: 'fas fa-car', name: 'Car' },
    { class: 'fas fa-bicycle', name: 'Bicycle' },
    { class: 'fas fa-couch', name: 'Couch' },
    { class: 'fas fa-bed', name: 'Bed' },
    { class: 'fas fa-utensils', name: 'Utensils' },
    { class: 'fas fa-kitchen-set', name: 'Kitchen' },
    { class: 'fas fa-shower', name: 'Shower' },
    { class: 'fas fa-soap', name: 'Soap' },
    { class: 'fas fa-key', name: 'Key' },
    { class: 'fas fa-hand', name: 'Hand' },
    { class: 'fas fa-bell-slash', name: 'Bell Mute' },
    { class: 'fas fa-toggle-on', name: 'Toggle On' },
    { class: 'fas fa-toggle-off', name: 'Toggle Off' },
    { class: 'fas fa-power-off', name: 'Power' },
    { class: 'fas fa-download', name: 'Download' }
  ];

  // Available colors
  const AVAILABLE_COLORS = [
    '#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6',
    '#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e'
  ];

  // Default state configurations
  const DEFAULT_STATES = [
    { stateValue: 'on', displayName: 'On', icon: 'fas fa-circle-check', color: '#ef4444' },
    { stateValue: 'off', displayName: 'Off', icon: 'fas fa-circle-check', color: '#22c55e' },
    { stateValue: 'unknown', displayName: 'Unknown', icon: 'fas fa-circle-question', color: '#f59e0b' }
  ];

  // Simple debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  let instanceId = 1;
  let sensorsData = new Map();
  let currentEditIndex = -1;
  let selectedIcon = 'fas fa-circle-check';
  let currentSensorId = null;
  let currentScene = 'scene1';
  let longPressTimer = null;
  let longPressButton = null;

  // ========== HOME ASSISTANT CONFIGURATION ==========
  const HA_CONFIG = {
    url: "wss://demo.lumihomepro1.com/api/websocket",
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

  // Darken color helper function
  const darkenColor = (color, percent) => {
    if (color.startsWith('#')) {
      let r = parseInt(color.slice(1, 3), 16);
      let g = parseInt(color.slice(3, 5), 16);
      let b = parseInt(color.slice(5, 7), 16);

      r = Math.max(0, Math.floor(r * (100 - percent) / 100));
      g = Math.max(0, Math.floor(g * (100 - percent) / 100));
      b = Math.max(0, Math.floor(b * (100 - percent) / 100));

      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  };

  // Initialize WebSocket connection to Home Assistant
  const initWebSocket = () => {
    if (HA_CONFIG.socket && (HA_CONFIG.socket.readyState === WebSocket.OPEN || HA_CONFIG.socket.readyState === WebSocket.CONNECTING)) {
      console.log('Sensor WebSocket already connected or connecting');
      return;
    }

    console.log('Sensor connecting to Home Assistant WebSocket:', HA_CONFIG.url);

    try {
      HA_CONFIG.socket = new WebSocket(HA_CONFIG.url);

      HA_CONFIG.socket.onopen = () => {
        console.log('Sensor WebSocket connected to Home Assistant');
        HA_CONFIG.reconnectAttempts = 0;
        
        // Send authentication
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
          console.error('Error parsing Sensor WebSocket message:', error);
        }
      };

      HA_CONFIG.socket.onerror = (error) => {
        console.error('Sensor WebSocket error:', error);
        HA_CONFIG.connected = false;
      };

      HA_CONFIG.socket.onclose = (event) => {
        console.log('Sensor WebSocket disconnected:', event.code, event.reason);
        HA_CONFIG.connected = false;

        HA_CONFIG.pendingRequests.forEach((request, id) => {
          request.reject(new Error('WebSocket closed'));
        });
        HA_CONFIG.pendingRequests.clear();

        if (HA_CONFIG.autoReconnect && HA_CONFIG.reconnectAttempts < HA_CONFIG.maxReconnectAttempts) {
          HA_CONFIG.reconnectAttempts++;
          console.log(`Sensor reconnecting attempt ${HA_CONFIG.reconnectAttempts} in ${HA_CONFIG.reconnectInterval / 1000} seconds...`);
          setTimeout(initWebSocket, HA_CONFIG.reconnectInterval);
        }
      };

    } catch (error) {
      console.error('Error creating Sensor WebSocket:', error);
      HA_CONFIG.connected = false;
    }
  };

  // Handle WebSocket messages from Home Assistant
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'auth_required':
        console.log('Sensor authentication required');
        const authMessage = {
          type: 'auth',
          access_token: HA_CONFIG.token
        };
        HA_CONFIG.socket.send(JSON.stringify(authMessage));
        break;

      case 'auth_ok':
        console.log('Sensor authentication successful');
        HA_CONFIG.connected = true;
        HA_CONFIG.reconnectAttempts = 0;
        
        // Subscribe to state changes
        if (HA_CONFIG.socket) {
          HA_CONFIG.socket.send(JSON.stringify({
            id: HA_CONFIG.messageId++,
            type: "subscribe_events",
            event_type: "state_changed"
          }));
        }
        
        // Get initial states for all sensors
        sensorsData.forEach((sensorData, sensorId) => {
          if (sensorData.entityId) {
            getEntityState(sensorData.entityId, sensorId);
          }
        });
        break;

      case 'auth_invalid':
        console.error('Sensor authentication failed:', message.message);
        HA_CONFIG.connected = false;
        HA_CONFIG.socket.close();
        break;

      case 'result':
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

  // Handle state change events
  const handleStateChange = (data) => {
    const entityId = data.entity_id;
    const newState = data.new_state?.state;
    
    sensorsData.forEach((sensorData, sensorId) => {
      if (sensorData.entityId === entityId) {
        sensorData.currentState = newState;
        updateSensorDisplay(sensorId);
        updateCurrentStateDisplay(sensorId);
      }
    });
  };

  // Get entity state
  const getEntityState = (entityId, sensorId) => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
      // Update UI to show not connected
      const currentValueEl = document.getElementById(`${sensorId}-currentValue`);
      if (currentValueEl) {
        currentValueEl.textContent = 'Not connected';
        currentValueEl.style.color = '#ef4444';
      }
      return;
    }

    const messageId = HA_CONFIG.messageId++;
    const message = {
      id: messageId,
      type: "get_states"
    };

    HA_CONFIG.socket.send(JSON.stringify(message));

    HA_CONFIG.pendingRequests.set(messageId, {
      resolve: (result) => {
        if (result.success && result.result) {
          const entity = result.result.find(e => e.entity_id === entityId);
          if (entity) {
            const sensorData = sensorsData.get(sensorId);
            if (sensorData) {
              sensorData.currentState = entity.state;
              updateSensorDisplay(sensorId);
              
              // Update current state display in modal
              const currentValueEl = document.getElementById(`${sensorId}-currentValue`);
              if (currentValueEl) {
                currentValueEl.textContent = entity.state;
                currentValueEl.style.color = '#1f2937'; // Reset to normal color
              }
            }
          } else {
            // Entity not found
            const currentValueEl = document.getElementById(`${sensorId}-currentValue`);
            if (currentValueEl) {
              currentValueEl.textContent = 'Entity not found';
              currentValueEl.style.color = '#ef4444';
            }
          }
        }
      },
      reject: (error) => {
        console.error('Failed to get states:', error);
        const currentValueEl = document.getElementById(`${sensorId}-currentValue`);
        if (currentValueEl) {
          currentValueEl.textContent = 'Error fetching';
          currentValueEl.style.color = '#ef4444';
        }
      }
    });
  };

  // Save entity ID with loading indicator
  const saveEntityId = (sensorId) => {
    const sensorData = sensorsData.get(sensorId);
    if (!sensorData) return;

    const entityInput = document.getElementById(`${sensorId}-entityId`);
    if (!entityInput) return;

    const newEntityId = entityInput.value.trim();
    sensorData.entityId = newEntityId;

    // Show loading state
    const currentValueEl = document.getElementById(`${sensorId}-currentValue`);
    if (currentValueEl) {
      currentValueEl.textContent = 'Fetching...';
      currentValueEl.style.color = '#f59e0b';
    }

    // Get current state for new entity
    if (newEntityId && HA_CONFIG.connected) {
      getEntityState(newEntityId, sensorId);
    } else if (!HA_CONFIG.connected && newEntityId) {
      // If not connected to HA, show a warning
      if (currentValueEl) {
        currentValueEl.textContent = 'Not connected to HA';
        currentValueEl.style.color = '#ef4444';
      }
    } else if (!newEntityId) {
      // No entity ID
      if (currentValueEl) {
        currentValueEl.textContent = 'No entity ID';
        currentValueEl.style.color = '#9ca3af';
      }
    }
  };

  // Function to enable body for 3D rotation
  const enableBodyRotation = () => {
    document.body.classList.remove('sensor-modal-active');
  };

  // Function to disable body for 3D rotation
  const disableBodyRotation = () => {
    document.body.classList.add('sensor-modal-active');
  };

  // Show main panel
  const showMainPanel = (sensorId) => {
    const panelGrid = document.getElementById(`${sensorId}-panelGrid`);
    const panelEdit = document.getElementById(`${sensorId}-panelEdit`);
    const deleteConfirmation = document.getElementById(`${sensorId}-deleteConfirmation`);
    
    if (panelGrid && panelEdit) {
      panelGrid.classList.remove('hidden');
      panelEdit.classList.add('hidden');
      if (deleteConfirmation) deleteConfirmation.classList.add('hidden');
    }
    
    document.getElementById(`${sensorId}-modalTitle`).textContent = 'Sensor';
    document.getElementById(`${sensorId}-modalSubtitle`).textContent = 'Smart Sensor';
  };

  // Update sensor display based on current state
  const updateSensorDisplay = (sensorId) => {
    const sensorData = sensorsData.get(sensorId);
    if (!sensorData) return;

    const mainButton = document.getElementById(`${sensorId}-mainButton`);
    const stateName = document.getElementById(`${sensorId}-stateName`);
    const statusDot = document.getElementById(`${sensorId}-statusDot`);
    
    if (!mainButton || !stateName || !statusDot) return;

    const currentState = sensorData.currentState;
    const states = sensorData.states || DEFAULT_STATES;

    // Find matching state configuration
    const match = states.find(s => s.stateValue && currentState && 
                                    s.stateValue.toLowerCase() === currentState.toLowerCase());

    if (match) {
      // Update main button icon
      const iconEl = mainButton.querySelector('i');
      if (iconEl) {
        iconEl.className = match.icon;
        iconEl.style.color = match.color;
      }

      // Update state name (max 9 chars)
      let name = match.displayName || '?';
      if (name.length > 9) name = name.slice(0, 8) + '…';
      stateName.textContent = name;

      // Update status dot
      statusDot.style.backgroundColor = match.color;
      statusDot.style.boxShadow = `0 0 6px ${match.color}`;
      
      // Update main button box shadow
      mainButton.style.boxShadow = `0 0 15px ${match.color}, 0 4px 8px rgba(0,0,0,0.2)`;
    } else {
      // No match found - show unknown
      const iconEl = mainButton.querySelector('i');
      if (iconEl) {
        iconEl.className = 'fas fa-circle-question';
        iconEl.style.color = '#9ca3af';
      }
      stateName.textContent = '?';
      statusDot.style.backgroundColor = '#d1d5db';
      statusDot.style.boxShadow = 'none';
      mainButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    }
  };

  // Update current state display
  const updateCurrentStateDisplay = (sensorId) => {
    const sensorData = sensorsData.get(sensorId);
    if (!sensorData) return;

    const currentValueEl = document.getElementById(`${sensorId}-currentValue`);
    if (currentValueEl) {
      currentValueEl.textContent = sensorData.currentState || 'Unknown';
      currentValueEl.style.color = sensorData.currentState ? '#1f2937' : '#9ca3af';
    }
  };

  // Create HTML structure for sensor modal
  const createSensorModal = (position, targetScene, statesOverride = null, entityIdOverride = null) => {
    const sensorId = `sensor-${instanceId++}`;

    // Create states for this sensor - use provided states or defaults
    const states = statesOverride ? JSON.parse(JSON.stringify(statesOverride)) : JSON.parse(JSON.stringify(DEFAULT_STATES));

    const container = document.createElement('div');
    container.className = 'sensor-container';
    container.id = sensorId;
    container.dataset.position = JSON.stringify(position);
    container.dataset.targetScene = targetScene || '';
    container.dataset.visible = 'true';
    container.setAttribute('data-remote-type', 'sensor');
    container.style.position = 'absolute';
    container.style.zIndex = '1000';
    container.style.pointerEvents = 'auto';
    container.style.transform = 'translate(-50%, -50%)';

    container.innerHTML = `
      <!-- Main Button -->
      <button class="sensor-main-button" id="${sensorId}-mainButton">
        <i class="${states[0]?.icon || 'fas fa-circle-check'}" style="color: ${states[0]?.color || '#3b82f6'};"></i>
        <span class="sensor-state-name" id="${sensorId}-stateName">${states[0]?.displayName || 'Sensor'}</span>
        <div class="sensor-status-dot" id="${sensorId}-statusDot" style="background-color: ${states[0]?.color || '#3b82f6'};"></div>
      </button>

      <!-- Main Modal -->
      <div class="sensor-modal" id="${sensorId}-modal">
        <div class="sensor-modal-content">
          <button class="sensor-close-btn" id="${sensorId}-closeModal">
            <i class="fas fa-times"></i>
          </button>
          
          <button class="sensor-edit-btn" id="${sensorId}-editBtn">
            <i class="fas fa-edit"></i>
          </button>

          <div class="sensor-title" id="${sensorId}-modalTitle">Sensor</div>
          <div class="sensor-subtitle" id="${sensorId}-modalSubtitle">Smart Sensor</div>

          <!-- Panel 1: Info & Current State -->
          <div id="${sensorId}-panelGrid" class="sensor-panel">
            <div class="sensor-entity-section">
              <div class="sensor-entity-label"><i class="fas fa-microchip"></i> Home Assistant Entity</div>
              <div class="sensor-entity-input-group">
                <input type="text" class="sensor-entity-input" id="${sensorId}-entityId" value="${entityIdOverride || ''}" placeholder="e.g. binary_sensor.door">
                <button class="sensor-refresh-entity" id="${sensorId}-refreshEntity" title="Refresh state">
                  <i class="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            
            <div class="sensor-current-state">
              <div class="sensor-current-label">Current State</div>
              <div class="sensor-current-value" id="${sensorId}-currentValue">${entityIdOverride ? 'Fetching...' : 'No entity ID'}</div>
            </div>
            
            <div class="sensor-states-container" id="${sensorId}-statesContainer"></div>
            
            <button class="sensor-add-state-btn" id="${sensorId}-addStateBtn">
              <i class="fas fa-plus"></i> Add State
            </button>
          </div>

          <!-- Panel 2: edit form for states -->
          <div id="${sensorId}-panelEdit" class="sensor-panel hidden">
            <div class="sensor-form" id="${sensorId}-editForm">
              <div class="sensor-form-group">
                <label class="sensor-form-label">State Value (e.g. 'on', 'off')</label>
                <input type="text" class="sensor-form-input" id="${sensorId}-stateValue" placeholder="on">
              </div>

              <div class="sensor-form-group">
                <label class="sensor-form-label">Display Name (max 9 chars)</label>
                <input type="text" class="sensor-form-input" id="${sensorId}-displayName" value="On" maxlength="9" placeholder="On">
              </div>

              <div class="sensor-form-group">
                <label class="sensor-form-label">Icon</label>
                <div class="sensor-icon-grid" id="${sensorId}-iconGrid"></div>
              </div>

              <div class="sensor-form-group">
                <label class="sensor-form-label">Color</label>
                <div class="sensor-color-picker-container">
                  <div class="sensor-color-options" id="${sensorId}-colorOptions"></div>
                  <div class="sensor-custom-color-wrapper">
                    <div class="sensor-custom-color-input">
                      <input type="color" id="${sensorId}-customColor" value="#3b82f6">
                    </div>
                    <input type="text" class="sensor-hex-input" id="${sensorId}-hexInput" value="#3b82f6" maxlength="7">
                  </div>
                </div>
              </div>

              <div class="sensor-form-group">
                <label class="sensor-form-label">Preview</label>
                <div class="sensor-preview-area">
                  <div class="sensor-preview-icon" id="${sensorId}-iconPreview">
                    <i class="fas fa-circle-check" style="color: #3b82f6; font-size:24px;"></i>
                  </div>
                  <div class="sensor-preview-info">
                    <div class="sensor-preview-label">Preview</div>
                    <div class="sensor-preview-name" id="${sensorId}-previewName">On</div>
                  </div>
                  <div class="sensor-preview-glow" id="${sensorId}-colorPreview" style="background: #3b82f6;"></div>
                </div>
              </div>

              <div class="sensor-form-actions">
                <button type="button" class="sensor-form-btn danger" id="${sensorId}-deleteButton" style="display: none;">Delete</button>
                <button type="button" class="sensor-form-btn cancel" id="${sensorId}-cancelEdit">Cancel</button>
                <button type="submit" class="sensor-form-btn save" id="${sensorId}-saveButton">Save State</button>
              </div>
            </div>
          </div>

          <!-- Delete Confirmation -->
          <div id="${sensorId}-deleteConfirmation" class="sensor-delete-confirmation hidden">
            <h3 style="color: #ff3b30; margin-bottom: 15px;">Delete State</h3>
            <p>Are you sure you want to delete this state? This action cannot be undone.</p>
            <div class="sensor-form-actions">
              <button type="button" class="sensor-form-btn cancel" id="${sensorId}-cancelDelete">Cancel</button>
              <button type="button" class="sensor-form-btn danger" id="${sensorId}-confirmDelete">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Store sensor data
    sensorsData.set(sensorId, {
      id: sensorId,
      position: position,
      targetScene: targetScene || '',
      states: states,
      entityId: entityIdOverride || '',
      currentState: null,
      active: false,
      container: container,
      visible: true,
      isEditMode: false,
      currentStateIndex: null
    });

    // Initialize the modal
    initSensorModal(sensorId);

    // If entity ID is provided, fetch its state
    if (entityIdOverride) {
      setTimeout(() => {
        saveEntityId(sensorId);
      }, 500);
    }

    return sensorId;
  };

  // Initialize a sensor modal
  const initSensorModal = (sensorId) => {
    const sensorData = sensorsData.get(sensorId);
    if (!sensorData) return;

    // Get DOM elements
    const modal = document.getElementById(`${sensorId}-modal`);
    const panelGrid = document.getElementById(`${sensorId}-panelGrid`);
    const panelEdit = document.getElementById(`${sensorId}-panelEdit`);
    const deleteConfirmation = document.getElementById(`${sensorId}-deleteConfirmation`);
    const statesContainer = document.getElementById(`${sensorId}-statesContainer`);
    const mainButton = document.getElementById(`${sensorId}-mainButton`);
    const closeModalBtn = document.getElementById(`${sensorId}-closeModal`);
    const editBtn = document.getElementById(`${sensorId}-editBtn`);
    const cancelEditBtn = document.getElementById(`${sensorId}-cancelEdit`);
    const saveButton = document.getElementById(`${sensorId}-saveButton`);
    const deleteButton = document.getElementById(`${sensorId}-deleteButton`);
    const cancelDelete = document.getElementById(`${sensorId}-cancelDelete`);
    const confirmDelete = document.getElementById(`${sensorId}-confirmDelete`);
    const addStateBtn = document.getElementById(`${sensorId}-addStateBtn`);
    const entityInput = document.getElementById(`${sensorId}-entityId`);
    const refreshBtn = document.getElementById(`${sensorId}-refreshEntity`);
    const modalTitle = document.getElementById(`${sensorId}-modalTitle`);
    const modalSubtitle = document.getElementById(`${sensorId}-modalSubtitle`);

    // Initialize UI
    renderStatesList(statesContainer, sensorData.states, sensorId);
    updateCurrentStateDisplay(sensorId);

    // Setup event listeners
    setupEventListeners(sensorId, modal, panelGrid, panelEdit, deleteConfirmation,
      mainButton, closeModalBtn, editBtn, cancelEditBtn, saveButton, deleteButton,
      cancelDelete, confirmDelete, addStateBtn, entityInput, refreshBtn, statesContainer,
      modalTitle, modalSubtitle, sensorData);
  };

  // Render states list
  const renderStatesList = (container, states, sensorId) => {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (states.length === 0) {
      container.innerHTML = '<div class="sensor-empty-state">No states configured. Add one to get started.</div>';
      return;
    }

    states.forEach((state, index) => {
      const stateItem = document.createElement('div');
      stateItem.className = 'sensor-state-item';
      stateItem.dataset.index = index;
      
      stateItem.innerHTML = `
        <div class="sensor-state-preview" style="background: ${state.color};">
          <i class="${state.icon}" style="color: white;"></i>
        </div>
        <div class="sensor-state-info">
          <div class="sensor-state-value">${state.stateValue || '?'}</div>
          <div class="sensor-state-display">${state.displayName || '?'}</div>
        </div>
      `;

      // LONG PRESS to edit state
      stateItem.addEventListener('mousedown', (e) => startLongPress(e, stateItem, index, sensorId, 'state'));
      stateItem.addEventListener('touchstart', (e) => startLongPress(e, stateItem, index, sensorId, 'state'));

      stateItem.addEventListener('mouseup', cancelLongPress);
      stateItem.addEventListener('mouseleave', cancelLongPress);
      stateItem.addEventListener('touchend', cancelLongPress);
      stateItem.addEventListener('touchcancel', cancelLongPress);

      // Prevent context menu
      stateItem.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });

      container.appendChild(stateItem);
    });
  };

  // Long press handlers
  const startLongPress = (e, element, index, sensorId, type) => {
    e.preventDefault();
    longPressButton = { element, index, sensorId, type };
    
    // Add press effect
    element.style.transform = 'scale(0.98)';
    element.style.opacity = '0.9';
    
    longPressTimer = setTimeout(() => {
      if (longPressButton) {
        console.log(`Long press detected, opening edit for ${type}:`, index);
        if (type === 'state') {
          editState(index, sensorId);
        }
        
        // Reset element
        if (element) {
          element.style.transform = '';
          element.style.opacity = '';
        }
      }
    }, 700);
  };

  const cancelLongPress = (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    
    // Reset element
    if (longPressButton && longPressButton.element) {
      longPressButton.element.style.transform = '';
      longPressButton.element.style.opacity = '';
    }
    
    longPressButton = null;
  };

  // Edit state
  const editState = (index, sensorId) => {
    const sensorData = sensorsData.get(sensorId);
    if (!sensorData) return;

    currentEditIndex = index;
    currentSensorId = sensorId;
    sensorData.currentStateIndex = index;
    const state = sensorData.states[index];

    // Populate form
    document.getElementById(`${sensorId}-stateValue`).value = state.stateValue || '';
    document.getElementById(`${sensorId}-displayName`).value = state.displayName || '';
    
    // Update icon selection
    selectedIcon = state.icon || 'fas fa-circle-check';
    populateIconGrid(document.getElementById(`${sensorId}-iconGrid`), sensorId);
    
    // Update color
    updateColorSelection(sensorId, state.color || AVAILABLE_COLORS[0]);

    // Update preview
    updatePreview(sensorId);

    // Show delete button
    document.getElementById(`${sensorId}-deleteButton`).style.display = 'block';

    // Switch to edit panel
    document.getElementById(`${sensorId}-panelGrid`).classList.add('hidden');
    document.getElementById(`${sensorId}-panelEdit`).classList.remove('hidden');
    document.getElementById(`${sensorId}-deleteConfirmation`).classList.add('hidden');
    document.getElementById(`${sensorId}-modalTitle`).textContent = 'Edit State';
    document.getElementById(`${sensorId}-modalSubtitle`).textContent = 'Modify state settings';
  };

  // Reset edit form for new state
  const resetEditForm = (sensorId) => {
    const sensorData = sensorsData.get(sensorId);
    if (!sensorData) return;

    currentEditIndex = -1;
    currentSensorId = sensorId;
    sensorData.currentStateIndex = null;

    document.getElementById(`${sensorId}-stateValue`).value = '';
    document.getElementById(`${sensorId}-displayName`).value = '';
    selectedIcon = 'fas fa-circle-check';
    populateIconGrid(document.getElementById(`${sensorId}-iconGrid`), sensorId);
    updateColorSelection(sensorId, AVAILABLE_COLORS[0]);
    updatePreview(sensorId);

    // Hide delete button
    document.getElementById(`${sensorId}-deleteButton`).style.display = 'none';
  };

  // Populate icon grid
  const populateIconGrid = (iconGridElement, sensorId) => {
    if (!iconGridElement) return;

    iconGridElement.innerHTML = '';
    ICONS.forEach(icon => {
      const iconOption = document.createElement('div');
      iconOption.className = 'sensor-icon-option';
      iconOption.dataset.icon = icon.class;

      const iconEl = document.createElement('i');
      iconEl.className = icon.class;

      iconOption.appendChild(iconEl);
      iconGridElement.appendChild(iconOption);

      iconOption.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll(`#${iconGridElement.id} .sensor-icon-option`).forEach(opt => {
          opt.classList.remove('selected');
        });
        iconOption.classList.add('selected');
        selectedIcon = icon.class;
        document.getElementById(`${sensorId}-buttonIcon`).value = icon.class;
        updatePreview(sensorId);
      });

      iconOption.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(`#${iconGridElement.id} .sensor-icon-option`).forEach(opt => {
          opt.classList.remove('selected');
        });
        iconOption.classList.add('selected');
        selectedIcon = icon.class;
        document.getElementById(`${sensorId}-buttonIcon`).value = icon.class;
        updatePreview(sensorId);
      });

      // Select default if matches
      if (icon.class === selectedIcon) {
        iconOption.classList.add('selected');
      }
    });
  };

  // Update color selection
  const updateColorSelection = (sensorId, selectedColor) => {
    const colorOptionsContainer = document.getElementById(`${sensorId}-colorOptions`);
    if (!colorOptionsContainer) return;

    colorOptionsContainer.innerHTML = '';

    AVAILABLE_COLORS.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.className = 'sensor-color-option';
      colorOption.style.backgroundColor = color;
      if (color === selectedColor) colorOption.classList.add('selected');

      colorOption.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll(`#${sensorId}-colorOptions .sensor-color-option`).forEach(opt => {
          opt.classList.remove('selected');
        });
        colorOption.classList.add('selected');
        document.getElementById(`${sensorId}-customColor`).value = color;
        document.getElementById(`${sensorId}-hexInput`).value = color;
        updatePreview(sensorId);
      });

      colorOptionsContainer.appendChild(colorOption);
    });

    // Update custom color picker
    document.getElementById(`${sensorId}-customColor`).value = selectedColor;
    document.getElementById(`${sensorId}-hexInput`).value = selectedColor;
  };

  // Update preview
  const updatePreview = (sensorId) => {
    const displayName = document.getElementById(`${sensorId}-displayName`).value || 'State';
    const color = document.getElementById(`${sensorId}-customColor`).value;
    
    const previewIcon = document.getElementById(`${sensorId}-iconPreview`);
    if (previewIcon) {
      previewIcon.innerHTML = `<i class="${selectedIcon}" style="color: ${color}; font-size:24px;"></i>`;
    }

    const previewName = document.getElementById(`${sensorId}-previewName`);
    if (previewName) {
      previewName.textContent = displayName;
    }

    const colorPreview = document.getElementById(`${sensorId}-colorPreview`);
    if (colorPreview) {
      colorPreview.style.backgroundColor = color;
      colorPreview.style.boxShadow = `0 0 12px ${color}`;
    }
  };

  // Save state handler
  const handleSaveState = (sensorId) => {
    const sensorData = sensorsData.get(sensorId);
    if (!sensorData) return;

    const stateValue = document.getElementById(`${sensorId}-stateValue`).value.trim();
    const displayName = document.getElementById(`${sensorId}-displayName`).value.trim();
    const color = document.getElementById(`${sensorId}-customColor`).value;

    // Validation
    if (!stateValue) {
      alert('Please enter a state value');
      return;
    }

    if (!displayName) {
      alert('Please enter a display name');
      return;
    }

    const stateData = {
      stateValue,
      displayName,
      icon: selectedIcon,
      color
    };

    if (sensorData.currentStateIndex !== null) {
      // Update existing state
      sensorData.states[sensorData.currentStateIndex] = stateData;
    } else {
      // Add new state
      sensorData.states.push(stateData);
    }

    // Refresh display
    renderStatesList(document.getElementById(`${sensorId}-statesContainer`), sensorData.states, sensorId);

    // Update sensor display if entity state matches
    updateSensorDisplay(sensorId);

    // Exit edit mode
    exitEditMode(sensorId);
  };

  // Exit edit mode
  const exitEditMode = (sensorId) => {
    const sensorData = sensorsData.get(sensorId);
    if (!sensorData) return;

    sensorData.isEditMode = false;
    sensorData.currentStateIndex = null;

    document.getElementById(`${sensorId}-panelEdit`).classList.add('hidden');
    document.getElementById(`${sensorId}-deleteConfirmation`).classList.add('hidden');
    document.getElementById(`${sensorId}-panelGrid`).classList.remove('hidden');
    document.getElementById(`${sensorId}-modalTitle`).textContent = 'Sensor';
    document.getElementById(`${sensorId}-modalSubtitle`).textContent = 'Smart Sensor';
  };

  // Setup all event listeners
  const setupEventListeners = (sensorId, modal, panelGrid, panelEdit, deleteConfirmation,
                               mainButton, closeModalBtn, editBtn, cancelEditBtn, saveButton, deleteButton,
                               cancelDelete, confirmDelete, addStateBtn, entityInput, refreshBtn, statesContainer,
                               modalTitle, modalSubtitle, sensorData) => {

    // Open modal
    const openModal = () => {
      modal.classList.add('show');
      mainButton.classList.add('active-main');
      mainButton.style.display = 'none';
      document.body.classList.add('sensor-modal-active');
      
      // Update current state display
      updateCurrentStateDisplay(sensorId);
      
      // Save entity ID when opening modal
      saveEntityId(sensorId);
      
      showMainPanel(sensorId);
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
      document.body.classList.remove('sensor-modal-active');
      enableBodyRotation();
    };

    closeModalBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      closeModal();
    });

    // Entity input change - save when blurred and when typing/pasting
    entityInput.addEventListener('blur', () => {
      saveEntityId(sensorId);
    });

    // Auto-fetch entity state when typing/pasting with debounce
    entityInput.addEventListener('input', debounce(() => {
      saveEntityId(sensorId);
    }, 500));

    // Refresh button
    if (refreshBtn) {
      refreshBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        saveEntityId(sensorId);
      });
      
      refreshBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveEntityId(sensorId);
      });
    }

    // Add state button
    addStateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetEditForm(sensorId);
      sensorData.isEditMode = true;
      panelGrid.classList.add('hidden');
      panelEdit.classList.remove('hidden');
      if (deleteConfirmation) deleteConfirmation.classList.add('hidden');
      modalTitle.textContent = 'Add State';
      modalSubtitle.textContent = 'Create a new state';
    });

    addStateBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetEditForm(sensorId);
      sensorData.isEditMode = true;
      panelGrid.classList.add('hidden');
      panelEdit.classList.remove('hidden');
      if (deleteConfirmation) deleteConfirmation.classList.add('hidden');
      modalTitle.textContent = 'Add State';
      modalSubtitle.textContent = 'Create a new state';
    });

    // Edit button - enter edit mode for new state
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetEditForm(sensorId);
      sensorData.isEditMode = true;
      panelGrid.classList.add('hidden');
      panelEdit.classList.remove('hidden');
      if (deleteConfirmation) deleteConfirmation.classList.add('hidden');
      modalTitle.textContent = 'Add State';
      modalSubtitle.textContent = 'Create a new state';
    });

    editBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetEditForm(sensorId);
      sensorData.isEditMode = true;
      panelGrid.classList.add('hidden');
      panelEdit.classList.remove('hidden');
      if (deleteConfirmation) deleteConfirmation.classList.add('hidden');
      modalTitle.textContent = 'Add State';
      modalSubtitle.textContent = 'Create a new state';
    });

    // Cancel edit
    cancelEditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exitEditMode(sensorId);
    });

    cancelEditBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      exitEditMode(sensorId);
    });

    // Save button
    saveButton.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSaveState(sensorId);
    });

    saveButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSaveState(sensorId);
    });

    // Delete button
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      panelEdit.classList.add('hidden');
      if (deleteConfirmation) deleteConfirmation.classList.remove('hidden');
    });

    deleteButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      panelEdit.classList.add('hidden');
      if (deleteConfirmation) deleteConfirmation.classList.remove('hidden');
    });

    // Cancel delete
    cancelDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      if (deleteConfirmation) deleteConfirmation.classList.add('hidden');
      panelEdit.classList.remove('hidden');
    });

    cancelDelete.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (deleteConfirmation) deleteConfirmation.classList.add('hidden');
      panelEdit.classList.remove('hidden');
    });

    // Confirm delete
    confirmDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sensorData.currentStateIndex !== null) {
        sensorData.states.splice(sensorData.currentStateIndex, 1);
        renderStatesList(statesContainer, sensorData.states, sensorId);
        exitEditMode(sensorId);
      }
    });

    confirmDelete.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (sensorData.currentStateIndex !== null) {
        sensorData.states.splice(sensorData.currentStateIndex, 1);
        renderStatesList(statesContainer, sensorData.states, sensorId);
        exitEditMode(sensorId);
      }
    });

    // Color picker events
    document.getElementById(`${sensorId}-customColor`).addEventListener('input', (e) => {
      document.getElementById(`${sensorId}-hexInput`).value = e.target.value;
      updatePreview(sensorId);
    });

    document.getElementById(`${sensorId}-hexInput`).addEventListener('change', (e) => {
      let val = e.target.value;
      if (!/^#([0-9A-F]{3}){1,2}$/i.test(val)) return;
      document.getElementById(`${sensorId}-customColor`).value = val;
      updatePreview(sensorId);
    });

    // Form input events for preview
    document.getElementById(`${sensorId}-displayName`).addEventListener('input', () => updatePreview(sensorId));

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
    const formElements = [
      document.getElementById(`${sensorId}-entityId`),
      document.getElementById(`${sensorId}-stateValue`),
      document.getElementById(`${sensorId}-displayName`),
      document.getElementById(`${sensorId}-customColor`),
      document.getElementById(`${sensorId}-hexInput`),
      refreshBtn
    ];
    
    formElements.forEach(input => {
      if (input) {
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('touchstart', (e) => e.stopPropagation());
        input.addEventListener('touchend', (e) => e.stopPropagation());
        input.addEventListener('mousedown', (e) => e.stopPropagation());
      }
    });
  };

  // Initialize WebSocket on module load
  initWebSocket();

  // Public API
  return {
    // Create a new sensor at a specific position
    createSensor: (position, targetScene, statesOverride = null, entityId = null) => {
      const sensorId = createSensorModal(position, targetScene, statesOverride, entityId);
      return {
        id: sensorId,
        position: position,
        targetScene: targetScene || ''
      };
    },

    // Open sensor modal
    openSensorModal: (sensorId) => {
      const modal = document.getElementById(`${sensorId}-modal`);
      const mainButton = document.getElementById(`${sensorId}-mainButton`);
      if (modal && mainButton) {
        modal.classList.add('show');
        mainButton.classList.add('active-main');
        mainButton.style.display = 'none';
        document.body.classList.add('sensor-modal-active');
        disableBodyRotation();
      }
    },

    // Delete a sensor by ID
    deleteSensor: (sensorId) => {
      const container = document.getElementById(sensorId);
      if (container) {
        container.remove();
      }
      return sensorsData.delete(sensorId);
    },

    // Get sensor data for saving
    getSensorsData: () => {
      const sensors = [];
      sensorsData.forEach(sensorData => {
        sensors.push({
          id: sensorData.id,
          position: sensorData.position.toArray ? sensorData.position.toArray() : sensorData.position,
          targetScene: sensorData.targetScene || '',
          entityId: sensorData.entityId || '',
          states: sensorData.states.map(state => ({
            stateValue: state.stateValue,
            displayName: state.displayName,
            icon: state.icon,
            color: state.color
          }))
        });
      });
      return sensors;
    },

    // Get specific sensor data
    getSensorData: (sensorId) => {
      return sensorsData.get(sensorId);
    },

    // Set current scene for visibility checks
    setCurrentScene: (sceneName) => {
      currentScene = sceneName;
    },

    // Load sensors from data
    loadSensors: (sensorsDataArray) => {
      // Clear existing sensors
      document.querySelectorAll('.sensor-container').forEach(el => el.remove());
      sensorsData.clear();

      // Create new sensors with saved data
      sensorsDataArray.forEach(sensorData => {
        const position = Array.isArray(sensorData.position) ?
          new THREE.Vector3().fromArray(sensorData.position) : sensorData.position;

        // Convert saved states to proper format
        let savedStates = [];
        if (sensorData.states && Array.isArray(sensorData.states)) {
          savedStates = sensorData.states.map(state => ({
            stateValue: state.stateValue || '',
            displayName: state.displayName || 'State',
            icon: state.icon || 'fas fa-circle-check',
            color: state.color || '#3b82f6'
          }));
        } else {
          // Use defaults if no states provided
          savedStates = JSON.parse(JSON.stringify(DEFAULT_STATES));
        }

        // Create sensor with saved states and entity ID
        createSensorModal(position, sensorData.targetScene || '', savedStates, sensorData.entityId || '');
      });
    },

    // Clear all sensors
    clearSensors: () => {
      document.querySelectorAll('.sensor-container').forEach(el => el.remove());
      sensorsData.clear();
    },

    // Update sensor positions on screen
    updateSensorPositions: (camera) => {
      sensorsData.forEach((sensorData, sensorId) => {
        const container = document.getElementById(sensorId);
        if (!container) return;

        const sensor = sensorsData.get(sensorId);
        if (!sensor || !sensor.position) return;

        // Check if sensor should be visible for current scene
        const shouldBeVisible = !sensor.targetScene || sensor.targetScene === currentScene;

        if (!shouldBeVisible) {
          container.style.display = 'none';
          return;
        }

        // Project 3D position to screen coordinates
        const screenPoint = sensor.position.clone().project(camera);
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

    // Update sensor visibility based on current scene
    updateSensorVisibility: (sceneName) => {
      currentScene = sceneName;
      sensorsData.forEach((sensorData, sensorId) => {
        const container = document.getElementById(sensorId);
        if (container && sensorData) {
          const shouldBeVisible = !sensorData.targetScene || sensorData.targetScene === sceneName;
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
      if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
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
      
      HA_CONFIG.socket.send(JSON.stringify(message));
      
      return new Promise((resolve, reject) => {
        HA_CONFIG.pendingRequests.set(messageId, { resolve, reject });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (HA_CONFIG.pendingRequests.has(messageId)) {
            HA_CONFIG.pendingRequests.delete(messageId);
            reject(new Error('Command timeout'));
          }
        }, 5000);
      });
    },

    // Initialize Home Assistant connection
    initHomeAssistant: async () => {
      console.log('Initializing Sensor WebSocket connection...');
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
        console.log('Sensor WebSocket disconnected');
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
const sensorStyle = document.createElement('style');
sensorStyle.textContent = `
  .sensor-container {
    position: absolute;
    z-index: 1000;
    pointer-events: auto;
    transition: opacity 0.2s;
    transform: translate(-50%, -50%);
  }

  .sensor-main-button {
    width: 56px;
    height: 56px;
    background: linear-gradient(145deg, #ffffff, #f5f5f5);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 6px 0 3px 0;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1;
  }

  @media (max-width: 768px) {
    .sensor-main-button {
      width: 52px;
      height: 52px;
    }
  }

  .sensor-main-button:active {
    transform: scale(0.95);
  }

  .sensor-main-button i {
    font-size: 24px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    color: #4b5563;
    flex-shrink: 0;
  }

  .sensor-state-name {
    font-size: 7px;
    font-weight: 500;
    max-width: 46px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    margin-top: 2px;
    color: #1f2937;
    background: rgba(255, 255, 255, 0.5);
    padding: 1px 4px;
    border-radius: 20px;
    backdrop-filter: blur(1px);
    transition: background 0.2s;
  }

  .sensor-status-dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.8);
  }

  .sensor-main-button.active-main {
    box-shadow: 0 0 20px 8px rgba(66, 165, 245, 0.7);
    border: 2px solid rgba(66, 165, 245, 0.4);
    display: none;
  }

  .sensor-main-button.active-main i {
    color: #42a5f5;
  }

  .sensor-main-button.active-main ~ .sensor-modal {
    display: flex;
  }

  .sensor-modal {
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

  .sensor-modal.show {
    display: flex;
  }

  .sensor-modal-content {
    background: rgba(255, 255, 255, 0.4);
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
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

  .sensor-close-btn,
  .sensor-edit-btn {
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

  .sensor-close-btn {
    top: 16px;
    right: 16px;
  }

  .sensor-edit-btn {
    top: 16px;
    left: 16px;
  }

  .sensor-close-btn:active,
  .sensor-edit-btn:active {
    background-color: rgba(0, 0, 0, 0.1);
    transform: scale(0.95);
  }

  .sensor-title {
    color: #333;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
    text-align: center;
  }

  .sensor-subtitle {
    color: #000000;
    font-size: 14px;
    margin-bottom: 25px;
    text-align: center;
  }

  .sensor-panel {
    width: 100%;
  }

  .sensor-panel.hidden {
    display: none !important;
  }

  /* Entity section */
  .sensor-entity-section {
    background: rgba(66, 165, 245, 0.1);
    padding: 12px;
    border-radius: 10px;
    margin-bottom: 16px;
    border-left: 4px solid #3b82f6;
  }

  .sensor-entity-label {
    font-size: 12px;
    font-weight: 600;
    color: #1e40af;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sensor-entity-input-group {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .sensor-entity-input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid #bcd3f0;
    border-radius: 8px;
    font-size: 13px;
    background: white;
    font-family: monospace;
    width: 100%;
  }

  .sensor-entity-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.2);
  }

  .sensor-refresh-entity {
    background: white;
    border: 1px solid #bcd3f0;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #3b82f6;
    transition: all 0.2s;
  }

  .sensor-refresh-entity:active {
    transform: scale(0.95);
    background: #e5e7eb;
  }

  .sensor-refresh-entity i {
    font-size: 14px;
  }

  /* Current state */
  .sensor-current-state {
    margin-bottom: 16px;
    padding: 10px;
    background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
    border-radius: 8px;
    border-left: 3px solid #3b82f6;
    font-size: 12px;
  }

  .sensor-current-label {
    margin: 0 0 4px 0;
    color: #1e40af;
    font-size: 12px;
    font-weight: 600;
  }

  .sensor-current-value {
    font-family: 'SF Mono', monospace;
    font-weight: 600;
    color: #1f2937;
    background: rgba(255,255,255,0.7);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 11px;
  }

  /* States container */
  .sensor-states-container {
    margin-bottom: 16px;
    max-height: 300px;
    overflow-y: auto;
  }

  .sensor-state-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .sensor-state-item:active {
    transform: scale(0.98);
    background: rgba(66, 165, 245, 0.2);
  }

  .sensor-state-preview {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sensor-state-preview i {
    font-size: 20px;
  }

  .sensor-state-info {
    flex: 1;
  }

  .sensor-state-value {
    font-weight: 600;
    font-size: 13px;
    color: #333;
  }

  .sensor-state-display {
    font-size: 11px;
    color: #666;
  }

  .sensor-add-state-btn {
    width: 100%;
    padding: 10px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
  }

  .sensor-add-state-btn:active {
    transform: scale(0.98);
  }

  .sensor-empty-state {
    text-align: center;
    padding: 24px;
    color: #6b7280;
    font-size: 13px;
  }

  /* Form Styles */
  .sensor-form {
    width: 100%;
  }

  .sensor-form-group {
    margin-bottom: 15px;
    width: 100%;
  }

  .sensor-form-label {
    display: block;
    margin-bottom: 5px;
    color: #333;
    font-weight: bold;
    font-size: 14px;
  }

  .sensor-form-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    box-sizing: border-box;
    background-color: white;
  }

  .sensor-form-input:focus {
    outline: none;
    border-color: #007aff;
  }

  /* Icon grid */
  .sensor-icon-grid {
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

  .sensor-icon-option {
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

  .sensor-icon-option:active {
    background: #e3f2fd;
    color: #007aff;
    transform: scale(0.95);
  }

  .sensor-icon-option.selected {
    background: #007aff;
    color: white;
    border-color: #0056cc;
  }

  /* Color picker */
  .sensor-color-picker-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sensor-color-options {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding: 8px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
  }

  .sensor-color-option {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  }

  .sensor-color-option:hover {
    transform: scale(1.15);
    border-color: rgba(0,0,0,0.2);
  }

  .sensor-color-option.selected {
    border-color: #1f2937;
    transform: scale(1.15);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .sensor-custom-color-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
  }

  .sensor-custom-color-input {
    position: relative;
    width: 26px;
    height: 26px;
  }

  .sensor-custom-color-input input[type="color"] {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    background: none;
  }

  .sensor-hex-input {
    width: 70px;
    padding: 4px 6px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 11px;
    font-family: monospace;
    text-transform: uppercase;
  }

  /* Preview area */
  .sensor-preview-area {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: #fff;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    margin-top: 8px;
  }

  .sensor-preview-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    transition: all 0.3s ease;
    font-size: 20px;
    color: #4b5563;
  }

  .sensor-preview-info {
    flex: 1;
    min-width: 0;
  }

  .sensor-preview-label {
    font-size: 10px;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sensor-preview-name {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sensor-preview-glow {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.8);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    flex-shrink: 0;
  }

  /* Form actions */
  .sensor-form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .sensor-form-btn {
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

  .sensor-form-btn:active {
    transform: scale(0.95);
  }

  .sensor-form-btn.save {
    background: #007aff;
    color: white;
  }

  .sensor-form-btn.save:active {
    background: #0056cc;
  }

  .sensor-form-btn.cancel {
    background: #f0f0f0;
    color: #333;
  }

  .sensor-form-btn.cancel:active {
    background: #e0e0e0;
  }

  .sensor-form-btn.danger {
    background: #ff3b30;
    color: white;
  }

  .sensor-form-btn.danger:active {
    background: #cc0000;
  }

  /* Delete confirmation */
  .sensor-delete-confirmation {
    text-align: center;
    padding: 20px;
    width: 100%;
  }

  .sensor-delete-confirmation.hidden {
    display: none;
  }

  .sensor-delete-confirmation p {
    margin-bottom: 20px;
    color: #333;
    font-size: 16px;
  }

  /* Body state when modal is open */
  body.sensor-modal-active {
    touch-action: none !important;
    overflow: hidden !important;
  }

  body.sensor-modal-active canvas {
    pointer-events: none !important;
  }

  body.sensor-modal-active .sensor-modal {
    pointer-events: auto;
  }

  .sensor-modal {
    pointer-events: auto !important;
    z-index: 2000;
  }

  .sensor-modal-content {
    pointer-events: auto !important;
  }

  .sensor-modal.show {
    background-color: rgba(0, 0, 0, 0.5);
    pointer-events: auto !important;
  }

  .sensor-modal * {
    pointer-events: auto !important;
  }

  /* Hide main button when modal is open */
  .sensor-container:has(.sensor-modal.show) .sensor-main-button {
    display: none !important;
  }

  .sensor-container .sensor-modal.show ~ .sensor-main-button {
    display: none !important;
  }

  .sensor-container .sensor-main-button {
    display: flex !important;
    opacity:0.4;
    border-radius:14px;
  }
`;

document.head.appendChild(sensorStyle);