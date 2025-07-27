// Elementos del DOM
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const searchUsersInput = document.getElementById('searchUsersInput');
const usersTableBody = document.getElementById('usersTableBody');
const addUserForm = document.getElementById('addUserForm');
const clearAddUserForm = document.getElementById('clearAddUserForm');
const roleSelect = document.getElementById('role');
const rolesList = document.getElementById('rolesList');
const addRoleBtn = document.getElementById('addRoleBtn');
const roleInfo = document.getElementById('roleInfo');
const saveRoleBtn = document.getElementById('saveRoleBtn');
const deleteRoleBtn = document.getElementById('deleteRoleBtn');
const permissionsContainer = document.getElementById('permissionsContainer');
const alertContainer = document.getElementById('alertContainer');
const loading = document.getElementById('loading');
const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
const addRoleModal = new bootstrap.Modal(document.getElementById('addRoleModal'));

// Variables globales
let usuariosData = [];
let rolesData = [];
let currentEditingUserId = null;
let currentEditingRoleId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarUsuarios();
    cargarRoles();
});

// Event Listeners
if (refreshUsersBtn) refreshUsersBtn.addEventListener('click', cargarUsuarios);
if (searchUsersInput) searchUsersInput.addEventListener('input', filtrarUsuarios);
if (addUserForm) addUserForm.addEventListener('submit', registrarUsuario);
if (clearAddUserForm) clearAddUserForm.addEventListener('click', limpiarFormularioUsuario);
if (addRoleBtn) addRoleBtn.addEventListener('click', () => addRoleModal.show());
if (rolesList) rolesList.addEventListener('change', mostrarInfoRol);
if (saveRoleBtn) saveRoleBtn.addEventListener('click', guardarRol);
if (deleteRoleBtn) deleteRoleBtn.addEventListener('click', confirmarEliminarRol);

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
            usuariosData = data.data;
            renderizarTablaUsuarios();
        } else {
            mostrarAlerta('Error al cargar usuarios: ' + data.message, 'error');
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
            rolesData = data.data || [];
            llenarSelectRoles();
            
            if (rolesData.length === 0) {
                mostrarAlerta('No se encontraron roles en el sistema', 'warning');
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
    }

    if (rolesList) {
        rolesList.innerHTML = '<option value="">-- Seleccione un rol --</option>';
        rolesData.forEach(rol => {
            const option = document.createElement('option');
            option.value = rol.RolID;
            option.textContent = rol.NombreRol;
            rolesList.appendChild(option);
        });
    }
}

