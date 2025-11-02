import React, { useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from 'react-dom'
import { fetchHistorialIncidencia, groupEventsByDay, eventIcon } from '../services/historial'
import ValidationModal from '../components/ValidationModal';
import { Modal } from "../components/ui/Modal";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ActionCard } from "../components/ui/ActionCard";
import { SectionPanel } from "../components/ui/SectionPanel";
import { DashboardLayout } from "../components/ui/DashboardLayout";
import { Toast } from "../components/ui/Toast";
import { StatusPill } from "../components/ui/StatusPill";
import { ReportFab } from "../components/ui/ReportFab";
import CardIncidencia from "../components/CardIncidencia";
import CardVivienda from "../components/CardVivienda";
import { beneficiarioApi } from "../services/api";
import { 
  HomeModernIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  ShieldCheckIcon, 
  Cog6ToothIcon, 
  BoltIcon, 
  BuildingOffice2Icon, 
  ScaleIcon, 
  UsersIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

// Componente de acordeón FAQ
function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(null);
  
  const faqs = [
    {
      question: "¿Cómo reporto un problema en mi vivienda?",
      answer: "Puedes reportar incidencias desde el botón 'Reportar Incidencia' en esta página o desde la sección 'Mis Incidencias'. Solo completa el formulario con la categoría del problema, una descripción detallada y, si es posible, adjunta fotos. Nuestro equipo técnico revisará tu reporte y te contactará en máximo 5 días hábiles."
    },
    {
      question: "¿Cuánto tiempo demora la atención de una incidencia?",
      answer: "El tiempo de atención depende de la prioridad del problema. Incidencias de prioridad alta (problemas estructurales o de seguridad) se atienden en 5 días hábiles, prioridad media en 10 días hábiles, y prioridad baja en 20 días hábiles. Recibirás notificaciones sobre el estado de tu reporte."
    },
    {
      question: "¿Qué son los plazos legales y cómo se calculan?",
      answer: "Los plazos legales son tiempos máximos establecidos por la Ley General de Urbanismo y Construcciones (LGUC) para responder y resolver incidencias. Se calculan en días hábiles (lunes a viernes). Prioridad ALTA: 2 días para responder, 5 para resolver. Prioridad MEDIA: 5 días respuesta, 10 resolución. Prioridad BAJA: 10 días respuesta, 20 resolución. En tu reporte verás un indicador de color que muestra el estado del plazo."
    },
    {
      question: "¿Qué significa el indicador de colores en mis incidencias?",
      answer: "El indicador de plazos usa tres colores: Verde (✓) significa que hay tiempo suficiente para resolver (dentro del plazo). Amarillo (⏱) indica que quedan 2 días o menos, es urgente. Rojo (⚠) significa que el plazo legal ya venció. Este sistema te da transparencia sobre los tiempos de respuesta según la normativa chilena."
    },
    {
      question: "¿Qué pasa si se vence el plazo de mi incidencia?",
      answer: "Si el plazo legal se vence, la incidencia se marca en rojo y puedes presentar una queja formal ante SERVIU (Servicio de Vivienda y Urbanización) según el DS49. TECHO está obligado por ley a resolver los problemas en los plazos establecidos. Puedes contactar al equipo técnico para escalar el caso o solicitar asesoría sobre cómo presentar el reclamo."
    },
    {
      question: "¿Qué garantías cubre mi vivienda?",
      answer: "Tu vivienda cuenta con tres tipos de garantías según el DS49: Estructura (10 años) cubre fundaciones, muros y techumbre; Instalaciones (5 años) incluye electricidad, agua, gas y alcantarillado; Terminaciones (3 años) protege pisos, puertas, ventanas y pintura. Todas se cuentan desde la fecha de entrega de la vivienda."
    },
    {
      question: "¿Cómo funciona el formulario de posventa?",
      answer: "El formulario de posventa es un checklist detallado que completarás después de recibir tu vivienda. Te permite revisar cada elemento (electricidad, pisos, puertas, etc.) y marcar si está OK o tiene problemas. Al enviarlo, el equipo técnico lo revisará y generará automáticamente incidencias para resolver los problemas detectados."
    },
    {
      question: "¿Puedo ver los planos de mi vivienda?",
      answer: "Sí, cuando completes el formulario de posventa encontrarás un botón 'Ver plano' que te permite consultar los planos oficiales de tu tipo de vivienda en formato PDF. Esto te ayudará a ubicar instalaciones y entender mejor la distribución de tu hogar."
    },
    {
      question: "¿Cómo valido que un problema fue resuelto?",
      answer: "Cuando una incidencia pasa a estado 'Resuelta', recibirás una notificación. En la ficha de la incidencia verás un botón 'Validar solución' donde podrás marcar si estás conforme o no. Si no estás conforme, la incidencia volverá a proceso para que el técnico la revise nuevamente."
    },
    {
      question: "¿Qué hago si no aparece mi vivienda asignada?",
      answer: "Si ves el mensaje 'No tienes una vivienda asignada', contacta al administrador del proyecto o envía un correo a soporte. Es posible que tu cuenta aún no esté vinculada a una vivienda en el sistema. El proceso de asignación lo realiza el equipo administrativo de TECHO."
    },
    {
      question: "¿Puedo adjuntar fotos a mis reportes?",
      answer: "Sí, al crear una incidencia puedes adjuntar hasta 5 fotos que ayuden al técnico a entender mejor el problema. Las imágenes deben ser en formato JPG, PNG o WEBP y no superar los 5 MB cada una. Esto agiliza el diagnóstico y la solución del problema."
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {faqs.map((faq, index) => (
        <div key={index} className="bg-yellow-400 rounded-lg overflow-hidden border border-yellow-500/20 shadow-sm hover:shadow-md transition-shadow">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-yellow-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-600"
          >
            <span className="font-semibold text-black text-sm sm:text-base pr-4">
              {faq.question}
            </span>
            <ChevronDownIcon 
              className={`w-5 h-5 text-black flex-shrink-0 transition-transform duration-200 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === index ? 'max-h-96' : 'max-h-0'
            }`}
          >
            <div className="px-6 pb-5 pt-1 text-black/80 text-sm leading-relaxed">
              {faq.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [historialInc, setHistorialInc] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [histMeta, setHistMeta] = useState({ total:0, limit:50, offset:0, has_more:false })

  // Modal estado
  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ descripcion: "", categoria: "" });
  const [modalFiles, setModalFiles] = useState([]); // imágenes seleccionadas en el modal
  const [creating, setCreating] = useState(false);

  // Bloquear scroll de fondo y cerrar con Escape cuando el modal esté abierto
  useEffect(() => {
    if (isModalOpen) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const onKeyDown = (e) => {
        if (e.key === 'Escape') setModalOpen(false)
      }
      document.addEventListener('keydown', onKeyDown)
      return () => {
        document.body.style.overflow = prevOverflow || ''
        document.removeEventListener('keydown', onKeyDown)
      }
    }
  }, [isModalOpen])

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
      // Silenciar error si simplemente no hay incidencias o 404
      if (e.status && [404, 204].includes(e.status)) {
        setIncidencias([])
      } else {
        console.warn('Incidencias: ', e.message)
      }
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
  const mostrarPosventa = ['entregada','entregada_inicial'].includes((viviendaEstado || '').toLowerCase());

  // Helpers para garantías DS49
  const entregaDate = useMemo(() => {
    const d = vivData?.vivienda?.fecha_entrega ? new Date(vivData.vivienda.fecha_entrega) : null
    return d && !isNaN(d) ? d : null
  }, [vivData?.vivienda?.fecha_entrega])

  function addYears(date, years) {
    if (!date) return null
    const d = new Date(date)
    d.setFullYear(d.getFullYear() + years)
    return d
  }
  function addBusinessDays(date, days) {
    if (!date) return null
    let d = new Date(date)
    let added = 0
    while (added < days) {
      d.setDate(d.getDate() + 1)
      const day = d.getDay() // 0=Sun .. 6=Sat
      if (day !== 0 && day !== 6) added++
    }
    return d
  }
  const fmt = (d) => d ? new Date(d).toLocaleDateString('es-CL') : '—'
  const isFuture = (d) => d ? d.getTime() >= Date.now() : false

  function openIncidenciaModal(defaults = {}) {
    setForm({ descripcion: defaults.descripcion || "", categoria: defaults.categoria || "" });
    setModalFiles([])
    setModalOpen(true);
  }

  // Catálogo de categorías agrupadas por garantía
  const categoriaGroups = useMemo(() => ([
    {
      key: 'instalaciones',
      label: 'Instalaciones (5 años)',
      options: [
        { value: 'electricidad', label: 'Electricidad' },
        { value: 'tablero electrico', label: 'Tablero eléctrico y automáticos' },
        { value: 'tomas e interruptores', label: 'Tomas e interruptores' },
        { value: 'cableado', label: 'Cableado y empalmes' },
        { value: 'iluminacion', label: 'Iluminación fija' },
        { value: 'gas', label: 'Gas (red interior)' },
        { value: 'agua potable', label: 'Agua potable (fría/caliente)' },
        { value: 'plomeria', label: 'Plomería / Gasfitería' },
        { value: 'artefactos sanitarios', label: 'Artefactos sanitarios' },
        { value: 'desagues', label: 'Desagües' },
        { value: 'alcantarillado', label: 'Alcantarillado' },
        { value: 'aguas lluvias', label: 'Aguas lluvias (canaletas y bajadas)' },
        { value: 'ventilacion', label: 'Ventilación / Extracción' },
        { value: 'calefon', label: 'Calefón / Termo / Calefacción' },
        { value: 'otro_instalaciones', label: 'Otro (Instalaciones)' },
      ]
    },
    {
      key: 'terminaciones',
      label: 'Terminaciones (3 años)',
      options: [
        { value: 'pintura', label: 'Pintura' },
        { value: 'revestimientos muro', label: 'Revestimientos de muro' },
        { value: 'yeso carton', label: 'Yeso-cartón / Tabiques / Cielos' },
        { value: 'pisos ceramica', label: 'Pisos cerámica' },
        { value: 'pisos porcelanato', label: 'Pisos porcelanato' },
        { value: 'pisos vinilico', label: 'Pisos vinílico' },
        { value: 'pisos flotante', label: 'Pisos flotante' },
        { value: 'pisos madera', label: 'Pisos madera' },
        { value: 'zocalos', label: 'Zócalos' },
        { value: 'puertas', label: 'Puertas' },
        { value: 'cerraduras', label: 'Cerraduras y herrajes' },
        { value: 'ventanas', label: 'Ventanas' },
        { value: 'vidrios', label: 'Vidrios' },
        { value: 'sellos silicona', label: 'Sellos de silicona' },
        { value: 'tapajuntas', label: 'Tapajuntas' },
        { value: 'molduras', label: 'Molduras' },
        { value: 'muebles cocina', label: 'Muebles de cocina' },
        { value: 'muebles bano', label: 'Muebles de baño' },
        { value: 'cubierta cocina', label: 'Cubierta de cocina' },
        { value: 'otro_terminaciones', label: 'Otro (Terminaciones)' },
      ]
    },
    {
      key: 'estructura',
      label: 'Estructura (10 años)',
      options: [
        { value: 'fundaciones', label: 'Fundaciones / Cimientos' },
        { value: 'estructura muros', label: 'Estructura de muros' },
        { value: 'estructura techumbre', label: 'Estructura de techumbre' },
        { value: 'losa', label: 'Losas' },
        { value: 'vigas', label: 'Vigas' },
        { value: 'columnas', label: 'Columnas' },
        { value: 'grietas estructurales', label: 'Grietas estructurales / Desplomes' },
        { value: 'estructura escalas', label: 'Escalas estructurales' },
        { value: 'otro_estructura', label: 'Otro (Estructura)' },
      ]
    }
  ]), [])
  const [catOpen, setCatOpen] = useState(false)
  const [catActiveGroup, setCatActiveGroup] = useState('all') // 'all' | 'instalaciones' | 'terminaciones' | 'estructura'
  const selectedCatLabel = useMemo(() => {
    const all = categoriaGroups.flatMap(g => g.options)
    return all.find(o => o.value === form.categoria)?.label || '(Selecciona)'
  }, [categoriaGroups, form.categoria])
  const filteredGroups = useMemo(() => {
    const base = catActiveGroup === 'all' ? categoriaGroups : categoriaGroups.filter(g => g.key === catActiveGroup)
    return base
  }, [categoriaGroups, catActiveGroup])

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
      title: "Información y Estado de Mi Vivienda",
      description: "Ver ubicación, plano, historial y condición actual de mi hogar",
      icon: <HomeIcon className={iconSize} />,
      color: "bg-green-500 hover:bg-green-600",
      badge: vivData?.flags?.tiene_recepcion_activa ? "Activa" : "Sin recepción",
      urgent: false,
      action: () => navigate('/beneficiario/estado-vivienda')
    },
    {
      title: "Reportar Problema Urgente",
      description: "Reportar emergencias o problemas que requieren atención inmediata",
      icon: <ExclamationTriangleIcon className={iconSize} />,
      color: "bg-red-500 hover:bg-red-600",
      badge: "24/7",
      urgent: true,
      cta: 'Reportar ahora',
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
    mostrarPosventa ? {
      title: "Formulario Posventa",
      description: "Checklist de evaluación después de la entrega",
      icon: <CalendarDaysIcon className={iconSize} />,
      color: "bg-amber-500 hover:bg-amber-600",
      badge: "Nuevo",
      urgent: false,
      action: () => navigate('/beneficiario/posventa')
    } : null
  ].filter(Boolean);

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
      paddingTop="pt-3 pb-8 md:py-8"
      footer={`© ${new Date().getFullYear()} TECHO Chile · Plataforma Beneficiarios`}
    >
      {/* Fondo colorido inspirado en TECHO (solo en esta página) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {/* Radiales de color */}
        <div
          className="absolute inset-0 opacity-70 dark:opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(800px 600px at -5% 10%, rgba(37,99,235,0.10), transparent 60%),'+
              'radial-gradient(700px 600px at 110% 0%, rgba(245,158,11,0.10), transparent 60%),'+
              'radial-gradient(700px 600px at 0% 100%, rgba(20,184,166,0.10), transparent 60%),'+
              'radial-gradient(600px 500px at 100% 100%, rgba(59,130,246,0.10), transparent 60%)'
          }}
        />
        {/* Patrón sutil de puntos/diagonales */}
        <div
          className="absolute inset-0 opacity-30 dark:opacity-20 mix-blend-multiply"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(30,64,175,0.08) 1px, transparent 0)',
            backgroundSize: '22px 22px'
          }}
        />
      </div>
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}
      {success && <div className="mb-4"><Toast type="success" message={success} onClose={() => setSuccess('')} /></div>}
      {loading && <Toast type="info" message="Cargando…" />}
  <div aria-label="Panel principal beneficiario" className="w-full">
        {/* Hero bienvenida / info vivienda - OPTIMIZADO PARA MÓVIL */}
  <div className="relative mb-6 md:mb-10 overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-sky-50 via-white to-blue-50 border-2 border-sky-200 shadow-lg dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 dark:border-slate-600">
          {/* Halos decorativos más vibrantes */}
          <div className="pointer-events-none absolute -top-8 -left-8 md:-top-12 md:-left-12 h-40 w-40 md:h-56 md:w-56 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-400/20" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 md:-bottom-12 md:-right-12 h-48 w-48 md:h-64 md:w-64 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-400/15" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-32 w-32 md:h-48 md:w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100/40 blur-3xl dark:bg-cyan-400/10" />
          
          <div className="relative px-4 py-4 md:px-12 md:py-12">
            <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-4 md:gap-8">
              {/* Icono principal - más pequeño en móvil */}
              <div className="flex-shrink-0">
                <div className="grid place-items-center h-24 w-24 md:h-36 md:w-36 rounded-2xl md:rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg md:shadow-xl ring-2 md:ring-4 ring-white/50 dark:ring-slate-700/50 transform hover:scale-105 transition-transform duration-300">
                  <HomeModernIcon className="h-14 w-14 md:h-24 md:w-24 text-white drop-shadow-lg" />
                </div>
              </div>
              
              {/* Texto bienvenida - centrado en móvil */}
              <div className="flex-1 min-w-0">
                {(() => { const nombre = user?.nombre || user?.username || (user?.email ? user.email.split('@')[0] : 'Usuario'); return (
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 md:mb-5 text-sky-700 dark:text-sky-100 drop-shadow-sm">
                    Bienvenido a tu hogar,<br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 dark:from-blue-300 dark:via-sky-300 dark:to-cyan-300">
                      {nombre}
                    </span>
                  </h2>
                ) })()}
                
                {/* Info de vivienda con diseño mejorado */}
                <div className="space-y-2 md:space-y-3 mb-5 md:mb-6">
                  <div className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-xl bg-white/70 dark:bg-slate-700/50 backdrop-blur border border-sky-100 dark:border-slate-600">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-sky-100 dark:bg-sky-500/20 grid place-items-center">
                        <HomeIcon className="h-4 w-4 md:h-5 md:w-5 text-sky-600 dark:text-sky-300" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide mb-0.5 md:mb-1">Dirección</p>
                      <p className="text-sm md:text-base font-medium text-slate-800 dark:text-white truncate">
                        {vivData?.vivienda?.direccion || vivData?.vivienda?.direccion_principal || 'No registrada'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                    <div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg bg-white/70 dark:bg-slate-700/50 backdrop-blur border border-sky-100 dark:border-slate-600">
                      <span className="text-[10px] md:text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase">Estado:</span>
                      <StatusPill value={viviendaEstado} />
                    </div>
                    {vivData?.vivienda?.id_vivienda && (
                      <div className="px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg bg-white/70 dark:bg-slate-700/50 backdrop-blur border border-sky-100 dark:border-slate-600">
                        <span className="text-[10px] md:text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase">ID: </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">#{vivData.vivienda.id_vivienda}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Botón mejorado - centrado en móvil */}
                <div className="flex justify-center md:justify-start">
                  <button 
                    className="inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-sm md:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-500"
                    onClick={() => navigate('/beneficiario/estado-vivienda')}
                  >
                    <HomeIcon className="h-5 w-5" />
                    Ver mi vivienda
                  </button>
                </div>
              </div>
              
              {/* Mini KPI - Solo reportes activos - centrado en móvil */}
              <div className="w-full md:w-auto">
                <div className="flex items-center justify-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl bg-white/90 border-2 border-sky-200 shadow-lg dark:bg-slate-700/90 dark:border-slate-600 backdrop-blur hover:shadow-xl transition-shadow duration-200">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl grid place-items-center bg-gradient-to-br from-sky-400 to-blue-500 shadow-md">
                    <WrenchScrewdriverIcon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] md:text-xs font-bold tracking-wider text-sky-700 dark:text-sky-300 uppercase mb-0.5 md:mb-1">Reportes activos</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-sky-800 dark:text-white">{activeReportsCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner inspirado en TECHO Chile (después del Bienvenido) */}
        <section
          className="relative overflow-hidden rounded-3xl border border-sky-100 shadow-sm mb-10"
          aria-label="Banner TECHO"
        >
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-white/0 dark:bg-transparent" />
            <img
              src={`${process.env.PUBLIC_URL || ''}/assets/techo/hero-techo.jpg`}
              alt="TECHO Chile"
              className="w-full h-auto block"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `${process.env.PUBLIC_URL || ''}/assets/techo/placeholder.svg`;
              }}
            />
            {/* Capa superior con mensaje */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/30 to-transparent" />
            <div className="absolute inset-0 flex items-end justify-start px-3 py-3 sm:px-6 sm:py-6 md:p-10 pointer-events-none">
              <div className="pointer-events-auto max-w-[95%] sm:max-w-[75%] md:max-w-[65%] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md ring-2 ring-sky-400/50 dark:ring-sky-500/50 shadow-xl border-l-4 border-sky-500">
                <p className="text-sm sm:text-base md:text-lg font-semibold leading-snug text-sky-900 dark:text-sky-50 break-words hyphens-auto">
                  🏠 Construimos viviendas de emergencia junto a comunidades para superar la situación de pobreza en Latinoamérica.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Acciones principales */}
          <section aria-label="Acciones principales" className="xl:col-span-2">
            <h3 className="sr-only">Acciones principales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {beneficiarioSections.map((section, index) => (
                <ActionCard
                  key={index}
                  title={section.title}
                  description={section.description}
                  badge={section.badge}
                  urgent={section.urgent}
                  onClick={section.action}
                  icon={section.icon}
                  cta={section.cta}
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
                    onOpen={async (inc) => {
                      setDetailInc(inc)
                      setHistorialInc([]); setHistMeta({ total:0, limit:50, offset:0, has_more:false })
                      setLoadingHistorial(true)
                      try {
                        const r = await fetchHistorialIncidencia(inc.id_incidencia, { limit:50, offset:0 })
                        setHistorialInc(r.events); setHistMeta(r.meta)
                      } catch(_){} finally { setLoadingHistorial(false) }
                    }}
                    allowUpload={false}
                    onUploadClick={(inc) => { setUploadTarget(inc); fileInputRef.current?.click(); }}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <button
                className="btn-primary w-full text-sm"
                onClick={() => navigate('/beneficiario/incidencias')}
              >
                Ver todos los reportes
              </button>
            </div>
          </SectionPanel>
        </div>

  {/* Información de la vivienda y contacto */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SectionPanel
            title="Información de tu vivienda"
            description="Detalles clave y contacto principal"
            className="lg:col-span-2"
            showBack={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <div>
                  {/* Información de vivienda renderizada más abajo por CardVivienda */}
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

                {/* Modal detalle incidencia (centrado mediante portal) */}
                <Modal isOpen={!!detailInc} onClose={() => setDetailInc(null)} maxWidth="max-w-3xl">
                  {detailInc && (
                    <div className="p-6 md:p-7 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600">
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
                          
                          {/* Indicador de Plazos Legales */}
                          {detailInc.plazos_legales && !['cerrada', 'cancelada'].includes((detailInc.estado || '').toLowerCase()) && (() => {
                            const { estado_plazo, dias_restantes, fecha_limite_resolucion, texto_estado } = detailInc.plazos_legales
                            let Icon = ClockIcon
                            let colorClasses = 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                            
                            if (estado_plazo === 'vencido') {
                              Icon = ExclamationTriangleIcon
                              colorClasses = 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                            } else if (estado_plazo === 'dentro_plazo') {
                              Icon = CheckCircleIcon
                              colorClasses = 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                            }
                            
                            const textoDetalle = dias_restantes !== null
                              ? (dias_restantes > 0 
                                  ? `${dias_restantes} día${dias_restantes !== 1 ? 's' : ''} hábil${dias_restantes !== 1 ? 'es' : ''} restantes (hasta ${fecha_limite_resolucion})`
                                  : `Plazo vencido hace ${Math.abs(dias_restantes)} día${Math.abs(dias_restantes) !== 1 ? 's' : ''} hábil${Math.abs(dias_restantes) !== 1 ? 'es' : ''}`)
                              : `Plazo límite: ${fecha_limite_resolucion}`
                            
                            return (
                              <div className={`mt-3 p-3 rounded-lg border ${colorClasses} flex items-start gap-3`}>
                                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold">{texto_estado || 'Plazo Legal'}</p>
                                  <p className="text-xs mt-1">{textoDetalle}</p>
                                  <p className="text-xs mt-2 opacity-75">
                                    Según LGUC y normativa SERVIU. Los plazos se calculan en días hábiles (lunes a viernes).
                                  </p>
                                </div>
                              </div>
                            )
                          })()}
                          
                          {detailInc.estado === 'resuelta' && (
                            <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700">
                              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">¿La solución implementada resolvió tu incidencia?</p>
                              <div className="flex flex-wrap gap-2">
                                <button className="btn-primary btn-sm" onClick={()=> setValidationModalOpen(true)}>Validar / Rechazar</button>
                              </div>
                            </div>
                          )}
                          <div className='mt-4'>
                            <p className='font-medium text-slate-900 dark:text-white mb-1'>Historial</p>
                            {loadingHistorial && <p className='text-xs text-slate-500'>Cargando historial…</p>}
                            {!loadingHistorial && historialInc.length === 0 && <p className='text-xs text-slate-500'>Sin eventos</p>}
                            {!loadingHistorial && historialInc.length>0 && groupEventsByDay(historialInc).map(g => (
                              <div key={g.day} className='mb-2'>
                                <div className='text-[11px] font-semibold text-slate-500 mb-1'>{g.day}</div>
                                <ul className='space-y-1'>
                                  {g.events.map(ev => (
                                    <li key={ev.id} className='text-[11px] flex justify-between gap-2 border-b border-slate-100 dark:border-slate-700 py-1'>
                                      <div>
                                        <span className='mr-1'>{eventIcon(ev.tipo_evento)}</span>
                                        <span className='font-semibold'>{ev.tipo_evento}</span>
                                        {ev.estado_anterior && ev.estado_nuevo && <span className='ml-1'>({ev.estado_anterior}→{ev.estado_nuevo})</span>}
                                        {ev.comentario && <span className='italic ml-1 text-slate-500'>“{ev.comentario}”</span>}
                                      </div>
                                      <time className='text-slate-400'>{(ev.created_at||'').replace('T',' ').substring(11,16)}</time>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                            {histMeta.has_more && !loadingHistorial && (
                              <button className='btn-outline btn-xs mt-1' onClick={async ()=>{
                                setLoadingHistorial(true)
                                try {
                                  const next = await fetchHistorialIncidencia(detailInc.id_incidencia, { limit: histMeta.limit, offset: histMeta.offset + histMeta.limit })
                                  setHistorialInc(prev => [...prev, ...next.events])
                                  setHistMeta(next.meta)
                                } catch(_){} finally { setLoadingHistorial(false) }
                              }}>Ver más</button>
                            )}
                          </div>
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
                  )}
                </Modal>
                {validationModalOpen && detailInc && (
                  <ValidationModal
                    open={validationModalOpen}
                    loading={validationLoading}
                    onClose={()=> setValidationModalOpen(false)}
                    onAccept={async ()=>{
                      setValidationLoading(true)
                      try {
                        await beneficiarioApi.validarIncidencia(detailInc.id_incidencia,{ conforme:true });
                        await loadData();
                        const refreshed = incidencias.find(i=>i.id_incidencia===detailInc.id_incidencia); if (refreshed) setDetailInc(refreshed);
                        setValidationModalOpen(false)
                      } catch(e){ setError(e.message||'Error validando') } finally { setValidationLoading(false) }
                    }}
                    onReject={async ({ comentario, file })=>{
                      setValidationLoading(true)
                      try {
                        await beneficiarioApi.subirMediaIncidencia(detailInc.id_incidencia, [file])
                        await beneficiarioApi.validarIncidencia(detailInc.id_incidencia,{ conforme:false, comentario });
                        await loadData();
                        const refreshed = incidencias.find(i=>i.id_incidencia===detailInc.id_incidencia); if (refreshed) setDetailInc(refreshed);
                        setValidationModalOpen(false)
                      } catch(e){ setError(e.message||'Error enviando rechazo') } finally { setValidationLoading(false) }
                    }}
                  />
                )}

                {/* Modal crear incidencia */}
                {isModalOpen && typeof document !== 'undefined' && createPortal(
                  <div className="fixed inset-0 z-[200] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="reportar-titulo">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="relative z-[201] grid min-h-[100svh] place-items-center p-2 sm:p-4">
                      <div
                        className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl w-full max-w-[96vw] sm:max-w-3xl md:max-w-4xl p-4 sm:p-6 md:p-8 max-h-[96svh] sm:max-h-[90vh] overflow-y-auto mx-auto"
                        onClick={(e) => e.stopPropagation()}
                        role="document"
                      >
                      {/* Botón Volver (arriba derecha, azul) */}
                      <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        aria-label="Volver"
                        className="absolute top-3 right-3 btn-primary btn-sm z-10"
                      >
                        Volver
                      </button>
                      <div className="pr-20">
                        <h3 id="reportar-titulo" className="text-lg md:text-2xl font-semibold text-slate-800 dark:text-white">Reportar problema</h3>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Cuéntanos qué ocurre; mientras más detalles nos des, mejor podremos ayudarte.</p>
                      </div>
                      <form onSubmit={submitIncidencia} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Descripción: ocupa toda la fila */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Descripción</label>
                          <textarea
                            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-y min-h-[100px]"
                            rows={4}
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                            maxLength={500}
                            placeholder="Describe el problema…"
                            required
                            aria-describedby="desc-ayuda"
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <p id="desc-ayuda" className="text-[11px] md:text-xs text-slate-500">Recomendado: 20–200 caracteres. Incluye ubicación en la vivienda y hace cuánto ocurre.</p>
                            <span className="text-[11px] md:text-xs text-slate-500">{(form.descripcion||'').length}/500</span>
                          </div>
                        </div>

                        {/* Categoría (dropdown personalizado para evitar recortes) */}
                        <div className="relative">
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Categoría</label>
                          <button
                            type="button"
                            className="w-full text-left rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            onClick={() => setCatOpen(v => !v)}
                            aria-haspopup="listbox"
                            aria-expanded={catOpen}
                          >
                            {selectedCatLabel}
                          </button>
                          {catOpen && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl">
                              {/* Barra de filtros */}
                              <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur px-3 pt-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { key:'all', label:'Todos' },
                                    { key:'instalaciones', label:'Instalaciones' },
                                    { key:'terminaciones', label:'Terminaciones' },
                                    { key:'estructura', label:'Estructura' }
                                  ].map(t => (
                                    <button
                                      key={t.key}
                                      type="button"
                                      className={`px-2.5 py-1 rounded-full text-xs border ${catActiveGroup===t.key ? 'bg-sky-600 text-white border-sky-600' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                      onClick={() => setCatActiveGroup(t.key)}
                                    >{t.label}</button>
                                  ))}
                                </div>
                              </div>
                              {/* Lista */}
                              <div className="max-h-[60vh] overflow-auto">
                                {filteredGroups.length === 0 ? (
                                  <div className="px-3 py-4 text-sm text-slate-500">Sin resultados</div>
                                ) : (
                                  filteredGroups.map((grp, gi) => (
                                    <div key={grp.key} className={`py-1 ${gi>0 ? 'border-t border-slate-200 dark:border-slate-700' : ''}`}>
                                      <div className="px-3 py-1 text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                                        {grp.label}
                                      </div>
                                      <div className="py-1 space-y-1">
                                        {grp.options.map(opt => (
                                          <button
                                            key={opt.value}
                                            type="button"
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${form.categoria===opt.value ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-200' : 'text-slate-800 dark:text-slate-100'}`}
                                            onClick={() => { setForm({ ...form, categoria: opt.value }); setCatOpen(false); setCatActiveGroup('all') }}
                                          >
                                            {opt.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                          <p className="mt-1 text-[11px] text-slate-500">Usa “Otro” si no encaja; el equipo ajustará la categoría luego.</p>
                        </div>

                        {/* Fotos */}
                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Fotos (opcional)</label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="text-sm text-slate-700 dark:text-slate-200 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border file:border-slate-300 dark:file:border-slate-500 file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-600"
                            onChange={(e) => setModalFiles(Array.from(e.target.files || []).slice(0,5))}
                            aria-describedby="fotos-ayuda"
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <p id="fotos-ayuda" className="text-[11px] text-slate-500">Hasta 5 imágenes (JPG/PNG). Consejo: toma las fotos con buena luz y enfoca el área afectada.</p>
                            {modalFiles.length > 0 && (
                              <span className="text-[11px] text-slate-500">{modalFiles.length} archivo(s)</span>
                            )}
                          </div>

                          {/* Previsualización de fotos */}
                          {modalFiles.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {modalFiles.map((f, idx) => (
                                <div key={idx} className="relative h-16 w-16 rounded-md overflow-hidden border border-slate-300 dark:border-slate-600">
                                  <img
                                    src={URL.createObjectURL(f)}
                                    alt={f.name}
                                    className="h-full w-full object-cover"
                                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                                  />
                                  <button
                                    type="button"
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 grid place-items-center text-xs"
                                    aria-label={`Eliminar ${f.name}`}
                                    onClick={() => setModalFiles(prev => prev.filter((_, i) => i !== idx))}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Bloque de consejos e información */}
                        <div className="md:col-span-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 px-4 py-3">
                          <div className="flex items-start gap-2">
                            <span className="text-sky-600" aria-hidden>💡</span>
                            <div className="text-[12px] leading-relaxed text-slate-700 dark:text-slate-200">
                              <p className="font-medium mb-1">Consejos para un buen reporte</p>
                              <ul className="list-disc pl-4 space-y-1">
                                <li>Indica el lugar exacto (p. ej., “muro norte del dormitorio”).</li>
                                <li>Cuenta cuándo comenzó y si empeora con lluvia o uso.</li>
                                <li>Si puedes, agrega dimensiones aproximadas (cm).</li>
                              </ul>
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
                                <p><span className="font-medium">Tiempo estimado de respuesta:</span> 24–48 h hábiles.</p>
                                <p><span className="font-medium">Privacidad:</span> solo tu técnico y coordinador verán esta información.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                          <button type="button" className="btn-outline" onClick={() => setModalOpen(false)} disabled={creating}>Cancelar</button>
                          <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Enviando…' : 'Crear incidencia'}</button>
                        </div>
                      </form>
                      </div>
                    </div>
                  </div>, document.body)
                }
                {/* Reemplazamos con componente dinámico */}
                <CardVivienda vivienda={vivData?.vivienda} tecnico={vivData?.tecnico || { nombre: 'Sin asignar', telefono: '—', email: '—', horario: '—' }} />
                </div>
              </div>
            </div>
          </SectionPanel>
          <SectionPanel
            title="Consejos rápidos"
            description="Cuidado preventivo de tu vivienda"
            variant="highlight"
            showBack={false}
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

        {/* Garantías DS49: información clave para el beneficiario */}
        <SectionPanel
          title="Garantías y plazos DS49"
          description="Conoce hasta cuándo cubre cada garantía de tu vivienda"
          className="mt-12"
        >
          {!entregaDate ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm">
              <p className="font-medium">Aún no registramos la fecha de entrega de tu vivienda.</p>
              <p className="opacity-90">Cuando se registre, verás aquí las fechas de vencimiento de cada garantía.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Encabezado con fecha de entrega */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-6 w-6 text-sky-700"/>
                  <div>
                    <p className="text-sm text-techo-gray-600">Fecha de entrega registrada</p>
                    <p className="text-lg font-semibold">{fmt(entregaDate)}</p>
                  </div>
                </div>
                <div className="text-xs text-techo-gray-500">
                  Estos plazos son referenciales según normativa DS49 / Ley General de Urbanismo y Construcciones.
                </div>
              </div>

              {/* Grid de garantías */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[
                  {icon: ClipboardDocumentListIcon, title:'Corrección de observaciones de entrega', plazo:'15–30 días hábiles', vence:addBusinessDays(entregaDate, 30), quien:'Constructor / TECHO', tone:'amber'},
                  {icon: Cog6ToothIcon, title:'Garantía de terminaciones', plazo:'3 años', vence:addYears(entregaDate, 3), quien:'Constructor', tone:'sky'},
                  {icon: BoltIcon, title:'Garantía de instalaciones', plazo:'5 años', vence:addYears(entregaDate, 5), quien:'Constructor', tone:'indigo'},
                  {icon: BuildingOffice2Icon, title:'Garantía estructural', plazo:'10 años', vence:addYears(entregaDate, 10), quien:'Constructor', tone:'emerald'},
                  {icon: ScaleIcon, title:'Prohibición de venta/arriendo', plazo:'5 años', vence:addYears(entregaDate, 5), quien:'Beneficiario', tone:'rose'},
                  {icon: UsersIcon, title:'Acompañamiento social (MINVU)', plazo:'Hasta 1 año post-entrega', vence:addYears(entregaDate, 1), quien:'Entidad Patrocinante / TECHO', tone:'purple'},
                ].map((g, i) => {
                  const Icon = g.icon
                  const vence = g.vence
                  const activo = isFuture(vence)
                  const chip = activo ? 'Vigente' : 'Vencida'
                  const chipClass = activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  return (
                    <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-soft p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <span className={`rounded-lg p-2 bg-${g.tone}-50 text-${g.tone}-700`}><Icon className="h-5 w-5"/></span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug">{g.title}</p>
                          <p className="text-xs text-techo-gray-600">Plazo: {g.plazo}</p>
                        </div>
                        <span className={`ml-auto inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border ${chipClass}`}>{chip}</span>
                      </div>
                      <div className="text-[12px] text-techo-gray-700 flex items-center justify-between">
                        <div>
                          <p className="opacity-80">Vence</p>
                          <p className="font-medium">{fmt(vence)}</p>
                        </div>
                        <div className="text-right">
                          <p className="opacity-80">Quién responde</p>
                          <p className="font-medium">{g.quien}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </SectionPanel>
  {/* Galería simple con 3 imágenes */}
        <section aria-label="Últimas noticias" className="mt-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-[#241B33] dark:text-white mb-6 text-center">Últimas noticias</h3>
          {(() => {
            // Noticias reales desde cl.techo.Sorg/noticias/
            const posts = [
              {
                img: 'https://cl.techo.org/wp-content/uploads/sites/9/2025/09/Grupal-1-1024x683.png',
                title: 'REPRESENTANTES DE MATTHEI Y JARA SE REÚNEN CON VECINOS DE CAMPAMENTOS EN DIÁLOGO ORGANIZADO POR TECHO-CHILE',
                date: '2025-09-10',
                tag: 'COMUNICADOS',
                url: 'https://cl.techo.org/representantes-de-matthei-y-jara-se-reunen-con-vecinos-de-campamentos-en-dialogo-organizado-por-techo-chile/'
              },
              {
                img: 'https://cl.techo.org/wp-content/uploads/sites/9/2025/06/DSC01221-1024x684.jpg',
                title: 'LOS CAMPAMENTOS SIGUEN AL ALZA: AUMENTARON EN MÁS DE SEIS MIL FAMILIAS ENTRE 2023 Y 2025',
                date: '2025-05-06',
                tag: 'COMUNICADOS',
                url: 'https://cl.techo.org/los-campamentos-siguen-al-alza-aumentaron-en-mas-de-seis-mil-familias-entre-2023-y-2025/'
              },
              {
                img: 'https://cl.techo.org/wp-content/uploads/sites/9/2025/05/IMG_5583-1024x576.jpg',
                title: 'DE CAMPAMENTO A CONDOMINIO: INNOVADOR PROYECTO HABITACIONAL DA SOLUCIÓN A 185 FAMILIAS',
                date: '2025-03-12',
                tag: 'COMUNICADOS',
                url: 'https://cl.techo.org/de-campamento-a-condominio-innovador-proyecto-habitacional-da-solucion-a-185-familias/'
              }
            ];
            const fmtDate = (s) => {
              const d = new Date(s);
              if (isNaN(d)) return '';
              const opts = { day: '2-digit', month: 'long', year: 'numeric' };
              return d.toLocaleDateString('es-CL', opts);
            };
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((p, i) => (
                  <article key={i} className="group rounded-3xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                      <div className="relative">
                        <img
                          src={/^https?:\/\//.test(p.img) ? p.img : `${process.env.PUBLIC_URL || ''}/assets/techo/${p.img}`}
                          alt={p.title}
                          className="w-full h-52 sm:h-56 object-cover"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `${process.env.PUBLIC_URL || ''}/assets/techo/placeholder.svg`; }}
                        />
                        {/* Badge de categoría en esquina superior derecha */}
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-md text-[11px] font-semibold uppercase bg-sky-100 text-sky-800 border border-sky-200 shadow-sm">
                            {p.tag}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-4">
                        <h4 className="text-[15px] sm:text-[16px] font-semibold tracking-tight text-slate-900 dark:text-white line-clamp-2 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                          {p.title}
                        </h4>
                        <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-300 uppercase tracking-wide">
                          {fmtDate(p.date)}
                        </p>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            );
          })()}
          {/* Botón Leer más */}
          <div className="mt-6 flex justify-center">
            <a
              href="https://cl.techo.org/noticias/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-[#0098EA] hover:bg-[#0085CC] text-white font-semibold shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0098EA]"
            >
              LEER MÁS
            </a>
          </div>
        </section>

        {/* Preguntas Frecuentes */}
        <section aria-label="Preguntas frecuentes" className="mt-16">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3 text-center">
              Preguntas Frecuentes
            </h3>
            <p className="text-center text-slate-600 dark:text-slate-300 mb-12 text-sm sm:text-base max-w-2xl mx-auto">
              Encuentra respuestas rápidas a las dudas más comunes sobre tu vivienda y la plataforma
            </p>
            <FAQAccordion />
          </div>
        </section>
      </div>
      {/* Botón flotante para reportar problema rápido */}
  {/* CTA estilo TECHO, fijo abajo a la derecha */}
  <ReportFab
    label="Involúcrate"
    href="https://cl.techo.org/involucrate/"
    animate={true}
    fixed={true}
    variant="techo"
    side="right"
    offset={24}
  />
    </DashboardLayout>
  );
}