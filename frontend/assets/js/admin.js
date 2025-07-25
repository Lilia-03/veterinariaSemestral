// Inicializar protección de autenticación
        initAuth().then(auth => {
            console.log('Usuario en localStorage:', AuthUtils.getUsuario());
            
            
            // Cargar estadísticas del dashboard
            cargarEstadisticasAdmin();
            
            // Configurar eventos de los módulos
            configurarModulos();
        });
        
        async function cargarEstadisticasAdmin() {
            try {
                // Aquí harías llamadas a tu API para obtener estadísticas reales
                // Por ahora mantenemos los valores hardcodeados
                
                // Ejemplo de cómo podrías cargar datos reales:
                // const response = await fetch('../backend/api/estadisticas.php');
                // const data = await response.json();
                // document.getElementById('totalMascotas').textContent = data.mascotas;
                
                console.log('Estadísticas cargadas');
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
            }
        }
        
        function configurarModulos() {
            // Agregar eventos a los módulos
            const moduleCards = document.querySelectorAll('.module-card');
            
            moduleCards.forEach(card => {
                card.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    const title = this.querySelector('h3').textContent;
                    
                    console.log(`Navegando a módulo: ${title}`);
                    
                    // Aquí podrías agregar lógica adicional antes de navegar
                    // como verificar permisos específicos o cargar datos
                });
            });
        }
        
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