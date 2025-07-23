// Utilidades generales para el manejo de sesiones
// Función para hacer peticiones autenticadas
async function authenticatedFetch(url, options = {}) {
    const token = authManager.getCSRFToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token
        }
    };
    
    // Combinar opciones
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        // Verificar si la respuesta indica problema de autenticación
        if (response.status === 401) {
            authManager.showMessage('error', 'Sesión expirada');
            authManager.handleUnauthenticated();
            return null;
        }
        
        if (response.status === 403) {
            authManager.showMessage('error', 'Sin permisos para esta acción');
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Error en petición autenticada:', error);
        authManager.showMessage('error', 'Error de conexión');
        return null;
    }
}

// Función para proteger páginas
function requireAuth(allowedRoles = null) {
    document.addEventListener('DOMContentLoaded', async function() {
        const isAuthenticated = await authManager.checkAuthStatus();
        
        if (!isAuthenticated) {
            return; // Ya redirige authManager
        }
        
        // Verificar roles si se especificaron
        if (allowedRoles) {
            const userRole = authManager.getUserRole();
            
            if (Array.isArray(allowedRoles)) {
                if (!allowedRoles.includes(userRole)) {
                    authManager.showMessage('error', 'No tienes permisos para acceder a esta página');
                    setTimeout(() => {
                        history.back();
                    }, 2000);
                    return;
                }
            } else {
                if (userRole !== allowedRoles) {
                    authManager.showMessage('error', 'No tienes permisos para acceder a esta página');
                    setTimeout(() => {
                        history.back();
                    }, 2000);
                    return;
                }
            }
        }
    });
}

// Función para formatear tiempo restante
function formatTimeRemaining(seconds) {
    if (seconds <= 0) return 'Expirado';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Función para mostrar confirmación antes de acciones importantes
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Auto-guardar formularios (útil para no perder datos si expira la sesión)
function setupAutoSave(formId, interval = 30000) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    setInterval(() => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        localStorage.setItem(`autosave_${formId}`, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    }, interval);
    
    // Restaurar datos al cargar la página
    const savedData = localStorage.getItem(`autosave_${formId}`);
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            // Solo restaurar si es reciente (menos de 1 hora)
            if (Date.now() - parsed.timestamp < 3600000) {
                Object.keys(parsed.data).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input && input.type !== 'password') {
                        input.value = parsed.data[key];
                    }
                });
                
                authManager.showMessage('success', 'Datos del formulario restaurados');
            }
        } catch (error) {
            console.error('Error restaurando datos:', error);
        }
    }
}