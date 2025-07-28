
<?php
class Conexion {
    private $pdo;

    public function __construct() {
        try {
            $this->pdo = new PDO("sqlsrv:Server=localhost;Database=CliniPet", "usuario_esti", "TuPasswordSeguro123!", [
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
            ]);
        } catch (PDOException $e) {
            error_log("Error de conexión: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
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
    error_log("Conexion::crearUsuario() - Iniciando con datos: " . print_r($datos, true));
    error_log("Conexion::crearUsuario() - Usuario creador: " . $usuarioCreadorId);
    
    try {
        // Validar campos obligatorios
        if (empty($datos['nombreUsuario']) || empty($datos['email']) || 
            empty($datos['password']) || empty($datos['nombreCompleto']) || 
            empty($datos['rolId'])) {
            error_log("Conexion::crearUsuario() - Campos obligatorios faltantes");
            throw new Exception('Todos los campos obligatorios deben ser proporcionados');
        }

        // Validar rol cliente requiere cédula
        if ($datos['rolId'] == 3 && empty($datos['cedulaCliente'])) {
            error_log("Conexion::crearUsuario() - Cliente sin cédula");
            throw new Exception('Se requiere cédula válida para usuarios cliente');
        }

        // Preparar parámetros adicionales para cliente
        $telefono = null;
        $direccion = null;
        
        if ($datos['rolId'] == 3) {
            if (empty($datos['telefono']) || empty($datos['direccion'])) {
                error_log("Conexion::crearUsuario() - Cliente sin teléfono o dirección");
                throw new Exception('Se requiere teléfono y dirección para usuarios cliente');
            }
            $telefono = $datos['telefono'];
            $direccion = $datos['direccion'];
            error_log("Conexion::crearUsuario() - Datos de cliente: tel=$telefono, dir=$direccion");
        }

        $passwordHash = password_hash($datos['password'], PASSWORD_DEFAULT);
        error_log("Conexion::crearUsuario() - Password hasheado");
        
        // Llamar al procedimiento almacenado con todos los parámetros
        $sql = "EXEC CrearUsuario 
            @NombreUsuario = ?, 
            @Email = ?, 
            @PasswordHash = ?, 
            @NombreCompleto = ?, 
            @RolID = ?, 
            @CedulaCliente = ?, 
            @UsuarioCreadorID = ?,
            @Telefono = ?,
            @Direccion = ?";
        
        error_log("Conexion::crearUsuario() - SQL preparado: " . $sql);
        
        $stmt = $this->pdo->prepare($sql);
        error_log("Conexion::crearUsuario() - Statement preparado");
        
        $parametros = [
            $datos['nombreUsuario'],
            $datos['email'],
            $passwordHash,
            $datos['nombreCompleto'],
            $datos['rolId'],
            $datos['cedulaCliente'] ?? null,
            $usuarioCreadorId,
            $telefono,
            $direccion
        ];
        
        error_log("Conexion::crearUsuario() - Parámetros: " . print_r($parametros, true));
        
        $resultado = $stmt->execute($parametros);
        error_log("Conexion::crearUsuario() - Execute resultado: " . ($resultado ? 'true' : 'false'));
        
        if (!$resultado) {
            $errorInfo = $stmt->errorInfo();
            error_log("Conexion::crearUsuario() - Error en execute: " . print_r($errorInfo, true));
            throw new Exception('Error al ejecutar el procedimiento: ' . implode(' - ', $errorInfo));
        }
        
        // Intentar obtener el resultado
        try {
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Conexion::crearUsuario() - Resultado fetch: " . print_r($result, true));
            
            $newId = $result['UsuarioID'] ?? null;
            error_log("Conexion::crearUsuario() - Nuevo ID: " . $newId);
            
        } catch (Exception $fetchException) {
            error_log("Conexion::crearUsuario() - Error en fetch: " . $fetchException->getMessage());
            $newId = null;
        }
        
        return [
            'success' => true,
            'usuarioId' => $newId,
            'message' => 'Usuario creado exitosamente'
        ];
        
    } catch (PDOException $e) {
        error_log("Conexion::crearUsuario() - PDOException: " . $e->getMessage());
        error_log("Conexion::crearUsuario() - Error Code: " . $e->getCode());
        error_log("Conexion::crearUsuario() - Error Info: " . print_r($e->errorInfo ?? [], true));
        
        // Manejo de errores específicos
        $errorMessage = $e->getMessage();
        
        // Errores de duplicados
        if (strpos($errorMessage, '2627') !== false || strpos($errorMessage, 'UNIQUE constraint') !== false) {
            if (strpos($errorMessage, 'NombreUsuario') !== false) {
                $errorMessage = 'El nombre de usuario ya está en uso';
            } elseif (strpos($errorMessage, 'Email') !== false) {
                $errorMessage = 'El correo electrónico ya está registrado';
            } elseif (strpos($errorMessage, 'Teléfono') !== false) {
                $errorMessage = 'El número de teléfono ya está registrado';
            } elseif (strpos($errorMessage, 'Cedula') !== false) {
                $errorMessage = 'La cédula ya está registrada';
            }
        }
        
        // Errores de validación del procedimiento
        if (strpos($errorMessage, 'Se requiere') !== false) {
            // Mantener el mensaje original del procedimiento
        } elseif (strpos($errorMessage, 'formato') !== false) {
            // Mantener mensajes de formato
        }
        
        return [
            'success' => false,
            'message' => $errorMessage
        ];
    } catch (Exception $e) {
        error_log("Conexion::crearUsuario() - Exception general: " . $e->getMessage());
        error_log("Conexion::crearUsuario() - Stack trace: " . $e->getTraceAsString());
        return [
            'success' => false,
            'message' => $e->getMessage()
        ];
    }
}

    public function registrarCliente($cedula, $nombre, $telefono, $email, $direccion) {
        $sql = "EXEC RegistrarCliente @Cedula = ?, @Nombre = ?, @Teléfono = ?, @Email = ?, @Dirección = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$cedula, $nombre, $telefono, $email, $direccion]);
    }

    public function registrarMascota($nombre, $especie, $peso, $edad, $cedulaCliente, $razaID, $genero, $foto = null, $condiciones = []) {
        try {
            error_log("=== INICIO REGISTRAR MASCOTA ===");
            error_log("Nombre: $nombre");
            error_log("Especie recibida: $especie");
            error_log("Peso: $peso");
            error_log("Edad: $edad");
            error_log("CedulaCliente: $cedulaCliente");
            error_log("RazaID: $razaID");
            error_log("Genero: $genero");
            error_log("Foto presente: " . ($foto ? "SÍ - " . strlen($foto) . " bytes" : "NO"));
            
            // Validaciones básicas con mensajes amigables
            if (empty($nombre) || empty($especie) || empty($cedulaCliente)) {
                throw new Exception("Faltan algunos datos obligatorios");
            }

            if ($peso <= 0) {
                throw new Exception("El peso debe ser mayor a cero");
            }

            if (!is_numeric($edad) || intval($edad) <= 0) {
                throw new Exception("La edad debe ser un numero mayor a cero");
            }

            // SOLUCIÓN: Convertir ID de especie a nombre de especie
            $nombreEspecie = null;
            if (is_numeric($especie)) {
                $sqlEspecie = "SELECT Nombre FROM Especie WHERE EspecieID = ?";
                $stmtEspecie = $this->pdo->prepare($sqlEspecie);
                $stmtEspecie->execute([intval($especie)]);
                $resultadoEspecie = $stmtEspecie->fetch(PDO::FETCH_ASSOC);
                
                if ($resultadoEspecie) {
                    $nombreEspecie = $resultadoEspecie['Nombre'];
                    error_log("Especie convertida: ID $especie -> Nombre '$nombreEspecie'");
                } else {
                    throw new Exception("La especie seleccionada no es valida");
                }
            } else {
                $nombreEspecie = trim($especie);
                error_log("Especie ya es nombre: '$nombreEspecie'");
            }

            // Validar y convertir condiciones a cadena
            $condicionesStr = null;
            if (is_array($condiciones)) {
                $condicionesValidas = array_filter($condiciones, function($c) {
                    return is_numeric($c) && intval($c) > 0;
                });
                $condicionesStr = !empty($condicionesValidas) ? implode(",", $condicionesValidas) : null;
            } elseif (is_string($condiciones) && preg_match('/^\d+(,\d+)*$/', $condiciones)) {
                $condicionesStr = $condiciones;
            }
            error_log("Condiciones procesadas: " . ($condicionesStr ?? "NINGUNA"));

            // NUEVA ESTRATEGIA: Primero registrar SIN foto usando el SP, luego agregar la foto
            error_log("=== PASO 1: Registrando mascota sin foto ===");
            
            $sql = "EXEC RegistrarMascota @Nombre = ?, @Especie = ?, @Peso = ?, @Edad = ?, @CedulaCliente = ?, @RazaID = ?, @Genero = ?, @Foto = NULL, @Condiciones = ?";
            $stmt = $this->pdo->prepare($sql);
            
            $params = [
                trim($nombre),
                $nombreEspecie,
                floatval($peso),
                strval($edad),
                trim($cedulaCliente),
                intval($razaID),
                trim($genero),
                $condicionesStr
            ];

            error_log("SQL: $sql");
            error_log("Parámetros:");
            foreach ($params as $i => $param) {
                error_log("  Param $i: " . var_export($param, true));
            }

            $resultado = $stmt->execute($params);
            
            if (!$resultado) {
                $errorInfo = $stmt->errorInfo();
                error_log("Error info: " . print_r($errorInfo, true));
                throw new Exception("Error al registrar la mascota: " . $errorInfo[2]);
            }

            error_log("=== PASO 1 COMPLETADO: Mascota registrada sin foto ===");

            // PASO 2: Si hay foto, agregarla por separado
            if ($foto !== null && strlen($foto) > 0) {
                error_log("=== PASO 2: Agregando foto ===");
                
                try {
                    // Obtener el ID de la mascota que acabamos de crear
                    $sqlGetID = "SELECT TOP 1 IDMascota FROM Mascota WHERE CedulaCliente = ? AND Nombre = ? ORDER BY IDMascota DESC";
                    $stmtGetID = $this->pdo->prepare($sqlGetID);
                    $stmtGetID->execute([trim($cedulaCliente), trim($nombre)]);
                    $mascotaID = $stmtGetID->fetchColumn();
                    
                    if (!$mascotaID) {
                        error_log("ERROR: No se pudo obtener el ID de la mascota");
                        throw new Exception("No se pudo obtener el ID de la mascota registrada");
                    }
                    
                    error_log("ID de mascota obtenido: $mascotaID");
                    
                    // Intentar actualizar la foto con diferentes métodos
                    $fotoGuardada = false;
                    
                    // MÉTODO 1: UPDATE directo con datos binarios
                    try {
                        error_log("Intentando MÉTODO 1: UPDATE directo");
                        $sqlUpdateFoto = "UPDATE Mascota SET Foto = ? WHERE IDMascota = ?";
                        $stmtUpdateFoto = $this->pdo->prepare($sqlUpdateFoto);
                        $resultadoFoto = $stmtUpdateFoto->execute([$foto, $mascotaID]);
                        
                        if ($resultadoFoto) {
                            error_log("✅ MÉTODO 1 EXITOSO: Foto guardada con UPDATE directo");
                            $fotoGuardada = true;
                        }
                    } catch (Exception $e1) {
                        error_log("❌ MÉTODO 1 FALLÓ: " . $e1->getMessage());
                    }
                    
                    // MÉTODO 2: Si el método 1 falló, intentar con archivo temporal
                    if (!$fotoGuardada) {
                        try {
                            error_log("Intentando MÉTODO 2: Archivo temporal");
                            $sqlUpdateFoto = "UPDATE Mascota SET Foto = ? WHERE IDMascota = ?";
                            $stmtUpdateFoto = $this->pdo->prepare($sqlUpdateFoto);
                            
                            // Crear archivo temporal
                            $tempFile = tmpfile();
                            fwrite($tempFile, $foto);
                            rewind($tempFile);
                            
                            $stmtUpdateFoto->bindValue(1, $tempFile, PDO::PARAM_LOB);
                            $stmtUpdateFoto->bindValue(2, $mascotaID, PDO::PARAM_INT);
                            
                            $resultadoFoto = $stmtUpdateFoto->execute();
                            fclose($tempFile);
                            
                            if ($resultadoFoto) {
                                error_log("✅ MÉTODO 2 EXITOSO: Foto guardada con archivo temporal");
                                $fotoGuardada = true;
                            }
                        } catch (Exception $e2) {
                            error_log("❌ MÉTODO 2 FALLÓ: " . $e2->getMessage());
                        }
                    }
                    
                    // MÉTODO 3: Si ambos fallaron, intentar con base64
                    if (!$fotoGuardada) {
                        try {
                            error_log("Intentando MÉTODO 3: Base64");
                            $fotoBase64 = base64_encode($foto);
                            $sqlUpdateFoto = "UPDATE Mascota SET Foto = CONVERT(varbinary(max), ?, 1) WHERE IDMascota = ?";
                            $stmtUpdateFoto = $this->pdo->prepare($sqlUpdateFoto);
                            $resultadoFoto = $stmtUpdateFoto->execute(['0x' . bin2hex($foto), $mascotaID]);
                            
                            if ($resultadoFoto) {
                                error_log("✅ MÉTODO 3 EXITOSO: Foto guardada con base64");
                                $fotoGuardada = true;
                            }
                        } catch (Exception $e3) {
                            error_log("❌ MÉTODO 3 FALLÓ: " . $e3->getMessage());
                        }
                    }
                    
                    if (!$fotoGuardada) {
                        error_log("⚠️ ADVERTENCIA: Mascota registrada pero no se pudo guardar la foto");
                        // NO lanzar excepción aquí - la mascota sí se registró
                    } else {
                        error_log("=== PASO 2 COMPLETADO: Foto guardada exitosamente ===");
                    }
                    
                } catch (Exception $eFoto) {
                    error_log("Error al procesar foto: " . $eFoto->getMessage());
                    // NO lanzar excepción - la mascota ya se registró
                }
            }

            error_log("=== MASCOTA REGISTRADA EXITOSAMENTE ===");
            return true;

        } catch (PDOException $e) {
            $msg = $e->getMessage();
            error_log("=== ERROR PDO ===");
            error_log("Mensaje completo: " . $msg);
            error_log("Código: " . $e->getCode());

            // Manejo de errores específicos del SP con mensajes amigables
            if (stripos($msg, 'El cliente no existe') !== false) {
                throw new Exception("No encontramos un cliente registrado con esa cedula");
            } elseif (stripos($msg, 'ya tiene 2 mascotas') !== false) {
                throw new Exception("Este cliente ya tiene 2 mascotas registradas (maximo permitido)");
            } elseif (stripos($msg, 'peso debe ser mayor') !== false) {
                throw new Exception("El peso debe ser mayor a cero");
            } elseif (stripos($msg, 'edad debe ser mayor') !== false) {
                throw new Exception("La edad debe ser un numero mayor a cero");
            } elseif (stripos($msg, 'raza proporcionada no es válida') !== false) {
                throw new Exception("La raza seleccionada no es valida");
            } elseif (stripos($msg, 'CHECK constraint') !== false && stripos($msg, 'Especie') !== false) {
                throw new Exception("El tipo de especie no es valido");
            } elseif (stripos($msg, 'CHECK constraint') !== false && stripos($msg, 'CantidadDeMascotas') !== false) {
                throw new Exception("Este cliente ya tiene el maximo de mascotas permitidas");
            } elseif (stripos($msg, 'UPDATE statement conflicted') !== false && stripos($msg, 'CantidadDeMascotas') !== false) {
                throw new Exception("Este cliente ya tiene el maximo de mascotas permitidas");
            } else {
                // Limpiar mensaje genérico
                $mensajeLimpio = preg_replace('/SQLSTATE\[.*?\]: .*?\] /', '', $msg);
                $mensajeLimpio = preg_replace('/\[.*?\]/', '', $mensajeLimpio);
                $mensajeLimpio = preg_replace('/The .* statement conflicted with the CHECK constraint.*/', 'Valor no permitido por las reglas de la base de datos', $mensajeLimpio);
                $mensajeLimpio = trim($mensajeLimpio);
                
                if (empty($mensajeLimpio) || stripos($mensajeLimpio, 'SQLSTATE') !== false) {
                    $mensajeLimpio = "Error al registrar la mascota";
                }
                
                throw new Exception($mensajeLimpio);
            }
        } catch (Exception $e) {
            error_log("=== ERROR GENERAL ===");
            error_log("Mensaje: " . $e->getMessage());
            throw $e;
        }
    }

    public function consultarMascota($idMascota = null, $cedula = null) {
        try {
            error_log("=== CONSULTA MASCOTA ===");
            error_log("ID Mascota: " . ($idMascota ?? "NULL"));
            error_log("Cedula: " . ($cedula ?? "NULL"));

            $sql = "EXEC ConsultarClienteYMascota @Cedula = ?, @IDMascota = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$cedula, $idMascota]);

            // Obtener TODOS los resultados (no solo uno)
            $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("Número de resultados obtenidos: " . count($resultados));

            if (empty($resultados)) {
                error_log("No se encontraron resultados");
                return null;
            }

            // Si hay resultados, procesarlos
            $datosCliente = null;
            $mascotas = [];

            foreach ($resultados as $fila) {
                error_log("Procesando fila: " . print_r($fila, true));

                // Extraer datos del cliente (solo una vez)
                if ($datosCliente === null) {
                    $datosCliente = [
                        'CedulaCliente' => $fila['CedulaCliente'],
                        'NombreCliente' => $fila['NombreCliente'],
                        'Teléfono' => $fila['Teléfono'],
                        'Email' => $fila['Email'],
                        'Dirección' => $fila['Dirección'],
                        'CantidadDeMascotas' => $fila['CantidadDeMascotas']
                    ];
                }

                // Solo procesar si hay mascota (IDMascota no es null)
                if (!empty($fila['IDMascota'])) {
                    // Procesar foto si existe
                    $fotoBase64 = null;
                    if (!empty($fila['Foto'])) {
                        $fotoBase64 = base64_encode($fila['Foto']);
                    }

                    $mascota = [
                        'IDMascota' => $fila['IDMascota'],
                        'NombreMascota' => $fila['NombreMascota'],
                        'Especie' => $fila['Especie'],
                        'RazaMascota' => $fila['RazaMascota'],
                        'Peso' => $fila['Peso'],
                        'Edad' => $fila['Edad'],
                        'Genero' => $fila['Genero'],
                        'FechaRegistro' => $fila['FechaRegistro'],
                        'CondicionesMedicas' => $fila['CondicionesMedicas'] ?? 'Sin condiciones médicas',
                        'FotoBase64' => $fotoBase64
                    ];

                    $mascotas[] = $mascota;
                }
            }

            // Estructurar respuesta final
            $respuesta = [
                'cliente' => $datosCliente,
                'mascotas' => $mascotas,
                'totalMascotas' => count($mascotas)
            ];

            error_log("Respuesta estructurada: " . print_r($respuesta, true));
            return $respuesta;

        } catch (PDOException $e) {
            error_log("Error al consultar mascota: " . $e->getMessage());
            throw new Exception("Error al consultar mascota: " . $e->getMessage());
        }
    }

    public function actualizarMascota($idMascota, $peso, $edad) {
        try {
            $stmt = $this->conn->prepare("EXEC ActualizarMascota @IDMascota = ?, @NuevoPeso = ?, @NuevaEdad = ?");
            $stmt->bindParam(1, $idMascota, PDO::PARAM_INT);
            $stmt->bindParam(2, $peso);
            $stmt->bindParam(3, $edad);
            $stmt->execute();

            return ['success' => true, 'message' => 'Mascota actualizada correctamente'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

     public static function obtenerCondicionesMedicasDesdeSQL() {
        $conn = self::conectar();

        $sql = "SELECT CondicionID, NombreCondicion FROM CondicionesMedicas"; // ajusta los nombres
        $stmt = sqlsrv_query($conn, $sql);

        $condiciones = [];

            if ($stmt) {
                while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $condiciones[] = $row;
                }
            } else {
                die(print_r(sqlsrv_errors(), true));
            }

            return $condiciones;
        }

    public function listarRazasPorEspecie($especieID) {
        try {
            $sql = "SELECT RazaID, Nombre FROM Raza WHERE EspecieID = ? ORDER BY Nombre";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$especieID]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al listar razas: " . $e->getMessage());
            throw new Exception("Error al listar razas: " . $e->getMessage());
        }
    }

    public function listarCondicionesPorEspecie($especieID) {
        try {
            $sql = "SELECT CondicionID, Nombre FROM CondicionMedica WHERE EspecieID = ? ORDER BY Nombre";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$especieID]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al listar condiciones: " . $e->getMessage());
            throw new Exception("Error al listar condiciones: " . $e->getMessage());
        }
    }

    public function listarEspecies() {
        try {
            $sql = "SELECT EspecieID, Nombre FROM Especie ORDER BY Nombre";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al listar especies: " . $e->getMessage());
            throw new Exception("Error al listar especies: " . $e->getMessage());
        }
    }

    public function obtenerClientePorCedula($cedula) {
        try {
            $query = "SELECT * FROM Cliente WHERE Cedula = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$cedula]);
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            return $resultado ?: null;
        } catch (PDOException $e) {
            error_log("Error al obtener cliente: " . $e->getMessage());
            throw new Exception("Error al obtener cliente: " . $e->getMessage());
        }
    }

    public function obtenerCondicionesPorEspecie($especieID) {
        $sql = "SELECT id, descripcion FROM condiciones_medicas WHERE especie_id = ?";
        $stmt = $this->conexion->prepare($sql);
        $stmt->bind_param("i", $especieID);
        $stmt->execute();
        $result = $stmt->get_result();

        $condiciones = [];
        while ($row = $result->fetch_assoc()) {
            $condiciones[] = $row;
        }
        return $condiciones;
    }



 ///////////////////////////////////////////////////////////////////////
///////////////////////Gestion de Usuarios/////////////////////////////
///////////////////////////////////////////////////////////////////////

// Obtener todos los usuarios (usando ListarUsuarios con validación de permisos)
public function obtenerUsuarios($usuarioSolicitanteId) {
    try {
        $sql = "EXEC ListarUsuarios ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$usuarioSolicitanteId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error obteniendo usuarios: " . $e->getMessage());
        throw new Exception("Error al obtener usuarios: " . $e->getMessage());
    }
}

// Obtener todos los roles
public function obtenerRoles() {
    try {
        $sql = "SELECT RolID, NombreRol, Descripcion FROM Roles ORDER BY NombreRol";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($roles)) {
            error_log("No se encontraron roles en la base de datos");
            return []; // Devuelve array vacío en lugar de lanzar excepción
        }
        
        return $roles;
    } catch (PDOException $e) {
        error_log("Error en obtenerRoles(): " . $e->getMessage());
        throw new Exception("Error al obtener roles de la base de datos");
    }
}

// Registrar usuario (usando CrearUsuario con validación de permisos)
public function registrarUsuario($datosUsuario, $usuarioCreadorId) {
    try {
        // In the registrarUsuario method, ensure all parameters are passed:
$sql = "EXEC CrearUsuario 
    @NombreUsuario = ?, 
    @Email = ?, 
    @PasswordHash = ?, 
    @NombreCompleto = ?, 
    @RolID = ?, 
    @CedulaCliente = ?, 
    @UsuarioCreadorID = ?,
    @Telefono = ?,
    @Direccion = ?";
    
$stmt = $this->pdo->prepare($sql);
$stmt->execute([
    $datosUsuario['nombreUsuario'],
    $datosUsuario['email'],
    $passwordHash,
    $datosUsuario['nombreCompleto'],
    $datosUsuario['rolId'],
    $datosUsuario['cedulaCliente'] ?? null,
    $usuarioCreadorId,
    $datosUsuario['telefono'] ?? null,
    $datosUsuario['direccion'] ?? null
]);
        
        return [
            'success' => true,
            'message' => 'Usuario creado exitosamente'
        ];
    } catch (PDOException $e) {
        error_log("Error en registrarUsuario: " . $e->getMessage());
        
        // Manejo específico de errores de SQL Server
        if (strpos($e->getMessage(), 'UNIQUE constraint') !== false) {
            if (strpos($e->getMessage(), 'NombreUsuario') !== false) {
                throw new Exception('El nombre de usuario ya está en uso');
            }
            if (strpos($e->getMessage(), 'Email') !== false) {
                throw new Exception('El correo electrónico ya está registrado');
            }
        }
        
        throw new Exception('Error al crear usuario: ' . $e->getMessage());
    }
}

public function actualizarUsuario($idUsuario, $datosUsuario, $usuarioEditorId) {
    error_log("Conexion::actualizarUsuario() - Iniciando con ID: " . $idUsuario);
    error_log("Conexion::actualizarUsuario() - Datos: " . print_r($datosUsuario, true));
    error_log("Conexion::actualizarUsuario() - Editor: " . $usuarioEditorId);
    
    try {
        $sql = "EXEC ActualizarUsuario 
            @UsuarioID = ?, 
            @NombreCompleto = ?, 
            @Email = ?, 
            @CedulaCliente = ?, 
            @Activo = ?, 
            @UsuarioEditorID = ?,
            @Telefono = ?,
            @Direccion = ?";
        
        error_log("Conexion::actualizarUsuario() - SQL: " . $sql);
        
        $stmt = $this->pdo->prepare($sql);
        
        $parametros = [
            $idUsuario,
            $datosUsuario['nombreCompleto'] ?? null,
            $datosUsuario['email'] ?? null,
            $datosUsuario['cedulaCliente'] ?? null,
            $datosUsuario['activo'] ?? 1,
            $usuarioEditorId,
            $datosUsuario['telefono'] ?? null,
            $datosUsuario['direccion'] ?? null
        ];
        
        error_log("Conexion::actualizarUsuario() - Parámetros: " . print_r($parametros, true));
        
        $resultado = $stmt->execute($parametros);
        error_log("Conexion::actualizarUsuario() - Execute resultado: " . ($resultado ? 'true' : 'false'));
        
        if (!$resultado) {
            $errorInfo = $stmt->errorInfo();
            error_log("Conexion::actualizarUsuario() - Error en execute: " . print_r($errorInfo, true));
            throw new Exception('Error al ejecutar el procedimiento: ' . implode(' - ', $errorInfo));
        }
        
        // Cambiar contraseña si se proporciona
        if (!empty($datosUsuario['password'])) {
            error_log("Conexion::actualizarUsuario() - Cambiando contraseña...");
            $passwordHash = password_hash($datosUsuario['password'], PASSWORD_DEFAULT);
            $sqlPassword = "UPDATE Usuarios SET PasswordHash = ? WHERE UsuarioID = ?";
            $stmtPassword = $this->pdo->prepare($sqlPassword);
            $resultadoPassword = $stmtPassword->execute([$passwordHash, $idUsuario]);
            error_log("Conexion::actualizarUsuario() - Password actualizado: " . ($resultadoPassword ? 'true' : 'false'));
        }
        
        return ['success' => true, 'message' => 'Usuario actualizado exitosamente'];
        
    } catch (PDOException $e) {
        error_log("Conexion::actualizarUsuario() - PDOException: " . $e->getMessage());
        error_log("Conexion::actualizarUsuario() - Error Code: " . $e->getCode());
        return [
            'success' => false,
            'message' => $e->getMessage()
        ];
    } catch (Exception $e) {
        error_log("Conexion::actualizarUsuario() - Exception: " . $e->getMessage());
        return [
            'success' => false,
            'message' => $e->getMessage()
        ];
    }
}

// Cambiar estado de usuario (activo/inactivo)
public function cambiarEstadoUsuario($idUsuario, $nuevoEstado, $usuarioEditorId) {
    try {
        $sql = "EXEC CambiarEstadoUsuario ?, ?, ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$idUsuario, $nuevoEstado, $usuarioEditorId]);
        
        return ['success' => true, 'message' => 'Estado del usuario actualizado'];
    } catch (PDOException $e) {
        error_log("Error cambiando estado de usuario: " . $e->getMessage());
        
        if (strpos($e->getMessage(), 'No tienes permisos') !== false) {
            throw new Exception("No tienes permisos para realizar esta acción");
        }
        
        throw new Exception("Error al cambiar estado del usuario: " . $e->getMessage());
    }
}

// Obtener información detallada de un usuario
public function obtenerUsuarioPorId($idUsuario) {
    try {
        $sql = "EXEC ObtenerInfoCompletaUsuario ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$idUsuario]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error obteniendo usuario por ID: " . $e->getMessage());
        throw new Exception("Error al obtener información del usuario: " . $e->getMessage());
    }
}

