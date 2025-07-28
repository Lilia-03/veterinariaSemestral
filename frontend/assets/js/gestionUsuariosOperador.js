// gestionUsuariosOperador.js - Versión limitada para trabajadores/operadores
// Solo pueden gestionar clientes

// Elementos del DOM
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const searchUsersInput = document.getElementById('searchUsersInput');
const usersTableBody = document.getElementById('usersTableBody');
const addUserForm = document.getElementById('addUserForm');
const clearAddUserForm = document.getElementById('clearAddUserForm');
const roleSelect = document.getElementById('role');
const alertContainer = document.getElementById('alertContainer');
const loading = document.getElementById('loading');
const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));

// Variables globales
let usuariosData = [];
let rolesData = [];
let currentEditingUserId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    configurarInterfazOperador();
    cargarUsuarios();
    cargarRoles();
});

// Configurar interfaz específica para operador
function configurarInterfazOperador() {
    // Ocultar pestaña de roles si existe
    const rolesTab = document.querySelector('[data-bs-target="#rolesTab"]');
    if (rolesTab) {
        rolesTab.closest('.nav-item').style.display = 'none';
    }

    // Mostrar siempre campos de cliente en formulario de agregar
    const clienteFields = document.getElementById('clienteFields');
    if (clienteFields) {
        clienteFields.style.display = 'flex';
    }

    // Hacer cédula obligatoria para clientes
    const clientIdField = document.getElementById('clientId');
    if (clientIdField) {
        clientIdField.required = true;
        clientIdField.placeholder = "Cédula del cliente (obligatorio)";
    }

    // Hacer teléfono y dirección obligatorios
    const telefonoField = document.getElementById('telefono');
    const direccionField = document.getElementById('direccion');
    if (telefonoField) telefonoField.required = true;
    if (direccionField) direccionField.required = true;

    // Actualizar títulos
    const headerTitle = document.querySelector('.header-section h1');
    if (headerTitle) {
        headerTitle.innerHTML = '👥 Gestión de Clientes';
    }

    const headerSubtitle = document.querySelector('.header-section p');
    if (headerSubtitle) {
        headerSubtitle.textContent = 'Sistema de administración de clientes CliniPet';
    }

    // Actualizar texto de pestañas
    const listTab = document.querySelector('#list-tab');
    if (listTab) {
        listTab.innerHTML = '📋 Lista de Clientes';
    }

    const addTab = document.querySelector('#add-tab');
    if (addTab) {
        addTab.innerHTML = '➕ Agregar Cliente';
    }
}

// Event Listeners
if (refreshUsersBtn) refreshUsersBtn.addEventListener('click', cargarUsuarios);
if (searchUsersInput) searchUsersInput.addEventListener('input', filtrarUsuarios);
if (addUserForm) addUserForm.addEventListener('submit', registrarUsuario);
if (clearAddUserForm) clearAddUserForm.addEventListener('click', limpiarFormularioUsuario);

// Funciones principales
function cargarUsuarios() {
    mostrarCarga(true);
    
    fetch('../../backend/controller/gestionUsuariosController.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=obtenerUsuarios'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        mostrarCarga(false);
        
        if (data.success) {
            // Filtrar solo clientes
            const clientes = data.data.filter(usuario => 
                usuario.NombreRol && usuario.NombreRol.toLowerCase() === 'cliente'
            );
            usuariosData = clientes;
            renderizarTablaUsuarios();
            
            if (clientes.length === 0) {
                mostrarAlerta('No hay clientes registrados en el sistema', 'warning');
            } else {
                mostrarAlerta(`${clientes.length} clientes cargados correctamente`, 'success');
            }
        } else {
            mostrarAlerta('Error al cargar clientes: ' + data.message, 'error');
        }
    })
    .catch(error => {
        mostrarCarga(false);
        console.error('Error:', error);
        mostrarAlerta('Error de conexión: ' + error.message, 'error');
    });
}

