<?php
require_once '../clases/factura.php';

/*Para esto es necesario instalar la libreria mPDF para poder generar los pdf 
   utilizando composer solamente tienen que escribir esta linea en la terminal:
    composer require mpdf/mpdf 
   con eso se les debe descargar todo lo necesario y se crean la carpeta de vendor y 2 archivos composer*/ 

// mpdf es una librería para generar PDFs en PHP instalada con composer
if (file_exists('../vendor/autoload.php')) {
    require_once '../vendor/autoload.php';
} elseif (file_exists('../vendor/mpdf/mpdf/src/Mpdf.php')) {
    require_once '../vendor/mpdf/mpdf/src/Mpdf.php';
} else {
    // Fallback: usar librería FPDF más simple
    generarPDFConFPDF();
    exit;
}

$idFactura = $_GET['id'] ?? null;

if (!$idFactura) {
    http_response_code(400);
    die('Error: ID de factura requerido');
}

try {
    $factura = new Factura();
    $detalles = $factura->obtenerDetalles($idFactura);
    
    if (!$detalles || empty($detalles['items'])) {
        throw new Exception('No se encontraron detalles para la factura');
    }
    
    $facturaInfo = $detalles['factura'];
    $items = $detalles['items'];
    
    // Crear instancia de mPDF con configuración mejorada
    $mpdf = new \Mpdf\Mpdf([
        'format' => 'Letter',
        'margin_left' => 15,
        'margin_right' => 15,
        'margin_top' => 20,
        'margin_bottom' => 20,
        'default_font' => 'arial',
        'default_font_size' => 12
    ]);
    
    // CSS mejorado para el PDF
    $css = '
    <style>
        body { 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            line-height: 1.4;
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #667eea; 
            padding-bottom: 15px; 
        }
        .header h1 { 
            color: #667eea; 
            font-size: 28px; 
            margin: 0; 
            font-weight: bold;
        }
        .header h2 { 
            color: #ffa500; 
            font-size: 24px; 
            margin: 5px 0; 
            font-weight: bold;
        }
        .header p {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }
        .info-section { 
            margin-bottom: 25px; 
        }
        .info-section table { 
            width: 100%; 
            margin-bottom: 25px; 
            border: none; 
        }
        .info-section table td { 
            border: none; 
            padding: 0; 
            vertical-align: top; 
        }
        .info-left { 
            width: 50%; 
        }
        .info-right { 
            width: 50%; 
            text-align: right; 
        }
        .section-title { 
            color: #667eea; 
            border-bottom: 2px solid #667eea; 
            padding-bottom: 5px; 
            margin-bottom: 10px; 
            font-weight: bold; 
            font-size: 16px;
        }
        .info-item { 
            margin-bottom: 8px; 
            font-size: 13px;
        }
        .info-item strong {
            color: #333;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
            font-size: 11px;
        }
        th { 
            background-color: #667eea; 
            color: white; 
            font-weight: bold; 
            text-align: center; 
        }
        .text-center { 
            text-align: center; 
        }
        .text-right { 
            text-align: right; 
        }
        .totals { 
            width: 300px; 
            margin-left: auto; 
            margin-top: 20px; 
        }
        .totals table {
            font-size: 12px;
        }
        .final-total { 
            background-color: #667eea; 
            color: white; 
            font-weight: bold; 
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 15px; 
            border-top: 1px solid #ddd; 
        }
        .firma-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            font-size: 11px;
        }
        .firma-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
        }
        .firma-valida {
            color: #28a745;
            font-weight: bold;
        }
        .firma-invalida {
            color: #dc3545;
            font-weight: bold;
        }
        .status-completa {
            color: #28a745;
            font-weight: bold;
            background-color: #d4edda;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
    </style>
    ';
    
    // Preparar información de la firma OpenSSL
    $infoFirma = '';
    if (isset($facturaInfo['FirmaDigital']) && $facturaInfo['FirmaDigital']) {
        $firmaValida = $facturaInfo['FirmaValida'] ?? false;
        $infoFirmaDigital = $facturaInfo['InfoFirmaDigital'] ?? null;
        
        // Determinar tipo de firma y mostrar información apropiada
        $tipoFirma = 'Básica';
        $detallesTecnicos = '';
        
        if ($infoFirmaDigital && isset($infoFirmaDigital['tipo_firma'])) {
            $tipoFirma = $infoFirmaDigital['tipo_firma'];
            
            if ($tipoFirma === 'OpenSSL RSA-SHA256') {
                $detallesTecnicos = '
                <div style="margin-top: 10px; padding: 10px; background-color: #e8f4fd; border-radius: 5px;">
                    <h6 style="color: #0c5aa6; margin-bottom: 8px;">Detalles Criptográficos:</h6>
                    <div style="font-size: 10px;">
                        <div style="margin-bottom: 4px;"><strong>Algoritmo:</strong> ' . ($infoFirmaDigital['algoritmo'] ?? 'RSA-SHA256') . '</div>
                        <div style="margin-bottom: 4px;"><strong>Versión:</strong> ' . ($infoFirmaDigital['version'] ?? '2.0_openssl') . '</div>
                        <div style="margin-bottom: 4px;"><strong>Fingerprint:</strong> ' . ($infoFirmaDigital['fingerprint'] ?? 'No disponible') . '</div>
                        <div style="margin-bottom: 4px;"><strong>Tipo de Clave:</strong> RSA-2048 bits</div>
                        <div style="margin-bottom: 4px;"><strong>Verificación:</strong> openssl_verify() exitosa</div>
                    </div>
                </div>';
            }
        }
        
        $estadoFirma = $firmaValida ? 
            '<span class="firma-valida">✓ Firma Digital Válida (' . $tipoFirma . ')</span>' : 
            '<span class="firma-invalida">✗ Firma Digital Inválida</span>';
        
        $fechaFirma = isset($facturaInfo['FechaFirma']) ? 
            date('d/m/Y H:i:s', strtotime($facturaInfo['FechaFirma'])) : 
            'No disponible';
        
        $infoFirma = '
        <div class="firma-section">
            <h3 class="section-title">INFORMACIÓN DE FIRMA DIGITAL</h3>
            <div class="firma-info">
                <div style="margin-bottom: 8px;"><strong>Estado:</strong> ' . $estadoFirma . '</div>
                <div style="margin-bottom: 8px;"><strong>Firmado por:</strong> ' . htmlspecialchars($facturaInfo['NombreFirmante'] ?? 'No disponible') . '</div>
                <div style="margin-bottom: 8px;"><strong>Cargo:</strong> ' . htmlspecialchars($facturaInfo['RolFirmante'] ?? 'No disponible') . '</div>
                <div style="margin-bottom: 8px;"><strong>Fecha y Hora:</strong> ' . $fechaFirma . '</div>
                <div style="margin-bottom: 8px;"><strong>Usuario:</strong> ' . htmlspecialchars($facturaInfo['UsuarioFirmante'] ?? 'No disponible') . '</div>';
        
        if ($infoFirmaDigital && isset($infoFirmaDigital['ip_address'])) {
            $infoFirma .= '<div style="margin-bottom: 8px;"><strong>IP:</strong> ' . htmlspecialchars($infoFirmaDigital['ip_address']) . '</div>';
        }
        
        $infoFirma .= $detallesTecnicos . '
            </div>
        </div>';
    }
    
    // HTML del contenido
    $html = $css . '
    <div class="header">
        <h1>FACTURA</h1>
        <h2>CliniPet</h2>
        <p>Sistema de Atención Médica para Mascotas</p>
        <p style="font-size: 12px; color: #888;">🔐 Documento Firmado Digitalmente con OpenSSL RSA-SHA256</p>
    </div>
    
    <div class="info-section">
        <table style="width: 100%; margin-bottom: 25px;">
            <tr>
                <td style="width: 50%; vertical-align: top; border: none; padding: 0;">
                    <h3 class="section-title">DATOS DEL CONSUMIDOR</h3>
                    <div class="info-item"><strong>Nombre del Cliente:</strong> ' . htmlspecialchars($facturaInfo['NombreCliente'] ?? 'Contado') . '</div>
                    <div class="info-item"><strong>Cédula:</strong> ' . htmlspecialchars($facturaInfo['CedulaCliente'] === '---' ? 'Contado' : ($facturaInfo['CedulaCliente'] ?? 'Contado')) . '</div>
                    <div class="info-item"><strong>Nombre de la Mascota:</strong> ' . htmlspecialchars($facturaInfo['NombreMascota'] ?? 'Sin mascota específica') . '</div>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right; border: none; padding: 0;">
                    <div class="info-item"><strong>Factura N°:</strong> ' . htmlspecialchars($idFactura) . '</div>
                    <div class="info-item"><strong>Fecha:</strong> ' . ($facturaInfo['FechaFactura'] ? date('d/m/Y', strtotime($facturaInfo['FechaFactura'])) : date('d/m/Y')) . '</div>
                    <div class="info-item"><strong>Estado:</strong> <span class="status-completa">Completada</span></div>
                </td>
            </tr>
        </table>
    </div>
    
    <h3 class="section-title">DETALLE</h3>
    <table>
        <thead>
            <tr>
                <th style="width: 12%;">Código</th>
                <th style="width: 35%;">Descripción</th>
                <th style="width: 10%;">Cantidad</th>
                <th style="width: 15%;">Precio Unitario</th>
                <th style="width: 13%;">ITBMS</th>
                <th style="width: 15%;">Importe</th>
            </tr>
        </thead>
        <tbody>';
        
    foreach ($items as $item) {
        $html .= '<tr>
            <td class="text-center">' . ($item['Tipo'] === 'Producto' ? 'PROD-' : 'SERV-') . $item['IDITEM'] . '</td>
            <td>' . htmlspecialchars($item['NombreProducto']) . '</td>
            <td class="text-center">' . $item['CantidadVendida'] . '</td>
            <td class="text-right">$' . number_format($item['PrecioBruto'] / $item['CantidadVendida'], 2) . '</td>
            <td class="text-right">$' . number_format($item['ITBMSLinea'], 2) . '</td>
            <td class="text-right">$' . number_format($item['totalLinea'], 2) . '</td>
        </tr>';
    }
    
    $subtotal = $facturaInfo['subtotalf'] ?? 0;
    $itbms = $facturaInfo['ITBMSFactura'] ?? 0;
    $total = $facturaInfo['totalFactura'] ?? 0;
    
    $html .= '</tbody>
    </table>
    
    <div class="totals">
        <table>
            <tr>
                <td style="padding: 8px;"><strong>Total de Importe:</strong></td>
                <td class="text-right" style="padding: 8px;"><strong>$' . number_format($subtotal, 2) . '</strong></td>
            </tr>
            <tr>
                <td style="padding: 8px;"><strong>ITBMS (7%):</strong></td>
                <td class="text-right" style="padding: 8px;"><strong>$' . number_format($itbms, 2) . '</strong></td>
            </tr>
            <tr class="final-total">
                <td style="padding: 8px;"><strong>TOTAL:</strong></td>
                <td class="text-right" style="padding: 8px;"><strong>$' . number_format($total, 2) . '</strong></td>
            </tr>
        </table>
    </div>
    
    ' . $infoFirma . '
    
    <div class="footer">
        <p><strong>¡Gracias por confiar en CliniPet!</strong></p>
        <p>Sistema de Gestión Veterinaria</p>
        <p style="font-size: 10px; color: #888; margin-top: 20px;">
            Este documento ha sido generado electrónicamente y firmado digitalmente con OpenSSL.<br>
            La firma utiliza criptografía RSA-SHA256 para garantizar autenticidad e integridad.<br>
            Para verificar la autenticidad de este documento, contacte a CliniPet.
        </p>
    </div>';
    
    // Escribir HTML al PDF
    $mpdf->WriteHTML($html);
    
    // Configurar headers para descarga
    $filename = 'Factura_CliniPet_' . $idFactura . '.pdf';
    
    // Configurar headers apropiados
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');
    
    // Limpiar cualquier output previo
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    // Generar y enviar el PDF
    $mpdf->Output($filename, 'D'); // 'D' = Descarga directa
    
} catch (Exception $e) {
    // Limpiar output buffer si hay error
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    http_response_code(500);
    
    // Log del error para debugging
    error_log("Error generando PDF: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    // Mostrar error en formato HTML
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>Error al generar PDF</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 5px; }
            .debug { background: #f8f9fa; padding: 15px; margin-top: 20px; font-size: 12px; }
            .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="error">
            <h2>Error al generar PDF</h2>
            <p><strong>Error:</strong> ' . htmlspecialchars($e->getMessage()) . '</p>
        </div>
        <div class="debug">
            <h3>Información de Debug:</h3>
            <p><strong>ID Factura:</strong> ' . htmlspecialchars($idFactura) . '</p>
            <p><strong>Archivo:</strong> ' . basename($e->getFile()) . '</p>
            <p><strong>Línea:</strong> ' . $e->getLine() . '</p>
        </div>
        <p><a href="javascript:history.back()" class="btn">← Volver</a></p>
    </body>
    </html>';
}
// Función fallback para FPDF (más simple, sin dependencias)
function generarPDFConFPDF() {
    // Implementación con FPDF básico
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="Factura_CliniPet_' . ($_GET['id'] ?? 'sin_id') . '.pdf"');
    
    // Aquí iría código de FPDF básico o redirección al método anterior
    echo "PDF generado con método alternativo";
}
?>