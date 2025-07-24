<?php
class Conexion {
    private $pdo;

    public function __construct() {
        try {
            $this->pdo = new PDO("sqlsrv:Server=localhost;Database=CliniPet", "clinipet_user", "Clinipet123!", [
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
            ]);
        } catch (PDOException $e) {
            die("Error de conexión: " . $e->getMessage());
        }
    }

    // Método para obtener la instancia PDO (necesario para la clase Factura)
    public function getPDO() {
        return $this->pdo;
    }

     // ========== MÉTODOS DE AUTENTICACIÓN del Usuario ==========
    
    public function autenticarUsuario($nombreUsuario, $password) {
        try {
            // Usar el procedimiento almacenado AutenticarUsuario
            $sql = "EXEC AutenticarUsuario ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$nombreUsuario]);
            
            $usuario = $stmt->fetch();
            
            if ($usuario && password_verify($password, $usuario['PasswordHash'])) {
                // Verificar si el usuario está activo
                if (!$usuario['Activo']) {
                    return [
                        'success' => false,
                        'message' => 'Usuario desactivado. Contacte al administrador.'
                    ];
                }
                
                // Obtener permisos del usuario
                $permisos = $this->obtenerPermisos($usuario['UsuarioID']);
                
                return [
                    'success' => true,
                    'usuario' => [
                        'id' => $usuario['UsuarioID'],
                        'nombreUsuario' => $usuario['NombreUsuario'],
                        'email' => $usuario['Email'],
                        'nombreCompleto' => $usuario['NombreCompleto'],
                        'rolId' => $usuario['RolID'],
                        'nombreRol' => $usuario['NombreRol'],
                        'cedulaCliente' => $usuario['CedulaCliente'],
                        'permisos' => $permisos
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Credenciales incorrectas'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error en el servidor: ' . $e->getMessage()
            ];
        }
    }
    
    public function obtenerPermisos($usuarioId) {
        try {
            $sql = "EXEC ObtenerPermisosUsuario ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$usuarioId]);
            
            $permisos = [];
            while ($row = $stmt->fetch()) {
                $permisos[] = $row['NombrePermiso'];
            }
            
            return $permisos;
        } catch (Exception $e) {
            return [];
        }
    }
    
    public function obtenerInfoCompleta($usuarioId) {
        try {
            $sql = "EXEC ObtenerInfoCompletaUsuario ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$usuarioId]);
            
            return $stmt->fetch();
        } catch (Exception $e) {
            return false;
        }
    }
    
    public function crearUsuario($datos, $usuarioCreadorId = null) {
        try {
            $sql = "EXEC CrearUsuario ?, ?, ?, ?, ?, ?, ?";
            $stmt = $this->pdo->prepare($sql);
            
            $passwordHash = password_hash($datos['password'], PASSWORD_DEFAULT);
            
            $stmt->execute([
                $datos['nombreUsuario'],
                $datos['email'],
                $passwordHash,
                $datos['nombreCompleto'],
                $datos['rolId'],
                $datos['cedulaCliente'],
                $usuarioCreadorId
            ]);
            
            return [
                'success' => true,
                'message' => 'Usuario creado exitosamente'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al crear usuario: ' . $e->getMessage()
            ];
        }
    }

    public function registrarCliente($cedula, $nombre, $telefono, $email, $direccion) {
        $sql = "EXEC RegistrarCliente @Cedula = ?, @Nombre = ?, @Teléfono = ?, @Email = ?, @Dirección = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$cedula, $nombre, $telefono, $email, $direccion]);
    }

    public function registrarMascota($nombre, $especie, $peso, $edad, $cedulaCliente, $razaID, $genero, $foto = null, $condiciones = null) {
        $sql = "EXEC RegistrarMascota 
            @Nombre = ?, 
            @Especie = ?, 
            @Peso = ?, 
            @Edad = ?, 
            @CedulaCliente = ?, 
            @RazaID = ?, 
            @Genero = ?, 
            @Foto = ?, 
            @Condiciones = ?";
        $stmt = $this->pdo->prepare($sql);

        // Para la foto, si existe conviertes a binario (ya en PHP recibes con $_FILES)
        $fotoBinaria = null;
        if ($foto && is_file($foto)) {
            $fotoBinaria = file_get_contents($foto);
        } elseif (is_string($foto)) {
            // Si ya es contenido binario base64 o algo, úsalo directamente
            $fotoBinaria = $foto;
        }

        return $stmt->execute([$nombre, $especie, $peso, $edad, $cedulaCliente, $razaID, $genero, $fotoBinaria, $condiciones]);
    }



    public function consultarMascota($idMascota = null, $cedula = null) {
        $sql = "EXEC ConsultarClienteYMascota @Cedula = ?, @IDMascota = ?";
        $stmt = $this->pdo->prepare($sql);

        // Ejecutar pasando ambos parámetros (uno puede ser null)
        $stmt->execute([$cedula, $idMascota]);

        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($resultado && $resultado['Foto'] !== null) {
            $resultado['FotoBase64'] = base64_encode($resultado['Foto']);
            unset($resultado['Foto']);
        }

        return $resultado;
    }

    public function listarRazas() {
        $sql = "SELECT RazaID, Nombre FROM Raza ORDER BY Nombre";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listarCondiciones() {
        $sql = "SELECT CondicionID, Nombre FROM CondicionMedica ORDER BY Nombre";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }


}
?>
