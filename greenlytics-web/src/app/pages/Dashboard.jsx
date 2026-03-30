import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Leaf,
  Thermometer,
  Droplets,
  Wifi,
  TriangleAlert,
  Activity,
  ArrowUpRight,
  SunMedium,
  CloudRain,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { dashboardService } from '../services/dashboardService'

const ICON_BY_TITLE = {
  'Plantes totals': Leaf,
  'Plantes actives': Activity,
  'Devices online': Wifi,
  'Lectures recents': TriangleAlert,
}

function statusBadgeClass(status) {
  switch (status) {
    case 'OK':
      return 'bg-emerald-100 text-emerald-700'
    case 'Warning':
      return 'bg-amber-100 text-amber-700'
    case 'Critical':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function humidityTone(value) {
  if (value == null) return 'text-slate-500'
  if (value < 30) return 'text-red-600'
  if (value < 45) return 'text-amber-600'
  return 'text-emerald-600'
}

function progressTone(value) {
  if (value == null) return 'bg-slate-300'
  if (value < 30) return 'bg-red-500'
  if (value < 45) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function KpiCard({ title, value, subtitle }) {
  const Icon = ICON_BY_TITLE[title] || Activity

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function ActionButton({ children, primary = false }) {
  return (
    <button
      className={[
        'inline-flex items-center rounded-2xl px-4 py-2 text-sm font-medium transition',
        primary
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      ].join(' ')}
      type="button"
    >
      {children}
    </button>
  )
}

function EmptyState({ message }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
      {message}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const payload = await dashboardService.getSummary()
        setSummary(payload)
      } catch (err) {
        setError(err.message || 'No s’han pogut carregar les dades del dashboard.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const kpis = summary?.kpis || []
  const chartData = summary?.chart_data || []
  const latestReadings = summary?.latest_readings || []
  const plants = summary?.plants || []

  const criticalPlants = useMemo(
    () => plants.filter((item) => item.status === 'Critical').length,
    [plants]
  )

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">Dashboard</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Visió general de Greenlytics
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Estat actual de plantes, sensors i lectures reals de la plataforma.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionButton>
              <Bell className="mr-2 h-4 w-4" />
              Veure alertes
            </ActionButton>

            <ActionButton primary>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Afegir device
            </ActionButton>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-500">
          Carregant dades reals del dashboard...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
              >
                <KpiCard {...item} />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Tendència de lectures
                </h2>
                <p className="text-sm text-slate-500">
                  Humitat del sòl i llum de les últimes lectures disponibles.
                </p>
              </div>

              {chartData.length === 0 ? (
                <EmptyState message="Encara no hi ha prou dades per mostrar la gràfica." />
              ) : (
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="soil_percent" strokeWidth={3} dot={false} name="Humitat terra" />
                      <Line type="monotone" dataKey="ldr_raw" strokeWidth={3} dot={false} name="Llum (raw)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Últimes lectures
                </h2>
                <p className="text-sm text-slate-500">
                  Activitat real dels devices connectats.
                </p>
              </div>

              {latestReadings.length === 0 ? (
                <EmptyState message="No s’han trobat lectures recents." />
              ) : (
                <div className="space-y-4">
                  {latestReadings.map((reading, index) => (
                    <div
                      key={`${reading.plant}-${reading.type}-${index}`}
                      className="rounded-2xl border border-slate-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{reading.plant}</p>
                          <p className="text-sm text-slate-500">
                            {reading.type} · {reading.device}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {reading.value}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">{reading.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Estat de les plantes
                </h2>
                <p className="text-sm text-slate-500">
                  Resum ràpid per planta o device, amb l’últim valor disponible.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
                Crítiques: <span className="font-semibold text-slate-900">{criticalPlants}</span>
              </div>
            </div>

            {plants.length === 0 ? (
              <EmptyState message="No hi ha plantes o devices amb dades per mostrar encara." />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {plants.map((plant) => (
                  <div
                    key={`${plant.plant_id || plant.name}-${plant.installation}`}
                    className="rounded-3xl border border-slate-100 bg-white p-5 transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {plant.name}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(
                              plant.status
                            )}`}
                          >
                            {plant.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{plant.installation}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Última lectura: {plant.last_reading || 'Sense dades'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                        <Leaf className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Droplets className="h-4 w-4" />
                          <span className="text-sm">Humitat terra</span>
                        </div>
                        <p className={`mt-2 text-2xl font-semibold ${humidityTone(plant.humidity)}`}>
                          {plant.humidity == null ? '—' : `${Math.round(plant.humidity)}%`}
                        </p>
                        <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                          <div
                            className={`h-2 rounded-full ${progressTone(plant.humidity)}`}
                            style={{ width: `${Math.max(0, Math.min(100, plant.humidity || 0))}%` }}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Thermometer className="h-4 w-4" />
                          <span className="text-sm">Temperatura</span>
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {plant.temperature == null ? '—' : `${plant.temperature.toFixed(1)} °C`}
                        </p>
                        <p className="mt-3 text-xs text-slate-400">Dada més recent</p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <SunMedium className="h-4 w-4" />
                          <span className="text-sm">Llum</span>
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {plant.light == null ? '—' : Math.round(plant.light)}
                        </p>
                        <p className="mt-3 text-xs text-slate-400">Valor raw</p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <CloudRain className="h-4 w-4" />
                          <span className="text-sm">Pluja / RSSI</span>
                        </div>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {plant.rain ? (plant.rain === 'rain' ? 'Plou' : 'Sec') : '—'}
                        </p>
                        <p className="mt-3 text-xs text-slate-400">
                          {plant.rssi == null ? 'Sense RSSI' : `${plant.rssi} dBm`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
