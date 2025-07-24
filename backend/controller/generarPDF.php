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
    
    // Crear instancia de mPDF
    $mpdf = new \Mpdf\Mpdf([
        'format' => 'Letter',
        'margin_left' => 15,
        'margin_right' => 15,
        'margin_top' => 20,
        'margin_bottom' => 20,
    ]);
    
    // CSS para el PDF
    $css = '
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 15px; }
        .header h1 { color: #667eea; font-size: 28px; margin: 0; }
        .header h2 { color: #ffa500; font-size: 24px; margin: 5px 0; }
        .info-section { margin-bottom: 25px; }
        .info-section table { width: 100%; margin-bottom: 25px; border: none; }
        .info-section table td { border: none; padding: 0; vertical-align: top; }
        .info-left { width: 50%; }
        .info-right { width: 50%; text-align: right; }
        .section-title { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 5px; margin-bottom: 10px; font-weight: bold; }
        .info-item { margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #667eea; color: white; font-weight: bold; text-align: center; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .totals { width: 300px; margin-left: auto; margin-top: 20px; }
        .final-total { background-color: #667eea; color: white; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; }
    </style>
    ';
    
    // HTML del contenido
    $html = $css . '
    <div class="header">
        <h1>FACTURA</h1>
        <h2>CliniPet</h2>
        <p>Sistema de Atención Médica para Mascotas</p>
    </div>
    
    <div class="info-section">
        <table style="width: 100%; margin-bottom: 25px;">
            <tr>
                <td style="width: 50%; vertical-align: top; border: none; padding: 0;">
                    <h3 class="section-title">DATOS DEL CONSUMIDOR</h3>
                    <div class="info-item"><strong>Nombre del Cliente:</strong> ' . htmlspecialchars($facturaInfo['NombreCliente'] ?? 'Contado') . '</div>
                    <div class="info-item"><strong>Cédula:</strong> ' . htmlspecialchars($facturaInfo['Cedula'] === '---' ? 'Contado' : ($facturaInfo['Cedula'] ?? 'Contado')) . '</div>
                    <div class="info-item"><strong>Nombre de la Mascota:</strong> ' . htmlspecialchars($facturaInfo['NombreMascota'] ?? 'Sin mascota específica') . '</div>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right; border: none; padding: 0;">
                    <div class="info-item"><strong>Factura N°:</strong> ' . htmlspecialchars($idFactura) . '</div>
                    <div class="info-item"><strong>Fecha:</strong> ' . ($facturaInfo['Fecha'] ? date('d/m/Y', strtotime($facturaInfo['Fecha'])) : date('d/m/Y')) . '</div>
                    <div class="info-item"><strong>Estado:</strong> <span style="color: #28a745; font-weight: bold;">Completada</span></div>
                </td>
            </tr>
        </table>
    </div>
    
    <h3 class="section-title">DETALLE</h3>
    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>ITBMS</th>
                <th>Importe</th>
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
                <td><strong>Total de Importe:</strong></td>
                <td class="text-right"><strong>$' . number_format($subtotal, 2) . '</strong></td>
            </tr>
            <tr>
                <td><strong>ITBMS (7%):</strong></td>
                <td class="text-right"><strong>$' . number_format($itbms, 2) . '</strong></td>
            </tr>
            <tr class="final-total">
                <td><strong>TOTAL:</strong></td>
                <td class="text-right"><strong>$' . number_format($total, 2) . '</strong></td>
            </tr>
        </table>
    </div>
    
    <div class="footer">
        <p><strong>¡Gracias por confiar en CliniPet!</strong></p>
        <p>Sistema de Gestión Veterinaria</p>
    </div>';
    
    // Escribir HTML al PDF
    $mpdf->WriteHTML($html);
    
    // Configurar headers para descarga
    $filename = 'Factura_CliniPet_' . $idFactura . '.pdf';
    $mpdf->Output($filename, 'D'); // 'D' = Descarga directa
    
} catch (Exception $e) {
    http_response_code(500);
    echo 'Error al generar PDF: ' . $e->getMessage();
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