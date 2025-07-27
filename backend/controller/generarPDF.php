<?php
// LIMPIAR TODO OUTPUT PREVIO
ob_clean();
ob_start();
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
        'format' => 'A4',
        'margin_left' => 15,
        'margin_right' => 15,
        'margin_top' => 20,
        'margin_bottom' => 20
    ]);
    
    // CSS mejorado para el PDF
    $css = '
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .info-table { width: 100%; margin-bottom: 20px; }
        .info-table td { padding: 5px; border: none; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; text-align: center; }
        .totals { width: 300px; margin-left: auto; }
        .totals table { width: 100%; border-collapse: collapse; }
        .totals td { padding: 5px; border: 1px solid #ddd; }
        .total-final { background-color: #333; color: white; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .footer { text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>';
    
    // DATOS SEGUROS
    $nombreCliente = htmlspecialchars($facturaInfo['NombreCliente'] ?? 'Contado');
    $cedulaCliente = htmlspecialchars($facturaInfo['CedulaCliente'] === '---' ? 'Contado' : ($facturaInfo['CedulaCliente'] ?? 'Contado'));
    $nombreMascota = htmlspecialchars($facturaInfo['NombreMascota'] ?? 'Sin mascota específica');
    $fechaFactura = isset($facturaInfo['Fecha']) ? date('d/m/Y', strtotime($facturaInfo['Fecha'])) : date('d/m/Y');
    
    $subtotal = floatval($facturaInfo['subtotalf'] ?? 0);
    $itbms = floatval($facturaInfo['ITBMSFactura'] ?? 0);
    $total = floatval($facturaInfo['totalFactura'] ?? 0);
    
    // INFORMACIÓN DE FIRMA SIMPLIFICADA
    $infoFirma = '';
    if (isset($facturaInfo['FirmaDigital']) && !empty($facturaInfo['FirmaDigital'])) {
        $firmante = htmlspecialchars($facturaInfo['NombreFirmante'] ?? 'Sistema CliniPet');
        $fechaFirma = isset($facturaInfo['FechaFirma']) ? date('d/m/Y H:i:s', strtotime($facturaInfo['FechaFirma'])) : 'No disponible';
        
        $infoFirma = '
        <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
            <h4 style="margin-top: 0; color: #333;">🔐 INFORMACIÓN DE FIRMA DIGITAL</h4>
            <p><strong>Estado:</strong> ✓ Documento Firmado Digitalmente</p>
            <p><strong>Firmado por:</strong> ' . $firmante . '</p>
            <p><strong>Fecha y Hora:</strong> ' . $fechaFirma . '</p>
            <p><strong>Algoritmo:</strong> SHA-256</p>
        </div>';
    }
    
    // HTML COMPLETO
    $html = $css . '
    <div class="header">
        <h1>FACTURA</h1>
        <h2>CliniPet</h2>
        <p>Sistema de Atención Médica para Mascotas</p>
    </div>
    
    <table class="info-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <h3>DATOS DEL CONSUMIDOR</h3>
                <p><strong>Nombre:</strong> ' . $nombreCliente . '</p>
                <p><strong>Cédula:</strong> ' . $cedulaCliente . '</p>
                <p><strong>Mascota:</strong> ' . $nombreMascota . '</p>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
                <p><strong>Factura N°:</strong> ' . htmlspecialchars($idFactura) . '</p>
                <p><strong>Fecha:</strong> ' . $fechaFactura . '</p>
                <p><strong>Estado:</strong> <span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px;">Completada</span></p>
            </td>
        </tr>
    </table>
    
    <h3>DETALLE</h3>
    <table class="items-table">
        <thead>
            <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>ITBMS</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>';
        
    // ITEMS DE LA FACTURA
    foreach ($items as $item) {
        $html .= '<tr>
            <td class="text-center">' . ($item['Tipo'] === 'Producto' ? 'PROD-' : 'SERV-') . htmlspecialchars($item['IDITEM']) . '</td>
            <td>' . htmlspecialchars($item['NombreProducto']) . '</td>
            <td class="text-center">' . intval($item['CantidadVendida']) . '</td>
            <td class="text-right">$' . number_format(floatval($item['PrecioBruto']) / intval($item['CantidadVendida']), 2) . '</td>
            <td class="text-right">$' . number_format(floatval($item['ITBMSLinea']), 2) . '</td>
            <td class="text-right">$' . number_format(floatval($item['totalLinea']), 2) . '</td>
        </tr>';
    }
    
    $html .= '</tbody>
    </table>
    
    <div class="totals">
        <table>
            <tr>
                <td><strong>Subtotal:</strong></td>
                <td class="text-right"><strong>$' . number_format($subtotal, 2) . '</strong></td>
            </tr>
            <tr>
                <td><strong>ITBMS (7%):</strong></td>
                <td class="text-right"><strong>$' . number_format($itbms, 2) . '</strong></td>
            </tr>
            <tr class="total-final">
                <td><strong>TOTAL:</strong></td>
                <td class="text-right"><strong>$' . number_format($total, 2) . '</strong></td>
            </tr>
        </table>
    </div>
    
    ' . $infoFirma . '
    
    <div class="footer">
        <p><strong>¡Gracias por confiar en CliniPet!</strong></p>
        <p>Sistema de Gestión Veterinaria</p>
    </div>';
    
    // LIMPIAR BUFFER ANTES DE GENERAR PDF
    ob_end_clean();
    
    // GENERAR PDF
    $mpdf->WriteHTML($html);
    
    // HEADERS LIMPIOS
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="Factura_CliniPet_' . $idFactura . '.pdf"');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    
    // SALIDA LIMPIA
    $mpdf->Output('Factura_CliniPet_' . $idFactura . '.pdf', 'D');
    
} catch (Exception $e) {
    // LIMPIAR BUFFER EN CASO DE ERROR
    ob_end_clean();
    
    // ERROR EN HTML SIMPLE
    header('Content-Type: text/html');
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>Error PDF</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="error">
            <h2>Error al generar PDF</h2>
            <p><strong>Error:</strong> ' . htmlspecialchars($e->getMessage()) . '</p>
            <p><strong>ID Factura:</strong> ' . htmlspecialchars($idFactura) . '</p>
        </div>
        <p><a href="javascript:history.back()">← Volver</a></p>
    </body>
    </html>';
}
// Función fallback para FPDF (más simple, sin dependencias)
function generarHTMLSimple() {
    header('Content-Type: text/html');
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>Factura CliniPet</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .alert { background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>CliniPet</h1>
        </div>
        <div class="alert">
            <h3>⚠️ mPDF no disponible</h3>
            <p>Para generar PDFs, instale mPDF ejecutando:</p>
            <code>composer require mpdf/mpdf</code>
            <p>Mientras tanto, puede imprimir esta página como PDF usando Ctrl+P</p>
        </div>
    </body>
    </html>';
}
?>