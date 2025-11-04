import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../components/ui/DashboardLayout";
import { SectionPanel } from "../../components/ui/SectionPanel";
import { adminApi } from "../../services/api";
import {
  searchAddresses as geoSearch,
  validateAddress as geoValidate,
} from "../../services/geocoding";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function GestionProyectos() {
  // Utilidades: normalizar números y extraer lat,lng desde texto o URL de Google/OSM
  const toNumber = (v) => {
    if (v === "" || v === null || typeof v === "undefined") return null;
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const clamp = (n, min, max) =>
    n == null ? null : Math.max(min, Math.min(max, n));
  function parseLatLngFromText(text) {
    if (!text) return null;
    const s = String(text).trim();
    const dd = (t) => parseFloat(String(t).replace(",", "."));
    // 1) Par "lat,lng" (con punto o coma)
    let m = s.match(/(-?\d{1,3}[.,]\d+)\s*[,;\s]\s*(-?\d{1,3}[.,]\d+)/);
    if (m) {
      const lat = dd(m[1]);
      const lng = dd(m[2]);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
    // 2) Google Maps URL con @lat,lng,zoomz
    m = s.match(/@(-?\d{1,3}[.,]\d+),(-?\d{1,3}[.,]\d+),\d+(?:\.\d+)?z/);
    if (m) {
      const lat = dd(m[1]);
      const lng = dd(m[2]);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
    // 3) Google Maps con q=lat,lng
    m = s.match(/[?&]q=(-?\d{1,3}[.,]\d+),(-?\d{1,3}[.,]\d+)/);
    if (m) {
      const lat = dd(m[1]);
      const lng = dd(m[2]);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
    // 4) Google !3dlat!4dlng
    m = s.match(/!3d(-?\d{1,3}[.,]\d+)!4d(-?\d{1,3}[.,]\d+)/);
    if (m) {
      const lat = dd(m[1]);
      const lng = dd(m[2]);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
    // 5) OSM mlat/mlon
    m = s.match(/[?&]mlat=(-?\d{1,3}[.,]\d+).*?[&]mlon=(-?\d{1,3}[.,]\d+)/);
    if (m) {
      const lat = dd(m[1]);
      const lng = dd(m[2]);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
    // 6) OSM #map=zoom/lat/lon
    m = s.match(/#map=\d+\/(-?\d{1,3}[.,]\d+)\/(-?\d{1,3}[.,]\d+)/);
    if (m) {
      const lat = dd(m[1]);
      const lng = dd(m[2]);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
    // 7) Fallback genérico
    const nums = s.match(/-?\d{1,3}(?:[.,]\d+)?/g);
    if (nums && nums.length >= 2) {
      const lat = dd(nums[0]);
      const lng = dd(nums[1]);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
    return null;
  }
  // Carga dinámica de Leaflet (igual que en MapaViviendas)
  function useLeaflet() {
    const [L, setL] = useState(null);
    useEffect(() => {
      let cancelled = false;
      async function load() {
        if (window.L) {
          setL(window.L);
          return;
        }
        const cssId = "leaflet-css";
        if (!document.getElementById(cssId)) {
          const link = document.createElement("link");
          link.id = cssId;
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }
        await import("https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js")
          .then((mod) => {
            if (!cancelled) setL(mod);
          })
          .catch(async () => {
            const scriptId = "leaflet-umd";
            if (!document.getElementById(scriptId)) {
              const s = document.createElement("script");
              s.id = scriptId;
              s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
              s.onload = () => {
                if (!cancelled) setL(window.L);
              };
              document.body.appendChild(s);
            } else if (window.L) setL(window.L);
          });
      }
      load();
      return () => {
        cancelled = true;
      };
    }, []);
    return L;
  }

  const L = useLeaflet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [constructoras, setConstructoras] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("crear");
  const [selectedProject, setSelectedProject] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    ubicacion: "",
    ubicacion_normalizada: "",
    ubicacion_referencia: "",
    latitud: null,
    longitud: null,
    fecha_inicio: "",
    fecha_entrega: "",
  });
  const [geoState, setGeoState] = useState({
    status: "idle",
    msg: "",
    suggestions: [],
  });
  const [addressLocked, setAddressLocked] = useState(false);
  const mapRef = React.useRef(null);
  const previewMapRef = React.useRef(null);
  const previewMarkerRef = React.useRef(null);
  const pickerMapRef = React.useRef(null);
  const pickerMarkerRef = React.useRef(null);
  const programmaticPanRef = React.useRef(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [proyectosRes, usuariosRes, constructorasRes] =
        await Promise.allSettled([
          adminApi.listarProyectos(),
          adminApi.listarUsuarios(),
          adminApi.listarConstructoras(),
        ]);

      if (proyectosRes.status === "fulfilled") {
        const base = proyectosRes.value.data || [];
        // cargar técnicos por proyecto en paralelo
        const withTechs = await Promise.all(
          base.map(async (p) => {
            try {
              const r = await adminApi.listarTecnicosProyecto(p.id);
              return { ...p, tecnicos: r.data || [] };
            } catch {
              return { ...p, tecnicos: [] };
            }
          })
        );
        setProyectos(withTechs);
      }

      if (usuariosRes.status === "fulfilled") {
        const allUsers = usuariosRes.value.data || [];
        setTecnicos(allUsers.filter((u) => u.rol === "tecnico"));
      }

      if (constructorasRes.status === "fulfilled") {
        setConstructoras(constructorasRes.value.data || []);
      }
    } catch (err) {
      setError(err.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Parseo y validación para lat/lon
    if (name === "latitud" || name === "longitud") {
      const n = toNumber(value);
      const clamped =
        name === "latitud" ? clamp(n, -90, 90) : clamp(n, -180, 180);
      setForm((prev) => ({ ...prev, [name]: clamped }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "ubicacion" && addressLocked) {
      // Solo resetear si ya había una dirección validada y ahora el usuario la está cambiando
      setAddressLocked(false);
      setGeoState({ status: "idle", msg: "", suggestions: [] });
      setForm((prev) => ({
        ...prev,
        ubicacion_normalizada: "",
        latitud: null,
        longitud: null,
      }));
    }
  };

  // (helpers de comuna removidos; aceptamos resultados amplios y validamos por feature)

  const resetForm = () => {
    setForm({
      nombre: "",
      ubicacion: "",
      ubicacion_normalizada: "",
      ubicacion_referencia: "",
      latitud: null,
      longitud: null,
      fecha_inicio: "",
      fecha_entrega: "",
      constructora_id: "",
    });
    setGeoState({ status: "idle", msg: "", suggestions: [] });
  };

  const openModal = (type, project = null) => {
    setModalType(type);
    setSelectedProject(project);

    if (type === "editar" && project) {
      setForm({
        nombre: project.nombre || "",
        ubicacion: project.ubicacion || "",
        ubicacion_normalizada: project.ubicacion_normalizada || "",
        ubicacion_referencia: project.ubicacion_referencia || "",
        latitud: project.latitud ?? null,
        longitud: project.longitud ?? null,
        constructora_id: project.constructora_id
          ? String(project.constructora_id)
          : "",
        fecha_inicio: project.fecha_inicio
          ? String(project.fecha_inicio).split("T")[0]
          : "",
        fecha_entrega: project.fecha_entrega
          ? String(project.fecha_entrega).split("T")[0]
          : "",
      });
    } else {
      resetForm();
    }

    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProject(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      setError("El nombre del proyecto es obligatorio");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Adjuntar normalización/coords si existen
      if (modalType === "crear") {
        await adminApi.crearProyecto(form);
        setSuccess("Proyecto creado exitosamente");
      } else {
        await adminApi.actualizarProyecto(selectedProject.id, form);
        setSuccess("Proyecto actualizado exitosamente");
      }

      closeModal();
      await loadData();
    } catch (err) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  // Autocompletado de dirección con debounce
  useEffect(() => {
    // Si ya se seleccionó/validó una dirección, no buscar de nuevo
    if (addressLocked) {
      setGeoState((s) => ({ ...s, suggestions: [] }));
      return;
    }
    const id = setTimeout(async () => {
      const q = (form.ubicacion || "").trim();
      if (!q || q.length < 3) {
        setGeoState((s) => ({ ...s, suggestions: [] }));
        return;
      }
      try {
        const res = await geoSearch(q);
        setGeoState((s) => ({ ...s, suggestions: res }));
      } catch {
        setGeoState((s) => ({ ...s, suggestions: [] }));
      }
    }, 250);
    return () => clearTimeout(id);
  }, [form.ubicacion, addressLocked]);

  async function handleValidate(place) {
    try {
      setGeoState({ status: "loading", msg: "Validando…", suggestions: [] });
      // Usar coordenadas exactas del ítem seleccionado y enviar el feature + address + comuna/region al backend
      const r = await geoValidate({
        feature: place,
        address: place.place_name,
      });
      setForm((prev) => ({
        ...prev,
        ubicacion: place.place_name,
        ubicacion_normalizada: r.normalized,
        latitud: r.lat,
        longitud: r.lng,
      }));
      setGeoState({ status: "ok", msg: "Dirección validada", suggestions: [] });
      setAddressLocked(true);
    } catch (err) {
      setGeoState({
        status: "error",
        msg: err?.message || "No se pudo validar",
        suggestions: [],
      });
    }
  }

  // Render y actualización del mapa de previsualización (una sola instancia)
  useEffect(() => {
    if (!showModal || !L || !mapRef.current) return;
    if (typeof form.latitud !== "number" || typeof form.longitud !== "number")
      return;
    const center = [form.latitud, form.longitud];
    if (!previewMapRef.current) {
      const m = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, 17);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(m);
      const marker = L.circleMarker(center, {
        radius: 6,
        color: "#22c55e",
        weight: 2,
        fillOpacity: 0.8,
      }).addTo(m);
      previewMapRef.current = m;
      previewMarkerRef.current = marker;
    } else {
      previewMapRef.current.setView(
        center,
        previewMapRef.current.getZoom() || 17
      );
      if (previewMarkerRef.current) previewMarkerRef.current.setLatLng(center);
    }
  }, [L, form.latitud, form.longitud, showModal]);

  // Limpiar instancias al cerrar modal
  useEffect(() => {
    if (!showModal) {
      if (previewMapRef.current) {
        previewMapRef.current.remove();
        previewMapRef.current = null;
      }
      previewMarkerRef.current = null;
      if (pickerMapRef.current) {
        pickerMapRef.current.remove();
        pickerMapRef.current = null;
      }
      pickerMarkerRef.current = null;
    }
  }, [showModal]);

  // Mapa tipo “Uber” para fijar punto arrastrando
  useEffect(() => {
    const el = document.getElementById("project-picker-map");
    if (!el || !L || !showModal) return;
    const hasCoords =
      typeof form.latitud === "number" && typeof form.longitud === "number";
    const center = hasCoords ? [form.latitud, form.longitud] : [-33.45, -70.66];
    if (!pickerMapRef.current) {
      programmaticPanRef.current = true;
      const m = L.map(el, {
        zoomControl: true,
        attributionControl: false,
      }).setView(center, hasCoords ? 17 : 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(m);
      const marker = L.marker(center, { draggable: true }).addTo(m);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        setForm((prev) => ({ ...prev, latitud: lat, longitud: lng }));
      });
      // Solo sincronizar coordenadas cuando el usuario mueve el mapa (no en pans programáticos)
      let userPanning = false;
      m.on("movestart", () => {
        userPanning = !programmaticPanRef.current;
      });
      m.on("moveend", () => {
        const c = m.getCenter();
        if (programmaticPanRef.current) {
          // Consumir el pan programático
          programmaticPanRef.current = false;
          return;
        }
        if (userPanning) {
          marker.setLatLng(c);
          setForm((prev) => ({ ...prev, latitud: c.lat, longitud: c.lng }));
        }
        userPanning = false;
      });
      pickerMapRef.current = m;
      pickerMarkerRef.current = marker;
    } else {
      programmaticPanRef.current = true;
      pickerMapRef.current.setView(
        center,
        pickerMapRef.current.getZoom() || (hasCoords ? 17 : 5)
      );
      if (pickerMarkerRef.current) pickerMarkerRef.current.setLatLng(center);
    }
  }, [L, showModal, form.latitud, form.longitud]);

  const handleDelete = async (project) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar el proyecto "${project.nombre}"?`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await adminApi.eliminarProyecto(project.id);
      setSuccess("Proyecto eliminado exitosamente");
      await loadData();
    } catch (err) {
      setError(err.message || "Error al eliminar el proyecto");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTechnician = async (projectId, technicianId) => {
    setLoading(true);
    setError("");

    try {
      await adminApi.asignarTecnicoProyecto(projectId, technicianId);
      setSuccess("Técnico asignado exitosamente");
      await loadData();
    } catch (err) {
      setError(err.message || "Error al asignar técnico");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTechnician = async (projectId, technicianId) => {
    if (!window.confirm("¿Remover técnico del proyecto?")) return;
    setLoading(true);
    setError("");
    try {
      await adminApi.removerTecnicoProyecto(projectId, technicianId);
      setSuccess("Técnico removido");
      await loadData();
    } catch (err) {
      setError(err.message || "Error al remover técnico");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No definida";
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  const getStatusColor = (status) => {
    const colors = {
      activo: "bg-green-100 text-green-800",
      pausado: "bg-yellow-100 text-yellow-800",
      completado: "bg-blue-100 text-blue-800",
      cancelado: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading && proyectos.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando proyectos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Gestión de Proyectos
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                Administrar proyectos de vivienda y asignar técnicos
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => navigate("/home")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Volver
              </button>
              <button
                onClick={() => openModal("crear")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nuevo Proyecto
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <SectionPanel title="Lista de Proyectos">
          <div className="grid gap-6">
            {proyectos.length > 0 ? (
              proyectos.map((proyecto) => (
                <div
                  key={proyecto.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-sm transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {proyecto.nombre}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            proyecto.estado
                          )}`}
                        >
                          {proyecto.estado}
                        </span>
                      </div>
                      {/* Constructora asignada */}
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-200">Constructora:</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800/20 dark:text-indigo-200">
                            {constructoras.find((c) => String(c.id) === String(proyecto.constructora_id))?.nombre || 'Sin asignar'}
                          </span>
                        </span>
                      </div>
                      {/* Descripción no disponible en el esquema actual */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Ubicación:</span>{" "}
                          {proyecto.ubicacion || "No especificada"}
                        </div>
                        <div>
                          <span className="font-medium">Inicio:</span>{" "}
                          {formatDate(proyecto.fecha_inicio)}
                        </div>
                        <div>
                          <span className="font-medium">Entrega:</span>{" "}
                          {formatDate(proyecto.fecha_entrega)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal("editar", proyecto)}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(proyecto)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Técnicos Asignados
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {proyecto.tecnicos && proyecto.tecnicos.length > 0 ? (
                        proyecto.tecnicos.map((tecnico) => (
                          <span
                            key={tecnico.uid}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded group"
                          >
                            {tecnico.nombre}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveTechnician(proyecto.id, tecnico.uid)
                              }
                              className="opacity-60 group-hover:opacity-100 text-xs px-1 rounded bg-red-200 text-red-700 hover:bg-red-300"
                              title="Remover"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Sin técnicos asignados</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignTechnician(proyecto.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 rounded"
                        disabled={loading}
                      >
                        <option value="">Asignar técnico...</option>
                        {tecnicos.map((tecnico) => (
                          <option key={tecnico.uid} value={tecnico.uid}>
                            {tecnico.nombre} ({tecnico.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  No hay proyectos registrados
                </p>
                <button
                  onClick={() => openModal("crear")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Primer Proyecto
                </button>
              </div>
            )}
          </div>
        </SectionPanel>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto overscroll-contain p-6">
              <h3 className="text-lg font-semibold mb-4">
                {modalType === "crear"
                  ? "Crear Nuevo Proyecto"
                  : "Editar Proyecto"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Proyecto
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Descripción removida: no está en el esquema actual */}

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={form.ubicacion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {geoState.suggestions.length > 0 && !addressLocked && (
                    <div className="absolute z-[1200] mt-1 w-full bg-white text-gray-800 border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto">
                      {geoState.suggestions.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => handleValidate(s)}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          {s.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {addressLocked && (
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAddressLocked(false);
                          setGeoState((s) => ({ ...s, suggestions: [] }));
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Cambiar dirección
                      </button>
                    </div>
                  )}
                  <div className="mt-1 text-xs">
                    {geoState.status === "loading" && (
                      <span className="text-gray-500">{geoState.msg}</span>
                    )}
                    {geoState.status === "ok" && (
                      <span className="text-green-600">
                        {geoState.msg}
                        {form.ubicacion_normalizada
                          ? ` · ${form.ubicacion_normalizada}`
                          : ""}
                      </span>
                    )}
                    {geoState.status === "error" && (
                      <span className="text-red-600">{geoState.msg}</span>
                    )}
                  </div>
                  {typeof form.latitud === "number" &&
                  typeof form.longitud === "number" ? (
                    <>
                      <div
                        className="mt-2 w-full h-48 rounded border border-gray-200 overflow-hidden"
                        ref={mapRef}
                      ></div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span>
                          Lat: {Number(form.latitud).toFixed(6)}, Lng:{" "}
                          {Number(form.longitud).toFixed(6)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${form.latitud},${form.longitud}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Abrir en Google Maps
                        </a>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${form.latitud}&mlon=${form.longitud}#map=19/${form.latitud}/${form.longitud}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Ver en OpenStreetMap
                        </a>
                      </div>
                    </>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia (si no existe calle aún)
                  </label>
                  <input
                    type="text"
                    name="ubicacion_referencia"
                    value={form.ubicacion_referencia}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Loteo Los Pinos, manzana B, frente a sede vecinal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Constructora
                  </label>
                  <select
                    name="constructora_id"
                    value={form.constructora_id || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sin asignar</option>
                    {constructoras.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded border border-gray-200 p-3">
                  <h4 className="text-sm font-medium mb-2">
                    Otras formas de fijar ubicación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fijar punto en el mapa (arrastrar)
                      </label>
                      <div
                        id="project-picker-map"
                        className="w-full h-72 rounded border border-gray-200 overflow-hidden"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Arrastra el mapa y pin para ajustar la ubicación. Se
                        guardarán las coordenadas elegidas.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ingresar coordenadas manualmente
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.000001"
                          name="latitud"
                          value={form.latitud ?? ""}
                          onChange={handleInputChange}
                          placeholder="Latitud"
                          className="w-1/2 px-3 py-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="number"
                          step="0.000001"
                          name="longitud"
                          value={form.longitud ?? ""}
                          onChange={handleInputChange}
                          placeholder="Longitud"
                          className="w-1/2 px-3 py-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Puedes usar punto o coma. Validamos el rango
                        automáticamente.
                      </p>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pegar coordenadas o enlace (Google/OSM)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ej: -33.578015,-70.708008 o enlace de Google Maps/OSM"
                            className="flex-1 px-3 py-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const value = e.currentTarget.value || "";
                                const parsed = parseLatLngFromText(value);
                                if (parsed) {
                                  setForm((prev) => ({
                                    ...prev,
                                    latitud: parsed.lat,
                                    longitud: parsed.lng,
                                  }));
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="px-3 py-2 border rounded bg-gray-50 hover:bg-gray-100"
                            onClick={(e) => {
                              const input =
                                e.currentTarget.parentElement?.querySelector(
                                  'input[type="text"]'
                                );
                              const value = input?.value || "";
                              const parsed = parseLatLngFromText(value);
                              if (parsed) {
                                setForm((prev) => ({
                                  ...prev,
                                  latitud: parsed.lat,
                                  longitud: parsed.lng,
                                }));
                              }
                            }}
                          >
                            Aplicar
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Acepta: "-33.57,-70.70" (punto o coma), enlaces con
                          @lat,lng o q=lat,lng, OSM con mlat/mlon, o el formato
                          !3dlat!4dlng.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={form.fecha_inicio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Entrega
                    </label>
                    <input
                      type="date"
                      name="fecha_entrega"
                      value={form.fecha_entrega}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Estado y Coordinador removidos: no están en el esquema actual */}

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                  >
                    {loading
                      ? "Procesando..."
                      : modalType === "crear"
                      ? "Crear Proyecto"
                      : "Actualizar Proyecto"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 min-w-[110px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      navigate("/home");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 min-w-[140px]"
                  >
                    Volver al Inicio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
