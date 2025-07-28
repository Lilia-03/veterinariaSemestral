// Inicializar protección de autenticación
        initAuth().then(auth => {
            console.log('Usuario en localStorage:', AuthUtils.getUsuario());
        });
        
        
includeHTML("header", "../assets/components/navModuloAdmin.html");
        
        // Función para mostrar información del usuario actual
        function mostrarInfoUsuario() {
            const usuario = AuthUtils.getUsuario();
            if (usuario) {
                console.log('Usuario administrador:', {
                    nombre: usuario.nombreCompleto,
                    email: usuario.email,
                    permisos: usuario.permisos.length
                });
            }
        }
        
        // Mostrar info del usuario al cargar
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(mostrarInfoUsuario, 1000);
        });


