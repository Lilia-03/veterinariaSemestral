document.addEventListener('DOMContentLoaded', function() {
<<<<<<< HEAD
    // Guardar cambios del usuario
document.getElementById('saveUserChangesBtn').addEventListener('click', function() {
    const formData = new FormData();
    formData.append('action', 'actualizarUsuario');
    formData.append('idUsuario', document.getElementById('editUserId').value);
    formData.append('email', document.getElementById('editEmail').value);
    formData.append('nombreCompleto', document.getElementById('editFullname').value);
    formData.append('rolId', document.getElementById('editRole').value);
    formData.append('cedulaCliente', document.getElementById('editClientId').value);
    formData.append('activo', document.getElementById('editStatus').value);
    
    const nuevaPassword = document.getElementById('editPassword').value;
    if (nuevaPassword) {
        formData.append('password', nuevaPassword);
=======
    // Elementos del DOM

    const formUsuario = document.getElementById('formUsuario');
    const tablaUsuariosBody = document.querySelector('usersTableContainer');
    const alertContainer = document.getElementById('alertContainer');
    const rolUsuario = document.getElementById('rolUsuario');
    const btnGuardarUsuario = document.getElementById('btnGuardarUsuario');
    let usuariosData = [];
    let usuarioEditando = null;

    // Logs para verificar existencia de elementos
    console.log('formUsuario:', formUsuario);
    console.log('tablaUsuariosBody:', tablaUsuariosBody);
    console.log('alertContainer:', alertContainer);
    console.log('rolUsuario:', rolUsuario);
    console.log('btnGuardarUsuario:', btnGuardarUsuario);

    cargarUsuarios();

    if (formUsuario) {
        formUsuario.addEventListener('submit', guardarUsuario);
>>>>>>> 7f174563027cf10f77fcc0e284c8144dc22bcbf0
    }

    mostrarCarga(true);

    fetch('../../backend/controller/gestionUsuariosController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        mostrarCarga(false);
        
        if (data.success) {
            mostrarAlerta('Usuario actualizado correctamente', 'success');
            editUserModal.hide();
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
});
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
    cargarUsuarios();
    cargarRoles();

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

function renderizarTablaUsuarios() {
    if (!usersTableBody) return;
    
    usersTableBody.innerHTML = '';
    
    usuariosData.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.UsuarioID}</td>
            <td>${usuario.NombreUsuario}</td>
            <td>${usuario.NombreCompleto}</td>
            <td>${usuario.NombreRol}</td>
            <td>${usuario.Activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
            <td>${usuario.UltimoAcceso || 'Nunca'}</td>
            <td>
                <button class="btn btn-sm btn-gradient-primary" onclick="editarUsuarioHandler(${usuario.UsuarioID})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-gradient-danger" onclick="confirmarEliminarUsuarioHandler(${usuario.UsuarioID}, '${usuario.NombreUsuario}')">
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

        usersTableBody.innerHTML = '';

        usuariosFiltrados.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${usuario.UsuarioID}</td>
                <td>${usuario.NombreUsuario}</td>
                <td>${usuario.NombreCompleto}</td>
                <td>${usuario.NombreRol}</td>
                <td>${usuario.Activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                <td>${usuario.UltimoAcceso || 'Nunca'}</td>
                <td>
                    <button class="btn btn-sm btn-gradient-primary" onclick="editarUsuario(${usuario.UsuarioID})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-gradient-danger" onclick="confirmarEliminarUsuario(${usuario.UsuarioID}, '${usuario.NombreUsuario}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            usersTableBody.appendChild(tr);
        });
    }

    function registrarUsuario(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const fullname = document.getElementById('fullname').value.trim();
        const password = document.getElementById('password').value;
        const roleId = document.getElementById('role').value;
        const clientId = document.getElementById('clientId').value.trim();

        if (!username || !email || !fullname || !password || !roleId) {
            mostrarAlerta('Por favor complete todos los campos requeridos', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('action', 'registrarUsuario');
        formData.append('nombreUsuario', username);
        formData.append('email', email);
        formData.append('nombreCompleto', fullname);
        formData.append('password', password);
        formData.append('rolId', roleId);
        if (clientId) formData.append('cedulaCliente', clientId);

        mostrarCarga(true);

        fetch('../../backend/controller/gestionUsuariosController.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            mostrarCarga(false);
            
            if (data.success) {
                mostrarAlerta('Usuario registrado correctamente', 'success');
                addUserForm.reset();
                cargarUsuarios();
                // Cambiar a la pestaña de lista
                const listTab = new bootstrap.Tab(document.getElementById('list-tab'));
                listTab.show();
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

    function limpiarFormularioUsuario() {
        if (addUserForm) addUserForm.reset();
    }

window.editarUsuarioHandler = function(usuarioId) {
    const usuario = usuariosData.find(u => u.UsuarioID == usuarioId);
    if (!usuario) return;

    currentEditingUserId = usuarioId;
    
    document.getElementById('editUserId').value = usuarioId;
    document.getElementById('editUsername').value = usuario.NombreUsuario;
    document.getElementById('editEmail').value = usuario.Email;
    document.getElementById('editFullname').value = usuario.NombreCompleto;
    document.getElementById('editClientId').value = usuario.CedulaCliente || '';
    document.getElementById('editStatus').value = usuario.Activo ? '1' : '0';
    
    // Llenar select de roles
    const editRoleSelect = document.getElementById('editRole');
    editRoleSelect.innerHTML = '';
    rolesData.forEach(rol => {
        const option = document.createElement('option');
        option.value = rol.RolID;
        option.textContent = rol.NombreRol;
        option.selected = rol.RolID == usuario.RolID;
        editRoleSelect.appendChild(option);
    });

    editUserModal.show();
};

window.confirmarEliminarUsuarioHandler = function(usuarioId, nombreUsuario) {
    currentEditingUserId = usuarioId;
    
    document.getElementById('confirmModalLabel').textContent = 'Confirmar Eliminación';
    document.getElementById('confirmModalMessage').textContent = 
        `¿Está seguro de que desea eliminar al usuario "${nombreUsuario}"? Esta acción no se puede deshacer.`;
    
    document.getElementById('confirmActionBtn').onclick = eliminarUsuario;
    
    confirmModal.show();
};

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
    formData.append('action', 'actualizarPermisosRol'); // Nombre correcto de la acción
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

<<<<<<< HEAD
    function mostrarCarga(mostrar) {
        if (loading) loading.style.display = mostrar ? 'block' : 'none';
=======
    // Utilidad para mostrar alertas
    function mostrarAlerta(mensaje, tipo) {
        console.log('Buscando alertContainer:', alertContainer); // <-- Log para debug
        alertContainer.innerHTML = '';
        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo === 'error' ? 'danger' : (tipo === 'warning' ? 'warning' : 'success')} fade-in`;
        alert.innerHTML = mensaje;
        alertContainer.appendChild(alert);
        setTimeout(() => {
            if (alert.parentNode) alert.parentNode.removeChild(alert);
        }, 4000);
>>>>>>> 7f174563027cf10f77fcc0e284c8144dc22bcbf0
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

    
});