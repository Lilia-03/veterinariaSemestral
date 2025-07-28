// Variables globales para el estado de citas
let citaActual = {
    cliente: null,
    mascota: null,
    fecha: null,
    hora: null,
    servicio: null,
    observaciones: null
};

let horariosDisponibles = [];
let serviciosDisponibles = [];

// ========== FUNCIONES GLOBALES (DISPONIBLES DESDE HTML) ==========

// Funciones de utilidad
function mostrarMensaje(mensaje, tipo = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo} alert-dismissible fade show fade-in`;
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
    }
}

function mostrarLoading(mostrar = true) {
    const loadingDiv = document.getElementById('loadingSpinner');
    if (loadingDiv) {
        loadingDiv.style.display = mostrar ? 'block' : 'none';
    }
}

// Buscar cliente - FUNCIÓN GLOBAL
window.buscarCliente = async function() {
    const cedula = document.getElementById('cedulaCliente').value.trim();
    
    if (!cedula) {
        mostrarMensaje('Por favor ingrese la cédula del cliente', 'warning');
        return;
    }

    mostrarLoading(true);

    try {
        console.log('🔍 Buscando cliente con cédula:', cedula);
        
        const response = await fetch(`../../backend/controller/citasController.php?accion=obtenerCliente&cedula=${encodeURIComponent(cedula)}`);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers.get('content-type'));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('❌ No es JSON:', textResponse.substring(0, 200));
            throw new Error('El servidor no devolvió JSON válido. Verifique el controlador.');
        }
        
        const result = await response.json();
        console.log('📋 Respuesta del servidor:', result);
        
        if (result.estado === 'ok') {
            citaActual.cliente = result.cliente;
            mostrarInformacionCliente(result.cliente);
            buscarMascotas(cedula);
            mostrarMensaje(`Cliente encontrado: ${result.cliente.Nombre}`, 'success');
        } else {
            mostrarMensaje('Cliente no encontrado. Verifique la cédula ingresada.', 'danger');
            limpiarFormulario();
        }
    } catch (error) {
        console.error('❌ Error completo:', error);
        mostrarMensaje(`Error al buscar cliente: ${error.message}`, 'danger');
    } finally {
        mostrarLoading(false);
    }
};

// Seleccionar mascota - FUNCIÓN GLOBAL
window.seleccionarMascota = function() {
    const mascotaSelect = document.getElementById('mascotaSelect');
    if (!mascotaSelect || !mascotaSelect.value) {
        return;
    }

    const mascotaId = mascotaSelect.value;
    const mascotaNombre = mascotaSelect.options[mascotaSelect.selectedIndex].text;
    
    citaActual.mascota = {
        id: mascotaId,
        nombre: mascotaNombre
    };

    // Mostrar sección de cita
    const citaSection = document.getElementById('citaSection');
    if (citaSection) {
        citaSection.style.display = 'block';
        citaSection.classList.add('fade-in');
    }

    mostrarMensaje('Mascota seleccionada. Puede proceder a programar la cita.', 'success');
};

// Verificar disponibilidad - FUNCIÓN GLOBAL
window.verificarDisponibilidad = async function() {
    const fechaInput = document.getElementById('fechaCita');
    if (!fechaInput || !fechaInput.value) {
        return;
    }

    const fecha = fechaInput.value;
    mostrarLoading(true);

    try {
        const response = await fetch(`../../backend/controller/citasController.php?accion=obtenerDisponibilidad&fecha=${fecha}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.estado === 'ok') {
            horariosDisponibles = result.horarios;
            cargarHorariosDisponibles(result.horarios);
        } else {
            mostrarMensaje('Error al obtener disponibilidad de horarios', 'danger');
        }
    } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        mostrarMensaje('Error de conexión al verificar disponibilidad', 'danger');
    } finally {
        mostrarLoading(false);
    }
};

