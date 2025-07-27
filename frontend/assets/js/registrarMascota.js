document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos del DOM
    const form = document.getElementById('formRegistrarMascota');
    const especieSelect = document.getElementById('especie');
    const razaSelect = document.getElementById('raza');
    const cedulaInput = document.getElementById('cedulaCliente');
    const condicionesContainer = document.getElementById('condicionesContainer');
    const clienteInfo = document.getElementById('cliente-info');
    const responseMessage = document.getElementById('responseMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    // Variables para control de estado
    let clienteVerificado = false;
    let timeoutId;

    // ⭐ RUTA CORREGIDA DEL CONTROLADOR
    const CONTROLLER_URL = '../backend/controller/mascotasController.php';

    // Función para mostrar mensajes
    function mostrarMensaje(mensaje, tipo = 'info') {
        let mensajeLimpio = mensaje;

        try {
            const jsonData = JSON.parse(mensaje);
            if (jsonData.mensaje) {
                mensajeLimpio = jsonData.mensaje;
            }
        } catch (e) {
            mensajeLimpio = mensaje;
        }

        mensajeLimpio = mensajeLimpio.replace(/^Error del servidor: \d+ - /, '');
        mensajeLimpio = mensajeLimpio.replace(/^❌\s*/, '');
        mensajeLimpio = mensajeLimpio.replace(/^✅\s*/, '');
        mensajeLimpio = mensajeLimpio.replace(/^Error:\s*/, '');

        responseMessage.className = `alert mt-3 text-center alert-${tipo}`;
        const icono = tipo === 'success' ? '✅' : '❌';
        responseMessage.textContent = `${icono} ${mensajeLimpio}`;
        responseMessage.style.display = 'block';

        if (tipo === 'success') {
            setTimeout(() => {
                responseMessage.style.display = 'none';
            }, 5000);
        }
    }

    // Función para habilitar/deshabilitar formulario
    function habilitarFormularioMascota(habilitar) {
        const campos = ['nombreMascota', 'especie', 'peso', 'edad', 'genero', 'foto'];
        campos.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) elemento.disabled = !habilitar;
        });

        razaSelect.disabled = !habilitar;

        document.querySelectorAll('input[name="condicionesCheckbox"]').forEach(cb => {
            cb.disabled = !habilitar;
        });

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = !habilitar;
    }

    // ⭐ FUNCIÓN CORREGIDA PARA VERIFICAR CLIENTE
    async function verificarCliente() {
        const cedulaCliente = cedulaInput.value.trim();

        if (cedulaCliente.length < 3) {
            clienteInfo.style.display = 'none';
            clienteVerificado = false;
            habilitarFormularioMascota(false);
            cedulaInput.classList.remove('is-valid', 'is-invalid');
            return;
        }

        try {
            const response = await fetch(`${CONTROLLER_URL}?accion=consultarCliente&cedula=${encodeURIComponent(cedulaCliente)}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Respuesta verificar cliente:', responseText);

            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                throw new Error('Error de ruta: Verifique que el controlador existe en la ruta correcta.');
            }

            const data = JSON.parse(responseText);

            if (data.estado === 'ok' && data.cliente) {
                clienteVerificado = true;
                clienteInfo.innerHTML = `
                            <div class="alert alert-success">
                                <strong><i class="fas fa-check-circle"></i> Cliente encontrado:</strong><br>
                                <strong>Nombre:</strong> ${data.cliente.Nombre}<br>
                                <strong>Teléfono:</strong> ${data.cliente.Teléfono || data.cliente.Telefono || 'No disponible'}<br>
                                <strong>Email:</strong> ${data.cliente.Email || 'No disponible'}
                            </div>
                        `;
                clienteInfo.style.display = 'block';
                cedulaInput.classList.remove('is-invalid');
                cedulaInput.classList.add('is-valid');
                habilitarFormularioMascota(true);
            } else {
                clienteVerificado = false;
                clienteInfo.innerHTML = `
                            <div class="alert alert-warning">
                                <strong><i class="fas fa-exclamation-triangle"></i> Cliente no encontrado</strong><br>
                                El cliente con cédula "${cedulaCliente}" no está registrado. 
                                <a href="RegistroCliente.html" target="_blank" class="alert-link">Registrar cliente primero</a>
                            </div>
                        `;
                clienteInfo.style.display = 'block';
                cedulaInput.classList.remove('is-valid');
                cedulaInput.classList.add('is-invalid');
                habilitarFormularioMascota(false);
            }
        } catch (error) {
            console.error('Error verificando cliente:', error);
            clienteVerificado = false;
            clienteInfo.innerHTML = `
                        <div class="alert alert-danger">
                            <strong><i class="fas fa-times-circle"></i> Error de conexión</strong><br>
                            ${error.message}
                        </div>
                    `;
            clienteInfo.style.display = 'block';
            cedulaInput.classList.remove('is-valid');
            cedulaInput.classList.add('is-invalid');
            habilitarFormularioMascota(false);
        }
    }

    // ⭐ FUNCIÓN CORREGIDA PARA CARGAR RAZAS
    async function cargarRazas(especieID) {
        console.log('Cargando razas para especie ID:', especieID);

        if (!especieID) {
            razaSelect.innerHTML = '<option value="">Seleccione una especie primero</option>';
            razaSelect.disabled = true;
            return;
        }

        try {
            const url = `${CONTROLLER_URL}?accion=listarRazasPorEspecie&especieID=${especieID}`;
            console.log('URL para razas:', url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Respuesta razas:', responseText);

            // Verificar si es HTML en lugar de JSON
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                throw new Error('Error de ruta: El controlador no existe o hay un error en la ruta.');
            }

            const data = JSON.parse(responseText);

            razaSelect.innerHTML = '<option value="">Seleccione una raza</option>';
            if (data.estado === "ok" && Array.isArray(data.razas)) {
                console.log('Razas encontradas:', data.razas.length);
                data.razas.forEach(raza => {
                    const option = document.createElement("option");
                    option.value = raza.RazaID;
                    option.textContent = raza.Nombre;
                    razaSelect.appendChild(option);
                });
                razaSelect.disabled = false;
            } else {
                console.log('No se encontraron razas:', data);
                razaSelect.innerHTML = '<option value="">No se encontraron razas</option>';
                razaSelect.disabled = true;
            }
        } catch (error) {
            console.error('Error cargando razas:', error);
            mostrarMensaje('Error al cargar razas: ' + error.message, 'danger');
            razaSelect.innerHTML = '<option value="">Error al cargar razas</option>';
            razaSelect.disabled = true;
        }
    }

    // ⭐ FUNCIÓN CORREGIDA PARA CARGAR CONDICIONES
    async function cargarCondiciones(especieID) {
        console.log('Cargando condiciones para especie ID:', especieID);

        condicionesContainer.innerHTML = "";

        if (!especieID) {
            condicionesContainer.innerHTML = '<div class="text-muted text-center"><i class="fas fa-info-circle"></i><p class="mb-0">Seleccione una especie para ver condiciones médicas</p></div>';
            return;
        }

        try {
            const url = `${CONTROLLER_URL}?accion=listarCondicionesPorEspecie&especieID=${especieID}`;
            console.log('URL para condiciones:', url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Respuesta condiciones:', responseText);

            const data = JSON.parse(responseText);

            if (data.estado === "ok" && Array.isArray(data.condiciones)) {
                if (data.condiciones.length === 0) {
                    condicionesContainer.innerHTML = '<div class="text-muted text-center"><p class="mb-0">No hay condiciones médicas registradas para esta especie.</p></div>';
                    return;
                }

                console.log('Condiciones encontradas:', data.condiciones.length);
                data.condiciones.forEach(condicion => {
                    const checkboxId = `condicion-${condicion.CondicionID}`;

                    const wrapperDiv = document.createElement("div");
                    wrapperDiv.classList.add("form-check", "form-check-inline", "me-3");

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.className = "form-check-input";
                    checkbox.name = "condicionesCheckbox";
                    checkbox.value = condicion.CondicionID;
                    checkbox.id = checkboxId;

                    const label = document.createElement("label");
                    label.className = "form-check-label";
                    label.htmlFor = checkboxId;
                    label.textContent = condicion.Nombre;

                    wrapperDiv.appendChild(checkbox);
                    wrapperDiv.appendChild(label);
                    condicionesContainer.appendChild(wrapperDiv);
                });
            } else {
                condicionesContainer.innerHTML = '<div class="text-muted text-center"><p class="mb-0">No hay condiciones médicas para esta especie.</p></div>';
            }
        } catch (error) {
            console.error('Error cargando condiciones:', error);
            condicionesContainer.innerHTML = '<div class="text-danger text-center"><p class="mb-0">Error cargando condiciones médicas.</p></div>';
        }
    }

    // Event Listeners

    // Verificación de cliente con debounce
    cedulaInput.addEventListener('input', function () {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            verificarCliente();
        }, 500);
    });

    // ⭐ CAMBIO DE ESPECIE - EVENTO CLAVE
    especieSelect.addEventListener("change", () => {
        const especieID = especieSelect.value;
        console.log('Especie seleccionada:', especieID);

        // Cargar razas y condiciones para la especie seleccionada
        cargarRazas(especieID);
        cargarCondiciones(especieID);
    });

    // Inicialización
    habilitarFormularioMascota(false);

    // Envío del formulario
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        responseMessage.style.display = "none";
        responseMessage.textContent = "";
        responseMessage.className = "";

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        if (!clienteVerificado) {
            mostrarMensaje('Debe verificar que el cliente existe antes de continuar', 'danger');
            cedulaInput.focus();
            return;
        }

        // Obtener valores del formulario
        const nombre = document.getElementById('nombreMascota').value.trim();
        const especie = especieSelect.value;
        const razaID = razaSelect.value;
        const peso = document.getElementById('peso').value.trim();
        const edad = document.getElementById('edad').value.trim();
        const cedulaCliente = cedulaInput.value.trim();
        const genero = document.getElementById('genero').value;
        const fotoFile = document.getElementById('foto').files[0];

        // Obtener condiciones seleccionadas
        const condicionesCheckboxes = document.querySelectorAll('input[name="condicionesCheckbox"]:checked');
        const condiciones = Array.from(condicionesCheckboxes).map(c => c.value).join(',');

        // Validaciones básicas
        if (!nombre || !especie || !razaID || !peso || !edad || !cedulaCliente || !genero) {
            mostrarMensaje("Por favor, complete todos los campos obligatorios.", 'danger');
            return;
        }

        if (isNaN(peso) || parseFloat(peso) <= 0) {
            mostrarMensaje("El peso debe ser mayor a cero", 'danger');
            return;
        }

        if (isNaN(edad) || parseInt(edad) < 0) {
            mostrarMensaje("La edad debe ser un numero mayor a cero", 'danger');
            return;
        }

        try {
            // Mostrar spinner del botón
            btnSubmit.disabled = true;
            btnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            if (btnSpinner) btnSpinner.style.display = "inline-block";

            // Crear FormData
            const formData = new FormData();
            formData.append("accion", "guardarMascota");
            formData.append("nombre", nombre);
            formData.append("especie", especie);
            formData.append("peso", peso);
            formData.append("edad", edad);
            formData.append("cedulaCliente", cedulaCliente);
            formData.append("razaID", razaID);
            formData.append("genero", genero);

            if (fotoFile) {
                formData.append("foto", fotoFile);
            }

            formData.append("condiciones", condiciones);

            console.log('=== DATOS A ENVIAR ===');
            console.log('nombre:', nombre);
            console.log('especie:', especie);
            console.log('razaID:', razaID);
            console.log('peso:', peso);
            console.log('edad:', edad);
            console.log('cedulaCliente:', cedulaCliente);
            console.log('genero:', genero);
            console.log('condiciones:', condiciones);
            console.log('foto:', fotoFile ? 'Archivo presente' : 'Sin foto');

            // Enviar petición
            const response = await fetch(CONTROLLER_URL, {
                method: "POST",
                body: formData
            });

            const responseText = await response.text();
            console.log('=== RESPUESTA DEL SERVIDOR ===');
            console.log('Status:', response.status);
            console.log('Response Text:', responseText);

            if (!response.ok) {
                try {
                    let jsonText = responseText.trim();
                    const jsonStart = jsonText.indexOf('{');
                    if (jsonStart > 0) {
                        jsonText = jsonText.substring(jsonStart);
                    }
                    const errorData = JSON.parse(jsonText);
                    mostrarMensaje(errorData.mensaje || 'Error del servidor', 'danger');
                } catch (parseError) {
                    mostrarMensaje('Error de conexion con el servidor', 'danger');
                }
                return;
            }

            let jsonText = responseText.trim();
            const jsonStart = jsonText.indexOf('{');
            if (jsonStart > 0) {
                jsonText = jsonText.substring(jsonStart);
            }

            const data = JSON.parse(jsonText);

            if (data.estado === "ok") {
                mostrarMensaje("Mascota registrada exitosamente!", 'success');

                // Limpiar formulario
                form.reset();
                clienteInfo.style.display = 'none';
                clienteVerificado = false;
                habilitarFormularioMascota(false);

                razaSelect.innerHTML = '<option value="">Seleccione una especie primero</option>';
                razaSelect.disabled = true;
                condicionesContainer.innerHTML = '<div class="text-muted text-center"><i class="fas fa-info-circle"></i><p class="mb-0">Seleccione una especie para ver condiciones médicas</p></div>';

                form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                    el.classList.remove('is-valid', 'is-invalid');
                });

                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                mostrarMensaje(data.mensaje || "Error desconocido", 'danger');
            }

        } catch (error) {
            console.error("Error completo:", error);
            mostrarMensaje(error.message || "Error de conexion", 'danger');
        } finally {
            // Restaurar botón
            btnSubmit.disabled = false;
            btnText.innerHTML = '<i class="fas fa-plus-circle"></i> Registrar Mascota';
            if (btnSpinner) btnSpinner.style.display = "none";
        }
    });

    // Validación visual en tiempo real
    form.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('input', function () {
            if (this.checkValidity()) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            } else {
                this.classList.remove('is-valid');
                this.classList.add('is-invalid');
            }
        });
    });

    // Validación de imagen al seleccionar archivo
    document.getElementById('foto').addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

            if (file.size > maxSize) {
                mostrarMensaje('El archivo es demasiado grande. Máximo 5MB.', 'danger');
                this.value = '';
                return;
            }

            if (!allowedTypes.includes(file.type)) {
                mostrarMensaje('Formato de archivo no válido. Use JPG, JPEG, PNG o GIF.', 'danger');
                this.value = '';
                return;
            }
        }
    });

    console.log('✅ Script de registro de mascotas cargado correctamente');
    console.log('📍 Controlador URL:', CONTROLLER_URL);
});