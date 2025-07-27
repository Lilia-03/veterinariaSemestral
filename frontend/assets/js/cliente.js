// Inicializar protección de autenticación
        initAuth().then(auth => {
            console.log('Usuario en localStorage:', AuthUtils.getUsuario());
            
            
            
            // Configurar eventos de los módulos
            configurarModulos();
        });
        
        
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


        // ...existing code...
// Supón que el usuario está guardado en localStorage bajo la clave 'usuario'
const usuario = JSON.parse(localStorage.getItem('usuario'));
if (usuario && usuario.nombreCompleto) {
    // Busca todos los elementos con el atributo data-user-name y actualízalos
    document.querySelectorAll('[data-user-name]').forEach(el => {
        el.textContent = usuario.nombreCompleto;
    });
}
// ...existing code...