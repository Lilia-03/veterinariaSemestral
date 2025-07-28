<?php
require_once __DIR__ . '/../includes/conexion.php';
require_once __DIR__ . '/../includes/sanitizar.php';

class Mascota {
    private $nombre;
    private $especie;
    private $peso;
    private $edad;
    private $cedulaCliente;
    private $razaID;
    private $genero;
    private $foto;
    private $condiciones;
    private $conexion;

    public function __construct() {
        $this->conexion = new Conexion();
    }

    public function setDatos($nombre, $especie, $peso, $edad, $cedulaCliente, $razaID, $genero, $foto = null, $condiciones = []) {
        $this->nombre = SanitizarEntrada::limpiarCadena($nombre);
        $this->especie = SanitizarEntrada::limpiarCadena($especie);
        $this->peso = SanitizarEntrada::validarDecimal($peso);
        $this->edad = SanitizarEntrada::validarEntero($edad);
        $this->cedulaCliente = SanitizarEntrada::limpiarCadena($cedulaCliente);
        $this->razaID = SanitizarEntrada::validarEntero($razaID);
        $this->genero = SanitizarEntrada::limpiarCadena($genero);
        
        // CAMBIO PRINCIPAL: No hacer base64_decode aquí
        // El controller ya envía los datos binarios correctos
        $this->foto = $foto;
        
        $this->condiciones = array_map('SanitizarEntrada::limpiarCadena', $condiciones);
        
        // Validaciones adicionales
        if (!SanitizarEntrada::validarNoVacio($this->nombre)) {
            throw new Exception("El nombre de la mascota es obligatorio");
        }
        
        if (!SanitizarEntrada::validarNoVacio($this->cedulaCliente)) {
            throw new Exception("La cédula del cliente es obligatoria");
        }
        
        if ($this->peso <= 0) {
            throw new Exception("El peso debe ser mayor a cero");
        }
        
        if ($this->edad <= 0) {
            throw new Exception("La edad debe ser mayor a cero");
        }
        
        if ($this->razaID <= 0) {
            throw new Exception("Debe seleccionar una raza válida");
        }
        
        if (!in_array(strtolower($this->genero), ['macho', 'hembra'])) {
            throw new Exception("El género debe ser 'macho' o 'hembra'");
        }
    }

    public function guardar() {
        return $this->conexion->registrarMascota(
            $this->nombre, 
            $this->especie, 
            $this->peso, 
            $this->edad, 
            $this->cedulaCliente, 
            $this->razaID, 
            $this->genero, 
            $this->foto, 
            $this->condiciones
        );
    }

    public function consultar($idMascota = null, $cedula = null) {
        return $this->conexion->consultarMascota($idMascota, $cedula);
    }

    public function listarRazasPorEspecie($especieID) {
        try {
            $especieID = SanitizarEntrada::validarEntero($especieID);
            if ($especieID <= 0) {
                throw new Exception("ID de especie inválido");
            }
            return $this->conexion->listarRazasPorEspecie($especieID);
        } catch (Exception $e) {
            throw new Exception("Error al listar razas: " . $e->getMessage());
        }
    }

    public function listarCondicionesPorEspecie($especieID) {
        try {
            $especieID = SanitizarEntrada::validarEntero($especieID);
            if ($especieID <= 0) {
                throw new Exception("ID de especie inválido");
            }
            return $this->conexion->listarCondicionesPorEspecie($especieID);
        } catch (Exception $e) {
            throw new Exception("Error al listar condiciones: " . $e->getMessage());
        }
    }

    public function listarEspecies() {
        try {
            return $this->conexion->listarEspecies();
        } catch (Exception $e) {
            throw new Exception("Error al listar especies: " . $e->getMessage());
        }
    }

    // Método para validar tipos de archivo permitidos
    public function validarTipoArchivo($tipoMime) {
        $tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        return in_array($tipoMime, $tiposPermitidos);
    }

    // Método para validar tamaño de archivo (5MB máximo)
    public function validarTamanoArchivo($tamano) {
        $maxTamano = 5 * 1024 * 1024; // 5MB
        return $tamano <= $maxTamano;
    }

    // Método para actualizar los datos de una mascota
    public function actualizarMascota($datos) {
        $idMascota = $datos['idMascota'] ?? null;
        $peso = $datos['peso'] ?? null;
        $edad = $datos['edad'] ?? null;
        $condiciones = $datos['condiciones'] ?? '';

        return $this->conexion->actualizarMascota($idMascota, $peso, $edad, $condiciones);
    }

    
    // Método para obtener condiciones médicas desde SQL
    public static function obtenerCondicionesMedicasPorEspecie($especieID)
    {
        $especieID = SanitizarEntrada::validarEntero($especieID);
        if ($especieID <= 0) {
            throw new Exception("ID de especie inválido");
        }
        return Conexion::obtenerCondicionesMedicasPorEspecie($especieID);
    }   


    // Método para obtener todas las condiciones médicas
    public static function obtenerCondicionesMedicas() {
        return Conexion::obtenerCondicionesMedicasDesdeSQL();
    }

    // Getters
    public function getNombre() { return $this->nombre; }
    public function getEspecie() { return $this->especie; }
    public function getPeso() { return $this->peso; }
    public function getEdad() { return $this->edad; }
    public function getCedulaCliente() { return $this->cedulaCliente; }
    public function getRazaID() { return $this->razaID; }
    public function getGenero() { return $this->genero; }
    public function getFoto() { return $this->foto; }
    public function getCondiciones() { return $this->condiciones; }
}