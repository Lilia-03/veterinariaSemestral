// Variables globales para el estado de la factura
let facturaActual = {
    id: null,
    cliente: null,
    mascota: null,
    items: [],
    subtotal: 0,
    itbms: 0,
    total: 0
};

// facturacion.js - Módulo de Facturación CliniPet

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formFacturacion");
    const messageDiv = document.getElementById("message");
    
    // Inicialización
    cargarProductos();
    cargarServicios();
    crearModalPersonalizado(); // ← NUEVA FUNCIÓN

    // Funciones de utilidad
    function mostrarMensaje(mensaje, tipo = 'info') {
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
                alert.remove();
            }, 5000);
        } else {
            // Fallback: usar alert del navegador
            alert(mensaje);
        }
    }

    function mostrarLoading(mostrar = true) {
        const loadingDiv = document.getElementById('loadingSpinner'); // ← CORREGIDO ID
        if (loadingDiv) {
            loadingDiv.style.display = mostrar ? 'block' : 'none';
        }
    }

    // ========== NUEVAS FUNCIONES PARA MODALES PERSONALIZADOS ==========
    
    // Crear modal personalizado para reemplazar prompts y confirms
    function crearModalPersonalizado() {
        const modalHTML = `
            <div class="modal fade" id="modalPersonalizado" tabindex="-1" aria-labelledby="modalPersonalizadoLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalPersonalizadoLabel">Confirmación</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="modalPersonalizadoBody">
                            <!-- Contenido dinámico -->
                        </div>
                        <div class="modal-footer" id="modalPersonalizadoFooter">
                            <!-- Botones dinámicos -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar modal al DOM si no existe
        if (!document.getElementById('modalPersonalizado')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            console.log("✅ Modal personalizado creado");
        } else {
            console.log("ℹ️ Modal personalizado ya existe");
        }
    }

    // Función para mostrar modal personalizado
    function mostrarModalPersonalizado(titulo, mensaje, botones, callback) {
        const modalElement = document.getElementById('modalPersonalizado');
        const modalLabel = document.getElementById('modalPersonalizadoLabel');
        const modalBody = document.getElementById('modalPersonalizadoBody');
        const modalFooter = document.getElementById('modalPersonalizadoFooter');
        
        modalLabel.textContent = titulo;
        modalBody.innerHTML = mensaje;
        modalFooter.innerHTML = '';
        
        // Función para cerrar el modal
        function cerrarModal() {
            if (typeof window.bootstrap !== 'undefined') {
                // Bootstrap 5 nativo
                const modal = window.bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                } else {
                    cerrarModalManual();
                }
            } else if (typeof $ !== 'undefined' && $.fn.modal) {
                // Fallback a jQuery
                $(modalElement).modal('hide');
            } else {
                // Fallback manual
                cerrarModalManual();
            }
        }
        
        function cerrarModalManual() {
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            
            // Remover backdrop
            const existingBackdrop = document.querySelector('.modal-backdrop');
            if (existingBackdrop) {
                existingBackdrop.remove();
            }
        }
        
        botones.forEach(boton => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `btn ${boton.clase}`;
            btn.textContent = boton.texto;
            btn.onclick = () => {
                cerrarModal();
                setTimeout(() => {
                    if (callback) callback(boton.valor);
                }, 100); // Pequeño delay para asegurar que el modal se cierre primero
            };
            modalFooter.appendChild(btn);
        });
        
        // Agregar funcionalidad al botón X
        const closeButton = modalElement.querySelector('.btn-close');
        if (closeButton) {
            closeButton.onclick = () => {
                cerrarModal();
                setTimeout(() => {
                    if (callback) callback(null);
                }, 100);
            };
        }
        
        // Usar jQuery o la forma nativa de Bootstrap
        if (typeof window.bootstrap !== 'undefined') {
            // Bootstrap 5 nativo
            const modal = new window.bootstrap.Modal(modalElement, {
                backdrop: 'static', // Evitar cierre accidental
                keyboard: true
            });
            
            // Event listener para cuando se cierra el modal
            modalElement.addEventListener('hidden.bs.modal', function () {
                console.log('🔒 Modal cerrado por Bootstrap');
            });
            
            modal.show();
        } else if (typeof $ !== 'undefined' && $.fn.modal) {
            // Fallback a jQuery si está disponible
            $(modalElement).modal({
                backdrop: 'static',
                keyboard: true
            }).modal('show');
        } else {
            // Fallback manual mejorado
            modalElement.classList.add('show');
            modalElement.style.display = 'block';
            modalElement.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            
            // Crear backdrop manualmente si no existe
            let backdrop = document.querySelector('.modal-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
            
            // NO cerrar modal al hacer clic en backdrop (backdrop: 'static')
            
            // Cerrar modal con ESC
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    cerrarModal();
                    setTimeout(() => {
                        if (callback) callback(null);
                    }, 100);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }
    }

    // Función para mostrar input personalizado
    function mostrarInputPersonalizado(titulo, mensaje, placeholder, callback) {
        const inputHTML = `
            <p>${mensaje}</p>
            <div class="mb-3">
                <input type="text" class="form-control" id="inputPersonalizado" placeholder="${placeholder}">
            </div>
        `;
        
        const botones = [
            { texto: 'Cancelar', clase: 'btn-secondary', valor: null },
            { texto: 'Aceptar', clase: 'btn-primary', valor: 'aceptar' }
        ];
        
        mostrarModalPersonalizado(titulo, inputHTML, botones, (resultado) => {
            if (resultado === 'aceptar') {
                const input = document.getElementById('inputPersonalizado');
                const valor = input ? input.value.trim() : null;
                callback(valor);
            } else {
                callback(null);
            }
        });
        
        // Asegurar que el input tenga foco después de que se muestre el modal
        setTimeout(() => {
            const input = document.getElementById('inputPersonalizado');
            if (input) {
                input.focus();
                input.select(); // Seleccionar todo el texto
                
                // Permitir envío con Enter
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const btnAceptar = document.querySelector('#modalPersonalizado .btn-primary');
                        if (btnAceptar) {
                            btnAceptar.click();
                        }
                    }
                });
            }
        }, 500); // Aumentar el timeout para dar tiempo al modal
    }

    // Función auxiliar para actualizar UI del cliente
    function actualizarUICliente(clienteData) {
        const clienteInfo = document.getElementById('clienteInfo');
        if (clienteInfo) {
            clienteInfo.textContent = `Cliente: ${clienteData.nombre} (${clienteData.cedula === '---' ? 'Contado' : clienteData.cedula})`;
            clienteInfo.style.display = 'block';
        }
    }

    // Nueva función para actualizar la visibilidad de formularios según mascota
    function actualizarVisibilidadFormularios() {
        const btnAgregarServicio = document.querySelector('button[onclick="mostrarFormulario(\'servicio\')"]');
        
        if (facturaActual.mascota && facturaActual.mascota.id === 0) {
            // Sin mascota específica - ocultar botón de servicios
            if (btnAgregarServicio) {
                btnAgregarServicio.style.display = 'none';
            }
            // Ocultar formulario de servicios si está visible
            const formularioServicio = document.getElementById('formularioServicio');
            if (formularioServicio) {
                formularioServicio.style.display = 'none';
            }
        } else {
            // Con mascota - mostrar botón de servicios
            if (btnAgregarServicio) {
                btnAgregarServicio.style.display = 'inline-block';
            }
        }
    }

    // ========== FUNCIONES EXISTENTES CON MEJORAS ==========

    // Cargar productos desde la base de datos
    async function cargarProductos() {
        try {
            // RUTA CORREGIDA: Desde frontend/admin/ hacia backend/controller/
            const response = await fetch('../../backend/controller/facturacionController.php?accion=obtenerProductos');
            const result = await response.json();
            
            if (result.estado === 'ok') {
                const select = document.getElementById('productoSelect');
                if (select) {
                    result.productos.forEach(producto => {
                        const option = document.createElement('option');
                        option.value = producto.IDITEM;
                        option.textContent = `${producto.NombreProducto} - ${parseFloat(producto.PrecioITEM).toFixed(2)}`;
                        option.dataset.precio = producto.PrecioITEM;
                        option.dataset.nombre = producto.NombreProducto;
                        select.appendChild(option);
                    });
                }
            } else {
                console.error('Error en respuesta:', result.mensaje);
                mostrarMensaje('Error cargando productos desde el servidor', 'warning');
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            mostrarMensaje('Error de conexión al cargar productos. Verifique el servidor.', 'danger');
        }
    }

    // Cargar servicios desde la base de datos
    async function cargarServicios() {
        try {
            // RUTA CORREGIDA: Desde frontend/admin/ hacia backend/controller/
            const response = await fetch('../../backend/controller/facturacionController.php?accion=obtenerServicios');
            const result = await response.json();
            
            if (result.estado === 'ok') {
                const select = document.getElementById('servicioSelect');
                if (select) {
                    result.servicios.forEach(servicio => {
                        const option = document.createElement('option');
                        option.value = servicio.IDITEM;
                        option.textContent = `${servicio.NombreProducto} - ${parseFloat(servicio.PrecioITEM).toFixed(2)}`;
                        option.dataset.precio = servicio.PrecioITEM;
                        option.dataset.nombre = servicio.NombreProducto;
                        select.appendChild(option);
                    });
                }
            } else {
                console.error('Error en respuesta:', result.mensaje);
                mostrarMensaje('Error cargando servicios desde el servidor', 'warning');
            }
        } catch (error) {
            console.error('Error cargando servicios:', error);
            mostrarMensaje('Error de conexión al cargar servicios. Verifique el servidor.', 'danger');
        }
    }

    // Buscar cliente - MEJORADO CON MODAL Y MEJOR MANEJO DE ERRORES
    window.buscarCliente = async function() {
        const cedula = document.getElementById('cedulaCliente').value.trim();
        
        if (!cedula) {
            mostrarMensaje('Por favor ingrese la cédula del cliente o escriba "contado" para venta al contado', 'warning');
            return;
        }

        mostrarLoading(true);

        try {
            let clienteData;
            
            // Verificar si es venta al contado
            if (cedula.toLowerCase() === 'contado' || cedula === '---') {
                clienteData = {
                    cedula: '---',
                    nombre: 'Contado',
                    esContado: true
                };
                mostrarMensaje('Venta al contado seleccionada', 'success');
                
                facturaActual.cliente = clienteData;
                actualizarUICliente(clienteData);
                mostrarOpcionesMascotaContado();
            } else {
                // Buscar cliente real en la base de datos
                console.log("🔍 Buscando cliente con cédula:", cedula);
                
                const response = await fetch(`../../backend/controller/facturacionController.php?accion=obtenerCliente&cedula=${encodeURIComponent(cedula)}`);
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log("📋 Respuesta del servidor:", result);
                
                if (result.estado === 'ok') {
                    clienteData = {
                        cedula: cedula,
                        nombre: result.cliente.Nombre,
                        telefono: result.cliente.Teléfono,
                        email: result.cliente.Email,
                        direccion: result.cliente.Dirección,
                        esContado: false
                    };
                    mostrarMensaje(`Cliente encontrado: ${clienteData.nombre}`, 'success');
                    
                    facturaActual.cliente = clienteData;
                    actualizarUICliente(clienteData);
                    buscarMascotas(clienteData.cedula);
                } else {
                    // Cliente no existe, usar modal personalizado
                    mostrarLoading(false);
                    
                    const botones = [
                        { texto: 'Cancelar', clase: 'btn-secondary', valor: 'cancelar' },
                        { texto: 'Continuar al Contado', clase: 'btn-primary', valor: 'contado' }
                    ];
                    
                    mostrarModalPersonalizado(
                        'Cliente No Encontrado',
                        `<p>No se encontró un cliente con la cédula <strong>${cedula}</strong>.</p>
                         <p>¿Desea continuar como venta al contado?</p>`,
                        botones,
                        (resultado) => {
                            if (resultado === 'contado') {
                                clienteData = {
                                    cedula: '---',
                                    nombre: 'Contado',
                                    esContado: true
                                };
                                facturaActual.cliente = clienteData;
                                actualizarUICliente(clienteData);
                                mostrarOpcionesMascotaContado();
                                mostrarMensaje('Continuando como venta al contado', 'info');
                            } else {
                                mostrarMensaje('Búsqueda cancelada. Registre el cliente primero o use "contado" para venta al contado.', 'warning');
                            }
                        }
                    );
                    return;
                }
            }
            
        } catch (error) {
            console.error('❌ Error completo:', error);
            console.error('❌ Stack trace:', error.stack);
            
            // Determinar tipo de error para mensaje más específico
            let mensajeError = 'Error conectando con el servidor';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                mensajeError = 'Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.';
            } else if (error.message.includes('HTTP')) {
                mensajeError = `Error del servidor: ${error.message}`;
            } else if (error.message.includes('JSON')) {
                mensajeError = 'Error: Respuesta inválida del servidor';
            }
            
            mostrarMensaje(mensajeError, 'danger');
        } finally {
            mostrarLoading(false);
        }
    };

    // Buscar mascotas del cliente
    async function buscarMascotas(cedula) {
        try {
            const response = await fetch(`../../backend/controller/facturacionController.php?accion=obtenerMascotas&cedula=${encodeURIComponent(cedula)}`);
            const result = await response.json();
            
            const select = document.getElementById('mascotaSelect');
            if (select) {
                select.innerHTML = '<option value="">Seleccione una mascota...</option>';
                
                if (result.estado === 'ok' && result.mascotas.length > 0) {
                    result.mascotas.forEach(mascota => {
                        const option = document.createElement('option');
                        option.value = mascota.IDMascota;
                        option.textContent = mascota.Nombre;
                        select.appendChild(option);
                    });
                }
                
                // Siempre agregar opción para continuar sin mascota específica
                const optionSinMascota = document.createElement('option');
                optionSinMascota.value = '0';
                optionSinMascota.textContent = 'Sin mascota específica (Solo productos)';
                select.appendChild(optionSinMascota);
                
                // Mostrar sección de mascota
                const mascotaSection = document.getElementById('mascotaSection');
                if (mascotaSection) {
                    mascotaSection.style.display = 'block';
                }
            }
            
        } catch (error) {
            console.error('Error buscando mascotas:', error);
            mostrarMensaje('Error buscando mascotas del cliente', 'warning');
        }
    }

    // Función para manejar opciones de mascota en venta al contado
    function mostrarOpcionesMascotaContado() {
        const select = document.getElementById('mascotaSelect');
        if (select) {
            select.innerHTML = `
                <option value="">Seleccione una opción...</option>
                <option value="0">Sin mascota específica (Venta de productos)</option>
                <option value="buscar-mascota">Buscar mascota registrada por cédula</option>
            `;
            
            const mascotaSection = document.getElementById('mascotaSection');
            if (mascotaSection) {
                mascotaSection.style.display = 'block';
            }
        }
    }

    // Seleccionar mascota - MEJORADO CON MODAL
    window.seleccionarMascota = function() {
        const mascotaSelect = document.getElementById('mascotaSelect');
        if (!mascotaSelect) return;
        
        const mascotaId = mascotaSelect.value;
        const mascotaNombre = mascotaSelect.options[mascotaSelect.selectedIndex].text;
        
        if (!mascotaId) {
            mostrarMensaje('Por favor seleccione una opción', 'warning');
            return;
        }

        // Manejar caso especial de búsqueda de mascota con modal personalizado
        if (mascotaId === 'buscar-mascota') {
            mostrarInputPersonalizado(
                'Buscar Mascota',
                'Ingrese la cédula del dueño de la mascota:',
                'Ej: 8-123-456',
                (cedulaBuscar) => {
                    if (cedulaBuscar) {
                        buscarMascotas(cedulaBuscar);
                    }
                }
            );
            return;
        }

        facturaActual.mascota = {
            id: mascotaId === '0' ? 0 : parseInt(mascotaId),
            nombre: mascotaId === '0' ? 'Sin mascota específica' : mascotaNombre
        };

        // Actualizar UI
        const mascotaInfo = document.getElementById('mascotaInfo');
        if (mascotaInfo) {
            mascotaInfo.textContent = `Mascota: ${facturaActual.mascota.nombre}`;
            mascotaInfo.style.display = 'block';
        }

        // Mostrar sección de productos
        const productosSection = document.getElementById('productosSection');
        if (productosSection) {
            productosSection.style.display = 'block';
        }
        
        // Actualizar visibilidad de formularios según tipo de mascota
        actualizarVisibilidadFormularios();
        
        mostrarMensaje('Mascota seleccionada. Puede agregar productos' + (facturaActual.mascota.id > 0 ? ' y servicios.' : '.'), 'success');
    };

    // Agregar producto
    window.agregarProducto = function() {
        const select = document.getElementById('productoSelect');
        const cantidadInput = document.getElementById('cantidadProducto');
        
        if (!select || !cantidadInput) {
            mostrarMensaje('Error: Elementos del formulario no encontrados', 'danger');
            return;
        }
        
        const cantidad = parseInt(cantidadInput.value);
        
        if (!select.value || cantidad < 1) {
            mostrarMensaje('Por favor seleccione un producto y cantidad válida', 'warning');
            return;
        }

        const option = select.options[select.selectedIndex];
        const producto = {
            id: select.value,
            codigo: `PROD-${select.value}`,
            nombre: option.dataset.nombre,
            cantidad: cantidad,
            precio: parseFloat(option.dataset.precio),
            tipo: 'Producto'
        };

        producto.subtotal = producto.cantidad * producto.precio;
        producto.itbms = producto.subtotal * 0.07; // 7% ITBMS
        producto.total = producto.subtotal + producto.itbms;

        facturaActual.items.push(producto);
        actualizarVistaItems();
        
        // Limpiar formulario
        select.value = '';
        cantidadInput.value = 1;
        
        mostrarMensaje(`Producto "${producto.nombre}" agregado exitosamente`, 'success');
    };

    // Agregar servicio - MEJORADO CON VALIDACIÓN
    window.agregarServicio = function() {
        // Verificar si hay mascota específica
        if (!facturaActual.mascota || facturaActual.mascota.id === 0) {
            mostrarMensaje('Los servicios solo pueden agregarse cuando hay una mascota específica seleccionada', 'warning');
            return;
        }

        const select = document.getElementById('servicioSelect');
        
        if (!select) {
            mostrarMensaje('Error: Elemento del formulario no encontrado', 'danger');
            return;
        }
        
        if (!select.value) {
            mostrarMensaje('Por favor seleccione un servicio', 'warning');
            return;
        }

        const option = select.options[select.selectedIndex];
        const servicio = {
            id: select.value,
            codigo: `SERV-${select.value}`,
            nombre: option.dataset.nombre,
            cantidad: 1,
            precio: parseFloat(option.dataset.precio),
            tipo: 'Servicio'
        };

        servicio.subtotal = servicio.cantidad * servicio.precio;
        servicio.itbms = servicio.subtotal * 0.07; // 7% ITBMS
        servicio.total = servicio.subtotal + servicio.itbms;

        facturaActual.items.push(servicio);
        actualizarVistaItems();
        
        // Limpiar formulario
        select.value = '';
        
        mostrarMensaje(`Servicio "${servicio.nombre}" agregado exitosamente`, 'success');
    };

    // Actualizar vista de items
    function actualizarVistaItems() {
        const container = document.getElementById('itemsLista');
        if (!container) return;
        
        if (facturaActual.items.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay items agregados aún.</p>';
            return;
        }

        let html = '<div class="list-group">';
        facturaActual.items.forEach((item, index) => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${item.nombre}</h6>
                        <small class="text-muted">${item.tipo} - Cantidad: ${item.cantidad} - Precio: $${item.precio.toFixed(2)}</small>
                        <br><small>Total: $${item.total.toFixed(2)}</small>
                    </div>
                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
        calcularTotales();
        
        // Habilitar botón de generar factura
        const btnGenerar = document.getElementById('btnGenerarFactura');
        if (btnGenerar) {
            btnGenerar.disabled = facturaActual.items.length === 0;
        }
    }

    // Eliminar item
    window.eliminarItem = function(index) {
        facturaActual.items.splice(index, 1);
        actualizarVistaItems();
        mostrarMensaje('Item eliminado', 'info');
    };

    // Calcular totales
    function calcularTotales() {
        facturaActual.subtotal = facturaActual.items.reduce((sum, item) => sum + item.subtotal, 0);
        facturaActual.itbms = facturaActual.items.reduce((sum, item) => sum + item.itbms, 0);
        facturaActual.total = facturaActual.subtotal + facturaActual.itbms;

        // Actualizar display de totales
        const subtotalElement = document.getElementById('subtotalDisplay');
        const itbmsElement = document.getElementById('itbmsDisplay');
        const totalElement = document.getElementById('totalDisplay');

        if (subtotalElement) subtotalElement.textContent = `$${facturaActual.subtotal.toFixed(2)}`;
        if (itbmsElement) itbmsElement.textContent = `$${facturaActual.itbms.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `$${facturaActual.total.toFixed(2)}`;
    }

    // Generar factura
    window.generarFactura = async function() {
        if (facturaActual.items.length === 0) {
            mostrarMensaje('Debe agregar al menos un producto o servicio', 'warning');
            return;
        }

        if (!facturaActual.cliente) {
            mostrarMensaje('Debe seleccionar un cliente', 'warning');
            return;
        }

        mostrarLoading(true);

        try {
            // Crear factura en base de datos
            const facturaData = {
                cedulaCliente: facturaActual.cliente.cedula,
                idMascota: facturaActual.mascota && facturaActual.mascota.id !== 0 ? facturaActual.mascota.id : null
            };

            const response = await fetch('../../backend/controller/facturacionController.php?accion=generarFactura', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(facturaData)
            });

            const result = await response.json();
            
            if (result.estado !== 'ok') {
                throw new Error(result.mensaje || 'Error generando factura');
            }

            facturaActual.id = result.idFactura;

            // Agregar items a la factura
            for (const item of facturaActual.items) {
                if (item.tipo === 'Producto') {
                    console.log("🛍️ Agregando producto:", item.nombre);
                    await agregarProductoFactura(item);
                } else {
                    console.log("🏥 Agregando servicio:", item.nombre);
                    await agregarServicioFactura(item);
                }
            }

            // Completar factura
            console.log("🏁 Completando factura...");
            await completarFactura();

            // Mostrar resultado
            console.log("🎉 Mostrando factura completa...");
            mostrarFacturaCompleta();
            
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al generar la factura: ' + error.message, 'danger');
        } finally {
            mostrarLoading(false);
        }
    };

    // Funciones auxiliares para agregar items
    async function agregarProductoFactura(producto) {
        const data = {
            idFactura: facturaActual.id,
            idItem: producto.id,
            cantidad: producto.cantidad
        };

        const response = await fetch('../../backend/controller/facturacionController.php?accion=agregarProducto', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.estado !== 'ok') {
            throw new Error(`Error agregando producto: ${result.mensaje}`);
        }
    }

    async function agregarServicioFactura(servicio) {
        const mascotaIdParaServicio = facturaActual.mascota && facturaActual.mascota.id !== 0 ? facturaActual.mascota.id : 0;
        
        const data = {
            idFactura: facturaActual.id,
            idMascota: mascotaIdParaServicio,
            idItem: servicio.id
        };

        const response = await fetch('../../backend/controller/facturacionController.php?accion=agregarServicio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.estado !== 'ok') {
            throw new Error(`Error agregando servicio: ${result.mensaje}`);
        }
    }

    async function completarFactura() {
        const data = {
            idFactura: facturaActual.id
        };

        const response = await fetch('../../backend/controller/facturacionController.php?accion=completarFactura', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.estado !== 'ok') {
            throw new Error(`Error completando factura: ${result.mensaje}`);
        }
    }

    // Mostrar factura completa
    function mostrarFacturaCompleta() {
        console.log("🎬 Ejecutando mostrarFacturaCompleta...");
        console.log("📊 FacturaActual:", facturaActual);

        calcularTotales();
        
        const fechaActual = new Date().toLocaleDateString('es-PA');
        console.log("📅 Fecha:", fechaActual);
        
        const facturaHTML = `
            <div class="card">
                <div class="card-header text-center bg-primary text-white">
                    <h3>FACTURA</h3>
                    <h4>CliniPet</h4>
                    <p class="mb-0">Sistema de Atención Médica para Mascotas</p>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h5 class="border-bottom border-primary pb-2">DATOS DEL CONSUMIDOR</h5>
                            <p><strong>Nombre del Cliente:</strong> ${facturaActual.cliente.nombre}</p>
                            <p><strong>Cédula:</strong> ${facturaActual.cliente.cedula === '---' ? 'Contado' : facturaActual.cliente.cedula}</p>
                            <p><strong>Nombre de la Mascota:</strong> ${facturaActual.mascota ? facturaActual.mascota.nombre : 'N/A'}</p>
                        </div>
                        <div class="col-md-6 text-end">
                            <p><strong>Factura N°:</strong> ${facturaActual.id}</p>
                            <p><strong>Fecha:</strong> ${fechaActual}</p>
                            <p><strong>Estado:</strong> <span class="badge bg-success">Completada</span></p>
                        </div>
                    </div>

                    <h5 class="border-bottom border-primary pb-2 mb-3">DETALLE</h5>

                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead class="table-primary">
                                <tr>
                                    <th>Código</th>
                                    <th>Descripción</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unitario</th>
                                    <th>ITBMS</th>
                                    <th>Importe</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${facturaActual.items.map(item => `
                                    <tr>
                                        <td>${item.codigo}</td>
                                        <td>${item.nombre}</td>
                                        <td>${item.cantidad}</td>
                                        <td>$${item.precio.toFixed(2)}</td>
                                        <td>$${item.itbms.toFixed(2)}</td>
                                        <td>$${item.total.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="row">
                        <div class="col-md-6 offset-md-6">
                            <table class="table table-sm">
                                <tr>
                                    <td><strong>Total de Importe:</strong></td>
                                    <td class="text-end">${facturaActual.subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td><strong>ITBMS (7%):</strong></td>
                                    <td class="text-end">${facturaActual.itbms.toFixed(2)}</td>
                                </tr>
                                <tr class="table-primary">
                                    <td><strong>TOTAL:</strong></td>
                                    <td class="text-end"><strong>${facturaActual.total.toFixed(2)}</strong></td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <div class="text-center mt-4 pt-3 border-top">
                        <p class="text-muted mb-0">¡Gracias por confiar en CliniPet!</p>
                        <small class="text-muted">Sistema de Gestión Veterinaria</small>
                    </div>

                    <div class="text-center mt-4">
                        <button type="button" class="btn btn-warning me-2" onclick="descargarPDF()">
                            <i class="fas fa-download me-2"></i>Descargar PDF
                        </button>
                        <button type="button" class="btn btn-primary me-2" onclick="imprimirFactura()">
                            <i class="fas fa-print me-2"></i>Imprimir
                        </button>
                        <button type="button" class="btn btn-success" onclick="nuevaFactura()">
                            <i class="fas fa-plus me-2"></i>Nueva Factura
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Mostrar la factura
        const facturaContainer = document.getElementById('facturaSection');
        console.log("📺 Contenedor facturaSection encontrado:", !!facturaContainer);

        const facturaPreview = document.getElementById('facturaPreview');
        console.log("📺 Contenedor facturaPreview encontrado:", !!facturaPreview);

        if (facturaContainer && facturaPreview) {
            facturaPreview.innerHTML = facturaHTML;
            facturaContainer.style.display = 'block';
            console.log("✅ Factura mostrada en pantalla");
        } else {
            console.error("❌ No se encontraron los contenedores necesarios");
        }

        mostrarMensaje('¡Factura generada exitosamente!', 'success');
    }

    // Descargar PDF
    window.descargarPDF = function() {
        console.log("🚀 Descargando PDF real...");
        
        if (!facturaActual.id) {
            mostrarMensaje('Error: No hay factura generada', 'danger');
            return;
        }
        
        try {
            // llamar al controlador PHP para generar el PDF
            const pdfUrl = `../../backend/controller/generarPDF.php?id=${facturaActual.id}`;
            
            console.log("📄 Descargando PDF desde:", pdfUrl);
            
            // Crear enlace de descarga invisible
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `Factura_CliniPet_${facturaActual.id}.pdf`;
            link.style.display = 'none';
            
            // Agregar al DOM, hacer clic y remover
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            mostrarMensaje('PDF descargado exitosamente', 'success');
            
        } catch (error) {
            console.error('❌ Error:', error);
            mostrarMensaje('Error al descargar PDF: ' + error.message, 'danger');
        }
    };

    // Imprimir factura - MEJORADO
    window.imprimirFactura = function() {
        console.log("🖨️ Iniciando impresión...");
        
        const facturaSection = document.getElementById('facturaSection');
        const facturaPreview = document.getElementById('facturaPreview');
        
        if (!facturaSection || !facturaPreview) {
            mostrarMensaje('Error: No se encontró la factura para imprimir', 'danger');
            return;
        }
        
        try {
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Factura CliniPet ${facturaActual.id}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px; 
                            color: #333; 
                        }
                        .no-print { 
                            display: none !important; 
                        }
                        @media print {
                            body { margin: 0; }
                            .btn { display: none !important; }
                            .no-print { display: none !important; }
                        }
                        .border-primary { border-color: #667eea !important; }
                        .bg-primary { background-color: #667eea !important; }
                        .text-primary { color: #667eea !important; }
                    </style>
                </head>
                <body>
                    ${facturaPreview.innerHTML}
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
            
            mostrarMensaje('Ventana de impresión abierta', 'success');
            
        } catch (error) {
            console.error('❌ Error al imprimir:', error);
            mostrarMensaje('Error al abrir ventana de impresión: ' + error.message, 'danger');
        }
    };

    // Nueva factura - COMPLETAMENTE REESCRITA CON MODAL
    window.nuevaFactura = function() {
        // Confirmar acción con modal personalizado
        const botones = [
            { texto: 'Cancelar', clase: 'btn-secondary', valor: 'cancelar' },
            { texto: 'Sí, Nueva Factura', clase: 'btn-primary', valor: 'confirmar' }
        ];
        
        mostrarModalPersonalizado(
            'Confirmar Nueva Factura',
            '<p>¿Está seguro que desea crear una nueva factura?</p><p class="text-warning"><small>Se perderán los datos actuales.</small></p>',
            botones,
            (resultado) => {
                if (resultado === 'confirmar') {
                    ejecutarNuevaFactura();
                }
            }
        );
    };

    // Función para ejecutar la nueva factura
    function ejecutarNuevaFactura() {
        // Reiniciar datos
        facturaActual = {
            id: null,
            cliente: null,
            mascota: null,
            items: [],
            subtotal: 0,
            itbms: 0,
            total: 0
        };

        // Limpiar formularios
        const cedulaInput = document.getElementById('cedulaCliente');
        const cantidadInput = document.getElementById('cantidadProducto');
        const productoSelect = document.getElementById('productoSelect');
        const servicioSelect = document.getElementById('servicioSelect');
        const mascotaSelect = document.getElementById('mascotaSelect');
        
        if (cedulaInput) cedulaInput.value = '';
        if (cantidadInput) cantidadInput.value = 1;
        if (productoSelect) productoSelect.value = '';
        if (servicioSelect) servicioSelect.value = '';
        if (mascotaSelect) mascotaSelect.innerHTML = '<option value="">Seleccione una mascota...</option>';
        
        // Ocultar secciones de información
        const clienteInfo = document.getElementById('clienteInfo');
        const mascotaInfo = document.getElementById('mascotaInfo');
        const mascotaSection = document.getElementById('mascotaSection');
        const productosSection = document.getElementById('productosSection');
        const facturaSection = document.getElementById('facturaSection'); // ← LÍNEA CLAVE AÑADIDA
        
        if (clienteInfo) clienteInfo.style.display = 'none';
        if (mascotaInfo) mascotaInfo.style.display = 'none';
        if (mascotaSection) mascotaSection.style.display = 'none';
        if (productosSection) productosSection.style.display = 'none';
        if (facturaSection) facturaSection.style.display = 'none'; // ← OCULTAR FACTURA ANTERIOR
        
        // Ocultar formularios de productos/servicios
        const formularioProducto = document.getElementById('formularioProducto');
        const formularioServicio = document.getElementById('formularioServicio');
        if (formularioProducto) formularioProducto.style.display = 'none';
        if (formularioServicio) formularioServicio.style.display = 'none';
        
        // Mostrar botón de servicios (en caso de que haya estado oculto)
        const btnAgregarServicio = document.querySelector('button[onclick="mostrarFormulario(\'servicio\')"]');
        if (btnAgregarServicio) {
            btnAgregarServicio.style.display = 'inline-block';
        }
        
        // Actualizar vista de items (limpia la lista)
        actualizarVistaItems();

        // Limpiar el contenido de la factura previa
        const facturaPreview = document.getElementById('facturaPreview');
        if (facturaPreview) {
            facturaPreview.innerHTML = '';
        }

        mostrarMensaje('Nueva factura iniciada. Puede comenzar ingresando la cédula del cliente.', 'info');
    }

    // Función para mostrar/ocultar formularios de productos/servicios - MEJORADA
    window.mostrarFormulario = function(tipo) {
        const formularioProducto = document.getElementById('formularioProducto');
        const formularioServicio = document.getElementById('formularioServicio');
        
        if (formularioProducto && formularioServicio) {
            if (tipo === 'producto') {
                formularioProducto.style.display = 'block';
                formularioServicio.style.display = 'none';
            } else if (tipo === 'servicio') {
                // Verificar si se puede agregar servicios
                if (facturaActual.mascota && facturaActual.mascota.id === 0) {
                    mostrarMensaje('Los servicios solo pueden agregarse cuando hay una mascota específica seleccionada', 'warning');
                    return;
                }
                formularioProducto.style.display = 'none';
                formularioServicio.style.display = 'block';
            }
        }
    };
});