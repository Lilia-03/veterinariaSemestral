// ========== FACTURA CLIENTE JS (REUTILIZANDO historialFactura.js) ==========
// Este archivo extiende y adapta las funciones del historialFactura.js para clientes
// ========== NOTA IMPORTANTE ==========
// Este archivo debe cargarse DESPUÉS de historialFactura.js para poder
// sobrescribir las funciones necesarias y reutilizar las demás.
// 
// En el HTML:
// <script src="../assets/js/historialFactura.js"></script>
// <script src="../assets/js/facturaCliente.js"></script>

let esVistaCliente = true;
let facturasCliente = [];

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    initAuth().then(auth => {
        if (!AuthUtils.isCliente()) {
            window.location.href = '../admin/admin.html';
            return;
        }
        
        console.log('🏠 Cliente autenticado:', AuthUtils.getUsuario().nombreCompleto);
        console.log('🆔 Cédula del cliente:', AuthUtils.getCedulaCliente());
        
        configurarEventListenersCliente();
        cargarMisFacturas();
    });
});

// ========== CARGAR FACTURAS DEL CLIENTE ==========
async function cargarMisFacturas() {
    console.log('📊 Cargando facturas del cliente...');
    mostrarLoadingHistorial(true);
    
    try {
        // USAR EL ENDPOINT NUEVO 'misFacturas' que usa obtenerFacturasPorUsuario
        const response = await fetch('../../backend/controller/facturacionController.php?accion=misFacturas&limit=50');
        const result = await response.json();
        
        console.log('📋 Respuesta del servidor para cliente:', result);
        
        if (result.estado === 'ok') {
            facturas = result.facturas || []; // Usar variable global del historial
            facturasCliente = facturas;
            
            console.log('✅ Facturas del cliente cargadas:', facturas.length);
            console.log('📄 Primera factura:', facturas[0]);
            
            // Usar función adaptada para mostrar
            mostrarFacturasCliente(facturas);
            actualizarTotalResultados(facturas.length);
            
            // Mensaje de bienvenida
            if (facturas.length > 0) {
                mostrarMensajeHistorial(`Bienvenido ${AuthUtils.getUsuario().nombreCompleto}. Tienes ${facturas.length} facturas registradas.`, 'success');
            } else {
                mostrarMensajeHistorial('No tienes facturas registradas aún. Cuando recibas servicios en CliniPet, aparecerán aquí.', 'info');
            }
        } else {
            console.error('❌ Error del servidor:', result.mensaje);
            mostrarMensajeHistorial('Error al cargar mis facturas: ' + result.mensaje, 'danger');
            mostrarFacturasCliente([]);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        console.error('❌ Stack trace:', error.stack);
        mostrarMensajeHistorial('Error de conexión al cargar facturas. Verifique que el servidor esté funcionando.', 'danger');
        mostrarFacturasCliente([]);
    } finally {
        mostrarLoadingHistorial(false);
    }
}

// ========== MOSTRAR FACTURAS ADAPTADO PARA CLIENTE ==========
function mostrarFacturasCliente(facturas) {
    const container = document.getElementById('facturasList');
    
    if (!container) {
        console.error('❌ Contenedor facturasList no encontrado');
        return;
    }
    
    if (!facturas || facturas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No tienes facturas registradas</h5>
                <p class="text-muted">
                    Cuando realices servicios o compras en CliniPet para tus mascotas, 
                    tus facturas aparecerán aquí.
                </p>
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        Las facturas se generan automáticamente cuando recibes servicios veterinarios
                    </small>
                </div>
            </div>
        `;
        return;
    }

    console.log('🎨 Generando HTML para', facturas.length, 'facturas del cliente');
    
    let html = '';
    facturas.forEach((factura, index) => {
        try {
            console.log(`📄 Procesando factura ${index + 1}:`, factura);
            
            // USAR NOMBRES DE CAMPOS CORRECTOS según la BD
            const fechaFactura = factura.FechaFactura || factura.Fecha || new Date().toISOString();
            const fechaFormateada = new Date(fechaFactura).toLocaleDateString('es-PA');
            
            // Usar función del historial para conversión segura
            const totalFactura = convertirANumero(factura.totalFactura || factura.Total || 0);
            const totalItems = convertirANumero(factura.TotalItems || factura.totalItems || 1);
            
            const firmaBadge = factura.TieneFirmaDigital ? 'firma-valida' : 'firma-invalida';
            const firmaTexto = factura.TieneFirmaDigital ? 'Firmada Digitalmente' : 'Sin Firma Digital';
            
            const nombreMascota = factura.NombreMascota || factura.Mascota || 'Sin mascota específica';
            const idFactura = factura.IDFactura || factura.ID || index + 1;
            const firmante = factura.NombreFirmante || 'CliniPet';

            html += `
                <div class="historial-card fade-in-historial">
                    <div class="row align-items-center">
                        <div class="col-lg-2 col-md-3 col-sm-6 mb-2">
                            <div class="factura-id">#${idFactura}</div>
                            <small class="factura-fecha">${fechaFormateada}</small>
                        </div>
                        <div class="col-lg-4 col-md-4 col-sm-6 mb-2">
                            <div class="text-truncate"><strong>${nombreMascota}</strong></div>
                            <small class="text-muted">${Math.floor(totalItems)} servicios/productos</small>
                        </div>
                        <div class="col-lg-2 col-md-2 col-sm-6 mb-2">
                            <div class="factura-total">$${totalFactura.toFixed(2)}</div>
                            <small class="text-muted">Total pagado</small>
                        </div>
                        <div class="col-lg-2 col-md-6 col-sm-8 mb-2">
                            <span class="badge factura-badge ${firmaBadge}">${firmaTexto}</span><br>
                            <small class="text-muted">Por: ${firmante}</small>
                        </div>
                        <div class="col-lg-2 col-md-6 col-sm-4 mb-2">
                            <div class="d-grid gap-1">
                                <button class="btn btn-outline-primary btn-sm" onclick="verDetallesFactura(${idFactura})" title="Ver detalles completos">
                                    <i class="fas fa-eye me-1"></i> Detalles
                                </button>
                                <button class="btn btn-outline-success btn-sm" onclick="descargarPDFFactura(${idFactura})" title="Descargar factura en PDF">
                                    <i class="fas fa-download me-1"></i> PDF
                                </button>
                                <button class="btn btn-outline-info btn-sm" onclick="verificarFirmaFactura(${idFactura})" title="Verificar firma digital">
                                    <i class="fas fa-shield-alt me-1"></i> Verificar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Error procesando factura:', factura, error);
        }
    });

    container.innerHTML = html;
    console.log('✅ HTML del historial de cliente generado correctamente');
}

