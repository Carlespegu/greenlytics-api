import { useEffect, useMemo, useState } from 'react'
import StatCard from '../components/StatCard'
import { dashboardService } from '../services/dashboardService'

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '-'
  return `${value}${suffix}`
}

function getLastReading(readings) {
  return readings?.[0] || null
}

export default function DashboardPage() {
  const [readings, setReadings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await dashboardService.getLatestReadings()
        setReadings(data)
      } catch (err) {
        setError(err.message || 'No s’han pogut carregar les lectures')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const latest = useMemo(() => getLastReading(readings), [readings])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Resum de les últimes lectures dels dispositius.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          Carregant dades...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Temperatura"
              value={formatValue(latest?.tempC ?? latest?.temperature, ' °C')}
            />
            <StatCard
              title="Humitat aire"
              value={formatValue(latest?.humAir ?? latest?.airHumidity, ' %')}
            />
            <StatCard
              title="Humitat sòl"
              value={formatValue(latest?.soilPercent ?? latest?.soilHumidity, ' %')}
            />
            <StatCard
              title="Pluja"
              value={latest?.rain ?? latest?.rainStatus ?? '-'}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Últimes lectures
              </h2>
              <span className="text-sm text-slate-500">
                {readings.length} registres
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3">Device</th>
                    <th className="px-3 py-3">Temp</th>
                    <th className="px-3 py-3">Humitat</th>
                    <th className="px-3 py-3">Soil</th>
                    <th className="px-3 py-3">Llum</th>
                    <th className="px-3 py-3">Pluja</th>
                    <th className="px-3 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((item, index) => (
                    <tr key={item.id || `${item.deviceId}-${index}`} className="border-b border-slate-100">
                      <td className="px-3 py-3">{item.deviceId || item.device?.name || '-'}</td>
                      <td className="px-3 py-3">{formatValue(item.tempC ?? item.temperature, ' °C')}</td>
                      <td className="px-3 py-3">{formatValue(item.humAir ?? item.airHumidity, ' %')}</td>
                      <td className="px-3 py-3">{formatValue(item.soilPercent ?? item.soilHumidity, ' %')}</td>
                      <td className="px-3 py-3">{formatValue(item.ldrRaw ?? item.light ?? item.lux)}</td>
                      <td className="px-3 py-3">{item.rain ?? item.rainStatus ?? '-'}</td>
                      <td className="px-3 py-3">
                        {item.ts || item.createdAt || item.timestamp || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}