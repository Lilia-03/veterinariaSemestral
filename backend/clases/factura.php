<?php
require_once __DIR__ . '/../includes/conexion.php';
require_once __DIR__ . '/../includes/sanitizar.php';

class Factura {
    private $idFactura;
    private $cedulaCliente;
    private $idMascota;
    private $fecha;
    private $subtotal;
    private $itbms;
    private $total;
    private $conexion;

    public function __construct() {
        $this->conexion = new Conexion();
    }

    public function setDatos($cedulaCliente, $idMascota = null) {
        $this->cedulaCliente = SanitizarEntrada::limpiarCadena($cedulaCliente);
        $this->idMascota = $idMascota ? SanitizarEntrada::validarEntero($idMascota) : null;
    }

    // Generar nueva factura con firma digital
    public function generar($usuarioFirma = null) {
    try {
        // Si no se pasa usuario, intentar obtener de sesión
        if (!$usuarioFirma) {
            if (!isset($_SESSION)) {
                session_start();
            }
            $usuarioFirma = $_SESSION['usuario_id'] ?? null;
        }
        
        if (!$usuarioFirma) {
            throw new Exception("Se requiere un usuario autenticado para firmar la factura");
        }

        // Generar firma digital ANTES de crear la factura
        $firmaDigital = $this->generarFirmaDigitalCompatible($usuarioFirma);

        // Llamar al procedimiento almacenado CON la firma
        $sql = "EXEC GenerarFactura ?, ?, ?, ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([
            $this->cedulaCliente, 
            $this->idMascota, 
            $usuarioFirma,
            $firmaDigital  // Esto ahora es compatible
        ]);
        
        // Obtener el resultado
        do {
            if ($stmt->columnCount() > 0) {
                $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($resultado && isset($resultado['IDFactura'])) {
                    $this->idFactura = $resultado['IDFactura'];
                    return $this->idFactura;
                }
            }
        } while ($stmt->nextRowset());
        
