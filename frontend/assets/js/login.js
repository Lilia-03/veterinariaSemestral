document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    
    // Verificar si ya está autenticado
    authManager.checkAuthStatus().then(isAuthenticated => {
        if (isAuthenticated) {
            const userRole = authManager.getUserRole();
            authManager.redirectByRole(userRole);
        }
    });
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            // Validaciones básicas
            if (!usuario || !password) {
                authManager.showMessage('error', 'Por favor completa todos los campos');
                return;
            }
            
            if (!isValidUsuario(usuario)) {
                authManager.showMessage('error', 'Por favor ingresa un usuario válido');
                return;
            }
            
            // Deshabilitar botón durante el login
            loginButton.disabled = true;
            loginButton.textContent = 'Iniciando sesión...';
            
            try {
                const result = await authManager.login(email, password);
                
                if (!result.success) {
                    // El error ya se muestra en authManager.login
                    emailInput.focus();
                }
            } catch (error) {
                authManager.showMessage('error', 'Error inesperado en el login');
            } finally {
                // Rehabilitar botón
                loginButton.disabled = false;
                loginButton.textContent = 'Iniciar Sesión';
            }
        });
    }
    
    // Validación de email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Mostrar/ocultar contraseña
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }
});

console.log("Datos a enviar:", { email: emailInput.value, password: passwordInput.value });

