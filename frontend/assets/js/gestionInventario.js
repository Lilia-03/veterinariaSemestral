document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const productoSelect = document.getElementById('productoSelect');
    const deleteProductSelect = document.getElementById('deleteProductSelect');
    const productInfo = document.getElementById('productInfo');
    const deleteProductInfo = document.getElementById('deleteProductInfo');
    const updateSection = document.getElementById('updateSection');
    const cantidadInput = document.getElementById('cantidadInput');
    const actualizarBtn = document.getElementById('actualizarBtn');
    const cerrarBtn = document.getElementById('cerrarBtn');
    const exportBtn = document.getElementById('exportBtn');
    const loading = document.getElementById('loading');
    const alertContainer = document.getElementById('alertContainer');
    
    // Elementos para agregar producto
    const addProductForm = document.getElementById('addProductForm');
    const clearAddFormBtn = document.getElementById('clearAddForm');
    
    // Elementos para eliminar producto
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    
    // Elementos para lista de productos
    const refreshListBtn = document.getElementById('refreshListBtn');
    const searchInput = document.getElementById('searchInput');
    const productsTableBody = document.getElementById('productsTableBody');
    
    // Modal
    const confirmModal = document.getElementById('confirmModal');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    const closeModal = document.querySelector('.close');

    // Variables globales
    let selectedProductId = null;
    let deleteProductId = null;
    let productosData = [];

    // Inicialización
    cargarProductos();

    // Event listeners principales
    productoSelect.addEventListener('change', mostrarInfoProducto);
    actualizarBtn.addEventListener('click', actualizarInventario);
    cerrarBtn.addEventListener('click', ocultarInfoProducto);
    exportBtn.addEventListener('click', exportarExcel);

    // Event listeners para agregar producto
    addProductForm.addEventListener('submit', agregarProducto);
    clearAddFormBtn.addEventListener('click', limpiarFormularioAgregar);

    // Event listeners para eliminar producto
    deleteProductSelect.addEventListener('change', mostrarInfoProductoEliminar);
    confirmDeleteBtn.addEventListener('click', mostrarModalConfirmacion);
    cancelDeleteBtn.addEventListener('click', ocultarInfoProductoEliminar);

    // Event listeners para lista de productos
    refreshListBtn.addEventListener('click', cargarTablaProductos);
    searchInput.addEventListener('input', filtrarProductos);

    // Event listeners para modal
    closeModal.addEventListener('click', cerrarModalConfirmacion);
    modalCancel.addEventListener('click', cerrarModalConfirmacion);
    modalConfirm.addEventListener('click', confirmarEliminacion);

    // Permitir actualizar con Enter
    cantidadInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            actualizarInventario();
        }
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            cerrarModalConfirmacion();
        }
    });

    // Inicializar validación de código en tiempo real
    inicializarValidacionCodigo();
/////////////////////////////////////////////////////////////////////////
    // Funciones principales
    function cargarProductos() {
        mostrarCarga(true);
        
        fetch('../InventarioController.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=obtenerProductos'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            console.log('Respuesta del servidor:', text);
            
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
                productosData = data.data;
                llenarSelectProductos(data.data);
                cargarTablaProductos();
            } else {
                mostrarAlerta('Error al cargar productos: ' + data.message, 'error');
            }
        })
        .catch(error => {
            mostrarCarga(false);
            console.error('Error completo:', error);
            mostrarAlerta('Error de conexión: ' + error.message, 'error');
        });
    }
////////////////////////////////////////////////////////////////
    function llenarSelectProductos(productos) {
        productoSelect.innerHTML = '<option value="">-- Seleccione un producto --</option>';
        deleteProductSelect.innerHTML = '<option value="">-- Seleccione un producto --</option>';
        
        productos.forEach(producto => {
            const option1 = document.createElement('option');
            option1.value = producto.IDITEM;
            option1.textContent = `${producto.NombreProducto} (Stock: ${producto.CantidadDisponible})`;
            option1.dataset.producto = JSON.stringify(producto);
            productoSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = producto.IDITEM;
            option2.textContent = `${producto.NombreProducto} (Stock: ${producto.CantidadDisponible})`;
            option2.dataset.producto = JSON.stringify(producto);
            deleteProductSelect.appendChild(option2);
        });
    }
