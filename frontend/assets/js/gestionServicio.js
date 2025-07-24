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
    
    // Modal
    const confirmModal = document.getElementById('confirmModal');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    const closeModal = document.querySelector('.close');

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

    // Event listeners para modal
    closeModal.addEventListener('click', cerrarModalConfirmacion);
    modalCancel.addEventListener('click', cerrarModalConfirmacion);
    modalConfirm.addEventListener('click', confirmarEliminacion);

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            cerrarModalConfirmacion();
        }
    });

    // Inicializar validación de código en tiempo real
    inicializarValidacionCodigo();

    // Funciones principales
    function cargarServicios() {
    mostrarCarga(true);
    
    fetch('../ServiciosController.php', {
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
    }

    function ocultarInfoServicioEliminar() {
        deleteServiceInfo.style.display = 'none';
        deleteServiceSelect.value = '';
        deleteServiceId = null;
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

        const formData = new FormData();
        formData.append('action', 'agregarServicio');
        formData.append('codigo', codigo);
        formData.append('nombre', nombre);
        formData.append('precio', precio);

        mostrarCarga(true);

        fetch('../ServiciosController.php', {
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
            console.log('Respuesta agregar servicio:', text);
            
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
                mostrarAlerta('Servicio agregado correctamente', 'success');
                limpiarFormularioAgregar();
                cargarServicios(); // Recargar lista de servicios
                // Cambiar a la pestaña de lista de servicios
                openTab({currentTarget: document.querySelector('[onclick*="listTab"]')}, 'listTab');
            } else {
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
            console.error('Error:', error);
            mostrarAlerta('Error: ' + error.message, 'error');
        });
    }

    function limpiarFormularioAgregar() {
        addServiceForm.reset();
        // Restablecer estilo del input de código
        const codigoInput = document.getElementById('newServiceCode');
        if (codigoInput) {
            codigoInput.style.borderColor = '#e1e5e9';
        }
    }

    function mostrarModalConfirmacion() {
        if (!deleteServiceId) return;

        const servicio = serviciosData.find(s => s.IDITEM === deleteServiceId);
        if (!servicio) return;

        document.getElementById('modalTitle').textContent = 'Confirmar Eliminación';
        document.getElementById('modalMessage').textContent = 
            `¿Está seguro de que desea eliminar el servicio "${servicio.NombreServicio}"? Esta acción no se puede deshacer.`;
        
        confirmModal.style.display = 'block';
    }

    function cerrarModalConfirmacion() {
        confirmModal.style.display = 'none';
    }

    function confirmarEliminacion() {
        if (!deleteServiceId) return;

        mostrarCarga(true);
        cerrarModalConfirmacion();

        const formData = new FormData();
        formData.append('action', 'eliminarServicio');
        formData.append('idServicio', deleteServiceId);

        fetch('../ServiciosController.php', {
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
                // Cambiar a la pestaña de lista de servicios
                openTab({currentTarget: document.querySelector('[onclick*="listTab"]')}, 'listTab');
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
                    <button class="btn btn-danger btn-sm" onclick="eliminarServicioDirecto('${servicio.IDITEM}')">
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
                    <button class="btn btn-danger btn-sm" onclick="eliminarServicioDirecto('${servicio.IDITEM}')">
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

    // Función para cambiar de pestaña (debe estar en el scope global)
    window.openTab = function(evt, tabName) {
        const tabContents = document.getElementsByClassName('tab-content');
        const tabs = document.getElementsByClassName('tab');

        for (let i = 0; i < tabContents.length; i++) {
            tabContents[i].classList.remove('active');
        }

        for (let i = 0; i < tabs.length; i++) {
            tabs[i].classList.remove('active');
        }

        document.getElementById(tabName).classList.add('active');
        evt.currentTarget.classList.add('active');

        // Recargar datos específicos según la pestaña
        if (tabName === 'listTab') {
            cargarTablaServicios();
        }
    };

    function exportarExcel() {
        exportBtn.disabled = true;
        exportBtn.textContent = '⏳ Generando...';

        try {
            const timestamp = new Date().getTime();
            const url = `../ServiciosController.php?action=exportarExcel&t=${timestamp}`;
            
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
            
            // Restablecer estilo por defecto
            this.style.borderColor = '#e1e5e9';
            
            if (codigo.length >= 3) {
                timeoutId = setTimeout(() => {
                    verificarCodigo(codigo);
                }, 500); // Esperar 500ms después de que deje de escribir
            }
        });
    }

    // Verificar si existe el código
    function verificarCodigo(codigo) {
        const formData = new FormData();
        formData.append('action', 'validarCodigoServicio');
        formData.append('codigo', codigo);

        fetch('../ServiciosController.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const codigoInput = document.getElementById('newServiceCode');
            
            if (data.success && data.existe) {
                codigoInput.style.borderColor = '#dc3545';
                codigoInput.style.borderWidth = '2px';
                mostrarAlerta('⚠️ Este código ya existe, elija otro', 'warning');
            } else if (data.success && !data.existe) {
                codigoInput.style.borderColor = '#28a745';
                codigoInput.style.borderWidth = '2px';
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

        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo === 'error' ? 'error' : tipo === 'warning' ? 'warning' : 'success'}`;
        alert.textContent = mensaje;
        alert.style.display = 'block';
        
        alertContainer.appendChild(alert);

        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.opacity = '0';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }, 300);
            }
        }, 5000);
    }
});
