<?php
require_once __DIR__ . '/../includes/conexion.php';  
require_once __DIR__ . '/../includes/sanitizar.php'; 

class Usuarios {
    private $conexion;
    
    public function __construct() {
        error_log("Usuarios::__construct() - Iniciando constructor");
        try {
            $this->conexion = new Conexion();
            error_log("Usuarios::__construct() - Conexión creada exitosamente");
        } catch (Exception $e) {
            error_log("Usuarios::__construct() - Error creando conexión: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Obtiene la lista de usuarios según los permisos del usuario solicitante
     */
    public function obtenerUsuarios($usuarioSolicitanteId) {
        error_log("Usuarios::obtenerUsuarios() - Iniciando con ID: " . $usuarioSolicitanteId);
        try {
            // Validar ID del usuario solicitante
            if (!is_numeric($usuarioSolicitanteId)) {
                error_log("Usuarios::obtenerUsuarios() - ID inválido: " . $usuarioSolicitanteId);
                throw new Exception("ID de usuario inválido");
            }
            
            $resultado = $this->conexion->obtenerUsuarios($usuarioSolicitanteId);
            error_log("Usuarios::obtenerUsuarios() - Resultado obtenido: " . count($resultado ?? []));
            return $resultado;
            
        } catch (Exception $e) {
            error_log("Usuarios::obtenerUsuarios() - Error: " . $e->getMessage());
            throw new Exception("Error al obtener usuarios: " . $e->getMessage());
        }
    }
    
    /**
     * Registra un nuevo usuario en el sistema
     */
    public function registrarUsuario($datosUsuario, $usuarioCreadorId) {
        error_log("Usuarios::registrarUsuario() - Iniciando con datos: " . print_r($datosUsuario, true));
        error_log("Usuarios::registrarUsuario() - Usuario creador ID: " . $usuarioCreadorId);
        
        try {
            // Validar datos básicos
            error_log("Usuarios::registrarUsuario() - Validando datos...");
            $validacion = Sanitizar::validarDatosUsuario($datosUsuario);
            
            if (!$validacion['valid']) {
                error_log("Usuarios::registrarUsuario() - Validación falló: " . implode(', ', $validacion['errors']));
                throw new Exception("Datos inválidos: " . implode(', ', $validacion['errors']));
            }

            $datosLimpios = $validacion['data'];
            error_log("Usuarios::registrarUsuario() - Datos validados: " . print_r($datosLimpios, true));

            // Para clientes, validar teléfono y dirección
            if ($datosLimpios['rolId'] == 3) {
                error_log("Usuarios::registrarUsuario() - Validando datos de cliente...");
                if (empty($datosUsuario['telefono']) || empty($datosUsuario['direccion'])) {
                    error_log("Usuarios::registrarUsuario() - Faltan datos de cliente");
                    throw new Exception("Para usuarios tipo Cliente se requiere teléfono y dirección");
                }
                
                $datosLimpios['telefono'] = Sanitizar::sanitizarTelefono($datosUsuario['telefono']);
                $datosLimpios['direccion'] = Sanitizar::sanitizarTexto($datosUsuario['direccion']);
                error_log("Usuarios::registrarUsuario() - Datos de cliente agregados");
            }

            error_log("Usuarios::registrarUsuario() - Llamando a conexion->crearUsuario...");
            $resultado = $this->conexion->crearUsuario($datosLimpios, $usuarioCreadorId);
            error_log("Usuarios::registrarUsuario() - Resultado: " . print_r($resultado, true));
            
            return $resultado;
            
        } catch (Exception $e) {
            error_log("Usuarios::registrarUsuario() - Error: " . $e->getMessage());
            error_log("Usuarios::registrarUsuario() - Stack trace: " . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Actualiza los datos de un usuario existente
     */
    public function actualizarUsuario($idUsuario, $datosUsuario, $usuarioEditorId) {
        error_log("Usuarios::actualizarUsuario() - Iniciando con ID: " . $idUsuario);
        error_log("Usuarios::actualizarUsuario() - Datos: " . print_r($datosUsuario, true));
        error_log("Usuarios::actualizarUsuario() - Editor ID: " . $usuarioEditorId);
        
        try {
            // Validar ID de usuario
            if (!is_numeric($idUsuario) || $idUsuario <= 0) {
                error_log("Usuarios::actualizarUsuario() - ID inválido: " . $idUsuario);
                throw new Exception("ID de usuario inválido");
            }
            
            // Validar datos básicos
            error_log("Usuarios::actualizarUsuario() - Validando datos...");
            $validacion = Sanitizar::validarDatosUsuario($datosUsuario, false); // false para no requerir contraseña
            
            if (!$validacion['valid']) {
                error_log("Usuarios::actualizarUsuario() - Validación falló: " . implode(', ', $validacion['errors']));
                throw new Exception("Datos inválidos: " . implode(', ', $validacion['errors']));
            }

            $datosLimpios = $validacion['data'];
            error_log("Usuarios::actualizarUsuario() - Datos validados: " . print_r($datosLimpios, true));

            // Para clientes, validar teléfono y dirección si se proporcionan
            if (isset($datosUsuario['esCliente']) && $datosUsuario['esCliente']) {
                error_log("Usuarios::actualizarUsuario() - Procesando datos de cliente...");
                if (isset($datosUsuario['telefono'])) {
                    $datosLimpios['telefono'] = Sanitizar::sanitizarTelefono($datosUsuario['telefono']);
                }
                if (isset($datosUsuario['direccion'])) {
                    $datosLimpios['direccion'] = Sanitizar::sanitizarTexto($datosUsuario['direccion']);
                }
                error_log("Usuarios::actualizarUsuario() - Datos de cliente procesados");
            }

            error_log("Usuarios::actualizarUsuario() - Llamando a conexion->actualizarUsuario...");
            $resultado = $this->conexion->actualizarUsuario($idUsuario, $datosLimpios, $usuarioEditorId);
            error_log("Usuarios::actualizarUsuario() - Resultado: " . print_r($resultado, true));
            
            return $resultado;
            
        } catch (Exception $e) {
            error_log("Usuarios::actualizarUsuario() - Error: " . $e->getMessage());
            error_log("Usuarios::actualizarUsuario() - Stack trace: " . $e->getTraceAsString());
            throw new Exception($e->getMessage());
        }
    }
    
    /**
     * Obtiene la lista de roles disponibles
     */
    public function obtenerRoles() {
        error_log("Usuarios::obtenerRoles() - Iniciando...");
        try {
            $resultado = $this->conexion->obtenerRoles();
            error_log("Usuarios::obtenerRoles() - Resultado: " . print_r($resultado, true));
            return $resultado;
        } catch (Exception $e) {
            error_log("Usuarios::obtenerRoles() - Error: " . $e->getMessage());
            throw new Exception("Error al obtener roles");
        }
    }
}
?>