//////////////////////////////////////////////////////////////
    function mostrarInfoProducto() {
        const selectedOption = productoSelect.options[productoSelect.selectedIndex];
        
        if (selectedOption.value === '') {
            ocultarInfoProducto();
            return;
        }

        const producto = JSON.parse(selectedOption.dataset.producto);
        selectedProductId = producto.IDITEM;
        
        document.getElementById('productCode').textContent = producto.IDITEM;
        document.getElementById('productName').textContent = producto.NombreProducto;
        const precio = producto.PrecioITEM || producto.PrecioUnitario || 0;
        document.getElementById('productPrice').textContent = `$${parseFloat(precio).toFixed(2)}`;
        document.getElementById('currentStock').textContent = producto.CantidadDisponible || 0;

        productInfo.style.display = 'block';
        updateSection.style.display = 'block';
    }
////////////////////////////////////////////////////////////
    function ocultarInfoProducto() {
        productInfo.style.display = 'none';
        updateSection.style.display = 'none';
        productoSelect.value = '';
        cantidadInput.value = '';
        selectedProductId = null;
    }
/////////////////////////////////////////////////////////////
    function mostrarInfoProductoEliminar() {
        const selectedOption = deleteProductSelect.options[deleteProductSelect.selectedIndex];
        
        if (selectedOption.value === '') {
            ocultarInfoProductoEliminar();
            return;
        }

        const producto = JSON.parse(selectedOption.dataset.producto);
        deleteProductId = producto.IDITEM;
        
        document.getElementById('deleteProductCode').textContent = producto.IDITEM;
        document.getElementById('deleteProductName').textContent = producto.NombreProducto;
        const precio = producto.PrecioITEM || producto.PrecioUnitario || 0;
        document.getElementById('deleteProductPrice').textContent = `$${parseFloat(precio).toFixed(2)}`;
        document.getElementById('deleteProductStock').textContent = producto.CantidadDisponible || 0;

        deleteProductInfo.style.display = 'block';
    }
//////////////////////////////////////////////////////
    function ocultarInfoProductoEliminar() {
        deleteProductInfo.style.display = 'none';
        deleteProductSelect.value = '';
        deleteProductId = null;
    }
//////////////////////////////////////////////////////////////////////////////
    function actualizarInventario() {
        const idItem = selectedProductId;
        const cantidad = cantidadInput.value;

        if (!idItem) {
            mostrarAlerta('Por favor seleccione un producto', 'error');
            return;
        }

        if (!cantidad || parseInt(cantidad) <= 0) {
            mostrarAlerta('Por favor ingrese una cantidad válida', 'error');
            return;
        }

        mostrarCarga(true);
        actualizarBtn.disabled = true;

        const formData = new FormData();
        formData.append('action', 'actualizarInventario');
        formData.append('idItem', idItem);
        formData.append('cantidad', cantidad);

        fetch('../InventarioController.php', {
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
            console.log('Respuesta actualización:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Error parsing JSON:', e);
                console.error('Respuesta recibida:', text);
                throw new Error('Respuesta inválida del servidor');
            }
            
            mostrarCarga(false);
            actualizarBtn.disabled = false;

            if (data.success) {
                mostrarAlerta('Inventario actualizado correctamente', 'success');
                cantidadInput.value = '';
                cargarProductos(); // Recargar para mostrar nuevos valores
            } else {
                // MEJORADO: Mostrar mensaje específico del servidor
                mostrarAlerta('Error: ' + (data.message || 'Error desconocido'), 'error');
            }
        })
        .catch(error => {
            mostrarCarga(false);
            actualizarBtn.disabled = false;
            console.error('Error:', error);
            
            // MEJORADO: Mensajes más específicos según el tipo de error
            let mensajeError = error.message;
            if (mensajeError.includes('producto no existe')) {
                mensajeError = 'El producto seleccionado no existe en la base de datos';
            }
            
            mostrarAlerta('Error: ' + mensajeError, 'error');
        });
    }