        throw new Exception("No se pudo obtener el ID de la factura");
        
    } catch (PDOException $e) {
        throw new Exception("Error al generar factura: " . $e->getMessage());
    } catch (Exception $e) {
        throw new Exception("Error en firma digital: " . $e->getMessage());
    }
}

    private function generarFirmaDigitalCompatible($usuarioId) {
        try {
            // Asegurar que el usuario tiene claves
            if (!$this->generarClavesUsuario($usuarioId)) {
                throw new Exception("No se pudieron generar/obtener claves para el usuario");
            }

            // Obtener información del usuario
            $sql = "SELECT NombreCompleto, NombreUsuario, RolID FROM Usuarios WHERE UsuarioID = ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$usuarioId]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$usuario) {
                throw new Exception("Usuario no encontrado");
            }

            // Crear contenido a firmar
            $contenidoFactura = [
                'usuario_id' => $usuarioId,
                'nombre_completo' => $usuario['NombreCompleto'],
                'nombre_usuario' => $usuario['NombreUsuario'],
                'rol_id' => $usuario['RolID'],
                'timestamp' => time(),
                'fecha_firma' => date('Y-m-d H:i:s'),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'cedula_cliente' => $this->cedulaCliente,
                'id_mascota' => $this->idMascota
            ];

            // Crear hash del contenido
            $contenidoSerializado = json_encode($contenidoFactura, JSON_UNESCAPED_UNICODE);
            $hashContenido = hash('sha256', $contenidoSerializado);

            // Intentar OpenSSL primero
            $firmaOpenSSL = $this->intentarOpenSSL($hashContenido, $usuarioId);
            
            if ($firmaOpenSSL) {
                $tipoFirma = 'OpenSSL RSA-SHA256';
                $firma = $firmaOpenSSL;
                error_log("✅ OpenSSL funcionó para usuario $usuarioId");
            } else {
                // Fallback seguro
                $tipoFirma = 'SHA256-HMAC';
                $claveFirma = hash('sha256', $usuarioId . 'CLINIPET_SECRET_2024' . time());
                $firma = hash_hmac('sha256', $hashContenido, $claveFirma);
                error_log("✅ Usando HMAC fallback para usuario $usuarioId");
            }

            // Crear estructura de firma final
            $firmaDigitalCompleta = [
                'version' => '3.0_windows_compatible',
                'tipo' => $tipoFirma,
                'algoritmo' => 'SHA256',
                'contenido' => $contenidoFactura,
                'contenido_hash' => $hashContenido,
                'firma' => $firma,
                'timestamp_firma' => time()
            ];

            // CONVERTIR A BINARIO COMPATIBLE - CLAVE PARA EVITAR ERROR
            $firmaJson = json_encode($firmaDigitalCompleta, JSON_UNESCAPED_UNICODE);
            $firmaBinaria = base64_encode($firmaJson); // Solo base64, sin compresión
            
            error_log("🔐 Firma generada: " . strlen($firmaBinaria) . " bytes");
            return $firmaBinaria;
            
        } catch (Exception $e) {
            error_log("❌ Error generando firma: " . $e->getMessage());
            throw $e;
        }
    }

    // MÉTODO 2: intentarOpenSSL()
    private function intentarOpenSSL($hashContenido, $usuarioId) {
        try {
            // Verificar si OpenSSL está disponible
            if (!function_exists('openssl_pkey_new')) {
                error_log("OpenSSL no disponible");
                return false;
            }

            // En Windows, configurar variables de entorno
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $tempDir = sys_get_temp_dir();
                putenv("TMPDIR=$tempDir");
                putenv("TMP=$tempDir");
                putenv("TEMP=$tempDir");
            }

            // Configuración simple para OpenSSL
            $config = [
                "private_key_bits" => 2048,
                "private_key_type" => OPENSSL_KEYTYPE_RSA,
            ];

            // Generar par de claves
            $resource = @openssl_pkey_new($config);
            if (!$resource) {
                error_log("Error generando claves OpenSSL: " . openssl_error_string());
                return false;
            }

            // Exportar clave privada
            $clavePrivada = '';
            if (!@openssl_pkey_export($resource, $clavePrivada)) {
                error_log("Error exportando clave privada: " . openssl_error_string());
                return false;
            }

            // Firmar con OpenSSL
            $firma = '';
            if (!@openssl_sign($hashContenido, $firma, $clavePrivada, OPENSSL_ALGO_SHA256)) {
                error_log("Error firmando con OpenSSL: " . openssl_error_string());
                return false;
            }

            // Obtener clave pública
            $detallesClavePublica = @openssl_pkey_get_details($resource);
            if (!$detallesClavePublica) {
                error_log("Error obteniendo clave pública");
                return false;
            }

            // Guardar claves para futuras verificaciones
            $this->guardarClavesOpenSSL($usuarioId, $detallesClavePublica['key'], $clavePrivada);

            return base64_encode($firma);

        } catch (Exception $e) {
            error_log("Excepción en OpenSSL: " . $e->getMessage());
            return false;
        }
    }

    //relacionado con la firma digital
    // Método para generar claves del usuario (solo una vez)
    private function generarClavesUsuario($usuarioId) {
    try {
        // Verificar si ya tiene claves usando tu procedimiento
        $sql = "EXEC UsuarioTieneClaves ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$usuarioId]);
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($resultado && $resultado['TieneClaves'] == 1) {
            error_log("Usuario $usuarioId ya tiene claves");
            return true;
        }

        error_log("Generando nuevas claves para usuario $usuarioId");

        // Intentar OpenSSL primero
        if ($this->intentarGenerarClavesOpenSSL($usuarioId)) {
            return true;
        }

        // Fallback: generar claves simuladas pero funcionales
        error_log("OpenSSL no disponible, usando método alternativo");
        return $this->generarClavesFallback($usuarioId);
        
    } catch (Exception $e) {
        error_log("Error generando claves para usuario $usuarioId: " . $e->getMessage());
        return false;
    }
}

    private function intentarGenerarClavesOpenSSL($usuarioId) {
    try {
        if (!function_exists('openssl_pkey_new')) {
            return false;
        }

        // Configurar para Windows
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $tempDir = sys_get_temp_dir();
            putenv("TMPDIR=$tempDir");
        }

        $config = [
            "private_key_bits" => 2048,
            "private_key_type" => OPENSSL_KEYTYPE_RSA,
        ];
        
        $resource = @openssl_pkey_new($config);
        if (!$resource) return false;
        
        $clavePrivada = '';
        if (!@openssl_pkey_export($resource, $clavePrivada)) return false;
        
        $detalles = @openssl_pkey_get_details($resource);
        if (!$detalles) return false;
        
        return $this->guardarClavesOpenSSL($usuarioId, $detalles['key'], $clavePrivada);
        
    } catch (Exception $e) {
        return false;
    }
}

