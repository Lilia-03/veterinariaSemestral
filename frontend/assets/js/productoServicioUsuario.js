// productoServicioUsuario.js - Sistema adaptado para usar el controlador existente

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let productosData = [];
    let serviciosData = [];
    let allItemsData = [];
    let filtroActual = 'all';
    let terminoBusqueda = '';
    
    // Referencias DOM
    const loadingSpinner = document.getElementById('loadingSpinner');
    const itemsContainer = document.getElementById('itemsContainer');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const noResults = document.getElementById('noResults');

    // Inicializar aplicación
    init();

    async function init() {
        try {
            mostrarCargando(true);
            await cargarDatos();
            configurarEventListeners();
            mostrarContenido();
            renderizarContenido();
            await cargarEstadisticas();
        } catch (error) {
            console.error('Error al inicializar:', error);
            mostrarError('Error al cargar los datos. Por favor, intenta nuevamente.');
        } finally {
            mostrarCargando(false);
        }
    }

    function mostrarCargando(mostrar) {
        if (loadingSpinner) {
            loadingSpinner.style.display = mostrar ? 'block' : 'none';
        }
        if (itemsContainer) {
            itemsContainer.style.display = mostrar ? 'none' : 'block';
        }
    }

    function mostrarContenido() {
        if (itemsContainer) {
            itemsContainer.style.display = 'block';
        }
    }

    async function cargarDatos() {
        try {
            console.log('🔄 Cargando datos desde ProductoServicioController.php');
            
            // Cargar todos los items de una vez
            const response = await fetch('../../backend/controller/ProductoServicioController.php?accion=obtener');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 Respuesta del servidor:', data);

            if (data.success && data.data && data.data.items) {
                allItemsData = data.data.items;
                
                // Separar productos y servicios
                productosData = allItemsData.filter(item => item.tipo === 'Producto');
                serviciosData = allItemsData.filter(item => item.tipo === 'Servicio');
                
                console.log(`✅ Datos cargados - Productos: ${productosData.length}, Servicios: ${serviciosData.length}`);
            } else {
                throw new Error(data.message || 'Error en la respuesta del servidor');
            }

        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            productosData = [];
            serviciosData = [];
            allItemsData = [];
            throw error;
        }
    }

    async function cargarEstadisticas() {
        try {
            const response = await fetch('../../backend/controller/ProductoServicioController.php?accion=estadisticas');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.estadisticas) {
                    actualizarEstadisticas(data.data.estadisticas);
                }
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            // Calcular estadísticas localmente si falla
            actualizarEstadisticasLocales();
        }
    }

    function actualizarEstadisticas(stats) {
        document.getElementById('totalItems').textContent = stats.total || 0;
        document.getElementById('totalProductos').textContent = stats.productos || 0;
        document.getElementById('totalServicios').textContent = stats.servicios || 0;
        document.getElementById('productosDisponibles').textContent = stats.productosDisponibles || 0;
    }

    function actualizarEstadisticasLocales() {
        const productosDisponibles = productosData.filter(item => 
            item.cantidad === null || parseInt(item.cantidad) > 0
        ).length;

        document.getElementById('totalItems').textContent = allItemsData.length;
        document.getElementById('totalProductos').textContent = productosData.length;
        document.getElementById('totalServicios').textContent = serviciosData.length;
        document.getElementById('productosDisponibles').textContent = productosDisponibles;
    }

    function configurarEventListeners() {
        // Búsqueda en tiempo real
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function() {
                terminoBusqueda = this.value.trim();
                filtrarYRenderizar();
            }, 300));
        }

        // Filtros por categoría
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Actualizar botones activos
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                filtroActual = this.getAttribute('data-filter');
                filtrarYRenderizar();
            });
        });
    }

    function filtrarYRenderizar() {
        const datosFiltrados = filtrarDatos();
        renderizarDatos(datosFiltrados);
        mostrarOcultarNoResultados(datosFiltrados);
    }

    function filtrarDatos() {
        let productos = [...productosData];
        let servicios = [...serviciosData];

        // Filtrar por término de búsqueda
        if (terminoBusqueda) {
            const termino = terminoBusqueda.toLowerCase();
            
            productos = productos.filter(item => 
                (item.nombre || '').toLowerCase().includes(termino)
            );
            
            servicios = servicios.filter(item => 
                (item.nombre || '').toLowerCase().includes(termino)
            );
        }

        // Filtrar por tipo
        switch (filtroActual) {
            case 'productos':
                servicios = [];
                break;
            case 'servicios':
                productos = [];
                break;
            // 'all' no filtra nada
        }

        return { productos, servicios };
    }

    function renderizarContenido() {
        const datosFiltrados = filtrarDatos();
        renderizarDatos(datosFiltrados);
        mostrarOcultarNoResultados(datosFiltrados);
    }

    function renderizarDatos({ productos, servicios }) {
        if (!itemsContainer) return;

        itemsContainer.innerHTML = '';

        // Mostrar servicios primero
        servicios.forEach(servicio => {
            itemsContainer.appendChild(crearLineaServicio(servicio));
        });

        // Luego mostrar productos
        productos.forEach(producto => {
            itemsContainer.appendChild(crearLineaProducto(producto));
        });
    }

    function crearLineaServicio(servicio) {
        const lineaDiv = document.createElement('div');
        lineaDiv.className = 'item-row service-row';

        const precio = formatearPrecio(servicio.precioNumerico || 0);
        const nombre = escapeHtml(servicio.nombre || 'Servicio sin nombre');

        lineaDiv.innerHTML = `
            <div class="availability-badge available">Disponible</div>
            <div class="item-icon">🩺</div>
            <div class="item-info">
                <div class="item-details">
                    <h4 class="item-title">${nombre}</h4>
                    <p class="item-category">
                        <i class="bi bi-tag"></i>
                        Servicios Veterinarios
                    </p>
                </div>
                <div class="item-price">${precio}</div>
            </div>
        `;

        // Agregar evento click para mostrar detalles
        lineaDiv.addEventListener('click', () => {
            mostrarDetallesItem(servicio, 'servicio');
        });

        return lineaDiv;
    }

    function crearLineaProducto(producto) {
        const lineaDiv = document.createElement('div');
        lineaDiv.className = 'item-row product-row';

        const precio = formatearPrecio(producto.precioNumerico || 0);
        const nombre = escapeHtml(producto.nombre || 'Producto sin nombre');
        const stock = parseInt(producto.cantidad || 0);
        
        // Determinar estado de disponibilidad
        let badgeClass, badgeText, stockClass, stockText;
        if (stock === 0) {
            badgeClass = 'unavailable';
            badgeText = 'Agotado';
            stockClass = 'stock-unavailable';
            stockText = 'Producto agotado';
        } else if (stock <= 5) {
            badgeClass = 'limited';
            badgeText = 'Stock Bajo';
            stockClass = 'stock-limited';
            stockText = `Quedan ${stock} unidades`;
        } else {
            badgeClass = 'available';
            badgeText = 'Disponible';
            stockClass = 'stock-available';
            stockText = `${stock} unidades disponibles`;
        }

        lineaDiv.innerHTML = `
            <div class="availability-badge ${badgeClass}">${badgeText}</div>
            <div class="item-icon">📦</div>
            <div class="item-info">
                <div class="item-details">
                    <h4 class="item-title">${nombre}</h4>
                    <p class="item-category">
                        <i class="bi bi-tag"></i>
                        Productos Veterinarios
                    </p>
                    <p class="item-stock ${stockClass}">
                        <i class="bi bi-box"></i>
                        ${stockText}
                    </p>
                </div>
                <div class="item-price">${precio}</div>
            </div>
        `;

        // Agregar evento click para mostrar detalles
        lineaDiv.addEventListener('click', () => {
            mostrarDetallesItem(producto, 'producto');
        });

        return lineaDiv;
    }

    function mostrarOcultarNoResultados({ productos, servicios }) {
        const hayResultados = productos.length > 0 || servicios.length > 0;
        
        if (noResults) {
            noResults.style.display = hayResultados ? 'none' : 'block';
        }
    }

    async function mostrarDetallesItem(item, tipo) {
        try {
            console.log(`🔍 Mostrando detalles del ${tipo}:`, {
                id: item.id,
                nombre: item.nombre,
                precio: item.precioNumerico
            });
            
            // Intentar obtener detalles actualizados del servidor
            const response = await fetch(`../../backend/controller/ProductoServicioController.php?accion=detalle&id=${encodeURIComponent(item.id)}`);
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && result.data.item) {
                    console.log('✅ Detalles actualizados del servidor');
                    mostrarModalDetalles(result.data.item, tipo);
                    return;
                }
            }
            
            console.log('⚠️ Usando datos locales');
            mostrarModalDetalles(item, tipo);
            
        } catch (error) {
            console.error('Error al cargar detalles:', error);
            console.log('⚠️ Usando datos locales por error de conexión');
            mostrarModalDetalles(item, tipo);
        }
    }

    function mostrarModalDetalles(item, tipo) {
        const modalId = 'modalDetalles';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = crearModal(modalId);
            document.body.appendChild(modal);
        }

        const precio = formatearPrecio(item.precioNumerico || item.precio || 0);
        const nombre = escapeHtml(item.nombre || 'Sin nombre');
        
        let contenidoEspecifico = '';
        let iconoTipo = '';
        let tituloTipo = '';

        if (tipo === 'producto') {
            tituloTipo = 'Producto';
            const stock = parseInt(item.cantidad || 0);
            let estadoStock, colorStock, estadoTexto;
            
            if (stock === 0) {
                estadoStock = 'Agotado';
                colorStock = 'text-danger';
                estadoTexto = 'Producto agotado';
            } else if (stock <= 5) {
                estadoStock = 'Stock Bajo';
                colorStock = 'text-warning';
                estadoTexto = `Quedan ${stock} unidades`;
            } else {
                estadoStock = 'Disponible';
                colorStock = 'text-success';
                estadoTexto = `${stock} unidades`;
            }
            
            contenidoEspecifico = `
                <p><strong>Stock:</strong> 
                <span class="modal-stock-info ${colorStock}">${estadoTexto}</span></p>
                <p><strong>Estado:</strong> 
                <span class="modal-stock-info ${colorStock}">${estadoStock}</span></p>
            `;
        } else {
            tituloTipo = 'Servicio';
            contenidoEspecifico = `
                <p><strong>Estado:</strong> 
                <span class="modal-stock-info text-success">Disponible</span></p>
                <p><strong>Horarios:</strong> Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                <p><strong>Atención:</strong> Sábados: 8:00 AM - 2:00 PM</p>
            `;
        }

        modal.querySelector('.modal-title').innerHTML = `${iconoTipo} Detalles del ${tituloTipo}`;
        modal.querySelector('.modal-body').innerHTML = `
            <div class="text-center mb-4">
                <div style="font-size: 3rem;">${iconoTipo}</div>
                <h4 class="text-primary">${nombre}</h4>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Categoría:</strong> ${tituloTipo}s Veterinarios</p>
                    ${contenidoEspecifico}
                </div>
                <div class="col-md-6">
                    <p><strong>Precio:</strong> 
                    <span class="modal-price">${precio}</span></p>
                    <p><strong>Código:</strong> ${escapeHtml(item.id || 'N/A')}</p>
                    <p><strong>Tipo:</strong> ${tituloTipo}</p>
                </div>
            </div>
            <div class="alert alert-info mt-3">
                <strong>💡 Información:</strong> Para ${tipo === 'producto' ? 'adquirir este producto' : 'agendar este servicio'}, 
                contacta con nuestra clínica o visítanos durante nuestros horarios de atención.
            </div>
        `;

        // Mostrar modal usando Bootstrap
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    function crearModal(id) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = id;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalles</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Contenido dinámico -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i>Cerrar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="contactarClinica()">
                            <i class="bi bi-whatsapp me-2"></i>📞 Contactar Clínica
                        </button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    // Función global para contactar clínica
    window.contactarClinica = function() {
        const mensaje = "¡Hola! Me interesa obtener más información sobre sus productos y servicios. ¿Podrían ayudarme?";
        const telefono = "50767532455"; // Reemplazar con el número real
        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    function mostrarError(mensaje) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorDiv && errorText) {
            errorText.textContent = mensaje;
            errorDiv.style.display = 'block';
            
            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
        
        console.error('❌ Error mostrado al usuario:', mensaje);
    }

    // Utilidades
    function formatearPrecio(precio) {
        const numero = parseFloat(precio) || 0;
        return new Intl.NumberFormat('es-PA', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(numero);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Función para recargar datos
    window.recargarDatos = async function() {
        try {
            mostrarCargando(true);
            terminoBusqueda = '';
            if (searchInput) searchInput.value = '';
            
            await cargarDatos();
            renderizarContenido();
            await cargarEstadisticas();
            
            // Resetear filtros
            filterButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector('[data-filter="all"]')?.classList.add('active');
            filtroActual = 'all';
            
            console.log('🔄 Datos recargados exitosamente');
            
        } catch (error) {
            console.error('Error al recargar datos:', error);
            mostrarError('Error al recargar los datos');
        } finally {
            mostrarCargando(false);
        }
    };


});
