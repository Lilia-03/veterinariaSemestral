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


    //////////////validaciones grace//////////////
// Sanitiza texto simple
    public static function sanitizarTexto($texto, $maxLength = 255) {
        if (empty($texto)) return null;

        $texto = trim($texto);
        $texto = strip_tags($texto); // agregada de la segunda clase
        $texto = htmlspecialchars($texto, ENT_QUOTES, 'UTF-8');

        if (strlen($texto) > $maxLength) {
            $texto = substr($texto, 0, $maxLength);
        }

        return $texto;
    }

    // Alias de sanitizarTexto
    public static function limpiarTexto($texto, $maxLength = 255) {
        return self::sanitizarTexto($texto, $maxLength);
    }

    // Sanitiza números enteros
    public static function sanitizarEntero($numero) {
        if (empty($numero)) return null;

        $numero = filter_var($numero, FILTER_VALIDATE_INT);

        if ($numero === false) {
            throw new InvalidArgumentException('Número entero inválido');
        }

        return $numero;
    }

    // Sanitiza números decimales
public static function sanitizarDecimal($numero) {
    if (empty($numero) && $numero !== '0' && $numero !== 0) {
        return null;
    }

    // Limpiar el número de caracteres no numéricos (excepto punto y coma)
    $numero = str_replace([',', '$', ' '], '', (string)$numero);
    
    $numero = filter_var($numero, FILTER_VALIDATE_FLOAT);

    if ($numero === false) {
        throw new InvalidArgumentException('Número decimal inválido');
    }

    return round($numero, 2);
    }

    // Sanitiza texto de búsqueda eliminando caracteres no deseados
    public static function sanitizarBusqueda($busqueda) {
        if (empty($busqueda)) return '';

        $busqueda = trim($busqueda);
        $busqueda = htmlspecialchars($busqueda, ENT_QUOTES, 'UTF-8');
        $busqueda = preg_replace('/[^\w\s\-áéíóúñÁÉÍÓÚÑ]/u', '', $busqueda);

        return $busqueda;
    }

    // Sanitiza texto para JSON (escapa HTML)
    public static function sanitizarRespuestaJSON($data) {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = self::sanitizarRespuestaJSON($value);
            }
        } elseif (is_string($data)) {
            $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        }

        return $data;
    }

    public static function validarEnteroPositivo($numero, $campo = 'Campo') {
        $numero = self::sanitizarEntero($numero);

        if ($numero <= 0) {
            throw new InvalidArgumentException("$campo debe ser un número positivo");
        }

        return $numero;
    }

    public static function validarTextoRequerido($texto, $campo = 'Campo') {
        $texto = self::sanitizarTexto($texto);

        if (empty($texto)) {
            throw new InvalidArgumentException("$campo es requerido");
        }

        return $texto;
    }

    public static function validarNombre($nombre) {
        $errors = [];

        if (empty($nombre)) {
            $errors[] = "El nombre es obligatorio";
            return ['valid' => false, 'errors' => $errors, 'value' => null];
        }

        $nombre = self::limpiarTexto($nombre, 100);

        if (strlen($nombre) < 3) {
            $errors[] = "El nombre debe tener al menos 3 caracteres";
        }

        if (strlen($nombre) > 100) {
            $errors[] = "El nombre no puede exceder 100 caracteres";
        }

        if (preg_match('/[<>"\']/', $nombre)) {
            $errors[] = "El nombre contiene caracteres no permitidos";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'value' => $nombre
        ];
    }

    public static function validarCodigo($codigo) {
        $errors = [];

        if (empty($codigo)) {
            $errors[] = "El código es obligatorio";
            return ['valid' => false, 'errors' => $errors, 'value' => null];
        }

        $codigo = self::limpiarTexto($codigo, 20);

        if (strlen($codigo) < 3) {
            $errors[] = "El código debe tener al menos 3 caracteres";
        }

        if (strlen($codigo) > 20) {
            $errors[] = "El código no puede exceder 20 caracteres";
        }

        // Permitir solo letras, números y algunos caracteres especiales
        if (!preg_match('/^[a-zA-Z0-9\-_]+$/', $codigo)) {
            $errors[] = "El código solo puede contener letras, números, guiones y guiones bajos";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'value' => strtoupper($codigo) // Convertir a mayúsculas para consistencia
        ];
    }

    public static function validarTipo($tipo) {
        $errors = [];
        $tiposPermitidos = ['Servicio', 'Producto'];

        if (empty($tipo)) {
            $errors[] = "El tipo es obligatorio";
            return ['valid' => false, 'errors' => $errors, 'value' => null];
        }

        $tipo = self::limpiarTexto($tipo, 50);

        if (!in_array($tipo, $tiposPermitidos)) {
            $errors[] = "Tipo no válido. Debe ser 'Servicio' o 'Producto'";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'value' => $tipo
        ];
    }

    public static function validarPrecio($precio) {
        $errors = [];

        if (empty($precio) && $precio !== '0') {
            $errors[] = "El precio es obligatorio";
            return ['valid' => false, 'errors' => $errors, 'value' => null];
        }

        $precio = str_replace([',', '$', ' '], '', $precio);
        $precio = filter_var($precio, FILTER_VALIDATE_FLOAT);

        if ($precio === false) {
            $errors[] = "El precio debe ser un número válido";
            return ['valid' => false, 'errors' => $errors, 'value' => null];
        }

        if ($precio < 0) {
            $errors[] = "El precio no puede ser negativo";
        }

        if ($precio > 999999.99) {
            $errors[] = "El precio no puede exceder $999,999.99";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'value' => round($precio, 2)
        ];
    }

    public static function validarCantidad($cantidad, $obligatorio = false) {
        $errors = [];

        if (empty($cantidad) && $cantidad !== '0') {
            if ($obligatorio) {
                $errors[] = "La cantidad es obligatoria";
                return ['valid' => false, 'errors' => $errors, 'value' => null];
            } else {
                return ['valid' => true, 'errors' => [], 'value' => 0];
            }
        }

        $cantidad = filter_var($cantidad, FILTER_VALIDATE_INT);

        if ($cantidad === false) {
            $errors[] = "La cantidad debe ser un número entero válido";
            return ['valid' => false, 'errors' => $errors, 'value' => null];
        }

        if ($cantidad < 0) {
            $errors[] = "La cantidad no puede ser negativa";
        }

        if ($cantidad > 999999) {
            $errors[] = "La cantidad no puede exceder 999,999";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'value' => $cantidad
        ];
    }

    public static function validarDescripcion($descripcion) {
        if (empty($descripcion)) {
            return ['valid' => true, 'errors' => [], 'value' => ''];
        }

        $errors = [];
        $descripcion = self::limpiarTexto($descripcion, 500);

        if (strlen($descripcion) > 500) {
            $errors[] = "La descripción no puede exceder 500 caracteres";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'value' => $descripcion
        ];
    }

    public static function validarID($id) {
        $errors = [];

        if (empty($id)) {
            $errors[] = "El ID es obligatorio";
            return ['valid' => false, 'errors' => $errors, 'value' => null];
        }

        $id = filter_var($id, FILTER_VALIDATE_INT);

        if ($id === false || $id <= 0) {
            $errors[] = "El ID debe ser un número entero positivo";
            return ['valid' => false, 'errors' => $errors, 'value' => null];
        }

        return [
            'valid' => true,
            'errors' => [],
            'value' => $id
        ];
    }

    public static function validarTerminoBusqueda($termino) {
        $errors = [];

        if (empty($termino)) {
            $errors[] = "El término de búsqueda es obligatorio";
            return ['valid' => false, 'errors' => $errors, 'value' => null];
        }

        $termino = self::limpiarTexto($termino, 100);

        if (strlen($termino) < 2) {
            $errors[] = "El término de búsqueda debe tener al menos 2 caracteres";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'value' => $termino
        ];
    }

    // Método específico para validar datos de productos
    public static function validarDatosProducto($datos) {
        $errores = [];
        $datosLimpios = [];

        // Validar código
        $validacionCodigo = self::validarCodigo($datos['codigo'] ?? '');
        if (!$validacionCodigo['valid']) {
            $errores = array_merge($errores, $validacionCodigo['errors']);
        } else {
            $datosLimpios['codigo'] = $validacionCodigo['value'];
        }

        // Validar nombre
        $validacionNombre = self::validarNombre($datos['nombre'] ?? '');
        if (!$validacionNombre['valid']) {
            $errores = array_merge($errores, $validacionNombre['errors']);
        } else {
            $datosLimpios['nombre'] = $validacionNombre['value'];
        }

        // Validar precio
        $validacionPrecio = self::validarPrecio($datos['precio'] ?? '');
        if (!$validacionPrecio['valid']) {
            $errores = array_merge($errores, $validacionPrecio['errors']);
        } else {
            $datosLimpios['precio'] = $validacionPrecio['value'];
        }

        // Validar stock
        $validacionStock = self::validarCantidad($datos['stock'] ?? '', true);
        if (!$validacionStock['valid']) {
            $errores = array_merge($errores, $validacionStock['errors']);
        } else {
            $datosLimpios['stock'] = $validacionStock['value'];
        }

        // Validar descripción (opcional)
        $validacionDescripcion = self::validarDescripcion($datos['descripcion'] ?? '');
        if (!$validacionDescripcion['valid']) {
            $errores = array_merge($errores, $validacionDescripcion['errors']);
        } else {
            $datosLimpios['descripcion'] = $validacionDescripcion['value'];
        }

        return [
            'valid' => empty($errores),
            'errors' => $errores,
            'data' => $datosLimpios
        ];
    }

    public static function validarDatosItem($datos, $esEdicion = false) {
        $errores = [];
        $datosLimpios = [];

        if ($esEdicion) {
            $validacionID = self::validarID($datos['id'] ?? '');
            if (!$validacionID['valid']) {
                $errores = array_merge($errores, $validacionID['errors']);
            } else {
                $datosLimpios['id'] = $validacionID['value'];
            }
        }

        $validacionNombre = self::validarNombre($datos['nombre'] ?? '');
        if (!$validacionNombre['valid']) {
            $errores = array_merge($errores, $validacionNombre['errors']);
        } else {
            $datosLimpios['nombre'] = $validacionNombre['value'];
        }

        $validacionTipo = self::validarTipo($datos['tipo'] ?? '');
        if (!$validacionTipo['valid']) {
            $errores = array_merge($errores, $validacionTipo['errors']);
        } else {
            $datosLimpios['tipo'] = $validacionTipo['value'];
        }

        $validacionPrecio = self::validarPrecio($datos['precio'] ?? '');
        if (!$validacionPrecio['valid']) {
            $errores = array_merge($errores, $validacionPrecio['errors']);
        } else {
            $datosLimpios['precio'] = $validacionPrecio['value'];
        }

        if (isset($datosLimpios['tipo']) && $datosLimpios['tipo'] === 'Producto') {
            $validacionStock = self::validarCantidad($datos['stock'] ?? '', false);
            if (!$validacionStock['valid']) {
                $errores = array_merge($errores, $validacionStock['errors']);
            } else {
                $datosLimpios['stock'] = $validacionStock['value'];
            }
        }

        return [
            'valid' => empty($errores),
            'errors' => $errores,
            'data' => $datosLimpios
        ];
    }

    public static function validarPeticion($metodo, $datosRequeridos = []) {
        $errors = [];

        if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
            $errors[] = "Método HTTP no permitido";
        }

        if (in_array($metodo, ['POST', 'PUT'])) {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            if (strpos($contentType, 'application/json') === false &&
                strpos($contentType, 'application/x-www-form-urlencoded') === false) {
                $errors[] = "Content-Type no válido";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }


//////////////////////////////////

public static function validarDatosServicio($datos) {
    $errores = [];
    $datosLimpios = [];
    
    // Validar código
    if (empty($datos['codigo'])) {
        $errores[] = 'El código es requerido';
    } else {
        $codigo = self::sanitizarTexto($datos['codigo']);
        if (strlen($codigo) < 3) {
            $errores[] = 'El código debe tener al menos 3 caracteres';
        } elseif (strlen($codigo) > 50) {
            $errores[] = 'El código no puede tener más de 50 caracteres';
        } elseif (!preg_match('/^[A-Za-z0-9_-]+$/', $codigo)) {
            $errores[] = 'El código solo puede contener letras, números, guiones y guiones bajos';
        } else {
            $datosLimpios['codigo'] = strtoupper($codigo);
        }
    }
    
    // Validar nombre
    if (empty($datos['nombre'])) {
        $errores[] = 'El nombre es requerido';
    } else {
        $nombre = self::sanitizarTexto($datos['nombre']);
        if (strlen($nombre) < 3) {
            $errores[] = 'El nombre debe tener al menos 3 caracteres';
        } elseif (strlen($nombre) > 100) {
            $errores[] = 'El nombre no puede tener más de 100 caracteres';
        } else {
            $datosLimpios['nombre'] = $nombre;
        }
    }
    
    // Validar precio
    if (empty($datos['precio']) && $datos['precio'] !== '0') {
        $errores[] = 'El precio es requerido';
    } else {
        try {
            $precio = self::sanitizarDecimal($datos['precio']);
            if ($precio === null || $precio === false || $precio < 0) {
                $errores[] = 'El precio debe ser un número válido mayor o igual a 0';
            } elseif ($precio > 999999.99) {
                $errores[] = 'El precio no puede ser mayor a 999,999.99';
            } else {
                $datosLimpios['precio'] = $precio;
            }
        } catch (Exception $e) {
            $errores[] = 'El precio debe ser un número válido';
        }
    }
    
    // RETURN que faltaba - ESTO ES CRUCIAL
    return [
        'valid' => empty($errores),
        'data' => $datosLimpios,
        'errors' => $errores
    ];
}

public static function validarDatosUsuario($datos, $requierePassword = true) {
        $errors = [];
        $datosLimpios = [];
        
        // Validar nombre de usuario
        if (empty($datos['nombreUsuario'])) {
            $errors[] = 'Nombre de usuario es requerido';
        } else {
            $datosLimpios['nombreUsuario'] = trim($datos['nombreUsuario']);
        }
        
        // Validar email
        if (empty($datos['email'])) {
            $errors[] = 'Email es requerido';
        } elseif (!filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email inválido';
        } else {
            $datosLimpios['email'] = trim($datos['email']);
        }
        
        // Validar nombre completo
        if (empty($datos['nombreCompleto'])) {
            $errors[] = 'Nombre completo es requerido';
        } else {
            $datosLimpios['nombreCompleto'] = trim($datos['nombreCompleto']);
        }
        
        // Validar contraseña si es requerida
        if ($requierePassword) {
            if (empty($datos['password'])) {
                $errors[] = 'Contraseña es requerida';
            } elseif (strlen($datos['password']) < 6) {
                $errors[] = 'Contraseña debe tener al menos 6 caracteres';
            } else {
                $datosLimpios['password'] = $datos['password'];
            }
        } elseif (!empty($datos['password'])) {
            // Contraseña opcional pero si se proporciona debe ser válida
            if (strlen($datos['password']) < 6) {
                $errors[] = 'Contraseña debe tener al menos 6 caracteres';
            } else {
                $datosLimpios['password'] = $datos['password'];
            }
        }
        
        // Validar rol
        if (empty($datos['rolId'])) {
            $errors[] = 'Rol es requerido';
        } else {
            $datosLimpios['rolId'] = (int)$datos['rolId'];
        }
        
        // Campos opcionales
        if (!empty($datos['cedulaCliente'])) {
            $datosLimpios['cedulaCliente'] = trim($datos['cedulaCliente']);
        }
        
        if (isset($datos['activo'])) {
            $datosLimpios['activo'] = (int)$datos['activo'];
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'data' => $datosLimpios
        ];
    }

    /**
     * Sanitiza teléfono
     */
    public static function sanitizarTelefono($telefono) {
        // Eliminar todo excepto números y guiones
        return preg_replace('/[^0-9\-]/', '', trim($telefono));
    }
    
public static function validarParametrosBusquedaUsuario($parametros) {
    $errores = [];
    $datosLimpios = [];
    
    // Validar término de búsqueda (opcional)
    if (isset($parametros['termino'])) {
        $termino = self::sanitizarBusqueda($parametros['termino']);
        if (strlen($termino) > 100) {
            $errores[] = 'El término de búsqueda no puede exceder 100 caracteres';
        }
        $datosLimpios['termino'] = $termino;
    } else {
        $datosLimpios['termino'] = '';
    }
    
    // Validar tipo (opcional)
    if (isset($parametros['tipo'])) {
        $tipo = self::sanitizarTexto($parametros['tipo']);
        if (!empty($tipo) && !in_array($tipo, ['Producto', 'Servicio'])) {
            $errores[] = 'Tipo no válido. Debe ser "Producto" o "Servicio"';
        }
        $datosLimpios['tipo'] = $tipo;
    } else {
        $datosLimpios['tipo'] = '';
    }
    
    return [
        'valid' => empty($errores),
        'data' => $datosLimpios,
        'errors' => $errores
    ];
}

public static function validarIDConsultaUsuario($id) {
    $errores = [];
    
    if (empty($id)) {
        $errores[] = 'El ID del producto o servicio es requerido';
        return ['valid' => false, 'errors' => $errores, 'value' => null];
    }
    
    $id = filter_var($id, FILTER_VALIDATE_INT);
    
    if ($id === false || $id <= 0) {
        $errores[] = 'El ID debe ser un número entero positivo válido';
        return ['valid' => false, 'errors' => $errores, 'value' => null];
    }
    
    return [
        'valid' => true,
        'errors' => [],
        'value' => $id
    ];
}

public static function validarParametrosURL($parametrosGET) {
    $errores = [];
    $datosLimpios = [];
    
    // Validar acción
    $accion = $parametrosGET['accion'] ?? '';
    $accion = self::sanitizarTexto($accion);
    
    $accionesPermitidas = ['obtener', 'buscar', 'detalle', 'productos', 'servicios', 'estadisticas'];
    
    if (empty($accion)) {
        $errores[] = 'La acción es requerida';
    } elseif (!in_array($accion, $accionesPermitidas)) {
        $errores[] = 'Acción no válida';
    } else {
        $datosLimpios['accion'] = $accion;
    }
    
    // Validaciones específicas por acción
    switch ($accion) {
        case 'buscar':
            $validacionBusqueda = self::validarParametrosBusquedaUsuario($parametrosGET);
            if (!$validacionBusqueda['valid']) {
                $errores = array_merge($errores, $validacionBusqueda['errors']);
            } else {
                $datosLimpios = array_merge($datosLimpios, $validacionBusqueda['data']);
            }
            break;
            
        case 'detalle':
            $validacionId = self::validarIDConsultaUsuario($parametrosGET['id'] ?? '');
            if (!$validacionId['valid']) {
                $errores = array_merge($errores, $validacionId['errors']);
            } else {
                $datosLimpios['id'] = $validacionId['value'];
            }
            break;
    }
    
    return [
        'valid' => empty($errores),
        'data' => $datosLimpios,
        'errors' => $errores
    ];
}

public static function prepararRespuestaJSON($datos) {
    if (is_array($datos)) {
        $datosLimpios = [];
        foreach ($datos as $clave => $valor) {
            if (is_string($valor)) {
                // Escapar HTML pero mantener caracteres UTF-8
                $datosLimpios[$clave] = htmlspecialchars($valor, ENT_QUOTES, 'UTF-8');
            } elseif (is_array($valor)) {
                $datosLimpios[$clave] = self::prepararRespuestaJSON($valor);
            } else {
                $datosLimpios[$clave] = $valor;
            }
        }
        return $datosLimpios;
    } elseif (is_string($datos)) {
        return htmlspecialchars($datos, ENT_QUOTES, 'UTF-8');
    }
    
    return $datos;
}

public static function validarPrecioPresentacion($precio) {
    $errores = [];
    
    if (!is_numeric($precio)) {
        $errores[] = 'El precio debe ser numérico';
        return ['valid' => false, 'errors' => $errores, 'value' => null];
    }
    
    $precio = floatval($precio);
    
    if ($precio < 0) {
        $errores[] = 'El precio no puede ser negativo';
    }
    
    return [
        'valid' => empty($errores),
        'errors' => $errores,
        'value' => number_format($precio, 2, '.', '')
    ];
}

public static function validarCantidadPresentacion($cantidad, $tipo) {
    $errores = [];
    $valorLimpio = null;
    
    if ($tipo === 'Servicio') {
        // Los servicios no manejan cantidad
        $valorLimpio = null;
    } else {
        // Para productos, validar cantidad
        if (!is_numeric($cantidad) && $cantidad !== null) {
            $errores[] = 'La cantidad debe ser numérica';
        } else {
            $valorLimpio = $cantidad === null ? 0 : intval($cantidad);
            if ($valorLimpio < 0) {
                $errores[] = 'La cantidad no puede ser negativa';
                $valorLimpio = 0;
            }
        }
    }
    
    return [
        'valid' => empty($errores),
        'errors' => $errores,
        'value' => $valorLimpio
    ];
}

public static function limpiarItemParaPresentacion($item) {
    $itemLimpio = [];
    $errores = [];
    
    // ID
    $itemLimpio['id'] = isset($item['IDITEM']) ? intval($item['IDITEM']) : 0;
    
    // Nombre
    $itemLimpio['nombre'] = isset($item['NombreProducto']) ? 
        self::sanitizarTexto($item['NombreProducto']) : '';
    
    // Tipo
    $itemLimpio['tipo'] = isset($item['Tipo']) ? 
        self::sanitizarTexto($item['Tipo']) : '';
    
    // Precio
    $validacionPrecio = self::validarPrecioPresentacion($item['PrecioITEM'] ?? 0);
    $itemLimpio['precio'] = $validacionPrecio['valid'] ? $validacionPrecio['value'] : '0.00';
    
    // Cantidad y disponibilidad
    $validacionCantidad = self::validarCantidadPresentacion(
        $item['CantidadDisponible'] ?? null, 
        $itemLimpio['tipo']
    );
    $itemLimpio['cantidad'] = $validacionCantidad['value'];
    
    // Estado de disponibilidad
    $itemLimpio['disponibilidad'] = isset($item['EstadoDisponibilidad']) ? 
        self::sanitizarTexto($item['EstadoDisponibilidad']) : 'Desconocido';
    
    return [
        'item' => $itemLimpio,
        'errors' => $errores
    ];
}

public static function validarMetodoHTTPUsuario($metodoRequerido = 'GET') {
    $errores = [];
    $metodoActual = $_SERVER['REQUEST_METHOD'] ?? '';
    
    if ($metodoActual !== $metodoRequerido) {
        $errores[] = "Método HTTP no permitido. Se requiere $metodoRequerido";
    }
    
    return [
        'valid' => empty($errores),
        'errors' => $errores,
        'method' => $metodoActual
    ];
}    
}

?>
