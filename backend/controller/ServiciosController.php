<?php
// Evitar cualquier salida antes del JSON
ob_start();

// Habilitar errores para debug (solo en desarrollo)
error_reporting(E_ALL);
ini_set('display_errors', 1); // Cambiar a 0 para producción
ini_set('log_errors', 1);

require_once '../includes/Conexion.php';
require_once '../includes/Sanitizar.php';
require_once '../clases/Servicio.php';

// Limpiar cualquier salida previa
ob_clean();

$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {
    if (empty($action)) {
        throw new Exception('No se especificó una acción');
    }

    switch ($action) {
        case 'obtenerServicios':
            // Asegurar que solo enviamos JSON
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-cache, must-revalidate');
            
            $servicio = new Servicio();
            $servicios = $servicio->obtenerServicios();
            
            // Verificar que tenemos datos válidos
            if (!is_array($servicios)) {
                $servicios = [];
            }
            
            $response = [
                'success' => true, 
                'data' => $servicios,
                'count' => count($servicios)
            ];
            
            echo json_encode($response, JSON_UNESCAPED_UNICODE);
            break;

        case 'agregarServicio':
            header('Content-Type: application/json; charset=utf-8');
            
            $datosRequeridos = ['codigo', 'nombre', 'precio'];
            foreach ($datosRequeridos as $campo) {
                if (!isset($_POST[$campo]) || empty($_POST[$campo])) {
                    throw new Exception("El campo $campo es requerido");
                }
            }

            $datos = [
                'codigo' => $_POST['codigo'],
                'nombre' => $_POST['nombre'],
                'precio' => $_POST['precio']
            ];

            $servicio = new Servicio();
            $resultado = $servicio->agregarServicio($datos);

            echo json_encode([
                'success' => $resultado,
                'message' => $resultado ? 'Servicio agregado correctamente' : 'No se pudo agregar el servicio'
            ], JSON_UNESCAPED_UNICODE);
            break;

        case 'eliminarServicio':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['idServicio']) || empty($_POST['idServicio'])) {
                throw new Exception('ID del servicio es requerido');
            }

            $idServicio = $_POST['idServicio'];

            $servicio = new Servicio();
            $resultado = $servicio->eliminarServicio($idServicio);

            echo json_encode([
                'success' => $resultado,
                'message' => $resultado ? 'Servicio eliminado correctamente' : 'No se pudo eliminar el servicio'
            ], JSON_UNESCAPED_UNICODE);
            break;

        case 'buscarServicios':
            header('Content-Type: application/json; charset=utf-8');
            
            $termino = $_POST['termino'] ?? $_GET['termino'] ?? '';
            
            $servicio = new Servicio();
            $servicios = $servicio->buscarServicios($termino);
            
            echo json_encode([
                'success' => true, 
                'data' => $servicios
            ], JSON_UNESCAPED_UNICODE);
            break;

        case 'obtenerServicioPorId':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['idServicio']) && !isset($_GET['idServicio'])) {
                throw new Exception('ID del servicio es requerido');
            }

            $idServicio = $_POST['idServicio'] ?? $_GET['idServicio'];
            
            $servicio = new Servicio();
            $servicioData = $servicio->obtenerServicioPorId($idServicio);
            
            if (!$servicioData) {
                throw new Exception('Servicio no encontrado');
            }
            
            echo json_encode([
                'success' => true, 
                'data' => $servicioData
            ], JSON_UNESCAPED_UNICODE);
            break;

        case 'validarCodigoServicio':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['codigo']) || empty($_POST['codigo'])) {
                throw new Exception('Código del servicio es requerido');
            }

            $codigo = $_POST['codigo'];
            $servicio = new Servicio();
            $existe = $servicio->existeCodigoServicio($codigo);
            
            echo json_encode([
                'success' => true,
                'existe' => $existe,
                'message' => $existe ? 'El código ya existe' : 'El código está disponible'
            ], JSON_UNESCAPED_UNICODE);
            break;

        case 'obtenerEstadisticasServicios':
            header('Content-Type: application/json; charset=utf-8');
            
            $servicio = new Servicio();
            $servicios = $servicio->obtenerServicios();
            
            $stats = [
                'totalServicios' => count($servicios),
                'precioPromedio' => 0,
                'precioMinimo' => 0,
                'precioMaximo' => 0
            ];
            
            if (!empty($servicios)) {
                $precios = array_map(function($s) { return floatval($s['PrecioITEM'] ?? 0); }, $servicios);
                $stats['precioPromedio'] = array_sum($precios) / count($precios);
                $stats['precioMinimo'] = min($precios);
                $stats['precioMaximo'] = max($precios);
            }
            
            echo json_encode([
                'success' => true, 
                'data' => $stats
            ], JSON_UNESCAPED_UNICODE);
            break;

        case 'exportarExcel':
            // NO establecemos header JSON para exportación
            $servicio = new Servicio();
            $datos = $servicio->obtenerServicios();

            // Headers para descarga de Excel
            header('Content-Transfer-Encoding: binary');
            header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
            header('Content-Disposition: attachment; filename="servicios_' . date('Y-m-d') . '.xls"');
            header('Pragma: no-cache');
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Expires: 0');

            // Generar contenido Excel...
            echo "\xEF\xBB\xBF"; // BOM para UTF-8
            echo '<!DOCTYPE html>';
            echo '<html>';
            echo '<head><meta charset="UTF-8"></head>';
            echo '<body>';
            echo '<h2>Reporte de Servicios - CliniPet</h2>';
            echo '<p>Generado el: ' . date('Y-m-d H:i:s') . '</p>';
            echo '<table border="1">';
            echo '<tr><th>Código</th><th>Servicio</th><th>Precio</th></tr>';

            if (!empty($datos)) {
                foreach ($datos as $fila) {
                    $codigo = htmlspecialchars($fila['IDITEM'] ?? '');
                    $nombre = htmlspecialchars($fila['NombreServicio'] ?? '');
                    $precio = number_format(floatval($fila['PrecioITEM'] ?? 0), 2);

                    echo "<tr>";
                    echo "<td>$codigo</td>";
                    echo "<td>$nombre</td>";
                    echo "<td>\$$precio</td>";
                    echo "</tr>";
                }
            } else {
                echo '<tr><td colspan="3">No hay datos disponibles</td></tr>';
            }

            echo '</table>';
            echo '</body>';
            echo '</html>';
            exit;

        default:
            header('Content-Type: application/json; charset=utf-8');
            throw new Exception('Acción no válida: ' . $action);
    }

} catch (Exception $e) {
    // Solo establecer header JSON si no es exportación
    if ($action !== 'exportarExcel') {
        header('Content-Type: application/json; charset=utf-8');
        $response = [
            'success' => false, 
            'message' => $e->getMessage(),
            'error_details' => [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]
        ];
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    } else {
        echo '<html><body><h1>Error</h1><p>' . htmlspecialchars($e->getMessage()) . '</p></body></html>';
    }
    error_log("Error en ServiciosController.php: " . $e->getMessage());
    
} catch (Error $e) {
    if ($action !== 'exportarExcel') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false, 
            'message' => 'Error interno del servidor'
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo '<html><body><h1>Error</h1><p>Error interno del servidor</p></body></html>';
    }
    error_log("Error fatal en ServiciosController.php: " . $e->getMessage());
}

// Limpiar y enviar
ob_end_flush();
?>