document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación al cargar dashboard
    const isAuthenticated = await authManager.checkAuthStatus();
    
    if (!isAuthenticated) {
        return; // authManager ya redirige al login
    }
    
    // Configurar elementos del dashboard
    setupDashboard();
    setupLogoutButton();
    setupSessionIndicator();
    
    // Actualizar UI con datos del usuario
    authManager.updateUserUI();
});

function setupDashboard() {
    const user = authManager.getUser();
    if (!user) return;
    
    // Personalizar dashboard según el rol
    const dashboardTitle = document.getElementById('dashboardTitle');
    if (dashboardTitle) {
        switch (user.rol) {
            case 'admin':
                dashboardTitle.textContent = 'Panel de Administración';
                break;
            case 'veterinario':
                dashboardTitle.textContent = 'Panel Veterinario';
                break;
            case 'cliente':
                dashboardTitle.textContent = 'Mi Panel';
                break;
        }
    }
    
    // Mostrar información del usuario
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `
            <div class="user-card">
                <h3>Bienvenido, ${user.nombre}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Rol:</strong> ${user.rol}</p>
            </div>
        `;
    }
}

function setupLogoutButton() {
    const logoutButtons = document.querySelectorAll('[data-action="logout"]');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                button.disabled = true;
                button.textContent = 'Cerrando sesión...';
                
                await authManager.logout();
            }
        });
    });
}

function setupSessionIndicator() {
    const sessionIndicator = document.getElementById('sessionIndicator');
    if (!sessionIndicator) return;
    
    // Actualizar indicador de sesión cada minuto
    setInterval(async () => {
        try {
            const response = await fetch(authManager.apiUrl + '?action=status');
            const data = await response.json();
            
            if (data.success && data.data.authenticated) {
                const expiresIn = data.data.expires_in;
                const minutes = Math.ceil(expiresIn / 60);
                
                sessionIndicator.innerHTML = `
                    <span class="session-time">Sesión expira en: ${minutes} min</span>
                    <button onclick="authManager.extendSession()" class="btn-extend">Extender</button>
                `;
                
                // Cambiar color según tiempo restante
                if (minutes <= 5) {
                    sessionIndicator.className = 'session-indicator warning';
                } else if (minutes <= 10) {
                    sessionIndicator.className = 'session-indicator caution';
                } else {
                    sessionIndicator.className = 'session-indicator normal';
                }
            } else {
                sessionIndicator.innerHTML = '<span class="session-expired">Sesión expirada</span>';
                sessionIndicator.className = 'session-indicator expired';
            }
        } catch (error) {
            console.error('Error actualizando indicador de sesión:', error);
        }
    }, 60000); // Cada minuto
}