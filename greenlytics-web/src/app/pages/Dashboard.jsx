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
import LoadingOverlay from '../components/LoadingOverlay'
import { dashboardService } from '../services/dashboardService'
import { useLanguage } from '../context/LanguageContext'

const KPI_ICON_BY_KEY = {
  totalPlants: Leaf,
  activePlants: Activity,
  onlineSensors: Wifi,
  recentReadings: TriangleAlert,
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

function detectKpiKey(title = '') {
  const normalized = title.toLowerCase()

  if (normalized.includes('plantes totals') || normalized.includes('total plants')) {
    return 'totalPlants'
  }

  if (normalized.includes('plantes actives') || normalized.includes('active plants')) {
    return 'activePlants'
  }

  if (
    normalized.includes('devices online') ||
    normalized.includes('device online') ||
    normalized.includes('sensors online') ||
    normalized.includes('sensor online')
  ) {
    return 'onlineSensors'
  }

  if (normalized.includes('lectures recents') || normalized.includes('recent readings')) {
    return 'recentReadings'
  }

  return null
}

function normalizeKpis(kpis, t) {
  const base = Array.isArray(kpis) ? kpis : []
  const map = new Map()

  for (const item of base) {
    const key = detectKpiKey(item.title)
    if (!key) continue
    map.set(key, item)
  }

  const orderedKeys = ['totalPlants', 'activePlants', 'onlineSensors', 'recentReadings']

  return orderedKeys
    .filter((key) => map.has(key))
    .map((key) => {
      const item = map.get(key)
        return {
          ...item,
          key,
          title: t(`dashboardKpi.${key}.title`),
          subtitle: t(`dashboardKpi.${key}.subtitle`),
        }
    })
}

function KpiCard({ kpiKey, title, value, subtitle }) {
  const Icon = KPI_ICON_BY_KEY[kpiKey] || Activity

  return (
    <div className="flex h-full min-h-[132px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
    </div>
  )
}

function ActionButton({ children, primary = false }) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition',
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
    <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
      {message}
    </div>
  )
}

export default function Dashboard() {
  const { t } = useLanguage()
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
        setError(err.message || t('dashboardLoadError'))
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [t])

  const kpis = useMemo(() => normalizeKpis(summary?.kpis || [], t), [summary?.kpis, t])
  const chartData = summary?.chart_data || []
  const plants = summary?.plants || []

  const criticalPlants = useMemo(
    () => plants.filter((item) => item.status === 'Critical').length,
    [plants]
  )

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">{t('dashboard')}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {t('dashboardTitle')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t('dashboardSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionButton>
              <Bell className="mr-2 h-4 w-4" />
              {t('viewAlerts')}
            </ActionButton>

            <ActionButton primary>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              {t('addSensor')}
            </ActionButton>
          </div>
        </div>
      </motion.section>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-500">
          {t('dashboardLoading')}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="h-full"
              >
                <KpiCard
                  kpiKey={item.key}
                  title={item.title}
                  value={item.value}
                  subtitle={item.subtitle}
                />
              </motion.div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="flex min-h-[520px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  {t('readingTrends')}
                </h2>
                <p className="text-sm text-slate-500">
                  {t('readingTrendsDescription')}
                </p>
              </div>

              <div className="flex-1">
                {chartData.length === 0 ? (
                  <EmptyState message={t('readingTrendsEmpty')} />
                ) : (
                  <div className="h-full min-h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="soil_percent" strokeWidth={3} dot={false} name={t('soilHumidity')} />
                        <Line type="monotone" dataKey="ldr_raw" strokeWidth={3} dot={false} name={t('lightRaw')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="flex min-h-[520px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {t('plantStatus')}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {t('plantStatusDescription')}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
                  {t('criticalCount')} <span className="font-semibold text-slate-900">{criticalPlants}</span>
                </div>
              </div>

              <div className="flex-1">
                {plants.length === 0 ? (
                  <EmptyState message={t('plantStatusEmpty')} />
                ) : (
                  <div className="space-y-4 overflow-auto pr-1">
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
                              {t('lastReading')} {plant.last_reading || t('noData')}
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
                              <span className="text-sm">{t('soilHumidity')}</span>
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
                              <span className="text-sm">{t('temperature')}</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                              {plant.temperature == null ? '—' : `${plant.temperature.toFixed(1)} °C`}
                            </p>
                            <p className="mt-3 text-xs text-slate-400">{t('mostRecentData')}</p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-slate-500">
                              <SunMedium className="h-4 w-4" />
                              <span className="text-sm">{t('light')}</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                              {plant.light == null ? '—' : Math.round(plant.light)}
                            </p>
                            <p className="mt-3 text-xs text-slate-400">{t('rawValue')}</p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-slate-500">
                              <CloudRain className="h-4 w-4" />
                              <span className="text-sm">{t('rainRssi')}</span>
                            </div>
                            <p className="mt-2 text-base font-semibold text-slate-900">
                              {plant.rain ? (plant.rain === 'rain' ? t('rainYes') : t('rainNo')) : '—'}
                            </p>
                            <p className="mt-3 text-xs text-slate-400">
                              {plant.rssi == null ? t('noRssi') : `${plant.rssi} dBm`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </section>
        </>
      )}
      <LoadingOverlay visible={isLoading} label={t('dashboardLoading')} transparent />
    </div>
  )
}
