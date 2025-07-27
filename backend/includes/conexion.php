<?php
class Conexion {
    private $pdo;

    public function __construct() {
        try {
            $this->pdo = new PDO("sqlsrv:Server=localhost;Database=CliniPet", "user_esti", "TuPasswordSeguro123!", [
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

    ///////////////////////////////////////////////////////////////////////
    ///////////////////////Gestion de Inventario///////////////////////////
    ///////////////////////////////////////////////////////////////////////

  // Obtener lista de productos de inventario
    public function obtenerProductosInventario() {
        $sql = "EXEC ObtenerProductosInventario";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } 

    // Método agregado para el reporte de inventario 
    public function obtenerReporteInventario() {
        $sql = "EXEC ObtenerProductosInventario";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Obtener productos y servicios con búsqueda
    public function obtenerProductosServicios($busqueda = '', $tipo = '') {
        $sql = "EXEC ObtenerProductosServicios ?, ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$busqueda, $tipo]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Obtener detalle de un producto o servicio específico
    public function obtenerDetalleProductoServicio($idItem) {
        $sql = "EXEC ObtenerDetalleProductoServicio ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$idItem]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function actualizarInventario($idItem, $cantidadAgregada) {
        $sql = "EXEC ActualizarInventario @IDITEM = ?, @CantidadAgregada = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$idItem, $cantidadAgregada]);
    }
    // Agregar nuevo producto
    public function agregarProducto($codigo, $nombre, $precio, $stock) {
        try {
            $sql = "EXEC AgregarProducto ?, ?, ?, ?";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$codigo, $nombre, $precio, $stock]);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Ya existe un producto') !== false) {
                throw new Exception("Ya existe un producto con ese código");
            }
            throw new Exception("Error al agregar producto: " . $e->getMessage());
        }
    }

    // Verificar si existe un código de producto
    public function existeCodigoProducto($codigo) {
        $sql = "EXEC VerificarCodigoProducto @Codigo = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$codigo]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['Existe'] == 1;
    }

    // Eliminar producto - CORREGIDO para usar SP
    public function eliminarProducto($idItem) {
        try {
            $sql = "EXEC EliminarProducto ?";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$idItem]);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'movimientos registrados') !== false) {
                throw new Exception("No se puede eliminar el producto porque tiene movimientos registrados");
            }
            if (strpos($e->getMessage(), 'no existe') !== false) {
                throw new Exception("El producto no existe");
            }
            throw new Exception("Error al eliminar producto: " . $e->getMessage());
        }}

    // Obtener un producto específico por ID
    public function obtenerProductoPorId($idItem) {
        $sql = "EXEC ObtenerProductoPorId ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$idItem]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Método para búsqueda de productos
    public function buscarProductos($termino) {
        $sql = "EXEC BuscarProductos @Termino = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$termino]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Método adicional: verificar si un producto tiene movimientos
    private function tieneMovimientos($idItem) {
        $sql = "SELECT COUNT(*) as total FROM Venta WHERE IDITEM = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$idItem]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'] > 0;
    }


    ///////////////////////////////////////////////////////////////////////
    ///////////////////////Gestion de Servicios///////////////////////////
    ///////////////////////////////////////////////////////////////////////

    public function obtenerServiciosDisponibles() {
        try {
            $sql = "EXEC ObtenerServicios";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Debug log
            error_log("Servicios obtenidos: " . count($result));
            
            return $result;
        } catch (PDOException $e) {
            error_log("Error en obtenerServiciosDisponibles: " . $e->getMessage());
            throw new Exception("Error al obtener servicios: " . $e->getMessage());
        }
    }

    public function agregarServicio($codigo, $nombre, $precio) {
        try {
            $sql = "EXEC AgregarServicio @Codigo = ?, @Nombre = ?, @Precio = ?";
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute([$codigo, $nombre, $precio]);
            
            error_log("Servicio agregado - Código: $codigo, Resultado: " . ($result ? 'éxito' : 'fallo'));
            
            return $result;
        } catch (PDOException $e) {
            error_log("Error agregando servicio: " . $e->getMessage());
            if (strpos($e->getMessage(), 'Ya existe un servicio') !== false) {
                throw new Exception("Ya existe un servicio con ese código");
            }
            throw new Exception("Error al agregar servicio: " . $e->getMessage());
        }
    }

    public function existeCodigoServicio($codigo) {
        try {
            $sql = "EXEC VerificarCodigoServicio @Codigo = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$codigo]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return isset($result['Existe']) && $result['Existe'] == 1;
        } catch (PDOException $e) {
            error_log("Error verificando código servicio: " . $e->getMessage());
            throw new Exception("Error al verificar código: " . $e->getMessage());
        }
    }


    public function eliminarServicio($idServicio) {
        try {
            $sql = "EXEC EliminarServicio @IDITEM = ?";
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute([$idServicio]);
            
            error_log("Servicio eliminado - ID: $idServicio, Resultado: " . ($result ? 'éxito' : 'fallo'));
            
            return $result;
        } catch (PDOException $e) {
            error_log("Error eliminando servicio: " . $e->getMessage());
            if (strpos($e->getMessage(), 'no existe') !== false) {
                throw new Exception("El servicio no existe");
            }
            if (strpos($e->getMessage(), 'registros asociados') !== false) {
                throw new Exception("No se puede eliminar el servicio porque tiene registros asociados");
            }
            throw new Exception("Error al eliminar servicio: " . $e->getMessage());
        }
    }

    public function obtenerServicioPorId($idServicio) {
        try {
            $sql = "EXEC ObtenerServicioPorId @IDITEM = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$idServicio]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error obteniendo servicio por ID: " . $e->getMessage());
            throw new Exception("Error al obtener servicio: " . $e->getMessage());
        }
    }

    public function buscarServicios($termino) {
        try {
            $sql = "EXEC BuscarServicios @Termino = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$termino]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error buscando servicios: " . $e->getMessage());
            throw new Exception("Error al buscar servicios: " . $e->getMessage());
        }
    }

    public function obtenerReporteServicios() {
        try {
            return $this->obtenerServiciosDisponibles();
        } catch (Exception $e) {
            error_log("Error obteniendo reporte servicios: " . $e->getMessage());
            throw new Exception("Error al obtener reporte: " . $e->getMessage());
        }
    }
}
?>
