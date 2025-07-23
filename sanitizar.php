<?php
class SanitizarEntrada {
    // Elimina etiquetas HTML y espacios
    public static function limpiarCadena($cadena) {
        return trim(strip_tags($cadena));
    }

    // Valida si un campo NO está vacío después de limpiarlo
    public static function validarNoVacio($valor) {
        return strlen(trim($valor)) > 0;
    }

    // Valida si un valor es un entero numérico válido y positivo
    public static function validarEntero($valor) {
        $valor = trim($valor);
        if (ctype_digit($valor) && $valor > 0) {
            return intval($valor);
        }
        return 0;
    }

    // Valida si un valor es un número decimal válido y positivo
    public static function validarDecimal($valor) {
        $valor = trim($valor);
        if (is_numeric($valor) && floatval($valor) > 0) {
            return floatval($valor);
        }
        return 0.0;
    }

    // Valida que el texto solo contenga letras (y espacios opcionalmente)
    public static function validarTexto($valor) {
        return preg_match("/^[a-zA-Z\s]+$/", trim($valor));
    }

    public static function limpiarEmail($valor) {
        $valor = self::limpiarCadena($valor);
        return filter_var($valor, FILTER_VALIDATE_EMAIL);
    }
}
?>
