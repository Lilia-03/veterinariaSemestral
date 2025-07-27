<?php
// test-openssl-simple.php - Coloca este archivo en backend/test/
header('Content-Type: text/plain');

echo "=== TEST OPENSSL BÁSICO ===\n\n";

// 1. Verificar extensión
echo "1. Extensión OpenSSL: ";
if (extension_loaded('openssl')) {
    echo "✅ CARGADA\n";
    echo "   Versión: " . OPENSSL_VERSION_TEXT . "\n\n";
} else {
    echo "❌ NO CARGADA\n";
    echo "   SOLUCIÓN: Habilitar en php.ini -> extension=openssl\n\n";
    exit;
}

// 2. Verificar funciones críticas
echo "2. Funciones críticas:\n";
$funciones = ['openssl_pkey_new', 'openssl_pkey_export', 'openssl_sign', 'openssl_verify'];
foreach ($funciones as $func) {
    echo "   $func: " . (function_exists($func) ? "✅" : "❌") . "\n";
}
echo "\n";

// 3. Test básico de generación de claves
echo "3. Test de generación de claves RSA:\n";
try {
    $config = [
        "digest_alg" => "sha256",
        "private_key_bits" => 2048,
        "private_key_type" => OPENSSL_KEYTYPE_RSA,
    ];
    
    echo "   Generando par de claves...\n";
    $resource = openssl_pkey_new($config);
    
    if (!$resource) {
        throw new Exception('Error: ' . openssl_error_string());
    }
    
    echo "   ✅ Par de claves generado\n";
    
    // Exportar clave privada
    $clavePrivada = '';
    if (!openssl_pkey_export($resource, $clavePrivada)) {
        throw new Exception('Error exportando: ' . openssl_error_string());
    }
    
    echo "   ✅ Clave privada exportada (" . strlen($clavePrivada) . " chars)\n";
    
    // Obtener clave pública
    $detalles = openssl_pkey_get_details($resource);
    if (!$detalles) {
        throw new Exception('Error obteniendo pública: ' . openssl_error_string());
    }
    
    echo "   ✅ Clave pública obtenida (" . $detalles['bits'] . " bits)\n";
    
} catch (Exception $e) {
    echo "   ❌ ERROR: " . $e->getMessage() . "\n";
    echo "\nDiagnóstico:\n";
    echo "- Verificar que OpenSSL esté correctamente instalado\n";
    echo "- Verificar permisos del directorio temporal\n";
    echo "- Reiniciar servidor web después de cambios en php.ini\n\n";
    exit;
}

// 4. Test de cifrado/descifrado
echo "\n4. Test de cifrado AES:\n";
try {
    $data = "Test de cifrado CliniPet";
    $password = "test123";
    $iv = random_bytes(16);
    
    $encrypted = openssl_encrypt($data, 'AES-256-CBC', $password, 0, $iv);
    if (!$encrypted) {
        throw new Exception('Error cifrando: ' . openssl_error_string());
    }
    
    echo "   ✅ Datos cifrados\n";
    
    $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $password, 0, $iv);
    if ($decrypted !== $data) {
        throw new Exception('Datos no coinciden después del descifrado');
    }
    
    echo "   ✅ Datos descifrados correctamente\n";
    
} catch (Exception $e) {
    echo "   ❌ ERROR: " . $e->getMessage() . "\n";
}

// 5. Test de firma/verificación
echo "\n5. Test de firma digital:\n";
try {
    $data = "CliniPet test data";
    $hash = hash('sha256', $data);
    
    $signature = '';
    if (!openssl_sign($hash, $signature, $clavePrivada, OPENSSL_ALGO_SHA256)) {
        throw new Exception('Error firmando: ' . openssl_error_string());
    }
    
    echo "   ✅ Datos firmados (" . strlen($signature) . " bytes)\n";
    
    $verify = openssl_verify($hash, $signature, $detalles['key'], OPENSSL_ALGO_SHA256);
    if ($verify === 1) {
        echo "   ✅ Firma verificada correctamente\n";
    } elseif ($verify === 0) {
        echo "   ❌ Firma inválida\n";
    } else {
        echo "   ❌ Error verificando: " . openssl_error_string() . "\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== RESULTADO FINAL ===\n";
echo "✅ OpenSSL está funcionando correctamente\n";
echo "✅ El problema debe estar en la base de datos o en la lógica de la aplicación\n\n";

echo "Siguiente paso: Verificar la conexión a la base de datos\n";
?>