//////////////////////////////////////////////////////////////////
    function agregarProducto(e) {
        e.preventDefault();

        // Validar que todos los elementos existan antes de acceder a sus valores
        const codigoElement = document.getElementById('newProductCode');
        const nombreElement = document.getElementById('newProductName');
        const precioElement = document.getElementById('newProductPrice');
        const stockElement = document.getElementById('newProductStock');
        const descripcionElement = document.getElementById('newProductDescription');

        // Verificar que todos los elementos existen
        if (!codigoElement) {
            mostrarAlerta('Error: No se encontró el campo código', 'error');
            return;
        }
        if (!nombreElement) {
            mostrarAlerta('Error: No se encontró el campo nombre', 'error');
            return;
        }
        if (!precioElement) {
            mostrarAlerta('Error: No se encontró el campo precio', 'error');
            return;
        }
        if (!stockElement) {
            mostrarAlerta('Error: No se encontró el campo stock', 'error');
            return;
        }

        // Ahora obtener los valores de forma segura
        const codigo = codigoElement.value.trim();
        const nombre = nombreElement.value.trim();
        const precio = precioElement.value;
        const stock = stockElement.value;


        // Validaciones básicas en el frontend
        if (!codigo || !nombre || !precio || !stock) {
            mostrarAlerta('Complete todos los campos obligatorios', 'error');
            return;
        }

        // Validar formato del código (opcional)
        if (codigo.length < 3) {
            mostrarAlerta('El código debe tener al menos 3 caracteres', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('action', 'agregarProducto');
        formData.append('codigo', codigo);
        formData.append('nombre', nombre);
        formData.append('precio', precio);
        formData.append('stock', stock);

        mostrarCarga(true);

        fetch('../InventarioController.php', {
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
            console.log('Respuesta agregar producto:', text);
            
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
                mostrarAlerta('Producto agregado correctamente', 'success');
                limpiarFormularioAgregar();
                cargarProductos(); // Recargar lista de productos
                // Cambiar a la pestaña de lista de productos
                openTab({currentTarget: document.querySelector('[onclick*="listTab"]')}, 'listTab');
            } else {
                // MEJORADO: Mensajes más específicos
                let mensajeError = data.message || 'Error desconocido';
                if (mensajeError.includes('Ya existe un producto')) {
                    mensajeError = '⚠️ Ya existe un producto con ese código. Intente con otro código.';
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
////////////////////////////////////////////////////////////////////
    function limpiarFormularioAgregar() {
        addProductForm.reset();
        // Restablecer estilo del input de código
        const codigoInput = document.getElementById('newProductCode');
        codigoInput.style.borderColor = '#e1e5e9';
    }
///////////////////////////////////////////////////////////////////
    function mostrarModalConfirmacion() {
        // ACTUALIZADO: Solo verificar que el ID no esté vacío
        if (!deleteProductId) return;

        const producto = productosData.find(p => p.IDITEM === deleteProductId);
        if (!producto) return;

        document.getElementById('modalTitle').textContent = 'Confirmar Eliminación';
        document.getElementById('modalMessage').textContent = 
            `¿Está seguro de que desea eliminar el producto "${producto.NombreProducto}"? Esta acción no se puede deshacer.`;
        
        confirmModal.style.display = 'block';
    }
/////////////////////////////////////////////
    function cerrarModalConfirmacion() {
        confirmModal.style.display = 'none';
    }
////////////////////////////////////////////////////////////////////////
    function confirmarEliminacion() {
        if (!deleteProductId) return;

        mostrarCarga(true);
        cerrarModalConfirmacion();

        const formData = new FormData();
        formData.append('action', 'eliminarProducto');
        formData.append('idItem', deleteProductId);

        fetch('../InventarioController.php', {
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
            console.log('Respuesta eliminar producto:', text);
            
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
                mostrarAlerta('Producto eliminado correctamente', 'success');
                ocultarInfoProductoEliminar();
                cargarProductos(); // Recargar lista de productos
                // Cambiar a la pestaña de lista de productos
                openTab({currentTarget: document.querySelector('[onclick*="listTab"]')}, 'listTab');
            } else {
                // MEJORADO: Mensajes más específicos
                let mensajeError = data.message || 'Error desconocido';
                if (mensajeError.includes('movimientos registrados')) {
                    mensajeError = '⚠️ No se puede eliminar el producto porque tiene ventas registradas';
                } else if (mensajeError.includes('no existe')) {
                    mensajeError = '⚠️ El producto no existe en la base de datos';
                }
                mostrarAlerta('Error: ' + mensajeError, 'error');
            }
        })
        .catch(error => {
            mostrarCarga(false);
            console.error('Error:', error);
            
            // MEJORADO: Mensajes más específicos según el tipo de error
            let mensajeError = error.message;
            if (mensajeError.includes('movimientos registrados')) {
                mensajeError = 'No se puede eliminar el producto porque tiene ventas registradas';
            } else if (mensajeError.includes('producto no existe')) {
                mensajeError = 'El producto no existe en la base de datos';
            }
            
            mostrarAlerta('Error: ' + mensajeError, 'error');
        });
    }
/////////////////////////////////////////////////////////////////////
    function cargarTablaProductos() {
        if (!productosData || productosData.length === 0) {
            cargarProductos();
            return;
        }

        const tbody = productsTableBody;
        tbody.innerHTML = '';

        productosData.forEach(producto => {
            const row = tbody.insertRow();
            
            // Determinar estado del stock
            let stockClass, stockText;
            const stock = parseInt(producto.CantidadDisponible || 0);
            if (stock <= 5) {
                stockClass = 'stock-low';
                stockText = 'Bajo';
            } else if (stock <= 15) {
                stockClass = 'stock-medium';
                stockText = 'Medio';
            } else {
                stockClass = 'stock-high';
                stockText = 'Alto';
            }

            const precio = parseFloat(producto.PrecioITEM || 0);

            row.innerHTML = `
                <td>${producto.IDITEM}</td>
                <td>${producto.NombreProducto}</td>
                <td>$${precio.toFixed(2)}</td>
                <td class="${stockClass}">${stock}</td>
                <td>${stockText}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editarProducto('${producto.IDITEM}')">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarProductoDirecto('${producto.IDITEM}')">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
        });
    }
////////////////////////////////////////////////////////////////////
    function filtrarProductos() {
        const termino = searchInput.value.toLowerCase();
        
        if (!termino) {
            cargarTablaProductos();
            return;
        }

        const productosFiltrados = productosData.filter(producto => 
            producto.NombreProducto.toLowerCase().includes(termino) ||
            producto.IDITEM.toString().toLowerCase().includes(termino)
        );

        const tbody = productsTableBody;
        tbody.innerHTML = '';

        productosFiltrados.forEach(producto => {
            const row = tbody.insertRow();
            
            // Determinar estado del stock
            let stockClass, stockText;
            const stock = parseInt(producto.CantidadDisponible || 0);
            if (stock <= 5) {
                stockClass = 'stock-low';
                stockText = 'Bajo';
            } else if (stock <= 15) {
                stockClass = 'stock-medium';
                stockText = 'Medio';
            } else {
                stockClass = 'stock-high';
                stockText = 'Alto';
            }

            const precio = parseFloat(producto.PrecioITEM || 0);

            row.innerHTML = `
                <td>${producto.IDITEM}</td>
                <td>${producto.NombreProducto}</td>
                <td>$${precio.toFixed(2)}</td>
                <td class="${stockClass}">${stock}</td>
                <td>${stockText}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editarProducto('${producto.IDITEM}')">
                        ✏️ Actualizar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarProductoDirecto('${producto.IDITEM}')">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
        });
    }
/////////////////////////////////////////////////////////////
    // Funciones globales para los botones de la tabla
    window.editarProducto = function(idItem) {
        // Cambiar a la pestaña de actualizar y seleccionar el producto
        openTab({currentTarget: document.querySelector('[onclick*="updateTab"]')}, 'updateTab');
        productoSelect.value = idItem;
        mostrarInfoProducto();
    };

    window.eliminarProductoDirecto = function(idItem) {
        deleteProductId = idItem;
        mostrarModalConfirmacion();
    };
/////////////////////////////////////////////////////////////////////
    // Función para cambiar de pestaña 
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
            cargarTablaProductos();
        }
    };
/////////////////////////////////////////////////////////////////////////////////
    function exportarExcel() {
        exportBtn.disabled = true;
        exportBtn.textContent = '⏳ Generando...';

        try {
            const timestamp = new Date().getTime();
            const url = `../InventarioController.php?action=exportarExcel&t=${timestamp}`;
            
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
//////////////////////////////////////////////////////////////////////
    // NUEVA FUNCIÓN: Validación de código en tiempo real
    function inicializarValidacionCodigo() {
        const codigoInput = document.getElementById('newProductCode');
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
////////////////////////////////////////////////////////////////////////////////
    // NUEVA FUNCIÓN: Verificar si existe el código
    function verificarCodigo(codigo) {
        const formData = new FormData();
        formData.append('action', 'validarCodigoProducto');
        formData.append('codigo', codigo);

        fetch('../InventarioController.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const codigoInput = document.getElementById('newProductCode');
            
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