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

    // BASE URL - Ajusta esta ruta según tu estructura de carpetas
    const BASE_URL = '/SemestralCopy/backend/controller/controller.php';
    // Si tu estructura es diferente, cambia por una de estas opciones:
    // const BASE_URL = '../../../backend/controller/controller.php';
    // const BASE_URL = './backend/controller/controller.php';

    // Función para mostrar mensajes limpios (NUEVA - solo mensaje sin prefijos)
    function mostrarMensaje(mensaje, tipo = 'info') {
        // Limpiar el mensaje - extraer solo el texto del mensaje
        let mensajeLimpio = mensaje;

        // Si el mensaje viene como objeto JSON string, parsearlo
        try {
            const jsonData = JSON.parse(mensaje);
            if (jsonData.mensaje) {
                mensajeLimpio = jsonData.mensaje;
            }
        } catch (e) {
            // Si no es JSON, usar el mensaje tal como viene
            mensajeLimpio = mensaje;
        }

        // Remover prefijos técnicos del mensaje
        mensajeLimpio = mensajeLimpio.replace(/^Error del servidor: \d+ - /, '');
        mensajeLimpio = mensajeLimpio.replace(/^❌\s*/, '');
        mensajeLimpio = mensajeLimpio.replace(/^✅\s*/, '');
        mensajeLimpio = mensajeLimpio.replace(/^Error:\s*/, '');

        // Configurar el estilo según el tipo
        responseMessage.className = `alert mt-3 text-center alert-${tipo}`;

        // Agregar el ícono correspondiente
        const icono = tipo === 'success' ? '✅' : '❌';
        responseMessage.textContent = `${icono} ${mensajeLimpio}`;
        responseMessage.style.display = 'block';

        // Auto-ocultar después de 5 segundos si es éxito
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

        // Deshabilitar checkboxes de condiciones
        document.querySelectorAll('input[name="condicionesCheckbox"]').forEach(cb => {
            cb.disabled = !habilitar;
        });

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = !habilitar;
    }

    // Función para verificar cliente
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
            // URL corregida usando BASE_URL
            const response = await fetch(`${BASE_URL}?accion=consultarCliente&cedula=${encodeURIComponent(cedulaCliente)}`);

            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - Verifique que el archivo controller.php existe en la ruta correcta`);
            }

            const responseText = await response.text();
            console.log('Respuesta del servidor (verificar cliente):', responseText);

            // Verificar si es HTML (error 404) en lugar de JSON
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                throw new Error('El servidor devolvió una página HTML en lugar de JSON. Verifique la ruta del controller.');
            }

            const data = JSON.parse(responseText);

            if (data.estado === 'ok' && data.cliente) {
                // Cliente encontrado
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
                // Cliente no encontrado
                clienteVerificado = false;
                clienteInfo.innerHTML = `
                    <div class="alert alert-warning">
                        <strong><i class="fas fa-exclamation-triangle"></i> Cliente no encontrado</strong><br>
                        El cliente con cédula "${cedulaCliente}" no está registrado. 
                        <a href="registrarCliente.html" target="_blank" class="alert-link">Registrar cliente primero</a>
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
                    No se pudo verificar el cliente. ${error.message}
                </div>
            `;
            clienteInfo.style.display = 'block';
            cedulaInput.classList.remove('is-valid');
            cedulaInput.classList.add('is-invalid');
            habilitarFormularioMascota(false);
        }
    }

    // Función para cargar razas
    async function cargarRazas(especieID) {
        if (!especieID) {
            razaSelect.innerHTML = '<option value="">Seleccione una especie primero</option>';
            razaSelect.disabled = true;
            return;
        }

        try {
            // URL corregida usando BASE_URL
            const response = await fetch(`${BASE_URL}?accion=listarRazasPorEspecie&especieID=${especieID}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();

            razaSelect.innerHTML = '<option value="">Seleccione una raza</option>';
            if (data.estado === "ok" && Array.isArray(data.razas)) {
                data.razas.forEach(raza => {
                    const option = document.createElement("option");
                    option.value = raza.RazaID;
                    option.textContent = raza.Nombre;
                    razaSelect.appendChild(option);
                });
                razaSelect.disabled = false;
            } else {
                razaSelect.innerHTML = '<option value="">No se encontraron razas</option>';
                razaSelect.disabled = true;
            }
        } catch (error) {
            console.error('Error cargando razas:', error);
            mostrarMensaje('Error al cargar razas', 'danger');
            razaSelect.innerHTML = '<option value="">Error al cargar razas</option>';
            razaSelect.disabled = true;
        }
    }

    // Función para cargar condiciones
    async function cargarCondiciones(especieID) {
        condicionesContainer.innerHTML = "";

        if (!especieID) {
            condicionesContainer.innerHTML = '<p class="text-muted">Seleccione una especie para ver condiciones médicas</p>';
            return;
        }

        try {
            // URL corregida usando BASE_URL
            const response = await fetch(`${BASE_URL}?accion=listarCondicionesPorEspecie&especieID=${especieID}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.estado === "ok" && Array.isArray(data.condiciones)) {
                if (data.condiciones.length === 0) {
                    condicionesContainer.innerHTML = '<p class="text-muted">No hay condiciones médicas registradas para esta especie.</p>';
                    return;
                }

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
                condicionesContainer.innerHTML = '<p class="text-muted">No hay condiciones médicas para esta especie.</p>';
            }
        } catch (error) {
            console.error('Error cargando condiciones:', error);
            condicionesContainer.innerHTML = '<p class="text-danger">Error cargando condiciones médicas.</p>';
        }
    }

    // Función para validar archivo de imagen
    function validarImagen(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

        if (file.size > maxSize) {
            return 'El archivo es demasiado grande. Máximo 5MB.';
        }

        if (!allowedTypes.includes(file.type)) {
            return 'Formato de archivo no válido. Use JPG, JPEG, PNG o GIF.';
        }

        return null;
    }

    // Función para limpiar formulario
    function limpiarFormulario() {
        form.reset();
        clienteInfo.style.display = 'none';
        clienteVerificado = false;
        habilitarFormularioMascota(false);

        razaSelect.innerHTML = '<option value="">Seleccione una especie primero</option>';
        razaSelect.disabled = true;
        condicionesContainer.innerHTML = '<p class="text-muted">Seleccione una especie para ver condiciones médicas</p>';

        // Limpiar clases de validación
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });
    }

    // Event Listeners

    // Verificación de cliente con debounce
    cedulaInput.addEventListener('input', function () {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            verificarCliente();
        }, 500);
    });

    // Cambio de especie
    especieSelect.addEventListener("change", () => {
        const especieID = especieSelect.value;
        cargarRazas(especieID);
        cargarCondiciones(especieID);
    });

    // Validación de imagen al seleccionar archivo
    document.getElementById('foto').addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const error = validarImagen(file);
            if (error) {
                mostrarMensaje(error, 'danger');
                this.value = '';
            }
        }
    });

    // Envío del formulario
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Limpiar mensaje anterior
        responseMessage.style.display = "none";
        responseMessage.textContent = "";
        responseMessage.className = "";

        // Validar formulario HTML5
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Validar que el cliente esté verificado
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

        const regexCedula = /(^[1-9]-\d{1,4}-\d{1,4}$)|(^10-\d{1,4}-\d{1,4}$)|(^E-\d{6,}$)|(^[A-Z][0-9].*)/;
        if (!regexCedula.test(cedulaCliente)) {
            mostrarMensaje("Formato de cedula invalido", 'danger');
            return;
        }

        try {
            // Mostrar spinner del botón
            btnSubmit.disabled = true;
            btnText.textContent = "Guardando...";
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

            // Solo agregar foto si existe
            if (fotoFile) {
                formData.append("foto", fotoFile);
            }

            formData.append("condiciones", condiciones);

            // DEBUG: Mostrar todos los datos que se van a enviar
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
            console.log('=== FIN DATOS ===');

            // Enviar petición usando BASE_URL
            const response = await fetch(BASE_URL, {
                method: "POST",
                body: formData
            });

            // Leer la respuesta SIEMPRE, sin importar el status code
            const responseText = await response.text();
            console.log('=== RESPUESTA DEL SERVIDOR (REGISTRO) ===');
            console.log('Status:', response.status);
            console.log('Response Text:', responseText);
            console.log('=== FIN RESPUESTA ===');

            // Si no es exitoso, manejar el error con mensaje limpio
            if (!response.ok) {
                // Intentar parsear el JSON de error
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

            // Extrae el JSON aunque haya texto antes
            let jsonText = responseText.trim();
            const jsonStart = jsonText.indexOf('{');
            if (jsonStart > 0) {
                jsonText = jsonText.substring(jsonStart);
            }

            const data = JSON.parse(jsonText);

            if (data.estado === "ok") {
                mostrarMensaje("Mascota registrada exitosamente!", 'success');
                limpiarFormulario();

                // Scroll al inicio para mostrar el mensaje
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
            btnText.textContent = "Registrar Mascota";
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

    // Inicialización
    habilitarFormularioMascota(false);
    console.log('Script híbrido de registro de mascotas cargado correctamente');
    console.log('BASE_URL configurada como:', BASE_URL);
});