// Crear cita - FUNCIÓN GLOBAL
window.crearCita = async function() {
    // Validar formulario
    const validacion = validarFormularioCita();
    if (!validacion.valido) {
        mostrarMensaje(validacion.mensaje, 'warning');
        return;
    }

    mostrarLoading(true);

    try {
        const dataCita = {
            cedulaCliente: citaActual.cliente.Cedula,
            idMascota: citaActual.mascota.id,
            fechaCita: document.getElementById('fechaCita').value,
            horaCita: document.getElementById('horaCita').value,
            tipoServicio: document.getElementById('tipoServicio').value,
            observaciones: document.getElementById('observaciones').value || null,
            usuarioCreador: 1 // Por ahora fijo, después se puede obtener de la sesión
        };

        console.log('📤 Enviando datos de cita:', dataCita);

        const response = await fetch('../../backend/controller/citasController.php?accion=crearCita', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataCita)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (result.estado === 'ok') {
            mostrarMensaje('¡Cita creada exitosamente!', 'success');
            limpiarFormulario();
            // Actualizar citas pendientes si la pestaña está activa
            if (document.getElementById('pendientes-tab').classList.contains('active')) {
                cargarCitasPendientes();
            }
        } else {
            mostrarMensaje('Error al crear la cita: ' + result.mensaje, 'danger');
        }
    } catch (error) {
        console.error('Error creando cita:', error);
        mostrarMensaje('Error de conexión al crear la cita', 'danger');
    } finally {
        mostrarLoading(false);
    }
};

// Buscar citas por cliente - FUNCIÓN GLOBAL
window.buscarCitasPorCliente = async function() {
    const cedula = document.getElementById('buscarPorCedula').value.trim();
    
    if (!cedula) {
        mostrarMensaje('Ingrese la cédula del cliente', 'warning');
        return;
    }

    mostrarLoading(true);

    try {
        const response = await fetch(`../../backend/controller/citasController.php?accion=obtenerCitasPorCliente&cedula=${encodeURIComponent(cedula)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.estado === 'ok') {
            mostrarResultadosCitas(result.citas, `Citas del cliente con cédula: ${cedula}`);
        } else {
            mostrarMensaje('No se encontraron citas para este cliente', 'info');
            limpiarResultados();
        }
    } catch (error) {
        console.error('Error buscando citas:', error);
        mostrarMensaje('Error al buscar citas del cliente', 'danger');
    } finally {
        mostrarLoading(false);
    }
};

// Buscar citas por fecha - FUNCIÓN GLOBAL
window.buscarCitasPorFecha = async function() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    
    if (!fechaInicio) {
        mostrarMensaje('Seleccione la fecha de inicio', 'warning');
        return;
    }

    mostrarLoading(true);

    try {
        let url = `../../backend/controller/citasController.php?accion=obtenerCitasPorFecha&fechaInicio=${fechaInicio}`;
        if (fechaFin) {
            url += `&fechaFin=${fechaFin}`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.estado === 'ok') {
            const titulo = fechaFin && fechaFin !== fechaInicio 
                ? `Citas del ${fechaInicio} al ${fechaFin}`
                : `Citas del ${fechaInicio}`;
            mostrarResultadosCitas(result.citas, titulo);
        } else {
            mostrarMensaje('No se encontraron citas en el rango de fechas', 'info');
            limpiarResultados();
        }
    } catch (error) {
        console.error('Error buscando citas:', error);
        mostrarMensaje('Error al buscar citas por fecha', 'danger');
    } finally {
        mostrarLoading(false);
    }
};

// Cargar agenda de hoy - FUNCIÓN GLOBAL
window.cargarAgendaHoy = function() {
    const fechaAgenda = document.getElementById('fechaAgenda');
    if (fechaAgenda) {
        fechaAgenda.value = new Date().toISOString().split('T')[0];
        cargarAgendaDia();
    }
};

// Cargar agenda del día - FUNCIÓN GLOBAL
window.cargarAgendaDia = async function() {
    const fechaAgenda = document.getElementById('fechaAgenda');
    if (!fechaAgenda || !fechaAgenda.value) {
        return;
    }

    const fecha = fechaAgenda.value;
    mostrarLoading(true);

    try {
        const response = await fetch(`../../backend/controller/citasController.php?accion=obtenerCitasPorFecha&fechaInicio=${fecha}&fechaFin=${fecha}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.estado === 'ok') {
            mostrarAgendaDia(result.citas, fecha);
        } else {
            mostrarAgendaVacia(fecha);
        }
    } catch (error) {
        console.error('Error cargando agenda:', error);
        mostrarMensaje('Error al cargar la agenda del día', 'danger');
    } finally {
        mostrarLoading(false);
    }
};

