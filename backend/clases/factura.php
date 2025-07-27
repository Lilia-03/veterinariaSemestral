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

    // Generar nueva factura
    public function generar() {
    try {
        $sql = "EXEC GenerarFactura ?, ?";
        $stmt = $this->conexion->getPDO()->prepare($sql);
        $stmt->execute([$this->cedulaCliente, $this->idMascota]);
        
        // Saltear cualquier resultado que no tenga campos (PRINT statements) y recibe el id de la factura
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

    // Agregar producto a la factura
    public function agregarProducto($idItem, $cantidad) {
        try {
            $sql = "EXEC ComprarProducto @IDITEM = ?, @Cantidad = ?, @IDFactura = ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            return $stmt->execute([$idItem, $cantidad, $this->idFactura]);
        } catch (PDOException $e) {
            throw new Exception("Error al agregar producto: " . $e->getMessage());
        }
    }

    // Agregar servicio a la factura
    public function agregarServicio($idMascota, $idItem) {
        try {
            $sql = "EXEC RegistrarServicioMascota @IDMascota = ?, @IDITEM = ?, @IDFactura = ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            return $stmt->execute([$idMascota, $idItem, $this->idFactura]);
        } catch (PDOException $e) {
            throw new Exception("Error al agregar servicio: " . $e->getMessage());
        }
    }

    // Completar factura
    public function completar() {
        try {
            $sql = "EXEC CompletarFactura @IDFactura = ?";
            $stmt = $this->conexion->getPDO()->prepare($sql);
            return $stmt->execute([$this->idFactura]);
        } catch (PDOException $e) {
            throw new Exception("Error al completar factura: " . $e->getMessage());
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

    // Obtener mascotas por cédula del cliente
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

    // Obtener productos disponibles
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

    // Obtener detalles de factura para visualización
    public function obtenerDetalles($idFactura) {
        try {
            // Obtener información de la factura
            $sqlFactura = "SELECT f.IDFactura, f.Fecha, f.subtotalf, f.ITBMSFactura, f.totalFactura,
                                  c.Nombre AS NombreCliente, c.Cedula,
                                  m.Nombre AS NombreMascota
                           FROM Factura f 
                           LEFT JOIN Cliente c ON f.CedulaCliente = c.Cedula
                           LEFT JOIN Mascota m ON f.IDMascota = m.IDMascota
                           WHERE f.IDFactura = ?";
            
            $stmt = $this->conexion->getPDO()->prepare($sqlFactura);
            $stmt->execute([$idFactura]);
            $factura = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$factura) {
                throw new Exception("Factura no encontrada");
            }

            // Obtener items de la factura
            $sqlItems = "SELECT sp.IDITEM, sp.NombreProducto, sp.Tipo, 
                               v.CantidadVendida, v.PrecioBruto, v.ITBMSLinea, v.totalLinea
                        FROM Venta v 
                        JOIN Servicio_Producto sp ON v.IDITEM = sp.IDITEM 
                        WHERE v.IDFactura = ?";
            
            $stmt = $this->conexion->getPDO()->prepare($sqlItems);
            $stmt->execute([$idFactura]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                'factura' => $factura,
                'items' => $items
            ];
        } catch (PDOException $e) {
            throw new Exception("Error al obtener detalles de factura: " . $e->getMessage());
        }
    }

    // Getters
    public function getIdFactura() {
        return $this->idFactura;
    }

    public function setIdFactura($id) {
        $this->idFactura = $id;
    }
}
?>