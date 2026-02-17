// remote.js - Remote Control Module for 360 Scene Editor with Home Assistant Integration

const RemoteModule = (() => {
  // Available Font Awesome icons - expanded from test.html
  const ICONS = [
    { class: 'fas fa-toggle-on', name: 'Toggle' },
    { class: 'fas fa-toggle-off', name: 'ToggleOff' },
    { class: 'fas fa-sliders-h', name: 'Sliders' },
    { class: 'fa-solid fa-left-right', name: 'Arrow' },
    { class: 'fa-solid fa-repeat', name: 'Repeat' },
    { class: 'fa-solid fa-phone', name: 'Phone' },
    { class: 'fas fa-lightbulb', name: 'Bulb-on' },
    { class: 'fa-regular fa-lightbulb', name: 'Bulb-off' },
    { class: 'fa-solid fa-menorah', name: 'DeskLamp' },
    { class: 'fa-solid fa-fire-flame-curved', name: 'Flame' },
    { class: 'fa-solid fa-laptop', name: 'Laptop' },
    { class: 'fas fa-power-off', name: 'Power' },
    { class: 'fas fa-plug', name: 'Plug' },
    { class: 'fas fa-plug-circle-bolt', name: 'PlugBolt' },
    { class: 'fas fa-battery-full', name: 'Battery' },
    { class: 'fas fa-battery-quarter', name: 'BatteryLow' },
    { class: 'fas fa-fan', name: 'Fan' },
    { class: 'fas fa-wind', name: 'Wind' },
    { class: 'fas fa-thermometer-half', name: 'Temp' },
    { class: 'fas fa-thermometer-full', name: 'TempHot' },
    { class: 'fas fa-thermometer-empty', name: 'TempCold' },
    { class: 'fas fa-snowflake', name: 'Snow' },
    { class: 'fas fa-fire', name: 'Fire' },
    { class: 'fas fa-droplet', name: 'Humidity' },
    { class: 'fas fa-tv', name: 'TV' },
    { class: 'fa-brands fa-chromecast', name: 'Cast' },
    { class: 'fa-solid fa-bullhorn', name: 'Speaker' },
    { class: 'fas fa-volume-up', name: 'Volume' },
    { class: 'fas fa-music', name: 'Music' },
    { class: 'fas fa-headphones', name: 'Headphones' },
    { class: 'fas fa-microphone', name: 'Mic' },
    { class: 'fas fa-radio', name: 'Radio' },
    { class: 'fa-solid fa-window-maximize', name: 'Blinds' },
    { class: 'fa-regular fa-window-maximize', name: 'BlindsOpen' },
    { class: 'fa-solid fa-person-booth', name: 'Curtain' },
    { class: 'fas fa-window-maximize', name: 'Window' },
    { class: 'fa-brands fa-microsoft', name: 'WindowMin' },
    { class: 'fas fa-door-open', name: 'Door' },
    { class: 'fas fa-door-closed', name: 'DoorClosed' },
    { class: 'fas fa-lock', name: 'Lock' },
    { class: 'fas fa-lock-open', name: 'Unlock' },
    { class: 'fas fa-key', name: 'Key' },
    { class: 'fas fa-camera', name: 'Camera' },
    { class: 'fas fa-video', name: 'Video' },
    { class: 'fas fa-bell', name: 'Bell' },
    { class: 'fa-solid fa-bell-concierge', name: 'BellPlus' },
    { class: 'fa-solid fa-square-parking', name: 'Parking' },
    { class: 'fa-solid fa-car', name: 'GarageOpen' },
    { class: 'fas fa-car', name: 'Car' },
    { class: 'fas fa-truck', name: 'Truck' },
    { class: 'fas fa-sun', name: 'Sun' },
    { class: 'fas fa-moon', name: 'Moon' },
    { class: 'fas fa-cloud', name: 'Cloud' },
    { class: 'fas fa-cloud-rain', name: 'Rain' },
    { class: 'fas fa-bolt', name: 'Bolt' },
    { class: 'fas fa-umbrella', name: 'Umbrella' },
    { class: 'fas fa-water', name: 'Water' },
    { class: 'fas fa-wind', name: 'Breeze' },
    { class: 'fas fa-robot', name: 'Robot' },
    { class: 'fas fa-gamepad', name: 'Gamepad' },
    { class: 'fas fa-desktop', name: 'Desktop' },
    { class: 'fas fa-laptop', name: 'Laptop' },
    { class: 'fas fa-mobile-alt', name: 'Mobile' },
    { class: 'fas fa-tablet-alt', name: 'Tablet' },
    { class: 'fas fa-wifi', name: 'WiFi' },
    { class: 'fa-brands fa-bluetooth', name: 'BT' },
    { class: 'fas fa-clock', name: 'Clock' },
    { class: 'fas fa-calendar', name: 'Calendar' },
    { class: 'fas fa-bed', name: 'Bed' },
    { class: 'fas fa-couch', name: 'Couch' },
    { class: 'fas fa-dumbbell', name: 'Gym' },
    { class: 'fas fa-dog', name: 'Pet' },
    { class: 'fas fa-cat', name: 'Cat' }
  ];

  // Switches data with control types from test.html
  const DEFAULT_SWITCHES = [
    { name: "Light", icon: 'fas fa-lightbulb', entityId: "light.living_room", active: false, _lastToggle: 0, controlType: 'dimmer' },
    { name: "TV", icon: 'fas fa-tv', entityId: "media_player.tv", active: false, _lastToggle: 0, controlType: 'toggle' },
    { name: "Fan", icon: 'fas fa-fan', entityId: "fan.living_room", active: false, _lastToggle: 0, controlType: 'dimmer' },
    { name: "Plug", icon: 'fas fa-plug', entityId: "switch.plug1", active: false, _lastToggle: 0, controlType: 'toggle' },
    { name: "Curtain", icon: 'fa-solid fa-window-maximize', entityId: "cover.living_room", active: false, _lastToggle: 0, controlType: 'curtain' },
    { name: "CCT", icon: 'fas fa-sliders-h', entityId: "light.rgbw_1", active: false, _lastToggle: 0, controlType: 'cct' }
  ];

  let instanceId = 1;
  let remotesData = new Map();
  let currentEditIndex = -1;
  let selectedIcon = 'fas fa-lightbulb';
  let currentRemoteId = null;
  let currentScene = 'scene1';
  let activeControlIndex = -1;

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
    reconnectInterval: 5000,
    entityStates: new Map()   // entity_id -> {state, attributes}
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
          console.log(`Reconnecting attempt ${HA_CONFIG.reconnectAttempts} in ${HA_CONFIG.reconnectInterval / 1000} seconds...`);
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

        // Get initial states
        HA_CONFIG.socket.send(JSON.stringify({
          id: HA_CONFIG.messageId++,
          type: 'get_states'
        }));

        // Subscribe to state changes
        HA_CONFIG.socket.send(JSON.stringify({
          id: HA_CONFIG.messageId++,
          type: 'subscribe_events',
          event_type: 'state_changed'
        }));
        break;

      case 'auth_invalid':
        console.error('Authentication failed:', message.message);
        HA_CONFIG.connected = false;
        HA_CONFIG.socket.close();
        break;

      case 'result':
        if (message.id === 1) { // get_states response
          if (message.result) {
            message.result.forEach(ent => HA_CONFIG.entityStates.set(ent.entity_id, ent));
            updateSwitchesFromHA();
          }
        }

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

      case 'event':
        if (message.event && message.event.event_type === 'state_changed') {
          const { entity_id, new_state } = message.event.data;
          if (new_state) {
            HA_CONFIG.entityStates.set(entity_id, new_state);
            updateSwitchesFromHA();

            // Update control panel if active
            if (activeControlIndex !== -1) {
              const remoteData = remotesData.get(currentRemoteId);
              if (remoteData && remoteData.switches[activeControlIndex]?.entityId === entity_id) {
                renderControlUI(remoteData.switches[activeControlIndex], currentRemoteId);
              }
            }
          }
        }
        break;
    }
  };

  // Update switches from HA entity states
  const updateSwitchesFromHA = () => {
    remotesData.forEach((remoteData, remoteId) => {
      remoteData.switches.forEach((sw, idx) => {
        const ha = HA_CONFIG.entityStates.get(sw.entityId);
        if (ha) {
          sw.active = (ha.state === 'on' || ha.state === 'open' || ha.state === 'true');
          updateSwitchVisualState(remoteId, idx, sw.active);
        }
      });
    });
  };

  // Get entity state helpers
  const getEntityState = (entityId) => {
    return HA_CONFIG.entityStates.get(entityId) || { state: '', attributes: {} };
  };

  const getBrightness = (entityId) => {
    const ent = getEntityState(entityId);
    if (ent.attributes && ent.attributes.brightness != null) {
      return Math.round((ent.attributes.brightness / 255) * 100);
    }
    return 0;
  };

  const getCurtainPosition = (entityId) => {
    const ent = getEntityState(entityId);
    if (ent.attributes && ent.attributes.current_position != null) return ent.attributes.current_position;
    return 0;
  };

  const getColorTemp = (entityId) => {
    const ent = getEntityState(entityId);
    if (ent.attributes && ent.attributes.color_temp != null) {
      const minMireds = 153, maxMireds = 500;
      let percent = (ent.attributes.color_temp - minMireds) / (maxMireds - minMireds) * 100;
      return Math.min(100, Math.max(0, Math.round(percent)));
    }
    return 50;
  };

  const getHue = (entityId) => {
    const ent = getEntityState(entityId);
    if (ent.attributes && ent.attributes.hs_color && ent.attributes.hs_color[0] != null) return Math.round(ent.attributes.hs_color[0]);
    return 0;
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

  // Call service via WebSocket
  const callService = (domain, service, data) => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) return;
    HA_CONFIG.socket.send(JSON.stringify({
      id: HA_CONFIG.messageId++,
      type: 'call_service',
      domain, service,
      service_data: data
    }));
  };

  // Create HTML structure for remote modal (3-panel design from test.html)
  const createRemoteModal = (position, targetScene, switchesOverride = null) => {
    const remoteId = `remote-${instanceId++}`;

    // Create switches for this remote - use provided switches or defaults
    const switches = switchesOverride ? JSON.parse(JSON.stringify(switchesOverride)) : JSON.parse(JSON.stringify(DEFAULT_SWITCHES));

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

      <!-- Main Modal - contains all panels -->
      <div class="remote-modal" id="${remoteId}-modal">
        <div class="remote-modal-content">
          <button class="remote-close-btn" id="${remoteId}-closeModal">
            <i class="fas fa-times"></i>
          </button>
          
          <!-- Panel 1: switch grid -->
          <div id="${remoteId}-panelSwitch" class="remote-panel">
            <div class="remote-modal-title">Switch Panel</div>
            <div class="remote-switch-grid" id="${remoteId}-switchGrid"></div>
          </div>

          <!-- Panel 2: edit form -->
          <div id="${remoteId}-panelEdit" class="remote-panel hidden">
            <div class="remote-modal-title">Edit Switch</div>
            <form class="remote-edit-form" id="${remoteId}-editForm">
              <div class="remote-form-group">
                <label class="remote-form-label">Name (8 max)</label>
                <input type="text" class="remote-form-input" id="${remoteId}-switchName" maxlength="8" required>
              </div>
              <div class="remote-form-group">
                <label class="remote-form-label">Entity ID</label>
                <input type="text" class="remote-form-input" id="${remoteId}-entityId" placeholder="light.bedroom" required>
              </div>
              <div class="remote-form-group">
                <label class="remote-form-label">Control type</label>
                <select class="remote-form-select" id="${remoteId}-controlType">
                  <option value="toggle">Toggle (on/off)</option>
                  <option value="dimmer">Dimmer (brightness)</option>
                  <option value="cct">CCT (brightness + temp)</option>
                  <option value="rgb">RGB (brightness + hue)</option>
                  <option value="curtain">Curtain (position)</option>
                </select>
              </div>
              <div class="remote-form-group">
                <label class="remote-form-label">Icon</label>
                <div class="remote-icon-selection">
                  <div class="remote-icon-grid" id="${remoteId}-iconGrid"></div>
                </div>
              </div>
              <div class="remote-form-actions">
                <button type="button" class="remote-form-btn cancel" id="${remoteId}-cancelEdit">Cancel</button>
                <button type="submit" class="remote-form-btn save">Save</button>
              </div>
            </form>
          </div>

          <!-- Panel 3: dynamic control (dimmer, cct, rgb, curtain) -->
          <div id="${remoteId}-panelControl" class="remote-panel hidden">
            <div class="remote-modal-title" id="${remoteId}-controlTitle">Control</div>
            <div class="remote-control-container" id="${remoteId}-controlContainer"></div>
          </div>
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
    const modal = document.getElementById(`${remoteId}-modal`);
    const panelSwitch = document.getElementById(`${remoteId}-panelSwitch`);
    const panelEdit = document.getElementById(`${remoteId}-panelEdit`);
    const panelControl = document.getElementById(`${remoteId}-panelControl`);
    const switchGrid = document.getElementById(`${remoteId}-switchGrid`);
    const iconGrid = document.getElementById(`${remoteId}-iconGrid`);
    const mainButton = document.getElementById(`${remoteId}-mainButton`);
    const closeModalBtn = document.getElementById(`${remoteId}-closeModal`);
    const cancelEditBtn = document.getElementById(`${remoteId}-cancelEdit`);
    const editForm = document.getElementById(`${remoteId}-editForm`);
    const switchNameInput = document.getElementById(`${remoteId}-switchName`);
    const entityIdInput = document.getElementById(`${remoteId}-entityId`);
    const controlTypeSelect = document.getElementById(`${remoteId}-controlType`);

    // Populate icon grid
    populateIconGrid(iconGrid);

    // Render switches
    renderSwitches(switchGrid, remoteData.switches, remoteId);

    // Setup event listeners
    setupEventListeners(remoteId, modal, panelSwitch, panelEdit, panelControl,
      mainButton, closeModalBtn, cancelEditBtn, editForm,
      switchNameInput, entityIdInput, controlTypeSelect,
      switchGrid, iconGrid, remoteData);
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

  // Setup event listeners for a switch - FIXED for mobile
  const setupSwitchEventListeners = (switchBtn, index, switchesData, remoteId) => {
    const LONG_PRESS_DURATION = 500; // 500ms for long press
    let pressTimer = null;
    let isLongPress = false;
    let touchStartTime = 0;
    let touchMoved = false;
    let startX = 0, startY = 0;

    // Mouse events for desktop
    switchBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      pressTimer = setTimeout(() => {
        isLongPress = true;
        openEditPanel(index, remoteId);
      }, LONG_PRESS_DURATION);
    });

    switchBtn.addEventListener('mouseup', (e) => {
      e.preventDefault();
      clearTimeout(pressTimer);

      if (!isLongPress) {
        handleSwitchClick(index, remoteId);
      }
      isLongPress = false;
    });

    switchBtn.addEventListener('mouseleave', () => {
      clearTimeout(pressTimer);
      isLongPress = false;
    });

    // Touch events for mobile
    switchBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      touchStartTime = Date.now();
      touchMoved = false;

      pressTimer = setTimeout(() => {
        if (!touchMoved) {
          isLongPress = true;
          openEditPanel(index, remoteId);
        }
      }, LONG_PRESS_DURATION);
    });

    switchBtn.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startX);
      const deltaY = Math.abs(touch.clientY - startY);

      // If moved more than 10px, consider it a scroll/move not a tap
      if (deltaX > 10 || deltaY > 10) {
        touchMoved = true;
        clearTimeout(pressTimer);
      }
    });

    switchBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();

      clearTimeout(pressTimer);

      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;

      // Only trigger click if it was a quick tap (less than 300ms) and no movement
      if (!isLongPress && !touchMoved && touchDuration < 300) {
        handleSwitchClick(index, remoteId);
      }

      isLongPress = false;
      touchMoved = false;
    });

    switchBtn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(pressTimer);
      isLongPress = false;
      touchMoved = false;
    });

    // Prevent context menu on long press
    switchBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  };

  // Handle switch click - FIXED for mobile
  const handleSwitchClick = (index, remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    const sw = remoteData.switches[index];

    // If no entity ID, open edit panel
    if (!sw.entityId || sw.entityId.trim() === '') {
      openEditPanel(index, remoteId);
      return;
    }

    if (sw.controlType === 'toggle') {
      toggleSwitch(index, remoteId);
    } else {
      openControlPanel(index, remoteId);
    }
  };

  // Open control panel
  const openControlPanel = (index, remoteId) => {
    activeControlIndex = index;
    currentRemoteId = remoteId;

    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    const sw = remoteData.switches[index];

    const panelSwitch = document.getElementById(`${remoteId}-panelSwitch`);
    const panelEdit = document.getElementById(`${remoteId}-panelEdit`);
    const panelControl = document.getElementById(`${remoteId}-panelControl`);
    const controlTitle = document.getElementById(`${remoteId}-controlTitle`);

    if (controlTitle) controlTitle.textContent = sw.name + ' control';

    renderControlUI(sw, remoteId);

    panelSwitch.classList.add('hidden');
    panelEdit.classList.add('hidden');
    panelControl.classList.remove('hidden');
  };

  // Render control UI
  const renderControlUI = (sw, remoteId) => {
    const controlContainer = document.getElementById(`${remoteId}-controlContainer`);
    if (!controlContainer) return;

    const type = sw.controlType;
    let html = '';

    if (type === 'dimmer') {
      let b = getBrightness(sw.entityId);
      html = `<div class="remote-slider-unit">
                <span class="remote-slider-label">Brightness</span>
                <input type="range" min="0" max="100" value="${b}" class="remote-dynamic-slider remote-brightness-slider" id="${remoteId}-dimmerSlider">
                <div class="remote-control-value" id="${remoteId}-dimmerValue">${b}%</div>
              </div>`;
    } else if (type === 'cct') {
      let b = getBrightness(sw.entityId);
      let t = getColorTemp(sw.entityId);
      let kelvin = Math.round(6500 - (t / 100) * (6500 - 2000));
      html = `<div class="remote-slider-unit">
                <span class="remote-slider-label">Brightness</span>
                <input type="range" min="0" max="100" value="${b}" class="remote-dynamic-slider remote-brightness-slider" id="${remoteId}-cctBrightSlider">
                <div class="remote-control-value" id="${remoteId}-cctBrightValue">${b}%</div>
              </div>
              <div class="remote-slider-unit">
                <span class="remote-slider-label">Color temp</span>
                <input type="range" min="0" max="100" value="${t}" class="remote-dynamic-slider remote-temp-slider" id="${remoteId}-cctTempSlider">
                <div class="remote-control-value" id="${remoteId}-cctTempValue">${kelvin}K</div>
              </div>`;
    } else if (type === 'rgb') {
      let b = getBrightness(sw.entityId);
      let h = getHue(sw.entityId);
      html = `<div class="remote-slider-unit">
                <span class="remote-slider-label">Brightness</span>
                <input type="range" min="0" max="100" value="${b}" class="remote-dynamic-slider remote-brightness-slider" id="${remoteId}-rgbBrightSlider">
                <div class="remote-control-value" id="${remoteId}-rgbBrightValue">${b}%</div>
              </div>
              <div class="remote-slider-unit">
                <span class="remote-slider-label">Hue</span>
                <input type="range" min="0" max="360" value="${h}" class="remote-dynamic-slider remote-rgb-slider" id="${remoteId}-rgbHueSlider">
                <div class="remote-control-value" id="${remoteId}-rgbHueValue">Hue ${h}°</div>
              </div>`;
    } else if (type === 'curtain') {
      let pos = getCurtainPosition(sw.entityId);
      html = `<div class="remote-slider-unit">
                <span class="remote-slider-label">Position</span>
                <input type="range" min="0" max="100" value="${pos}" class="remote-dynamic-slider remote-brightness-slider" id="${remoteId}-curtainSlider">
                <div class="remote-control-value" id="${remoteId}-curtainValue">${pos}%</div>
              </div>`;
    } else {
      html = '<div class="remote-toggle-placeholder">Toggle mode</div>';
    }

    controlContainer.innerHTML = html;

    // Attach events after DOM is updated
    setTimeout(() => {
      attachControlEvents(type, sw, remoteId);
    }, 0);
  };

  // Attach control events - FIXED for 3D rotation
  const attachControlEvents = (type, sw, remoteId) => {
    if (type === 'dimmer') {
      const s = document.getElementById(`${remoteId}-dimmerSlider`);
      const v = document.getElementById(`${remoteId}-dimmerValue`);
      if (s) {
        // Remove any inline styles that might add blue overlay
        s.style.boxShadow = 'none';

        // Stop propagation to prevent 3D rotation
        s.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });
        s.addEventListener('touchstart', (e) => {
          e.stopPropagation();
        });
        s.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
        });

        s.addEventListener('input', (e) => {
          e.stopPropagation();
          v.textContent = e.target.value + '%';
        });
        s.addEventListener('change', (e) => {
          e.stopPropagation();
          let val = parseInt(e.target.value);
          callService('light', 'turn_on', { entity_id: sw.entityId, brightness_pct: val });
        });
      }
    }
    if (type === 'cct') {
      const bs = document.getElementById(`${remoteId}-cctBrightSlider`);
      const bv = document.getElementById(`${remoteId}-cctBrightValue`);
      if (bs) {
        bs.style.boxShadow = 'none';
        bs.addEventListener('mousedown', (e) => e.stopPropagation());
        bs.addEventListener('touchstart', (e) => e.stopPropagation());
        bs.addEventListener('pointerdown', (e) => e.stopPropagation());
        bs.addEventListener('input', (e) => {
          e.stopPropagation();
          bv.textContent = e.target.value + '%';
        });
        bs.addEventListener('change', (e) => {
          e.stopPropagation();
          callService('light', 'turn_on', { entity_id: sw.entityId, brightness_pct: parseInt(e.target.value) });
        });
      }
      const ts = document.getElementById(`${remoteId}-cctTempSlider`);
      const tv = document.getElementById(`${remoteId}-cctTempValue`);
      if (ts) {
        ts.style.boxShadow = 'none';
        ts.addEventListener('mousedown', (e) => e.stopPropagation());
        ts.addEventListener('touchstart', (e) => e.stopPropagation());
        ts.addEventListener('pointerdown', (e) => e.stopPropagation());
        const updateTemp = (val) => { let k = Math.round(6500 - (val / 100) * (6500 - 2000)); tv.textContent = k + 'K'; };
        ts.addEventListener('input', (e) => {
          e.stopPropagation();
          updateTemp(e.target.value);
        });
        ts.addEventListener('change', (e) => {
          e.stopPropagation();
          let mireds = Math.round(153 + (500 - 153) * (e.target.value / 100));
          callService('light', 'turn_on', { entity_id: sw.entityId, color_temp: mireds });
        });
      }
    }
    if (type === 'rgb') {
      const bs = document.getElementById(`${remoteId}-rgbBrightSlider`);
      const bv = document.getElementById(`${remoteId}-rgbBrightValue`);
      if (bs) {
        bs.style.boxShadow = 'none';
        bs.addEventListener('mousedown', (e) => e.stopPropagation());
        bs.addEventListener('touchstart', (e) => e.stopPropagation());
        bs.addEventListener('pointerdown', (e) => e.stopPropagation());
        bs.addEventListener('input', (e) => {
          e.stopPropagation();
          bv.textContent = e.target.value + '%';
        });
        bs.addEventListener('change', (e) => {
          e.stopPropagation();
          callService('light', 'turn_on', { entity_id: sw.entityId, brightness_pct: parseInt(e.target.value) });
        });
      }
      const hs = document.getElementById(`${remoteId}-rgbHueSlider`);
      const hv = document.getElementById(`${remoteId}-rgbHueValue`);
      if (hs) {
        hs.style.boxShadow = 'none';
        hs.addEventListener('mousedown', (e) => e.stopPropagation());
        hs.addEventListener('touchstart', (e) => e.stopPropagation());
        hs.addEventListener('pointerdown', (e) => e.stopPropagation());
        hs.addEventListener('input', (e) => {
          e.stopPropagation();
          hv.textContent = `Hue ${e.target.value}°`;
        });
        hs.addEventListener('change', (e) => {
          e.stopPropagation();
          let h = parseInt(e.target.value);
          callService('light', 'turn_on', { entity_id: sw.entityId, hs_color: [h, 100] });
        });
      }
    }
    if (type === 'curtain') {
      const s = document.getElementById(`${remoteId}-curtainSlider`);
      const v = document.getElementById(`${remoteId}-curtainValue`);
      if (s) {
        s.style.boxShadow = 'none';
        s.addEventListener('mousedown', (e) => e.stopPropagation());
        s.addEventListener('touchstart', (e) => e.stopPropagation());
        s.addEventListener('pointerdown', (e) => e.stopPropagation());
        s.addEventListener('input', (e) => {
          e.stopPropagation();
          v.textContent = e.target.value + '%';
        });
        s.addEventListener('change', (e) => {
          e.stopPropagation();
          callService('cover', 'set_cover_position', { entity_id: sw.entityId, position: parseInt(e.target.value) });
        });
      }
    }
  };

  // Toggle switch - FIXED
  const toggleSwitch = async (index, remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    const sw = remoteData.switches[index];

    // If no entity ID, open edit panel
    if (!sw.entityId || sw.entityId.trim() === '') {
      openEditPanel(index, remoteId);
      return;
    }

    const now = Date.now();
    if (sw._lastToggle && (now - sw._lastToggle) < 500) return;

    const current = sw.active;

    // Optimistic update
    sw.active = !current;
    updateSwitchVisualState(remoteId, index, sw.active);

    try {
      if (HA_CONFIG.connected && HA_CONFIG.socket) {
        const domain = sw.entityId.split('.')[0];
        callService(domain, 'toggle', { entity_id: sw.entityId });
        sw._lastToggle = Date.now();
      } else {
        // If not connected, revert
        sw.active = current;
        updateSwitchVisualState(remoteId, index, current);
      }
    } catch {
      sw.active = current;
      updateSwitchVisualState(remoteId, index, current);
    }
  };

  // Open edit panel
  const openEditPanel = (index, remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    currentEditIndex = index;
    currentRemoteId = remoteId;
    const sw = remoteData.switches[index];

    const panelSwitch = document.getElementById(`${remoteId}-panelSwitch`);
    const panelEdit = document.getElementById(`${remoteId}-panelEdit`);
    const panelControl = document.getElementById(`${remoteId}-panelControl`);
    const switchNameInput = document.getElementById(`${remoteId}-switchName`);
    const entityIdInput = document.getElementById(`${remoteId}-entityId`);
    const controlTypeSelect = document.getElementById(`${remoteId}-controlType`);
    const iconGrid = document.getElementById(`${remoteId}-iconGrid`);

    if (!switchNameInput || !entityIdInput || !controlTypeSelect || !iconGrid) return;

    switchNameInput.value = sw.name;
    entityIdInput.value = sw.entityId;
    controlTypeSelect.value = sw.controlType || 'toggle';
    selectedIcon = sw.icon;

    // Update icon selection
    document.querySelectorAll(`#${iconGrid.id} .remote-icon-option`).forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.icon === sw.icon) {
        opt.classList.add('selected');
      }
    });

    panelSwitch.classList.add('hidden');
    panelControl.classList.add('hidden');
    panelEdit.classList.remove('hidden');

    setTimeout(() => {
      switchNameInput.focus();
    }, 100);
  };

  // Show switch panel - FIXED