// Cargar citas pendientes - FUNCIÓN GLOBAL
window.cargarCitasPendientes = async function() {
    console.log('🔄 Cargando citas pendientes...');
    mostrarLoading(true);

    try {
        const response = await fetch('../../backend/controller/citasController.php?accion=obtenerPendientes');
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📋 Citas pendientes:', result);
        
        if (result.estado === 'ok') {
            mostrarCitasPendientes(result.citas);
        } else {
            mostrarPendientesVacio();
        }
    } catch (error) {
        console.error('❌ Error cargando citas pendientes:', error);
        mostrarMensaje('Error al cargar citas pendientes', 'danger');
    } finally {
        mostrarLoading(false);
    }
};

// FUNCIONES DE ACCIONES DE CITA - GLOBALES

// Ver detalle de cita - FUNCIÓN GLOBAL
window.verDetalleCita = async function(idCita) {
    mostrarLoading(true);

    try {
        const response = await fetch(`../../backend/controller/citasController.php?accion=obtenerDetalle&id=${idCita}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.estado === 'ok') {
            mostrarModalDetalle(result.cita);
        } else {
            mostrarMensaje('Error al obtener detalles de la cita', 'danger');
        }
    } catch (error) {
        console.error('Error obteniendo detalle:', error);
        mostrarMensaje('Error de conexión al obtener detalles', 'danger');
    } finally {
        mostrarLoading(false);
    }
};

// Confirmar cita - FUNCIÓN GLOBAL
window.confirmarCita = function(idCita) {
    mostrarModalConfirmacion(
        'Confirmar Cita',
        '¿Está seguro que desea confirmar esta cita?',
        () => actualizarEstadoCita(idCita, 'Confirmada')
    );
};

// Cancelar cita - FUNCIÓN GLOBAL
window.cancelarCita = function(idCita) {
    const motivo = prompt('Ingrese el motivo de cancelación (opcional):');
    actualizarEstadoCita(idCita, 'Cancelada', motivo);
};

// Completar cita - FUNCIÓN GLOBAL
window.completarCita = function(idCita) {
    mostrarModalConfirmacion(
        'Completar Cita',
        '¿Está seguro que desea marcar esta cita como completada?',
        () => actualizarEstadoCita(idCita, 'Completada')
    );
};

// No show - FUNCIÓN GLOBAL
window.marcarNoShow = function(idCita) {
    mostrarModalConfirmacion(
        'Marcar No Show',
        '¿Está seguro que el cliente no se presentó a la cita?',
        () => actualizarEstadoCita(idCita, 'No Show')
    );
};

// Reagendar cita - FUNCIÓN GLOBAL
window.reagendarCita = async function(idCita) {
    // Guardar ID para usar en el modal
    window.currentCitaId = idCita;
    
    // Limpiar campos del modal
    document.getElementById('nuevaFecha').value = '';
    document.getElementById('nuevaHora').innerHTML = '<option value="">Seleccione fecha primero</option>';
    document.getElementById('nuevaHora').disabled = true;
    
    const modal = new bootstrap.Modal(document.getElementById('modalReagendar'));
    modal.show();
};

// Verificar disponibilidad en modal - FUNCIÓN GLOBAL
window.verificarDisponibilidadModal = async function() {
    const fechaInput = document.getElementById('nuevaFecha');
    if (!fechaInput || !fechaInput.value) {
        return;
    }

    const fecha = fechaInput.value;
    mostrarLoading(true);

    try {
        const response = await fetch(`../../backend/controller/citasController.php?accion=obtenerDisponibilidad&fecha=${fecha}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.estado === 'ok') {
            cargarHorariosDisponiblesModal(result.horarios);
        } else {
            mostrarMensaje('Error al obtener disponibilidad', 'danger');
        }
    } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        mostrarMensaje('Error de conexión', 'danger');
    } finally {
        mostrarLoading(false);
    }
};