function cargarRoles() {
    mostrarCarga(true);
    
    fetch('../../backend/controller/gestionUsuariosController.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=obtenerRoles'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data) {
            throw new Error('No se recibieron datos del servidor');
        }
        
        if (data.success) {
            // Filtrar solo rol Cliente
            const clienteRole = data.data.filter(rol => 
                rol.NombreRol && rol.NombreRol.toLowerCase() === 'cliente'
            );
            rolesData = clienteRole;
            llenarSelectRoles();
            
            if (clienteRole.length === 0) {
                mostrarAlerta('No se encontró el rol Cliente en el sistema', 'error');
            }
        } else {
            throw new Error(data.message || 'Error desconocido al obtener roles');
        }
    })
    .catch(error => {
        console.error('Error en cargarRoles:', error);
        mostrarAlerta(`Error al cargar roles: ${error.message}`, 'error');
    })
    .finally(() => {
        mostrarCarga(false);
    });
}

function llenarSelectRoles() {
    if (roleSelect) {
        roleSelect.innerHTML = '<option value="">-- Seleccione un rol --</option>';
        rolesData.forEach(rol => {
            const option = document.createElement('option');
            option.value = rol.RolID;
            option.textContent = rol.NombreRol;
            roleSelect.appendChild(option);
        });
        
        // Pre-seleccionar Cliente si hay solo uno
        if (rolesData.length === 1) {
            roleSelect.value = rolesData[0].RolID;
            roleSelect.dispatchEvent(new Event('change'));
        }
    }

    // Llenar select del formulario de editar usuario
    const editRoleSelect = document.getElementById('editRole');
    if (editRoleSelect) {
        const valorActual = editRoleSelect.value;
        editRoleSelect.innerHTML = '<option value="">-- Seleccione un rol --</option>';
        rolesData.forEach(rol => {
            const option = document.createElement('option');
            option.value = rol.RolID;
            option.textContent = rol.NombreRol;
            if (rol.RolID == valorActual) {
                option.selected = true;
            }
            editRoleSelect.appendChild(option);
        });
    }
}