// Cambiar contraseña de usuario
public function cambiarContrasena($idUsuario, $nuevaContrasena) {
    try {
        $passwordHash = password_hash($nuevaContrasena, PASSWORD_DEFAULT);
        
        $sql = "UPDATE Usuarios SET PasswordHash = ? WHERE UsuarioID = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$passwordHash, $idUsuario]);
        
        return ['success' => true, 'message' => 'Contraseña actualizada exitosamente'];
    } catch (PDOException $e) {
        error_log("Error cambiando contraseña: " . $e->getMessage());
        throw new Exception("Error al cambiar contraseña: " . $e->getMessage());
    }
}

// Obtener permisos de un rol específico
public function obtenerPermisosPorRol($rolId) {
    try {
        $sql = "SELECT p.PermisoID, p.NombrePermiso, p.Modulo 
                FROM RolesPermisos rp
                JOIN Permisos p ON rp.PermisoID = p.PermisoID
                WHERE rp.RolID = ?
                ORDER BY p.Modulo, p.NombrePermiso";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$rolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error obteniendo permisos por rol: " . $e->getMessage());
        throw new Exception("Error al obtener permisos: " . $e->getMessage());
    }
}

// Obtener todos los permisos disponibles
public function obtenerTodosPermisos() {
    try {
        $sql = "SELECT PermisoID, NombrePermiso, Modulo FROM Permisos ORDER BY Modulo, NombrePermiso";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error obteniendo todos los permisos: " . $e->getMessage());
        throw new Exception("Error al obtener permisos: " . $e->getMessage());
    }
}

