document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const deleteServiceSelect = document.getElementById('deleteServiceSelect');
    const deleteServiceInfo = document.getElementById('deleteServiceInfo');
    const loading = document.getElementById('loading');
    const alertContainer = document.getElementById('alertContainer');
    
    // Elementos para agregar servicio
    const addServiceForm = document.getElementById('addServiceForm');
    const clearAddFormBtn = document.getElementById('clearAddForm');
    
    // Elementos para eliminar servicio
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    
    // Elementos para lista de servicios
    const refreshListBtn = document.getElementById('refreshListBtn');
    const searchInput = document.getElementById('searchInput');
    const servicesTableBody = document.getElementById('servicesTableBody');
    const exportBtn = document.getElementById('exportBtn');
    
    // Modal - actualizado para Bootstrap
    const confirmModal = document.getElementById('confirmModal');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');

    // Variables globales
    let deleteServiceId = null;
    let serviciosData = [];

    // Inicialización
    cargarServicios();

    // Event listeners para agregar servicio
    addServiceForm.addEventListener('submit', agregarServicio);
    clearAddFormBtn.addEventListener('click', limpiarFormularioAgregar);

    // Event listeners para eliminar servicio
    deleteServiceSelect.addEventListener('change', mostrarInfoServicioEliminar);
    confirmDeleteBtn.addEventListener('click', mostrarModalConfirmacion);
    cancelDeleteBtn.addEventListener('click', ocultarInfoServicioEliminar);

    // Event listeners para lista de servicios
    refreshListBtn.addEventListener('click', cargarTablaServicios);
    searchInput.addEventListener('input', filtrarServicios);
    exportBtn.addEventListener('click', exportarExcel);

    // Event listeners para modal - actualizado para Bootstrap
    modalConfirm.addEventListener('click', confirmarEliminacion);

    // Inicializar validación de código en tiempo real
    inicializarValidacionCodigo();

    // Funciones principales
    function cargarServicios() {
        mostrarCarga(true);
        
        fetch('../../backend/controller/ServiciosController.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=obtenerServicios'
        })
        .then(response => {
            console.log('Status:', response.status);
            console.log('Content-Type:', response.headers.get('content-type'));
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            console.log('=== RESPUESTA COMPLETA DEL SERVIDOR ===');
            console.log('Longitud:', text.length);
            console.log('Primeros 500 caracteres:', text.substring(0, 500));
            console.log('Últimos 100 caracteres:', text.substring(text.length - 100));
            console.log('=====================================');
            
            // Buscar dónde empieza el JSON
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}');
            
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonPart = text.substring(jsonStart, jsonEnd + 1);
                console.log('JSON extraído:', jsonPart);
                
                try {
                    const data = JSON.parse(jsonPart);
                    console.log('JSON parseado exitosamente:', data);
                    
                    mostrarCarga(false);
                    
                    if (data.success) {
                        serviciosData = data.data;
                        llenarSelectServicios(data.data);
                        cargarTablaServicios();
                    } else {
                        mostrarAlerta('Error al cargar servicios: ' + data.message, 'error');
                    }
                } catch (e) {
                    console.error('Error parsing JSON extraído:', e);
                    mostrarAlerta('Error: Respuesta JSON inválida', 'error');
                }
            } else {
                console.error('No se encontró JSON válido en la respuesta');
                mostrarAlerta('Error: No se encontró respuesta JSON válida', 'error');
            }
            
            mostrarCarga(false);
        })
        .catch(error => {
            mostrarCarga(false);
            console.error('Error completo:', error);
            mostrarAlerta('Error de conexión: ' + error.message, 'error');
        });
    }

    function llenarSelectServicios(servicios) {
        deleteServiceSelect.innerHTML = '<option value="">-- Seleccione un servicio --</option>';
        
        servicios.forEach(servicio => {
            const option = document.createElement('option');
            option.value = servicio.IDITEM;
            option.textContent = `${servicio.NombreServicio} - $${parseFloat(servicio.PrecioITEM || 0).toFixed(2)}`;
            option.dataset.servicio = JSON.stringify(servicio);
            deleteServiceSelect.appendChild(option);
        });
    }

    function mostrarInfoServicioEliminar() {
        const selectedOption = deleteServiceSelect.options[deleteServiceSelect.selectedIndex];
        
        if (selectedOption.value === '') {
            ocultarInfoServicioEliminar();
            return;
        }

        const servicio = JSON.parse(selectedOption.dataset.servicio);
        deleteServiceId = servicio.IDITEM;
        
        document.getElementById('deleteServiceCode').textContent = servicio.IDITEM;
        document.getElementById('deleteServiceName').textContent = servicio.NombreServicio;
        document.getElementById('deleteServicePrice').textContent = `$${parseFloat(servicio.PrecioITEM || 0).toFixed(2)}`;

        deleteServiceInfo.style.display = 'block';
        deleteServiceInfo.classList.add('fade-in');
    }

    function ocultarInfoServicioEliminar() {
        deleteServiceInfo.style.display = 'none';
        deleteServiceSelect.value = '';
        deleteServiceId = null;
        deleteServiceInfo.classList.remove('fade-in');
    }

    function agregarServicio(e) {
    e.preventDefault();

    // Validar que todos los elementos existan antes de acceder a sus valores
    const codigoElement = document.getElementById('newServiceCode');
    const nombreElement = document.getElementById('newServiceName');
    const precioElement = document.getElementById('newServicePrice');

    // Verificar que todos los elementos existen
    if (!codigoElement || !nombreElement || !precioElement) {
        mostrarAlerta('Error: No se encontraron todos los campos del formulario', 'error');
        return;
    }

    // Obtener los valores de forma segura
    const codigo = codigoElement.value.trim();
    const nombre = nombreElement.value.trim();
    const precio = precioElement.value;

    // DEBUGGING: Mostrar los datos que se van a enviar
    console.log('=== DATOS A ENVIAR ===');
    console.log('Código:', codigo, '(tipo:', typeof codigo, ', longitud:', codigo.length, ')');
    console.log('Nombre:', nombre, '(tipo:', typeof nombre, ', longitud:', nombre.length, ')');
    console.log('Precio:', precio, '(tipo:', typeof precio, ')');
    console.log('====================');

    // Validaciones básicas en el frontend
    if (!codigo || !nombre || !precio) {
        mostrarAlerta('Complete todos los campos obligatorios', 'error');
        return;
    }

    // Validar formato del código
    if (codigo.length < 3) {
        mostrarAlerta('El código debe tener al menos 3 caracteres', 'error');
        return;
    }

    // Validar que el precio sea un número válido
    const precioNumero = parseFloat(precio);
    if (isNaN(precioNumero) || precioNumero <= 0) {
        mostrarAlerta('El precio debe ser un número válido mayor a 0', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'agregarServicio');
    formData.append('codigo', codigo);
    formData.append('nombre', nombre);
    formData.append('precio', precio);

    // DEBUGGING: Mostrar FormData
    console.log('=== FORMDATA ENVIADA ===');
    for (let [key, value] of formData.entries()) {
        console.log(key + ':', value);
    }
    console.log('========================');

    mostrarCarga(true);

    fetch('../../backend/controller/ServiciosController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('=== RESPONSE INFO ===');
        console.log('Status:', response.status);
        console.log('StatusText:', response.statusText);
        console.log('Headers:', response.headers);
        console.log('====================');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        return response.text();
    })
    .then(text => {
        console.log('=== RESPUESTA COMPLETA DEL SERVIDOR ===');
        console.log('Respuesta agregar servicio:', text);
        console.log('Longitud de respuesta:', text.length);
        console.log('======================================');
        
        let data;
        try {
            data = JSON.parse(text);
            console.log('JSON parseado exitosamente:', data);
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.error('Respuesta recibida:', text);
            throw new Error('Respuesta inválida del servidor');
        }
        
        mostrarCarga(false);

        if (data.success) {
            mostrarAlerta('Servicio agregado correctamente', 'success');
            limpiarFormularioAgregar();
            cargarServicios(); // Recargar lista de servicios
            // Cambiar a la pestaña de lista de servicios usando Bootstrap
            mostrarPestana('listTab');
        } else {
            // DEBUGGING: Mostrar mensaje de error detallado
            console.error('=== ERROR DEL SERVIDOR ===');
            console.error('Message:', data.message);
            console.error('Data completa:', data);
            console.error('========================');
            
            // Mensajes más específicos
            let mensajeError = data.message || 'Error desconocido';
            if (mensajeError.includes('Ya existe un servicio')) {
                mensajeError = '⚠️ Ya existe un servicio con ese código. Intente con otro código.';
            }
            mostrarAlerta('Error: ' + mensajeError, 'error');
        }
    })
    .catch(error => {
        mostrarCarga(false);
        console.error('=== ERROR COMPLETO ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('==================');
        mostrarAlerta('Error: ' + error.message, 'error');
    });
}

    function limpiarFormularioAgregar() {
        addServiceForm.reset();
        // Restablecer estilo del input de código
        const codigoInput = document.getElementById('newServiceCode');
        if (codigoInput) {
            codigoInput.classList.remove('is-valid', 'is-invalid');
        }
    }

    function mostrarModalConfirmacion() {
        if (!deleteServiceId) return;

        const servicio = serviciosData.find(s => s.IDITEM === deleteServiceId);
        if (!servicio) return;

        document.getElementById('modalTitle').textContent = 'Confirmar Eliminación';
        document.getElementById('modalMessage').textContent = 
            `¿Está seguro de que desea eliminar el servicio "${servicio.NombreServicio}"? Esta acción no se puede deshacer.`;
        
        // Usar Bootstrap modal
        const modal = new bootstrap.Modal(confirmModal, {
            backdrop: true,
            keyboard: true
        });
        modal.show();
    }

    function cerrarModalConfirmacion() {
        const modal = bootstrap.Modal.getInstance(confirmModal);
        if (modal) {
            modal.hide();
        }
    }

    function confirmarEliminacion() {
        if (!deleteServiceId) return;

        mostrarCarga(true);
        cerrarModalConfirmacion();

        const formData = new FormData();
        formData.append('action', 'eliminarServicio');
        formData.append('idServicio', deleteServiceId);

        fetch('../../backend/controller/ServiciosController.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            console.log('Respuesta eliminar servicio:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Error parsing JSON:', e);
                console.error('Respuesta recibida:', text);
                throw new Error('Respuesta inválida del servidor');
            }
            
            mostrarCarga(false);

            if (data.success) {
                mostrarAlerta('Servicio eliminado correctamente', 'success');
                ocultarInfoServicioEliminar();
                cargarServicios(); // Recargar lista de servicios
                // Cambiar a la pestaña de lista de servicios usando Bootstrap
                mostrarPestana('listTab');
            } else {
                // Mensajes más específicos
                let mensajeError = data.message || 'Error desconocido';
                if (mensajeError.includes('registros asociados')) {
                    mensajeError = '⚠️ No se puede eliminar el servicio porque tiene registros asociados';
                } else if (mensajeError.includes('no existe')) {
                    mensajeError = '⚠️ El servicio no existe en la base de datos';
                }
                mostrarAlerta('Error: ' + mensajeError, 'error');
            }
        })
        .catch(error => {
            mostrarCarga(false);
            console.error('Error:', error);
            
            let mensajeError = error.message;
            if (mensajeError.includes('registros asociados')) {
                mensajeError = 'No se puede eliminar el servicio porque tiene registros asociados';
            } else if (mensajeError.includes('servicio no existe')) {
                mensajeError = 'El servicio no existe en la base de datos';
            }
            
            mostrarAlerta('Error: ' + mensajeError, 'error');
        });
    }

    function cargarTablaServicios() {
        if (!serviciosData || serviciosData.length === 0) {
            cargarServicios();
            return;
        }

        const tbody = servicesTableBody;
        tbody.innerHTML = '';

        serviciosData.forEach(servicio => {
            const row = tbody.insertRow();
            const precio = parseFloat(servicio.PrecioITEM || 0);

            row.innerHTML = `
                <td>${servicio.IDITEM}</td>
                <td>${servicio.NombreServicio}</td>
                <td>$${precio.toFixed(2)}</td>
                <td>
                    <button class="btn btn-gradient-danger btn-sm" onclick="eliminarServicioDirecto('${servicio.IDITEM}')">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
        });
    }

    function filtrarServicios() {
        const termino = searchInput.value.toLowerCase();
        
        if (!termino) {
            cargarTablaServicios();
            return;
        }

        const serviciosFiltrados = serviciosData.filter(servicio => 
            servicio.NombreServicio.toLowerCase().includes(termino) ||
            servicio.IDITEM.toString().toLowerCase().includes(termino)
        );

        const tbody = servicesTableBody;
        tbody.innerHTML = '';

        serviciosFiltrados.forEach(servicio => {
            const row = tbody.insertRow();
            const precio = parseFloat(servicio.PrecioITEM || 0);

            row.innerHTML = `
                <td>${servicio.IDITEM}</td>
                <td>${servicio.NombreServicio}</td>
                <td>$${precio.toFixed(2)}</td>
                <td>
                    <button class="btn btn-gradient-danger btn-sm" onclick="eliminarServicioDirecto('${servicio.IDITEM}')">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
        });
    }

    // Función global para eliminar servicio directamente desde la tabla
    window.eliminarServicioDirecto = function(idServicio) {
        deleteServiceId = idServicio;
        mostrarModalConfirmacion();
    };

    // Función para cambiar de pestaña usando Bootstrap
    function mostrarPestana(tabName) {
        const tabButton = document.querySelector(`[data-bs-target="#${tabName}"]`);
        if (tabButton) {
            const tab = new bootstrap.Tab(tabButton);
            tab.show();
            
            // Recargar datos específicos según la pestaña
            if (tabName === 'listTab') {
                cargarTablaServicios();
            }
        }
    }

    // Función global para compatibilidad con versión anterior
    window.openTab = function(evt, tabName) {
        mostrarPestana(tabName);
    };

    function exportarExcel() {
        exportBtn.disabled = true;
        exportBtn.textContent = '⏳ Generando...';

        try {
            const timestamp = new Date().getTime();
            const url = `../../backend/controller/ServiciosController.php?action=exportarExcel&t=${timestamp}`;
            
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.position = 'absolute';
            iframe.style.top = '-9999px';
            iframe.style.left = '-9999px';
            iframe.src = url;
            
            document.body.appendChild(iframe);
            
            iframe.onload = function() {
                setTimeout(() => {
                    try {
                        document.body.removeChild(iframe);
                    } catch (e) {
                        console.log('Iframe ya removido');
                    }
                }, 5000);
            };
            
            iframe.onerror = function() {
                exportBtn.disabled = false;
                exportBtn.textContent = '📄 Descargar Excel';
                mostrarAlerta('Error al descargar el archivo', 'error');
                try {
                    document.body.removeChild(iframe);
                } catch (e) {
                    console.log('Error removiendo iframe');
                }
            };
            
            setTimeout(() => {
                exportBtn.disabled = false;
                exportBtn.textContent = '📄 Descargar Excel';
                mostrarAlerta('Descarga iniciada exitosamente', 'success');
            }, 2000);
            
        } catch (error) {
            exportBtn.disabled = false;
            exportBtn.textContent = '📄 Descargar Excel';
            console.error('Error en exportarExcel:', error);
            mostrarAlerta('Error al iniciar descarga: ' + error.message, 'error');
        }
    }

    // Validación de código en tiempo real
    function inicializarValidacionCodigo() {
        const codigoInput = document.getElementById('newServiceCode');
        
        if (!codigoInput) {
            console.warn('Campo newServiceCode no encontrado');
            return;
        }
        
        let timeoutId;
        
        codigoInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            const codigo = this.value.trim();
            
            // Restablecer estilos
            this.classList.remove('is-valid', 'is-invalid');
            
            if (codigo.length >= 3) {
                timeoutId = setTimeout(() => {
                    verificarCodigo(codigo);
                }, 500);
            }
        });
    }

    // Verificar si existe el código
    function verificarCodigo(codigo) {
        const formData = new FormData();
        formData.append('action', 'validarCodigoServicio');
        formData.append('codigo', codigo);

        fetch('../../backend/controller/ServiciosController.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const codigoInput = document.getElementById('newServiceCode');
            
            if (data.success && data.existe) {
                codigoInput.classList.remove('is-valid');
                codigoInput.classList.add('is-invalid');
                mostrarAlerta('⚠️ Este código ya existe, elija otro', 'warning');
            } else if (data.success && !data.existe) {
                codigoInput.classList.remove('is-invalid');
                codigoInput.classList.add('is-valid');
            }
        })
        .catch(error => {
            console.error('Error validando código:', error);
        });
    }

    function mostrarCarga(mostrar) {
        loading.style.display = mostrar ? 'block' : 'none';
    }

    function mostrarAlerta(mensaje, tipo) {
        alertContainer.innerHTML = '';
        
        const alertClass = tipo === 'error' ? 'danger' : (tipo === 'warning' ? 'warning' : 'success');
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${alertClass} alert-dismissible fade show fade-in`;
        alert.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                const alertInstance = bootstrap.Alert.getOrCreateInstance(alert);
                alertInstance.close();
            }
        }, 5000);
    }
});
