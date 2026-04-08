import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  Droplets,
  Leaf,
  Sun,
  Thermometer,
  Waves,
  Wifi,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import defaultLogo from '../../assets/logo.png'

function PrimaryButton({ children, to }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-700"
    >
      {children}
    </Link>
  )
}

function SecondaryButton({ children, to }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 transition hover:bg-slate-50"
    >
      {children}
    </Link>
  )
}

function SurfaceCard({ children, className = '' }) {
  return (
    <div className={`rounded-[28px] border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf7_0%,#eef7f2_32%,#ffffff_100%)] text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <img src={defaultLogo} alt="GreenLytics" className="h-11 w-11 rounded-2xl object-contain" />
          <div>
            <p className="text-xl font-semibold tracking-tight text-emerald-700">GreenLytics</p>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Smart Plant Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SecondaryButton to="/login">Accedir</SecondaryButton>
          <PrimaryButton to="/login">Demana una demo</PrimaryButton>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <Leaf className="h-4 w-4" />
              Monitorització intel·ligent per a plantes i instal·lacions
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
              Controla la salut vegetal amb dades en temps real i accions més útils.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              GreenLytics connecta sensors IoT, alertes i analítica operativa per ajudar equips de manteniment,
              espais interiors i projectes de cultiu a regar millor, detectar incidències abans i reduir consum.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <PrimaryButton to="/login">Veure la plataforma</PrimaryButton>
              <SecondaryButton to="/login">Parlar amb l’equip</SecondaryButton>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['98.7%', 'Sensors operatius'],
                ['-21%', 'Optimització del consum d’aigua'],
                ['24/7', 'Seguiment i alertes'],
              ].map(([value, label]) => (
                <SurfaceCard key={label} className="p-4">
                  <p className="text-3xl font-semibold text-slate-900">{value}</p>
                  <p className="mt-1 text-sm text-slate-500">{label}</p>
                </SurfaceCard>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <SurfaceCard className="relative overflow-hidden p-5">
              <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-emerald-100 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-lime-100 blur-3xl" />

              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Live Overview</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">Panell operatiu GreenLytics</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Operativa estable
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    ['Plantes monitoritzades', '248', '+18 aquest mes', <Leaf className="h-4 w-4" />],
                    ['Instal·lacions actives', '19', '4 zones operatives', <Activity className="h-4 w-4" />],
                    ['Sensors online', '124 / 126', '2 incidències', <Wifi className="h-4 w-4" />],
                    ['Alertes obertes', '7', '2 crítiques', <AlertTriangle className="h-4 w-4" />],
                  ].map(([title, value, help, icon]) => (
                    <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm text-slate-500">{title}</p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          {icon}
                        </div>
                      </div>
                      <p className="text-2xl font-semibold text-slate-900">{value}</p>
                      <p className="mt-1 text-xs text-slate-500">{help}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">Tendències ambientals</h3>
                        <p className="text-sm text-slate-500">Humitat, temperatura i llum de les últimes 24 h</p>
                      </div>
                      <div className="text-sm font-medium text-emerald-600">Actualitzat fa 2 min</div>
                    </div>

                    <div className="flex h-48 items-end gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-4">
                      {[72, 78, 74, 88, 95, 82, 76, 84, 90, 68, 72, 80].map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-xl bg-gradient-to-t from-emerald-500 to-lime-300 opacity-90"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        ['Humitat mitjana', '61%', <Waves className="h-4 w-4" />],
                        ['Temperatura', '22.4 °C', <Thermometer className="h-4 w-4" />],
                        ['Llum', '14.2 klx', <Sun className="h-4 w-4" />],
                      ].map(([label, value, icon]) => (
                        <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
                            {icon}
                            <span>{label}</span>
                          </div>
                          <p className="text-lg font-semibold text-slate-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">Estat de plantes</h3>
                        <p className="text-sm text-slate-500">Accions prioritzades per incidència i context</p>
                      </div>
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">2 crítiques</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        ['Monstera Deliciosa', 'Oficina Barcelona', 'Crítica', 'bg-red-100 text-red-600', '18%', '27.1 °C', 'Baixa'],
                        ['Ficus Lyrata', 'Showroom Madrid', 'Estable', 'bg-emerald-100 text-emerald-700', '52%', '22.8 °C', 'Òptima'],
                        ['Lavanda', 'Terrassa Demo', 'Seguiment', 'bg-amber-100 text-amber-700', '31%', '24.3 °C', 'Alta'],
                      ].map(([name, place, status, statusClass, soil, temp, light]) => (
                        <div key={name} className="rounded-2xl border border-slate-100 bg-white p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{name}</p>
                              <p className="text-sm text-slate-500">{place}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{status}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="rounded-xl bg-slate-50 p-2">
                              <p className="text-slate-500">Humitat</p>
                              <p className="font-semibold text-slate-900">{soil}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-2">
                              <p className="text-slate-500">Temp.</p>
                              <p className="font-semibold text-slate-900">{temp}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-2">
                              <p className="text-slate-500">Llum</p>
                              <p className="font-semibold text-slate-900">{light}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    ['Reg recomanat avui', '14 plantes', 'Basat en humitat i temperatura'],
                    ['Eficiència hídrica', '-21% consum', 'Respecte a la gestió manual'],
                    ['Salut global', '87 / 100', 'Índex agregat de la instal·lació'],
                  ].map(([title, value, detail]) => (
                    <div key={title} className="rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-900 p-4 text-white">
                      <p className="mb-2 text-sm text-white/70">{title}</p>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-2xl font-semibold">{value}</p>
                          <p className="mt-1 text-xs text-white/70">{detail}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-white/70" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SurfaceCard>
          </motion.div>
        </section>

        <section className="bg-white/70 px-6 py-16">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">El problema que resol GreenLytics</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              No saber quan regar, si una planta rep prou llum o si una instal·lació s’està degradant genera pèrdues,
              visites ineficients i decisions reactives. GreenLytics converteix aquest soroll en visibilitat operativa.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-3">
          {[
            [<Cpu className="h-6 w-6" />, 'Sensors intel·ligents', 'Recull dades de temperatura, humitat, llum i estat dels equips de forma automàtica.'],
            [<BarChart3 className="h-6 w-6" />, 'Analítica clara', 'Visualitza tendències, comparatives i rendiment sense dependre de fulls manuals.'],
            [<Leaf className="h-6 w-6" />, 'Accions prioritzades', 'Rep alertes i recomanacions per actuar abans que el problema escali.'],
          ].map(([icon, title, text]) => (
            <SurfaceCard key={title} className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                {icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{text}</p>
            </SurfaceCard>
          ))}
        </section>

        <section className="bg-slate-50 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Com funciona</h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                GreenLytics connecta la captació de dades amb una capa d’operació simple perquè equips tècnics,
                facilities i partners puguin actuar ràpid i amb criteri.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                ['1', 'Instal·la i connecta', 'Integra sensors i dispositius en minuts, sense desplegaments complexos.'],
                ['2', 'Recull i estructura', 'Centralitza lectures per client, instal·lació, sensor i planta en temps real.'],
                ['3', 'Analitza i actua', 'Consulta l’estat, rep alertes i prioritza accions amb una única vista operativa.'],
              ].map(([step, title, text]) => (
                <SurfaceCard key={step} className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{text}</p>
                </SurfaceCard>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-3">
          {[
            ['Redueix la mortalitat vegetal', <Leaf className="h-5 w-5" />],
            ['Optimitza el consum d’aigua', <Droplets className="h-5 w-5" />],
            ['Decisions basades en dades reals', <BarChart3 className="h-5 w-5" />],
          ].map(([text, icon]) => (
            <SurfaceCard key={text} className="p-6 text-center">
              <div className="mb-4 flex justify-center text-emerald-700">{icon}</div>
              <p className="font-medium text-slate-900">{text}</p>
            </SurfaceCard>
          ))}
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl rounded-[32px] bg-gradient-to-r from-emerald-600 via-emerald-600 to-lime-500 px-8 py-14 text-center text-white shadow-xl">
            <h2 className="text-4xl font-semibold tracking-tight">Comença a operar les teves plantes amb més context</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
              Si vols convertir sensors i lectures en decisions útils, GreenLytics et pot ajudar a començar amb una demo guiada.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PrimaryButton to="/login">Demana una demo</PrimaryButton>
              <SecondaryButton to="/login">Accedir a la plataforma</SecondaryButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} GreenLytics. Monitorització intel·ligent per a entorns verds i instal·lacions connectades.
      </footer>
    </div>
  )
}
