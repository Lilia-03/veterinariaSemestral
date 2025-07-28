<?php
// 🔧 RUTAS CORREGIDAS PARA LA NUEVA ESTRUCTURA
require_once __DIR__ . '/../clases/Cliente.php';
require_once __DIR__ . '/../clases/Mascota.php';
require_once __DIR__ . '/../includes/conexion.php'; 

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// IMPORTANTE: Configurar la codificación correcta
header("Content-Type: application/json; charset=utf-8");

// DEBUG: Log para ver qué está llegando
error_log("=== DEBUG CONTROLLER START ===");
error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("POST data: " . print_r($_POST, true));
error_log("FILES data: " . print_r($_FILES, true));
error_log("GET data: " . print_r($_GET, true));

$cliente = new Cliente();
$mascota = new Mascota();
$conexion = new Conexion();

// Función para limpiar y hacer amigables los mensajes
function mensajeAmigable($mensaje) {
    // Limpiar caracteres especiales y convertir a UTF-8 limpio
    $mensaje = html_entity_decode($mensaje, ENT_QUOTES, 'UTF-8');
    $mensaje = trim($mensaje);
    
    // Reemplazar mensajes comunes con versiones más amigables
    $mensajesAmigables = [
        'La edad debe ser un número mayor a cero' => 'La edad debe ser un numero mayor a cero',
        'El peso debe ser mayor a cero' => 'El peso debe ser mayor a cero',
        'El cliente con esa cédula no existe en el sistema' => 'No encontramos un cliente registrado con esa cedula',
        'El cliente ya tiene el máximo de 2 mascotas registradas' => 'Este cliente ya tiene 2 mascotas registradas (maximo permitido)',
        'La raza seleccionada no es válida' => 'La raza seleccionada no es valida para esta especie',
        'Datos requeridos faltantes' => 'Faltan algunos datos obligatorios',
        'Nombre de mascota es requerido' => 'El nombre de la mascota es obligatorio',
        'Cédula del cliente es requerida' => 'La cedula del cliente es obligatoria',
        'Debe seleccionar una raza válida' => 'Debe seleccionar una raza valida',
        'La cédula es obligatoria' => 'La cedula es obligatoria',
        'El email no tiene un formato válido' => 'El email no tiene un formato valido',
        'El teléfono no tiene un formato válido' => 'El telefono no tiene un formato valido'
    ];
    
    // Buscar coincidencias y reemplazar
    foreach ($mensajesAmigables as $original => $amigable) {
        if (stripos($mensaje, $original) !== false) {
            return $amigable;
        }
    }
    
    // Si no hay coincidencia exacta, limpiar caracteres problemáticos
    $mensaje = str_replace(['á', 'é', 'í', 'ó', 'ú', 'ñ'], ['a', 'e', 'i', 'o', 'u', 'n'], $mensaje);
    $mensaje = preg_replace('/[^\x20-\x7E]/', '', $mensaje); // Remover caracteres no ASCII
    
    return $mensaje;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $accion = '';

    if ($method === 'GET') {
        $accion = $_GET['accion'] ?? '';
    } elseif ($method === 'POST') {
        $accion = $_POST['accion'] ?? ($_GET['accion'] ?? '');
    }

    error_log("Método: $method, Acción: $accion");

    switch ($method) {
        case 'GET':
            if ($accion === 'listarRazasPorEspecie') {
                $especieID = intval($_GET['especieID']);
                if (!$especieID) {
                    http_response_code(400);
                    echo json_encode(["estado" => "error", "mensaje" => "ID de especie invalido"], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $razas = $conexion->listarRazasPorEspecie($especieID);
                echo json_encode(["estado" => "ok", "razas" => $razas], JSON_UNESCAPED_UNICODE);
                exit;
            }

            if ($accion === 'listarCondicionesPorEspecie') {
                $especieID = intval($_GET['especieID']);
                if (!$especieID) {
                    http_response_code(400);
                    echo json_encode(["estado" => "error", "mensaje" => "ID de especie invalido"], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $condiciones = $conexion->listarCondicionesPorEspecie($especieID);
                echo json_encode(["estado" => "ok", "condiciones" => $condiciones], JSON_UNESCAPED_UNICODE);
                exit;
            }

            if ($accion === 'listarEspecies') {
                try {
                    $especies = $conexion->listarEspecies();
                    echo json_encode(["estado" => "ok", "especies" => $especies], JSON_UNESCAPED_UNICODE);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(["estado" => "error", "mensaje" => "Error al listar especies"], JSON_UNESCAPED_UNICODE);
                }
                exit;
            }

            if ($accion === 'consultarMascota') {
                $idMascota = isset($_GET['id']) ? intval($_GET['id']) : null;
                $cedula = $_GET['cedula'] ?? null;

                if (!$idMascota && !$cedula) {
                    echo json_encode(["estado" => "error", "mensaje" => "Debes proporcionar una cedula o un ID de mascota"], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                try {
                    $resultado = $mascota->consultar($idMascota, $cedula);

                    if ($resultado && !empty($resultado['mascotas'])) {
                        // Respuesta exitosa con datos estructurados
                        echo json_encode([
                            "estado" => "ok", 
                            "cliente" => $resultado['cliente'],
                            "mascotas" => $resultado['mascotas'],
                            "totalMascotas" => $resultado['totalMascotas']
                        ], JSON_UNESCAPED_UNICODE);
                    } elseif ($resultado && !empty($resultado['cliente'])) {
                        // Cliente existe pero no tiene mascotas
                        echo json_encode([
                            "estado" => "ok", 
                            "cliente" => $resultado['cliente'],
                            "mascotas" => [],
                            "totalMascotas" => 0,
                            "mensaje" => "Cliente encontrado pero no tiene mascotas registradas"
                        ], JSON_UNESCAPED_UNICODE);
                    } else {
                        // No se encontró nada
                        echo json_encode([
                            "estado" => "error", 
                            "mensaje" => "No se encontro cliente o mascota con esos datos"
                        ], JSON_UNESCAPED_UNICODE);
                    }
                } catch (Exception $e) {
                    error_log("Error en consultarMascota: " . $e->getMessage());
                    echo json_encode([
                        "estado" => "error", 
                        "mensaje" => "Error al consultar: " . $e->getMessage()
                    ], JSON_UNESCAPED_UNICODE);
                }
                exit;
            }

            if ($accion === 'consultarCliente') {
                error_log("Consultando cliente con cédula: " . ($_GET['cedula'] ?? 'NULL'));
                $cedula = $_GET['cedula'] ?? null;

                if (!$cedula) {
                    echo json_encode(["estado" => "error", "mensaje" => "Debes proporcionar una cedula"], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                try {
                    $resultado = $cliente->consultar($cedula);
                    error_log("Resultado consulta cliente: " . ($resultado ? "ENCONTRADO" : "NO ENCONTRADO"));

                    if ($resultado) {
                        echo json_encode(["estado" => "ok", "cliente" => $resultado], JSON_UNESCAPED_UNICODE);
                    } else {
                        echo json_encode(["estado" => "error", "mensaje" => "No se encontro cliente con esa cedula"], JSON_UNESCAPED_UNICODE);
                    }
                } catch (Exception $e) {
                    error_log("Error consultando cliente: " . $e->getMessage());
                    throw $e;
                }
                exit;
            }

            // Si llegamos aquí, la acción GET no es válida
            http_response_code(400);
            echo json_encode(["estado" => "error", "mensaje" => "Accion GET no valida: $accion"], JSON_UNESCAPED_UNICODE);
            break;

        case 'POST':
            if ($accion === 'registrarCliente') {
                error_log("=== PROCESANDO REGISTRAR CLIENTE ===");

                try {
                    $cedula = $_POST['cedula'] ?? '';
                    $nombre = $_POST['nombre'] ?? '';
                    $telefono = $_POST['telefono'] ?? '';
                    $email = $_POST['email'] ?? '';
                    $direccion = $_POST['direccion'] ?? '';

                    error_log("Datos recibidos:");
                    error_log("- Cédula: $cedula");
                    error_log("- Nombre: $nombre");
                    error_log("- Teléfono: $telefono");
                    error_log("- Email: $email");
                    error_log("- Dirección: $direccion");

                    // ✅ VALIDACIONES BÁSICAS ANTES DE CREAR EL OBJETO
                    if (empty($cedula)) {
                        throw new Exception("La cedula es obligatoria");
                    }
                    if (empty($nombre)) {
                        throw new Exception("El nombre es obligatorio");
                    }
                    if (empty($telefono)) {
                        throw new Exception("El telefono es obligatorio");
                    }
                    if (empty($email)) {
                        throw new Exception("El email es obligatorio");
                    }
                    if (empty($direccion)) {
                        throw new Exception("La direccion es obligatoria");
                    }

                    // ✅ VERIFICAR SI EL CLIENTE YA EXISTE ANTES DE CREAR
                    $clienteExistente = $cliente->consultar($cedula);
                    if ($clienteExistente) {
                        error_log("Cliente ya existe con cédula: $cedula");
                        http_response_code(400);
                        echo json_encode([
                            "estado" => "error",
                            "mensaje" => "Ya existe un cliente registrado con esa cedula"
                        ], JSON_UNESCAPED_UNICODE);
                        exit;
                    }

                    // Crear y configurar cliente
                    $cliente->setDatos($cedula, $nombre, $telefono, $email, $direccion);
                    
                    $resultado = $cliente->guardar();
                    
                    if ($resultado) {
                        error_log("✅ Cliente registrado exitosamente");
                        echo json_encode([
                            "estado" => "ok",
                            "mensaje" => "Cliente registrado correctamente"
                        ], JSON_UNESCAPED_UNICODE);
                    } else {
                        throw new Exception("No se pudo registrar el cliente en la base de datos");
                    }
                    exit;

                } catch (Exception $e) {
                    error_log("❌ Error en registrarCliente: " . $e->getMessage());
                    error_log("Stack trace: " . $e->getTraceAsString());
                    
                    http_response_code(400); 
                    echo json_encode([
                        "estado" => "error",
                        "mensaje" => mensajeAmigable($e->getMessage())
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            }

            if ($accion === 'guardarMascota') {
                error_log("=== PROCESANDO GUARDAR MASCOTA ===");

                try {
                    $nombre = $_POST['nombre'] ?? '';
                    $especie = $_POST['especie'] ?? '';
                    $peso = floatval($_POST['peso'] ?? 0);
                    $edad = $_POST['edad'] ?? '';
                    $cedulaCliente = $_POST['cedulaCliente'] ?? '';
                    $razaID = intval($_POST['razaID'] ?? 0);
                    $genero = $_POST['genero'] ?? '';

                    // Filtrar condiciones
                    $condiciones = [];
                    if (isset($_POST['condiciones']) && trim($_POST['condiciones']) !== '') {
                        $condiciones = array_filter(explode(',', $_POST['condiciones']), fn($c) => is_numeric($c) && $c > 0);
                    }

                    error_log("Datos recibidos:");
                    error_log("- Nombre: $nombre");
                    error_log("- Especie: $especie");
                    error_log("- Peso: $peso");
                    error_log("- Edad: $edad");
                    error_log("- Cédula Cliente: $cedulaCliente");
                    error_log("- Raza ID: $razaID");
                    error_log("- Género: $genero");
                    error_log("- Condiciones: " . implode(',', $condiciones));

                    // Validaciones básicas con mensajes amigables
                    if (empty($nombre)) throw new Exception("El nombre de la mascota es obligatorio");
                    if (empty($cedulaCliente)) throw new Exception("La cedula del cliente es obligatoria");
                    if ($razaID <= 0) throw new Exception("Debe seleccionar una raza valida");
                    if ($peso <= 0) throw new Exception("El peso debe ser mayor a cero");
                    if (!is_numeric($edad) || intval($edad) <= 0) throw new Exception("La edad debe ser un numero mayor a cero");

                    error_log("Verificando si existe el cliente...");
                    $clienteExiste = $cliente->consultar($cedulaCliente);
                    error_log("Cliente existe: " . ($clienteExiste ? "SÍ" : "NO"));

                    if (!$clienteExiste) {
                        http_response_code(400);
                        echo json_encode([
                            "estado" => "error",
                            "mensaje" => "No encontramos un cliente registrado con esa cedula. Por favor, registre el cliente primero."
                        ], JSON_UNESCAPED_UNICODE);
                        exit;
                    }

                    // Procesar foto de forma segura
                    $foto = null;
                    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
                        $tipoArchivo = $_FILES['foto']['type'];
                        $tamanoArchivo = $_FILES['foto']['size'];
                        
                        error_log("Procesando foto:");
                        error_log("- Tipo: $tipoArchivo");
                        error_log("- Tamaño: $tamanoArchivo bytes");
                        
                        // Verificar tipo de archivo usando el método de la clase
                        if (!$mascota->validarTipoArchivo($tipoArchivo)) {
                            throw new Exception("Tipo de archivo no permitido. Use JPG, PNG o GIF");
                        }
                        
                        // Verificar tamaño usando el método de la clase
                        if (!$mascota->validarTamanoArchivo($tamanoArchivo)) {
                            throw new Exception("La imagen es demasiado grande. Maximo 5MB");
                        }
                        
                        // Leer el archivo de forma segura
                        $contenidoArchivo = file_get_contents($_FILES['foto']['tmp_name']);
                        if ($contenidoArchivo === false) {
                            throw new Exception("Error al leer el archivo de imagen");
                        }
                        
                        if (strlen($contenidoArchivo) === 0) {
                            throw new Exception("El archivo de imagen esta vacio");
                        }
                        
                        $foto = $contenidoArchivo;
                        error_log("Foto procesada exitosamente: " . strlen($foto) . " bytes");
                        
                        // Validar que sea una imagen válida
                        $infoImagen = getimagesizefromstring($foto);
                        if ($infoImagen === false) {
                            throw new Exception("El archivo no es una imagen valida");
                        }
                        
                    } else {
                        if (isset($_FILES['foto']) && $_FILES['foto']['error'] !== UPLOAD_ERR_NO_FILE) {
                            $errorCode = $_FILES['foto']['error'];
                            $errorMessages = [
                                UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamano maximo permitido',
                                UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamano maximo del formulario',
                                UPLOAD_ERR_PARTIAL => 'El archivo se subio parcialmente',
                                UPLOAD_ERR_NO_TMP_DIR => 'Falta la carpeta temporal',
                                UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo',
                                UPLOAD_ERR_EXTENSION => 'Una extension detuvo la subida del archivo'
                            ];
                            $errorMsg = $errorMessages[$errorCode] ?? 'Error desconocido al subir el archivo';
                            throw new Exception($errorMsg);
                        }
                        error_log("No se subió foto o es opcional");
                    }

                    // Crear y guardar mascota
                    $mascota->setDatos(
                        $nombre,
                        $especie,
                        $peso,
                        $edad,
                        $cedulaCliente,
                        $razaID,
                        $genero,
                        $foto,
                        $condiciones
                    );

                    $resultado = $mascota->guardar();
                    
                    if ($resultado) {
                        echo json_encode([
                            "estado" => "ok",
                            "mensaje" => "Mascota registrada correctamente"
                        ], JSON_UNESCAPED_UNICODE);
                    } else {
                        throw new Exception("No se pudo registrar la mascota");
                    }
                    exit;

                } catch (Exception $e) {
                    error_log("Error en guardarMascota: " . $e->getMessage());
                    error_log("Stack trace: " . $e->getTraceAsString());

                    http_response_code(400); 
                    echo json_encode([
                        "estado" => "error",
                        "mensaje" => mensajeAmigable($e->getMessage())
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            }

            // Si llegamos aquí, la acción POST no es válida
            http_response_code(400);
            echo json_encode(["estado" => "error", "mensaje" => "Accion POST no valida: $accion"], JSON_UNESCAPED_UNICODE);
            break;

        default:
            http_response_code(405);
            echo json_encode(["estado" => "error", "mensaje" => "Metodo HTTP no permitido"], JSON_UNESCAPED_UNICODE);
            break;
    }

} catch (PDOException $e) {
    error_log("PDO Exception: " . $e->getMessage());
    error_log("PDO Stack trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    $mensajeCompleto = $e->getMessage();

    if (stripos($mensajeCompleto, 'UQ_Cliente_Email') !== false || stripos($mensajeCompleto, 'Email') !== false) {
        $mensajeLimpio = "El correo electronico ya esta registrado";
    } elseif (stripos($mensajeCompleto, 'PRIMARY KEY') !== false || stripos($mensajeCompleto, 'Cedula') !== false) {
        $mensajeLimpio = "La cedula ya esta registrada";
    } elseif (stripos($mensajeCompleto, 'translating a PHP stream') !== false || stripos($mensajeCompleto, 'UTF-8 to UTF-16') !== false) {
        $mensajeLimpio = "Error al procesar la imagen. Intente con una imagen diferente o registre sin imagen";
    } else {
        if (stripos($mensajeCompleto, ']') !== false) {
            $partes = explode("]", $mensajeCompleto);
            $mensajeLimpio = trim(end($partes));
        } else {
            $mensajeLimpio = "Ocurrio un error en la base de datos";
        }
    }

    echo json_encode(["estado" => "error", "mensaje" => mensajeAmigable($mensajeLimpio)], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log("General Exception: " . $e->getMessage());
    error_log("General Stack trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode(["estado" => "error", "mensaje" => mensajeAmigable($e->getMessage())], JSON_UNESCAPED_UNICODE);
}

error_log("=== DEBUG CONTROLLER END ===");
?>