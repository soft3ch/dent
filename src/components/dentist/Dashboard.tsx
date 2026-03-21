'use client';
import React, { useState, useTransition } from 'react';
import { 
  Building2, Calendar, Users, BarChart2, Settings, HelpCircle, Bell, ChevronLeft, ChevronRight, Ban, CalendarX, MessageCircle, BriefcaseMedical, Plus, X, Check, Loader2, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useDashboardData } from '@/application/use-cases/useDashboardData';
import { useRealtimeAppointments } from '@/application/use-cases/useRealtimeAppointments';
import { addScheduleBlock, updateAppointmentStatus, checkOverlappingAppointments } from '@/application/use-cases/dashboard-actions';
import { startOfWeek, endOfWeek, format, eachDayOfInterval, addDays, subDays, isSameDay, startOfDay, endOfDay, differenceInMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  // Initialize realtime listener
  useRealtimeAppointments();

  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const startIso = currentWeekStart.toISOString();
  // Using native Date for end of week since endOfWeek gives 23:59:59 local, need it absolute
  const endOfWeekDate = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const endIso = endOfWeekDate.toISOString();

  const { data, isLoading } = useDashboardData(startIso, endIso);

  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockMode, setBlockMode] = useState<'range' | 'fullDay' | 'dateRange'>('range');
  const [blockForm, setBlockForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', reason: '' });
  const [conflictCount, setConflictCount] = useState<number | null>(null);
  
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Deriving weekly days
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: endOfWeekDate });

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(subDays(currentWeekStart, 7));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Sidebar Filtering
  const todayAppointments = (data?.appointments || []).filter((app: any) => isSameDay(new Date(app.start_time), new Date())).sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const openWhatsApp = (phone: string, name: string, time: string) => {
    const timeFormatted = format(new Date(time), 'HH:mm');
    const text = encodeURIComponent(`Hola ${name}, te recordamos tu turno hoy a las ${timeFormatted} en Clinical Serenity.`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleCreateBlock = async () => {
    if (!blockForm.date) return;
    
    let startIso = '';
    let endIso = '';
    
    if (blockMode === 'range') {
      if (!blockForm.startTime || !blockForm.endTime) return;
      startIso = new Date(`${blockForm.date}T${blockForm.startTime}:00`).toISOString();
      endIso = new Date(`${blockForm.date}T${blockForm.endTime}:00`).toISOString();
    } else if (blockMode === 'fullDay') {
      startIso = new Date(`${blockForm.date}T00:00:00`).toISOString();
      endIso = new Date(`${blockForm.date}T23:59:59`).toISOString();
    } else {
      if (!blockForm.endDate) return;
      startIso = new Date(`${blockForm.date}T00:00:00`).toISOString();
      endIso = new Date(`${blockForm.endDate}T23:59:59`).toISOString();
    }

    startTransition(async () => {
      try {
        if (conflictCount === null) {
          const count = await checkOverlappingAppointments(startIso, endIso);
          if (count > 0) {
            setConflictCount(count);
            return;
          }
        }
        
        await addScheduleBlock(startIso, endIso, blockForm.reason);
        closeBlockModal();
      } catch (err: any) {
        alert("Error al bloquear horario: " + err.message);
      }
    });
  };

  const closeBlockModal = () => {
    setIsBlockModalOpen(false);
    setConflictCount(null);
    setBlockMode('range');
    setBlockForm({ date: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', reason: '' });
  };

  const handleChangeStatus = async (status: 'completed' | 'cancelled') => {
    if (!selectedAppointment) return;
    startTransition(async () => {
      try {
        await updateAppointmentStatus(selectedAppointment.id, status);
        setStatusModalOpen(false);
        setSelectedAppointment(null);
      } catch (err: any) {
        alert("Error al actualizar: " + err.message);
      }
    });
  };

  // Rendering logic for grid
  // 1 minute = 2 pixels. So 1 hour = 120 pixels. 30 mins = 60 pixels.
  const getStyleForTime = (startIso: string, durationMins: number) => {
    const d = new Date(startIso);
    const startHour = 8; // Calendar starts at 8:00 AM
    const minutesFromStart = ((d.getHours() - startHour) * 60) + d.getMinutes();
    return {
      top: `${minutesFromStart * 2}px`,
      height: `${durationMins * 2}px`,
      minHeight: '3rem'
    };
  };

  return (
    <div className="flex h-screen bg-surface font-body overflow-hidden">
      {/* SideNavBar */}
      <aside className="w-64 fixed left-0 top-0 h-full hidden lg:flex flex-col bg-slate-50 dark:bg-slate-950 p-4 gap-2 z-40 border-r border-transparent">
        <div className="flex items-center gap-3 px-3 py-6">
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shadow-sm">
            <Building2 className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-blue-700 dark:text-blue-400 leading-tight">Serenity Dental</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Premium Oral Care</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 mt-4">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold rounded-xl shadow-sm">
            <Calendar size={20} /><span>Schedule</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-200/50 rounded-xl transition-all"><Users size={20} /><span>Patients</span></a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 h-screen overflow-y-auto w-full">
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl h-16 flex justify-between items-center px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-headline">Dashboard</h2>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            {isLoading && <Loader2 size={16} className="animate-spin text-primary" />}
            <button className="p-2 hover:bg-slate-50 rounded-full"><Bell size={20} /></button>
            <div className="h-8 w-8 rounded-full bg-slate-200 ml-2"></div>
          </div>
        </header>

        <div className="pt-8 px-8 pb-12 grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Calendar Area */}
          <div className="col-span-1 xl:col-span-9 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h3 className="text-3xl font-extrabold text-on-surface font-headline -tracking-tight capitalize">Vista Semanal</h3>
                <p className="text-on-surface-variant text-sm mt-1">{format(currentWeekStart, 'MMMM d', { locale: es })} - {format(endOfWeekDate, 'MMMM d, yyyy', { locale: es })}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={goToToday} className="px-4 py-2 bg-surface-container-high rounded-xl text-primary font-semibold hover:bg-surface-container-highest transition-colors">Hoy</button>
                <div className="flex bg-surface-container-low p-1 rounded-xl">
                  <button onClick={prevWeek} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronLeft size={16}/></button>
                  <button onClick={nextWeek} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronRight size={16}/></button>
                </div>
                <button 
                  onClick={() => setIsBlockModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-error-container/30 text-error font-bold rounded-xl hover:bg-error-container/50 transition-all">
                  <Ban size={20} /> Bloquear Horario
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="bg-surface-container-low rounded-[2rem] p-6 shadow-sm overflow-hidden overflow-x-auto">
              <div className="min-w-[800px] grid grid-cols-8 gap-px bg-outline-variant/10">
                {/* Time Axis */}
                <div className="bg-surface-container-low pt-12 text-[11px] font-bold text-slate-400 text-center relative" style={{ height: '1600px' }}>
                  {[...Array(13)].map((_, i) => (
                    <div key={i} className="absolute w-full" style={{ top: `${i * 120 + 48}px` }}>{i + 8}:00</div>
                  ))}
                </div>

                {/* Day Columns */}
                {weekDays.map((day) => {
                  const dayApps = (data?.appointments || []).filter((a: any) => isSameDay(new Date(a.start_time), day));
                  
                  // Blocks that intersect with this day
                  const dayBlocks = (data?.blocks || []).filter((b: any) => {
                    const blockStart = new Date(b.start_time);
                    const blockEnd = new Date(b.end_time);
                    const dayStart = startOfDay(day);
                    const dayEnd = endOfDay(day);
                    return blockStart < dayEnd && blockEnd > dayStart;
                  });

                  return (
                    <div key={day.toISOString()} className={`bg-surface-container-low relative border-l border-outline-variant/10`} style={{ height: '1600px' }}>
                      <div className="text-center py-2 text-xs font-bold text-slate-500 mb-4 sticky top-0 bg-surface-container-low z-30 w-full capitalize shadow-sm">
                        {format(day, 'EEE d', { locale: es })}
                      </div>
                      
                      <div className="relative w-full h-full mt-10">
                        {/* Blocks */}
                        {dayBlocks.map((blk: any) => {
                          const blockStart = new Date(blk.start_time);
                          const blockEnd = new Date(blk.end_time);
                          const dayStart = startOfDay(day);
                          const dayEnd = endOfDay(day);
                          
                          const renderStart = blockStart > dayStart ? blockStart : dayStart;
                          const renderEnd = blockEnd < dayEnd ? blockEnd : dayEnd;
                          
                          const duration = differenceInMinutes(renderEnd, renderStart);
                          
                          return (
                            <div 
                              key={blk.id}
                              className={`absolute left-1 right-1 border-l-4 border-slate-400 rounded-lg p-2 flex flex-col justify-center items-center overflow-hidden z-10 opacity-60
                                bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,theme('colors.slate.200')_10px,theme('colors.slate.200')_20px)]
                                dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,theme('colors.slate.800')_10px,theme('colors.slate.800')_20px)]
                              `}
                              style={getStyleForTime(renderStart.toISOString(), duration)}
                            >
                              <CalendarX className="text-slate-500 mb-1 bg-white/50 backdrop-blur rounded-full p-0.5" size={20} />
                              {blk.reason && (
                                <span className="text-[10px] font-bold text-slate-700 bg-white/70 backdrop-blur px-2 py-0.5 rounded-full uppercase truncate max-w-full">
                                  {blk.reason}
                                </span>
                              )}
                            </div>
                          )
                        })}

                        {/* Appointments */}
                        {dayApps.map((app: any) => {
                          const duration = app.treatment?.duration_minutes || 30;
                          // Standard fallback color
                          const color = app.treatment?.color_code || '#2563eb';
                          const isCancelled = app.status === 'cancelled';
                          const isCompleted = app.status === 'completed';
                          
                          return (
                            <div 
                              key={app.id}
                              onClick={() => { setSelectedAppointment(app); setStatusModalOpen(true); }}
                              className={`absolute left-1 right-1 rounded-md p-2 group hover:shadow-md transition-all cursor-pointer z-20 overflow-hidden shadow-sm bg-white dark:bg-slate-800
                                ${isCancelled ? 'opacity-50 grayscale' : ''}
                              `}
                              style={{ ...getStyleForTime(app.start_time, duration), borderLeft: `4px solid ${color}` }}
                            >
                              <div className="flex flex-col h-full w-full justify-start overflow-hidden leading-tight">
                                <p className="text-[10px] font-bold uppercase truncate w-full" style={{ color }}>
                                  {isCompleted && <Check size={10} className="inline mr-1" />}
                                  {app.treatment?.name || 'Turno'}
                                </p>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 truncate w-full">
                                  {app.patient?.full_name}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-1 xl:col-span-3 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-on-surface font-headline">Próximos turnos de Hoy</h3>
              <p className="text-on-surface-variant text-xs mt-1 capitalize">{format(new Date(), 'EEEE, d MMMM', { locale: es })}</p>
            </div>
            
            <div className="space-y-4">
              {todayAppointments.length === 0 && (
                <p className="text-sm text-on-surface-variant italic">No hay más turnos programados para hoy.</p>
              )}
              {todayAppointments.map((app: any) => (
                <div key={app.id} className="bg-surface-container-lowest p-5 rounded-[1.5rem] shadow-sm hover:translate-y-[-2px] transition-all duration-300 border border-outline-variant/10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {app.patient?.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface truncate max-w-[120px]">{app.patient?.full_name}</p>
                        <p className="text-[11px] text-on-surface-variant truncate max-w-[120px]">{app.treatment?.name}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary-fixed/30 px-2 py-1 rounded-lg">{format(new Date(app.start_time), 'HH:mm')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedAppointment(app); setStatusModalOpen(true); }}
                      className="flex-1 py-2 text-[11px] font-bold text-on-surface bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
                      Gestionar
                    </button>
                    <button 
                      onClick={() => openWhatsApp(app.patient?.phone, app.patient?.full_name, app.start_time)}
                      className="px-3 py-2 text-primary bg-primary-fixed/20 rounded-lg hover:bg-primary-fixed/40 transition-colors"
                      title="Enviar recordatorio WhatsApp">
                      <MessageCircle size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-primary rounded-[2rem] text-white overflow-hidden relative group">
              <div className="relative z-10">
                <h4 className="font-headline font-bold text-lg leading-tight">Emergency<br/>Requests</h4>
                <p className="text-primary-fixed-dim text-xs mt-2">Visibilidad en tiempo real activa.</p>
              </div>
              <BriefcaseMedical className="absolute -bottom-4 -right-4 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-500" size={120} />
            </div>
          </div>
        </div>
      </main>

      {/* Block Schedule Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-headline">Bloquear Horario</h3>
              <button 
                onClick={closeBlockModal} 
                className="text-slate-500 hover:bg-slate-100 p-2 rounded-full transition-colors"
                disabled={isPending}
              ><X size={20}/></button>
            </div>
            
            <div className="flex gap-2 mb-6 bg-surface-container-low p-1 rounded-xl">
              <button onClick={() => setBlockMode('range')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${blockMode === 'range' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>Horas</button>
              <button onClick={() => setBlockMode('fullDay')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${blockMode === 'fullDay' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>Día Completo</button>
              <button onClick={() => setBlockMode('dateRange')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${blockMode === 'dateRange' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>Rango Días</button>
            </div>

            <div className="space-y-4">
              {blockMode !== 'dateRange' && (
                <div>
                  <label className="block text-sm font-semibold mb-1">Día</label>
                  <input type="date" value={blockForm.date} onChange={e => setBlockForm({...blockForm, date: e.target.value})} className="w-full p-3 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary" disabled={isPending} />
                </div>
              )}
              
              {blockMode === 'dateRange' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Desde el día</label>
                    <input type="date" value={blockForm.date} onChange={e => setBlockForm({...blockForm, date: e.target.value})} className="w-full p-3 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary" disabled={isPending} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Hasta el día</label>
                    <input type="date" value={blockForm.endDate} onChange={e => setBlockForm({...blockForm, endDate: e.target.value})} className="w-full p-3 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary" disabled={isPending} />
                  </div>
                </div>
              )}

              {blockMode === 'range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Hora Inicio</label>
                    <input type="time" value={blockForm.startTime} onChange={e => setBlockForm({...blockForm, startTime: e.target.value})} className="w-full p-3 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary" disabled={isPending} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Hora Fin</label>
                    <input type="time" value={blockForm.endTime} onChange={e => setBlockForm({...blockForm, endTime: e.target.value})} className="w-full p-3 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary" disabled={isPending} />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold mb-1">Motivo (Opcional)</label>
                <input type="text" value={blockForm.reason} onChange={e => setBlockForm({...blockForm, reason: e.target.value})} className="w-full p-3 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary" placeholder="Ej: Vacaciones, Reunión Médica" disabled={isPending} />
              </div>

              {conflictCount !== null && (
                <div className="bg-error-container/40 p-4 rounded-xl text-error mt-6 border border-error/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold">Conflictos Detectados</h4>
                      <p className="text-sm mt-1">
                        Existen <strong>{conflictCount} turnos programados</strong> en este rango de tiempo. 
                        Los pacientes y turnos no se cancelarán automáticamente, pero el área quedará bloqueada en el sistema.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={handleCreateBlock} 
                disabled={isPending || (blockMode==='range' && (!blockForm.startTime || !blockForm.endTime))} 
                className="w-full mt-6 py-3 bg-error text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {isPending ? <Loader2 className="animate-spin" size={20} /> : <Ban size={20} />} 
                {conflictCount !== null ? 'Bloquear de todas formas' : 'Confirmar Bloqueo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Status / Details Modal */}
      {statusModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-2xl text-left">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold font-headline">{selectedAppointment.patient?.full_name}</h3>
                <p className="text-xs font-semibold text-primary bg-primary-container/20 inline-block px-3 py-1 rounded-full mt-2">
                  {format(new Date(selectedAppointment.start_time), "PPP 'a las' HH:mm", { locale: es })}
                </p>
              </div>
              <button onClick={() => { setStatusModalOpen(false); setSelectedAppointment(null); }} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full">
                <X size={20}/>
              </button>
            </div>
            
            <div className="bg-surface-container-low p-4 rounded-xl mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Tratamiento</p>
                  <p className="text-sm font-semibold">{selectedAppointment.treatment?.name}</p>
                </div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedAppointment.treatment?.color_code || '#ccc' }}></div>
              </div>
              
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Teléfono</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-semibold">{selectedAppointment.patient?.phone}</p>
                  <button 
                    onClick={() => openWhatsApp(selectedAppointment.patient?.phone, selectedAppointment.patient?.full_name, selectedAppointment.start_time)}
                    className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                    title="Abrir WhatsApp"
                  >
                    <MessageCircle size={12} />
                  </button>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Motivo / Notas</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1 italic">"{selectedAppointment.notes}"</p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleChangeStatus('completed')} 
                disabled={isPending || selectedAppointment.status === 'completed'} 
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
                title="Marcar turno como completado"
              >
                {isPending ? <Loader2 className="animate-spin" size={18}/> : <Check size={18} />} Marcar completado
              </button>
              
              <button 
                onClick={() => handleChangeStatus('cancelled')} 
                disabled={isPending || selectedAppointment.status === 'cancelled'} 
                className="w-full py-3 bg-surface-container-high text-error font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-surface-container-highest disabled:opacity-50 transition-colors"
              >
                {isPending ? <Loader2 className="animate-spin" size={18}/> : <X size={18} />} Cancelar turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