const showSwitchPanel = (remoteId) => {
  console.log('Showing switch panel for:', remoteId); // Debug log
  
  const panelSwitch = document.getElementById(`${remoteId}-panelSwitch`);
  const panelEdit = document.getElementById(`${remoteId}-panelEdit`);
  const panelControl = document.getElementById(`${remoteId}-panelControl`);
  const modal = document.getElementById(`${remoteId}-modal`);
  const mainButton = document.getElementById(`${remoteId}-mainButton`);
  
  if (panelSwitch && panelEdit && panelControl) {
    // Hide edit and control panels
    panelEdit.classList.add('hidden');
    panelControl.classList.add('hidden');
    // Show switch panel
    panelSwitch.classList.remove('hidden');
    console.log('Switch panel should now be visible');
  }
  
  // Don't close the modal, just show the switch panel
  if (modal && modal.classList.contains('show')) {
    // Keep modal open
    console.log('Modal remains open');
  }
  
  activeControlIndex = -1;
  currentEditIndex = -1;
};

// Add a function to close the modal completely
const closeRemoteModal = (remoteId) => {
  const modal = document.getElementById(`${remoteId}-modal`);
  const mainButton = document.getElementById(`${remoteId}-mainButton`);
  
  if (modal) {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
  
  if (mainButton) {
    mainButton.classList.remove('active-main');
    mainButton.style.display = 'flex';
  }
};

  // Setup event listeners for a remote instance - FIXED
  const setupEventListeners = (id, modal, panelSwitch, panelEdit, panelControl,
    mainButton, closeModalBtn, cancelEditBtn, editForm,
    switchNameInput, entityIdInput, controlTypeSelect,
    switchGrid, iconGrid, remoteData) => {

    // Open main modal
    mainButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      showSwitchPanel(id);
      modal.classList.add('show');
      mainButton.classList.add('active-main');
      mainButton.style.display = 'none';
      // Disable 3D rotation when modal is open
      document.body.classList.add('modal-open');
    });

    mainButton.addEventListener('touchend', (e) => {
      e.stopPropagation();
      e.preventDefault();
      showSwitchPanel(id);
      modal.classList.add('show');
      mainButton.classList.add('active-main');
      mainButton.style.display = 'none';
      // Disable 3D rotation when modal is open
      document.body.classList.add('modal-open');
    });

    // Close button - FIXED for mobile
    const handleCloseButton = (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log('Close button clicked'); // Debug log

      // Check which panel is visible
      if (!panelSwitch.classList.contains('hidden')) {
        // On main grid → close modal
        console.log('Closing modal');
        modal.classList.remove('show');
        mainButton.classList.remove('active-main');
        mainButton.style.display = 'flex';
        // Re-enable 3D rotation when modal is closed
        document.body.classList.remove('modal-open');
      } else {
        // In edit or control → go back to switch panel
        console.log('Going back to switch panel');
        showSwitchPanel(id);
      }
    };

    closeModalBtn.addEventListener('click', handleCloseButton);
    closeModalBtn.addEventListener('touchend', handleCloseButton);

    // Prevent touchstart from triggering other events
    closeModalBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Cancel edit button - FIXED
    const handleCancelEdit = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Cancel edit clicked');
      showSwitchPanel(id);
    };

    cancelEditBtn.addEventListener('click', handleCancelEdit);
    cancelEditBtn.addEventListener('touchend', handleCancelEdit);

    cancelEditBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Save edit
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (currentEditIndex === -1 || !currentRemoteId) return;

      const name = switchNameInput.value.trim().substring(0, 8);
      const entityId = entityIdInput.value.trim();
      const ctrlType = controlTypeSelect.value;

      if (!name || !entityId) return;

      const remote = remotesData.get(currentRemoteId);
      if (!remote) return;

      remote.switches[currentEditIndex] = {
        ...remote.switches[currentEditIndex],
        name: name,
        entityId: entityId,
        icon: selectedIcon,
        controlType: ctrlType,
        active: false,
        _lastToggle: 0
      };

      renderSwitches(switchGrid, remote.switches, id);
      showSwitchPanel(id);
    });

    // Fix input field click issues
    [switchNameInput, entityIdInput, controlTypeSelect].forEach(input => {
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

    // Close modals when clicking outside - FIXED
    const handleOutsideClick = (e) => {
      if (e.target === modal) {
        e.preventDefault();
        e.stopPropagation();

        if (!panelSwitch.classList.contains('hidden')) {
          // On main grid → close modal
          modal.classList.remove('show');
          mainButton.classList.remove('active-main');
          mainButton.style.display = 'flex';
          // Re-enable 3D rotation when modal is closed
          document.body.classList.remove('modal-open');
        } else {
          // In edit or control → go back to switch panel
          showSwitchPanel(id);
        }
      }
    };

    modal.addEventListener('click', handleOutsideClick);
    modal.addEventListener('touchend', handleOutsideClick);

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        if (!panelSwitch.classList.contains('hidden')) {
          modal.classList.remove('show');
          mainButton.classList.remove('active-main');
          mainButton.style.display = 'flex';
          // Re-enable 3D rotation when modal is closed
          document.body.classList.remove('modal-open');
        } else {
          showSwitchPanel(id);
        }
      }
    });
  };

  // Public API
  return {
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
      const modal = document.getElementById(`${remoteId}-modal`);
      const mainButton = document.getElementById(`${remoteId}-mainButton`);
      if (modal && mainButton) {
        showSwitchPanel(remoteId);
        modal.classList.add('show');
        mainButton.classList.add('active-main');
        mainButton.style.display = 'none';
      }
    },

    // Delete a remote by ID - ADDED HERE
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
          switches: remoteData.switches.map(sw => ({
            name: sw.name,
            icon: sw.icon,
            entityId: sw.entityId,
            active: sw.active,
            controlType: sw.controlType || 'toggle'
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
            entityId: sw.entityId || "",
            active: false,
            controlType: sw.controlType || 'toggle',
            _lastToggle: 0
          }));
        } else {
          // Use defaults if no switches provided
          savedSwitches = JSON.parse(JSON.stringify(DEFAULT_SWITCHES));
        }

        // Create remote with saved switches
        createRemoteModal(position, remoteData.targetScene || '', savedSwitches);
      });

      // If HA is connected, fetch states for all loaded entities
      if (HA_CONFIG.connected) {
        updateSwitchesFromHA();
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
      callService(domain, service, data);
    },

    // Sync all switches with Home Assistant state
    syncWithHA: async () => {
      if (!HA_CONFIG.connected) {
        console.log('Home Assistant not connected, attempting to connect...');
        initWebSocket();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      updateSwitchesFromHA();
      return { success: HA_CONFIG.connected, message: HA_CONFIG.connected ? 'Sync completed' : 'Not connected' };
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