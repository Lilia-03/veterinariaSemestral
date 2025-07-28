<?php
require_once '../clases/factura.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// INICIAR SESIÓN AL PRINCIPIO
session_start();

$accion = $_GET['accion'] ?? '';
$factura = new Factura();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        
        case 'GET':
            if ($accion === 'obtenerCliente') {
                $cedula = $_GET['cedula'] ?? '';
                
                if (empty($cedula)) {
                    echo json_encode(["estado" => "error", "mensaje" => "Cédula requerida"]);
                    exit;
                }

                $cliente = $factura->obtenerCliente($cedula);
                
                if ($cliente) {
                    echo json_encode(["estado" => "ok", "cliente" => $cliente]);
                } else {
                    echo json_encode(["estado" => "error", "mensaje" => "Cliente no encontrado"]);
                }
                
            } elseif ($accion === 'obtenerMascotas') {
                $cedula = $_GET['cedula'] ?? '';
                
                if (empty($cedula)) {
                    echo json_encode(["estado" => "error", "mensaje" => "Cédula requerida"]);
                    exit;
                }

                $mascotas = $factura->obtenerMascotasPorCliente($cedula);
                echo json_encode(["estado" => "ok", "mascotas" => $mascotas]);
                
            } elseif ($accion === 'obtenerProductos') {
                $productos = $factura->obtenerProductos();
                echo json_encode(["estado" => "ok", "productos" => $productos]);
                
            } elseif ($accion === 'obtenerServicios') {
                $servicios = $factura->obtenerServicios();
                echo json_encode(["estado" => "ok", "servicios" => $servicios]);
                
            } elseif ($accion === 'verFactura') {
                $idFactura = $_GET['id'] ?? '';
                
                if (empty($idFactura)) {
                    echo json_encode(["estado" => "error", "mensaje" => "ID de factura requerido"]);
                    exit;
                }

                $detalles = $factura->obtenerDetalles($idFactura);
                
                // Preparar información adicional para el frontend
                if (isset($detalles['factura']['FirmaDigital']) && $detalles['factura']['FirmaDigital']) {
                    $detalles['factura']['TieneFirmaDigital'] = true;
                    $detalles['factura']['EstadoFirma'] = $detalles['factura']['FirmaValida'] ? 'válida' : 'inválida';
                    
                    // No enviar la firma binaria al frontend por seguridad
                    unset($detalles['factura']['FirmaDigital']);
                } else {
                    $detalles['factura']['TieneFirmaDigital'] = false;
                }
                
                echo json_encode(["estado" => "ok", "detalles" => $detalles]);
                
            } elseif ($accion === 'verificarFirma') {
                $idFactura = $_GET['id'] ?? '';
                
                if (empty($idFactura)) {
                    echo json_encode(["estado" => "error", "mensaje" => "ID de factura requerido"]);
                    exit;
                }

                $detalles = $factura->obtenerDetalles($idFactura);
                
                if (isset($detalles['factura']['FirmaDigital']) && $detalles['factura']['FirmaDigital']) {
                    $firmaValida = $factura->verificarFirmaDigital($detalles['factura']['FirmaDigital']);
                    $infoFirma = $factura->obtenerInfoFirma($detalles['factura']['FirmaDigital']);
                    
                    $tipoFirma = 'Básica';
                    $algoritmo = 'SHA-256';
                    
                    if ($infoFirma && isset($infoFirma['tipo_firma'])) {
                        $tipoFirma = $infoFirma['tipo_firma'];
                        $algoritmo = $infoFirma['algoritmo'] ?? 'RSA-SHA256';
                    }
                    
                    echo json_encode([
                        "estado" => "ok", 
                        "firmaValida" => $firmaValida,
                        "infoFirma" => $infoFirma,
                        "fechaFirma" => $detalles['factura']['FechaFirma'],
                        "firmante" => $detalles['factura']['NombreFirmante'],
                        "tipoFirma" => $tipoFirma,
                        "algoritmo" => $algoritmo
                    ]);
                } else {
                    echo json_encode(["estado" => "error", "mensaje" => "La factura no tiene firma digital"]);
                }
                
            } elseif ($accion === 'verificarClaves') {
                // USAR LOS NOMBRES CORRECTOS DEL AUTHCONTROLLER
                if (!isset($_SESSION['usuario_id'])) {
                    echo json_encode(["estado" => "error", "mensaje" => "Usuario no autenticado"]);
                    exit;
                }
                
                $tieneClaves = $factura->usuarioTieneClavesDigitales($_SESSION['usuario_id']);
                
                echo json_encode([
                    "estado" => "ok",
                    "tieneClaves" => $tieneClaves,
                    "usuario" => $_SESSION['nombre_completo'] ?? $_SESSION['nombre_usuario']
                ]);
                
            } elseif ($accion === 'regenerarClaves') {
                if (!isset($_SESSION['usuario_id'])) {
                    echo json_encode(["estado" => "error", "mensaje" => "Usuario no autenticado"]);
                    exit;
                }
                
                $resultado = $factura->regenerarClavesUsuario($_SESSION['usuario_id']);
                
                if ($resultado) {
                    echo json_encode([
                        "estado" => "ok",
                        "mensaje" => "Claves digitales regeneradas exitosamente",
                        "usuario" => $_SESSION['nombre_completo'] ?? $_SESSION['nombre_usuario']
                    ]);
                } else {
                    echo json_encode([
                        "estado" => "error",
                        "mensaje" => "Error al regenerar claves digitales"
                    ]);
                }
                
            } elseif ($accion === 'obtenerHistorial') {
                if (!isset($_SESSION['usuario_id'])) {
                    echo json_encode(["estado" => "error", "mensaje" => "Usuario no autenticado"]);
                    exit;
                }
                
                $fechaInicio = $_GET['fechaInicio'] ?? null;
                $fechaFin = $_GET['fechaFin'] ?? null;
                $limit = $_GET['limit'] ?? 50;
                $offset = $_GET['offset'] ?? 0;
                
                // Solo administradores y operadores pueden ver todas las facturas
                $usuarioFiltro = null;
                if ($_SESSION['rol_id'] == 3) { // Cliente
                    $usuarioFiltro = $_SESSION['usuario_id'];
                }
                
                $historial = $factura->obtenerHistorialFacturas($usuarioFiltro, $fechaInicio, $fechaFin, $limit, $offset);
                
                echo json_encode([
                    "estado" => "ok", 
                    "historial" => $historial,
                    "total" => count($historial),
                    "usuario" => $_SESSION['nombre_completo'] ?? $_SESSION['nombre_usuario']
                ]);
                
            } elseif ($accion === 'buscarFacturas') {
                if (!isset($_SESSION['usuario_id'])) {
                    echo json_encode(["estado" => "error", "mensaje" => "Usuario no autenticado"]);
                    exit;
                }
                
                $termino = $_GET['termino'] ?? '';
                $tipoBusqueda = $_GET['tipo'] ?? 'TODOS';
                $fechaInicio = $_GET['fechaInicio'] ?? null;
                $fechaFin = $_GET['fechaFin'] ?? null;
                $estadoFactura = $_GET['estado'] ?? 'TODOS';
                
                $resultados = $factura->buscarFacturas($termino, $tipoBusqueda, $fechaInicio, $fechaFin, $estadoFactura);
                
                // Filtrar resultados para clientes (solo sus facturas)
                if ($_SESSION['rol_id'] == 3) {
                    $resultados = array_filter($resultados, function($fact) {
                        return $fact['UsuarioFirma'] == $_SESSION['usuario_id'];
                    });
                    $resultados = array_values($resultados); // Reindexar
                }
                
                echo json_encode([
                    "estado" => "ok", 
                    "resultados" => $resultados,
                    "total" => count($resultados),
                    "termino" => $termino,
                    "tipo" => $tipoBusqueda
                ]);
                
            } elseif ($accion === 'verDetalleCompleto') {
                $idFactura = $_GET['id'] ?? '';
                
                if (empty($idFactura)) {
                    echo json_encode(["estado" => "error", "mensaje" => "ID de factura requerido"]);
                    exit;
                }
                
                if (!isset($_SESSION['usuario_id'])) {
                    echo json_encode(["estado" => "error", "mensaje" => "Usuario no autenticado"]);
                    exit;
                }
                
                // Verificar permisos de acceso
                $tieneAcceso = $factura->verificarAccesoFactura($idFactura, $_SESSION['usuario_id']);
                
                if (!$tieneAcceso) {
                    echo json_encode(["estado" => "error", "mensaje" => "No tiene permisos para ver esta factura"]);
                    exit;
                }
                
                $detalles = $factura->obtenerDetallesCompletos($idFactura);
                
                // Preparar información de firma para el frontend
                if (isset($detalles['factura']['FirmaDigital']) && $detalles['factura']['FirmaDigital']) {
                    $detalles['factura']['TieneFirmaDigital'] = true;
                    
                    // Verificar firma si es necesario
                    $firmaValida = $factura->verificarFirmaDigital($detalles['factura']['FirmaDigital']);
                    $detalles['factura']['FirmaValida'] = $firmaValida;
                    
                    // No enviar la firma binaria al frontend
                    unset($detalles['factura']['FirmaDigital']);
                } else {
                    $detalles['factura']['TieneFirmaDigital'] = false;
                    $detalles['factura']['FirmaValida'] = false;
                }
                
                echo json_encode([
                    "estado" => "ok", 
                    "factura" => $detalles['factura'],
                    "items" => $detalles['items'],
                    "usuario" => $_SESSION['nombre_completo'] ?? $_SESSION['nombre_usuario']
                ]);
                
            } elseif ($accion === 'misFacturas') {
                if (!isset($_SESSION['usuario_id'])) {
                    echo json_encode(["estado" => "error", "mensaje" => "Usuario no autenticado"]);
                    exit;
                }
                // Verificar que sea un cliente
                if ($_SESSION['rol_id'] != 3) {
                    echo json_encode(["estado" => "error", "mensaje" => "Acceso denegado"]);
                    exit;
                }

                $limit = $_GET['limit'] ?? 50;
                $usuarioId = $_SESSION['usuario_id']; // Usar el ID del usuario logueado

                try {
                    // USAR EL MÉTODO EXISTENTE obtenerFacturasPorUsuario
                    $misFacturas = $factura->obtenerFacturasPorUsuario($usuarioId, $limit);

                    echo json_encode([
                        "estado" => "ok", 
                        "facturas" => $misFacturas,
                        "total" => count($misFacturas),
                        "usuario" => $_SESSION['nombre_completo'] ?? $_SESSION['nombre_usuario'],
                        "usuarioId" => $usuarioId
                    ]);
                } catch (Exception $e) {
                    echo json_encode([
                        "estado" => "error", 
                        "mensaje" => "Error al obtener facturas: " . $e->getMessage()
                    ]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["estado" => "error", "mensaje" => "Acción GET no válida"]);
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents("php://input"), true);
            
            if (!$input) {
                throw new Exception("No se pudo leer el JSON de entrada");
            }

            if ($accion === 'generarFactura') {
                $cedulaCliente = $input['cedulaCliente'] ?? '';
                $idMascota = $input['idMascota'] ?? null;
                $firmaPersonalizada = $input['firmaDigital'] ?? null;
                
                if (empty($cedulaCliente)) {
                    echo json_encode(["estado" => "error", "mensaje" => "Cédula del cliente requerida"]);
                    exit;
                }
                
                // VERIFICAR AUTENTICACIÓN CON NOMBRES CORRECTOS
                if (!isset($_SESSION['usuario_id'])) {
                    echo json_encode(["estado" => "error", "mensaje" => "Usuario no autenticado"]);
                    exit;
                }

                
                $factura->setDatos($cedulaCliente, $idMascota);
                
                // Generar factura con firma digital
                $idFactura = $factura->generar($_SESSION['usuario_id'], $firmaPersonalizada);
                
                
                echo json_encode([
                    "estado" => "ok", 
                    "mensaje" => "Factura generada exitosamente con firma digital OpenSSL",
                    "idFactura" => $idFactura,
                    "firmante" => $_SESSION['nombre_completo'] ?? $_SESSION['nombre_usuario'],
                    "fechaFirma" => date('Y-m-d H:i:s'),
                    "algoritmo" => "RSA-SHA256"
                ]);
                
                
            } elseif ($accion === 'agregarProducto') {
                $idFactura = $input['idFactura'] ?? '';
                $idItem = $input['idItem'] ?? '';
                $cantidad = $input['cantidad'] ?? 1;
                
                if (empty($idFactura) || empty($idItem)) {
                    echo json_encode(["estado" => "error", "mensaje" => "Datos incompletos"]);
                    exit;
                }

                $factura->setIdFactura($idFactura);
                $resultado = $factura->agregarProducto($idItem, $cantidad);
                
                if ($resultado) {
                    echo json_encode(["estado" => "ok", "mensaje" => "Producto agregado exitosamente"]);
                } else {
                    echo json_encode(["estado" => "error", "mensaje" => "Error al agregar producto"]);
                }
                
            } elseif ($accion === 'agregarServicio') {
                $idFactura = $input['idFactura'] ?? '';
                $idMascota = $input['idMascota'] ?? '';
                $idItem = $input['idItem'] ?? '';
                
                if (empty($idFactura) || empty($idItem)) {
                    echo json_encode(["estado" => "error", "mensaje" => "Datos incompletos"]);
                    exit;
                }

                // Si no hay mascota específica, usar el ID 0 (mascota dummy)
                if (empty($idMascota)) {
                    $idMascota = 0;
                }

                $factura->setIdFactura($idFactura);
                $resultado = $factura->agregarServicio($idMascota, $idItem);
                
                if ($resultado) {
                    echo json_encode(["estado" => "ok", "mensaje" => "Servicio agregado exitosamente"]);
                } else {
                    echo json_encode(["estado" => "error", "mensaje" => "Error al agregar servicio"]);
                }
                
            } elseif ($accion === 'completarFactura') {
                $idFactura = $input['idFactura'] ?? '';
                
                if (empty($idFactura)) {
                    echo json_encode(["estado" => "error", "mensaje" => "ID de factura requerido"]);
                    exit;
                }

                $factura->setIdFactura($idFactura);
                $resultado = $factura->completar();
                
                if ($resultado) {
                    try {
                        $detalles = $factura->obtenerDetalles($idFactura);
                        
                        echo json_encode([
                            "estado" => "ok", 
                            "mensaje" => "Factura completada exitosamente",
                            "firmaValida" => $detalles['factura']['FirmaValida'] ?? false,
                            "firmante" => $detalles['factura']['NombreFirmante'] ?? 'No disponible',
                            "tipoFirma" => "OpenSSL RSA-SHA256"
                        ]);
                    } catch (Exception $e) {
                        echo json_encode([
                            "estado" => "ok", 
                            "mensaje" => "Factura completada exitosamente"
                        ]);
                    }
                } else {
                    echo json_encode(["estado" => "error", "mensaje" => "Error al completar factura"]);
                }
                
            } else {
                http_response_code(400);
                echo json_encode(["estado" => "error", "mensaje" => "Acción POST no válida"]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["estado" => "error", "mensaje" => "Método no permitido"]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);

    $mensajeCompleto = $e->getMessage();

    // Extraer el mensaje después del último ]
    if (stripos($mensajeCompleto, ']') !== false) {
        $partes = explode("]", $mensajeCompleto);
        $mensajeLimpio = trim(end($partes));
    } else {
        $mensajeLimpio = "Ocurrió un error en la base de datos.";
    }

    echo json_encode(["estado" => "error", "mensaje" => $mensajeLimpio]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["estado" => "error", "mensaje" => $e->getMessage()]);
}
?>