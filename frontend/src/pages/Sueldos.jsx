import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/auth-context';
import api from '../services/api';
import { CurrencyDollarIcon, DocumentTextIcon, CheckBadgeIcon, ExclamationCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { CircularProgress, Autocomplete, TextField } from '@mui/material';

export default function Sueldos() {
  const { isAdmin } = useContext(AuthContext);
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [empleados, setEmpleados] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Detailed View State
  const [selectedLiquidacion, setSelectedLiquidacion] = useState(null);
  const [conceptoForm, setConceptoForm] = useState({ tipo: 'PLUS', descripcion: '', monto: '' });
  const [conceptoSubmitting, setConceptoSubmitting] = useState(false);
  const [conceptoDialogOpen, setConceptoDialogOpen] = useState(false);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const today = new Date();
  const [formData, setFormData] = useState({
    empleado: '',
    periodo_mes: today.getMonth() + 1,
    periodo_anio: today.getFullYear(),
    fecha_desde: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`,
    fecha_hasta: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate().toString().padStart(2, '0')}`
  });

  const [fullMonth, setFullMonth] = useState(true);

  useEffect(() => {
    if (fullMonth) {
      const year = parseInt(formData.periodo_anio);
      const month = parseInt(formData.periodo_mes);
      if (year && month) {
        const endDate = new Date(year, month, 0);
        setFormData(prev => ({
          ...prev,
          fecha_desde: `${year}-${month.toString().padStart(2, '0')}-01`,
          fecha_hasta: `${year}-${month.toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`
        }));
      }
    }
  }, [fullMonth, formData.periodo_mes, formData.periodo_anio]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('sueldos/liquidaciones/');
      setLiquidaciones(res.data);

      if (isAdmin) {
        const empRes = await api.get('usuarios/');
        setEmpleados(empRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const handleOpenModal = () => {
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        periodo_mes: parseInt(formData.periodo_mes),
        periodo_anio: parseInt(formData.periodo_anio),
      };
      const res = await api.post('sueldos/liquidaciones/', payload);
      setLiquidaciones([res.data, ...liquidaciones]);
      setIsModalOpen(false);
    } catch (err) {
      const msgs = err.response?.data ? Object.values(err.response.data).flat().join(', ') : 'Error al crear liquidación.';
      setFormError(msgs);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerarDetalles = async (id) => {
    setLoadingDetalles(true);
    try {
      const res = await api.post(`sueldos/liquidaciones/${id}/generar_detalles/`);
      setLiquidaciones(liquidaciones.map(liq => liq.id === id ? res.data : liq));
      if (selectedLiquidacion?.id === id) setSelectedLiquidacion(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al generar detalles');
    } finally {
      setLoadingDetalles(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setLoadingStatus(newStatus);
    try {
      const res = await api.patch(`sueldos/liquidaciones/${id}/`, { estado: newStatus });
      setLiquidaciones(liquidaciones.map(liq => liq.id === id ? res.data : liq));
      if (selectedLiquidacion?.id === id) {
        setSelectedLiquidacion(res.data);
      }
    } catch (err) {
      alert('Error al cambiar el estado de la liquidación.');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleAddConcepto = async (e) => {
    e.preventDefault();
    if (!selectedLiquidacion) return;
    setConceptoSubmitting(true);
    try {
      await api.post('sueldos/conceptos/', {
        liquidacion: selectedLiquidacion.id,
        tipo: conceptoForm.tipo,
        descripcion: conceptoForm.descripcion,
        monto: parseFloat(conceptoForm.monto)
      });
      // Refresh liquidacion to get new totals and new list of conceptos
      const res = await api.get(`sueldos/liquidaciones/${selectedLiquidacion.id}/`);
      setSelectedLiquidacion(res.data);
      setLiquidaciones(liquidaciones.map(liq => liq.id === res.data.id ? res.data : liq));
      setConceptoForm({ tipo: 'PLUS', descripcion: '', monto: '' });
    } catch (err) {
      alert('Error al agregar el concepto.');
    } finally {
      setConceptoSubmitting(false);
    }
  };

  const handleDeleteConcepto = async (conceptoId) => {
    try {
      await api.delete(`sueldos/conceptos/${conceptoId}/`);
      const res = await api.get(`sueldos/liquidaciones/${selectedLiquidacion.id}/`);
      setSelectedLiquidacion(res.data);
      setLiquidaciones(liquidaciones.map(liq => liq.id === res.data.id ? res.data : liq));
    } catch (err) {
      alert('Error al eliminar el concepto.');
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'BORRADOR': return <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-200">Borrador</span>;
      case 'CERRADA': return <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md text-xs font-medium border border-blue-200">Cerrada</span>;
      case 'PAGADA': return <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-200"><CheckBadgeIcon className="w-3.5 h-3.5" /> Pagada</span>;
      default: return <span className="text-gray-500">{estado}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <CircularProgress size={32} sx={{ color: '#111111' }} />
      </div>
    );
  }

  return (
    <div className="w-full h-full py-2 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-gray-200 pb-4">
        <div>
          {selectedLiquidacion ? (
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedLiquidacion(null)} className="text-gray-400 hover:text-gray-600 font-medium text-sm">
                ← Volver
              </button>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">Detalle del Recibo</h1>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                {isAdmin ? 'Gestión de Sueldos' : 'Mis Recibos'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isAdmin ? 'Liquidaciones y pagos de nómina' : 'Historial de tus liquidaciones mensuales'}
              </p>
            </>
          )}
        </div>
        {isAdmin && !selectedLiquidacion && (
          <button
            onClick={handleOpenModal}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors whitespace-nowrap"
          >
            + Nueva Liquidación
          </button>
        )}
      </div>

      {selectedLiquidacion ? (
        <div className="flex flex-col" style={{ minHeight: 0 }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{selectedLiquidacion.nombre_empleado || `Empleado #${selectedLiquidacion.empleado}`}</p>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-medium text-gray-900">
                  Liquidación {selectedLiquidacion.periodo_mes}/{selectedLiquidacion.periodo_anio}
                </h2>
                {getStatusBadge(selectedLiquidacion.estado)}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{selectedLiquidacion.fecha_desde} — {selectedLiquidacion.fecha_hasta}</p>
            </div>
            {isAdmin && selectedLiquidacion.estado === 'BORRADOR' && (
              <button
                onClick={() => { setConceptoDialogOpen(true); setConceptoForm({ tipo: 'PLUS', descripcion: '', monto: '' }); }}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors"
              >
                <PlusCircleIcon className="w-4 h-4 text-gray-500" /> Agregar Concepto
              </button>
            )}
          </div>

          {/* Week cards row */}
          {(() => {
            const byWeek = {};
            (selectedLiquidacion.detalle_horas || []).forEach(d => {
              const w = d.semana || 1;
              if (!byWeek[w]) byWeek[w] = [];
              byWeek[w].push(d);
            });
            const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const weeks = Object.keys(byWeek).sort((a, b) => Number(a) - Number(b));

            if (weeks.length === 0) {
              return (
                <div className="flex items-center justify-center bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Sin días calculados aún.</p>
                    {isAdmin && (
                      <button onClick={() => handleGenerarDetalles(selectedLiquidacion.id)} className="mt-2 text-sm text-blue-600 hover:underline">
                        Calcular desde horarios →
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
                {weeks.map(w => {
                  const dias = byWeek[w];
                  const totalSem = dias.reduce((s, d) => s + parseFloat(d.horas || 0), 0);
                  const montoSem = dias.reduce((s, d) => s + parseFloat(d.subtotal || 0), 0);
                  return (
                    <div key={w} className="w-[260px] shrink-0 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                      <div className="px-4 py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <span className="text-[11px] font-semibold text-gray-800 uppercase tracking-wider">Semana {w}</span>
                        <span className="text-[10px] text-gray-500">{totalSem.toFixed(1)}hs</span>
                      </div>
                      <div className="divide-y divide-gray-50 flex-1">
                        {dias.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).map(d => {
                          const dt = new Date(d.fecha + 'T00:00:00');
                          return (
                            <div key={d.id} className="px-4 py-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-800">{DIAS[dt.getDay()]} {dt.getDate()} {MESES[dt.getMonth()]}</span>
                                <span className="text-xs font-semibold text-gray-900">{parseFloat(d.horas).toFixed(1)} hs</span>
                              </div>
                              <p className="text-[12px] text-black mt-0.5 leading-tight">
                                {d.sucursal_nombre || '—'}
                                {d.hora_inicio && d.hora_fin ? ` · ${d.hora_inicio.slice(0, 5)} - ${d.hora_fin.slice(0, 5)}` : ''}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/30">
                        <p className="text-[14px] text-black font-bold text-right">${montoSem.toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Conceptos column */}
                {(selectedLiquidacion.conceptos || []).length > 0 && (
                  <div className="min-w-[175px] flex-none bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                      <span className="text-[11px] font-semibold text-gray-800 uppercase tracking-wider">Conceptos</span>
                    </div>
                    <div className="divide-y divide-gray-50 flex-1">
                      {selectedLiquidacion.conceptos.map(c => (
                        <div key={c.id} className="px-3 py-2 flex justify-between items-center gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate leading-tight">{c.descripcion}</p>
                            <p className="text-[10px] text-gray-400">{c.tipo}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-xs font-semibold ${['PLUS', 'AJUSTE'].includes(c.tipo) ? 'text-emerald-600' : 'text-red-500'}`}>
                              {['PLUS', 'AJUSTE'].includes(c.tipo) ? '+' : '-'}${parseFloat(c.monto).toLocaleString('es-AR')}
                            </span>
                            {isAdmin && selectedLiquidacion.estado === 'BORRADOR' && (
                              <button onClick={() => handleDeleteConcepto(c.id)} className="text-gray-300 hover:text-red-500 ml-1 text-xs transition-colors">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Bottom bar: summary + actions */}
          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Horas</p>
                <p className="text-sm font-semibold text-gray-900">{parseFloat(selectedLiquidacion.total_horas || 0).toFixed(1)} hs</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Monto Horas</p>
                <p className="text-sm font-semibold text-gray-900">${parseFloat(selectedLiquidacion.monto_horas || 0).toLocaleString('es-AR')}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Plus / Ajustes</p>
                <p className="text-sm font-semibold text-emerald-600">+${(parseFloat(selectedLiquidacion.total_plus || 0) + parseFloat(selectedLiquidacion.total_ajustes || 0)).toLocaleString('es-AR')}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Desc. / Adelantos</p>
                <p className="text-sm font-semibold text-red-500">-${(parseFloat(selectedLiquidacion.total_descuentos || 0) + parseFloat(selectedLiquidacion.total_adelantos || 0)).toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-gray-900 text-white px-4 py-2 rounded-xl flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest opacity-60">Neto</span>
                <span className="text-base font-light">${parseFloat(selectedLiquidacion.total_neto || 0).toLocaleString('es-AR')}</span>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                {selectedLiquidacion.estado === 'BORRADOR' && (
                  <>
                    <button
                      onClick={() => handleGenerarDetalles(selectedLiquidacion.id)}
                      disabled={loadingDetalles || loadingStatus}
                      className="text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      {loadingDetalles ? <span className="btn-spinner" /> : null}
                      {loadingDetalles ? 'Calculando...' : 'Recalcular Horas'}
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedLiquidacion.id, 'CERRADA')}
                      disabled={loadingStatus || loadingDetalles}
                      className="text-sm font-medium text-white bg-gray-900 hover:bg-black px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      {loadingStatus === 'CERRADA' ? <span className="btn-spinner" /> : null}
                      {loadingStatus === 'CERRADA' ? 'Confirmando...' : 'Confirmar Liquidación'}
                    </button>
                  </>
                )}
                {selectedLiquidacion.estado === 'CERRADA' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedLiquidacion.id, 'BORRADOR')}
                      disabled={!!loadingStatus}
                      className="text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      {loadingStatus === 'BORRADOR' ? <span className="btn-spinner" /> : null}
                      {loadingStatus === 'BORRADOR' ? 'Revirtiendo...' : 'Revertir a Borrador'}
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedLiquidacion.id, 'PAGADA')}
                      disabled={!!loadingStatus}
                      className="text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                    >
                      {loadingStatus === 'PAGADA' ? <span className="btn-spinner" /> : <CheckBadgeIcon className="w-4 h-4" />}
                      {loadingStatus === 'PAGADA' ? 'Procesando...' : 'Marcar Pagada'}
                    </button>
                  </>
                )}
                {selectedLiquidacion.estado === 'PAGADA' && (
                  <button
                    onClick={() => handleStatusChange(selectedLiquidacion.id, 'BORRADOR')}
                    disabled={!!loadingStatus}
                    className="text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    {loadingStatus === 'BORRADOR' ? <span className="btn-spinner" /> : null}
                    {loadingStatus === 'BORRADOR' ? 'Revirtiendo...' : 'Revertir a Borrador'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : liquidaciones.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No hay liquidaciones</h3>
          <p className="text-gray-500 mt-1">Aún no se ha generado ningún recibo de sueldo.</p>
        </div>
      ) : isAdmin ? (
        /* ── Admin table view ────────────────────────────── */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Horas</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Neto</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liquidaciones.map(liq => (
                  <tr key={liq.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedLiquidacion(liq)}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{liq.periodo_mes}/{liq.periodo_anio}</div>
                      <div className="text-xs text-gray-500">{liq.fecha_desde} al {liq.fecha_hasta}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{liq.nombre_empleado || `Emp #${liq.empleado}`}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {parseFloat(liq.total_horas || 0).toFixed(1)} hs
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">${parseFloat(liq.total_neto || 0).toLocaleString('es-AR')}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(liq.estado)}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      {liq.estado === 'BORRADOR' && (
                        <button
                          onClick={() => handleGenerarDetalles(liq.id)}
                          disabled={loadingDetalles}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          {loadingDetalles ? <span className="btn-spinner" /> : null}
                          Calcular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Employee receipt cards view ─────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liquidaciones.map(liq => {
            const isPagada = liq.estado === 'PAGADA';
            const isCerrada = liq.estado === 'CERRADA';
            const MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            return (
              <div
                key={liq.id}
                onClick={() => setSelectedLiquidacion(liq)}
                className={`bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isPagada ? 'border-emerald-200' : 'border-gray-200'}`}
              >
                {/* Card header */}
                <div className={`px-5 py-4 ${isPagada ? 'bg-emerald-50/60' : isCerrada ? 'bg-blue-50/40' : 'bg-gray-50/50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500">{liq.fecha_desde} — {liq.fecha_hasta}</p>
                      <h3 className="text-lg font-semibold text-gray-900 mt-0.5">
                        {MESES_FULL[(liq.periodo_mes - 1)]} {liq.periodo_anio}
                      </h3>
                    </div>
                    {getStatusBadge(liq.estado)}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 mx-5" />

                {/* Card body */}
                <div className="px-5 py-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Horas trabajadas</span>
                    <span className="text-sm font-medium text-gray-900">{parseFloat(liq.total_horas || 0).toFixed(1)} hs</span>
                  </div>
                  {(parseFloat(liq.total_plus || 0) + parseFloat(liq.total_ajustes || 0)) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Plus / Ajustes</span>
                      <span className="text-sm font-medium text-emerald-600">
                        +${(parseFloat(liq.total_plus || 0) + parseFloat(liq.total_ajustes || 0)).toLocaleString('es-AR')}
                      </span>
                    </div>
                  )}
                  {(parseFloat(liq.total_descuentos || 0) + parseFloat(liq.total_adelantos || 0)) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Descuentos / Adelantos</span>
                      <span className="text-sm font-medium text-red-500">
                        -${(parseFloat(liq.total_descuentos || 0) + parseFloat(liq.total_adelantos || 0)).toLocaleString('es-AR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card footer: neto */}
                <div className={`px-5 py-3 flex justify-between items-center ${isPagada ? 'bg-emerald-600' : 'bg-gray-900'}`}>
                  <span className="text-[10px] uppercase tracking-widest text-white/60 font-medium">Total Neto</span>
                  <span className="text-base font-semibold text-white">${parseFloat(liq.total_neto || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Nueva Liquidación</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Autocomplete
                    options={empleados}
                    getOptionLabel={(opt) => opt.nombre || opt.username || ''}
                    value={empleados.find(e => String(e.id) === String(formData.empleado)) || null}
                    onChange={(_, newVal) => setFormData({ ...formData, empleado: newVal?.id || '' })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Empleado"
                        required
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#f9fafb', fontSize: '14px' },
                          '& .MuiInputLabel-root': { fontSize: '14px' }
                        }}
                      />
                    )}
                    noOptionsText="Sin resultados"
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                    <input
                      type="number"
                      required
                      min="1" max="12"
                      value={formData.periodo_mes}
                      onChange={e => setFormData({ ...formData, periodo_mes: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                    <input
                      type="number"
                      required
                      min="2020" max="2100"
                      value={formData.periodo_anio}
                      onChange={e => setFormData({ ...formData, periodo_anio: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 mb-2">
                  <input
                    type="checkbox"
                    id="fullMonth"
                    checked={fullMonth}
                    onChange={(e) => setFullMonth(e.target.checked)}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <label htmlFor="fullMonth" className="text-sm font-medium text-gray-700">Liquidar Mes Completo</label>
                </div>

                {!fullMonth && (
                  <div className="grid grid-cols-2 gap-4 transition-all">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Desde Fecha</label>
                      <input
                        type="date"
                        required
                        value={formData.fecha_desde}
                        onChange={e => setFormData({ ...formData, fecha_desde: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 bg-gray-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hasta Fecha</label>
                      <input
                        type="date"
                        required
                        value={formData.fecha_hasta}
                        onChange={e => setFormData({ ...formData, fecha_hasta: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 bg-gray-50 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creando...' : 'Crear Borrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Concepto Dialog */}
      {conceptoDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setConceptoDialogOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-medium text-gray-900">Agregar Concepto</h3>
              <button onClick={() => setConceptoDialogOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none">✕</button>
            </div>
            <form onSubmit={async (e) => { await handleAddConcepto(e); setConceptoDialogOpen(false); }} className="p-5 space-y-4">
              <div>
                <Autocomplete
                  options={[
                    { value: 'PLUS', label: 'Plus (suma al neto)' },
                    { value: 'AJUSTE', label: 'Ajuste (suma al neto)' },
                    { value: 'DESCUENTO', label: 'Descuento (resta del neto)' },
                    { value: 'ADELANTO', label: 'Adelanto (resta del neto)' },
                  ]}
                  getOptionLabel={(opt) => opt.label}
                  value={{ value: conceptoForm.tipo, label: { PLUS: 'Plus (suma al neto)', AJUSTE: 'Ajuste (suma al neto)', DESCUENTO: 'Descuento (resta del neto)', ADELANTO: 'Adelanto (resta del neto)' }[conceptoForm.tipo] }}
                  onChange={(_, newVal) => newVal && setConceptoForm({ ...conceptoForm, tipo: newVal.value })}
                  disableClearable
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tipo"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#f9fafb', fontSize: '14px' },
                        '& .MuiInputLabel-root': { fontSize: '14px' }
                      }}
                    />
                  )}
                  isOptionEqualToValue={(opt, val) => opt.value === val.value}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Descripción</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. Premio por puntualidad"
                  value={conceptoForm.descripcion}
                  onChange={e => setConceptoForm({ ...conceptoForm, descripcion: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Monto ($)</label>
                <input
                  type="number"
                  required
                  min="0.01" step="0.01"
                  placeholder="0.00"
                  value={conceptoForm.monto}
                  onChange={e => setConceptoForm({ ...conceptoForm, monto: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 bg-gray-50"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setConceptoDialogOpen(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={conceptoSubmitting}
                  className="flex-1 bg-gray-900 text-white py-2 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50">
                  {conceptoSubmitting ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
