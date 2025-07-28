// registrarMascota.js - Solo funcionalidad de REGISTRO

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 registrarMascota.js cargado correctamente');
    
    // Variables globales
    let clienteVerificado = false;
    let timeoutId;
    
    // BASE URL - Ajusta esta ruta según tu estructura
    const BASE_URL = '../../../backend/controller/controller.php';
    
    // Referencias a elementos del DOM
    const form = document.getElementById('formRegistrarMascota');
    const especieSelect = document.getElementById('especie');
    const razaSelect = document.getElementById('raza');
    const cedulaInput = document.getElementById('cedulaCliente');
    const condicionesContainer = document.getElementById('condicionesContainer');
    const clienteInfo = document.getElementById('cliente-info');
    const responseMessage = document.getElementById('responseMessage');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    // ========================================================================
    // FUNCIONES DE MENSAJES
    // ========================================================================

    function mostrarMensaje(mensaje, tipo = 'info') {
        if (!responseMessage) return;
        
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

    // ========================================================================
    // FUNCIONES DE CARGA DE DATOS
    // ========================================================================

    async function cargarEspecies() {
        if (!especieSelect) {
            console.error('❌ No se encontró el elemento especieSelect');
            return;
        }
        
        try {
            console.log('📡 Cargando especies desde:', `${BASE_URL}?accion=listarEspecies`);
            
            // Mostrar loading en el select
            especieSelect.innerHTML = '<option value="">Cargando especies...</option>';
            especieSelect.disabled = true;
            
            const response = await fetch(`${BASE_URL}?accion=listarEspecies`);
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const responseText = await response.text();
            console.log('📄 Respuesta COMPLETA:', responseText);
            
            // Verificar si la respuesta es HTML (error 404/500)
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                console.error('❌ El servidor devolvió HTML:', responseText.substring(0, 200));
                throw new Error('El servidor devolvió HTML en lugar de JSON. Verifique la ruta del controller.');
            }
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('📋 Datos parseados exitosamente:', data);
            } catch (parseError) {
                console.error('❌ Error parseando JSON:', parseError);
                throw new Error('Respuesta no es JSON válido');
            }
            
            if (data.estado === 'ok' && data.especies && Array.isArray(data.especies)) {
                console.log('✅ Procesando especies...');
                
                // Limpiar y agregar opciones
                especieSelect.innerHTML = '';
                
                // Opción por defecto
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Seleccione especie';
                especieSelect.appendChild(defaultOption);
                
                // Agregar especies
                data.especies.forEach((especie, index) => {
                    console.log(`🔄 Procesando especie ${index + 1}:`, especie);
                    
                    const option = document.createElement('option');
                    option.value = especie.EspecieID;
                    
                    const nombreEspecie = especie.Nombre || especie.NombreEspecie || 'Especie sin nombre';
                    option.textContent = nombreEspecie;
                    option.setAttribute('data-nombre', nombreEspecie);
                    
                    especieSelect.appendChild(option);
                    
                    console.log(`✅ Especie agregada: ${nombreEspecie} (ID: ${especie.EspecieID})`);
                });
                
                // Habilitar el select
                especieSelect.disabled = false;
                
                console.log(`✅ ${data.especies.length} especies cargadas correctamente`);
                
            } else {
                console.error('❌ Formato de respuesta incorrecto:', data);
                
                // Fallback: agregar especies hardcodeadas
                console.log('🔧 Agregando especies por defecto...');
                especieSelect.innerHTML = '';
                
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Seleccione especie';
                especieSelect.appendChild(defaultOption);
                
                const perroOption = document.createElement('option');
                perroOption.value = '1';
                perroOption.textContent = 'Perro';
                especieSelect.appendChild(perroOption);
                
                const gatoOption = document.createElement('option');
                gatoOption.value = '2';
                gatoOption.textContent = 'Gato';
                especieSelect.appendChild(gatoOption);
                
                especieSelect.disabled = false;
                console.log('✅ Especies por defecto agregadas');
            }
            
        } catch (error) {
            console.error('❌ Error completo cargando especies:', error);
            
            if (especieSelect) {
                // Fallback final: especies hardcodeadas
                console.log('🆘 Fallback final: especies hardcodeadas');
                especieSelect.innerHTML = '';
                
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Seleccione especie';
                especieSelect.appendChild(defaultOption);
                
                const perroOption = document.createElement('option');
                perroOption.value = '1';
                perroOption.textContent = 'Perro';
                especieSelect.appendChild(perroOption);
                
                const gatoOption = document.createElement('option');
                gatoOption.value = '2';
                gatoOption.textContent = 'Gato';
                especieSelect.appendChild(gatoOption);
                
                especieSelect.disabled = false;
                console.log('✅ Fallback completado');
            }
            
            // Mostrar error al usuario
            mostrarMensaje(`Error cargando especies: ${error.message}. Especies por defecto cargadas.`, 'warning');
        }
    }

    async function cargarRazas(especieID) {
        if (!razaSelect) return;
        
        if (!especieID) {
            razaSelect.innerHTML = '<option value="">Seleccione una especie primero</option>';
            razaSelect.disabled = true;
            return;
        }

        try {
            console.log(`📡 Cargando razas para especie ID: ${especieID}`);
            const response = await fetch(`${BASE_URL}?accion=listarRazasPorEspecie&especieID=${especieID}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('📋 Datos de razas recibidos:', data);

            razaSelect.innerHTML = '<option value="">Seleccione una raza</option>';
            if (data.estado === "ok" && Array.isArray(data.razas)) {
                data.razas.forEach(raza => {
                    const option = document.createElement("option");
                    option.value = raza.RazaID;
                    option.textContent = raza.Nombre || raza.NombreRaza;
                    razaSelect.appendChild(option);
                });
                razaSelect.disabled = false;
                console.log(`✅ ${data.razas.length} razas cargadas para especie ${especieID}`);
            } else {
                console.log('⚠️ No se encontraron razas para esta especie');
                razaSelect.innerHTML = '<option value="">No se encontraron razas</option>';
                razaSelect.disabled = true;
            }
        } catch (error) {
            console.error('❌ Error cargando razas:', error);
            mostrarMensaje('Error al cargar razas', 'danger');
            razaSelect.innerHTML = '<option value="">Error al cargar razas</option>';
            razaSelect.disabled = true;
        }
    }

    async function cargarCondiciones(especieID) {
        if (!condicionesContainer) return;
        
        if (!especieID) {
            condicionesContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-info-circle fa-2x mb-2"></i>
                    <p class="mb-0">Seleccione una especie para ver las condiciones médicas disponibles</p>
                </div>
            `;
            return;
        }

        try {
            console.log(`📡 Cargando condiciones para especie ID: ${especieID}`);
            const response = await fetch(`${BASE_URL}?accion=listarCondicionesPorEspecie&especieID=${especieID}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('📋 Datos de condiciones recibidos:', data);

            if (data.estado === "ok" && Array.isArray(data.condiciones)) {
                if (data.condiciones.length === 0) {
                    condicionesContainer.innerHTML = `
                        <div class="text-center text-muted py-3">
                            <i class="fas fa-heart fa-2x mb-2"></i>
                            <p class="mb-0">No hay condiciones médicas registradas para esta especie.</p>
                        </div>
                    `;
                    return;
                }

                let html = '<div class="row g-2">';
                data.condiciones.forEach(condicion => {
                    const checkboxId = `condicion-${condicion.CondicionID}`;
                    html += `
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" 
                                       value="${condicion.CondicionID}" 
                                       id="${checkboxId}"
                                       name="condicionesCheckbox">
                                <label class="form-check-label" for="${checkboxId}">
                                    ${condicion.Nombre || condicion.NombreCondicion}
                                </label>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                condicionesContainer.innerHTML = html;
                
                console.log(`✅ ${data.condiciones.length} condiciones cargadas para especie ${especieID}`);
            } else {
                condicionesContainer.innerHTML = `
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-heart fa-2x mb-2"></i>
                        <p class="mb-0">No hay condiciones médicas específicas para esta especie</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error cargando condiciones:', error);
            condicionesContainer.innerHTML = `
                <div class="text-center text-danger py-3">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p class="mb-0">Error al cargar condiciones médicas</p>
                </div>
            `;
        }
    }

    // ========================================================================
    // FUNCIONES DE VALIDACIÓN
    // ========================================================================

    function habilitarFormularioMascota(habilitar) {
        const campos = ['nombreMascota', 'especie', 'peso', 'edad', 'genero', 'foto'];
        campos.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) elemento.disabled = !habilitar;
        });

        if (razaSelect) razaSelect.disabled = !habilitar;

        document.querySelectorAll('input[name="condicionesCheckbox"]').forEach(cb => {
            cb.disabled = !habilitar;
        });

        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        if (submitBtn) submitBtn.disabled = !habilitar;
    }

    async function verificarCliente() {
        if (!cedulaInput) return;
        
        const cedulaCliente = cedulaInput.value.trim();

        if (cedulaCliente.length < 3) {
            if (clienteInfo) clienteInfo.style.display = 'none';
            clienteVerificado = false;
            habilitarFormularioMascota(false);
            cedulaInput.classList.remove('is-valid', 'is-invalid');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}?accion=consultarCliente&cedula=${encodeURIComponent(cedulaCliente)}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Respuesta del servidor (verificar cliente):', responseText);

            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                throw new Error('El servidor devolvió una página HTML en lugar de JSON. Verifique la ruta del controller.');
            }

            const data = JSON.parse(responseText);

            if (data.estado === 'ok' && data.cliente) {
                clienteVerificado = true;
                if (clienteInfo) {
                    clienteInfo.innerHTML = `
                        <div class="alert alert-success">
                            <strong><i class="fas fa-check-circle"></i> Cliente encontrado:</strong><br>
                            <strong>Nombre:</strong> ${data.cliente.Nombre || data.cliente.NombreCliente}<br>
                            <strong>Teléfono:</strong> ${data.cliente.Teléfono || data.cliente.Telefono || 'No disponible'}<br>
                            <strong>Email:</strong> ${data.cliente.Email || 'No disponible'}
                        </div>
                    `;
                    clienteInfo.style.display = 'block';
                }
                cedulaInput.classList.remove('is-invalid');
                cedulaInput.classList.add('is-valid');
                habilitarFormularioMascota(true);
            } else {
                clienteVerificado = false;
                if (clienteInfo) {
                    clienteInfo.innerHTML = `
                        <div class="alert alert-warning">
                            <strong><i class="fas fa-exclamation-triangle"></i> Cliente no encontrado</strong><br>
                            El cliente con cédula "${cedulaCliente}" no está registrado. 
                            <a href="registrarCliente.html" target="_blank" class="alert-link">Registrar cliente primero</a>
                        </div>
                    `;
                    clienteInfo.style.display = 'block';
                }
                cedulaInput.classList.remove('is-valid');
                cedulaInput.classList.add('is-invalid');
                habilitarFormularioMascota(false);
            }
        } catch (error) {
            console.error('Error verificando cliente:', error);
            clienteVerificado = false;
            if (clienteInfo) {
                clienteInfo.innerHTML = `
                    <div class="alert alert-danger">
                        <strong><i class="fas fa-times-circle"></i> Error de conexión</strong><br>
                        No se pudo verificar el cliente. ${error.message}
                    </div>
                `;
                clienteInfo.style.display = 'block';
            }
            cedulaInput.classList.remove('is-valid');
            cedulaInput.classList.add('is-invalid');
            habilitarFormularioMascota(false);
        }
    }

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

    function limpiarFormulario() {
        if (!form) return;
        
        form.reset();
        if (clienteInfo) clienteInfo.style.display = 'none';
        clienteVerificado = false;
        habilitarFormularioMascota(false);

        if (razaSelect) {
            razaSelect.innerHTML = '<option value="">Seleccione una especie primero</option>';
            razaSelect.disabled = true;
        }
        
        if (condicionesContainer) {
            condicionesContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-info-circle fa-2x mb-2"></i>
                    <p class="mb-0">Seleccione una especie para ver las condiciones médicas disponibles</p>
                </div>
            `;
        }

        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });
    }

    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================

    // Verificación de cliente con debounce
    if (cedulaInput) {
        cedulaInput.addEventListener('input', function () {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                verificarCliente();
            }, 500);
        });
    }

    // Cambio de especie
    if (especieSelect) {
        especieSelect.addEventListener("change", () => {
            const especieID = especieSelect.value;
            console.log(`🔄 Especie seleccionada: ${especieID}`);
            cargarRazas(especieID);
            cargarCondiciones(especieID);
        });
    }

    // Validación de imagen
    const fotoInput = document.getElementById('foto');
    if (fotoInput) {
        fotoInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const error = validarImagen(file);
                if (error) {
                    mostrarMensaje(error, 'danger');
                    this.value = '';
                }
            }
        });
    }

    // Envío del formulario principal (registro)
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (responseMessage) {
                responseMessage.style.display = "none";
                responseMessage.textContent = "";
                responseMessage.className = "";
            }

            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            if (!clienteVerificado) {
                mostrarMensaje('Debe verificar que el cliente existe antes de continuar', 'danger');
                if (cedulaInput) cedulaInput.focus();
                return;
            }

            const nombre = document.getElementById('nombreMascota')?.value.trim();
            const especie = especieSelect?.value;
            const razaID = razaSelect?.value;
            const peso = document.getElementById('peso')?.value.trim();
            const edad = document.getElementById('edad')?.value.trim();
            const cedulaCliente = cedulaInput?.value.trim();
            const genero = document.getElementById('genero')?.value;
            const fotoFile = document.getElementById('foto')?.files[0];

            const condicionesCheckboxes = document.querySelectorAll('input[name="condicionesCheckbox"]:checked');
            const condiciones = Array.from(condicionesCheckboxes).map(c => c.value).join(',');

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
                if (btnSubmit) btnSubmit.disabled = true;
                if (btnText) btnText.textContent = "Guardando...";
                if (btnSpinner) btnSpinner.style.display = "inline-block";

                const registerFormData = new FormData();
                registerFormData.append("accion", "guardarMascota");
                registerFormData.append("nombre", nombre);
                registerFormData.append("especie", especie);
                registerFormData.append("peso", peso);
                registerFormData.append("edad", edad);
                registerFormData.append("cedulaCliente", cedulaCliente);
                registerFormData.append("razaID", razaID);
                registerFormData.append("genero", genero);

                if (fotoFile) {
                    registerFormData.append("foto", fotoFile);
                }

                registerFormData.append("condiciones", condiciones);

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

                const response = await fetch(BASE_URL, {
                    method: "POST",
                    body: registerFormData
                });

                const responseText = await response.text();
                console.log('=== RESPUESTA DEL SERVIDOR (REGISTRO) ===');
                console.log('Status:', response.status);
                console.log('Response Text:', responseText);
                console.log('=== FIN RESPUESTA ===');

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
                    limpiarFormulario();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    mostrarMensaje(data.mensaje || "Error desconocido", 'danger');
                }

            } catch (error) {
                console.error("Error completo:", error);
                mostrarMensaje(error.message || "Error de conexion", 'danger');
            } finally {
                if (btnSubmit) btnSubmit.disabled = false;
                if (btnText) btnText.textContent = "Registrar Mascota";
                if (btnSpinner) btnSpinner.style.display = "none";
            }
        });
    }

    // Validación visual en tiempo real
    if (form) {
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
    }

    // ========================================================================
    // INICIALIZACIÓN
    // ========================================================================

    // Cargar especies al inicio
    async function inicializar() {
        console.log('🚀 Inicializando aplicación...');
        
        // Esperar un poco para asegurar que el DOM está completamente listo
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
            await cargarEspecies();
            console.log('✅ Inicialización completada');
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
        }
    }

    // Ejecutar inicialización
    inicializar();

    habilitarFormularioMascota(false);
    console.log('✅ Script de registro de mascotas cargado correctamente');
    console.log('BASE_URL configurada como:', BASE_URL);
});