// Función mejorada para renderizar la tabla con botones de estado
function renderizarTablaUsuarios() {
    if (!usersTableBody) return;
    
    usersTableBody.innerHTML = '';
    
    usuariosData.forEach(usuario => {
        const tr = document.createElement('tr');
        
        // Botón para cambiar estado
        const estadoActual = usuario.Activo == 1 || usuario.Activo === true;
        const badgeClass = estadoActual ? 'bg-success' : 'bg-danger';
        const estadoTexto = estadoActual ? 'Activo' : 'Inactivo';
        const botonEstado = `
            <button class="btn btn-sm ${estadoActual ? 'btn-outline-danger' : 'btn-outline-success'}" 
                    onclick="cambiarEstadoUsuarioDirecto(${usuario.UsuarioID}, ${estadoActual})"
                    title="${estadoActual ? 'Desactivar usuario' : 'Activar usuario'}">
                <i class="bi bi-${estadoActual ? 'toggle-on' : 'toggle-off'}"></i>
            </button>
        `;
        
        tr.innerHTML = `
            <td>${usuario.UsuarioID}</td>
            <td>${usuario.NombreUsuario}</td>
            <td>${usuario.NombreCompleto}</td>
            <td>${usuario.NombreRol}</td>
            <td>
                <span class="badge ${badgeClass}">${estadoTexto}</span>
                ${botonEstado}
            </td>
            <td>${usuario.UltimoAcceso || 'Nunca'}</td>
            <td>
                <button class="btn btn-sm btn-gradient-primary" onclick="editarUsuarioHandler(${usuario.UsuarioID})" title="Editar usuario">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-gradient-danger" onclick="confirmarEliminarUsuarioHandler(${usuario.UsuarioID}, '${usuario.NombreUsuario}')" title="Eliminar usuario">
                    <i class="bi bi-trash"></i>
                </button>
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
        usuario.NombreRol.toLowerCase().includes(termino) ||
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
    
    // Get form values
    const formData = new FormData(addUserForm);
    formData.append('action', 'registrarUsuario');
    
    // For client role, add additional fields
    if (formData.get('role') == 3) {
        formData.append('telefono', document.getElementById('telefono').value);
        formData.append('direccion', document.getElementById('direccion').value);
    }

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
            mostrarAlerta('Usuario registrado correctamente', 'success');
            addUserForm.reset();
            cargarUsuarios();
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
    }
}

function eliminarUsuario() {
    if (!currentEditingUserId) return;

    mostrarCarga(true);
    confirmModal.hide();

    const formData = new FormData();
    formData.append('action', 'eliminarUsuario');
    formData.append('usuarioId', currentEditingUserId);

    fetch('../../backend/controller/gestionUsuariosController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        mostrarCarga(false);
        
        if (data.success) {
            mostrarAlerta('Usuario eliminado correctamente', 'success');
            cargarUsuarios();
        } else {
            // Manejar específicamente el error de eliminación de admin/cliente
            if (data.message.includes('No se puede eliminar un administrador ni un cliente')) {
                mostrarAlerta('No se pueden eliminar usuarios con rol Administrador o Cliente', 'error');
            } else {
                mostrarAlerta('Error: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        mostrarCarga(false);
        console.error('Error:', error);
        mostrarAlerta('Error de conexión: ' + error.message, 'error');
    });
}

function mostrarInfoRol() {
    const rolId = rolesList.value;
    if (!rolId) {
        roleInfo.style.display = 'none';
        permissionsContainer.innerHTML = '<p class="text-muted">Seleccione un rol para ver/editar sus permisos</p>';
        return;
    }

    const rol = rolesData.find(r => r.RolID == rolId);
    if (!rol) return;

    currentEditingRoleId = rolId;
    
    document.getElementById('roleName').value = rol.NombreRol;
    document.getElementById('roleDescription').value = rol.Descripcion || '';
    
    roleInfo.style.display = 'block';
    
    // Cargar permisos del rol
    cargarPermisosRol(rolId);
}

function cargarPermisosRol(rolId) {
    fetch('../../backend/controller/gestionUsuariosController.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=obtenerPermisosRol&rolId=' + rolId
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            renderizarPermisos(data.data);
        } else {
            mostrarAlerta('Error al cargar permisos: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar permisos: ' + error.message, 'error');
    });
}

function renderizarPermisos(permisos) {
    if (!permissionsContainer) return;
    
    permissionsContainer.innerHTML = '<h6>Permisos asignados:</h6>';
    
    permisos.forEach(permiso => {
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" id="perm-${permiso.PermisoID}" 
                   value="${permiso.PermisoID}" checked>
            <label class="form-check-label" for="perm-${permiso.PermisoID}">
                ${permiso.NombrePermiso} (${permiso.Modulo})
            </label>
        `;
        permissionsContainer.appendChild(div);
    });
}

