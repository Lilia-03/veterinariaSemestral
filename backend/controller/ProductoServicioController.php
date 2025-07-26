<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'Conexion.php';
require_once 'Sanitizar.php';
require_once 'clases/ProductoServicio.php';

class ProductoServicioController {
    private $modelo;

    public function __construct() {
        $this->modelo = new ProductoServicio();
    }

    /**
     * Maneja las peticiones según la acción solicitada
     */
    public function manejarPeticion() {
        try {
            $accion = $_GET['accion'] ?? '';
            $accion = Sanitizar::sanitizarTexto($accion);

            switch ($accion) {
                case 'obtener':
                    $this->obtenerTodos();
                    break;
                case 'buscar':
                    $this->buscar();
                    break;
                case 'detalle':
                    $this->obtenerDetalle();
                    break;
                case 'productos':
                    $this->obtenerSoloProductos();
                    break;
                case 'servicios':
                    $this->obtenerSoloServicios();
                    break;
                case 'estadisticas':
                    $this->obtenerEstadisticas();
                    break;
                default:
                    $this->respuestaError('Acción no válida', 400);
            }
        } catch (Exception $e) {
            error_log("Error en manejarPeticion: " . $e->getMessage());
            $this->respuestaError('Error interno del servidor', 500);
        }
    }

    /**
     * Obtiene todos los productos y servicios
     */
    private function obtenerTodos() {
        try {
            $items = $this->modelo->obtenerTodos();
            $itemsFormateados = $this->modelo->formatearParaPresentacion($items);
            
            $this->respuestaExito([
                'items' => $itemsFormateados,
                'total' => count($itemsFormateados)
            ]);
        } catch (Exception $e) {
            error_log("Error en obtenerTodos: " . $e->getMessage());
            $this->respuestaError('Error al obtener productos y servicios');
        }
    }

    /**
     * Busca productos y servicios con filtros
     */
    private function buscar() {
        try {
            // Obtener parámetros de búsqueda
            $termino = $_GET['termino'] ?? '';
            $tipo = $_GET['tipo'] ?? '';

            // Validar parámetros
            $termino = Sanitizar::sanitizarBusqueda($termino);
            $tipo = Sanitizar::sanitizarTexto($tipo);

            // Validar tipo si se proporciona
            if (!empty($tipo) && !in_array($tipo, ['Producto', 'Servicio'])) {
                $this->respuestaError('Tipo de filtro no válido', 400);
                return;
            }

            // Realizar búsqueda
            $items = $this->modelo->buscar($termino, $tipo);
            $itemsFormateados = $this->modelo->formatearParaPresentacion($items);

            $this->respuestaExito([
                'items' => $itemsFormateados,
                'total' => count($itemsFormateados),
                'filtros' => [
                    'termino' => $termino,
                    'tipo' => $tipo
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error en buscar: " . $e->getMessage());
            $this->respuestaError('Error al buscar productos y servicios');
        }
    }

    /**
     * Obtiene el detalle de un item específico
     */
    private function obtenerDetalle() {
        try {
            $idItem = $_GET['id'] ?? '';
            
            // Validar ID
            $validacionId = Sanitizar::validarID($idItem);
            if (!$validacionId['valid']) {
                $this->respuestaError(implode(', ', $validacionId['errors']), 400);
                return;
            }

            $item = $this->modelo->obtenerDetalle($validacionId['value']);
            
            if (!$item) {
                $this->respuestaError('Producto o servicio no encontrado', 404);
                return;
            }

            $itemFormateado = $this->modelo->formatearParaPresentacion([$item])[0];
            
            $this->respuestaExito([
                'item' => $itemFormateado
            ]);
        } catch (Exception $e) {
            error_log("Error en obtenerDetalle: " . $e->getMessage());
            $this->respuestaError('Error al obtener detalle del item');
        }
    }

    /**
     * Obtiene solo productos
     */
    private function obtenerSoloProductos() {
        try {
            $productos = $this->modelo->obtenerSoloProductos();
            $productosFormateados = $this->modelo->formatearParaPresentacion($productos);
            
            $this->respuestaExito([
                'productos' => $productosFormateados,
                'total' => count($productosFormateados)
            ]);
        } catch (Exception $e) {
            error_log("Error en obtenerSoloProductos: " . $e->getMessage());
            $this->respuestaError('Error al obtener productos');
        }
    }

    /**
     * Obtiene solo servicios
     */
    private function obtenerSoloServicios() {
        try {
            $servicios = $this->modelo->obtenerSoloServicios();
            $serviciosFormateados = $this->modelo->formatearParaPresentacion($servicios);
            
            $this->respuestaExito([
                'servicios' => $serviciosFormateados,
                'total' => count($serviciosFormateados)
            ]);
        } catch (Exception $e) {
            error_log("Error en obtenerSoloServicios: " . $e->getMessage());
            $this->respuestaError('Error al obtener servicios');
        }
    }

    /**
     * Obtiene estadísticas básicas
     */
    private function obtenerEstadisticas() {
        try {
            $estadisticas = $this->modelo->obtenerEstadisticas();
            
            $this->respuestaExito([
                'estadisticas' => $estadisticas
            ]);
        } catch (Exception $e) {
            error_log("Error en obtenerEstadisticas: " . $e->getMessage());
            $this->respuestaError('Error al obtener estadísticas');
        }
    }

    /**
     * Envía respuesta de éxito
     */
    private function respuestaExito($datos = [], $mensaje = 'Operación exitosa') {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => $mensaje,
            'data' => $datos,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Envía respuesta de error
     */
    private function respuestaError($mensaje = 'Error interno', $codigo = 500) {
        http_response_code($codigo);
        echo json_encode([
            'success' => false,
            'message' => $mensaje,
            'error_code' => $codigo,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}

// Ejecutar el controlador
try {
    $controller = new ProductoServicioController();
    $controller->manejarPeticion();
} catch (Exception $e) {
    error_log("Error fatal en ProductoServicioController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor',
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}
?>