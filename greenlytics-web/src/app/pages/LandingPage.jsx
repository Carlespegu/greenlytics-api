import { Link } from 'react-router-dom'
import defaultLogo from '../../assets/logo.png'

function CtaButton({ to, children, variant = 'primary' }) {
  const className =
    variant === 'primary'
      ? 'inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700'
      : 'inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50'

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-slate-600">{text}</p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <img src={defaultLogo} alt="GreenLytics" className="h-12 w-12 rounded-2xl object-contain" />
          <div>
            <p className="text-2xl font-semibold text-emerald-700">GreenLytics</p>
            <p className="text-sm text-slate-500">Smart Plant Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CtaButton to="/login" variant="secondary">Accedir</CtaButton>
          <CtaButton to="/login">Demana una demo</CtaButton>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pb-16 pt-10">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                Monitoritzacio intel.ligent per a plantes i instal.lacions
              </div>

              <h1 className="text-5xl font-semibold leading-tight tracking-tight text-slate-900 md:text-6xl">
                Controla la salut vegetal amb dades en temps real.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                GreenLytics connecta sensors, alertes i analitica operativa per ajudar equips de manteniment,
                espais interiors i projectes de cultiu a prendre decisions mes rapides i mes segures.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <CtaButton to="/login">Veure la plataforma</CtaButton>
                <CtaButton to="/login" variant="secondary">Parlar amb l'equip</CtaButton>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <InfoCard title="98.7%" text="Sensors operatius" />
                <InfoCard title="-21%" text="Optimitzacio del consum d'aigua" />
                <InfoCard title="24/7" text="Seguiment i alertes" />
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Live overview</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Panell operatiu GreenLytics</h2>
              <p className="mt-4 text-slate-600">
                Visualitza plantes, dispositius, instal.lacions, lectures i alertes en un sol entorn.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <InfoCard title="Plantes" text="Monitoritzades per client, instal.lacio i estat." />
                <InfoCard title="Dispositius" text="Seguiment online, lectures i ultima activitat." />
                <InfoCard title="Alertes" text="Regles per planta o instal.lacio amb avisos per email." />
                <InfoCard title="Analitica" text="Tendencies ambientals i suport a decisions operatives." />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-semibold text-slate-900">Com funciona</h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
                GreenLytics converteix dades ambientals en visibilitat operativa i accions utilitzables.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <InfoCard title="1. Connecta" text="Integra sensors i dispositius de manera simple." />
              <InfoCard title="2. Centralitza" text="Agrupa lectures per client, instal.lacio, planta i sensor." />
              <InfoCard title="3. Actua" text="Rep alertes i prioritza intervencions amb criteri." />
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl rounded-[32px] bg-emerald-600 px-8 py-14 text-center text-white shadow-xl">
            <h2 className="text-4xl font-semibold">Comenca a operar les teves plantes amb mes context</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
              Si vols convertir sensors i lectures en decisions utils, GreenLytics et pot ajudar a comencar amb una demo guiada.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <CtaButton to="/login">Demana una demo</CtaButton>
              <CtaButton to="/login" variant="secondary">Accedir a la plataforma</CtaButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} GreenLytics. Monitoritzacio intel.ligent per a entorns verds i instal.lacions connectades.
      </footer>
    </div>
  )
}
