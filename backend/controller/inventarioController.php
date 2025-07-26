<?php

// Habilitar errores para debug
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


require_once '../includes/Conexion.php';
require_once '../includes/Sanitizar.php';
require_once '../clases/Inventario.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {
    if (empty($action)) {
        throw new Exception('No se especificó una acción');
    }

    switch ($action) {
        case 'obtenerProductos':
            // Solo para estas acciones usamos JSON
            header('Content-Type: application/json; charset=utf-8');
            
            $inventario = new Inventario();
            $productos = $inventario->obtenerProductos();
            echo json_encode(['success' => true, 'data' => $productos]);
            break;

        case 'actualizarInventario':
            // Solo para estas acciones usamos JSON
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['idItem']) || !isset($_POST['cantidad'])) {
                throw new Exception('Datos insuficientes para actualizar inventario');
            }

            $idItem = Sanitizar::sanitizarEntero($_POST['idItem']);
            $cantidad = Sanitizar::sanitizarEntero($_POST['cantidad']);

            if (!$idItem || !$cantidad) {
                throw new Exception('Datos inválidos');
            }

            if ($cantidad <= 0) {
                throw new Exception('La cantidad debe ser mayor a cero');
            }

            $inventario = new Inventario();
            $resultado = $inventario->actualizarCantidad($idItem, $cantidad);

            echo json_encode([
                'success' => $resultado,
                'message' => $resultado ? 'Inventario actualizado correctamente' : 'No se pudo actualizar'
            ]);
            break;

