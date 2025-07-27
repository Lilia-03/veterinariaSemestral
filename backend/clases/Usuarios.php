

class Usuarios {
    private $conexion;
    
    public function __construct() {
        $this->conexion = new Conexion();
    }
    
    /**
     * Obtiene la lista de usuarios según los permisos del usuario solicitante
     * @param int $usuarioSolicitanteId ID del usuario que realiza la solicitud
     * @return array Lista de usuarios
     */
    public function obtenerUsuarios($usuarioSolicitanteId) {
        try {
            // Validar ID del usuario solicitante
            if (!is_numeric($usuarioSolicitanteId)) {
                throw new Exception("ID de usuario inválido");
            }
            
            return $this->conexion->obtenerUsuarios($usuarioSolicitanteId);
        } catch (Exception $e) {
            error_log("Error en Usuarios->obtenerUsuarios: " . $e->getMessage());
            throw new Exception("Error al obtener usuarios: " . $e->getMessage());
        }
    }
    
    /**
     * Registra un nuevo usuario en el sistema
     * @param array $datosUsuario Datos del usuario a registrar
     * @param int $usuarioCreadorId ID del usuario que realiza el registro
     * @return array Resultado de la operación
     */
    public function registrarUsuario($datosUsuario, $usuarioCreadorId) {
        try {
            // Validar datos básicos
            $validacion = Sanitizar::validarDatosUsuario($datosUsuario);
            
            if (!$validacion['valid']) {
                throw new Exception("Datos inválidos: " . implode(', ', $validacion['errors']));
            }

            $datosLimpios = $validacion['data'];

            // Validar rol específico para cliente
            if ($datosLimpios['rolId'] == 3 && empty($datosLimpios['cedulaCliente'])) {
                throw new Exception("Para usuarios tipo Cliente se requiere una cédula válida");
            }

            return $this->conexion->registrarUsuario($datosLimpios, $usuarioCreadorId);
        } catch (Exception $e) {
            error_log("Error en Usuarios->registrarUsuario: " . $e->getMessage());
            throw new Exception($e->getMessage());
        }
    }
    
    /**
     * Actualiza los datos de un usuario existente
     * @param int $idUsuario ID del usuario a actualizar
     * @param array $datosUsuario Nuevos datos del usuario
     * @param int $usuarioEditorId ID del usuario que realiza la actualización
     * @return array Resultado de la operación
     */
    public function actualizarUsuario($idUsuario, $datosUsuario, $usuarioEditorId) {
        try {
            // Validar ID de usuario
            if (!is_numeric($idUsuario) || $idUsuario <= 0) {
                throw new Exception("ID de usuario inválido");
            }
            
            // Validar datos básicos
            $validacion = Sanitizar::validarDatosUsuario($datosUsuario, false); // false para no requerir contraseña
            
            if (!$validacion['valid']) {
                throw new Exception("Datos inválidos: " . implode(', ', $validacion['errors']));
            }

            $datosLimpios = $validacion['data'];

            return $this->conexion->actualizarUsuario($idUsuario, $datosLimpios, $usuarioEditorId);
        } catch (Exception $e) {
            error_log("Error en Usuarios->actualizarUsuario: " . $e->getMessage());
            throw new Exception($e->getMessage());
        }
    }
    
    /**
     * Cambia el estado de un usuario (activo/inactivo)
     * @param int $idUsuario ID del usuario a modificar
     * @param bool $nuevoEstado Nuevo estado (true = activo, false = inactivo)
     * @param int $usuarioEditorId ID del usuario que realiza el cambio
     * @return array Resultado de la operación
     */
    public function cambiarEstadoUsuario($idUsuario, $nuevoEstado, $usuarioEditorId) {
        try {
            // Validar ID de usuario
            if (!is_numeric($idUsuario)) {
                throw new Exception("ID de usuario inválido");
            }
            
            return $this->conexion->cambiarEstadoUsuario($idUsuario, $nuevoEstado, $usuarioEditorId);
        } catch (Exception $e) {
            error_log("Error en Usuarios->cambiarEstadoUsuario: " . $e->getMessage());
            throw new Exception("Error al cambiar estado del usuario: " . $e->getMessage());
        }
    }
    
    /**
     * Obtiene información detallada de un usuario
     * @param int $idUsuario ID del usuario a consultar
     * @return array Datos del usuario
     */
    public function obtenerUsuarioPorId($idUsuario) {
        try {
            // Validar ID de usuario
            if (!is_numeric($idUsuario) || $idUsuario <= 0) {
                throw new Exception("ID de usuario inválido");
            }
            
            return $this->conexion->obtenerUsuarioPorId($idUsuario);
        } catch (Exception $e) {
            error_log("Error en Usuarios->obtenerUsuarioPorId: " . $e->getMessage());
            throw new Exception("Error al obtener información del usuario");
        }
    }
    
    /**
     * Obtiene la lista de roles disponibles
     * @return array Lista de roles
     */
    public function obtenerRoles() {
        try {
            return $this->conexion->obtenerRoles();
        } catch (Exception $e) {
            error_log("Error en Usuarios->obtenerRoles: " . $e->getMessage());
            throw new Exception("Error al obtener roles");
        }
    }
    
    /**
     * Obtiene los permisos de un rol específico
     * @param int $rolId ID del rol a consultar
     * @return array Lista de permisos
     */
    public function obtenerPermisosPorRol($rolId) {
        try {
            // Validar ID de rol
            if (!is_numeric($rolId)) {
                throw new Exception("ID de rol inválido");
            }
            
            return $this->conexion->obtenerPermisosPorRol($rolId);
        } catch (Exception $e) {
            error_log("Error en Usuarios->obtenerPermisosPorRol: " . $e->getMessage());
            throw new Exception("Error al obtener permisos del rol");
        }
    }
    