// ========== SOBRESCRIBIR FUNCIONES DEL HISTORIAL ==========

// Sobrescribir cargarHistorial para usar nuestra función
async function cargarHistorial() {
    await cargarMisFacturas();
}

// Sobrescribir mostrarFacturas para usar nuestra versión
function mostrarFacturas(facturas) {
    mostrarFacturasCliente(facturas);
}

// ========== BÚSQUEDA ADAPTADA PARA CLIENTE ==========
window.buscarMisFacturas = async function() {
    const termino = document.getElementById('searchTerm')?.value?.trim();
    
    if (!termino) {
        mostrarMensajeHistorial('Ingrese un término de búsqueda', 'warning');
        return;
    }

    console.log('🔍 Buscando en mis facturas con término:', termino);
    await aplicarFiltrosCliente();
};

async function aplicarFiltrosCliente() {
    console.log('🔧 Aplicando filtros para cliente...');
    mostrarLoadingHistorial(true);
    
    try {
        const termino = document.getElementById('searchTerm')?.value?.trim() || '';
        const tipo = document.getElementById('searchType')?.value || 'TODOS';
        const fechaInicio = document.getElementById('fechaInicio')?.value || '';
        const fechaFin = document.getElementById('fechaFin')?.value || '';

        let url = '../../backend/controller/facturacionController.php?accion=buscarFacturas';
        const params = new URLSearchParams();
        
        if (termino) params.append('termino', termino);
        if (tipo !== 'TODOS') params.append('tipo', tipo);
        params.append('estado', 'Completada'); // Solo facturas completadas para clientes
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        if (params.toString()) {
            url += '&' + params.toString();
        }

        console.log('📡 URL de búsqueda cliente:', url);

        const response = await fetch(url);
        const result = await response.json();
        
        console.log('📋 Resultado búsqueda cliente:', result);
        
        if (result.estado === 'ok') {
            facturas = result.resultados || [];
            mostrarFacturasCliente(facturas);
            actualizarTotalResultados(facturas.length);
            
            if (facturas.length === 0) {
                mostrarMensajeHistorial('No se encontraron facturas con los criterios especificados', 'info');
            } else {
                mostrarMensajeHistorial(`Se encontraron ${facturas.length} facturas`, 'success');
            }
        } else {
            mostrarMensajeHistorial('Error en la búsqueda: ' + result.mensaje, 'danger');
            mostrarFacturasCliente([]);
        }
    } catch (error) {
        console.error('❌ Error de conexión en búsqueda:', error);
        mostrarMensajeHistorial('Error de conexión en la búsqueda', 'danger');
        mostrarFacturasCliente([]);
    } finally {
        mostrarLoadingHistorial(false);
    }
}

// Sobrescribir aplicarFiltros para clientes
window.aplicarFiltros = async function() {
    await aplicarFiltrosCliente();
};

// ========== LIMPIAR FILTROS ==========
function limpiarFiltrosCliente() {
    console.log('🧹 Limpiando filtros del cliente...');
    
    const elementos = ['searchTerm', 'searchType', 'fechaInicio', 'fechaFin'];
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            if (elemento.type === 'select-one') {
                elemento.value = elemento.id === 'searchType' ? 'TODOS' : '';
            } else {
                elemento.value = '';
            }
        }
    });
    
    cargarMisFacturas();
}

// Sobrescribir limpiarFiltros
window.limpiarFiltros = function() {
    limpiarFiltrosCliente();
};

// ========== EVENT LISTENERS ==========
function configurarEventListenersCliente() {
    console.log('🔧 Configurando event listeners del cliente...');
    
    // Enter en búsqueda
    const searchTerm = document.getElementById('searchTerm');
    if (searchTerm) {
        searchTerm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarMisFacturas();
            }
        });
    }
    
    // Auto-aplicar filtros cuando cambian
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    const searchType = document.getElementById('searchType');
    
    if (fechaInicio) {
        fechaInicio.addEventListener('change', aplicarFiltrosCliente);
    }
    if (fechaFin) {
        fechaFin.addEventListener('change', aplicarFiltrosCliente);
    }
    if (searchType) {
        searchType.addEventListener('change', aplicarFiltrosCliente);
    }
}

// ========== DEBUG INFO ==========
window.debugClienteFacturas = function() {
    console.log('🔍 DEBUG INFO:');
    console.log('Usuario actual:', AuthUtils.getUsuario());
    console.log('Es cliente:', AuthUtils.isCliente());
    console.log('Cédula cliente:', AuthUtils.getCedulaCliente());
    console.log('Facturas cargadas:', facturas?.length || 0);
    console.log('Primera factura:', facturas?.[0]);
};

