document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formConsultar');
    const cedulaInput = document.getElementById('cedula');
    const idMascotaInput = document.getElementById('idMascota');
    const messageDiv = document.getElementById('message');
    const resultContainer = document.getElementById('resultContainer');
    const cardResults = document.getElementById('cardResults');

    // 🔧 CONFIGURACIÓN - Ajusta según tu estructura
    const BASE_URL = '../../../backend/controller/mascotasController.php';

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

            if (data.cliente) {
                html += `
                    <div class="cliente-info-card mb-4">
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <h5 class="mb-0"><i class="fas fa-user"></i> Información del Cliente</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>Cédula:</strong> ${data.cliente.CedulaCliente}</p>
                                        <p><strong>Nombre:</strong> ${data.cliente.NombreCliente}</p>
                                        <p><strong>Teléfono:</strong> ${data.cliente.Teléfono || 'No disponible'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Email:</strong> ${data.cliente.Email || 'No disponible'}</p>
                                        <p><strong>Dirección:</strong> ${data.cliente.Dirección || 'No disponible'}</p>
                                        <p><strong>Total de Mascotas:</strong> <span class="badge bg-success">${data.totalMascotas}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            if (data.mascotas && data.mascotas.length > 0) {
                html += `
                    <div class="mascotas-section">
                        <h5 class="mb-3">
                            <i class="fas fa-paw"></i> Mascotas Registradas (${data.mascotas.length})
                        </h5>
                `;

                data.mascotas.forEach((mascota, index) => {
                    const fechaRegistro = mascota.FechaRegistro ?
                        new Date(mascota.FechaRegistro).toLocaleDateString('es-ES') :
                        'No disponible';

                    html += `
                        <div class="resultado-card mb-3">
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="resultado-imagen-container">
                                        ${mascota.FotoBase64 ?
                            `<img src="data:image/jpeg;base64,${mascota.FotoBase64}" 
                                                 alt="Foto de ${mascota.NombreMascota}" 
                                                 class="resultado-imagen"
                                                 onclick="ampliarImagen(this, '${mascota.NombreMascota}')"
                                                 style="cursor: pointer;">` :
                            `<div class="no-image-placeholder">
                                                <i class="fas fa-paw fa-3x text-muted"></i>
                                                <p class="text-muted mt-2">Sin foto</p>
                                             </div>`
                        }
                                        <div class="resultado-nombre">${mascota.NombreMascota}</div>
                                    </div>
                                </div>
                                
                                <div class="col-md-9">
                                    <div class="resultado-info">
                                        <div class="mascota-datos mb-3">
                                            <h6 class="text-primary mb-2"><i class="fas fa-paw"></i> Datos de la Mascota</h6>
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <p><strong>ID:</strong> ${mascota.IDMascota}</p>
                                                    <p><strong>Especie:</strong> ${mascota.Especie}</p>
                                                    <p><strong>Raza:</strong> ${mascota.RazaMascota || 'No especificada'}</p>
                                                    <p><strong>Género:</strong> ${mascota.Genero}</p>
                                                </div>
                                                <div class="col-md-6">
                                                    <p><strong>Peso:</strong> ${mascota.Peso} kg</p>
                                                    <p><strong>Edad:</strong> ${mascota.Edad} años</p>
                                                    <p><strong>Fecha de Registro:</strong> ${fechaRegistro}</p>
                                                </div>
                                            </div>
                                        </div>

                                        ${data.cliente ? `
                                        <div class="dueno-datos mb-3">
                                            <h6 class="text-success mb-2"><i class="fas fa-user"></i> Datos del Dueño</h6>
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <p><strong>Nombre:</strong> ${data.cliente.NombreCliente}</p>
                                                    <p><strong>Cédula:</strong> ${data.cliente.CedulaCliente}</p>
                                                </div>
                                                <div class="col-md-6">
                                                    <p><strong>Teléfono:</strong> ${data.cliente.Teléfono || 'No disponible'}</p>
                                                    <p><strong>Email:</strong> ${data.cliente.Email || 'No disponible'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        ` : ''}

                                        <div class="condiciones-medicas">
                                            <h6 class="text-warning mb-2"><i class="fas fa-heartbeat"></i> Condiciones Médicas</h6>
                                            <div class="mt-2">
                                                ${mascota.CondicionesMedicas &&
                            mascota.CondicionesMedicas !== 'Sin condiciones médicas' &&
                            mascota.CondicionesMedicas.trim() !== '' ?
                            mascota.CondicionesMedicas.split(', ').map(condicion =>
                                `<span class="badge bg-warning text-dark me-1">${condicion.trim()}</span>`
                            ).join('') :
                            '<span class="badge bg-success">Sin condiciones médicas</span>'
                        }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ${index < data.mascotas.length - 1 ? '<hr class="my-3">' : ''}
                        </div>
                    `;
                });

                html += '</div>';
            } else {
                html += `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> ${data.mensaje || 'Este cliente no tiene mascotas registradas.'}
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
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> ${data.mensaje || 'Error desconocido'}
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
            // Mostrar indicador de carga
            cardResults.innerHTML = `
                <div class="text-center p-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2">Buscando información...</p>
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
                mensajeError = 'No se encontró el archivo mascotasController.php. Verifique la ruta.';
            } else if (error.message.includes('500')) {
                mensajeError = 'Error interno del servidor. Verifique los logs del servidor.';
            }

            cardResults.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <strong>Error:</strong> ${mensajeError}
                    <br><small class="text-muted">Detalles técnicos: ${error.message}</small>
                </div>
            `;
            resultContainer.style.display = 'block';
        }
    }

    // 🖼️ Función para ampliar imágenes
    function ampliarImagen(img, nombreMascota) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.9); display: flex; align-items: center;
            justify-content: center; z-index: 10000; cursor: pointer;
        `;

        const contenido = document.createElement('div');
        contenido.style.cssText = 'max-width: 90%; max-height: 90%; text-align: center;';

        const titulo = document.createElement('h4');
        titulo.textContent = `Foto de ${nombreMascota}`;
        titulo.style.cssText = 'color: white; margin-bottom: 20px;';

        const imgAmpliada = document.createElement('img');
        imgAmpliada.src = img.src;
        imgAmpliada.style.cssText = 'max-width: 100%; max-height: 80vh; border-radius: 8px;';

        const btnCerrar = document.createElement('button');
        btnCerrar.innerHTML = '✕ Cerrar';
        btnCerrar.className = 'btn btn-light mt-3';
        btnCerrar.onclick = () => modal.remove();

        contenido.appendChild(titulo);
        contenido.appendChild(imgAmpliada);
        contenido.appendChild(btnCerrar);
        modal.appendChild(contenido);

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
    }

    // 🔧 Función de debug para probar conexión
    async function probarConexion() {
        try {
            console.log('🔄 Probando conexión...');
            const response = await fetch(`${BASE_URL}?accion=listarEspecies`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Conexión exitosa:', data);
                mostrarMensaje('Conexión exitosa con el servidor', 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            mostrarMensaje(`Error de conexión: ${error.message}`, 'danger');
        }
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

    // Hacer funciones disponibles globalmente para debugging
    window.probarConexion = probarConexion;
    window.realizarConsulta = realizarConsulta;
    window.ampliarImagen = ampliarImagen;

    console.log('🚀 consultar.js cargado correctamente');
    console.log('🔧 Funciones de debug disponibles:');
    console.log('  - probarConexion(): Probar conexión con el servidor');
    console.log('  - realizarConsulta(): Ejecutar consulta manualmente');
});