case 'agregarProducto':
            header('Content-Type: application/json; charset=utf-8');
            
            $datosRequeridos = ['codigo', 'nombre', 'precio', 'stock'];
            foreach ($datosRequeridos as $campo) {
                if (!isset($_POST[$campo]) || empty($_POST[$campo])) {
                    throw new Exception("El campo $campo es requerido");
                }
            }

            $datos = [
                'codigo' => $_POST['codigo'],
                'nombre' => $_POST['nombre'],
                'precio' => $_POST['precio'],
                'stock' => $_POST['stock'],
            ];

            $inventario = new Inventario();
            $resultado = $inventario->agregarProducto($datos);

            echo json_encode([
                'success' => $resultado,
                'message' => $resultado ? 'Producto agregado correctamente' : 'No se pudo agregar el producto'
            ]);
            break;

        case 'eliminarProducto':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['idItem']) || empty($_POST['idItem'])) {
                throw new Exception('ID del producto es requerido');
            }

            $idItem = $_POST['idItem'];

            $inventario = new Inventario();
            $resultado = $inventario->eliminarProducto($idItem);

            echo json_encode([
                'success' => $resultado,
                'message' => $resultado ? 'Producto eliminado correctamente' : 'No se pudo eliminar el producto'
            ]);
            break;

        case 'buscarProductos':
            header('Content-Type: application/json; charset=utf-8');
            
            $termino = $_POST['termino'] ?? $_GET['termino'] ?? '';
            
            $inventario = new Inventario();
            $productos = $inventario->buscarProductos($termino);
            
            echo json_encode(['success' => true, 'data' => $productos]);
            break;

        case 'obtenerProductoPorId':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['idItem']) && !isset($_GET['idItem'])) {
                throw new Exception('ID del producto es requerido');
            }

            $idItem = $_POST['idItem'] ?? $_GET['idItem'];
            
            $inventario = new Inventario();
            $producto = $inventario->obtenerProductoPorId($idItem);
            
            if (!$producto) {
                throw new Exception('Producto no encontrado');
            }
            
            echo json_encode(['success' => true, 'data' => $producto]);
            break;
        case 'verificarCodigoProducto':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['codigo']) || empty($_POST['codigo'])) {
                throw new Exception('Código es requerido');
            }

            $codigo = $_POST['codigo'];
            
            $inventario = new Inventario();
            $existe = $inventario->existeCodigoProducto($codigo);
            
            echo json_encode([
                'success' => true, 
                'existe' => $existe
            ]);
            break;

        case 'exportarExcel':
            // NO establecemos header JSON para exportación
            $inventario = new Inventario();
            $datos = $inventario->obtenerProductos(); // Usar el mismo método que funciona

            // Headers para descarga de Excel
            header('Content-Transfer-Encoding: binary');
            header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
            header('Content-Disposition: attachment; filename="inventario_' . date('Y-m-d') . '.xls"');
            header('Pragma: no-cache');
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Expires: 0');

            // Comenzar el contenido HTML para Excel
            echo "\xEF\xBB\xBF"; // BOM para UTF-8
            echo '<!DOCTYPE html>';
            echo '<html>';
            echo '<head>';
            echo '<meta charset="UTF-8">';
            echo '<style>';
            echo 'table { border-collapse: collapse; width: 100%; }';
            echo 'th, td { border: 1px solid #000; padding: 8px; text-align: left; }';
            echo 'th { background-color: #f0f0f0; font-weight: bold; }';
            echo '</style>';
            echo '</head>';
            echo '<body>';
            
            echo '<h2>Reporte de Inventario - CliniPet</h2>';
            echo '<p>Generado el: ' . date('Y-m-d H:i:s') . '</p>';
            
            echo '<table>';
            echo '<thead>';
            echo '<tr>';
            echo '<th>Código</th>';
            echo '<th>Producto</th>';
            echo '<th>Precio Unitario</th>';
            echo '<th>Cantidad Disponible</th>';
            echo '<th>Valor Total</th>';
            echo '</tr>';
            echo '</thead>';
            echo '<tbody>';

            if (!empty($datos)) {
                $totalGeneral = 0;
                foreach ($datos as $fila) {
                    $codigo = $fila['IDITEM'] ?? '';
                    $producto = $fila['NombreProducto'] ?? '';
                    $precio = floatval($fila['PrecioITEM'] ?? 0);
                    $cantidad = intval($fila['CantidadDisponible'] ?? 0);
                    $valorTotal = $precio * $cantidad;
                    $totalGeneral += $valorTotal;

                    echo '<tr>';
                    echo '<td>' . htmlspecialchars($codigo) . '</td>';
                    echo '<td>' . htmlspecialchars($producto) . '</td>';
                    echo '<td>$' . number_format($precio, 2) . '</td>';
                    echo '<td>' . $cantidad . '</td>';
                    echo '<td>$' . number_format($valorTotal, 2) . '</td>';
                    echo '</tr>';
                }
                
                // Fila de total
                echo '<tr style="font-weight: bold; background-color: #e0e0e0;">';
                echo '<td colspan="4">TOTAL GENERAL</td>';
                echo '<td>$' . number_format($totalGeneral, 2) . '</td>';
                echo '</tr>';
                
            } else {
                echo '<tr>';
                echo '<td colspan="5" style="text-align: center;">No hay datos disponibles</td>';
                echo '</tr>';
            }

            echo '</tbody>';
            echo '</table>';
            echo '</body>';
            echo '</html>';
            
            // Importante: terminar la ejecución aquí para evitar salida adicional
            exit;

        default:
            header('Content-Type: application/json; charset=utf-8');
            throw new Exception('Acción no válida: ' . $action);
    }

} catch (Exception $e) {
    // Solo establecer header JSON si no es exportación
    if ($action !== 'exportarExcel') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    } else {
        // Para exportación, mostrar error en HTML
        echo '<html><body><h1>Error</h1><p>' . htmlspecialchars($e->getMessage()) . '</p></body></html>';
    }
    error_log("Error en Controller.php: " . $e->getMessage());
    
} catch (Error $e) {
    if ($action !== 'exportarExcel') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
    } else {
        echo '<html><body><h1>Error</h1><p>Error interno del servidor</p></body></html>';
    }
    error_log("Error fatal en Controller.php: " . $e->getMessage());
}

?>