function renderizarTablaUsuarios() {
    if (!usersTableBody) return;
    
    usersTableBody.innerHTML = '';
    
    if (usuariosData.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-users fa-2x mb-2"></i><br>
                    No hay clientes registrados
                </td>
            </tr>
        `;
        return;
    }
    
    usuariosData.forEach(usuario => {
        const tr = document.createElement('tr');
        
        // Botón para cambiar estado
        const estadoActual = usuario.Activo == 1 || usuario.Activo === true;
        const badgeClass = estadoActual ? 'bg-success' : 'bg-danger';
        const estadoTexto = estadoActual ? 'Activo' : 'Inactivo';
        
        tr.innerHTML = `
            <td><span class="badge bg-secondary">${usuario.UsuarioID}</span></td>
            <td><strong>${usuario.NombreUsuario}</strong></td>
            <td>${usuario.NombreCompleto}</td>
            <td><span class="badge bg-info">Cliente</span></td>
            <td>
                <span class="badge ${badgeClass}">${estadoTexto}</span>
            </td>
            <td>${usuario.UltimoAcceso || 'Nunca'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editarUsuarioHandler(${usuario.UsuarioID})" title="Editar cliente">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-${estadoActual ? 'warning' : 'success'}" 
                            onclick="cambiarEstadoUsuarioDirecto(${usuario.UsuarioID}, ${estadoActual})" 
                            title="${estadoActual ? 'Desactivar' : 'Activar'} cliente">
                        <i class="bi bi-${estadoActual ? 'eye-slash' : 'eye'}"></i>
                    </button>
                </div>
            </td>
        `;
        usersTableBody.appendChild(tr);
    });
}

function filtrarUsuarios() {
    const termino = searchUsersInput.value.toLowerCase();
    
    if (!usersTableBody) return;
    
    if (!termino) {
        renderizarTablaUsuarios();
        return;
    }

    const usuariosFiltrados = usuariosData.filter(usuario => 
        usuario.NombreUsuario.toLowerCase().includes(termino) ||
        usuario.NombreCompleto.toLowerCase().includes(termino) ||
        (usuario.CedulaCliente && usuario.CedulaCliente.includes(termino)) ||
        usuario.UsuarioID.toString().includes(termino)
    );

    // Actualizar temporalmente usuariosData para el renderizado
    const usuariosOriginal = [...usuariosData];
    usuariosData = usuariosFiltrados;
    renderizarTablaUsuarios();
    usuariosData = usuariosOriginal;
}

function registrarUsuario(e) {
    e.preventDefault();
    
    // Validar campos específicos de cliente
    const cedulaCliente = document.getElementById('clientId').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    
    if (!cedulaCliente) {
        mostrarAlerta('La cédula del cliente es obligatoria', 'error');
        return;
    }
    
    if (!telefono) {
        mostrarAlerta('El teléfono es obligatorio para clientes', 'error');
        return;
    }
    
    if (!direccion) {
        mostrarAlerta('La dirección es obligatoria para clientes', 'error');
        return;
    }
    
    // Get form values
    const formData = new FormData(addUserForm);
    formData.append('action', 'registrarUsuario');
    
    // Asegurar que se envíen los campos de cliente
    formData.append('telefono', telefono);
    formData.append('direccion', direccion);
    formData.append('cedulaCliente', cedulaCliente);

    mostrarCarga(true);

    fetch('../../backend/controller/gestionUsuariosController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch {
                    throw new Error(text || 'Error de servidor');
                }
            });
        }
        return response.json();
    })
    .then(data => {
        mostrarCarga(false);
        if (data.success) {
            mostrarAlerta('Cliente registrado correctamente', 'success');
            addUserForm.reset();
            cargarUsuarios();
            
            // Cambiar a pestaña de lista
            document.getElementById('list-tab')?.click();
            
            // Volver a mostrar campos de cliente
            const clienteFields = document.getElementById('clienteFields');
            if (clienteFields) {
                clienteFields.style.display = 'flex';
            }
        } else {
            mostrarAlerta('Error: ' + (data.message || 'Error desconocido'), 'error');
        }
    })
    .catch(error => {
        mostrarCarga(false);
        mostrarAlerta('Error: ' + error.message, 'error');
    });
}

function limpiarFormularioUsuario() {
    if (addUserForm) {
        addUserForm.reset();
        
        // Mostrar campos de cliente
        const clienteFields = document.getElementById('clienteFields');
        if (clienteFields) {
            clienteFields.style.display = 'flex';
        }
        
        // Pre-seleccionar rol Cliente si existe
        if (roleSelect && rolesData.length > 0) {
            roleSelect.value = rolesData[0].RolID;
        }
    }
}

// Función para editar usuario
window.editarUsuarioHandler = function(usuarioId) {
    console.log('Editando cliente:', usuarioId);
    
    const usuario = usuariosData.find(u => u.UsuarioID == usuarioId);
    if (!usuario) {
        console.error('Cliente no encontrado:', usuarioId);
        mostrarAlerta('Cliente no encontrado', 'error');
        return;
    }

    currentEditingUserId = usuarioId;
    
    // Verificar que todos los elementos existen antes de asignar valores
    const elements = {
        'editUserId': usuarioId,
        'editUsername': usuario.NombreUsuario,
        'editEmail': usuario.Email,
        'editFullname': usuario.NombreCompleto,
        'editClientId': usuario.CedulaCliente || '',
        'editStatus': usuario.Activo ? '1' : '0',
        'editTelefono': usuario.Telefono || '',
        'editDireccion': usuario.Direccion || '',
        'editPassword': '' // Limpiar el campo de contraseña
    };

    // Asignar valores verificando que el elemento existe
    for (const [elementId, value] of Object.entries(elements)) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        } else {
            console.error('Elemento no encontrado:', elementId);
        }
    }
    
    // Llenar select de roles (solo Cliente)
    const editRoleSelect = document.getElementById('editRole');
    if (editRoleSelect && rolesData.length > 0) {
        editRoleSelect.innerHTML = '';
        rolesData.forEach(rol => {
            const option = document.createElement('option');
            option.value = rol.RolID;
            option.textContent = rol.NombreRol;
            option.selected = rol.RolID == usuario.RolID;
            editRoleSelect.appendChild(option);
        });
    }

    // Mostrar campos de cliente en modal de edición
    const editClienteFields = document.getElementById('editClienteFields');
    if (editClienteFields) {
        editClienteFields.style.display = 'flex';
    }

    // Mostrar el modal
    if (typeof editUserModal !== 'undefined') {
        editUserModal.show();
    } else {
        console.error('Modal de edición no definido');
    }
};

// Función para guardar cambios de usuario
document.getElementById('saveUserChangesBtn')?.addEventListener('click', function() {
    console.log('Guardando cambios del cliente...');
    
    // Validar campos requeridos
    const email = document.getElementById('editEmail')?.value?.trim();
    const fullname = document.getElementById('editFullname')?.value?.trim();
    const userId = document.getElementById('editUserId')?.value;
    const cedulaCliente = document.getElementById('editClientId')?.value?.trim();
    const telefono = document.getElementById('editTelefono')?.value?.trim();
    const direccion = document.getElementById('editDireccion')?.value?.trim();
    
    if (!email || !fullname || !userId || !cedulaCliente) {
        mostrarAlerta('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    if (!telefono) {
        mostrarAlerta('El teléfono es obligatorio para clientes', 'error');
        return;
    }
    
    if (!direccion) {
        mostrarAlerta('La dirección es obligatoria para clientes', 'error');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarAlerta('Por favor ingrese un email válido', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'actualizarUsuario');
    formData.append('idUsuario', userId);
    formData.append('email', email);
    formData.append('nombreCompleto', fullname);
    formData.append('rolId', document.getElementById('editRole')?.value || '');
    formData.append('cedulaCliente', cedulaCliente);
    formData.append('activo', document.getElementById('editStatus')?.value || '1');
    formData.append('telefono', telefono);
    formData.append('direccion', direccion);
    
    const nuevaPassword = document.getElementById('editPassword')?.value?.trim();
    if (nuevaPassword) {
        if (nuevaPassword.length < 6) {
            mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        formData.append('password', nuevaPassword);
    }

    // Debug: mostrar datos que se envían
    console.log('Datos a enviar:');
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    mostrarCarga(true);

    fetch('../../backend/controller/gestionUsuariosController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        console.log('Response text:', text);
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.error('Response was:', text);
            throw new Error('Respuesta del servidor no es JSON válido');
        }
    })
    .then(data => {
        mostrarCarga(false);
        
        if (data.success) {
            mostrarAlerta('Cliente actualizado correctamente', 'success');
            
            // Cerrar el modal
            if (typeof editUserModal !== 'undefined') {
                editUserModal.hide();
            }
            
            // Recargar la lista de usuarios para reflejar los cambios
            cargarUsuarios();
            
            // Limpiar el formulario
            document.getElementById('editPassword').value = '';
        } else {
            mostrarAlerta('Error: ' + (data.message || 'Error desconocido'), 'error');
        }
    })
    .catch(error => {
        mostrarCarga(false);
        console.error('Error completo:', error);
        mostrarAlerta('Error de conexión: ' + error.message, 'error');
    });
});

// Función para cambiar estado directamente desde la tabla
window.cambiarEstadoUsuarioDirecto = function(usuarioId, estadoActual) {
    const nuevoEstado = !estadoActual;
    const textoEstado = nuevoEstado ? 'activar' : 'desactivar';
    
    if (confirm(`¿Está seguro de que desea ${textoEstado} este cliente?`)) {
        const formData = new FormData();
        formData.append('action', 'cambiarEstadoUsuario');
        formData.append('idUsuario', usuarioId);
        formData.append('nuevoEstado', nuevoEstado ? '1' : '0');
        
        mostrarCarga(true);
        
        fetch('../../backend/controller/gestionUsuariosController.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            mostrarCarga(false);
            
            if (data.success) {
                mostrarAlerta(`Cliente ${textoEstado} correctamente`, 'success');
                // Recargar la lista para mostrar el cambio
                cargarUsuarios();
            } else {
                mostrarAlerta('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            mostrarCarga(false);
            console.error('Error:', error);
            mostrarAlerta('Error de conexión: ' + error.message, 'error');
        });
    }
};

// Mostrar/ocultar campos de cliente según el rol seleccionado (siempre mostrar para operadores)
document.getElementById('role')?.addEventListener('change', function() {
    const clienteFields = document.getElementById('clienteFields');
    const telefono = document.getElementById('telefono');
    const direccion = document.getElementById('direccion');
    const clientId = document.getElementById('clientId');
    
    // Para operadores, siempre mostrar campos de cliente
    if (clienteFields) {
        clienteFields.style.display = 'flex';
    }
    if (telefono) telefono.required = true;
    if (direccion) direccion.required = true;
    if (clientId) clientId.required = true;
});

// Para el modal de edición (siempre Cliente)
document.getElementById('editRole')?.addEventListener('change', function() {
    const editClienteFields = document.getElementById('editClienteFields');
    // Para operadores, siempre mostrar campos de cliente
    if (editClienteFields) {
        editClienteFields.style.display = 'flex';
    }
});

function mostrarCarga(mostrar) {
    if (loading) loading.style.display = mostrar ? 'block' : 'none';
}

function mostrarAlerta(mensaje, tipo) {
    if (!alertContainer) return;
    
    alertContainer.innerHTML = '';
    
    const alertClass = tipo === 'error' ? 'danger' : (tipo === 'warning' ? 'warning' : 'success');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${alertClass} alert-dismissible fade show`;
    alert.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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

// Funciones de debug para testing
window.testConnection = function() {
    console.log('Probando conexión...');
    
    fetch('../../backend/controller/gestionUsuariosController.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=obtenerRoles'
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.text();
    })
    .then(text => {
        console.log('Response text:', text);
        try {
            const data = JSON.parse(text);
            console.log('Parsed data:', data);
            alert('Test exitoso: Conexión funcionando');
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.error('Response was:', text);
            alert('Error en respuesta del servidor');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión: ' + error.message);
    });
};

window.createDebugButtons = function() {
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.top = '10px';
    debugDiv.style.right = '10px';
    debugDiv.style.background = '#f0f0f0';
    debugDiv.style.padding = '10px';
    debugDiv.style.border = '1px solid #ccc';
    debugDiv.style.zIndex = '9999';
    
    debugDiv.innerHTML = `
        <h4>Debug Tools Operador</h4>
        <button onclick="testConnection()" style="margin:2px;">Test Conexión</button><br>
        <button onclick="cargarUsuarios()" style="margin:2px;">Cargar Clientes</button><br>
        <button onclick="cargarRoles()" style="margin:2px;">Cargar Roles</button><br>
        <button onclick="console.log('Clientes:', usuariosData)" style="margin:2px;">Ver Clientes</button><br>
        <button onclick="this.parentElement.remove()" style="margin:2px;">Cerrar</button>
    `;
    
    document.body.appendChild(debugDiv);
};

console.log('✅ Sistema de gestión de clientes para operadores cargado correctamente');
console.log('Ejecuta createDebugButtons() para mostrar herramientas de debug');