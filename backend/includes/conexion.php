<?php
class Conexion {
    private $pdo;

    public function __construct() {
        try {
            $this->pdo = new PDO("sqlsrv:Server=localhost;Database=CliniPet", "clinipet_user", "Clinipet123!", [
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
            ]);
        } catch (PDOException $e) {
            die("Error de conexión: " . $e->getMessage());
        }
    }

    // Método para obtener la instancia PDO (necesario para la clase Factura)
    public function getPDO() {
        return $this->pdo;
    }

    public function registrarCliente($cedula, $nombre, $telefono, $email, $direccion) {
        $sql = "EXEC RegistrarCliente @Cedula = ?, @Nombre = ?, @Teléfono = ?, @Email = ?, @Dirección = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$cedula, $nombre, $telefono, $email, $direccion]);
    }

    public function registrarMascota($nombre, $especie, $peso, $edad, $cedulaCliente, $razaID, $genero, $foto = null, $condiciones = null) {
        $sql = "EXEC RegistrarMascota 
            @Nombre = ?, 
            @Especie = ?, 
            @Peso = ?, 
            @Edad = ?, 
            @CedulaCliente = ?, 
            @RazaID = ?, 
            @Genero = ?, 
            @Foto = ?, 
            @Condiciones = ?";
        $stmt = $this->pdo->prepare($sql);

        // Para la foto, si existe conviertes a binario (ya en PHP recibes con $_FILES)
        $fotoBinaria = null;
        if ($foto && is_file($foto)) {
            $fotoBinaria = file_get_contents($foto);
        } elseif (is_string($foto)) {
            // Si ya es contenido binario base64 o algo, úsalo directamente
            $fotoBinaria = $foto;
        }

        return $stmt->execute([$nombre, $especie, $peso, $edad, $cedulaCliente, $razaID, $genero, $fotoBinaria, $condiciones]);
    }



    public function consultarMascota($idMascota = null, $cedula = null) {
        $sql = "EXEC ConsultarClienteYMascota @Cedula = ?, @IDMascota = ?";
        $stmt = $this->pdo->prepare($sql);

        // Ejecutar pasando ambos parámetros (uno puede ser null)
        $stmt->execute([$cedula, $idMascota]);

        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($resultado && $resultado['Foto'] !== null) {
            $resultado['FotoBase64'] = base64_encode($resultado['Foto']);
            unset($resultado['Foto']);
        }

        return $resultado;
    }

    public function listarRazas() {
        $sql = "SELECT RazaID, Nombre FROM Raza ORDER BY Nombre";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listarCondiciones() {
        $sql = "SELECT CondicionID, Nombre FROM CondicionMedica ORDER BY Nombre";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }


}
?>
