// generarQR.js - Generador de códigos QR para mascotas

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 generarQR.js cargado correctamente');
    
    // Variables globales
    const BASE_URL = '/SemestralCopy/backend/controller/controller.php';
    let currentMascotaData = null;
    
    // Referencias a elementos del DOM
    const searchForm = document.getElementById('searchForm');
    const searchType = document.getElementById('searchType');
    const searchValue = document.getElementById('searchValue');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsContainer = document.getElementById('resultsContainer');
    const mascotaInfo = document.getElementById('mascotaInfo');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const responseMessage = document.getElementById('responseMessage');
    const qrCanvas = document.getElementById('qrCanvas');
    const downloadPDF = document.getElementById('downloadPDF');
    const downloadPNG = document.getElementById('downloadPNG');

    // ========================================================================
    // FUNCIONES DE UTILIDAD
    // ========================================================================

    function showLoading(show) {
        if (loadingSpinner) {
            loadingSpinner.style.display = show ? 'block' : 'none';
        }
    }

    function showError(message) {
        if (errorText && errorMessage) {
            errorText.textContent = message;
            errorMessage.style.display = 'block';
        }
        console.error('❌ Error:', message);
    }

    function hideError() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    function hideResults() {
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    function mostrarMensaje(mensaje, tipo = 'info') {
        if (!responseMessage) return;
        
        let mensajeLimpio = mensaje;

        try {
            const jsonData = JSON.parse(mensaje);
            if (jsonData.mensaje) {
                mensajeLimpio = jsonData.mensaje;
            }
        } catch (e) {
            mensajeLimpio = mensaje;
        }

        // Limpiar caracteres especiales
        mensajeLimpio = mensajeLimpio.replace(/^Error del servidor: \d+ - /, '');
        mensajeLimpio = mensajeLimpio.replace(/^❌\s*/, '');
        mensajeLimpio = mensajeLimpio.replace(/^✅\s*/, '');
        mensajeLimpio = mensajeLimpio.replace(/^Error:\s*/, '');

        responseMessage.className = `alert mt-3 text-center alert-${tipo}`;
        const icono = tipo === 'success' ? '✅' : '❌';
        responseMessage.textContent = `${icono} ${mensajeLimpio}`;
        responseMessage.style.display = 'block';

        if (tipo === 'success') {
            setTimeout(() => {
                responseMessage.style.display = 'none';
            }, 5000);
        }
    }

    // ========================================================================
    // FUNCIONES DE BÚSQUEDA
    // ========================================================================

    async function buscarMascota() {
        const searchTypeValue = searchType.value;
        const searchValueInput = searchValue.value.trim();
        
        if (!searchValueInput) {
            showError('Por favor ingrese un valor para buscar');
            searchValue.focus();
            return;
        }

        console.log(`🔍 Buscando mascota por ${searchTypeValue}: ${searchValueInput}`);

        showLoading(true);
        hideError();
        hideResults();

        try {
            let url;
            if (searchTypeValue === 'id') {
                url = `${BASE_URL}?accion=consultarMascota&id=${encodeURIComponent(searchValueInput)}`;
            } else {
                url = `${BASE_URL}?accion=consultarMascota&cedula=${encodeURIComponent(searchValueInput)}`;
            }

            console.log('📡 URL de búsqueda:', url);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('📋 Datos recibidos:', data);

            if (data.estado === 'ok' && data.mascotas && data.mascotas.length > 0) {
                displayResults(data);
                mostrarMensaje('Mascota encontrada correctamente', 'success');
            } else {
                throw new Error(data.mensaje || 'No se encontraron mascotas con ese criterio');
            }

        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            showError(error.message);
            mostrarMensaje(error.message, 'danger');
        } finally {
            showLoading(false);
        }
    }

    // ========================================================================
    // FUNCIONES DE DISPLAY
    // ========================================================================

    function displayResults(data) {
        currentMascotaData = data;
        const mascota = data.mascotas[0];
        const cliente = data.cliente;

        console.log('📋 Mostrando resultados para:', mascota.NombreMascota);

        // Mostrar información de la mascota
        if (mascotaInfo) {
            mascotaInfo.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h5 class="text-primary mb-3">
                            <i class="fas fa-paw me-2"></i>
                            Información de la Mascota
                        </h5>
                        <p><strong>ID:</strong> ${mascota.IDMascota}</p>
                        <p><strong>Nombre:</strong> ${mascota.NombreMascota}</p>
                        <p><strong>Especie:</strong> ${mascota.Especie}</p>
                        <p><strong>Raza:</strong> ${mascota.RazaMascota || 'No especificada'}</p>
                        <p><strong>Edad:</strong> ${mascota.Edad} años</p>
                        <p><strong>Peso:</strong> ${mascota.Peso} lb</p>
                        <p><strong>Género:</strong> ${mascota.Genero}</p>
                    </div>
                    <div class="col-md-6">
                        <h5 class="text-primary mb-3">
                            <i class="fas fa-user me-2"></i>
                            Información del Cliente
                        </h5>
                        <p><strong>Nombre:</strong> ${cliente.Nombre}</p>
                        <p><strong>Cédula:</strong> ${cliente.Cedula}</p>
                        <p><strong>Teléfono:</strong> ${cliente.Telefono || 'No disponible'}</p>
                        <p><strong>Email:</strong> ${cliente.Email || 'No disponible'}</p>
                    </div>
                </div>
            `;
        }

        // Generar QR
        generateQR(mascota);
        
        // Mostrar resultados con animación
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
            resultsContainer.classList.add('fade-in');
            
            // Scroll suave hacia los resultados
            setTimeout(() => {
                resultsContainer.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 300);
        }
    }

    // ========================================================================
    // FUNCIONES DE GENERACIÓN QR
    // ========================================================================

    function generateQR(mascota) {
        if (!qrCanvas) {
            console.error('❌ Canvas QR no encontrado');
            return;
        }

        // Crear datos estructurados para el QR
        const qrData = {
            tipo: 'mascota_veterinaria',
            id: mascota.IDMascota,
            nombre: mascota.NombreMascota,
            especie: mascota.Especie,
            raza: mascota.RazaMascota || 'No especificada',
            edad: mascota.Edad,
            peso: mascota.Peso,
            genero: mascota.Genero,
            cliente: {
                nombre: currentMascotaData.cliente.Nombre,
                cedula: currentMascotaData.cliente.Cedula,
                telefono: currentMascotaData.cliente.Telefono || '',
                email: currentMascotaData.cliente.Email || ''
            },
            timestamp: new Date().toISOString(),
            url: window.location.origin + '/consultarMascota.html?id=' + mascota.IDMascota
        };

        // Convertir a JSON string
        const qrString = JSON.stringify(qrData);

        console.log('🔧 Generando QR con datos:', qrData);

        try {
            // Generar QR usando QRious
            const qr = new QRious({
                element: qrCanvas,
                value: qrString,
                size: 300,
                background: 'white',
                foreground: '#333333',
                level: 'M',
                padding: 10
            });

            console.log('✅ QR generado exitosamente');
        } catch (error) {
            console.error('❌ Error generando QR:', error);
            showError('Error al generar el código QR');
        }
    }

    // ========================================================================
    // FUNCIONES DE DESCARGA
    // ========================================================================

    function downloadAsPNG() {
        if (!qrCanvas || !currentMascotaData) {
            showError('No hay código QR para descargar');
            return;
        }

        try {
            const mascota = currentMascotaData.mascotas[0];
            const link = document.createElement('a');
            link.download = `QR_${mascota.NombreMascota}_${mascota.IDMascota}.png`;
            link.href = qrCanvas.toDataURL('image/png');
            
            // Simular click para descargar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ PNG descargado:', link.download);
            mostrarMensaje('Imagen PNG descargada correctamente', 'success');
        } catch (error) {
            console.error('❌ Error descargando PNG:', error);
            showError('Error al descargar la imagen PNG');
        }
    }

    function downloadAsPDF() {
        if (!qrCanvas || !currentMascotaData) {
            showError('No hay código QR para descargar');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            const mascota = currentMascotaData.mascotas[0];
            const cliente = currentMascotaData.cliente;

            // Configurar fuentes y colores
            pdf.setFont('helvetica');

            // Título principal
            pdf.setFontSize(20);
            pdf.setTextColor(102, 126, 234);
            pdf.text('Código QR - Información de Mascota', 20, 30);

            // Línea decorativa
            pdf.setDrawColor(102, 126, 234);
            pdf.setLineWidth(1);
            pdf.line(20, 35, 190, 35);

            // Información de la mascota
            pdf.setFontSize(14);
            pdf.setTextColor(102, 126, 234);
            pdf.text('INFORMACIÓN DE LA MASCOTA:', 20, 50);
            
            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);
            let y = 60;
            
            const mascotaData = [
                `ID: ${mascota.IDMascota}`,
                `Nombre: ${mascota.NombreMascota}`,
                `Especie: ${mascota.Especie}`,
                `Raza: ${mascota.RazaMascota || 'No especificada'}`,
                `Edad: ${mascota.Edad} años`,
                `Peso: ${mascota.Peso} lb`,
                `Género: ${mascota.Genero}`
            ];

            mascotaData.forEach(item => {
                pdf.text(item, 25, y);
                y += 7;
            });
            
            // Información del cliente
            y += 10;
            pdf.setFontSize(14);
            pdf.setTextColor(102, 126, 234);
            pdf.text('INFORMACIÓN DEL CLIENTE:', 20, y);
            
            y += 10;
            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);
            
            const clienteData = [
                `Nombre: ${cliente.Nombre}`,
                `Cédula: ${cliente.Cedula}`,
                `Teléfono: ${cliente.Telefono || 'No disponible'}`,
                `Email: ${cliente.Email || 'No disponible'}`
            ];

            clienteData.forEach(item => {
                pdf.text(item, 25, y);
                y += 7;
            });

            // Agregar código QR
            const imgData = qrCanvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 120, 55, 60, 60);

            // Información adicional del QR
            pdf.setFontSize(10);
            pdf.setTextColor(102, 126, 234);
            pdf.text('Código QR para acceso rápido', 125, 125);

            // Fecha de generación
            y += 20;
            pdf.setFontSize(9);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 20, y);
            
            // URL del sistema
            y += 5;
            pdf.text(`Sistema: ${window.location.origin}`, 20, y);

            // Línea final
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(20, y + 10, 190, y + 10);

            // Guardar PDF
            const fileName = `QR_${mascota.NombreMascota}_${mascota.IDMascota}.pdf`;
            pdf.save(fileName);
            
            console.log('✅ PDF generado:', fileName);
            mostrarMensaje('PDF descargado correctamente', 'success');
        } catch (error) {
            console.error('❌ Error generando PDF:', error);
            showError('Error al generar el archivo PDF');
        }
    }

    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================

    // Formulario de búsqueda
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            buscarMascota();
        });
    }

    // Cambio de tipo de búsqueda
    if (searchType) {
        searchType.addEventListener('change', function() {
            if (searchValue) {
                searchValue.value = '';
                searchValue.focus();
            }
            hideResults();
            hideError();
            
            // Cambiar placeholder según el tipo
            if (searchValue) {
                if (this.value === 'id') {
                    searchValue.placeholder = 'Ingrese ID de mascota';
                } else {
                    searchValue.placeholder = 'Ingrese cédula del cliente';
                }
            }
        });
    }

    // Input de búsqueda - buscar con Enter
    if (searchValue) {
        searchValue.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarMascota();
            }
        });

        // Limpiar errores al escribir
        searchValue.addEventListener('input', function() {
            hideError();
            this.classList.remove('is-invalid');
        });
    }

    // Botón descargar PNG
    if (downloadPNG) {
        downloadPNG.addEventListener('click', downloadAsPNG);
    }

    // Botón descargar PDF
    if (downloadPDF) {
        downloadPDF.addEventListener('click', downloadAsPDF);
    }

    // ========================================================================
    // INICIALIZACIÓN
    // ========================================================================

    function inicializar() {
        console.log('🚀 Inicializando generador QR...');
        
        // Verificar dependencias
        if (typeof QRious === 'undefined') {
            console.error('❌ QRious no está cargado');
            showError('Error: Librería QR no disponible');
            return;
        }

        if (typeof window.jspdf === 'undefined') {
            console.error('❌ jsPDF no está cargado');
            console.warn('⚠️ Funcionalidad PDF no disponible');
        }

        // Configurar placeholder inicial
        if (searchValue && searchType) {
            const initialType = searchType.value;
            if (initialType === 'id') {
                searchValue.placeholder = 'Ingrese ID de mascota';
            } else {
                searchValue.placeholder = 'Ingrese cédula del cliente';
            }
        }

        // Ocultar elementos inicialmente
        hideResults();
        hideError();
        showLoading(false);

        console.log('✅ Generador QR inicializado correctamente');
        console.log('🔧 BASE_URL configurada como:', BASE_URL);
    }

    // Ejecutar inicialización
    inicializar();

    // Función de debug para testing
    window.debugQR = function() {
        console.log('🔧 Estado actual del generador QR:');
        console.log('- BASE_URL:', BASE_URL);
        console.log('- currentMascotaData:', currentMascotaData);
        console.log('- QRious disponible:', typeof QRious !== 'undefined');
        console.log('- jsPDF disponible:', typeof window.jspdf !== 'undefined');
    };

    console.log('✅ Script generarQR.js cargado completamente');
    console.log('🔧 Función de debug disponible: window.debugQR()');
});