    /**
     * Obtiene todos los permisos disponibles en el sistema
     * @return array Lista de permisos
     */
    public function obtenerTodosPermisos() {
        try {
            return $this->conexion->obtenerTodosPermisos();
        } catch (Exception $e) {
            error_log("Error en Usuarios->obtenerTodosPermisos: " . $e->getMessage());
            throw new Exception("Error al obtener permisos");
        }
    }
    
    /**
     * Actualiza los permisos asignados a un rol
     * @param int $rolId ID del rol a actualizar
     * @param array $permisos Array con los IDs de los permisos a asignar
     * @return array Resultado de la operación
     */
    public function actualizarPermisosRol($rolId, $permisos) {
        try {
            // Validar ID de rol
            if (!is_numeric($rolId)) {
                throw new Exception("ID de rol inválido");
            }
            
            // Validar que $permisos sea un array
            if (!is_array($permisos)) {
                throw new Exception("Formato de permisos inválido");
            }
            
            return $this->conexion->actualizarPermisosRol($rolId, $permisos);
        } catch (Exception $e) {
            error_log("Error en Usuarios->actualizarPermisosRol: " . $e->getMessage());
            throw new Exception("Error al actualizar permisos: " . $e->getMessage());
        }
    }
    
    /**
     * Busca usuarios según un término de búsqueda
     * @param string $termino Término de búsqueda
     * @param int $usuarioSolicitanteId ID del usuario que realiza la búsqueda
     * @return array Resultados de la búsqueda
     */
    public function buscarUsuarios($termino, $usuarioSolicitanteId) {
        try {
            $termino = Sanitizar::sanitizarBusqueda($termino);
            
            // Obtener todos los usuarios (el filtrado se hace en PHP para mantener consistencia con permisos)
            $usuarios = $this->obtenerUsuarios($usuarioSolicitanteId);
            
            if (empty($termino)) {
                return $usuarios;
            }
            
            // Filtrar resultados
            return array_filter($usuarios, function($usuario) use ($termino) {
                return stripos($usuario['NombreUsuario'], $termino) !== false || 
                       stripos($usuario['NombreCompleto'], $termino) !== false ||
                       stripos($usuario['Email'], $termino) !== false;
            });
        } catch (Exception $e) {
            error_log("Error en Usuarios->buscarUsuarios: " . $e->getMessage());
            throw new Exception("Error al buscar usuarios");
        }
    }
    
    /**
     * Cambia la contraseña de un usuario
     * @param int $idUsuario ID del usuario
     * @param string $nuevaContrasena Nueva contraseña
     * @return array Resultado de la operación
     */
    public function cambiarContrasena($idUsuario, $nuevaContrasena) {
        try {
            // Validar ID de usuario
            if (!is_numeric($idUsuario)) {
                throw new Exception("ID de usuario inválido");
            }
            
            // Validar contraseña
            if (empty($nuevaContrasena)) {
                throw new Exception("La contraseña no puede estar vacía");
            }
            
            return $this->conexion->cambiarContrasena($idUsuario, $nuevaContrasena);
        } catch (Exception $e) {
            error_log("Error en Usuarios->cambiarContrasena: " . $e->getMessage());
            throw new Exception("Error al cambiar contraseña: " . $e->getMessage());
        }
    }
    
    /**
     * Verifica si un nombre de usuario ya existe
     * @param string $nombreUsuario Nombre de usuario a verificar
     * @return bool True si existe, false si no
     */
    public function existeNombreUsuario($nombreUsuario) {
        try {
            $usuarios = $this->obtenerUsuarios(1); // Usar ID 1 (admin) para obtener todos
            
            foreach ($usuarios as $usuario) {
                if (strtolower($usuario['NombreUsuario']) == strtolower($nombreUsuario)) {
                    return true;
                }
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Error en Usuarios->existeNombreUsuario: " . $e->getMessage());
            throw new Exception("Error al verificar nombre de usuario");
        }
    }
    
    /**
     * Verifica si un email ya está registrado
     * @param string $email Email a verificar
     * @return bool True si existe, false si no
     */
    public function existeEmail($email) {
        try {
            $usuarios = $this->obtenerUsuarios(1); // Usar ID 1 (admin) para obtener todos
            
            foreach ($usuarios as $usuario) {
                if (strtolower($usuario['Email']) == strtolower($email)) {
                    return true;
                }
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Error en Usuarios->existeEmail: " . $e->getMessage());
            throw new Exception("Error al verificar email");
        }
    }


        /**
     * Elimina un usuario del sistema (solo admin)
     * @param int $usuarioId ID del usuario a eliminar
     * @param int $usuarioSolicitanteId ID del admin que elimina
     * @return array Resultado de la operación
     */
    public function eliminarUsuario($usuarioId, $usuarioSolicitanteId) {
        try {
            if (!is_numeric($usuarioId) || $usuarioId <= 0) {
                throw new Exception("ID de usuario inválido");
            }
            if (!is_numeric($usuarioSolicitanteId) || $usuarioSolicitanteId <= 0) {
                throw new Exception("ID de solicitante inválido");
            }
            return $this->conexion->eliminarUsuario($usuarioId, $usuarioSolicitanteId);
        } catch (Exception $e) {
            error_log("Error en Usuarios->eliminarUsuario: " . $e->getMessage());
            throw new Exception($e->getMessage());
        }
    }
}

?>