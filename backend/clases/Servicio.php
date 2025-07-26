<?php

require_once __DIR__ . '/../Conexion.php';  
require_once __DIR__ . '/../Sanitizar.php'; 

class Servicio {

    public function __construct() {
        $this->conexion = new Conexion();
    }
    
    public function obtenerServicios() {
        try {
            return $this->conexion->obtenerServiciosDisponibles();
        } catch (Exception $e) {
            error_log("Error en Servicio->obtenerServicios: " . $e->getMessage());
            throw new Exception("Error al obtener servicios");
        }
    }

    public function agregarServicio($datos) {
        try {
            // Validar datos usando la clase Sanitizar
            $validacion = Sanitizar::validarDatosServicio($datos);
            
            if (!$validacion['valid']) {
                throw new Exception("Datos inválidos: " . implode(', ', $validacion['errors']));
            }

            $datosLimpios = $validacion['data'];

            // Verificar que el código no exista
            if ($this->conexion->existeCodigoServicio($datosLimpios['codigo'])) {
                throw new Exception("Ya existe un servicio con el código: " . $datosLimpios['codigo']);
            }

            // Llamar al procedimiento almacenado (sin descripción)
            return $this->conexion->agregarServicio(
                $datosLimpios['codigo'],
                $datosLimpios['nombre'],
                $datosLimpios['precio']
            );
            
        } catch (Exception $e) {
            error_log("Error en Servicio->agregarServicio: " . $e->getMessage());
            throw new Exception($e->getMessage());
        }
    }


    public function eliminarServicio($idServicio) {
        try {
            // Validar que el ID no esté vacío
            if (empty($idServicio)) {
                throw new Exception("ID de servicio es requerido");
            }

            // El procedimiento almacenado maneja todas las validaciones
            return $this->conexion->eliminarServicio($idServicio);
            
        } catch (Exception $e) {
            error_log("Error en Servicio->eliminarServicio: " . $e->getMessage());
            throw new Exception($e->getMessage());
        }
    }

    /**
     * Busca servicios por término de búsqueda
     * 
     * @param string $termino Término de búsqueda
     * @return array Lista de servicios que coinciden con el término
     * @throws Exception Si hay error en la búsqueda
     */
    public function buscarServicios($termino) {
        try {
            if (empty($termino)) {
                return $this->obtenerServicios();
            }

            $termino = Sanitizar::sanitizarBusqueda($termino);
            return $this->conexion->buscarServicios($termino);
            
        } catch (Exception $e) {
            error_log("Error en Servicio->buscarServicios: " . $e->getMessage());
            throw new Exception("Error al buscar servicios");
        }
    }

    /**
     * Obtiene un servicio específico por su ID
     * 
     * @param mixed $idServicio ID del servicio
     * @return array|false Datos del servicio o false si no existe
     * @throws Exception Si el ID es inválido o hay error en la consulta
     */
    public function obtenerServicioPorId($idServicio) {
        try {
            if (empty($idServicio)) {
                throw new Exception("ID de servicio es requerido");
            }
            
            return $this->conexion->obtenerServicioPorId($idServicio);
        } catch (Exception $e) {
            error_log("Error en Servicio->obtenerServicioPorId: " . $e->getMessage());
            throw new Exception("Error al obtener servicio");
        }
    }

    /**
     * Verifica si existe un código de servicio
     * 
     * @param string $codigo Código del servicio a verificar
     * @return bool True si el código ya existe
     * @throws Exception Si el código está vacío o hay error en la verificación
     */
    public function existeCodigoServicio($codigo) {
        try {
            if (empty($codigo)) {
                throw new Exception("Código de servicio es requerido");
            }
            
            return $this->conexion->existeCodigoServicio($codigo);
            
        } catch (Exception $e) {
            error_log("Error en Servicio->existeCodigoServicio: " . $e->getMessage());
            throw new Exception("Error al verificar código de servicio");
        }
    }

    /**
     * Obtiene reporte completo de servicios
     * 
     * @return array Datos completos de servicios para reportes
     * @throws Exception Si hay error al generar el reporte
     */
    public function obtenerReporteCompleto() {
        try {
            return $this->conexion->obtenerReporteServicios();
        } catch (Exception $e) {
            error_log("Error en Servicio->obtenerReporteCompleto: " . $e->getMessage());
            throw new Exception("Error al obtener reporte completo");
        }
    }
}
?>