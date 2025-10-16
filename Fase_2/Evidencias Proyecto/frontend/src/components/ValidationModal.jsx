import React, { useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal de validación de incidencia (beneficiario).
 * Props:
 *  - open: boolean
 *  - mode: 'accept' | 'reject' | null (si se quisiera forzar uno; ahora usamos only reject)
 *  - onClose(): cerrar modal
 *  - onAccept(): Promesa -> validar conforme
 *  - onReject({ comentario, file }): Promesa -> validar no conforme (foto obligatoria)
 *  - loading: boolean indica llamada en progreso
 */
export default function ValidationModal({ open, onClose, onAccept, onReject, loading }) {
  const [tab, setTab] = useState('accept');
  const [comentario, setComentario] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => { setComentario(''); setFile(null); setError(''); setTab('accept'); };

  async function handleAccept() {
    setError('');
    try { await onAccept(); reset(); } catch(e) { setError(e.message || 'Error al validar'); }
  }

  async function handleReject() {
    setError('');
    if (!comentario.trim()) { setError('Debes ingresar un comentario.'); return; }
    if (!file) { setError('Debes adjuntar una foto obligatoriamente.'); return; }
    try { await onReject({ comentario: comentario.trim(), file }); reset(); } catch(e) { setError(e.message || 'Error al rechazar'); }
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-600 p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Validar solución</h3>
          <button className="btn-outline btn-xs" onClick={()=>{ reset(); onClose(); }} disabled={loading}>Cerrar</button>
        </div>
        <div className="flex gap-2 mb-5">
          <button
            className={`flex-1 px-3 py-2 text-sm rounded-md border transition ${tab==='accept' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
            onClick={()=>setTab('accept')}
            disabled={loading}
            type="button"
          >Estoy conforme</button>
          <button
            className={`flex-1 px-3 py-2 text-sm rounded-md border transition ${tab==='reject' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
            onClick={()=>setTab('reject')}
            disabled={loading}
            type="button"
          >No quedó resuelta</button>
        </div>
        {tab === 'accept' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">Confirmas que la incidencia fue solucionada satisfactoriamente.</p>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button className="btn-outline btn-sm" onClick={()=>{ reset(); onClose(); }} disabled={loading}>Cancelar</button>
              <button className="btn-primary btn-sm" onClick={handleAccept} disabled={loading}>Validar</button>
            </div>
          </div>
        )}
        {tab === 'reject' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Motivo del rechazo</label>
              <textarea
                className="w-full text-sm p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 resize-none h-28"
                value={comentario}
                onChange={e=>setComentario(e.target.value)}
                placeholder="Ej: Sigue existiendo filtración en el techo..."
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Foto evidencia (obligatoria)</label>
              <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)} disabled={loading} className="block w-full text-sm" />
              {file && <p className="text-xs mt-1 text-slate-500 truncate">{file.name}</p>}
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button className="btn-outline btn-sm" onClick={()=>{ reset(); onClose(); }} disabled={loading}>Cancelar</button>
              <button className="btn-primary btn-sm" onClick={handleReject} disabled={loading}>Enviar rechazo</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    typeof document !== 'undefined' ? document.body : undefined
  );
}
