document.addEventListener('DOMContentLoaded', function() {
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
    }

    // Obtener lista de usuarios
    function cargarUsuarios() {
        fetch('../../backend/controller/gestionUsuariosController.php', {
            method: 'POST',
            body: new URLSearchParams({ action: 'obtenerUsuarios' })
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                usuariosData = data.data;
                renderizarTablaUsuarios();
            } else {
                mostrarAlerta('Error al cargar usuarios: ' + (data.message || 'Error desconocido'), 'error');
            }
        })
        .catch(e => mostrarAlerta('Error de conexión: ' + e.message, 'error'));
    }

    function renderizarTablaUsuarios() {
        tablaUsuariosBody.innerHTML = '';
        usuariosData.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${usuario.UsuarioID || usuario.id || ''}</td>
                <td>${usuario.NombreUsuario || usuario.nombreUsuario || ''}</td>
                <td>${usuario.Email || usuario.email || ''}</td>
                <td>${usuario.NombreCompleto || usuario.nombreCompleto || ''}</td>
                <td>${usuario.NombreRol || usuario.nombreRol || ''}</td>
                <td><button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${usuario.UsuarioID || usuario.id})">Eliminar</button></td>
            `;
            tablaUsuariosBody.appendChild(tr);
        });
    }

    // Guardar (registrar)
    function guardarUsuario(e) {
        e.preventDefault();
        if (!formUsuario) return;
        const formData = new FormData(formUsuario);
        formData.append('action', 'registrarUsuario');
        btnGuardarUsuario.disabled = true;
        fetch('../../backend/controller/gestionUsuariosController.php', {
            method: 'POST',
            body: formData
        })
        .then(r => r.json())
        .then(data => {
            btnGuardarUsuario.disabled = false;
            if (data.success) {
                mostrarAlerta('Usuario registrado correctamente', 'success');
                formUsuario.reset();
                usuarioEditando = null;
                cargarUsuarios();
            } else {
                mostrarAlerta('Error: ' + (data.message || 'Error desconocido'), 'error');
            }
        })
        .catch(e => {
            btnGuardarUsuario.disabled = false;
            mostrarAlerta('Error: ' + e.message, 'error');
        });
    }


    // Eliminar usuario (solo admin)
    window.eliminarUsuario = function(usuarioId) {
        if (!confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
        const formData = new FormData();
        formData.append('action', 'eliminarUsuario');
        formData.append('usuarioId', usuarioId);
        fetch('../../backend/controller/gestionUsuariosController.php', {
            method: 'POST',
            body: formData
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                mostrarAlerta('Usuario eliminado correctamente', 'success');
                cargarUsuarios();
            } else {
                mostrarAlerta('Error: ' + (data.message || 'Error desconocido'), 'error');
            }
        })
        .catch(e => mostrarAlerta('Error: ' + e.message, 'error'));
    }

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
    }
});