// Servicio para generar PDFs de formularios de posventa
import puppeteer from 'puppeteer';
import { supabase } from '../supabaseClient.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PosventaPDFService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async obtenerDatosFormulario(formId) {
    try {
      // Obtener datos del formulario
      const { data: form, error: formError } = await supabase
        .from('vivienda_postventa_form')
        .select(`
          *,
          viviendas (
            id_vivienda,
            direccion,
            tipo_vivienda,
            fecha_entrega,
            proyecto (
              nombre,
              ubicacion
            )
          ),
          usuarios!beneficiario_uid (
            nombre,
            email,
            rut,
            direccion
          )
        `)
        .eq('id', formId)
        .single();

      if (formError) throw formError;

      // Obtener items del formulario
      const { data: items, error: itemsError } = await supabase
        .from('vivienda_postventa_item')
        .select('*')
        .eq('form_id', formId)
        .order('orden');

      if (itemsError) throw itemsError;

      return { form, items };
    } catch (error) {
      console.error('Error obteniendo datos del formulario:', error);
      throw error;
    }
  }

  generarHTMLFormulario(form, items) {
    const fecha = new Date(form.fecha_enviada || form.fecha_creada).toLocaleDateString('es-CL');
    const fechaRevision = form.fecha_revisada ? 
      new Date(form.fecha_revisada).toLocaleDateString('es-CL') : 'Pendiente';

    // Agrupar items por categoría
    const itemsPorCategoria = items.reduce((acc, item) => {
      if (!acc[item.categoria]) acc[item.categoria] = [];
      acc[item.categoria].push(item);
      return acc;
    }, {});

    const resumenItems = {
      total: items.length,
      correctos: items.filter(i => i.ok).length,
      conProblemas: items.filter(i => !i.ok).length
    };

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formulario de Posventa - ${form.usuarios.nombre}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        
        .header .subtitle {
            margin-top: 10px;
            font-size: 16px;
            opacity: 0.9;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        
        .info-section h2 {
            margin-top: 0;
            color: #1e40af;
            font-size: 18px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .info-label {
            font-weight: bold;
            color: #475569;
        }
        
        .info-value {
            color: #1e293b;
        }
        
        .resumen {
            background: #ecfdf5;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .resumen h2 {
            color: #047857;
            margin-top: 0;
            text-align: center;
        }
        
        .resumen-stats {
            display: flex;
            justify-content: space-around;
            text-align: center;
        }
        
        .stat-item {
            flex: 1;
        }
        
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            display: block;
        }
        
        .stat-number.ok { color: #059669; }
        .stat-number.problems { color: #dc2626; }
        .stat-number.total { color: #2563eb; }
        
        .categoria {
            margin-bottom: 30px;
            break-inside: avoid;
        }
        
        .categoria h3 {
            background: #2563eb;
            color: white;
            padding: 12px 20px;
            margin: 0 0 15px 0;
            border-radius: 6px;
            font-size: 16px;
        }
        
        .item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .item-nombre {
            font-weight: bold;
            color: #1e293b;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-ok {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-problema {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .item-comentario {
            margin-top: 8px;
            padding: 8px;
            background: #f1f5f9;
            border-radius: 4px;
            font-style: italic;
            color: #475569;
        }
        
        .severidad {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 10px;
        }
        
        .severidad.menor { background: #fef3c7; color: #92400e; }
        .severidad.media { background: #fed7aa; color: #c2410c; }
        .severidad.mayor { background: #fecaca; color: #dc2626; }
        
        .fotos-section {
            margin-top: 10px;
        }
        
        .fotos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 10px;
            margin-top: 8px;
        }
        
        .foto-item {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 8px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        .footer {
            margin-top: 40px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            text-align: center;
            color: #64748b;
        }
        
        @media print {
            body { margin: 0; }
            .header { break-inside: avoid; }
            .categoria { break-inside: avoid; }
            .item { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Formulario de Posventa</h1>
        <div class="subtitle">TECHO - Plataforma de Gestión de Viviendas</div>
    </div>

    <div class="info-grid">
        <div class="info-section">
            <h2>👤 Datos del Beneficiario</h2>
            <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">${form.usuarios.nombre}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${form.usuarios.email}</span>
            </div>
            <div class="info-row">
                <span class="info-label">RUT:</span>
                <span class="info-value">${form.usuarios.rut || 'No registrado'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Dirección:</span>
                <span class="info-value">${form.usuarios.direccion || 'No registrada'}</span>
            </div>
        </div>

        <div class="info-section">
            <h2>🏠 Datos de la Vivienda</h2>
            <div class="info-row">
                <span class="info-label">ID:</span>
                <span class="info-value">${form.viviendas.id_vivienda}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Dirección:</span>
                <span class="info-value">${form.viviendas.direccion}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tipo:</span>
                <span class="info-value">${form.viviendas.tipo_vivienda || 'No especificado'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Proyecto:</span>
                <span class="info-value">${form.viviendas.proyecto?.nombre || 'No asignado'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Fecha Entrega:</span>
                <span class="info-value">${form.viviendas.fecha_entrega || 'No registrada'}</span>
            </div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-section">
            <h2>📅 Datos del Formulario</h2>
            <div class="info-row">
                <span class="info-label">ID Formulario:</span>
                <span class="info-value">#${form.id}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Estado:</span>
                <span class="info-value">${form.estado.toUpperCase()}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Fecha Creación:</span>
                <span class="info-value">${new Date(form.fecha_creada).toLocaleDateString('es-CL')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Fecha Envío:</span>
                <span class="info-value">${fecha}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Fecha Revisión:</span>
                <span class="info-value">${fechaRevision}</span>
            </div>
        </div>

        <div class="info-section">
            <h2>📊 Template Utilizado</h2>
            <div class="info-row">
                <span class="info-label">Versión Template:</span>
                <span class="info-value">${form.template_version || 'No especificada'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Items No OK:</span>
                <span class="info-value">${form.items_no_ok_count}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Observaciones:</span>
                <span class="info-value">${form.observaciones_count}</span>
            </div>
        </div>
    </div>

    <div class="resumen">
        <h2>📈 Resumen del Formulario</h2>
        <div class="resumen-stats">
            <div class="stat-item">
                <span class="stat-number total">${resumenItems.total}</span>
                <div>Total Items</div>
            </div>
            <div class="stat-item">
                <span class="stat-number ok">${resumenItems.correctos}</span>
                <div>Correctos</div>
            </div>
            <div class="stat-item">
                <span class="stat-number problems">${resumenItems.conProblemas}</span>
                <div>Con Problemas</div>
            </div>
        </div>
    </div>

    ${Object.entries(itemsPorCategoria).map(([categoria, itemsCategoria]) => `
    <div class="categoria">
        <h3>🔧 ${categoria}</h3>
        ${itemsCategoria.map(item => `
        <div class="item">
            <div class="item-header">
                <span class="item-nombre">${item.item}</span>
                <div>
                    <span class="status-badge ${item.ok ? 'status-ok' : 'status-problema'}">
                        ${item.ok ? '✅ OK' : '❌ Problema'}
                    </span>
                    ${item.severidad ? `<span class="severidad ${item.severidad}">${item.severidad.toUpperCase()}</span>` : ''}
                </div>
            </div>
            ${item.comentario ? `<div class="item-comentario">💬 ${item.comentario}</div>` : ''}
            ${item.fotos_json && Array.isArray(item.fotos_json) && item.fotos_json.length > 0 ? `
            <div class="fotos-section">
                <strong>📸 Fotos adjuntas:</strong>
                <div class="fotos-grid">
                    ${item.fotos_json.map((foto, index) => `
                    <div class="foto-item">📷 Foto ${index + 1}</div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            ${item.crear_incidencia ? `
            <div style="margin-top: 8px; font-size: 12px; color: #7c3aed;">
                🎯 Se creará incidencia automáticamente
            </div>
            ` : ''}
        </div>
        `).join('')}
    </div>
    `).join('')}

    <div class="footer">
        <p><strong>TECHO - Construyendo dignidad a través de la vivienda</strong></p>
        <p>Documento generado automáticamente el ${new Date().toLocaleString('es-CL')}</p>
    </div>
</body>
</html>`;
  }

  async generarPDF(formId) {
    let page = null;
    let browser = null;
    try {
      console.log(`🔄 Obteniendo datos del formulario ${formId}...`);
      // Obtener datos
      const { form, items } = await this.obtenerDatosFormulario(formId);
      
      console.log(`🔄 Generando HTML para formulario ${formId}...`);
      // Generar HTML
      const html = this.generarHTMLFormulario(form, items);
      
      console.log(`🔄 Inicializando browser para formulario ${formId}...`);
      // Crear PDF - Usar nueva instancia del browser cada vez para mayor estabilidad
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu'
        ]
      });
      
      page = await browser.newPage();
      
      console.log(`🔄 Configurando contenido HTML para formulario ${formId}...`);
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      // Asegurar estilos consistentes para PDF
      await page.emulateMediaType('screen');
      
      console.log(`🔄 Generando PDF para formulario ${formId}...`);
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      // Generar nombre del archivo
      const fecha = new Date().toISOString().split('T')[0];
      const filename = `posventa_${form.id}_${form.usuarios.nombre.replace(/\s+/g, '_')}_${fecha}.pdf`;
      
      console.log(`✅ PDF generado exitosamente: ${filename}`);
      
      return {
        buffer: pdfBuffer,
        filename,
        form,
        items
      };
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      throw error;
    } finally {
      // Cerrar página y browser siempre
      try {
        if (page) await page.close();
        if (browser) await browser.close();
      } catch (cleanupError) {
        console.error('Error cerrando browser:', cleanupError);
      }
    }
  }

  async guardarPDFEnSupabase(formId, pdfBuffer, filename) {
    try {
      // Subir PDF a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('formularios-pdf')
        .upload(`posventa/${filename}`, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Actualizar formulario con ruta del PDF
      const { data: updateData, error: updateError } = await supabase
        .from('vivienda_postventa_form')
        .update({ 
          pdf_path: uploadData.path,
          pdf_generated_at: new Date().toISOString()
        })
        .eq('id', formId);

      if (updateError) throw updateError;

      return {
        path: uploadData.path,
        url: `${process.env.SUPABASE_URL}/storage/v1/object/public/formularios-pdf/${uploadData.path}`
      };

    } catch (error) {
      console.error('Error guardando PDF en Supabase:', error);
      throw error;
    }
  }
}

export const posventaPDFService = new PosventaPDFService();
export default PosventaPDFService;