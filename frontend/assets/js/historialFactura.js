// ========== HISTORIAL DE FACTURAS JS (CORREGIDO) ==========
// Este archivo maneja exclusivamente el historial de facturas
// Versión corregida que maneja adecuadamente los tipos de datos

let facturas = [];
let facturaSeleccionada = null;

// Inicialización del historial cuando se activa el tab
document.addEventListener('DOMContentLoaded', function() {
    // Configurar event listeners para los tabs
    const historialTab = document.getElementById('historial-tab');
    if (historialTab) {
        historialTab.addEventListener('shown.bs.tab', function() {
            console.log('🔄 Tab historial activado, cargando datos...');
            configurarEventListenersHistorial();
            cargarHistorial();
        });
    }
    
    // Si ya estamos en el tab de historial, inicializar inmediatamente
    if (historialTab && historialTab.classList.contains('active')) {
        configurarEventListenersHistorial();
        cargarHistorial();
    }
});

// ========== FUNCIONES DE UTILIDAD ==========

function mostrarMensajeHistorial(mensaje, tipo = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo} alert-dismissible fade show`;
        alert.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        alertContainer.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    } else {
        // Fallback para debugging
        console.log(`${tipo.toUpperCase()}: ${mensaje}`);
    }
}

function mostrarLoadingHistorial(mostrar = true) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = mostrar ? 'block' : 'none';
    }
}

// ========== FUNCIÓN PARA CONVERTIR VALORES NUMÉRICOS (CLAVE) ==========
function convertirANumero(valor) {
    if (valor === null || valor === undefined || valor === '') {
        return 0;
    }
    
    // Si ya es un número, devolverlo
    if (typeof valor === 'number') {
        return isNaN(valor) ? 0 : valor;
    }
    
    // Si es string, intentar convertir
    if (typeof valor === 'string') {
        // Remover caracteres no numéricos excepto punto y coma
        const numeroLimpio = valor.replace(/[^\d.,\-]/g, '');
        const numero = parseFloat(numeroLimpio.replace(',', '.'));
        return isNaN(numero) ? 0 : numero;
    }
    
    return 0;
}

// ========== FUNCIONES PRINCIPALES DEL HISTORIAL ==========

async function cargarHistorial() {
    console.log('📊 Iniciando carga del historial...');
    mostrarLoadingHistorial(true);
    
    try {
        const response = await fetch('../../backend/controller/facturacionController.php?accion=obtenerHistorial');
        const result = await response.json();
        
        console.log('📋 Respuesta del servidor:', result);
        
        if (result.estado === 'ok') {
            facturas = result.historial || [];
            console.log('✅ Facturas cargadas:', facturas.length);
            mostrarFacturas(facturas);
            actualizarTotalResultados(facturas.length);
        } else {
            console.error('❌ Error del servidor:', result.mensaje);
            mostrarMensajeHistorial('Error al cargar historial: ' + result.mensaje, 'danger');
            mostrarFacturas([]); // Mostrar estado vacío
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        mostrarMensajeHistorial('Error de conexión al cargar historial. Verifique que el servidor esté funcionando.', 'danger');
        mostrarFacturas([]); // Mostrar estado vacío
    } finally {
        mostrarLoadingHistorial(false);
    }
}

function mostrarFacturas(facturas) {
    const container = document.getElementById('facturasList');
    
    if (!container) {
        console.error('❌ Contenedor facturasList no encontrado');
        return;
    }
    
    if (!facturas || facturas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No se encontraron facturas</h5>
                <p class="text-muted">
                    ${facturas && facturas.length === 0 ? 
                        'Intente ajustar los filtros de búsqueda o crear una nueva factura.' : 
                        'Verifique la conexión con el servidor.'
                    }
                </p>
            </div>
        `;
        return;
    }

    console.log('🎨 Generando HTML para', facturas.length, 'facturas');
    
    let html = '';
    facturas.forEach((factura, index) => {
        try {
            // Convertir y validar datos de la factura
            const fechaFactura = factura.FechaFactura || factura.Fecha || new Date().toISOString();
            const fechaFormateada = new Date(fechaFactura).toLocaleDateString('es-PA');
            
            // CORRECCIÓN CRÍTICA: Usar función de conversión segura
            const totalFactura = convertirANumero(factura.totalFactura || factura.Total || factura.total || 0);
            const totalItems = convertirANumero(factura.TotalItems || factura.totalItems || 0);
            
            const estadoBadge = (factura.EstadoFactura || factura.Estado || 'Completada') === 'Completada' ? 'estado-completada' : 'estado-pendiente';
            const firmaBadge = factura.TieneFirmaDigital ? 'firma-valida' : 'firma-invalida';
            const firmaTexto = factura.TieneFirmaDigital ? 'Firmada' : 'Sin Firma';
            
            // Datos del cliente y mascota con valores por defecto
            const nombreCliente = factura.NombreCliente || factura.Cliente || 'Cliente no disponible';
            const cedulaCliente = factura.CedulaCliente || factura.Cedula || '---';
            const nombreMascota = factura.NombreMascota || factura.Mascota || 'Sin mascota específica';
            const idFactura = factura.IDFactura || factura.ID || index + 1;

            html += `
                <div class="historial-card fade-in-historial">
                    <div class="row align-items-center">
                        <div class="col-lg-2 col-md-3 col-sm-6 mb-2">
                            <div class="factura-id">#${idFactura}</div>
                            <small class="factura-fecha">${fechaFormateada}</small>
                        </div>
                        <div class="col-lg-3 col-md-4 col-sm-6 mb-2">
                            <div class="factura-cliente">${nombreCliente}</div>
                            <small class="text-muted">${cedulaCliente}</small>
                        </div>
                        <div class="col-lg-2 col-md-3 col-sm-6 mb-2">
                            <div class="text-truncate">${nombreMascota}</div>
                            <small class="text-muted">${Math.floor(totalItems)} items</small>
                        </div>
                        <div class="col-lg-2 col-md-2 col-sm-6 mb-2">
                            <div class="factura-total">$${totalFactura.toFixed(2)}</div>
                            <small class="text-muted">Total</small>
                        </div>
                        <div class="col-lg-2 col-md-6 col-sm-8 mb-2">
                            <span class="badge factura-badge ${estadoBadge}">${factura.EstadoFactura || 'Completada'}</span><br>
                            <span class="badge factura-badge ${firmaBadge}">${firmaTexto}</span>
                        </div>
                        <div class="col-lg-1 col-md-6 col-sm-4 mb-2">
                            <div class="dropdown">
                                <button class="btn btn-outline-primary btn-sm dropdown-toggle w-100" 
                                        type="button" 
                                        id="dropdownMenuButton${idFactura}" 
                                        data-bs-toggle="dropdown" 
                                        aria-expanded="false">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton${idFactura}">
                                    <li><a class="dropdown-item" href="javascript:void(0)" onclick="verDetallesFactura(${idFactura})">
                                        <i class="fas fa-eye me-2"></i>Ver Detalles
                                    </a></li>
                                    <li><a class="dropdown-item" href="javascript:void(0)" onclick="descargarPDFFactura(${idFactura})">
                                        <i class="fas fa-download me-2"></i>Descargar PDF
                                    </a></li>
                                    <li><a class="dropdown-item" href="javascript:void(0)" onclick="verificarFirmaFactura(${idFactura})">
                                        <i class="fas fa-shield-alt me-2"></i>Verificar Firma
                                    </a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Error procesando factura:', factura, error);
            // Continuar con la siguiente factura en caso de error
        }
    });

    container.innerHTML = html;
    console.log('✅ HTML del historial generado correctamente');
}

function actualizarTotalResultados(total) {
    const totalElement = document.getElementById('totalResultados');
    if (totalElement) {
        totalElement.textContent = total;
    }
}

// ========== FUNCIONES DE BÚSQUEDA Y FILTROS ==========

window.buscarFacturas = async function() {
    const termino = document.getElementById('searchTerm')?.value?.trim();
    
    if (!termino) {
        mostrarMensajeHistorial('Ingrese un término de búsqueda', 'warning');
        return;
    }

    console.log('🔍 Buscando facturas con término:', termino);
    await aplicarFiltros();
};

window.aplicarFiltros = async function() {
    console.log('🔧 Aplicando filtros...');
    mostrarLoadingHistorial(true);
    
    try {
        const termino = document.getElementById('searchTerm')?.value?.trim() || '';
        const tipo = document.getElementById('searchType')?.value || 'TODOS';
        const estado = document.getElementById('searchStatus')?.value || 'TODOS';
        const fechaInicio = document.getElementById('fechaInicio')?.value || '';
        const fechaFin = document.getElementById('fechaFin')?.value || '';

        let url = '../../backend/controller/facturacionController.php?accion=buscarFacturas';
        const params = new URLSearchParams();
        
        if (termino) params.append('termino', termino);
        if (tipo !== 'TODOS') params.append('tipo', tipo);
        if (estado !== 'TODOS') params.append('estado', estado);
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        if (params.toString()) {
            url += '&' + params.toString();
        }

        console.log('📡 URL de búsqueda:', url);

        const response = await fetch(url);
        const result = await response.json();
        
        console.log('📋 Resultado de búsqueda:', result);
        
        if (result.estado === 'ok') {
            facturas = result.resultados || [];
            mostrarFacturas(facturas);
            actualizarTotalResultados(facturas.length);
            
            if (facturas.length === 0) {
                mostrarMensajeHistorial('No se encontraron facturas con los criterios especificados', 'info');
            } else {
                mostrarMensajeHistorial(`Se encontraron ${facturas.length} facturas`);
            }
        } else {
            console.error('❌ Error en búsqueda:', result.mensaje);
            mostrarMensajeHistorial('Error en la búsqueda: ' + result.mensaje, 'danger');
            mostrarFacturas([]); // Mostrar estado vacío
        }
    } catch (error) {
        console.error('❌ Error de conexión en búsqueda:', error);
        mostrarMensajeHistorial('Error de conexión en la búsqueda', 'danger');
        mostrarFacturas([]); // Mostrar estado vacío
    } finally {
        mostrarLoadingHistorial(false);
    }
};

window.limpiarFiltros = function() {
    console.log('🧹 Limpiando filtros...');
    
    const elementos = ['searchTerm', 'searchType', 'searchStatus', 'fechaInicio', 'fechaFin'];
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            if (elemento.type === 'select-one') {
                elemento.value = elemento.id === 'searchType' || elemento.id === 'searchStatus' ? 'TODOS' : '';
            } else {
                elemento.value = '';
            }
        }
    });
    
    cargarHistorial();
};

// ========== FUNCIONES DE DETALLES DE FACTURA ==========

window.verDetallesFactura = async function(idFactura) {
    console.log('👁️ Viendo detalles de factura:', idFactura);
    mostrarLoadingHistorial(true);
    
    try {
        const response = await fetch(`../../backend/controller/facturacionController.php?accion=verDetalleCompleto&id=${idFactura}`);
        const result = await response.json();
        
        console.log('📄 Detalles de factura:', result);
        
        if (result.estado === 'ok') {
            facturaSeleccionada = result;
            mostrarModalDetallesFactura(result);
        } else {
            mostrarMensajeHistorial('Error al cargar detalles: ' + result.mensaje, 'danger');
        }
    } catch (error) {
        console.error('❌ Error cargando detalles:', error);
        mostrarMensajeHistorial('Error de conexión al cargar detalles', 'danger');
    } finally {
        mostrarLoadingHistorial(false);
    }
};

function mostrarModalDetallesFactura(data) {
    const factura = data.factura;
    const items = data.items || [];
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('facturaDetailModal');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Crear modal nuevo
    crearModalDetalles();
    const modal = document.getElementById('facturaDetailModal');
    
    document.getElementById('modalFacturaId').textContent = factura.IDFactura;
    
    const fechaFormateada = new Date(factura.FechaFactura || factura.Fecha).toLocaleDateString('es-PA');
    const fechaFirmaFormateada = factura.FechaFirma ? new Date(factura.FechaFirma).toLocaleDateString('es-PA') : 'N/A';
    
    let itemsHtml = '';
    items.forEach(item => {
        const precioUnitario = convertirANumero(item.PrecioUnitario || item.PrecioBruto || item.precio || 0);
        const cantidad = convertirANumero(item.CantidadVendida || item.cantidad || 1);
        const itbms = convertirANumero(item.ITBMSLinea || item.itbms || 0);
        const total = convertirANumero(item.totalLinea || item.total || 0);
        
        itemsHtml += `
            <tr>
                <td>${item.Tipo === 'Producto' ? 'PROD-' : 'SERV-'}${item.IDITEM}</td>
                <td>${item.NombreProducto || item.nombre || 'Producto/Servicio'}</td>
                <td class="text-center">${Math.floor(cantidad)}</td>
                <td class="text-end">${(precioUnitario / cantidad).toFixed(2)}</td>
                <td class="text-end">${itbms.toFixed(2)}</td>
                <td class="text-end">${total.toFixed(2)}</td>
            </tr>
        `;
    });

    // Convertir totales de manera segura
    const subtotal = convertirANumero(factura.subtotalf || factura.Subtotal || 0);
    const itbmsTotal = convertirANumero(factura.ITBMSFactura || factura.ITBMS || 0);
    const totalFactura = convertirANumero(factura.totalFactura || factura.Total || 0);

    const contenido = `
        <div class="card">
            <div class="card-header bg-light">
                <h6 class="mb-0">INFORMACIÓN DE LA FACTURA</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-primary border-bottom pb-2">DATOS DEL CONSUMIDOR</h6>
                        <p><strong>Nombre:</strong> ${factura.NombreCliente || 'No disponible'}</p>
                        <p><strong>Cédula:</strong> ${factura.CedulaCliente === '---' ? 'Contado' : (factura.CedulaCliente || 'No disponible')}</p>
                        <p><strong>Teléfono:</strong> ${factura.TelefonoCliente || 'N/A'}</p>
                        <p><strong>Email:</strong> ${factura.EmailCliente || 'N/A'}</p>
                        <p><strong>Mascota:</strong> ${factura.NombreMascota || 'Sin mascota específica'}</p>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-primary border-bottom pb-2">DATOS DE LA FACTURA</h6>
                        <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                        <p><strong>Estado:</strong> <span class="badge ${(factura.EstadoFactura || 'Completada') === 'Completada' ? 'bg-success' : 'bg-warning'}">${factura.EstadoFactura || 'Completada'}</span></p>
                        <p><strong>Firmante:</strong> ${factura.NombreFirmante || 'No disponible'}</p>
                        <p><strong>Fecha Firma:</strong> ${fechaFirmaFormateada}</p>
                        <p><strong>Firma Digital:</strong> 
                            ${factura.TieneFirmaDigital ? 
                                '<span class="badge bg-success"><i class="fas fa-shield-alt"></i> Verificada</span>' :
                                '<span class="badge bg-secondary">Sin firma</span>'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header bg-light">
                <h6 class="mb-0">DETALLE DE ITEMS</h6>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-striped mb-0">
                        <thead class="table-primary">
                            <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th class="text-center">Cantidad</th>
                                <th class="text-end">Precio Unit.</th>
                                <th class="text-end">ITBMS</th>
                                <th class="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 offset-md-6">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Subtotal:</strong></td>
                                <td class="text-end">${subtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>ITBMS (7%):</strong></td>
                                <td class="text-end">${itbmsTotal.toFixed(2)}</td>
                            </tr>
                            <tr class="table-primary">
                                <td><strong>TOTAL:</strong></td>
                                <td class="text-end"><strong>${totalFactura.toFixed(2)}</strong></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('facturaDetailContent').innerHTML = contenido;
    
    // Mostrar modal con mejor control
    const bootstrapModal = new bootstrap.Modal(modal, {
        backdrop: 'static',
        keyboard: true,
        focus: true
    });
    
    // Asegurar que se muestre correctamente
    setTimeout(() => {
        bootstrapModal.show();
    }, 100);
}

function crearModalDetalles() {
    const modalHTML = `
        <div class="modal fade" id="facturaDetailModal" tabindex="-1" aria-hidden="true" style="z-index: 1055;">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-file-invoice me-2"></i>
                            Detalles de Factura <span id="modalFacturaId"></span>
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="facturaDetailContent" style="max-height: 70vh; overflow-y: auto;">
                        <!-- Contenido dinámico -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-warning" onclick="descargarPDFModal()">
                            <i class="fas fa-download me-2"></i>Descargar PDF
                        </button>
                        <button type="button" class="btn btn-info" onclick="verificarFirmaModal()">
                            <i class="fas fa-shield-alt me-2"></i>Verificar Firma
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ========== FUNCIONES DE DESCARGA Y VERIFICACIÓN ==========

window.descargarPDFFactura = function(idFactura) {
    console.log('📥 Descargando PDF de factura:', idFactura);
    try {
        const pdfUrl = `../../backend/controller/generarPDF.php?id=${idFactura}`;
        
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `Factura_CliniPet_${idFactura}.pdf`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        mostrarMensajeHistorial('Descarga iniciada', 'success');
        
    } catch (error) {
        console.error('❌ Error descargando PDF:', error);
        mostrarMensajeHistorial('Error al descargar PDF', 'danger');
    }
};

window.descargarPDFModal = function() {
    if (facturaSeleccionada) {
        descargarPDFFactura(facturaSeleccionada.factura.IDFactura);
    }
};

window.verificarFirmaFactura = async function(idFactura) {
    console.log('🔐 Verificando firma de factura:', idFactura);
    mostrarLoadingHistorial(true);
    
    try {
        const response = await fetch(`../../backend/controller/facturacionController.php?accion=verificarFirma&id=${idFactura}`);
        const result = await response.json();
        
        if (result.estado === 'ok') {
            mostrarModalVerificacionFirma(result);
        } else {
            mostrarMensajeHistorial('Error al verificar firma: ' + result.mensaje, 'danger');
        }
    } catch (error) {
        console.error('❌ Error verificando firma:', error);
        mostrarMensajeHistorial('Error de conexión al verificar firma', 'danger');
    } finally {
        mostrarLoadingHistorial(false);
    }
};

window.verificarFirmaModal = function() {
    if (facturaSeleccionada) {
        verificarFirmaFactura(facturaSeleccionada.factura.IDFactura);
    }
};

function mostrarModalVerificacionFirma(data) {
    const estadoColor = data.firmaValida ? 'success' : 'danger';
    const estadoIcon = data.firmaValida ? 'check-circle' : 'times-circle';
    const estadoTexto = data.firmaValida ? 'VÁLIDA' : 'INVÁLIDA';
    
    const modalContent = `
        <div class="modal fade" id="verificacionFirmaModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-${estadoColor} text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-${estadoIcon} me-2"></i>
                            Verificación de Firma Digital
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <i class="fas fa-shield-alt fa-4x text-${estadoColor}"></i>
                            <h3 class="mt-3 text-${estadoColor}">Firma ${estadoTexto}</h3>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary">Información del Firmante</h6>
                                <p><strong>Nombre:</strong> ${data.firmante || 'No disponible'}</p>
                                <p><strong>Fecha de Firma:</strong> ${data.fechaFirma ? new Date(data.fechaFirma).toLocaleString('es-PA') : 'No disponible'}</p>
                                <p><strong>Algoritmo:</strong> ${data.algoritmo || 'RSA-SHA256'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary">Detalles Técnicos</h6>
                                <p><strong>Tipo:</strong> ${data.tipoFirma || 'OpenSSL'}</p>
                                <p><strong>Estado:</strong> <span class="badge bg-${estadoColor}">${estadoTexto}</span></p>
                                ${data.infoFirma && data.infoFirma.fingerprint ? 
                                    `<p><strong>Fingerprint:</strong><br><small class="font-monospace text-break">${data.infoFirma.fingerprint}</small></p>` 
                                    : ''
                                }
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('verificacionFirmaModal');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.getElementById('verificacionFirmaModal'));
    modal.show();
}

// ========== CONFIGURAR EVENT LISTENERS ==========

function configurarEventListenersHistorial() {
    console.log('🔧 Configurando event listeners del historial...');
    
    // Enter en búsqueda
    const searchTerm = document.getElementById('searchTerm');
    if (searchTerm) {
        searchTerm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarFacturas();
            }
        });
    }
    
    // Auto-aplicar filtros cuando cambian las fechas
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    const searchStatus = document.getElementById('searchStatus');
    const searchType = document.getElementById('searchType');
    
    if (fechaInicio) {
        fechaInicio.addEventListener('change', aplicarFiltros);
    }
    if (fechaFin) {
        fechaFin.addEventListener('change', aplicarFiltros);
    }
    if (searchStatus) {
        searchStatus.addEventListener('change', aplicarFiltros);
    }
    if (searchType) {
        searchType.addEventListener('change', aplicarFiltros);
    }
}

// ========== FUNCIONES PÚBLICAS PARA INTEGRACIÓN ==========

// Función para cargar el historial externamente (útil para tabs)
window.inicializarHistorial = function() {
    console.log('🚀 Inicializando historial externamente...');
    configurarEventListenersHistorial();
    cargarHistorial();
};

// Función para actualizar el historial externamente
window.actualizarHistorial = function() {
    console.log('🔄 Actualizando historial externamente...');
    cargarHistorial();
}