// Actualizar permisos de un rol
public function actualizarPermisosRol($rolId, $permisos) {
    try {
        // Iniciar transacción
        $this->pdo->beginTransaction();
        
        // Eliminar permisos actuales
        $sqlDelete = "DELETE FROM RolesPermisos WHERE RolID = ?";
        $stmtDelete = $this->pdo->prepare($sqlDelete);
        $stmtDelete->execute([$rolId]);
        
        // Insertar nuevos permisos
        $sqlInsert = "INSERT INTO RolesPermisos (RolID, PermisoID) VALUES (?, ?)";
        $stmtInsert = $this->pdo->prepare($sqlInsert);
        
        foreach ($permisos as $permisoId) {
            $stmtInsert->execute([$rolId, $permisoId]);
        }
        
        // Confirmar transacción
        $this->pdo->commit();
        
        return ['success' => true, 'message' => 'Permisos actualizados exitosamente'];
    } catch (PDOException $e) {
        // Revertir transacción en caso de error
        $this->pdo->rollBack();
        error_log("Error actualizando permisos: " . $e->getMessage());
        throw new Exception("Error al actualizar permisos: " . $e->getMessage());
    }
}

    // Eliminar usuario (solo admin)
    public function eliminarUsuario($usuarioId, $usuarioSolicitanteId) {
        try {
            $sql = "EXEC EliminarUsuario ?, ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$usuarioId, $usuarioSolicitanteId]);
            return ['success' => true, 'message' => 'Usuario eliminado correctamente'];
        } catch (PDOException $e) {
            error_log("Error eliminando usuario: " . $e->getMessage());
            throw new Exception("Error al eliminar usuario: " . $e->getMessage());
        }
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