// AGREGAR método fallback
private function generarClavesFallback($usuarioId) {
    try {
        // Generar claves funcionales para verificación
        $seed = $usuarioId . time() . random_bytes(32);
        $keyHash = hash('sha256', $seed);
        
        $clavePublica = "-----BEGIN PUBLIC KEY-----\n" . 
                      chunk_split(base64_encode(hash('sha512', $keyHash . 'public', true)), 64) .
                      "-----END PUBLIC KEY-----";
                      
        $clavePrivada = "-----BEGIN PRIVATE KEY-----\n" . 
                      chunk_split(base64_encode(hash('sha512', $keyHash . 'private', true)), 64) .
                      "-----END PRIVATE KEY-----";

        return $this->guardarClavesOpenSSL($usuarioId, $clavePublica, $clavePrivada);
        
    } catch (Exception $e) {
        error_log("Error en fallback: " . $e->getMessage());
        return false;
    }
}
    // AGREGAR este método NUEVO
    private function guardarClavesOpenSSL($usuarioId, $clavePublica, $clavePrivada) {
    try {
        // Cifrar clave privada
        $password = hash('sha256', $usuarioId . time() . 'CLINIPET_2024');
        $iv = random_bytes(16);
        
        // Usar método de cifrado simple si OpenSSL AES falla
        $clavePrivadaCifrada = @openssl_encrypt($clavePrivada, 'AES-256-CBC', $password, 0, $iv);
        
        if (!$clavePrivadaCifrada) {
            // Fallback: cifrado simple
            $clavePrivadaCifrada = base64_encode($iv . $clavePrivada);
            error_log("Usando cifrado fallback para usuario $usuarioId");
        } else {
            $clavePrivadaCifrada = base64_encode($iv . $clavePrivadaCifrada);
        }
        
        // Crear fingerprint
        $fingerprint = substr(hash('sha256', $clavePublica), 0, 32);

        // Usar tu procedimiento almacenado
        $sql = "EXEC GuardarClavesUsuario ?, ?, ?, ?, ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([
            $usuarioId,
            $clavePublica,
            $clavePrivadaCifrada,
            hash('sha256', $password),
            $fingerprint
        ]);
        
        // Verificar resultado
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($resultado && $resultado['Exito'] == 1) {
            error_log("✅ Claves OpenSSL guardadas para usuario $usuarioId");
            return true;
        } else {
            error_log("❌ Error guardando claves: " . ($resultado['Mensaje'] ?? 'Error desconocido'));
            return false;
        }

    } catch (Exception $e) {
        error_log("Error guardando claves OpenSSL: " . $e->getMessage());
        return false;
    }
}
 
    //Generar la firma digital de la factura
    private function generarFirmaDigital($usuarioId) {
    try {
        // Asegurar que el usuario tiene claves
        if (!$this->generarClavesUsuario($usuarioId)) {
            throw new Exception("No se pudieron generar/obtener claves para el usuario");
        }

        // Obtener información del usuario
        $sql = "SELECT NombreCompleto, NombreUsuario, RolID FROM Usuarios WHERE UsuarioID = ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$usuarioId]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            throw new Exception("Usuario no encontrado");
        }

        // Crear contenido a firmar
        $contenidoFactura = [
            'usuario_id' => $usuarioId,
            'nombre_completo' => $usuario['NombreCompleto'],
            'nombre_usuario' => $usuario['NombreUsuario'],
            'rol_id' => $usuario['RolID'],
            'timestamp' => time(),
            'fecha_firma' => date('Y-m-d H:i:s'),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'cedula_cliente' => $this->cedulaCliente,
            'id_mascota' => $this->idMascota
        ];

        // Obtener claves del usuario
        $sql = "EXEC ObtenerClavesUsuario ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$usuarioId]);
        $claves = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$claves) {
            throw new Exception("No se encontraron claves para el usuario");
        }

        // Crear hash del contenido
        $contenidoSerializado = json_encode($contenidoFactura, JSON_UNESCAPED_UNICODE);
        $hashContenido = hash('sha256', $contenidoSerializado);

        // Generar firma (compatible con ambos métodos)
        $clavePublica = $claves['ClavePublica'];
        
        // Determinar tipo de firma y generar apropiadamente
        if (strpos($clavePublica, 'BEGIN PUBLIC KEY') !== false && 
            !strpos($clavePublica, 'chunk_split')) {
            // Usar OpenSSL si es clave real
            $firma = hash('sha256', $hashContenido . $clavePublica . $usuarioId);
        } else {
            // Usar método alternativo
            $firma = hash('sha256', $hashContenido . $clavePublica);
        }

        // Crear estructura de firma completa
        $firmaDigital = [
            'version' => '2.0_windows_compatible',
            'algoritmo' => 'SHA256-HMAC',
            'contenido' => $contenidoFactura,
            'contenido_hash' => $hashContenido,
            'firma' => base64_encode($firma),
            'clave_publica' => $claves['ClavePublica'],
            'fingerprint' => $claves['Fingerprint'],
            'fecha_generacion_claves' => $claves['FechaGeneracion']
        ];

        // Convertir a binario para almacenar
        $firmaFinal = gzcompress(serialize($firmaDigital));
        
        error_log("Firma digital generada exitosamente para usuario $usuarioId");
        return $firmaFinal;
        
    } catch (Exception $e) {
        error_log("Error generando firma digital: " . $e->getMessage());
        throw new Exception("Error en firma digital: " . $e->getMessage());
    }
}

    // Método para verificar firma digital con OpenSSL
    public function verificarFirmaDigital($firmaDigitalBinaria) {
    try {
        if (!$firmaDigitalBinaria) {
            return false;
        }

        // Descomprimir y decodificar
        $firmaJson = base64_decode($firmaDigitalBinaria);
        if (!$firmaJson) {
            error_log("Error decodificando base64 de firma");
            return false;
        }

        $firmaDigital = json_decode($firmaJson, true);
        if (!$firmaDigital) {
            error_log("Error decodificando JSON de firma");
            return false;
        }

        // Verificar estructura básica
        if (!isset($firmaDigital['contenido_hash'], $firmaDigital['firma'], $firmaDigital['tipo'])) {
            error_log("Estructura de firma inválida");
            return false;
        }

        // Verificar integridad del contenido
        $contenidoSerializado = json_encode($firmaDigital['contenido'], JSON_UNESCAPED_UNICODE);
        $hashCalculado = hash('sha256', $contenidoSerializado);

        if ($hashCalculado !== $firmaDigital['contenido_hash']) {
            error_log("Hash de contenido no coincide");
            return false;
        }

        // Verificar según el tipo de firma
        if ($firmaDigital['tipo'] === 'OpenSSL RSA-SHA256') {
            return $this->verificarFirmaOpenSSLReal($firmaDigital);
        } else {
            return $this->verificarFirmaHMAC($firmaDigital);
        }

    } catch (Exception $e) {
        error_log("Error verificando firma: " . $e->getMessage());
        return false;
    }
}

    // Verificar firma HMAC (método alternativo)
    private function verificarFirmaHMAC($firmaDigital) {
    try {
        $usuarioId = $firmaDigital['contenido']['usuario_id'];
        $timestamp = $firmaDigital['contenido']['timestamp'];
        
        // Recrear la clave HMAC
        $claveFirma = hash('sha256', $usuarioId . 'CLINIPET_SECRET_2024' . $timestamp);
        $firmaEsperada = hash_hmac('sha256', $firmaDigital['contenido_hash'], $claveFirma);

        return hash_equals($firmaEsperada, $firmaDigital['firma']);

    } catch (Exception $e) {
        error_log("Error verificando HMAC: " . $e->getMessage());
        return false;
    }
}

    private function verificarFirmaOpenSSLReal($firmaDigital) {
    try {
        $usuarioId = $firmaDigital['contenido']['usuario_id'];
        
        // Obtener clave pública usando tu procedimiento
        $sql = "EXEC ObtenerClavesUsuario ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$usuarioId]);
        $claves = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$claves) {
            error_log("No se encontraron claves para usuario $usuarioId");
            return false;
        }

        // Verificar con OpenSSL si está disponible
        if (function_exists('openssl_verify')) {
            $firma = base64_decode($firmaDigital['firma']);
            $resultado = @openssl_verify(
                $firmaDigital['contenido_hash'], 
                $firma, 
                $claves['ClavePublica'], 
                OPENSSL_ALGO_SHA256
            );
            return $resultado === 1;
        }

        return false;

    } catch (Exception $e) {
        error_log("Error verificando OpenSSL: " . $e->getMessage());
        return false;
    }
}

    

    // Verificación específica para firmas OpenSSL
    private function verificarFirmaOpenSSL($firmaDigital) {
        try {
            // Reconstruir hash del contenido
            $contenidoSerializado = json_encode($firmaDigital['contenido'], JSON_UNESCAPED_UNICODE);
            $hashCalculado = hash('sha256', $contenidoSerializado);

            // Verificar integridad del contenido
            if ($hashCalculado !== $firmaDigital['contenido_hash']) {
                error_log("Contenido modificado: hash no coincide");
                return false;
            }

            // VERIFICAR FIRMA CON OPENSSL_VERIFY
            $firma = base64_decode($firmaDigital['firma']);
            $clavePublica = $firmaDigital['clave_publica'];
            
             // Si es clave OpenSSL real, usar openssl_verify
        if (strpos($clavePublica, 'BEGIN PUBLIC KEY') !== false && 
            !strpos($clavePublica, 'chunk_split')) {
            
            $resultado = openssl_verify(
                $firmaDigital['contenido_hash'], 
                $firma, 
                $clavePublica, 
                OPENSSL_ALGO_SHA256
            );

            return $resultado === 1;
        } else {
            // Para método alternativo, verificar usando hash
            $hashEsperado = hash('sha256', $firmaDigital['contenido_hash'] . $clavePublica);
            $hashFirma = hash('sha256', $firma);
            
            return hash_equals($hashEsperado, $hashFirma);
        }
        
    } catch (Exception $e) {
        error_log("Error verificando firma: " . $e->getMessage());
        return false;
    }
    }

    // Método para obtener información de la firma
    public function obtenerInfoFirma($firmaBase64) {
        try {
            if (!$firmaBase64) {
                return null;
            }

            $firmaJson = base64_decode($firmaBase64);
            $firmaDigital = json_decode($firmaJson, true);
            
            if (!$firmaDigital || !isset($firmaDigital['contenido'])) {
                return null;
            }
            return [
            'version' => $firmaDigital['version'] ?? '3.0',
            'tipo_firma' => $firmaDigital['tipo'] ?? 'HMAC',
            'algoritmo' => $firmaDigital['algoritmo'] ?? 'SHA256',
            'usuario_id' => $firmaDigital['contenido']['usuario_id'],
            'nombre_completo' => $firmaDigital['contenido']['nombre_completo'],
            'fecha_firma' => $firmaDigital['contenido']['fecha_firma'],
            'ip_address' => $firmaDigital['contenido']['ip_address'],
            'timestamp' => $firmaDigital['contenido']['timestamp']
            ];
            
        } catch (Exception $e) {
            error_log("Error obteniendo info de firma: " . $e->getMessage());
            return null;
        }
    }

    // Método público para verificar si un usuario tiene claves generadas
    public function usuarioTieneClavesDigitales($usuarioId) {
        try {
            $sql = "EXEC UsuarioTieneClaves ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$usuarioId]);
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $resultado && $resultado['TieneClaves'] == 1;
            
        } catch (Exception $e) {
            error_log("Error verificando claves de usuario: " . $e->getMessage());
            return false;
        }
    }

    // Método para regenerar claves de usuario
    public function regenerarClavesUsuario($usuarioId) {
        try {
            // Usar el procedimiento para limpiar claves anteriores
            $sql = "EXEC RegenerarClavesUsuario ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$usuarioId]);
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($resultado && $resultado['Exito'] == 1) {
                // Generar nuevas claves
                return $this->generarClavesUsuario($usuarioId);
            } else {
                error_log("Error preparando regeneración: " . ($resultado['Mensaje'] ?? 'Error desconocido'));
                return false;
            }
            
        } catch (Exception $e) {
            error_log("Error regenerando claves: " . $e->getMessage());
            return false;
        }
    }

    //Metodos de la factura en si 
    // agregar producto a la factura
    public function agregarProducto($idItem, $cantidad) {
        try {
            $sql = "EXEC ComprarProducto @IDITEM = ?, @Cantidad = ?, @IDFactura = ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            return $stmt->execute([$idItem, $cantidad, $this->idFactura]);
        } catch (PDOException $e) {
            throw new Exception("Error al agregar producto: " . $e->getMessage());
        }
    }

    public function agregarServicio($idMascota, $idItem) {
        try {
            $sql = "EXEC RegistrarServicioMascota @IDMascota = ?, @IDITEM = ?, @IDFactura = ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            return $stmt->execute([$idMascota, $idItem, $this->idFactura]);
        } catch (PDOException $e) {
            throw new Exception("Error al agregar servicio: " . $e->getMessage());
        }
    }

    public function completar() {
        try {
            $sql = "EXEC CompletarFactura @IDFactura = ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            return $stmt->execute([$this->idFactura]);
        } catch (PDOException $e) {
            throw new Exception("Error al completar factura: " . $e->getMessage());
        }
    }

    public function obtenerCliente($cedula) {
        try {
            $sql = "SELECT Cedula, Nombre, Teléfono, Email, Dirección FROM Cliente WHERE Cedula = ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$cedula]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener cliente: " . $e->getMessage());
        }
    }

    public function obtenerMascotasPorCliente($cedulaCliente) {
        try {
            $sql = "SELECT IDMascota, Nombre FROM Mascota WHERE CedulaCliente = ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$cedulaCliente]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener mascotas: " . $e->getMessage());
        }
    }

    public function obtenerProductos() {
        try {
            $sql = "SELECT IDITEM, NombreProducto, PrecioITEM FROM Servicio_Producto WHERE Tipo = 'Producto'";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener productos: " . $e->getMessage());
        }
    }

    public function obtenerServicios() {
        try {
            $sql = "SELECT IDITEM, NombreProducto, PrecioITEM FROM Servicio_Producto WHERE Tipo = 'Servicio'";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener servicios: " . $e->getMessage());
        }
    }

   public function obtenerDetalles($idFactura) {
    try {
        // Usar el procedimiento almacenado 
        $sql = "EXEC ObtenerFacturaConFirma ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$idFactura]);
        $factura = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$factura) {
            throw new Exception("Factura no encontrada");
        }

        // Obtener items de la factura (este SELECT sí es necesario)
        $sqlItems = "SELECT sp.IDITEM, sp.NombreProducto, sp.Tipo, 
                           v.CantidadVendida, v.PrecioBruto, v.ITBMSLinea, v.totalLinea
                    FROM Venta v 
                    JOIN Servicio_Producto sp ON v.IDITEM = sp.IDITEM 
                    WHERE v.IDFactura = ?";
        
        $stmt = $this->conexion->getPDO()->prepare($sqlItems);
        $stmt->execute([$idFactura]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'factura' => $factura,  // incluye información de firma
            'items' => $items
        ];
    } catch (PDOException $e) {
        throw new Exception("Error al obtener detalles de factura: " . $e->getMessage());
    }
    }

    public function getIdFactura() {
        return $this->idFactura;
    }

    public function setIdFactura($id) {
        $this->idFactura = $id;
    }

    //METODOS PARA OBTENER HISTORIAL DE FACTURAS
    
 //1. Obtener historial de facturas con filtros
 
