import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ActionCard } from "../components/ui/ActionCard";
import { SectionPanel } from "../components/ui/SectionPanel";
import { DashboardLayout } from "../components/ui/DashboardLayout";
import CardIncidencia from "../components/CardIncidencia";
import { beneficiarioApi } from "../services/api";
import { 
  HomeModernIcon,
  WrenchScrewdriverIcon,
  UserCircleIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  BookOpenIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function HomeBeneficiario() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [vivData, setVivData] = useState(null); // { vivienda, proyecto, recepcion_activa, flags }
  const [incidencias, setIncidencias] = useState([]);
  const fileInputRef = React.useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [detailInc, setDetailInc] = useState(null);

  // Modal estado
  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ descripcion: "", categoria: "" });
  const [modalFiles, setModalFiles] = useState([]); // imágenes seleccionadas en el modal
  const [creating, setCreating] = useState(false);

  async function loadData() {
    setLoading(true); setError(""); setSuccess("");
    try {
      const v = await beneficiarioApi.vivienda();
      setVivData(v.data || null);
    } catch (e) {
      setError(e.message || "No se pudo cargar la vivienda");
    }
    try {
  const incs = await beneficiarioApi.listarIncidencias(3, 0)
      setIncidencias(Array.isArray(incs.data) ? incs.data : [])
    } catch (e) {
      // No bloqueamos toda la vista si falla media; mostramos aviso pequeño
      setError(prev => prev || "Error al obtener las incidencias")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData(); }, []);

  const activeReportsCount = useMemo(() => {
    return (incidencias || []).filter(i => (i.estado || '').toLowerCase() !== 'cerrada').length;
  }, [incidencias]);

  // const viviendaId = vivData?.vivienda?.id_vivienda ? `#${vivData.vivienda.id_vivienda}` : "—"; // (ya se muestra dentro del hero)
  const viviendaEstado = vivData?.vivienda?.estado || "—";
  const tecnicoNombre = "Sin asignar"; // No tenemos aún endpoint para técnico asignado
  const mostrarPosventa = (viviendaEstado || '').toLowerCase() === 'entregada';

  function openIncidenciaModal(defaults = {}) {
    setForm({ descripcion: defaults.descripcion || "", categoria: defaults.categoria || "" });
    setModalFiles([])
    setModalOpen(true);
  }

  async function submitIncidencia(e) {
    e?.preventDefault();
    if (!form.descripcion || form.descripcion.trim().length < 3) {
      setError("Describe el problema (al menos 3 caracteres)");
      return;
    }
    setCreating(true); setError("");
    try {
      const r = await beneficiarioApi.crearIncidencia({ descripcion: form.descripcion.trim(), categoria: form.categoria || null });
      const nueva = r?.data
      if (nueva?.id_incidencia && modalFiles.length) {
        try { await beneficiarioApi.subirMediaIncidencia(nueva.id_incidencia, modalFiles); setSuccess('Incidencia creada y fotos subidas'); } catch (e) { setError(e.message || 'Error subiendo fotos') }
      }
      setModalOpen(false);
  setForm({ descripcion: "", categoria: "" });
      setModalFiles([])
      await loadData();
    } catch (e) {
      setError(e.message || "No se pudo crear la incidencia");
    } finally {
      setCreating(false);
    }
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const iconSize = 'h-6 w-6';
  const beneficiarioSections = [
    {
      title: "Estado de Mi Vivienda",
      description: "Ver información detallada, historial y condición actual de mi hogar",
      icon: <HomeIcon className={iconSize} />,
      color: "bg-green-500 hover:bg-green-600",
      badge: vivData?.flags?.tiene_recepcion_activa ? "Activa" : "Sin recepción",
      urgent: false,
      action: () => window.alert("Pronto: detalle de vivienda")
    },
    {
      title: "Reportar Problema Urgente",
      description: "Reportar emergencias o problemas que requieren atención inmediata",
      icon: <ExclamationTriangleIcon className={iconSize} />,
      color: "bg-red-500 hover:bg-red-600",
      badge: "24/7",
      urgent: true,
  action: () => openIncidenciaModal()
    },
    {
      title: "Historial de Mis Reportes",
      description: "Ver todos mis reportes anteriores, seguimiento y resoluciones",
      icon: <ClipboardDocumentListIcon className={iconSize} />,
      color: "bg-blue-500 hover:bg-blue-600",
      badge: `${activeReportsCount} activos`,
      urgent: false,
  action: () => navigate('/beneficiario/incidencias')
    },
    {
      title: "Contacto con Mi Técnico",
      description: "Comunicarme directamente con el técnico asignado a mi zona",
      icon: <PhoneIcon className={iconSize} />,
      color: "bg-purple-500 hover:bg-purple-600",
      badge: "Ana Gómez",
      urgent: false,
      action: () => console.log("Contactar técnico")
    },
    {
      title: "Guías de Mantenimiento",
      description: "Consejos y tutoriales para el cuidado básico de mi vivienda",
      icon: <BookOpenIcon className={iconSize} />,
      color: "bg-teal-500 hover:bg-teal-600",
      badge: "Nuevas",
      urgent: false,
      action: () => console.log("Ver guías")
    },
    mostrarPosventa ? {
      title: "Formulario Posventa",
      description: "Checklist de evaluación después de la entrega",
      icon: <CalendarDaysIcon className={iconSize} />,
      color: "bg-amber-500 hover:bg-amber-600",
      badge: "Nuevo",
      urgent: false,
      action: () => navigate('/beneficiario/posventa')
    } : null
  ];

  const recentReports = useMemo(() => {
    return (incidencias || []).slice(0, 3).map((it) => ({
      id: it.id_incidencia,
      type: it.categoria || 'General',
      status: (it.estado || '').replace(/^./, c => c.toUpperCase()),
      date: (it.fecha_reporte || '').split('T')[0] || '',
      priority: (it.prioridad || '').replace(/^./, c => c.toUpperCase()) || '—',
      raw: it
    }));
  }, [incidencias]);

  // colores de status/prioridad ahora los maneja CardIncidencia

  return (
    <DashboardLayout
      title="Mi Hogar"
      subtitle="Portal Beneficiario"
      user={user || {}}
      onLogout={handleLogout}
      accent="blue"
      footer={`© ${new Date().getFullYear()} TECHO Chile · Plataforma Beneficiarios`}
    >
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">{success}</div>
      )}
      {loading && (
        <div className="mb-4 p-3 rounded bg-blue-50 text-blue-700 text-sm border border-blue-200">Cargando…</div>
      )}
      <div aria-label="Panel principal beneficiario" className="w-full">
        {/* Hero bienvenida / info vivienda */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-white border border-sky-100 shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
          {/* Capa de gradiente suave (celeste→blanco→amarillo) - en dark usamos un degradado más luminoso para contraste */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700" />
          {/* Halos sutiles */}
          <div className="pointer-events-none absolute -top-8 -left-8 h-40 w-40 rounded-full bg-sky-100/70 blur-2xl mix-blend-multiply dark:bg-sky-400/20" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-amber-100/70 blur-2xl mix-blend-multiply dark:bg-amber-300/10" />
          <div className="relative px-8 py-10 md:px-14 md:py-14">
            <div className="flex flex-col md:flex-row md:items-center gap-10">
              {/* Icono principal */}
              <div className="flex-shrink-0">
                <div className="grid place-items-center h-28 w-28 rounded-2xl bg-gradient-to-br from-sky-100 to-white border border-sky-200 shadow-inner dark:from-sky-700/30 dark:to-slate-700 dark:border-slate-600">
                  <HomeModernIcon className="h-16 w-16 text-sky-700 dark:text-sky-200" />
                </div>
              </div>
              {/* Texto bienvenida */}
              <div className="flex-1 min-w-0">
                {(() => { const nombre = user?.nombre || user?.username || (user?.email ? user.email.split('@')[0] : 'Usuario'); return (
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-sky-700 via-sky-800 to-sky-600 dark:from-sky-200 dark:via-sky-100 dark:to-sky-300">Bienvenido a tu hogar, {nombre}</h2>
                ) })()}
                <ul className="space-y-1 text-sky-800 dark:text-slate-200 text-sm sm:text-base mb-6 leading-relaxed">
                  <li><span className="font-semibold text-sky-900 dark:text-white">Dirección:</span> {vivData?.vivienda?.direccion || vivData?.vivienda?.direccion_principal || 'No registrada'}</li>
                  <li><span className="font-semibold text-sky-900 dark:text-white">Estado:</span> {viviendaEstado}</li>
                  {vivData?.vivienda?.id_vivienda && (
                    <li><span className="font-semibold text-sky-900 dark:text-white">ID Vivienda:</span> #{vivData.vivienda.id_vivienda}</li>
                  )}
                </ul>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-primary text-sm px-5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-500 dark:focus:ring-offset-slate-800" onClick={() => openIncidenciaModal()}>Reportar problema</button>
                  <button className="text-sm px-5 rounded-md bg-amber-400 hover:bg-amber-500 text-sky-900 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-400 dark:focus:ring-offset-slate-800">Ver guías</button>
                </div>
              </div>
              {/* Mini KPIs */}
              <div className="flex flex-col gap-4 w-full md:w-64">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/95 border border-sky-100 shadow-sm dark:bg-slate-700/80 dark:border-slate-500/80 backdrop-blur">
                  <div className="h-10 w-10 rounded-lg grid place-items-center bg-sky-100 text-sky-700 dark:bg-sky-500/30 dark:text-sky-200">
                    <WrenchScrewdriverIcon className="h-5 w-5" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[11px] font-semibold tracking-wide text-sky-700 dark:text-sky-200 uppercase">Reportes activos</p>
                    <p className="text-xl font-bold text-sky-800 dark:text-white">{activeReportsCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/95 border border-sky-100 shadow-sm dark:bg-slate-700/80 dark:border-slate-500/80 backdrop-blur">
                  <div className="h-10 w-10 rounded-lg grid place-items-center bg-amber-100 text-amber-600 dark:bg-amber-400/25 dark:text-amber-300">
                    <UserCircleIcon className="h-5 w-5" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[11px] font-semibold tracking-wide text-amber-600 dark:text-amber-300 uppercase">Técnico</p>
                    <p className="text-sm font-medium text-sky-800 dark:text-white">{tecnicoNombre}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Acciones principales */}
          <section aria-label="Acciones principales" className="xl:col-span-2">
            <h3 className="sr-only">Acciones principales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {beneficiarioSections.filter(Boolean).map((section, index) => (
                <ActionCard
                  key={index}
                  title={section.title}
                  description={section.description}
                  badge={section.badge}
                  urgent={section.urgent}
                  onClick={section.action}
                  icon={section.icon}
                />
              ))}
            </div>
          </section>

            {/* Reportes recientes */}
          <SectionPanel
            title="Mis reportes recientes"
            description="Resumen de actividad más reciente"
            as="section"
            className="h-full flex flex-col"
          >
            <ul className="space-y-4" aria-label="Listado de reportes recientes">
              {recentReports.map((report) => (
                <li key={report.id} className="pt-2 first:pt-0">
                  <CardIncidencia
                    incidencia={report.raw}
                    onOpen={(inc) => setDetailInc(inc)}
                    allowUpload={false}
                    onUploadClick={(inc) => { setUploadTarget(inc); fileInputRef.current?.click(); }}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <button className="btn-primary w-full text-sm" onClick={() => navigate('/beneficiario/incidencias')}>Ver todos los reportes</button>
            </div>
          </SectionPanel>
        </div>

        {/* Información de la vivienda y contacto */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SectionPanel
            title="Información de tu vivienda"
            description="Detalles clave y contacto principal"
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-techo-gray-500 mb-2">Detalles generales</h4>
                {/* hidden input for quick uploads */}
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                  const files = Array.from(e.target.files || [])
                  if (!files.length || !uploadTarget) return
                  try {
                    setError(""); setLoading(true)
                    await beneficiarioApi.subirMediaIncidencia(uploadTarget.id_incidencia, files)
                    setSuccess('Fotos subidas correctamente')
                    await loadData()
                  } catch (err) {
                    setError(err.message || 'No se pudieron subir las fotos')
                  } finally {
                    setLoading(false); setUploadTarget(null); e.target.value = ''
                  }
                }} />

                {/* Modal detalle incidencia */}
                {detailInc && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl w-full max-w-2xl p-6 md:p-7">
                      <div className="flex items-start justify-between mb-5">
                        <h3 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-white">Detalle reporte #{detailInc.id_incidencia}</h3>
                        <button className="btn-outline" onClick={() => setDetailInc(null)}>Cerrar</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-slate-700 dark:text-slate-200">
                        <div className="space-y-2 text-sm leading-relaxed">
                          <p><span className="font-medium text-slate-900 dark:text-white">Estado:</span> {detailInc.estado}</p>
                          <p><span className="font-medium text-slate-900 dark:text-white">Categoría:</span> {detailInc.categoria || '—'}</p>
                          <p><span className="font-medium text-slate-900 dark:text-white">Prioridad:</span> {(detailInc.prioridad || '—').toUpperCase()}</p>
                          <p><span className="font-medium text-slate-900 dark:text-white">Fecha:</span> {(detailInc.fecha_reporte || '').split('T')[0]}</p>
                          <p className="whitespace-pre-line"><span className="font-medium text-slate-900 dark:text-white">Descripción:</span>\n{detailInc.descripcion}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2 text-slate-800 dark:text-slate-100">Fotos</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(detailInc.media) && detailInc.media.length > 0 ? (
                              detailInc.media.map(m => (
                                <img key={m.id || m.url} src={m.url} alt="foto" className="h-24 w-24 object-cover rounded border border-slate-300 dark:border-slate-600" />
                              ))
                            ) : (
                              <p className="text-sm text-slate-500 dark:text-slate-400">Sin fotos</p>
                            )}
                          </div>
                          <div className="mt-3">
                            <button className="btn-primary btn-sm" onClick={() => { setUploadTarget(detailInc); fileInputRef.current?.click(); }}>Agregar fotos</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal crear incidencia */}
                {isModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl w-full max-w-md p-6 md:p-7">
                      <h3 className="text-lg md:text-xl font-semibold mb-5 text-slate-800 dark:text-white">Reportar problema</h3>
                      <form onSubmit={submitIncidencia} className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Descripción</label>
                          <textarea
                            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
                            rows={3}
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                            placeholder="Describe el problema…"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Categoría</label>
                            <select
                              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                              value={form.categoria}
                              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                            >
                              <option value="">(Selecciona)</option>
                              <option value="Eléctrico">Eléctrico</option>
                              <option value="Plomería">Plomería</option>
                              <option value="Estructura">Estructura</option>
                              <option value="Otro">Otro</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Fotos (opcional)</label>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="text-sm text-slate-700 dark:text-slate-200 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border file:border-slate-300 dark:file:border-slate-500 file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-600"
                              onChange={(e) => setModalFiles(Array.from(e.target.files || []).slice(0,5))}
                            />
                            {modalFiles.length > 0 && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{modalFiles.length} archivo(s) seleccionado(s)</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <button type="button" className="btn-outline" onClick={() => setModalOpen(false)} disabled={creating}>Cancelar</button>
                          <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Enviando…' : 'Crear incidencia'}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                  <ul className="space-y-2 text-techo-gray-700 dark:text-techo-gray-200">
                    <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Dirección:</span> Calle Falsa 123, Comuna X</li>
                    <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Tipo:</span> Casa Básica</li>
                    <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Metros cuadrados:</span> 42 m²</li>
                    <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Fecha de entrega:</span> 15 de marzo, 2023</li>
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-techo-gray-500 mb-2">Contacto de emergencia</h4>
                <ul className="space-y-2 text-techo-gray-700 dark:text-techo-gray-200">
                  <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Técnico asignado:</span> Ana Gómez</li>
                  <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Teléfono:</span> +56 9 1234 5678</li>
                  <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Email:</span> ana@correo.cl</li>
                  <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Horario:</span> Lun-Vie 8:00-18:00</li>
                </ul>
              </div>
            </div>
          </SectionPanel>
          <SectionPanel
            title="Consejos rápidos"
            description="Cuidado preventivo de tu vivienda"
            variant="highlight"
          >
            <ul className="text-sm text-techo-gray-700 space-y-3" aria-label="Lista de consejos">
              {[
                { icon: '💨', text: 'Ventila tu hogar diariamente para evitar humedad.' },
                { icon: '🔌', text: 'Revisa periódicamente las instalaciones eléctricas.' },
                { icon: '🚨', text: 'Reporta cualquier problema inmediatamente.' },
                { icon: '🧼', text: 'Mantén limpios los desagües y canaletas.' }
              ].map((c,i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-lg leading-none" aria-hidden>{c.icon}</span>
                  <span className="leading-snug">{c.text}</span>
                </li>
              ))}
            </ul>
          </SectionPanel>
        </div>
      </div>
    </DashboardLayout>
  );
}