// Confirmar reagendar - FUNCIÓN GLOBAL
window.confirmarReagendar = async function() {
    const nuevaFecha = document.getElementById('nuevaFecha').value;
    const nuevaHora = document.getElementById('nuevaHora').value;
    
    if (!nuevaFecha || !nuevaHora) {
        mostrarMensaje('Debe seleccionar fecha y hora', 'warning');
        return;
    }

    mostrarLoading(true);

    try {
        const data = {
            idCita: window.currentCitaId,
            nuevaFecha: nuevaFecha,
            nuevaHora: nuevaHora,
            usuarioModificador: 1
        };

        const response = await fetch('../../backend/controller/citasController.php?accion=reagendar', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (result.estado === 'ok') {
            mostrarMensaje('Cita reagendada exitosamente', 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalReagendar'));
            modal.hide();
            
            // Refrescar vistas
            refrescarVistasActivas();
        } else {
            mostrarMensaje('Error al reagendar: ' + result.mensaje, 'danger');
        }
    } catch (error) {
        console.error('Error reagendando:', error);
        mostrarMensaje('Error de conexión al reagendar', 'danger');
    } finally {
        mostrarLoading(false);
    }
};

// ========== FUNCIONES INTERNAS ==========

// Cargar servicios disponibles
async function cargarServicios() {
    try {
        console.log('🔄 Cargando servicios...');
        
        const response = await fetch('../../backend/controller/citasController.php?accion=obtenerServicios');
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Content-Type:', response.headers.get('content-type'));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('❌ Respuesta no es JSON:', textResponse.substring(0, 500));
            throw new Error('El servidor devolvió HTML en lugar de JSON. Verifique que citasController.php esté funcionando correctamente.');
        }
        
        const result = await response.json();
        console.log('📋 Servicios cargados:', result);
        
        if (result.estado === 'ok') {
            serviciosDisponibles = result.servicios;
            const select = document.getElementById('tipoServicio');
            if (select) {
                select.innerHTML = '<option value="">Seleccione un servicio...</option>';
                result.servicios.forEach(servicio => {
                    const option = document.createElement('option');
                    option.value = servicio.NombreProducto;
                    option.textContent = `${servicio.NombreProducto} - $${parseFloat(servicio.PrecioITEM).toFixed(2)}`;
                    select.appendChild(option);
                });
            }
            console.log('✅ Servicios cargados correctamente');
        } else {
            console.error('❌ Error en respuesta:', result.mensaje);
            mostrarMensaje('Error cargando servicios desde el servidor', 'warning');
        }
    } catch (error) {
        console.error('❌ Error cargando servicios:', error);
        mostrarMensaje(`Error de conexión al cargar servicios: ${error.message}`, 'danger');
    }
}

function configurarFechaMinima() {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const fechaCita = document.getElementById('fechaCita');
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    const fechaAgenda = document.getElementById('fechaAgenda');
    
    if (fechaCita) fechaCita.setAttribute('min', fechaHoy);
    if (fechaInicio) fechaInicio.value = fechaHoy;
    if (fechaFin) fechaFin.value = fechaHoy;
    if (fechaAgenda) fechaAgenda.value = fechaHoy;
}

function configurarEventos() {
    // Event listeners para navegación por pestañas
    const tabs = document.querySelectorAll('#citasTabs button[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const target = event.target.getAttribute('data-bs-target');
            if (target === '#pendientes') {
                cargarCitasPendientes();
            } else if (target === '#agenda') {
                cargarAgendaHoy();
            }
        });
    });
}

// Mostrar información del cliente
function mostrarInformacionCliente(cliente) {
    const clienteInfo = document.getElementById('clienteInfo');
    const nombreCliente = document.getElementById('nombreCliente');
    const telefonoCliente = document.getElementById('telefonoCliente');
    const emailCliente = document.getElementById('emailCliente');
    
    if (clienteInfo && nombreCliente && telefonoCliente && emailCliente) {
        nombreCliente.textContent = cliente.Nombre;
        telefonoCliente.textContent = cliente.Teléfono;
        emailCliente.textContent = cliente.Email;
        clienteInfo.style.display = 'block';
        clienteInfo.classList.add('fade-in');
    }
}

