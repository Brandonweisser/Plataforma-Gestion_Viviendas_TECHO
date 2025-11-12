// Servicio para generar PDFs de formularios de posventa
import puppeteer from 'puppeteer';
import { supabase } from '../supabaseClient.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fetch from 'node-fetch';

function escapeHtmlAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

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
      const cat = item.categoria || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    const resumenItems = {
      total: items.length,
      correctos: items.filter(i => i.ok).length,
      conProblemas: items.filter(i => !i.ok).length
    };

    // Logo: usar variable de entorno si existe; si no, un SVG inline minimalista
    const logoSrc = (process.env.TECHO_LOGO_URL || '').trim() ||
      'data:image/svg+xml;base64,' + Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="220" height="60" viewBox="0 0 220 60"><rect width="220" height="60" fill="white"/><text x="0" y="42" font-family="Lato, Arial, sans-serif" font-size="36" font-weight="700" fill="#1d4ed8">TECHO</text></svg>`).toString('base64');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formulario de Posventa - ${form.usuarios.nombre}</title>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet">
    <style>
      :root{
        --text:#333;
        --muted:#777;
        --primary:#1d4ed8; /* azul */
        --primary-600:#2563eb;
        --border:#e5e7eb;
        --bg:#fafafa;
        --ok-bg:#E6F7F0;
        --ok:#067647;
        --ok-border:#22C55E;
        --err-bg:#FEEFEF;
        --err:#B91C1C;
        --err-border:#EF4444;
      }
      *{ box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        font-family: 'Lato', sans-serif;
        color: var(--text);
        margin: 0;
        padding: 24px;
        line-height: 1.55;
        background: #fff;
        padding-bottom: 80px; /* espacio para footer fijo */
      }
      .container { max-width: 940px; margin: 0 auto; }
      /* Encabezado */
      .header {
        display: flex; align-items: center; justify-content: space-between;
        gap: 16px; margin-bottom: 16px; 
        border-bottom: 2px solid var(--border);
        padding-bottom: 12px;
      }
      .logo { display:flex; align-items:center; gap: 12px; }
      .logo img { height: 44px; width: auto; display:block; }
      .title {
        text-align: right;
      }
      .title h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--primary); }
      .title .subtitle { margin-top: 4px; font-size: 12px; color: var(--muted); }

      /* KPI resumen */
      .kpi-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0 20px;
      }
      .kpi-card {
        border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; background: #f8fafc;
      }
      .kpi-card.total { background: #f5f5f5; }
      .kpi-card.ok { background: var(--ok-bg); border-color: var(--ok-border); }
      .kpi-card.err { background: var(--err-bg); border-color: var(--err-border); }
      .kpi-title { font-size: 12px; color: var(--muted); margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: .02em; }
      .kpi-value { font-size: 28px; font-weight: 700; margin: 0; }

      /* Secciones de datos */
      .section { margin-top: 18px; }
      .section h2 { font-size: 16px; color: #111827; margin: 0 0 10px 0; }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .card { border: 1px solid var(--border); border-radius: 10px; background: #fff; padding: 14px 16px; }
      .data-row { display: flex; gap: 8px; margin: 6px 0; }
      .label { min-width: 120px; color: var(--muted); }
      .value { font-weight: 700; color: #111827; }

      /* Categorías e ítems */
      .category { margin-top: 18px; break-inside: avoid; }
      .category h2 { font-size: 16px; color: #111827; margin: 0; }
      .category hr { border: none; height: 1px; background: var(--border); margin: 8px 0 6px; }
      .item-card { padding: 16px 0; border-bottom: 1px solid #eee; }
      .item-row { display:flex; align-items:center; justify-content: space-between; gap: 12px; }
      .item-name { font-weight: 700; color: #111827; }
      .item-meta { display:flex; align-items:center; gap: 8px; }
      .badge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; border: 1px solid transparent; text-transform: uppercase; }
      .badge-ok { background: var(--ok-bg); color: var(--ok); border-color: var(--ok-border); }
      .badge-problema { background: var(--err-bg); color: var(--err); border-color: var(--err-border); }
      .sev { font-size: 11px; color: #92400e; background: #fef3c7; border: 1px solid #fcd34d; padding: 2px 8px; border-radius: 999px; }
  .comment { margin-top: 8px; padding: 10px; background: #f1f5f9; color: #475569; border-radius: 8px; font-size: 12px; }
      .photos { margin-top: 10px; }
      .photos-title { font-weight: 700; font-size: 12px; color: #374151; }
      .photos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 8px; align-items: center; }
      .photo-img { width: 100%; height: auto; max-height: 180px; object-fit: contain; border: 1px solid var(--border); border-radius: 8px; background: #f8fafc; padding: 6px; box-sizing: border-box; }
      .auto-inc { margin-top: 8px; font-size: 12px; color: #7c3aed; }

      /* Footer fijo */
      .footer {
        position: fixed; left: 24px; right: 24px; bottom: 12px;
        font-size: 12px; color: #64748b; display:flex; justify-content: space-between; align-items:center;
        border-top: 1px solid var(--border); padding-top: 8px;
      }

      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .item-card { break-inside: avoid; }
        .category { break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">
          <img src="${logoSrc}" alt="TECHO"/>
        </div>
        <div class="title">
          <h1>Formulario de Posventa</h1>
          <div class="subtitle">ID Formulario: #${form.id}</div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card total">
          <div class="kpi-title">Total Items</div>
          <p class="kpi-value">${resumenItems.total}</p>
        </div>
        <div class="kpi-card ok">
          <div class="kpi-title">Correctos</div>
          <p class="kpi-value">${resumenItems.correctos}</p>
        </div>
        <div class="kpi-card err">
          <div class="kpi-title">Con Problemas</div>
          <p class="kpi-value">${resumenItems.conProblemas}</p>
        </div>
      </div>

      <!-- Datos principales -->
      <div class="section">
        <div class="grid-2">
          <div class="card">
            <h2>Datos del Beneficiario</h2>
            <div class="data-row"><span class="label">Nombre:</span><span class="value">${form.usuarios.nombre}</span></div>
            <div class="data-row"><span class="label">Email:</span><span class="value">${form.usuarios.email}</span></div>
            <div class="data-row"><span class="label">RUT:</span><span class="value">${form.usuarios.rut || 'No registrado'}</span></div>
            <div class="data-row"><span class="label">Dirección:</span><span class="value">${form.usuarios.direccion || 'No registrada'}</span></div>
          </div>
          <div class="card">
            <h2>Datos de la Vivienda</h2>
            <div class="data-row"><span class="label">ID Vivienda:</span><span class="value">${form.viviendas.id_vivienda}</span></div>
            <div class="data-row"><span class="label">Dirección:</span><span class="value">${form.viviendas.direccion}</span></div>
            <div class="data-row"><span class="label">Tipo:</span><span class="value">${form.viviendas.tipo_vivienda || 'No especificado'}</span></div>
            <div class="data-row"><span class="label">Proyecto:</span><span class="value">${form.viviendas.proyecto?.nombre || 'No asignado'}</span></div>
            <div class="data-row"><span class="label">Fecha Entrega:</span><span class="value">${form.viviendas.fecha_entrega || 'No registrada'}</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="card">
          <h2>Datos del Formulario</h2>
          <div class="grid-2">
            <div>
              <div class="data-row"><span class="label">Estado:</span><span class="value">${(form.estado || '').toString().toUpperCase()}</span></div>
              <div class="data-row"><span class="label">Fecha Creación:</span><span class="value">${new Date(form.fecha_creada).toLocaleDateString('es-CL')}</span></div>
              <div class="data-row"><span class="label">Fecha Envío:</span><span class="value">${fecha}</span></div>
              <div class="data-row"><span class="label">Fecha Revisión:</span><span class="value">${fechaRevision}</span></div>
            </div>
            <div>
              <div class="data-row"><span class="label">Versión Template:</span><span class="value">${form.template_version || 'No especificada'}</span></div>
              <div class="data-row"><span class="label">Items No OK:</span><span class="value">${form.items_no_ok_count ?? resumenItems.conProblemas}</span></div>
              <div class="data-row"><span class="label">Observaciones:</span><span class="value">${form.observaciones_count ?? 0}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ítems por categoría -->
      ${Object.entries(itemsPorCategoria).map(([categoria, itemsCategoria]) => `
        <div class="category">
          <h2>${categoria}</h2>
          <hr/>
          ${itemsCategoria.map(item => `
            <div class="item-card">
              <div class="item-row">
                <div class="item-name">${item.item}</div>
                <div class="item-meta">
                  <span class="badge ${item.ok ? 'badge-ok' : 'badge-problema'}">${item.ok ? 'OK' : 'PROBLEMA'}</span>
                  ${item.severidad ? `<span class="sev">${String(item.severidad).toUpperCase()}</span>` : ''}
                </div>
              </div>
              ${item.comentario ? `<div class="comment">${item.comentario}</div>` : ''}
              ${(item.fotos_markup && item.fotos_markup.length > 0) ? `
                <div class="photos">
                  <div class="photos-title">Fotos adjuntas</div>
                  <div class="photos-grid">
                    ${item.fotos_markup}
                  </div>
                </div>
              ` : ''}
              ${item.crear_incidencia ? `<div class="auto-inc">Se creará incidencia automáticamente</div>` : ''}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <div>TECHO - Construyendo dignidad a través de la vivienda</div>
      <div>Documento generado el ${new Date().toLocaleDateString('es-CL')}</div>
    </div>
  </body>
  </html>`;
  }

  async _prepareFotos(items) {
    const bucket = process.env.POSTVENTA_BUCKET || 'posventa';
    const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const publicBase = supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/${bucket}/`
      : '';

    const toAbsoluteUrl = (value) => {
      if (!value) return null;
      const url = String(value);
      if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
      if (publicBase) return publicBase + url.replace(/^\/+/, '');
      return url;
    };

    const prepared = [];

    for (const item of items || []) {
      let fotos = [];
      try {
        if (Array.isArray(item.fotos_json)) fotos = item.fotos_json;
        else if (typeof item.fotos_json === 'string') fotos = JSON.parse(item.fotos_json || '[]');
      } catch (_) {
        fotos = [];
      }

      const absoluteUrls = fotos.map(toAbsoluteUrl).filter(Boolean).slice(0, 15);
      const inline = [];

      for (const url of absoluteUrls) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`fetch status ${response.status}`);
          const mime = response.headers.get('content-type') || 'image/jpeg';
          const buffer = Buffer.from(await response.arrayBuffer());
          inline.push(`data:${mime};base64,${buffer.toString('base64')}`);
        } catch (error) {
          console.warn('No se pudo incrustar foto de posventa, se usará URL directa:', error?.message || error);
          inline.push(url);
        }
      }

      const fotosMarkup = inline.map(src => `<img class="photo-img" src="${escapeHtmlAttr(src)}" alt="Foto" />`).join('');
      prepared.push({ ...item, fotos_inline: inline, fotos_markup: fotosMarkup });
    }

    return prepared;
  }

  async generarPDF(formId) {
    let page = null;
    let browser = null;
    try {
      console.log(`🔄 Obteniendo datos del formulario ${formId}...`);
      // Obtener datos
  const { form, items } = await this.obtenerDatosFormulario(formId);

  const itemsPrepared = await this._prepareFotos(items);

  console.log(`🔄 Generando HTML para formulario ${formId}...`);
  // Generar HTML
  const html = this.generarHTMLFormulario(form, itemsPrepared);
      
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
      await page.setContent(html, { waitUntil: 'networkidle0' });
      try {
        await page.evaluate(async () => {
          const images = Array.from(document.images || []);
          await Promise.all(images.map(img => img.decode().catch(() => {})));
        });
      } catch (_) {
        // Continuar aunque la decodificación falle
      }
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