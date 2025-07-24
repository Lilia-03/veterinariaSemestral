// frontend/assets/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está autenticado al cargar la página
    verificarSesionExistente();
    
    // Configurar el formulario de login
    const loginForm = document.querySelector('.form-login');
    const usuarioInput = document.getElementById('usuario');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('.btn-login');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const usuario = usuarioInput.value.trim();
            const password = passwordInput.value.trim();
            
            // Validaciones básicas
            if (!usuario || !password) {
                mostrarMensaje('Por favor completa todos los campos', 'error');
                return;
            }
            
            // Deshabilitar botón durante el login
            loginButton.disabled = true;
            loginButton.textContent = 'Iniciando sesión...';
            
            try {
                await realizarLogin(usuario, password);
            } catch (error) {
                console.error('Error en login:', error);
                mostrarMensaje('Error inesperado. Intenta nuevamente.', 'error');
            } finally {
                // Rehabilitar botón
                loginButton.disabled = false;
                loginButton.textContent = 'Ingresar';
            }
        });
    }
});

async function verificarSesionExistente() {
    try {
        // RUTA CORREGIDA - desde login.html hacia backend (subir un nivel)
        const response = await fetch('../backend/controller/authController.php?action=verificar');
        const data = await response.json();
        
        if (data.success) {
            // Ya está logueado, redirigir
            const redirectUrl = determinarRedirect(data.data.usuario.rolId);
            window.location.href = redirectUrl;
        }
    } catch (error) {
        // No hay sesión activa, continuar normalmente
        console.log('No hay sesión activa');
    }
}

async function realizarLogin(usuario, password) {
    try {
        // RUTA CORREGIDA - desde login.html hacia backend (subir un nivel)
        const response = await fetch('../backend/controller/authController.php?action=login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombreUsuario: usuario,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarMensaje('¡Login exitoso! Redirigiendo...', 'success');
            
            // Guardar datos del usuario en localStorage
            localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
            
            // Redirigir después de un breve delay
            setTimeout(() => {
                window.location.href = data.data.redirectUrl;
            }, 1500);
            
        } else {
            mostrarMensaje(data.message, 'error');
            document.getElementById('usuario').focus();
        }
        
    } catch (error) {
        console.error('Error en la petición:', error);
        mostrarMensaje('Error de conexión. Verifica tu conexión a internet.', 'error');
    }
}

function determinarRedirect(rolId) {
    switch (rolId) {
        case 1: // Administrador
            return 'admin/admin.html';  // CAMBIAR A admin.html
        case 2: // Trabajador/Operador
            return 'trabajador/trabajador.html';
        case 3: // Cliente
            return 'cliente/cliente.html';
        default:
            return 'index.html';
    }
}

function mostrarMensaje(mensaje, tipo) {
    // Remover mensaje anterior si existe
    const mensajeAnterior = document.querySelector('.mensaje-login');
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }
    
    // Crear nuevo mensaje
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `mensaje-login ${tipo}`;
    mensajeDiv.textContent = mensaje;
    
    // Estilos del mensaje
    mensajeDiv.style.cssText = `
        margin-top: 15px;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    if (tipo === 'success') {
        mensajeDiv.style.backgroundColor = '#d4edda';
        mensajeDiv.style.color = '#155724';
        mensajeDiv.style.border = '1px solid #c3e6cb';
    } else if (tipo === 'error') {
        mensajeDiv.style.backgroundColor = '#f8d7da';
        mensajeDiv.style.color = '#721c24';
        mensajeDiv.style.border = '1px solid #f5c6cb';
    }
    
    // Insertar después del botón
    const loginButton = document.querySelector('.btn-login');
    loginButton.parentNode.insertBefore(mensajeDiv, loginButton.nextSibling);
    
    // Remover mensaje después de 5 segundos (solo para errores)
    if (tipo === 'error') {
        setTimeout(() => {
            if (mensajeDiv.parentNode) {
                mensajeDiv.remove();
            }
        }, 5000);
    }
}

// Agregar animación CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);