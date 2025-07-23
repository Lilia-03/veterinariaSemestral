// Funciones globales y configuración inicial
const API_BASE_URL = 'backend/api/';

// Cargar componentes reutilizables
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error('Error cargando componente:', error);
    }
}

// Inicializar componentes comunes
document.addEventListener('DOMContentLoaded', function() {
    // Cargar header y footer si existen los contenedores
    if (document.getElementById('header-container')) {
        loadComponent('header-container', 'components/header.html');
    }
    if (document.getElementById('footer-container')) {
        loadComponent('footer-container', 'components/footer.html');
    }
});

// Utilidades globales
function showMessage(message, type = 'info') {
    // Implementar sistema de notificaciones
    console.log(`${type}: ${message}`);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}