function guardarRol() {
    if (!currentEditingRoleId) return;

    const nombre = document.getElementById('roleName').value.trim();
    const descripcion = document.getElementById('roleDescription').value.trim();

    if (!nombre) {
        mostrarAlerta('El nombre del rol es requerido', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'actualizarPermisosRol');
    formData.append('rolId', currentEditingRoleId);
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);

    // Obtener permisos seleccionados
    const permisosSeleccionados = [];
    document.querySelectorAll('#permissionsContainer input[type="checkbox"]:checked').forEach(checkbox => {
        permisosSeleccionados.push(checkbox.value);
    });
    formData.append('permisos', JSON.stringify(permisosSeleccionados));

    mostrarCarga(true);

    fetch('../../backend/controller/gestionUsuariosController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        mostrarCarga(false);
        
        if (data.success) {
            mostrarAlerta('Rol actualizado correctamente', 'success');
            cargarRoles();
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

function confirmarEliminarRol() {
    if (!currentEditingRoleId) return;
    
    const rol = rolesData.find(r => r.RolID == currentEditingRoleId);
    if (!rol) return;
    
    document.getElementById('confirmModalLabel').textContent = 'Confirmar Eliminación';
    document.getElementById('confirmModalMessage').textContent = 
        `¿Está seguro de que desea eliminar el rol "${rol.NombreRol}"? Esta acción no se puede deshacer.`;
    
    document.getElementById('confirmActionBtn').onclick = eliminarRol;
    
    confirmModal.show();
}

function eliminarRol() {
    if (!currentEditingRoleId) return;

    mostrarCarga(true);
    confirmModal.hide();

    const formData = new FormData();
    formData.append('action', 'eliminarRol');
    formData.append('rolId', currentEditingRoleId);

    fetch('../../backend/controller/gestionUsuariosController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        mostrarCarga(false);
        
        if (data.success) {
            mostrarAlerta('Rol eliminado correctamente', 'success');
            cargarRoles();
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

// Función para editar usuario
window.editarUsuarioHandler = function(usuarioId) {
    console.log('Editando usuario:', usuarioId);
    
    const usuario = usuariosData.find(u => u.UsuarioID == usuarioId);
    if (!usuario) {
        console.error('Usuario no encontrado:', usuarioId);
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
    
    // Llenar select de roles
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
    } else {
        console.error('Select de roles no encontrado o no hay datos de roles');
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
    console.log('Guardando cambios del usuario...');
    
    // Validar campos requeridos
    const email = document.getElementById('editEmail')?.value?.trim();
    const fullname = document.getElementById('editFullname')?.value?.trim();
    const userId = document.getElementById('editUserId')?.value;
    
    if (!email || !fullname || !userId) {
        mostrarAlerta('Por favor complete todos los campos requeridos', 'error');
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
    formData.append('cedulaCliente', document.getElementById('editClientId')?.value?.trim() || '');
    formData.append('activo', document.getElementById('editStatus')?.value || '1');
    
    const nuevaPassword = document.getElementById('editPassword')?.value?.trim();
    if (nuevaPassword) {
        if (nuevaPassword.length < 6) {
            mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        formData.append('password', nuevaPassword);
    }

    // Campos adicionales para clientes
    const telefono = document.getElementById('editTelefono')?.value?.trim();
    const direccion = document.getElementById('editDireccion')?.value?.trim();
    
    if (telefono) {
        formData.append('telefono', telefono);
    }
    if (direccion) {
        formData.append('direccion', direccion);
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
            mostrarAlerta('Usuario actualizado correctamente', 'success');
            
            // Cerrar el modal
            if (typeof editUserModal !== 'undefined') {
                editUserModal.hide();
            }
            
            // IMPORTANTE: Recargar la lista de usuarios para reflejar los cambios
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

// Función para confirmar eliminación de usuario
window.confirmarEliminarUsuarioHandler = function(usuarioId, nombreUsuario) {
    currentEditingUserId = usuarioId;
    
    document.getElementById('confirmModalLabel').textContent = 'Confirmar Eliminación';
    document.getElementById('confirmModalMessage').textContent = 
        `¿Está seguro de que desea eliminar el usuario "${nombreUsuario}"? Esta acción no se puede deshacer.`;
    
    document.getElementById('confirmActionBtn').onclick = eliminarUsuario;
    
    confirmModal.show();
};

        // Mostrar/ocultar campos de cliente según el rol seleccionado
        document.getElementById('role')?.addEventListener('change', function() {
            const clienteFields = document.getElementById('clienteFields');
            if (this.value == 3) { // ID del rol Cliente
                clienteFields.style.display = 'flex';
                document.getElementById('telefono').required = true;
                document.getElementById('direccion').required = true;
            } else {
                clienteFields.style.display = 'none';
                document.getElementById('telefono').required = false;
                document.getElementById('direccion').required = false;
            }
        });

        // Para el modal de edición
        document.getElementById('editRole')?.addEventListener('change', function() {
            const editClienteFields = document.getElementById('editClienteFields');
            if (this.value == 3) { // ID del rol Cliente
                editClienteFields.style.display = 'flex';
            } else {
                editClienteFields.style.display = 'none';
            }
        });


        // Agregar estas funciones al final de tu gestionUsuarios.js para testing

// Función de test básico
window.testConnection = function() {
    console.log('Probando conexión...');
    
    fetch('../../backend/controller/debug_usuarios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=test'
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
            alert('Test exitoso: ' + data.message);
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

// Función para probar registro de usuario con debug
window.testRegistrarUsuario = function() {
    console.log('Probando registro de usuario...');
    
    const formData = new FormData();
    formData.append('action', 'registrarUsuario');
    formData.append('nombreUsuario', 'testuser' + Date.now());
    formData.append('email', 'test' + Date.now() + '@test.com');
    formData.append('nombreCompleto', 'Usuario de Prueba');
    formData.append('password', '123456');
    formData.append('rolId', '2'); // Operador
    
    fetch('../../backend/controller/debug_usuarios.php', {
        method: 'POST',
        body: formData
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
            if (data.success) {
                alert('Usuario registrado exitosamente');
            } else {
                alert('Error: ' + data.message);
            }
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

// Función para probar registro de cliente
window.testRegistrarCliente = function() {
    console.log('Probando registro de cliente...');
    
    const formData = new FormData();
    formData.append('action', 'registrarUsuario');
    formData.append('nombreUsuario', 'cliente' + Date.now());
    formData.append('email', 'cliente' + Date.now() + '@test.com');
    formData.append('nombreCompleto', 'Cliente de Prueba');
    formData.append('password', '123456');
    formData.append('rolId', '3'); // Cliente
    formData.append('cedulaCliente', '8-999-' + Math.floor(Math.random() * 1000));
    formData.append('telefono', '555-1234');
    formData.append('direccion', 'Calle de Prueba 123');
    
    fetch('../../backend/controller/debug_usuarios.php', {
        method: 'POST',
        body: formData
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
            if (data.success) {
                alert('Cliente registrado exitosamente');
            } else {
                alert('Error: ' + data.message);
            }
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

// Función para probar obtener roles
window.testObtenerRoles = function() {
    console.log('Probando obtener roles...');
    
    fetch('../../backend/controller/debug_usuarios.php', {
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
            if (data.success) {
                alert('Roles obtenidos: ' + data.data.length);
                console.table(data.data);
            } else {
                alert('Error: ' + data.message);
            }
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

// Crear botones de debug en la página
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
        <h4>Debug Tools</h4>
        <button onclick="testConnection()" style="margin:2px;">Test Conexión</button><br>
        <button onclick="testObtenerRoles()" style="margin:2px;">Test Roles</button><br>
        <button onclick="testRegistrarUsuario()" style="margin:2px;">Test Usuario</button><br>
        <button onclick="testRegistrarCliente()" style="margin:2px;">Test Cliente</button><br>
        <button onclick="this.parentElement.remove()" style="margin:2px;">Cerrar</button>
    `;
    
    document.body.appendChild(debugDiv);
};

console.log('Funciones de debug cargadas. Ejecuta createDebugButtons() para mostrar botones de prueba.');

// También agregar una función para cambiar estado directamente desde la tabla
window.cambiarEstadoUsuarioDirecto = function(usuarioId, estadoActual) {
    const nuevoEstado = !estadoActual;
    const textoEstado = nuevoEstado ? 'activar' : 'desactivar';
    
    if (confirm(`¿Está seguro de que desea ${textoEstado} este usuario?`)) {
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
                mostrarAlerta(`Usuario ${textoEstado} correctamente`, 'success');
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