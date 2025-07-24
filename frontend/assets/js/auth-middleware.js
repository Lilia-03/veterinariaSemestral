// frontend/assets/js/auth-middleware.js
class AuthMiddleware {
    constructor() {
        this.apiUrl = '../../backend/controller/authController.php';
        this.init();
    }
    
    async init() {
        // Verificar sesión automáticamente en páginas protegidas
        const isAuthenticated = await this.verificarSesion();
        
        if (!isAuthenticated) {
            this.redirectToLogin();
            return;
        }
        
        // Configurar elementos de UI
        this.setupUserInfo();
        this.setupLogoutBtn();
    }
    
    async verificarSesion() {
        try {
            const response = await fetch(`${this.apiUrl}?action=verificar`);
            const data = await response.json();
            
            if (data.success) {
                // Actualizar localStorage con datos frescos
                localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
                return true;
            } else {
                localStorage.removeItem('usuario');
                return false;
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
            localStorage.removeItem('usuario');
            return false;
        }
    }
    
    verificarRol(rolesPermitidos) {
        const usuario = this.getUsuario();
        if (!usuario) return false;
        
        return rolesPermitidos.includes(usuario.rolId);
    }
    
    verificarPermiso(permiso) {
        const usuario = this.getUsuario();
        if (!usuario || !usuario.permisos) return false;
        
        return usuario.permisos.includes(permiso);
    }
    
    getUsuario() {
        const userData = localStorage.getItem('usuario');
        return userData ? JSON.parse(userData) : null;
    }
    
    setupUserInfo() {
        const usuario = this.getUsuario();
        if (!usuario) return;
        
        // Buscar elementos para mostrar información del usuario
        const userNameElements = document.querySelectorAll('[data-user-name]');
        const userRoleElements = document.querySelectorAll('[data-user-role]');
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        
        userNameElements.forEach(el => el.textContent = usuario.nombreCompleto);
        userRoleElements.forEach(el => el.textContent = usuario.nombreRol);
        userEmailElements.forEach(el => el.textContent = usuario.email);
        
        // Actualizar el hero content para mostrar nombre del usuario
        const heroContent = document.querySelector('.hero-content h1');
        if (heroContent && usuario.nombreRol === 'Administrador') {
            heroContent.textContent = `Bienvenido, ${usuario.nombreCompleto}`;
        }
    }
    
    setupLogoutBtn() {
        // Configurar botones de logout
        const logoutButtons = document.querySelectorAll('[data-logout], .login-btn');
        logoutButtons.forEach(btn => {
            // Solo si el botón contiene "Cerrar Sesión" o tiene data-logout
            if (btn.textContent.includes('Cerrar Sesión') || btn.hasAttribute('data-logout')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        });
        
        // También buscar el botón específico del admin.html
        const adminLogoutBtn = document.querySelector('.login-btn');
        if (adminLogoutBtn && adminLogoutBtn.href && adminLogoutBtn.href.includes('login.html')) {
            adminLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }
    
    async logout() {
        try {
            const response = await fetch(`${this.apiUrl}?action=logout`);
            const data = await response.json();
            
            localStorage.removeItem('usuario');
            window.location.href = '../login.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Forzar logout local
            localStorage.removeItem('usuario');
            window.location.href = '../login.html';
        }
    }
    
    redirectToLogin() {
        window.location.href = '../login.html';
    }
    
    // Método para ocultar elementos basado en permisos
    hideElementsWithoutPermission() {
        const elementsWithPermission = document.querySelectorAll('[data-require-permission]');
        
        elementsWithPermission.forEach(element => {
            const requiredPermission = element.getAttribute('data-require-permission');
            if (!this.verificarPermiso(requiredPermission)) {
                element.style.display = 'none';
            }
        });
    }
    
    // Método para ocultar elementos basado en roles
    hideElementsWithoutRole() {
        const elementsWithRole = document.querySelectorAll('[data-require-role]');
        
        elementsWithRole.forEach(element => {
            const requiredRoles = element.getAttribute('data-require-role').split(',').map(r => parseInt(r.trim()));
            if (!this.verificarRol(requiredRoles)) {
                element.style.display = 'none';
            }
        });
    }
}

// Función para inicializar la autenticación en cualquier página
function initAuth() {
    return new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', async () => {
            const auth = new AuthMiddleware();
            
            // Aplicar restricciones de permisos y roles después de un pequeño delay
            setTimeout(() => {
                auth.hideElementsWithoutPermission();
                auth.hideElementsWithoutRole();
            }, 100);
            
            resolve(auth);
        });
    });
}

// Funciones de utilidad globales
window.AuthUtils = {
    verificarPermiso: function(permiso) {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        return usuario.permisos && usuario.permisos.includes(permiso);
    },
    
    verificarRol: function(rolesPermitidos) {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        return rolesPermitidos.includes(usuario.rolId);
    },
    
    getUsuario: function() {
        const userData = localStorage.getItem('usuario');
        return userData ? JSON.parse(userData) : null;
    },
    
    isAdmin: function() {
        return this.verificarRol([1]);
    },
    
    isOperador: function() {
        return this.verificarRol([2]);
    },
    
    isCliente: function() {
        return this.verificarRol([3]);
    },
    
    // Función específica para clientes - obtener su cédula
    getCedulaCliente: function() {
        const usuario = this.getUsuario();
        return usuario ? usuario.cedulaCliente : null;
    },
    
    // Función para mostrar información del usuario
    mostrarInfoUsuario: function() {
        const usuario = this.getUsuario();
        if (usuario) {
            console.log('Usuario actual:', {
                nombre: usuario.nombreCompleto,
                rol: usuario.nombreRol,
                permisos: usuario.permisos
            });
        }
    }
};