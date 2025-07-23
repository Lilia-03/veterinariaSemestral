class AuthManager {
    constructor() {
        this.apiUrl = '../backend/api/auth.php';
        this.currentUser = null;
        this.csrfToken = null;
        this.sessionCheckInterval = null;
        this.sessionWarningShown = false;
        
        this.init();
    }
    
    init() {
        // Verificar estado de sesión al cargar
        this.checkAuthStatus();
        
        // Configurar verificación periódica de sesión
        this.startSessionMonitoring();
        
        // Manejar cierre de ventana/pestaña
        this.handlePageUnload();
    }
    
    async login(email, password) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.data.user;
                this.csrfToken = data.data.csrf_token;
                
                // Guardar datos básicos en localStorage para persistencia
                localStorage.setItem('user_role', data.data.user.rol);
                localStorage.setItem('user_name', data.data.user.nombre);
                
                // Mostrar mensaje de éxito
                this.showMessage('success', 'Inicio de sesión exitoso');
                
                // Redirigir según el rol
                this.redirectByRole(data.data.user.rol);
                
                return { success: true, user: data.data.user };
            } else {
                this.showMessage('error', data.error);
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showMessage('error', 'Error de conexión');
            return { success: false, error: 'Error de conexión' };
        }
    }
    
    async logout() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });
            
            const data = await response.json();
            
            // Limpiar datos locales independientemente de la respuesta
            this.clearLocalData();
            
            // Mostrar mensaje
            this.showMessage('success', 'Sesión cerrada correctamente');
            
            // Redirigir al login
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 1000);
            
            return { success: true };
        } catch (error) {
            console.error('Error en logout:', error);
            // Limpiar datos de todas formas
            this.clearLocalData();
            window.location.href = '../login.html';
        }
    }
    
    async register(userData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'register',
                    ...userData
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('success', 'Registro exitoso. Puedes iniciar sesión.');
                return { success: true };
            } else {
                this.showMessage('error', data.error);
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Error en registro:', error);
            this.showMessage('error', 'Error de conexión');
            return { success: false, error: 'Error de conexión' };
        }
    }
    
    async checkAuthStatus() {
        try {
            const response = await fetch(this.apiUrl + '?action=status');
            const data = await response.json();
            
            if (data.success && data.data.authenticated) {
                // Usuario autenticado, obtener datos completos
                await this.getCurrentUser();
                return true;
            } else {
                // No autenticado
                this.handleUnauthenticated();
                return false;
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    }
    
    async getCurrentUser() {
        try {
            const response = await fetch(this.apiUrl + '?action=user');
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.data.user;
                this.csrfToken = data.data.csrf_token;
                
                // Actualizar UI con datos del usuario
                this.updateUserUI();
                
                return this.currentUser;
            } else {
                this.handleUnauthenticated();
                return null;
            }
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            return null;
        }
    }
    
    async extendSession() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'extend'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.sessionWarningShown = false;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error extendiendo sesión:', error);
            return false;
        }
    }
    
    startSessionMonitoring() {
        // Verificar cada 30 segundos
        this.sessionCheckInterval = setInterval(async () => {
            const response = await fetch(this.apiUrl + '?action=status');
            const data = await response.json();
            
            if (data.success && data.data.authenticated) {
                const expiresIn = data.data.expires_in;
                
                // Mostrar advertencia si quedan 5 minutos o menos
                if (expiresIn <= 300 && !this.sessionWarningShown) {
                    this.showSessionWarning(expiresIn);
                }
                
                // Cerrar sesión automáticamente si expiró
                if (expiresIn <= 0) {
                    this.handleSessionExpired();
                }
            } else {
                this.handleUnauthenticated();
            }
        }, 30000);
    }
    
    showSessionWarning(expiresIn) {
        this.sessionWarningShown = true;
        const minutes = Math.ceil(expiresIn / 60);
        
        const message = `Tu sesión expirará en ${minutes} minuto(s). ¿Deseas extenderla?`;
        
        if (confirm(message)) {
            this.extendSession();
        }
    }
    
    handleSessionExpired() {
        this.clearLocalData();
        alert('Tu sesión ha expirado. Serás redirigido al login.');
        window.location.href = '../login.html';
    }
    
    handleUnauthenticated() {
        // Solo redirigir si no estamos ya en páginas públicas
        const currentPage = window.location.pathname;
        const publicPages = ['/login.html', '/registro.html', '/index.html', '/'];
        
        const isPublicPage = publicPages.some(page => 
            currentPage.endsWith(page) || currentPage === '/'
        );
        
        if (!isPublicPage) {
            this.clearLocalData();
            window.location.href = '../login.html';
        }
    }
    
    redirectByRole(role) {
        switch (role) {
            case 'admin':
                window.location.href = '../admin/dashboard.html';
                break;
            case 'veterinario':
                window.location.href = '../dashboard/index.html';
                break;
            case 'cliente':
                window.location.href = '../dashboard/index.html';
                break;
            default:
                window.location.href = '../index.html';
        }
    }
    
    updateUserUI() {
        if (!this.currentUser) return;
        
        // Actualizar elementos con datos del usuario
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = this.currentUser.nombre;
        });
        
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(el => {
            el.textContent = this.currentUser.email;
        });
        
        const userRoleElements = document.querySelectorAll('[data-user-role]');
        userRoleElements.forEach(el => {
            el.textContent = this.currentUser.rol;
        });
        
        // Mostrar/ocultar elementos según el rol
        this.updateRoleBasedUI();
    }
    
    updateRoleBasedUI() {
        const role = this.currentUser?.rol;
        
        // Elementos que solo ven los administradores
        const adminElements = document.querySelectorAll('[data-role="admin"]');
        adminElements.forEach(el => {
            el.style.display = role === 'admin' ? 'block' : 'none';
        });
        
        // Elementos que solo ven los veterinarios
        const vetElements = document.querySelectorAll('[data-role="veterinario"]');
        vetElements.forEach(el => {
            el.style.display = role === 'veterinario' ? 'block' : 'none';
        });
        
        // Elementos que solo ven los clientes
        const clientElements = document.querySelectorAll('[data-role="cliente"]');
        clientElements.forEach(el => {
            el.style.display = role === 'cliente' ? 'block' : 'none';
        });
    }
    
    clearLocalData() {
        this.currentUser = null;
        this.csrfToken = null;
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
    }
    
    handlePageUnload() {
        window.addEventListener('beforeunload', () => {
            // Extender sesión al cambiar de página (opcional)
            navigator.sendBeacon(this.apiUrl, JSON.stringify({
                action: 'extend'
            }));
        });
    }
    
    showMessage(type, message) {
        // Crear o actualizar elemento de mensaje
        let messageContainer = document.getElementById('auth-messages');
        
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'auth-messages';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 300px;
            `;
            document.body.appendChild(messageContainer);
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `alert alert-${type === 'success' ? 'success' : 'danger'}`;
        messageElement.style.cssText = `
            padding: 10px 15px;
            margin-bottom: 10px;
            border-radius: 4px;
            background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
        `;
        messageElement.textContent = message;
        
        messageContainer.appendChild(messageElement);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 5000);
    }
    
    // Métodos de utilidad
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    getUser() {
        return this.currentUser;
    }
    
    getUserRole() {
        return this.currentUser?.rol || null;
    }
    
    hasRole(role) {
        return this.getUserRole() === role;
    }
    
    hasAnyRole(roles) {
        const userRole = this.getUserRole();
        return roles.includes(userRole);
    }
    
    getCSRFToken() {
        return this.csrfToken;
    }
}

// Instancia global del gestor de autenticación
window.authManager = new AuthManager();


fetch('/backend/api/procesar_login.php', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
.then(data => {
    if (data.success) {
        if (data.rol === 'Administrador') window.location.href = '/frontend/admin/dashboard.html';
        else if (data.rol === 'Operador') window.location.href = '/frontend/trabajador/dashboard.html';
        else if (data.rol === 'Cliente') window.location.href = '/frontend/cliente/dashboard.html';
    } else {
        alert(data.message);
    }
});
