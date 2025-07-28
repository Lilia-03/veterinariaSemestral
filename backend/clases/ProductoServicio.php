<?php

require_once __DIR__ . '/../includes/conexion.php';  
require_once __DIR__ . '/../includes/sanitizar.php'; 

class ProductoServicio {
    private $conexion;

    public function __construct() {
        $this->conexion = new Conexion();
    }

    public function obtenerTodos() {
        try {
            return $this->conexion->obtenerProductosServiciosUsuario();
        } catch (Exception $e) {
            error_log("Error en obtenerTodos: " . $e->getMessage());
            throw new Exception("Error al obtener productos y servicios");
        }
    }

    public function buscar($termino = '', $tipo = '') {
        try {
            // Sanitizar parámetros
            $termino = SanitizarEntrada::sanitizarBusqueda($termino);
            $tipo = SanitizarEntrada::sanitizarTexto($tipo);

            // Validar tipo si se proporciona
            if (!empty($tipo) && !in_array($tipo, ['Producto', 'Servicio'])) {
                throw new InvalidArgumentException("Tipo no válido");
            }

            return $this->conexion->buscarProductosServiciosUsuario($termino, $tipo);
        } catch (Exception $e) {
            error_log("Error en buscar: " . $e->getMessage());
            throw new Exception("Error al buscar productos y servicios");
        }
    }

    public function obtenerDetalle($idItem) {
        try {
            $idItem = SanitizarEntrada::validarEnteroPositivo($idItem, 'ID del item');
            return $this->conexion->obtenerDetalleProductoServicioUsuario($idItem);
        } catch (Exception $e) {
            error_log("Error en obtenerDetalle: " . $e->getMessage());
            throw new Exception("Error al obtener detalle del item");
        }
    }

    public function obtenerSoloProductos() {
        try {
            return $this->conexion->buscarProductosServiciosUsuario('', 'Producto');
        } catch (Exception $e) {
            error_log("Error en obtenerSoloProductos: " . $e->getMessage());
            throw new Exception("Error al obtener productos");
        }
    }

    public function obtenerSoloServicios() {
        try {
            return $this->conexion->buscarProductosServiciosUsuario('', 'Servicio');
        } catch (Exception $e) {
            error_log("Error en obtenerSoloServicios: " . $e->getMessage());
            throw new Exception("Error al obtener servicios");
        }
    }

    public function formatearParaPresentacion($items) {
        $itemsFormateados = [];
        
        foreach ($items as $item) {
            $itemFormateado = [
                'id' => $item['IDITEM'],
                'nombre' => htmlspecialchars($item['NombreProducto']),
                'tipo' => $item['Tipo'],
                'precio' => number_format($item['PrecioITEM'], 2),
                'precioNumerico' => floatval($item['PrecioITEM']),
                'disponibilidad' => $item['EstadoDisponibilidad'],
                'cantidad' => $item['CantidadDisponible'],
                'cantidadTexto' => $this->formatearCantidad($item),
                'claseDisponibilidad' => $this->obtenerClaseDisponibilidad($item)
            ];
            
            $itemsFormateados[] = $itemFormateado;
        }
        
        return $itemsFormateados;
    }

    private function formatearCantidad($item) {
        if ($item['Tipo'] === 'Servicio') {
            return 'Siempre disponible';
        }
        
        $cantidad = intval($item['CantidadDisponible']);
        
        if ($cantidad === 0) {
            return 'Agotado';
        } elseif ($cantidad === 1) {
            return '1 unidad disponible';
        } else {
            return $cantidad . ' unidades disponibles';
        }
    }

    private function obtenerClaseDisponibilidad($item) {
        if ($item['Tipo'] === 'Servicio') {
            return 'disponible';
        }
        
        $cantidad = intval($item['CantidadDisponible']);
        
        if ($cantidad === 0) {
            return 'agotado';
        } elseif ($cantidad <= 5) {
            return 'bajo-stock';
        } else {
            return 'disponible';
        }
    }

    public function obtenerEstadisticas() {
        try {
            $todos = $this->obtenerTodos();
            
            $stats = [
                'total' => count($todos),
                'productos' => 0,
                'servicios' => 0,
                'productosDisponibles' => 0,
                'productosAgotados' => 0
            ];
            
            foreach ($todos as $item) {
                if ($item['Tipo'] === 'Producto') {
                    $stats['productos']++;
                    if (intval($item['CantidadDisponible']) > 0) {
                        $stats['productosDisponibles']++;
                    } else {
                        $stats['productosAgotados']++;
                    }
                } else {
                    $stats['servicios']++;
                }
            }
            
            return $stats;
        } catch (Exception $e) {
            error_log("Error en obtenerEstadisticas: " . $e->getMessage());
            return [
                'total' => 0,
                'productos' => 0,
                'servicios' => 0,
                'productosDisponibles' => 0,
                'productosAgotados' => 0
            ];
        }
    }
}
?>