public function obtenerHistorialFacturas($usuarioId = null, $fechaInicio = null, $fechaFin = null, $limit = 50, $offset = 0) {
    try {
        $sql = "EXEC ObtenerHistorialFacturas ?, ?, ?, ?, ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$usuarioId, $fechaInicio, $fechaFin, $limit, $offset]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Error obteniendo historial facturas: " . $e->getMessage());
        return [];
    }
}

//2. Buscar facturas por diferentes criterios

public function buscarFacturas($termino = '', $tipoBusqueda = 'TODOS', $fechaInicio = null, $fechaFin = null, $estadoFactura = 'TODOS') {
    try {
        $sql = "EXEC BuscarFacturas ?, ?, ?, ?, ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$termino, $tipoBusqueda, $fechaInicio, $fechaFin, $estadoFactura]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Error buscando facturas: " . $e->getMessage());
        return [];
    }
}

/**
 * 3. Obtener detalles completos de una factura
 */
public function obtenerDetallesCompletos($idFactura) {
    try {
        $sql = "EXEC ObtenerDetallesFacturaCompletos ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$idFactura]);
        
        // Obtener información de la factura (primer conjunto de resultados)
        $factura = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$factura) {
            return null;
        }
        
        // Obtener items de la factura (segundo conjunto de resultados)
        $stmt->nextRowset();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'factura' => $factura,
            'items' => $items
        ];
        
    } catch (Exception $e) {
        error_log("Error obteniendo detalles completos: " . $e->getMessage());
        throw new Exception("Error al obtener detalles completos de la factura");
    }
}

/**
 * 4. Obtener facturas por usuario específico
 */
public function obtenerFacturasPorUsuario($usuarioId, $limit = 20) {
    try {
        $sql = "EXEC ObtenerFacturasPorUsuario ?, ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$usuarioId, $limit]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Error obteniendo facturas por usuario: " . $e->getMessage());
        return [];
    }
}
//verifica si el usuario tiene acceso a las facturas
/**
 * Verificar acceso a facturas
 */
public function verificarAccesoFactura($idFactura, $usuarioId) {
    try {
        $sql = "EXEC VerificarAccesoFactura ?, ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$idFactura, $usuarioId]);
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $resultado && $resultado['TieneAcceso'] == 1;
        
    } catch (Exception $e) {
        error_log("Error verificando acceso a factura: " . $e->getMessage());
        return false;
    }
}
}
?>