// Buscar mascotas del cliente
async function buscarMascotas(cedula) {
    try {
        const response = await fetch(`../../backend/controller/citasController.php?accion=obtenerMascotas&cedula=${encodeURIComponent(cedula)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        const select = document.getElementById('mascotaSelect');
        const mascotaSection = document.getElementById('mascotaSection');
        
        if (select && mascotaSection) {
            select.innerHTML = '<option value="">Seleccione una mascota...</option>';
            
            if (result.estado === 'ok' && result.mascotas.length > 0) {
                result.mascotas.forEach(mascota => {
                    const option = document.createElement('option');
                    option.value = mascota.IDMascota;
                    option.textContent = `${mascota.Nombre} (${mascota.Especie})`;
                    select.appendChild(option);
                });
            }
            
            mascotaSection.style.display = 'block';
            mascotaSection.classList.add('fade-in');
        }
    } catch (error) {
        console.error('Error buscando mascotas:', error);
        mostrarMensaje('Error al cargar las mascotas del cliente', 'warning');
    }
}

// Cargar horarios disponibles en el select
function cargarHorariosDisponibles(horarios) {
    const select = document.getElementById('horaCita');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione una hora...</option>';
    select.disabled = false;

    horarios.forEach(horario => {
        if (horario.Disponible) {
            const option = document.createElement('option');
            option.value = horario.Hora;
            option.textContent = formatearHora(horario.Hora);
            select.appendChild(option);
        }
    });

    if (horarios.filter(h => h.Disponible).length === 0) {
        select.innerHTML = '<option value="">No hay horarios disponibles</option>';
        select.disabled = true;
        mostrarMensaje('No hay horarios disponibles para esta fecha', 'warning');
    }
}

// Validar formulario de cita
function validarFormularioCita() {
    if (!citaActual.cliente) {
        return { valido: false, mensaje: 'Debe buscar y seleccionar un cliente' };
    }

    if (!citaActual.mascota) {
        return { valido: false, mensaje: 'Debe seleccionar una mascota' };
    }

    const fecha = document.getElementById('fechaCita').value;
    if (!fecha) {
        return { valido: false, mensaje: 'Debe seleccionar una fecha para la cita' };
    }

    const hora = document.getElementById('horaCita').value;
    if (!hora) {
        return { valido: false, mensaje: 'Debe seleccionar una hora para la cita' };
    }

    const servicio = document.getElementById('tipoServicio').value;
    if (!servicio) {
        return { valido: false, mensaje: 'Debe seleccionar un tipo de servicio' };
    }

    return { valido: true };
}

// Limpiar formulario
function limpiarFormulario() {
    // Reiniciar estado
    citaActual = {
        cliente: null,
        mascota: null,
        fecha: null,
        hora: null,
        servicio: null,
        observaciones: null
    };

    // Limpiar campos
    const campos = ['cedulaCliente', 'fechaCita', 'horaCita', 'tipoServicio', 'observaciones'];
    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            elemento.value = '';
        }
    });

    // Limpiar selects
    const mascotaSelect = document.getElementById('mascotaSelect');
    if (mascotaSelect) {
        mascotaSelect.innerHTML = '<option value="">Seleccione una mascota...</option>';
    }

    const horaSelect = document.getElementById('horaCita');
    if (horaSelect) {
        horaSelect.innerHTML = '<option value="">Seleccione fecha primero</option>';
        horaSelect.disabled = true;
    }

    // Ocultar secciones
    const secciones = ['clienteInfo', 'mascotaSection', 'citaSection'];
    secciones.forEach(seccion => {
        const elemento = document.getElementById(seccion);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });
}

// Mostrar resultados de citas
function mostrarResultadosCitas(citas, titulo) {
    const container = document.getElementById('resultadosCitas');
    if (!container) return;

    if (citas.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-calendar-times fa-3x mb-3"></i>
                <p>No se encontraron citas</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="text-primary">${titulo}</h5>
            <span class="badge bg-primary">${citas.length} cita(s)</span>
        </div>
    `;

    citas.forEach(cita => {
        html += crearCardCita(cita);
    });

    container.innerHTML = html;
    container.classList.add('fade-in');
}

// Crear card de cita
function crearCardCita(cita) {
    const estadoClass = cita.EstadoCita.toLowerCase().replace(' ', '-');
    const fechaFormateada = formatearFecha(cita.FechaCita);
    const horaFormateada = formatearHora(cita.HoraCita);

    return `
        <div class="card cita-card ${estadoClass} mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h6 class="card-title mb-1">
                            <i class="fas fa-user me-2"></i>${cita.NombreCliente}
                            ${cita.NombreMascota ? `<small class="text-muted">- ${cita.NombreMascota}</small>` : ''}
                        </h6>
                        <p class="card-text mb-1">
                            <i class="fas fa-stethoscope me-2"></i>${cita.TipoServicio}
                        </p>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>${fechaFormateada} 
                            <i class="fas fa-clock me-1 ms-2"></i>${horaFormateada}
                        </small>
                    </div>
                    <div class="col-md-3 text-center">
                        <span class="badge badge-estado estado-${estadoClass}">${cita.EstadoCita}</span>
                    </div>
                    <div class="col-md-3 text-end">
                        <div class="btn-group" role="group">
                            <button class="btn btn-outline-primary btn-sm" onclick="verDetalleCita(${cita.IDCita})" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${cita.EstadoCita === 'Pendiente' ? `
                                <button class="btn btn-outline-success btn-sm" onclick="confirmarCita(${cita.IDCita})" title="Confirmar">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn btn-outline-warning btn-sm" onclick="reagendarCita(${cita.IDCita})" title="Reagendar">
                                    <i class="fas fa-calendar-alt"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="cancelarCita(${cita.IDCita})" title="Cancelar">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                            ${cita.EstadoCita === 'Confirmada' ? `
                                <button class="btn btn-outline-info btn-sm" onclick="completarCita(${cita.IDCita})" title="Completar">
                                    <i class="fas fa-check-double"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                ${cita.Observaciones ? `
                    <div class="row mt-2">
                        <div class="col-12">
                            <small class="text-muted">
                                <i class="fas fa-comment me-1"></i><strong>Obs:</strong> ${cita.Observaciones}
                            </small>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Limpiar resultados
function limpiarResultados() {
    const container = document.getElementById('resultadosCitas');
    if (container) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-search fa-3x mb-3"></i>
                <p>Utilice los filtros para buscar citas</p>
            </div>
        `;
    }
}

// Mostrar agenda del día
function mostrarAgendaDia(citas, fecha) {
    const container = document.getElementById('agendaDia');
    if (!container) return;

    const fechaFormateada = formatearFecha(fecha);
    
    if (citas.length === 0) {
        mostrarAgendaVacia(fecha);
        return;
    }

    // Agrupar citas por hora
    const citasPorHora = {};
    citas.forEach(cita => {
        const hora = cita.HoraCita;
        if (!citasPorHora[hora]) {
            citasPorHora[hora] = [];
        }
        citasPorHora[hora].push(cita);
    });

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="text-primary">Agenda del ${fechaFormateada}</h5>
            <span class="badge bg-primary">${citas.length} cita(s)</span>
        </div>
        <div class="row">
    `;

    // Ordenar por hora
    const horasOrdenadas = Object.keys(citasPorHora).sort();
    
    horasOrdenadas.forEach(hora => {
        const citasHora = citasPorHora[hora];
        html += `
            <div class="col-md-6 mb-3">
                <div class="card border-primary">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0">
                            <i class="fas fa-clock me-2"></i>${formatearHora(hora)}
                        </h6>
                    </div>
                    <div class="card-body p-2">
        `;
        
        citasHora.forEach(cita => {
            const estadoClass = cita.EstadoCita.toLowerCase().replace(' ', '-');
            html += `
                <div class="border-start border-3 border-${getBootstrapColorByState(cita.EstadoCita)} ps-3 mb-2">
                    <h6 class="mb-1">${cita.NombreCliente}</h6>
                    <small class="text-muted d-block">${cita.NombreMascota} - ${cita.TipoServicio}</small>
                    <span class="badge badge-estado estado-${estadoClass} mt-1">${cita.EstadoCita}</span>
                    <div class="btn-group btn-group-sm mt-1" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="verDetalleCita(${cita.IDCita})">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${getActionButtonsForState(cita.EstadoCita, cita.IDCita)}
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
    container.classList.add('fade-in');
}

// Mostrar agenda vacía
function mostrarAgendaVacia(fecha) {
    const container = document.getElementById('agendaDia');
    if (container) {
        const fechaFormateada = formatearFecha(fecha);
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-calendar-day fa-3x mb-3"></i>
                <h5>No hay citas programadas</h5>
                <p>Para el día ${fechaFormateada}</p>
            </div>
        `;
    }
}

// Mostrar citas pendientes
function mostrarCitasPendientes(citas) {
    const container = document.getElementById('citasPendientes');
    if (!container) return;

    if (citas.length === 0) {
        mostrarPendientesVacio();
        return;
    }

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="text-danger">Citas que requieren confirmación</h6>
            <span class="badge bg-danger">${citas.length} pendiente(s)</span>
        </div>
    `;

    citas.forEach(cita => {
        const fechaFormateada = formatearFecha(cita.FechaCita);
        const horaFormateada = formatearHora(cita.HoraCita);
        const horasTranscurridas = cita.HorasDesdeCreacion;
        const urgente = horasTranscurridas > 24;

        html += `
            <div class="card mb-3 ${urgente ? 'border-danger' : 'border-warning'}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h6 class="card-title mb-1">
                                ${urgente ? '<i class="fas fa-exclamation-triangle text-danger me-2"></i>' : ''}
                                ${cita.NombreCliente}
                            </h6>
                            <p class="card-text mb-1">
                                <strong>Mascota:</strong> ${cita.NombreMascota}<br>
                                <strong>Servicio:</strong> ${cita.TipoServicio}<br>
                                <strong>Fecha/Hora:</strong> ${fechaFormateada} ${horaFormateada}
                            </p>
                            <small class="text-muted">
                                Creada hace ${horasTranscurridas} hora(s)
                                ${urgente ? '<span class="text-danger ms-2"><i class="fas fa-clock"></i> URGENTE</span>' : ''}
                            </small>
                        </div>
                        <div class="col-md-3">
                            <small class="text-muted d-block">Contacto:</small>
                            <small>
                                <i class="fas fa-phone me-1"></i>${cita.Teléfono}<br>
                                <i class="fas fa-envelope me-1"></i>${cita.Email}
                            </small>
                        </div>
                        <div class="col-md-3 text-end">
                            <div class="btn-group-vertical" role="group">
                                <button class="btn btn-success btn-sm mb-1" onclick="confirmarCita(${cita.IDCita})">
                                    <i class="fas fa-check me-1"></i>Confirmar
                                </button>
                                <button class="btn btn-warning btn-sm mb-1" onclick="reagendarCita(${cita.IDCita})">
                                    <i class="fas fa-calendar-alt me-1"></i>Reagendar
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="cancelarCita(${cita.IDCita})">
                                    <i class="fas fa-times me-1"></i>Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    container.classList.add('fade-in');
}

// Mostrar pendientes vacío
function mostrarPendientesVacio() {
    const container = document.getElementById('citasPendientes');
    if (container) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-check-circle fa-3x mb-3 text-success"></i>
                <h5>¡Excelente!</h5>
                <p>No hay citas pendientes de confirmación</p>
            </div>
        `;
    }
}

// Actualizar estado de cita
async function actualizarEstadoCita(idCita, nuevoEstado, motivoCancelacion = null) {
    mostrarLoading(true);

    try {
        const data = {
            idCita: idCita,
            nuevoEstado: nuevoEstado,
            motivoCancelacion: motivoCancelacion,
            usuarioModificador: 1
        };

        const response = await fetch('../../backend/controller/citasController.php?accion=actualizarEstado', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (result.estado === 'ok') {
            mostrarMensaje(`Cita ${nuevoEstado.toLowerCase()} exitosamente`, 'success');
            // Refrescar vistas activas
            refrescarVistasActivas();
        } else {
            mostrarMensaje('Error al actualizar el estado de la cita: ' + result.mensaje, 'danger');
        }
    } catch (error) {
        console.error('Error actualizando estado:', error);
        mostrarMensaje('Error de conexión al actualizar estado', 'danger');
    } finally {
        mostrarLoading(false);
    }
}

// Mostrar modal de detalle
function mostrarModalDetalle(cita) {
    const contenido = document.getElementById('contenidoDetalleCita');
    if (!contenido) return;

    const fechaFormateada = formatearFecha(cita.FechaCita);
    const horaFormateada = formatearHora(cita.HoraCita);
    const estadoClass = cita.EstadoCita.toLowerCase().replace(' ', '-');

    contenido.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-primary border-bottom pb-2">Información del Cliente</h6>
                <p><strong>Nombre:</strong> ${cita.NombreCliente}</p>
                <p><strong>Cédula:</strong> ${cita.Cedula}</p>
                <p><strong>Teléfono:</strong> ${cita.Teléfono}</p>
                <p><strong>Email:</strong> ${cita.Email}</p>
                <p><strong>Dirección:</strong> ${cita.Dirección}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-primary border-bottom pb-2">Información de la Mascota</h6>
                <p><strong>Nombre:</strong> ${cita.NombreMascota}</p>
                <p><strong>Especie:</strong> ${cita.Especie}</p>
                <p><strong>Raza:</strong> ${cita.RazaMascota || 'No especificada'}</p>
                <p><strong>Peso:</strong> ${cita.Peso} kg</p>
                <p><strong>Edad:</strong> ${cita.Edad}</p>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-primary border-bottom pb-2">Información de la Cita</h6>
                <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                <p><strong>Hora:</strong> ${horaFormateada}</p>
                <p><strong>Servicio:</strong> ${cita.TipoServicio}</p>
                <p><strong>Estado:</strong> <span class="badge badge-estado estado-${estadoClass}">${cita.EstadoCita}</span></p>
            </div>
            <div class="col-md-6">
                <h6 class="text-primary border-bottom pb-2">Información Adicional</h6>
                <p><strong>Creada el:</strong> ${formatearFechaHora(cita.FechaCreacion)}</p>
                <p><strong>Creada por:</strong> ${cita.CreadoPor || 'Sistema'}</p>
                ${cita.FechaConfirmacion ? `<p><strong>Confirmada el:</strong> ${formatearFechaHora(cita.FechaConfirmacion)}</p>` : ''}
                ${cita.MotivoCancelacion ? `<p><strong>Motivo cancelación:</strong> ${cita.MotivoCancelacion}</p>` : ''}
            </div>
        </div>
        ${cita.Observaciones ? `
            <hr>
            <h6 class="text-primary">Observaciones</h6>
            <p class="bg-light p-3 rounded">${cita.Observaciones}</p>
        ` : ''}
    `;

    const modal = new bootstrap.Modal(document.getElementById('modalDetalleCita'));
    modal.show();
}

// Cargar horarios disponibles en modal
function cargarHorariosDisponiblesModal(horarios) {
    const select = document.getElementById('nuevaHora');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione una hora...</option>';
    select.disabled = false;

    horarios.forEach(horario => {
        if (horario.Disponible) {
            const option = document.createElement('option');
            option.value = horario.Hora;
            option.textContent = formatearHora(horario.Hora);
            select.appendChild(option);
        }
    });

    if (horarios.filter(h => h.Disponible).length === 0) {
        select.innerHTML = '<option value="">No hay horarios disponibles</option>';
        select.disabled = true;
    }
}

// Mostrar modal de confirmación
function mostrarModalConfirmacion(titulo, mensaje, callback) {
    document.getElementById('tituloConfirmar').textContent = titulo;
    document.getElementById('mensajeConfirmar').textContent = mensaje;
    
    const btnConfirmar = document.getElementById('btnConfirmarAccion');
    btnConfirmar.onclick = function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmar'));
        modal.hide();
        callback();
    };
    
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmar'));
    modal.show();
}

// Refrescar vistas activas
function refrescarVistasActivas() {
    const activeTab = document.querySelector('#citasTabs .nav-link.active');
    if (!activeTab) return;

    const target = activeTab.getAttribute('data-bs-target');
    
    switch (target) {
        case '#pendientes':
            cargarCitasPendientes();
            break;
        case '#agenda':
            cargarAgendaDia();
            break;
        case '#consultar':
            // No refrescar automáticamente las consultas
            break;
    }
}

// ========== FUNCIONES DE UTILIDAD ==========

// Formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Formatear hora
function formatearHora(hora) {
    if (!hora) return '';
    return hora.substring(0, 5); // HH:MM
}

// Formatear fecha y hora
function formatearFechaHora(fechaHora) {
    if (!fechaHora) return '';
    const date = new Date(fechaHora);
    return date.toLocaleString('es-ES');
}

// Obtener color de Bootstrap por estado
function getBootstrapColorByState(estado) {
    const colors = {
        'Pendiente': 'warning',
        'Confirmada': 'success',
        'Cancelada': 'danger',
        'Completada': 'info',
        'No Show': 'secondary'
    };
    return colors[estado] || 'primary';
}

// Obtener botones de acción por estado
function getActionButtonsForState(estado, idCita) {
    let buttons = '';
    
    switch (estado) {
        case 'Pendiente':
            buttons = `
                <button class="btn btn-outline-success btn-sm" onclick="confirmarCita(${idCita})" title="Confirmar">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-outline-warning btn-sm" onclick="reagendarCita(${idCita})" title="Reagendar">
                    <i class="fas fa-calendar-alt"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="cancelarCita(${idCita})" title="Cancelar">
                    <i class="fas fa-times"></i>
                </button>
            `;
            break;
        case 'Confirmada':
            buttons = `
                <button class="btn btn-outline-info btn-sm" onclick="completarCita(${idCita})" title="Completar">
                    <i class="fas fa-check-double"></i>
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="marcarNoShow(${idCita})" title="No Show">
                    <i class="fas fa-user-times"></i>
                </button>
            `;
            break;
    }
    
    return buttons;
}

// ========== INICIALIZACIÓN ==========

document.addEventListener("DOMContentLoaded", () => {
    console.log('🚀 Iniciando sistema de citas...');
    
    // Inicialización
    cargarServicios();
    configurarFechaMinima();
    cargarCitasPendientes();
    configurarEventos();

    // Inicializar carga de agenda del día actual después de un momento
    setTimeout(() => {
        cargarAgendaHoy();
    }, 1000);
    
    console.log('✅ Sistema de citas inicializado');
});