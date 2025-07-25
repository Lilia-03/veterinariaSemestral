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

    // Generar nueva factura CON FIRMA
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

            // AHORA CON 3 PARÁMETROS
            $sql = "EXEC GenerarFactura ?, ?, ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            $stmt->execute([$this->cedulaCliente, $this->idMascota, $usuarioFirma]);
            
            // Saltear cualquier resultado que no tenga campos y recibir el id de la factura
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
        }
    }

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
}
?>