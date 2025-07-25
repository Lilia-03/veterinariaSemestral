<?php
require_once __DIR__ . '/../includes/Conexion.php';  
require_once __DIR__ . '/../includes/Sanitizar.php'; 

class Inventario {
    private $conexion;
    
    public function __construct() {
        $this->conexion = new Conexion();
    }
    
    public function obtenerProductos() {
        try {
            return $this->conexion->obtenerProductosInventario();
        } catch (Exception $e) {
            error_log("Error en Inventario->obtenerProductos: " . $e->getMessage());
            throw new Exception("Error al obtener productos");
        }
    }
    
    public function actualizarCantidad($idItem, $cantidadAgregada) {
        try {
            // Validar datos
            if (!is_numeric($idItem) || $idItem <= 0) {
                throw new Exception("ID de producto inválido");
            }
            
            if (!is_numeric($cantidadAgregada) || $cantidadAgregada <= 0) {
                throw new Exception("Cantidad inválida");
            }
            
            return $this->conexion->actualizarInventario($idItem, $cantidadAgregada);
        } catch (Exception $e) {
            error_log("Error en Inventario->actualizarCantidad: " . $e->getMessage());
            throw new Exception("Error al actualizar cantidad: " . $e->getMessage());
        }
    }
    
    public function obtenerReporteCompleto() {
        try {
            return $this->conexion->obtenerReporteInventario();
        } catch (Exception $e) {
            error_log("Error en Inventario->obtenerReporteCompleto: " . $e->getMessage());
            throw new Exception("Error al obtener reporte completo");
        }
    }

    // Obtener detalle de producto por ID
    public function obtenerDetalleProducto($idItem) {
        try {
            if (!is_numeric($idItem) || $idItem <= 0) {
                throw new Exception("ID de producto inválido");
            }
            
            return $this->conexion->obtenerDetalleProductoServicio($idItem);
        } catch (Exception $e) {
            error_log("Error en Inventario->obtenerDetalleProducto: " . $e->getMessage());
            throw new Exception("Error al obtener detalle del producto");
        }
    }
// ACTUALIZADO: Agregar nuevo producto - ahora más simple
    public function agregarProducto($datos) {
        try {
            // Validar datos usando la clase Sanitizar
            $validacion = Sanitizar::validarDatosProducto($datos);
            
            if (!$validacion['valid']) {
                throw new Exception("Datos inválidos: " . implode(', ', $validacion['errors']));
            }

            $datosLimpios = $validacion['data'];

            // El procedimiento almacenado ya verifica si existe el código
            // No necesitamos verificar aquí, pero si quieres mantener la verificación previa:
            if ($this->conexion->existeCodigoProducto($datosLimpios['codigo'])) {
                throw new Exception("Ya existe un producto con el código: " . $datosLimpios['codigo']);
            }

            // Llamar al procedimiento almacenado (ya no necesitamos descripción)
            return $this->conexion->agregarProducto(
                $datosLimpios['codigo'],
                $datosLimpios['nombre'],
                $datosLimpios['precio'],
                $datosLimpios['stock']
            );
            
        } catch (Exception $e) {
            error_log("Error en Inventario->agregarProducto: " . $e->getMessage());
            throw new Exception($e->getMessage());
        }
    }

    // ACTUALIZADO: Eliminar producto - ahora más simple
    public function eliminarProducto($idItem) {
        try {
            // Validar ID
            if (!is_numeric($idItem) || $idItem <= 0) {
                throw new Exception("ID de producto inválido");
            }

            // El procedimiento almacenado ya verifica si existe y si tiene movimientos
            return $this->conexion->eliminarProducto($idItem);
            
        } catch (Exception $e) {
            error_log("Error en Inventario->eliminarProducto: " . $e->getMessage());
            throw new Exception($e->getMessage());
        }
    }

    // ACTUALIZADO: Buscar productos ahora usa el SP
    public function buscarProductos($termino) {
        try {
            if (empty($termino)) {
                return $this->obtenerProductos();
            }

            $termino = Sanitizar::sanitizarBusqueda($termino);
            return $this->conexion->buscarProductos($termino);
            
        } catch (Exception $e) {
            error_log("Error en Inventario->buscarProductos: " . $e->getMessage());
            throw new Exception("Error al buscar productos");
        }
    }

    // ACTUALIZADO: Obtener producto por ID ahora usa el SP
    public function obtenerProductoPorId($idItem) {
        try {
            if (!is_numeric($idItem) || $idItem <= 0) {
                throw new Exception("ID de producto inválido");
            }
            
            return $this->conexion->obtenerProductoPorId($idItem);
        } catch (Exception $e) {
            error_log("Error en Inventario->obtenerProductoPorId: " . $e->getMessage());
            throw new Exception("Error al obtener producto");
        }
    }

    // NUEVO: Método para verificar si existe código de producto
    public function existeCodigoProducto($codigo) {
        try {
            if (empty($codigo)) {
                throw new Exception("Código de producto es requerido");
            }
            
            return $this->conexion->existeCodigoProducto($codigo);
        } catch (Exception $e) {
            error_log("Error en Inventario->existeCodigoProducto: " . $e->getMessage());
            throw new Exception("Error al verificar código de producto");
        }
    }

}
?>