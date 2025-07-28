<?php
require_once __DIR__ . '/../includes/conexion.php';
require_once __DIR__ . '/../includes/sanitizar.php';

class Cita {
    private $idCita;
    private $cedulaCliente;
    private $idMascota;
    private $fechaCita;
    private $horaCita;
    private $estadoCita;
    private $tipoServicio;
    private $observaciones;
    private $usuarioCreador;
    private $conexion;

    public function __construct() {
        $this->conexion = new Conexion();
    }

    public function setDatos($cedulaCliente, $idMascota, $fechaCita, $horaCita, $tipoServicio, $observaciones = null, $usuarioCreador = 1) {
        $this->cedulaCliente = SanitizarEntrada::limpiarCadena($cedulaCliente);
        $this->idMascota = SanitizarEntrada::validarEntero($idMascota);
        $this->fechaCita = SanitizarEntrada::limpiarCadena($fechaCita);
        $this->horaCita = SanitizarEntrada::limpiarCadena($horaCita);
        $this->tipoServicio = SanitizarEntrada::limpiarCadena($tipoServicio);
        $this->observaciones = $observaciones ? SanitizarEntrada::limpiarCadena($observaciones) : null;
        $this->usuarioCreador = SanitizarEntrada::validarEntero($usuarioCreador);
    }

    // Crear nueva cita
    public function crear() {
        try {
            $sql = "EXEC CrearCita ?, ?, ?, ?, ?, ?, ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([
                $this->cedulaCliente,
                $this->idMascota,
                $this->fechaCita,
                $this->horaCita,
                $this->tipoServicio,
                $this->observaciones,
                $this->usuarioCreador
            ]);
            
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($resultado && isset($resultado['IDCita'])) {
                $this->idCita = $resultado['IDCita'];
                return $this->idCita;
            }
            
            throw new Exception("No se pudo crear la cita");
            
        } catch (PDOException $e) {
            throw new Exception("Error al crear cita: " . $e->getMessage());
        }
    }

    // Obtener citas por cliente
    public function obtenerPorCliente($cedulaCliente) {
        try {
            $sql = "EXEC ObtenerCitasPorCliente ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$cedulaCliente]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener citas del cliente: " . $e->getMessage());
        }
    }

    // Obtener citas por fecha
    public function obtenerPorFecha($fechaInicio, $fechaFin = null) {
        try {
            $sql = "EXEC ObtenerCitasPorFecha ?, ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$fechaInicio, $fechaFin]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener citas por fecha: " . $e->getMessage());
        }
    }

    // Actualizar estado de cita
    public function actualizarEstado($idCita, $nuevoEstado, $motivoCancelacion = null, $usuarioModificador = 1) {
        try {
            $sql = "EXEC ActualizarEstadoCita ?, ?, ?, ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            return $stmt->execute([$idCita, $nuevoEstado, $motivoCancelacion, $usuarioModificador]);
        } catch (PDOException $e) {
            throw new Exception("Error al actualizar estado de cita: " . $e->getMessage());
        }
    }

    // Reagendar cita
    public function reagendar($idCita, $nuevaFecha, $nuevaHora, $usuarioModificador = 1) {
        try {
            $sql = "EXEC ReagendarCita ?, ?, ?, ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            return $stmt->execute([$idCita, $nuevaFecha, $nuevaHora, $usuarioModificador]);
        } catch (PDOException $e) {
            throw new Exception("Error al reagendar cita: " . $e->getMessage());
        }
    }

    // Obtener disponibilidad de horarios
    public function obtenerDisponibilidad($fecha) {
        try {
            $sql = "EXEC ObtenerDisponibilidadHorarios ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$fecha]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener disponibilidad: " . $e->getMessage());
        }
    }

    // Obtener citas pendientes de confirmación
    public function obtenerPendientes() {
        try {
            $sql = "EXEC ObtenerCitasPendientesConfirmacion";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener citas pendientes: " . $e->getMessage());
        }
    }

    // Obtener detalle de cita
    public function obtenerDetalle($idCita) {
        try {
            $sql = "EXEC ObtenerDetalleCita ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$idCita]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener detalle de cita: " . $e->getMessage());
        }
    }

    // Obtener estadísticas
    public function obtenerEstadisticas($fechaInicio, $fechaFin) {
        try {
            $sql = "EXEC ObtenerEstadisticasCitas ?, ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$fechaInicio, $fechaFin]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener estadísticas: " . $e->getMessage());
        }
    }

    // Obtener cliente por cédula
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

    // Obtener mascotas por cliente
    public function obtenerMascotasPorCliente($cedulaCliente) {
        try {
            $sql = "SELECT IDMascota, Nombre, Especie FROM Mascota WHERE CedulaCliente = ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$cedulaCliente]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener mascotas: " . $e->getMessage());
        }
    }

    // Obtener servicios disponibles
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

    // Getters y Setters
    public function getIdCita() {
        return $this->idCita;
    }

    public function setIdCita($id) {
        $this->idCita = $id;
    }
}
?>