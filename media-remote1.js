// media-remote.js - Media Remote Control Module for 360 Scene Editor with Home Assistant Integration

const MediaRemoteModule = (() => {
  // Available Font Awesome icons
  const ICONS = [
    { class: 'fas fa-power-off', name: 'Power' },
    { class: 'fas fa-tv', name: 'TV' },
    { class: 'fas fa-volume-up', name: 'Volume Up' },
    { class: 'fas fa-volume-down', name: 'Volume Down' },
    { class: 'fas fa-volume-mute', name: 'Mute' },
    { class: 'fas fa-arrow-left', name: 'Left' },
    { class: 'fas fa-home', name: 'Home' },
    { class: 'fas fa-arrow-right', name: 'Right' },
    { class: 'fas fa-arrow-up', name: 'Up' },
    { class: 'fas fa-arrow-down', name: 'Down' },
    { class: 'fas fa-circle', name: 'Circle' },
    { class: 'fas fa-bars', name: 'Menu' },
    { class: 'fas fa-cog', name: 'Settings' },
    { class: 'fas fa-lightbulb', name: 'Light' },
    { class: 'fas fa-plug', name: 'Plug' },
    { class: 'fas fa-play', name: 'Play' },
    { class: 'fas fa-pause', name: 'Pause' },
    { class: 'fas fa-stop', name: 'Stop' },
    { class: 'fas fa-forward', name: 'Forward' },
    { class: 'fas fa-backward', name: 'Backward' },
    { class: 'fas fa-redo', name: 'Next' },
    { class: 'fas fa-undo', name: 'Previous' },
    { class: 'fas fa-sun', name: 'Sun' },
    { class: 'fas fa-moon', name: 'Moon' },
    { class: 'fas fa-fan', name: 'Fan' },
    { class: 'fas fa-thermometer-half', name: 'Temp' },
    { class: 'fas fa-door-closed', name: 'Door' },
    { class: 'fas fa-lock', name: 'Lock' },
    { class: 'fas fa-unlock', name: 'Unlock' },
    { class: 'fas fa-camera', name: 'Camera' },
    { class: 'fas fa-microphone', name: 'Mic' },
    { class: 'fas fa-music', name: 'Music' }
  ];

  // Default buttons for media remote
  const DEFAULT_BUTTONS = [
    { icon: 'fas fa-power-off', text: 'Power', entityType: 'remote', entityId: 'remote.tv', service: 'remote.turn_on', command: '', textColor: '#000000', bgColor: '#ffffff' },
    { icon: 'fas fa-arrow-up', text: 'Up', entityType: 'remote', entityId: 'remote.tv', service: 'remote.send_command', command: 'UP', textColor: '#000000', bgColor: '#ffffff' },
    { icon: 'fas fa-home', text: 'Home', entityType: 'remote', entityId: 'remote.tv', service: 'remote.send_command', command: 'HOME', textColor: '#000000', bgColor: '#ffffff' },
    { icon: 'fas fa-arrow-left', text: 'Left', entityType: 'remote', entityId: 'remote.tv', service: 'remote.send_command', command: 'LEFT', textColor: '#000000', bgColor: '#ffffff' },
    { icon: 'fas fa-circle', text: 'OK', entityType: 'remote', entityId: 'remote.tv', service: 'remote.send_command', command: 'OK', textColor: '#000000', bgColor: '#ffffff' },
    { icon: 'fas fa-arrow-right', text: 'Right', entityType: 'remote', entityId: 'remote.tv', service: 'remote.send_command', command: 'RIGHT', textColor: '#000000', bgColor: '#ffffff' },
    { icon: 'fas fa-undo', text: 'Back', entityType: 'remote', entityId: 'remote.tv', service: 'remote.send_command', command: 'BACK', textColor: '#000000', bgColor: '#ffffff' },
    { icon: 'fas fa-arrow-down', text: 'Down', entityType: 'remote', entityId: 'remote.tv', service: 'remote.send_command', command: 'DOWN', textColor: '#000000', bgColor: '#ffffff' },
    { icon: 'fas fa-bars', text: 'Menu', entityType: 'remote', entityId: 'remote.tv', service: 'remote.send_command', command: 'MENU', textColor: '#000000', bgColor: '#ffffff' }
  ];

  let instanceId = 1;
  let remotesData = new Map();
  let currentEditIndex = -1;
  let selectedIcon = 'fas fa-tv';
  let currentRemoteId = null;
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
        break;

      case 'auth_invalid':
        console.error('Authentication failed:', message.message);
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
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (HA_CONFIG.pendingRequests.has(messageId)) {
          HA_CONFIG.pendingRequests.delete(messageId);
          reject(new Error('Command timeout'));
        }
      }, 5000);
    });
  };

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

  // Function to enable body for 3D rotation
  const enableBodyRotation = () => {
    document.body.classList.remove('media-remote-modal-active');
  };

  // Function to disable body for 3D rotation
  const disableBodyRotation = () => {
    document.body.classList.add('media-remote-modal-active');
  };

  // Show main panel
  const showMainPanel = (remoteId) => {
    const panelGrid = document.getElementById(`${remoteId}-panelGrid`);
    const panelEdit = document.getElementById(`${remoteId}-panelEdit`);
    const deleteConfirmation = document.getElementById(`${remoteId}-deleteConfirmation`);
    
    if (panelGrid && panelEdit) {
      panelGrid.classList.remove('hidden');
      panelEdit.classList.add('hidden');
      if (deleteConfirmation) deleteConfirmation.classList.add('hidden');
    }
    
    document.getElementById(`${remoteId}-modalTitle`).textContent = 'Remote Control';
    document.getElementById(`${remoteId}-modalSubtitle`).textContent = 'Smart Controller';
  };

  // Create HTML structure for media remote modal
  const createRemoteModal = (position, targetScene, buttonsOverride = null) => {
    const remoteId = `media-remote-${instanceId++}`;

    // Create buttons for this remote - use provided buttons or defaults
    const buttons = buttonsOverride ? JSON.parse(JSON.stringify(buttonsOverride)) : JSON.parse(JSON.stringify(DEFAULT_BUTTONS));

    const container = document.createElement('div');
    container.className = 'media-remote-container';
    container.id = remoteId;
    container.dataset.position = JSON.stringify(position);
    container.dataset.targetScene = targetScene || '';
    container.dataset.visible = 'true';
    container.setAttribute('data-remote-type', 'media');
    container.style.position = 'absolute';
    container.style.zIndex = '1000';
    container.style.pointerEvents = 'auto';
    container.style.transform = 'translate(-50%, -50%)';

    container.innerHTML = `
      <!-- Main Button -->
      <button class="media-remote-main-button" id="${remoteId}-mainButton">
        <i class="fa-solid fa-traffic-light"></i>
      </button>

      <!-- Main Modal -->
      <div class="media-remote-modal" id="${remoteId}-modal">
        <div class="media-remote-modal-content">
          <button class="media-remote-close-btn" id="${remoteId}-closeModal">
            <i class="fas fa-times"></i>
          </button>
          
          <button class="media-remote-edit-btn" id="${remoteId}-editBtn">
            <i class="fas fa-edit"></i>
          </button>

          <div class="media-remote-title" id="${remoteId}-modalTitle">Remote Control</div>
          <div class="media-remote-subtitle" id="${remoteId}-modalSubtitle">Smart Controller</div>

          <!-- Panel 1: Button grid -->
          <div id="${remoteId}-panelGrid" class="media-remote-panel">
            <div class="media-remote-grid" id="${remoteId}-buttonGrid"></div>
            <div class="media-remote-empty-state" id="${remoteId}-emptyState" style="display: none;">
              <i class="fas fa-plus-circle"></i><br>
              No buttons yet. Click the edit button to add your first button.
            </div>
          </div>

          <!-- Panel 2: edit form -->
          <div id="${remoteId}-panelEdit" class="media-remote-panel hidden">
            <div class="media-remote-form" id="${remoteId}-editForm">
              <div class="media-remote-form-group">
                <label class="media-remote-form-label">Button Icon</label>
                <input type="text" class="media-remote-form-input" id="${remoteId}-buttonIcon" value="fas fa-plus">
                <div class="media-remote-icon-grid" id="${remoteId}-iconGrid"></div>
              </div>

              <div class="media-remote-form-group">
                <label class="media-remote-form-label">Button Text</label>
                <input type="text" class="media-remote-form-input" id="${remoteId}-buttonText" value="New Button" maxlength="12">
              </div>

              <div class="media-remote-form-group">
                <label class="media-remote-form-label">Entity Type</label>
                <select class="media-remote-form-select" id="${remoteId}-entityType">
                  <option value="remote">Remote Control</option>
                  <option value="switch">Switch</option>
                </select>
              </div>

              <div id="${remoteId}-remoteConfig" class="media-remote-form-group">
                <label class="media-remote-form-label">Remote Entity ID</label>
                <input type="text" class="media-remote-form-input" id="${remoteId}-remoteEntity" placeholder="remote.living_room_tv">

                <label class="media-remote-form-label" style="margin-top: 10px;">Remote Service</label>
                <select class="media-remote-form-select" id="${remoteId}-remoteService">
                  <option value="">Select service...</option>
                  <option value="remote.send_command">remote.send_command</option>
                  <option value="remote.turn_on">remote.turn_on</option>
                  <option value="remote.turn_off">remote.turn_off</option>
                </select>

                <div id="${remoteId}-commandContainer" style="margin-top: 10px; display: none;">
                  <label class="media-remote-form-label">Command</label>
                  <input type="text" class="media-remote-form-input" id="${remoteId}-remoteCommand" placeholder="power, volume_up, etc.">
                </div>
              </div>

              <div id="${remoteId}-switchConfig" class="media-remote-form-group" style="display: none;">
                <label class="media-remote-form-label">Switch Entity ID</label>
                <input type="text" class="media-remote-form-input" id="${remoteId}-switchEntity" placeholder="switch.living_room_lamp">
              </div>

              <div class="media-remote-form-group">
                <label class="media-remote-form-label">Text Color</label>
                <div class="media-remote-color-picker-container">
                  <input type="color" class="media-remote-color-picker" id="${remoteId}-textColor" value="#000000">
                  <span class="media-remote-color-value" id="${remoteId}-textColorValue">#000000</span>
                </div>
              </div>

              <div class="media-remote-form-group">
                <label class="media-remote-form-label">Background Color</label>
                <div class="media-remote-color-picker-container">
                  <input type="color" class="media-remote-color-picker" id="${remoteId}-bgColor" value="#ffffff">
                  <span class="media-remote-color-value" id="${remoteId}-bgColorValue">#ffffff</span>
                </div>
              </div>

              <div class="media-remote-form-group">
                <label class="media-remote-form-label">Button Preview</label>
                <div class="media-remote-button-preview" id="${remoteId}-buttonPreview">
                  <i class="fas fa-plus media-remote-preview-icon"></i>
                  <span class="media-remote-preview-label">New Button</span>
                </div>
              </div>

              <div class="media-remote-form-actions">
                <button type="button" class="media-remote-form-btn danger" id="${remoteId}-deleteButton" style="display: none;">Delete</button>
                <button type="button" class="media-remote-form-btn cancel" id="${remoteId}-cancelEdit">Cancel</button>
                <button type="submit" class="media-remote-form-btn save" id="${remoteId}-saveButton">Save Button</button>
              </div>
            </div>
          </div>

          <!-- Delete Confirmation -->
          <div id="${remoteId}-deleteConfirmation" class="media-remote-delete-confirmation hidden">
            <h3 style="color: #ff3b30; margin-bottom: 15px;">Delete Button</h3>
            <p>Are you sure you want to delete this button? This action cannot be undone.</p>
            <div class="media-remote-form-actions">
              <button type="button" class="media-remote-form-btn cancel" id="${remoteId}-cancelDelete">Cancel</button>
              <button type="button" class="media-remote-form-btn danger" id="${remoteId}-confirmDelete">Delete</button>
            </div>
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
      buttons: buttons,
      active: false,
      container: container,
      visible: true,
      isEditMode: false,
      currentButtonIndex: null
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
    const panelGrid = document.getElementById(`${remoteId}-panelGrid`);
    const panelEdit = document.getElementById(`${remoteId}-panelEdit`);
    const deleteConfirmation = document.getElementById(`${remoteId}-deleteConfirmation`);
    const buttonGrid = document.getElementById(`${remoteId}-buttonGrid`);
    const iconGrid = document.getElementById(`${remoteId}-iconGrid`);
    const emptyState = document.getElementById(`${remoteId}-emptyState`);
    const mainButton = document.getElementById(`${remoteId}-mainButton`);
    const closeModalBtn = document.getElementById(`${remoteId}-closeModal`);
    const editBtn = document.getElementById(`${remoteId}-editBtn`);
    const cancelEditBtn = document.getElementById(`${remoteId}-cancelEdit`);
    const saveButton = document.getElementById(`${remoteId}-saveButton`);
    const deleteButton = document.getElementById(`${remoteId}-deleteButton`);
    const cancelDelete = document.getElementById(`${remoteId}-cancelDelete`);
    const confirmDelete = document.getElementById(`${remoteId}-confirmDelete`);
    const entityType = document.getElementById(`${remoteId}-entityType`);
    const remoteService = document.getElementById(`${remoteId}-remoteService`);
    const textColor = document.getElementById(`${remoteId}-textColor`);
    const bgColor = document.getElementById(`${remoteId}-bgColor`);
    const textColorValue = document.getElementById(`${remoteId}-textColorValue`);
    const bgColorValue = document.getElementById(`${remoteId}-bgColorValue`);
    const buttonIcon = document.getElementById(`${remoteId}-buttonIcon`);
    const buttonText = document.getElementById(`${remoteId}-buttonText`);
    const remoteEntity = document.getElementById(`${remoteId}-remoteEntity`);
    const remoteCommand = document.getElementById(`${remoteId}-remoteCommand`);
    const switchEntity = document.getElementById(`${remoteId}-switchEntity`);
    const commandContainer = document.getElementById(`${remoteId}-commandContainer`);
    const remoteConfig = document.getElementById(`${remoteId}-remoteConfig`);
    const switchConfig = document.getElementById(`${remoteId}-switchConfig`);
    const buttonPreview = document.getElementById(`${remoteId}-buttonPreview`);
    const modalTitle = document.getElementById(`${remoteId}-modalTitle`);
    const modalSubtitle = document.getElementById(`${remoteId}-modalSubtitle`);

    // Populate icon grid
    populateIconGrid(iconGrid, remoteId);

    // Render buttons
    renderButtons(buttonGrid, emptyState, remoteData.buttons, remoteId);

    // Setup event listeners
    setupEventListeners(remoteId, modal, panelGrid, panelEdit, deleteConfirmation,
      mainButton, closeModalBtn, editBtn, cancelEditBtn, saveButton, deleteButton,
      cancelDelete, confirmDelete, buttonGrid, iconGrid, emptyState,
      entityType, remoteService, textColor, bgColor, textColorValue, bgColorValue,
      buttonIcon, buttonText, remoteEntity, remoteCommand, switchEntity,
      commandContainer, remoteConfig, switchConfig, buttonPreview,
      modalTitle, modalSubtitle, remoteData);
  };

  // Populate icon selection grid
  const populateIconGrid = (iconGridElement, remoteId) => {
    if (!iconGridElement) return;

    iconGridElement.innerHTML = '';
    ICONS.forEach(icon => {
      const iconOption = document.createElement('div');
      iconOption.className = 'media-remote-icon-option';
      iconOption.dataset.icon = icon.class;

      const iconEl = document.createElement('i');
      iconEl.className = icon.class;

      iconOption.appendChild(iconEl);
      iconGridElement.appendChild(iconOption);

      iconOption.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll(`#${iconGridElement.id} .media-remote-icon-option`).forEach(opt => {
          opt.classList.remove('selected');
        });
        iconOption.classList.add('selected');
        selectedIcon = icon.class;
        document.getElementById(`${remoteId}-buttonIcon`).value = icon.class;
        updatePreview(remoteId);
      });

      iconOption.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(`#${iconGridElement.id} .media-remote-icon-option`).forEach(opt => {
          opt.classList.remove('selected');
        });
        iconOption.classList.add('selected');
        selectedIcon = icon.class;
        document.getElementById(`${remoteId}-buttonIcon`).value = icon.class;
        updatePreview(remoteId);
      });
    });
  };

  // Render buttons
  const renderButtons = (gridElement, emptyState, buttonsData, remoteId) => {
    if (!gridElement) return;

    // Remove only buttons, not emptyState
    gridElement.querySelectorAll('.media-remote-btn').forEach(b => b.remove());

    if (buttonsData.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    buttonsData.forEach((button, index) => {
      const btnElement = document.createElement('button');
      btnElement.className = 'media-remote-btn';
      btnElement.dataset.index = index;
      btnElement.dataset.remoteId = remoteId;

      btnElement.style.color = button.textColor || '#000';
      if (!button.bgColor || button.bgColor.toLowerCase() === '#ffffff') {
        btnElement.style.background = '#ffffff';
      } else {
        btnElement.style.background = `linear-gradient(145deg, ${button.bgColor}, ${darkenColor(button.bgColor, 20)})`;
      }

      btnElement.innerHTML = `
        <i class="${button.icon} media-remote-btn-icon"></i>
        <span class="media-remote-btn-label">${button.text}</span>
      `;

      // CLICK → SEND COMMAND
      btnElement.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Button clicked:', button);
        sendToHomeAssistant(button, remoteId);
        
        // Add press down effect
        btnElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btnElement.style.transform = 'scale(1)';
        }, 150);
      });

      btnElement.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Button touched:', button);
        sendToHomeAssistant(button, remoteId);
        
        // Add press down effect
        btnElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btnElement.style.transform = 'scale(1)';
        }, 150);
      });

      // LONG PRESS → OPEN EDIT
      btnElement.addEventListener('mousedown', (e) => startLongPress(e, btnElement, index, remoteId));
      btnElement.addEventListener('touchstart', (e) => startLongPress(e, btnElement, index, remoteId));

      btnElement.addEventListener('mouseup', cancelLongPress);
      btnElement.addEventListener('mouseleave', cancelLongPress);
      btnElement.addEventListener('touchend', cancelLongPress);
      btnElement.addEventListener('touchcancel', cancelLongPress);

      // Prevent context menu
      btnElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });

      gridElement.appendChild(btnElement);
    });
  };

  // Long press handlers
  const startLongPress = (e, btnElement, index, remoteId) => {
    e.preventDefault();
    longPressButton = { btnElement, index, remoteId };
    
    // Add press effect
    btnElement.style.transform = 'scale(0.95)';
    
    longPressTimer = setTimeout(() => {
      if (longPressButton) {
        console.log('Long press detected, opening edit for button:', index);
        editButton(index, remoteId);
        
        // Reset button scale
        if (btnElement) {
          btnElement.style.transform = 'scale(1)';
        }
      }
    }, 700);
  };

  const cancelLongPress = (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    
    // Reset button scale
    if (longPressButton && longPressButton.btnElement) {
      longPressButton.btnElement.style.transform = 'scale(1)';
    }
    
    longPressButton = null;
  };

  // Send command to Home Assistant
  const sendToHomeAssistant = (button, remoteId) => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
      console.warn('Home Assistant not connected');
      alert('Home Assistant not connected');
      return;
    }

    let serviceData = {
      entity_id: button.entityId
    };

    if (button.service === 'remote.send_command') {
      serviceData.command = button.command;
    }

    if (button.service === 'remote.turn_on' && button.command) {
      serviceData.activity = button.command;
    }

    const [domain, service] = button.service.split('.');
    
    console.log(`Calling ${domain}.${service} with data:`, serviceData);
    
    callService(domain, service, serviceData)
      .then(result => {
        console.log('Command sent successfully:', result);
      })
      .catch(error => {
        console.error('Failed to send command:', error);
        alert('Failed to send command: ' + error.message);
      });
  };

  // Edit button
  const editButton = (index, remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    currentEditIndex = index;
    currentRemoteId = remoteId;
    remoteData.currentButtonIndex = index;
    const button = remoteData.buttons[index];

    // Populate form
    document.getElementById(`${remoteId}-buttonIcon`).value = button.icon || 'fas fa-plus';
    document.getElementById(`${remoteId}-buttonText`).value = button.text || '';
    document.getElementById(`${remoteId}-entityType`).value = button.entityType || 'remote';
    document.getElementById(`${remoteId}-textColor`).value = button.textColor || '#000000';
    document.getElementById(`${remoteId}-bgColor`).value = button.bgColor || '#ffffff';
    document.getElementById(`${remoteId}-textColorValue`).textContent = button.textColor || '#000000';
    document.getElementById(`${remoteId}-bgColorValue`).textContent = button.bgColor || '#ffffff';

    // Entity specific fields
    if (button.entityType === 'remote') {
      document.getElementById(`${remoteId}-remoteEntity`).value = button.entityId || '';
      document.getElementById(`${remoteId}-remoteService`).value = button.service || '';
      if (button.command) {
        document.getElementById(`${remoteId}-remoteCommand`).value = button.command;
        document.getElementById(`${remoteId}-commandContainer`).style.display = 'block';
      } else {
        document.getElementById(`${remoteId}-commandContainer`).style.display = 'none';
      }
    } else if (button.entityType === 'switch') {
      document.getElementById(`${remoteId}-switchEntity`).value = button.entityId || '';
    }

    // Update icon selection
    selectedIcon = button.icon;
    document.querySelectorAll(`#${remoteId}-iconGrid .media-remote-icon-option`).forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.icon === button.icon) {
        opt.classList.add('selected');
      }
    });

    handleEntityTypeChange(remoteId);
    updatePreview(remoteId);

    // Show delete button
    document.getElementById(`${remoteId}-deleteButton`).style.display = 'block';

    // Switch to edit panel
    document.getElementById(`${remoteId}-panelGrid`).classList.add('hidden');
    document.getElementById(`${remoteId}-panelEdit`).classList.remove('hidden');
    document.getElementById(`${remoteId}-deleteConfirmation`).classList.add('hidden');
    document.getElementById(`${remoteId}-modalTitle`).textContent = 'Edit Button';
    document.getElementById(`${remoteId}-modalSubtitle`).textContent = 'Modify button settings';
  };

  // Reset edit form
  const resetEditForm = (remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    currentEditIndex = -1;
    currentRemoteId = remoteId;
    remoteData.currentButtonIndex = null;

    document.getElementById(`${remoteId}-buttonIcon`).value = 'fas fa-plus';
    document.getElementById(`${remoteId}-buttonText`).value = 'New Button';
    document.getElementById(`${remoteId}-entityType`).value = 'remote';
    document.getElementById(`${remoteId}-textColor`).value = '#000000';
    document.getElementById(`${remoteId}-bgColor`).value = '#ffffff';
    document.getElementById(`${remoteId}-textColorValue`).textContent = '#000000';
    document.getElementById(`${remoteId}-bgColorValue`).textContent = '#ffffff';
    document.getElementById(`${remoteId}-remoteEntity`).value = '';
    document.getElementById(`${remoteId}-remoteService`).value = '';
    document.getElementById(`${remoteId}-remoteCommand`).value = '';
    document.getElementById(`${remoteId}-switchEntity`).value = '';
    document.getElementById(`${remoteId}-commandContainer`).style.display = 'none';

    // Hide delete button
    document.getElementById(`${remoteId}-deleteButton`).style.display = 'none';

    // Clear icon selection
    document.querySelectorAll(`#${remoteId}-iconGrid .media-remote-icon-option`).forEach(opt => {
      opt.classList.remove('selected');
    });

    updatePreview(remoteId);
  };

  // Save button handler - FIXED
  const handleSaveButton = (remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    const icon = document.getElementById(`${remoteId}-buttonIcon`).value.trim();
    const text = document.getElementById(`${remoteId}-buttonText`).value.trim();
    const entityType = document.getElementById(`${remoteId}-entityType`).value;
    const textColor = document.getElementById(`${remoteId}-textColor`).value;
    const bgColor = document.getElementById(`${remoteId}-bgColor`).value;

    let entityId = '';
    let service = '';
    let command = '';

    if (entityType === 'remote') {
      entityId = document.getElementById(`${remoteId}-remoteEntity`).value.trim();
      service = document.getElementById(`${remoteId}-remoteService`).value;
      if (service === 'remote.send_command' || service === 'remote.turn_on') {
        command = document.getElementById(`${remoteId}-remoteCommand`).value.trim();
      }
    } else if (entityType === 'switch') {
      entityId = document.getElementById(`${remoteId}-switchEntity`).value.trim();
      service = 'switch.toggle';
    }

    // Validation
    if (!text) {
      alert('Please enter button text');
      return;
    }

    if (entityType === 'remote' && (!entityId || !service)) {
      alert('Please enter remote entity ID and select service');
      return;
    }

    if (entityType === 'remote' && service === 'remote.send_command' && !command) {
      alert('Please enter command for remote.send_command');
      return;
    }

    if (entityType === 'switch' && !entityId) {
      alert('Please enter switch entity ID');
      return;
    }

    const buttonData = {
      icon: icon || 'fas fa-tv',
      text,
      entityType,
      textColor,
      bgColor,
      entityId,
      service,
      command
    };

    if (remoteData.currentButtonIndex !== null) {
      // Update existing button
      remoteData.buttons[remoteData.currentButtonIndex] = buttonData;
    } else {
      // Add new button
      remoteData.buttons.push(buttonData);
    }

    // Refresh display
    renderButtons(document.getElementById(`${remoteId}-buttonGrid`), 
                  document.getElementById(`${remoteId}-emptyState`), 
                  remoteData.buttons, remoteId);

    // Exit edit mode
    exitEditMode(remoteId);
  };

  // Exit edit mode
  const exitEditMode = (remoteId) => {
    const remoteData = remotesData.get(remoteId);
    if (!remoteData) return;

    remoteData.isEditMode = false;
    remoteData.currentButtonIndex = null;

    document.getElementById(`${remoteId}-panelEdit`).classList.add('hidden');
    document.getElementById(`${remoteId}-deleteConfirmation`).classList.add('hidden');
    document.getElementById(`${remoteId}-panelGrid`).classList.remove('hidden');
    document.getElementById(`${remoteId}-modalTitle`).textContent = 'Remote Control';
    document.getElementById(`${remoteId}-modalSubtitle`).textContent = 'Smart Controller';
  };

  // Handle entity type change
  const handleEntityTypeChange = (remoteId) => {
    const entityType = document.getElementById(`${remoteId}-entityType`).value;
    const remoteConfig = document.getElementById(`${remoteId}-remoteConfig`);
    const switchConfig = document.getElementById(`${remoteId}-switchConfig`);

    if (remoteConfig) remoteConfig.style.display = 'none';
    if (switchConfig) switchConfig.style.display = 'none';

    if (entityType === 'remote') {
      if (remoteConfig) remoteConfig.style.display = 'block';
    } else if (entityType === 'switch') {
      if (switchConfig) switchConfig.style.display = 'block';
    }
  };

  // Handle service change
  const handleServiceChange = (remoteId) => {
    const service = document.getElementById(`${remoteId}-remoteService`).value;
    const commandContainer = document.getElementById(`${remoteId}-commandContainer`);
    if (!commandContainer) return;
    
    const label = commandContainer.querySelector('.media-remote-form-label');
    const input = document.getElementById(`${remoteId}-remoteCommand`);

    if (service === 'remote.send_command') {
      if (label) label.textContent = 'Command';
      if (input) input.placeholder = 'HOME, POWER, VOLUME_UP';
      commandContainer.style.display = 'block';
    } else if (service === 'remote.turn_on') {
      if (label) label.textContent = 'URL / App';
      if (input) input.placeholder = 'https://youtube.com or app id';
      commandContainer.style.display = 'block';
    } else {
      commandContainer.style.display = 'none';
      if (input) input.value = '';
    }
  };

  // Update preview
  const updatePreview = (remoteId) => {
    const preview = document.getElementById(`${remoteId}-buttonPreview`);
    if (!preview) return;
    
    const icon = document.getElementById(`${remoteId}-buttonIcon`).value;
    const text = document.getElementById(`${remoteId}-buttonText`).value;
    const textColor = document.getElementById(`${remoteId}-textColor`).value;
    const bgColor = document.getElementById(`${remoteId}-bgColor`).value;

    const iconElement = preview.querySelector('.media-remote-preview-icon');
    if (iconElement) {
      iconElement.className = `${icon} media-remote-preview-icon`;
    }

    const labelElement = preview.querySelector('.media-remote-preview-label');
    if (labelElement) {
      labelElement.textContent = text || 'New Button';
    }

    preview.style.color = textColor;
    preview.style.background = `linear-gradient(145deg, ${bgColor}, ${darkenColor(bgColor, 20)})`;
  };

  // Setup all event listeners
  const setupEventListeners = (remoteId, modal, panelGrid, panelEdit, deleteConfirmation,
                               mainButton, closeModalBtn, editBtn, cancelEditBtn, saveButton, deleteButton,
                               cancelDelete, confirmDelete, buttonGrid, iconGrid, emptyState,
                               entityType, remoteService, textColor, bgColor, textColorValue, bgColorValue,
                               buttonIcon, buttonText, remoteEntity, remoteCommand, switchEntity,
                               commandContainer, remoteConfig, switchConfig, buttonPreview,
                               modalTitle, modalSubtitle, remoteData) => {

    // Open modal
    const openModal = () => {
      modal.classList.add('show');
      mainButton.classList.add('active-main');
      mainButton.style.display = 'none';
      document.body.classList.add('media-remote-modal-active');
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
      document.body.classList.remove('media-remote-modal-active');
      enableBodyRotation();
    };

    closeModalBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      closeModal();
    });

    // Edit button - enter edit mode for new button
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetEditForm(remoteId);
      remoteData.isEditMode = true;
      panelGrid.classList.add('hidden');
      panelEdit.classList.remove('hidden');
      if (deleteConfirmation) deleteConfirmation.classList.add('hidden');
      modalTitle.textContent = 'Add Button';
      modalSubtitle.textContent = 'Create a new button';
    });

    editBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetEditForm(remoteId);
      remoteData.isEditMode = true;
      panelGrid.classList.add('hidden');
      panelEdit.classList.remove('hidden');
      if (deleteConfirmation) deleteConfirmation.classList.add('hidden');
      modalTitle.textContent = 'Add Button';
      modalSubtitle.textContent = 'Create a new button';
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

    // Save button - FIXED
    saveButton.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSaveButton(remoteId);
    });

    saveButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSaveButton(remoteId);
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
      if (remoteData.currentButtonIndex !== null) {
        remoteData.buttons.splice(remoteData.currentButtonIndex, 1);
        renderButtons(buttonGrid, emptyState, remoteData.buttons, remoteId);
        exitEditMode(remoteId);
      }
    });

    confirmDelete.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (remoteData.currentButtonIndex !== null) {
        remoteData.buttons.splice(remoteData.currentButtonIndex, 1);
        renderButtons(buttonGrid, emptyState, remoteData.buttons, remoteId);
        exitEditMode(remoteId);
      }
    });

    // Form input events
    if (entityType) {
      entityType.addEventListener('change', () => handleEntityTypeChange(remoteId));
    }
    
    if (remoteService) {
      remoteService.addEventListener('change', () => handleServiceChange(remoteId));
    }

    if (buttonIcon) {
      buttonIcon.addEventListener('input', () => updatePreview(remoteId));
    }
    
    if (buttonText) {
      buttonText.addEventListener('input', () => updatePreview(remoteId));
    }
    
    if (textColor) {
      textColor.addEventListener('input', (e) => {
        if (textColorValue) textColorValue.textContent = e.target.value;
        updatePreview(remoteId);
      });
    }
    
    if (bgColor) {
      bgColor.addEventListener('input', (e) => {
        if (bgColorValue) bgColorValue.textContent = e.target.value;
        updatePreview(remoteId);
      });
    }

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
    const formElements = [buttonIcon, buttonText, entityType, remoteEntity, remoteService, 
                          remoteCommand, switchEntity, textColor, bgColor];
    
    formElements.forEach(input => {
      if (input) {
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('touchstart', (e) => e.stopPropagation());
        input.addEventListener('touchend', (e) => e.stopPropagation());
      }
    });

    // Fix input field click issues
    [buttonIcon, buttonText, remoteEntity, remoteCommand, switchEntity].forEach(input => {
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
  };

  // Initialize WebSocket on module load
  initWebSocket();

  // Public API
  return {
    // Create a new remote at a specific position
    createRemote: (position, targetScene, buttonsOverride = null) => {
      const remoteId = createRemoteModal(position, targetScene, buttonsOverride);
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
        modal.classList.add('show');
        mainButton.classList.add('active-main');
        mainButton.style.display = 'none';
        document.body.classList.add('media-remote-modal-active');
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
          buttons: remoteData.buttons.map(btn => ({
            icon: btn.icon,
            text: btn.text,
            entityType: btn.entityType,
            textColor: btn.textColor,
            bgColor: btn.bgColor,
            entityId: btn.entityId,
            service: btn.service,
            command: btn.command
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
      document.querySelectorAll('.media-remote-container').forEach(el => el.remove());
      remotesData.clear();

      // Create new remotes with saved button data
      remotesDataArray.forEach(remoteData => {
        const position = Array.isArray(remoteData.position) ?
          new THREE.Vector3().fromArray(remoteData.position) : remoteData.position;

        // Convert saved buttons to proper format
        let savedButtons = [];
        if (remoteData.buttons && Array.isArray(remoteData.buttons)) {
          savedButtons = remoteData.buttons.map(btn => ({
            icon: btn.icon || 'fas fa-tv',
            text: btn.text || 'Button',
            entityType: btn.entityType || 'remote',
            textColor: btn.textColor || '#000000',
            bgColor: btn.bgColor || '#ffffff',
            entityId: btn.entityId || '',
            service: btn.service || '',
            command: btn.command || ''
          }));
        } else {
          // Use defaults if no buttons provided
          savedButtons = JSON.parse(JSON.stringify(DEFAULT_BUTTONS));
        }

        // Create remote with saved buttons
        createRemoteModal(position, remoteData.targetScene || '', savedButtons);
      });
    },

    // Clear all remotes
    clearRemotes: () => {
      document.querySelectorAll('.media-remote-container').forEach(el => el.remove());
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

// Add CSS styles - UPDATED with proper button press effects
const style = document.createElement('style');
style.textContent = `
  .media-remote-container {
    position: absolute;
    z-index: 1000;
    pointer-events: auto;
    transition: opacity 0.2s;
    transform: translate(-50%, -50%);
  }

  .media-remote-main-button {
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
    .media-remote-main-button {
      width: 56px;
      height: 56px;
    }
  }

  .media-remote-main-button:active {
    transform: scale(0.95);
  }

  .media-remote-main-button i {
    font-size: 24px;
    color: #333;
  }

  .media-remote-main-button.active-main {
    box-shadow: 0 0 20px 8px rgba(33, 150, 243, 0.7);
    border: 2px solid rgba(33, 150, 243, 0.4);
    display: none;
  }

  .media-remote-main-button.active-main i {
    color: #2196F3;
  }

  .media-remote-modal {
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

  .media-remote-modal.show {
    display: flex;
  }

  .media-remote-modal-content {
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

  .media-remote-close-btn,
  .media-remote-edit-btn {
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

  .media-remote-close-btn {
    top: 16px;
    right: 16px;
  }

  .media-remote-edit-btn {
    top: 16px;
    left: 16px;
  }

  .media-remote-close-btn:active,
  .media-remote-edit-btn:active {
    background-color: rgba(0, 0, 0, 0.1);
    transform: scale(0.95);
  }

  .media-remote-title {
    color: #333;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
    text-align: center;
  }

  .media-remote-subtitle {
    color: #000000;
    font-size: 14px;
    margin-bottom: 25px;
    text-align: center;
  }

  .media-remote-panel {
    width: 100%;
  }

  .media-remote-panel.hidden {
    display: none !important;
  }

  .media-remote-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    width: 100%;
    max-width: 350px;
    margin: 20px auto;
  }

  .media-remote-empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px 20px;
    color: #666;
    font-size: 14px;
  }

  .media-remote-empty-state i {
    font-size: 32px;
    margin-bottom: 10px;
    opacity: 0.5;
  }

  .media-remote-btn {
    background: #ffffff;
    opacity:0.7;
    border: none;
    border-radius: 10px;
    color: #000;
    font-size: 18px;
    font-weight: bold;
    height: 70px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.1s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    position: relative;
    overflow: hidden;
    padding: 0;
    width: 100%;
  }

  .media-remote-btn:active {
    transform: scale(0.95) !important;
  }

  .media-remote-btn-icon {
    font-size: 24px;
    margin-bottom: 5px;
  }

  .media-remote-btn-label {
    font-size: 12px;
    opacity: 0.9;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Form Styles */
  .media-remote-form {
    width: 100%;
  }

  .media-remote-form-group {
    margin-bottom: 15px;
    width: 100%;
  }

  .media-remote-form-label {
    display: block;
    margin-bottom: 5px;
    color: #333;
    font-weight: bold;
    font-size: 14px;
  }

  .media-remote-form-input,
  .media-remote-form-select {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    box-sizing: border-box;
    background-color: white;
  }

  .media-remote-form-input:focus,
  .media-remote-form-select:focus {
    outline: none;
    border-color: #007aff;
  }

  .media-remote-color-picker-container {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .media-remote-color-picker {
    width: 50px;
    height: 50px;
    border: 1px solid #ddd;
    border-radius: 5px;
    cursor: pointer;
  }

  .media-remote-color-value {
    font-family: monospace;
    font-size: 14px;
    color: #666;
  }

  .media-remote-button-preview {
    width: 100%;
    height: 70px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 15px 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .media-remote-preview-icon {
    font-size: 24px;
    margin-bottom: 5px;
  }

  .media-remote-preview-label {
    font-size: 12px;
    font-weight: bold;
  }

  .media-remote-form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .media-remote-form-btn {
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

  .media-remote-form-btn:active {
    transform: scale(0.95);
  }

  .media-remote-form-btn.save {
    background: #007aff;
    color: white;
  }

  .media-remote-form-btn.save:active {
    background: #0056cc;
  }

  .media-remote-form-btn.cancel {
    background: #f0f0f0;
    color: #333;
  }

  .media-remote-form-btn.cancel:active {
    background: #e0e0e0;
  }

  .media-remote-form-btn.danger {
    background: #ff3b30;
    color: white;
  }

  .media-remote-form-btn.danger:active {
    background: #cc0000;
  }

  /* Icon grid */
  .media-remote-icon-grid {
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

  .media-remote-icon-option {
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

  .media-remote-icon-option:active {
    background: #e3f2fd;
    color: #007aff;
    transform: scale(0.95);
  }

  .media-remote-icon-option.selected {
    background: #007aff;
    color: white;
    border-color: #0056cc;
  }

  /* Delete confirmation */
  .media-remote-delete-confirmation {
    text-align: center;
    padding: 20px;
    width: 100%;
  }

  .media-remote-delete-confirmation.hidden {
    display: none;
  }

  .media-remote-delete-confirmation p {
    margin-bottom: 20px;
    color: #333;
    font-size: 16px;
  }

  /* Body state when modal is open */
  body.media-remote-modal-active {
    touch-action: none !important;
    overflow: hidden !important;
  }

  body.media-remote-modal-active canvas {
    pointer-events: none !important;
  }

  body.media-remote-modal-active .media-remote-modal {
    pointer-events: auto;
  }

  .media-remote-modal {
    pointer-events: auto !important;
    z-index: 2000;
  }

  .media-remote-modal-content {
    pointer-events: auto !important;
  }

  .media-remote-modal.show {
    background-color: rgba(0, 0, 0, 0.5);
    pointer-events: auto !important;
  }

  .media-remote-modal * {
    pointer-events: auto !important;
  }

  /* Hide main button when modal is open */
  .media-remote-container:has(.media-remote-modal.show) .media-remote-main-button {
    display: none !important;
  }

  .media-remote-container .media-remote-modal.show ~ .media-remote-main-button {
    display: none !important;
  }

  .media-remote-container .media-remote-main-button {
    display: flex !important;
  }
`;

document.head.appendChild(style);