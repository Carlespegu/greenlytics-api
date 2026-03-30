import { useEffect, useMemo, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import { useLanguage } from '../context/LanguageContext'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function getActiveCount(items) {
  return items.filter((item) => item.is_active).length
}

function getOnlineCount(items) {
  return items.filter((item) => {
    const status = item.status?.toLowerCase?.() || ''
    return status === 'online' || status === 'active' || status === 'ok'
  }).length
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const [devices, setDevices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError('')

      try {
        const data = await dashboardService.getDashboardData()
        setDevices(data)
      } catch (err) {
        setError(err.message || 'No s’han pogut carregar les dades del dashboard.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const totalDevices = devices.length
  const activeDevices = useMemo(() => getActiveCount(devices), [devices])
  const onlineDevices = useMemo(() => getOnlineCount(devices), [devices])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('dashboard')}</h1>
        <p className="mt-1 text-slate-500">
          Resum general dels dispositius registrats.
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Total devices"
              value={totalDevices}
              subtitle="Dispositius registrats"
            />
            <StatCard
              title="Active devices"
              value={activeDevices}
              subtitle="Dispositius actius"
            />
            <StatCard
              title="Online / OK"
              value={onlineDevices}
              subtitle="Segons el camp status"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Devices recents
              </h2>
              <span className="text-sm text-slate-500">
                {devices.length} registres
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Code</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Active</th>
                    <th className="px-3 py-3">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-3 py-3">{item.name || '-'}</td>
                      <td className="px-3 py-3">{item.code || '-'}</td>
                      <td className="px-3 py-3">{item.status || '-'}</td>
                      <td className="px-3 py-3">{item.is_active ? 'Sí' : 'No'}</td>
                      <td className="px-3 py-3">{formatDate(item.last_seen_on)}</td>
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