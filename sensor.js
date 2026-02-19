// sensor.js - Sensor Module for 360 Scene Editor with Home Assistant Integration
// Simplified version - shows only button with status, no modal

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

  let instanceId = 1;
  let sensorsData = new Map();
  let currentScene = 'scene1';

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
      }
    });
  };

  // Get entity state
  const getEntityState = (entityId, sensorId) => {
    if (!HA_CONFIG.connected || !HA_CONFIG.socket) {
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
            }
          }
        }
      },
      reject: (error) => {
        console.error('Failed to get states:', error);
      }
    });
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

  // Create HTML structure for sensor (button only, no modal)
  const createSensorButton = (position, targetScene, statesOverride = null, entityIdOverride = null) => {
    const sensorId = `sensor-${instanceId++}`;

    // Create states for this sensor - use provided states or defaults
    const states = statesOverride ? JSON.parse(JSON.stringify(statesOverride)) : JSON.parse(JSON.stringify(DEFAULT_STATES));

    const container = document.createElement('div');
    container.className = 'sensor-container';
    container.id = sensorId;
    container.dataset.position = JSON.stringify(position);
    container.dataset.targetScene = targetScene || '';
    container.dataset.entityId = entityIdOverride || '';
    container.dataset.visible = 'true';
    container.setAttribute('data-remote-type', 'sensor');
    container.style.position = 'absolute';
    container.style.zIndex = '1000';
    container.style.pointerEvents = 'auto';
    container.style.transform = 'translate(-50%, -50%)';

    container.innerHTML = `
      <!-- Main Button Only - No Modal -->
      <button class="sensor-main-button" id="${sensorId}-mainButton" data-entity-id="${entityIdOverride || ''}">
        <i class="${states[0]?.icon || 'fas fa-circle-check'}" style="color: ${states[0]?.color || '#3b82f6'};"></i>
        <span class="sensor-state-name" id="${sensorId}-stateName">${states[0]?.displayName || 'Sensor'}</span>
        <div class="sensor-status-dot" id="${sensorId}-statusDot" style="background-color: ${states[0]?.color || '#3b82f6'};"></div>
      </button>
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
      container: container,
      visible: true
    });

    // If entity ID is provided, fetch its state
    if (entityIdOverride) {
      setTimeout(() => {
        getEntityState(entityIdOverride, sensorId);
      }, 500);
    }

    return sensorId;
  };

  // Initialize WebSocket on module load
  initWebSocket();

  // Public API
  return {
    // Create a new sensor at a specific position
    createSensor: (position, targetScene, statesOverride = null, entityId = null) => {
      const sensorId = createSensorButton(position, targetScene, statesOverride, entityId);
      return {
        id: sensorId,
        position: position,
        targetScene: targetScene || ''
      };
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
        createSensorButton(position, sensorData.targetScene || '', savedStates, sensorData.entityId || '');
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

    // Refresh a specific sensor's state
    refreshSensor: (sensorId) => {
      const sensorData = sensorsData.get(sensorId);
      if (sensorData && sensorData.entityId) {
        getEntityState(sensorData.entityId, sensorId);
      }
    },

    // Refresh all sensors
    refreshAllSensors: () => {
      sensorsData.forEach((sensorData, sensorId) => {
        if (sensorData.entityId) {
          getEntityState(sensorData.entityId, sensorId);
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

// Add CSS styles (simplified - only button styles)
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
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 6px 0 3px 0;
    position: relative;
    opacity:0.6;
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

  .sensor-container {
    pointer-events: auto !important;
  }
`;

document.head.appendChild(sensorStyle);