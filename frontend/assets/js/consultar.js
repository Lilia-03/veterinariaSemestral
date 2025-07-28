document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formConsultar');
    const cedulaInput = document.getElementById('cedula');
    const idMascotaInput = document.getElementById('idMascota');
    const messageDiv = document.getElementById('message');
    const resultContainer = document.getElementById('resultContainer');
    const cardResults = document.getElementById('cardResults');

    // 🔧 CONFIGURACIÓN - Ajusta según tu estructura
    const BASE_URL = '../../../backend/controller/controller.php';

    function mostrarMensaje(mensaje, tipo = 'danger') {
        messageDiv.textContent = mensaje;
        messageDiv.className = `alert alert-${tipo} mt-3`;
        messageDiv.style.display = 'block';

        if (tipo === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    function limpiarResultados() {
        if (cardResults) cardResults.innerHTML = '';
        if (resultContainer) resultContainer.style.display = 'none';
        if (messageDiv) messageDiv.style.display = 'none';
    }

    function mostrarResultados(data) {
        limpiarResultados();

        if (data.estado === 'ok') {
            let html = '';

            // Información del cliente mejorada
            if (data.cliente) {
                html += `
                    <div class="resultado-cliente mb-4">
                        <div class="card shadow-sm border-0">
                            <div class="card-header bg-gradient-primary text-white">
                                <div class="d-flex align-items-center">
                                    <div class="icon-container me-3">
                                        <i class="fas fa-user-circle fa-2x"></i>
                                    </div>
                                    <div>
                                        <h5 class="mb-0">Información del Cliente</h5>
                                        <small class="opacity-75">Datos del propietario</small>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <i class="fas fa-id-card text-primary me-2"></i>
                                            <strong>Cédula:</strong>
                                            <span class="info-value">${data.cliente.CedulaCliente}</span>
                                        </div>
                                        <div class="info-item">
                                            <i class="fas fa-user text-primary me-2"></i>
                                            <strong>Nombre:</strong>
                                            <span class="info-value">${data.cliente.NombreCliente}</span>
                                        </div>
                                        <div class="info-item">
                                            <i class="fas fa-phone text-primary me-2"></i>
                                            <strong>Teléfono:</strong>
                                            <span class="info-value">${data.cliente.Teléfono || 'No disponible'}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <i class="fas fa-envelope text-primary me-2"></i>
                                            <strong>Email:</strong>
                                            <span class="info-value">${data.cliente.Email || 'No disponible'}</span>
                                        </div>
                                        <div class="info-item">
                                            <i class="fas fa-map-marker-alt text-primary me-2"></i>
                                            <strong>Dirección:</strong>
                                            <span class="info-value">${data.cliente.Dirección || 'No disponible'}</span>
                                        </div>
                                        <div class="info-item">
                                            <i class="fas fa-paw text-primary me-2"></i>
                                            <strong>Total de Mascotas:</strong>
                                            <span class="badge bg-success ms-2">${data.totalMascotas}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Información de mascotas mejorada
            if (data.mascotas && data.mascotas.length > 0) {
                html += `
                    <div class="mascotas-section">
                        <div class="section-title mb-4">
                            <h4 class="d-flex align-items-center">
                                <i class="fas fa-paw text-orange me-2"></i>
                                Mascotas Registradas
                                <span class="badge bg-orange ms-2">${data.mascotas.length}</span>
                            </h4>
                        </div>
                `;

                data.mascotas.forEach((mascota, index) => {
                    const fechaRegistro = mascota.FechaRegistro ?
                        new Date(mascota.FechaRegistro).toLocaleDateString('es-ES') :
                        'No disponible';

                    html += `
                        <div class="mascota-card mb-4">
                            <div class="card shadow-sm border-0">
                                <div class="card-body">
                                    <div class="row g-4">
                                        <!-- Foto de la mascota -->
                                        <div class="col-lg-3 col-md-4">
                                            <div class="mascota-foto-container">
                                                ${mascota.FotoBase64 ?
                            `<div class="foto-mascota" onclick="ampliarImagen(this.querySelector('img'), '${mascota.NombreMascota}')">
                                                    <img src="data:image/jpeg;base64,${mascota.FotoBase64}" 
                                                         alt="Foto de ${mascota.NombreMascota}" 
                                                         class="mascota-imagen">
                                                    <div class="foto-overlay">
                                                        <i class="fas fa-search-plus"></i>
                                                    </div>
                                                </div>` :
                            `<div class="no-image-placeholder">
                                                    <i class="fas fa-paw fa-3x text-muted"></i>
                                                    <p class="text-muted mt-2 mb-0">Sin foto</p>
                                                </div>`
                        }
                                                <div class="mascota-nombre">
                                                    <h5 class="text-center mt-2 mb-0">${mascota.NombreMascota}</h5>
                                                    <p class="text-center text-muted small mb-0">ID: ${mascota.IDMascota}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Información de la mascota -->
                                        <div class="col-lg-9 col-md-8">
                                            <div class="mascota-info">
                                                <!-- Datos básicos -->
                                                <div class="info-section mb-4">
                                                    <h6 class="section-header">
                                                        <i class="fas fa-paw text-orange me-2"></i>
                                                        Datos de la Mascota
                                                    </h6>
                                                    <div class="row g-3">
                                                        <div class="col-md-6">
                                                            <div class="info-item-modern">
                                                                <span class="info-label">Especie</span>
                                                                <span class="info-value-modern">${mascota.Especie}</span>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="info-item-modern">
                                                                <span class="info-label">Raza</span>
                                                                <span class="info-value-modern">${mascota.RazaMascota || 'No especificada'}</span>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="info-item-modern">
                                                                <span class="info-label">Género</span>
                                                                <span class="info-value-modern">${mascota.Genero}</span>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="info-item-modern">
                                                                <span class="info-label">Peso</span>
                                                                <span class="info-value-modern">${mascota.Peso} kg</span>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="info-item-modern">
                                                                <span class="info-label">Edad</span>
                                                                <span class="info-value-modern">${mascota.Edad} años</span>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="info-item-modern">
                                                                <span class="info-label">Fecha de Registro</span>
                                                                <span class="info-value-modern">${fechaRegistro}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                ${data.cliente ? `
                                                <!-- Datos del dueño -->
                                                <div class="info-section mb-4">
                                                    <h6 class="section-header">
                                                        <i class="fas fa-user text-success me-2"></i>
                                                        Datos del Propietario
                                                    </h6>
                                                    <div class="row g-3">
                                                        <div class="col-md-6">
                                                            <div class="info-item-modern">
                                                                <span class="info-label">Nombre</span>
                                                                <span class="info-value-modern">${data.cliente.NombreCliente}</span>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="info-item-modern">
                                                                <span class="info-label">Cédula</span>
                                                                <span class="info-value-modern">${data.cliente.CedulaCliente}</span>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="info-item-modern">
                                                                <span class="info-label">Teléfono</span>
                                                                <span class="info-value-modern">${data.cliente.Teléfono || 'No disponible'}</span>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="info-item-modern">
                                                                <span class="info-label">Email</span>
                                                                <span class="info-value-modern">${data.cliente.Email || 'No disponible'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                ` : ''}

                                                <!-- Condiciones médicas -->
                                                <div class="info-section">
                                                    <h6 class="section-header">
                                                        <i class="fas fa-heartbeat text-danger me-2"></i>
                                                        Condiciones Médicas
                                                    </h6>
                                                    <div class="condiciones-container">
                                                        ${mascota.CondicionesMedicas &&
                            mascota.CondicionesMedicas !== 'Sin condiciones médicas' &&
                            mascota.CondicionesMedicas.trim() !== '' ?
                            mascota.CondicionesMedicas.split(', ').map(condicion =>
                                `<span class="badge-condicion badge-warning">${condicion.trim()}</span>`
                            ).join('') :
                            '<span class="badge-condicion badge-success">Sin condiciones médicas</span>'
                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += '</div>';
            } else {
                html += `
                    <div class="alert alert-info border-0 shadow-sm">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-info-circle fa-2x text-info me-3"></i>
                            <div>
                                <h6 class="mb-1">Sin mascotas registradas</h6>
                                <p class="mb-0">${data.mensaje || 'Este cliente no tiene mascotas registradas.'}</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            cardResults.innerHTML = html;
            resultContainer.style.display = 'block';

            setTimeout(() => {
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            cardResults.innerHTML = `
                <div class="alert alert-danger border-0 shadow-sm">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-exclamation-triangle fa-2x text-danger me-3"></i>
                        <div>
                            <h6 class="mb-1">Error en la consulta</h6>
                            <p class="mb-0">${data.mensaje || 'Error desconocido'}</p>
                        </div>
                    </div>
                </div>
            `;
            resultContainer.style.display = 'block';
        }
    }

    async function realizarConsulta() {
        const cedula = cedulaInput.value.trim();
        const idMascota = idMascotaInput.value.trim();

        limpiarResultados();

        if (!cedula && !idMascota) {
            mostrarMensaje('Debe proporcionar al menos una cédula o un ID de mascota.', 'danger');
            return;
        }

        if (idMascota && (isNaN(idMascota) || parseInt(idMascota) < 10000)) {
            mostrarMensaje('El ID de mascota debe ser un número mayor o igual a 10000.', 'danger');
            document.getElementById('idMascotaError').style.display = 'block';
            return;
        } else {
            const errorDiv = document.getElementById('idMascotaError');
            if (errorDiv) errorDiv.style.display = 'none';
        }

        try {
            // Mostrar indicador de carga mejorado
            cardResults.innerHTML = `
                <div class="loading-container">
                    <div class="loading-content">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <h5 class="text-primary">Buscando información...</h5>
                        <p class="text-muted">Por favor espere mientras consultamos la base de datos</p>
                    </div>
                </div>
            `;
            resultContainer.style.display = 'block';

            // Construir URL
            let url = `${BASE_URL}?accion=consultarMascota`;
            if (cedula) url += `&cedula=${encodeURIComponent(cedula)}`;
            if (idMascota) url += `&id=${encodeURIComponent(idMascota)}`;

            console.log('🔍 Consultando URL:', url);

            const response = await fetch(url);

            console.log('📡 Estado de respuesta:', response.status);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('📄 Respuesta cruda:', responseText.substring(0, 200) + '...');

            // Verificar si la respuesta es HTML en lugar de JSON
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                throw new Error('El servidor devolvió una página HTML en lugar de JSON. Verifique la ruta del controller.');
            }

            let data;
            try {
                data = JSON.parse(responseText);
                console.log('📋 Datos parseados:', data);
            } catch (parseError) {
                console.error('❌ Error al parsear JSON:', parseError);
                console.error('📄 Contenido que causó el error:', responseText);
                throw new Error('La respuesta del servidor no es un JSON válido');
            }

            mostrarResultados(data);

        } catch (error) {
            console.error('❌ Error en consulta:', error);

            let mensajeError = 'Error de conexión. Inténtelo nuevamente.';

            if (error.message.includes('JSON') || error.message.includes('parsear')) {
                mensajeError = 'Error al procesar la respuesta del servidor. Verifique la configuración.';
            } else if (error.message.includes('HTML')) {
                mensajeError = 'Error en la configuración del servidor. La URL puede estar incorrecta.';
            } else if (error.message.includes('404')) {
                mensajeError = 'No se encontró el archivo controller.php. Verifique la ruta.';
            } else if (error.message.includes('500')) {
                mensajeError = 'Error interno del servidor. Verifique los logs del servidor.';
            }

            cardResults.innerHTML = `
                <div class="alert alert-danger border-0 shadow-sm">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-exclamation-triangle fa-2x text-danger me-3"></i>
                        <div>
                            <h6 class="mb-1">Error de conexión</h6>
                            <p class="mb-1">${mensajeError}</p>
                            <small class="text-muted">Detalles técnicos: ${error.message}</small>
                        </div>
                    </div>
                </div>
            `;
            resultContainer.style.display = 'block';
        }
    }

    // 🖼️ Función para ampliar imágenes mejorada
    function ampliarImagen(img, nombreMascota) {
        const modal = document.createElement('div');
        modal.className = 'modal-imagen';
        modal.innerHTML = `
            <div class="modal-imagen-overlay">
                <div class="modal-imagen-content">
                    <div class="modal-imagen-header">
                        <h4>Foto de ${nombreMascota}</h4>
                        <button class="btn-cerrar-modal" onclick="this.closest('.modal-imagen').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-imagen-body">
                        <img src="${img.src}" alt="Foto de ${nombreMascota}" class="imagen-ampliada">
                    </div>
                    <div class="modal-imagen-footer">
                        <button class="btn btn-light" onclick="this.closest('.modal-imagen').remove()">
                            <i class="fas fa-times me-2"></i>Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.onclick = (e) => {
            if (e.target.classList.contains('modal-imagen-overlay')) {
                modal.remove();
            }
        };

        document.body.appendChild(modal);
    }

    // Event listeners para validación de campos
    if (idMascotaInput) {
        idMascotaInput.addEventListener('input', function () {
            const valor = this.value.trim();
            const errorDiv = document.getElementById('idMascotaError');

            if (valor && (isNaN(valor) || parseInt(valor) < 10000)) {
                if (errorDiv) errorDiv.style.display = 'block';
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
            } else {
                if (errorDiv) errorDiv.style.display = 'none';
                if (valor) {
                    this.classList.add('is-valid');
                    this.classList.remove('is-invalid');
                } else {
                    this.classList.remove('is-valid', 'is-invalid');
                }
            }
        });
    }

    if (cedulaInput) {
        cedulaInput.addEventListener('input', function () {
            const valor = this.value.trim();

            if (valor.length > 3) {
                // Regex mejorado para cédulas panameñas
                const regexCedula = /^([1-9]-\d{1,4}-\d{1,6}|10-\d{1,4}-\d{1,6}|E-\d{6,}|[A-Z][0-9].*)$/;

                if (regexCedula.test(valor)) {
                    this.classList.add('is-valid');
                    this.classList.remove('is-invalid');
                } else {
                    this.classList.add('is-invalid');
                    this.classList.remove('is-valid');
                }
            } else {
                this.classList.remove('is-valid', 'is-invalid');
            }
        });

        // Auto-formateo de cédula (opcional)
        cedulaInput.addEventListener('blur', function () {
            let valor = this.value.trim().replace(/[^\d-]/g, '');

            // Formateo básico para cédulas panameñas
            if (valor.length >= 2 && !valor.includes('-')) {
                if (valor.length <= 8) {
                    valor = valor.substring(0, 1) + '-' + valor.substring(1, 4) + '-' + valor.substring(4);
                }
            }

            this.value = valor;
        });
    }

    function limpiarFormulario() {
        if (form) {
            form.reset();
            form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid');
            });
        }
        limpiarResultados();
        const errorDiv = document.getElementById('idMascotaError');
        if (errorDiv) errorDiv.style.display = 'none';
    }

    // Event listeners principales
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            realizarConsulta();
        });
    }

    const btnLimpiar = document.getElementById('btnLimpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }

    // Limpiar al cargar la página
    limpiarResultados();

    // Hacer funciones disponibles globalmente
    window.ampliarImagen = ampliarImagen;
    window.realizarConsulta = realizarConsulta;

    console.log('🚀 consultar.js cargado correctamente');
});