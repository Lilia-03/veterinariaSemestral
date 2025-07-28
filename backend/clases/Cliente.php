<?php
require_once __DIR__ . '/../includes/conexion.php';
require_once __DIR__ . '/../includes/sanitizar.php';

class Cliente {
    private $cedula;
    private $nombre;
    private $telefono;
    private $email;
    private $direccion;
    private $conexion;

    public function __construct() {
        $this->conexion = new Conexion();
    }

    public function setDatos($cedula, $nombre, $telefono, $email, $direccion) {
        $this->cedula = SanitizarEntrada::limpiarCadena($cedula);
        $this->nombre = SanitizarEntrada::limpiarCadena($nombre);
        $this->telefono = SanitizarEntrada::limpiarCadena($telefono);
        $this->email = SanitizarEntrada::limpiarCadena($email);
        $this->direccion = SanitizarEntrada::limpiarCadena($direccion);
        
        // Validaciones adicionales
        if (!SanitizarEntrada::validarNoVacio($this->cedula)) {
            throw new Exception("La cédula es obligatoria");
        }
        
        if (!SanitizarEntrada::validarNoVacio($this->nombre)) {
            throw new Exception("El nombre es obligatorio");
        }
        
        if (!SanitizarEntrada::validarEmail($this->email)) {
            throw new Exception("El email no tiene un formato válido");
        }
        
        if (!SanitizarEntrada::validarTelefono($this->telefono)) {
            throw new Exception("El teléfono no tiene un formato válido");
        }
    }

    public function guardar() {
        return $this->conexion->registrarCliente(
            $this->cedula, 
            $this->nombre, 
            $this->telefono, 
            $this->email, 
            $this->direccion
        );
    }

    // Método consultar 
    public function consultar($cedula) {
        return $this->conexion->obtenerClientePorCedula($cedula);
    }

    // Método para validar si el cliente existe
    public function existe($cedula) {
        $cliente = $this->consultar($cedula);
        return $cliente !== null;
    }

    // Getters
    public function getCedula() { return $this->cedula; }
    public function getNombre() { return $this->nombre; }
    public function getTelefono() { return $this->telefono; }
    public function getEmail() { return $this->email; }
    public function getDireccion() { return $this->direccion; }
}