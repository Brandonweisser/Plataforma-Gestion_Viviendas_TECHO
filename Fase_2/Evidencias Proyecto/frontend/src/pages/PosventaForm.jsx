import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { beneficiarioApi } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { DashboardLayout } from '../components/ui/DashboardLayout';
import { SectionPanel } from '../components/ui/SectionPanel';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { Modal } from '../components/ui/Modal';

// Este componente ahora refleja la versión "plantilla" inmutable:
// - Ya no se pueden agregar ni eliminar ítems.
// - Sólo se actualizan campos permitidos (ok, severidad, comentario, crear_incidencia).
// - Se permite subir fotos por ítem (en borrador) y visualizar miniaturas.

export default function PosventaFormPage() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formState, setFormState] = useState(null); // { form, items }
  const [localItems, setLocalItems] = useState([]); // items actuales (copiados para edición optimista)
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [openPlan, setOpenPlan] = useState(false);
  // Secciones estáticas (sin expand/collapse por categoría)

  const load = useCallback(async (autoCreate = true) => {
    setLoading(true); setError(''); if (!autoCreate) setSuccess('');
    try {
      const r = await beneficiarioApi.posventaGetForm();
      if (!r.data) {
        if (autoCreate) {
          // Intentar crear automáticamente si no existe
          try {
            await beneficiarioApi.posventaCrearForm();
            const r2 = await beneficiarioApi.posventaGetForm();
            if (r2.data) {
              setFormState(r2.data); setLocalItems(r2.data.items || []);
              // Cargar planos del template asociado (nuevo formulario)
              try {
                const pf = await beneficiarioApi.posventaListarPlanos();
                setPlanos(pf.data || []);
              } catch (_) { /* no bloquear */ }
              return;
            }
          } catch (eCreate) {
            setError(eCreate.message || 'No se pudo crear el formulario automáticamente');
          }
        }
        setFormState(null); setLocalItems([]);
      } else {
        setFormState(r.data); setLocalItems(r.data.items || []);
        try {
          const pf = await beneficiarioApi.posventaListarPlanos();
          setPlanos(pf.data || [])
        } catch (e) { /* opcional: no bloquear */ }
      }
    } catch (e) {
      setError(e.message || 'Error cargando formulario');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // (sin estado de apertura por categoría)

  // creación automática al cargar si no existe (ver load())

  function updateItem(idx, changes) {
    setLocalItems(items => items.map((it, i) => i === idx ? { ...it, ...changes } : it));
  }

  async function guardarItems() {
    if (!formState?.form?.id) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      // Enviar sólo campos permitidos + id
      const payload = localItems.map(it => ({
        id: it.id,
        ok: !!it.ok,
        severidad: it.ok ? null : (it.severidad || null),
        comentario: it.comentario || '',
        crear_incidencia: !it.ok ? (it.crear_incidencia !== false) : false
      }));
      await beneficiarioApi.posventaGuardarItems(payload);
      setSuccess('Cambios guardados');
      await load();
    } catch (e) { setError(e.message || 'No se pudo guardar'); }
    finally { setSaving(false); }
  }

  async function subirFoto(item, file) {
    if (!file) return;
    setUploadingItemId(item.id);
    setError('');
    try {
      await beneficiarioApi.posventaSubirFotoItem(item.id, file);
      await load();
    } catch (e) { setError(e.message || 'Error subiendo foto'); }
    finally { setUploadingItemId(null); }
  }

  function renderFotos(item) {
    let fotos = [];
    try {
      if (Array.isArray(item.fotos_json)) fotos = item.fotos_json;
      else if (typeof item.fotos_json === 'string') fotos = JSON.parse(item.fotos_json || '[]');
    } catch(_) {}
    if (!fotos.length) return <span className="text-slate-400">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {fotos.map((p, i) => (
          <a key={i} href={p.startsWith('http') ? p : undefined} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded overflow-hidden border border-slate-300 dark:border-slate-500">
            <img src={p.startsWith('http') ? p : `${p}`} alt="foto" className="object-cover w-full h-full" />
          </a>
        ))}
      </div>
    )
  }

  async function enviarFormulario() {
    if (!formState?.form?.id) return;
    setSending(true); setError(''); setSuccess('');
    try {
      await beneficiarioApi.posventaEnviar();
      setSuccess('Formulario enviado');
      await load();
    } catch (e) {
      setError(e.message || 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  }

  const estado = formState?.form?.estado;
  const isBorrador = estado === 'borrador';

  // Agrupar por habitación (room) si viene en los items; fallback a 'General'
  const groupedByRoom = localItems.reduce((acc, it) => {
    const room = it.room_nombre || 'General';
    acc[room] = acc[room] || [];
    acc[room].push(it);
    return acc;
  }, {});
  // Dentro de cada room, sub-agrupar por categoría para mantener orden lógico del template
  const roomKeys = Object.keys(groupedByRoom);

  return (
    <DashboardLayout
      title="Formulario Posventa"
      subtitle="Diagnóstico posterior a la entrega"
      user={user || {}}
      onLogout={() => { logout(); navigate('/'); }}
      accent="blue"
    >
      {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}
      {success && <div className="mb-4 p-3 rounded bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">{success}</div>}
      {formState && !loading && (
        <>
          <SectionPanel
            title={`Estado: ${estado}`}
            description={estado === 'borrador' ? 'Puedes editar y guardar los ítems.' : 'Formulario enviado. Pendiente revisión técnica.'}
          >
            <div className="flex flex-wrap gap-3 mb-5">
              {planos?.length ? (
                <button className="btn-outline btn-sm" onClick={() => setOpenPlan(true)}>Ver plano</button>
              ) : null}
              {isBorrador && (
                <>
                  <button className="btn-primary btn-sm" onClick={guardarItems} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
                  <button className="btn-outline btn-sm" onClick={enviarFormulario} disabled={sending || saving || !localItems.length}>{sending ? 'Enviando…' : 'Enviar formulario'}</button>
                </>
              )}
              <button className="btn-outline btn-sm" onClick={() => navigate('/beneficiario')}>Volver</button>
            </div>
            {localItems.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-sm">Sin ítems</div>
            )}
            <div className="space-y-10">
              {roomKeys.sort().map(roomName => {
                const itemsRoom = groupedByRoom[roomName];
                // subagrupa por categoría
                const groupedByCat = itemsRoom.reduce((acc, it) => { (acc[it.categoria] = acc[it.categoria] || []).push(it); return acc; }, {});
                return (
                  <div key={roomName} className="border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/50 shadow-sm">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{roomName}</h3>
                      <span className="text-[11px] text-slate-400">{itemsRoom.length} ítem(s)</span>
                    </div>
                    <div>
                      {Object.keys(groupedByCat).sort().map(cat => (
                        <div key={cat} className="">
                          <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600 bg-white/60 dark:bg-slate-700/40">{cat}</div>
                          <ul className="divide-y divide-slate-200 dark:divide-slate-600">
                            {groupedByCat[cat].map(it => {
                        const idx = localItems.findIndex(r => r.id === it.id);
                        const disabled = !isBorrador;
                        return (
                          <li key={it.id} className="flex flex-col md:flex-row md:items-stretch">
                            <div className="flex-1 p-4 flex flex-col gap-4">
                              <div className="flex items-start justify-between gap-4">
                                <p className="font-medium text-slate-700 dark:text-slate-100 text-sm">{it.item}</p>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button type="button" disabled={disabled} onClick={() => updateItem(idx, { ok: true, severidad: null })} className={`px-3 py-1 rounded text-xs font-semibold border transition ${it.ok ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'}`}>OK</button>
                                  <button type="button" disabled={disabled} onClick={() => updateItem(idx, { ok: false })} className={`px-3 py-1 rounded text-xs font-semibold border transition ${!it.ok ? 'bg-red-500 border-red-600 text-white' : 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'}`}>NO</button>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-3 gap-4">
                                {!it.ok && (
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Severidad</label>
                                    <select value={it.severidad || ''} disabled={disabled} onChange={e => updateItem(idx, { severidad: e.target.value || null })} className="rounded border border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-600 px-2 py-1 text-sm">
                                      <option value="">(n/a)</option>
                                      <option value="menor">Menor</option>
                                      <option value="media">Media</option>
                                      <option value="mayor">Mayor</option>
                                    </select>
                                  </div>
                                )}
                                <div className={`flex flex-col gap-1 ${!it.ok ? 'md:col-span-2' : 'md:col-span-3'}`}>
                                  <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Comentario</label>
                                  <textarea value={it.comentario || ''} disabled={disabled} onChange={e => updateItem(idx, { comentario: e.target.value })} className="rounded border border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-600 px-2 py-1 h-20 resize-none text-sm" placeholder="Observaciones opcionales" />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-3">
                                  <div className="flex flex-wrap items-center gap-4 text-xs">
                                    {!it.ok && (
                                      <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                                        <input type="checkbox" disabled={disabled} checked={it.crear_incidencia !== false} onChange={e => updateItem(idx, { crear_incidencia: e.target.checked })} />
                                        <span>Crear incidencia</span>
                                      </label>
                                    )}
                                    <div className="flex items-center gap-2">
                                      {renderFotos(it)}
                                      {isBorrador && (
                                        <label className="relative cursor-pointer inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                          <input type="file" className="hidden" accept="image/*" disabled={uploadingItemId === it.id} onChange={e => { const f = e.target.files?.[0]; if (f) subirFoto(it, f); e.target.value=''; }} />
                                          <PhotoIcon className="w-4 h-4" /> {uploadingItemId === it.id ? 'Subiendo...' : 'Agregar foto'}
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-8">Incidencias aún no se generan automáticamente. Esto ocurrirá en la fase de revisión técnica.</p>
          </SectionPanel>
        </>
      )}
      <PlanPreviewModal open={openPlan} onClose={() => setOpenPlan(false)} plan={planos?.[0]} />
    </DashboardLayout>
  );
}

function PlanPreviewModal({ open, onClose, plan }) {
  if (!open) return null
  const url = plan?.url || ''
  const mime = (plan?.mime || '').toLowerCase()
  const isPdf = mime.includes('pdf') || url.toLowerCase().endsWith('.pdf')
  const isImage = mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(url)
  const cadViewerUrl = url ? `https://sharecad.org/cadframe/load?url=${encodeURIComponent(url)}` : ''

  return (
    <Modal isOpen={open} onClose={onClose} maxWidth="max-w-5xl">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Plano del template</h3>
        <div className="flex items-center gap-2">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 text-sm hover:bg-slate-200">Abrir en pestaña</a>
          ) : null}
          <button onClick={onClose} className="px-3 py-1.5 rounded bg-slate-800 text-white text-sm">Cerrar</button>
        </div>
      </div>
      <div className="p-4">
        {isPdf ? (
          <iframe title="Plano PDF" src={url} className="w-full h-[80vh] border rounded" />
        ) : isImage ? (
          <div className="w-full flex items-center justify-center">
            <img src={url} alt="Plano" className="max-h-[80vh] w-auto object-contain" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-6 text-sm text-gray-700">
              No se puede previsualizar este tipo de archivo de forma nativa. Intentaremos usar un visor CAD online.
            </div>
            {cadViewerUrl ? (
              <iframe title="Plano CAD" src={cadViewerUrl} className="w-full h-[80vh] border rounded" />
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  )
}
