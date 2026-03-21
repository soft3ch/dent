import BookingFlow from '@/components/patient/BookingFlow';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_20px_40px_-10px_rgba(25,28,30,0.06)] h-16">
        <div className="flex justify-between items-center px-8 h-full w-full max-w-screen-2xl mx-auto">
          <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-headline">
            Clinical Serenity
          </div>
          <nav className="hidden md:flex items-center gap-8 font-semibold">
            <a href="/dashboard" className="text-slate-500 hover:text-slate-900 transition-all">Dashboard Dentist</a>
            <a href="#" className="text-slate-500 hover:text-slate-900 transition-all">Patients</a>
            <a href="#" className="text-slate-500 hover:text-slate-900 transition-all">Calendar</a>
            <a href="#" className="text-slate-500 hover:text-slate-900 transition-all">Treatments</a>
          </nav>
          <div className="w-8 h-8 rounded-full bg-primary-container"></div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-6xl mx-auto flex-1 w-full">
        <section className="mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4 font-headline">
            Reserva tu cita dental
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
            Agenda tu próxima visita en segundos. Selecciona el tratamiento y la fecha que mejor se adapte a tu ritmo de vida.
          </p>
        </section>

        <BookingFlow />
      </main>
    </div>
  );
}
