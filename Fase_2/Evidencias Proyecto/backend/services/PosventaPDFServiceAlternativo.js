// Servicio alternativo para generar PDFs usando html-pdf-node
import htmlPdf from 'html-pdf-node';
import { supabase } from '../supabaseClient.js';

class PosventaPDFServiceAlternativo {
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
    <title>Formulario de Posventa - ${form.id}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .content { padding: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { background: #f3f4f6; padding: 10px; font-weight: bold; color: #374151; border-left: 4px solid #2563eb; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
        .info-item { padding: 10px; background: #f9fafb; border-radius: 5px; }
        .info-label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
        .info-value { font-size: 14px; margin-top: 3px; }
        .resumen { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .resumen-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; }
        .resumen-item { padding: 10px; }
        .resumen-number { font-size: 24px; font-weight: bold; }
        .resumen-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .correctos { color: #059669; }
        .problemas { color: #dc2626; }
        .categoria { margin-bottom: 20px; page-break-inside: avoid; }
        .categoria-titulo { background: #e5e7eb; padding: 8px 12px; font-weight: bold; margin-bottom: 10px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .items-table th, .items-table td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
        .items-table th { background: #f9fafb; font-weight: bold; }
        .status-ok { color: #059669; font-weight: bold; }
        .status-no-ok { color: #dc2626; font-weight: bold; }
        .observacion { font-style: italic; color: #6b7280; max-width: 200px; word-wrap: break-word; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FORMULARIO DE POSVENTA</h1>
        <p>Inspección de Vivienda - Formulario #${form.id}</p>
    </div>

    <div class="content">
        <!-- Información General -->
        <div class="section">
            <div class="section-title">INFORMACIÓN GENERAL</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Beneficiario</div>
                    <div class="info-value">${form.usuarios.nombre}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${form.usuarios.email}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">RUT</div>
                    <div class="info-value">${form.usuarios.rut || 'No disponible'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fecha de Inspección</div>
                    <div class="info-value">${fecha}</div>
                </div>
            </div>
        </div>

        <!-- Información de la Vivienda -->
        <div class="section">
            <div class="section-title">INFORMACIÓN DE LA VIVIENDA</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Dirección</div>
                    <div class="info-value">${form.viviendas.direccion}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tipo de Vivienda</div>
                    <div class="info-value">${form.viviendas.tipo_vivienda || 'No especificado'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Proyecto</div>
                    <div class="info-value">${form.viviendas.proyecto?.nombre || 'No especificado'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Ubicación del Proyecto</div>
                    <div class="info-value">${form.viviendas.proyecto?.ubicacion || 'No especificado'}</div>
                </div>
            </div>
        </div>

        <!-- Resumen de Inspección -->
        <div class="resumen">
            <div class="section-title" style="background: transparent; padding: 0 0 15px 0; border: none;">RESUMEN DE INSPECCIÓN</div>
            <div class="resumen-grid">
                <div class="resumen-item">
                    <div class="resumen-number">${resumenItems.total}</div>
                    <div class="resumen-label">Total Items</div>
                </div>
                <div class="resumen-item">
                    <div class="resumen-number correctos">${resumenItems.correctos}</div>
                    <div class="resumen-label">En Buen Estado</div>
                </div>
                <div class="resumen-item">
                    <div class="resumen-number problemas">${resumenItems.conProblemas}</div>
                    <div class="resumen-label">Con Problemas</div>
                </div>
            </div>
        </div>

        <!-- Detalle de Items por Categoría -->
        <div class="section">
            <div class="section-title">DETALLE DE INSPECCIÓN POR CATEGORÍAS</div>
            ${Object.entries(itemsPorCategoria).map(([categoria, categoriaItems]) => `
                <div class="categoria">
                    <div class="categoria-titulo">${categoria}</div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Estado</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categoriaItems.map(item => `
                                <tr>
                                    <td>${item.nombre}</td>
                                    <td class="${item.ok ? 'status-ok' : 'status-no-ok'}">
                                        ${item.ok ? '✓ CORRECTO' : '✗ PROBLEMA'}
                                    </td>
                                    <td class="observacion">${item.observacion || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}
        </div>

        <!-- Estado del Formulario -->
        <div class="section">
            <div class="section-title">ESTADO DEL FORMULARIO</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Estado Actual</div>
                    <div class="info-value">${form.estado.toUpperCase()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fecha de Revisión</div>
                    <div class="info-value">${fechaRevision}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Documento generado automáticamente por el Sistema de Gestión de Viviendas TECHO</p>
        <p>Fecha de generación: ${new Date().toLocaleDateString('es-CL')} - ${new Date().toLocaleTimeString('es-CL')}</p>
    </div>
</body>
</html>
    `;
  }

  async generarPDF(formId) {
    try {
      console.log(`🔄 Obteniendo datos del formulario ${formId}...`);
      const { form, items } = await this.obtenerDatosFormulario(formId);
      
      console.log(`🔄 Generando HTML para formulario ${formId}...`);
      const html = this.generarHTMLFormulario(form, items);
      
      console.log(`🔄 Generando PDF con html-pdf-node...`);
      
      const options = { 
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      };

      const file = { content: html };
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      
      // Generar nombre del archivo (sin espacios ni caracteres especiales)
      const fecha = new Date().toISOString().split('T')[0];
      const nombreLimpio = form.usuarios.nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-zA-Z0-9]/g, '_')   // Reemplazar caracteres especiales con _
        .replace(/_+/g, '_')             // Reemplazar múltiples _ con uno solo
        .replace(/^_|_$/g, '');          // Remover _ del inicio y final
      const filename = `posventa_${form.id}_${nombreLimpio}_${fecha}.pdf`;
      
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
    }
  }

  async guardarPDFEnSupabase(formId, pdfBuffer, filename) {
    try {
      // Generar path limpio para Supabase
      const cleanPath = `posventa/${filename}`.replace(/[^a-zA-Z0-9\/._-]/g, '_');
      
      // Subir PDF a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('formularios-pdf')
        .upload(cleanPath, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true
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

export const posventaPDFServiceAlternativo = new PosventaPDFServiceAlternativo();
export default PosventaPDFServiceAlternativo;