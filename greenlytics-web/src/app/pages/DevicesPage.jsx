import { useEffect, useState } from 'react'
import { resourceService } from '../services/resourceService'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

export default function DevicesPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await resourceService.listDevices()
        setItems(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Devices</h1>

      {isLoading ? <p className="mt-4">Carregant...</p> : null}
      {error ? <p className="mt-4 text-red-600">{error}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-3 py-3">Nom</th>
              <th className="px-3 py-3">Code</th>
              <th className="px-3 py-3">Serial</th>
              <th className="px-3 py-3">MAC</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actiu</th>
              <th className="px-3 py-3">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-3 py-3">{item.name || '-'}</td>
                <td className="px-3 py-3">{item.code || '-'}</td>
                <td className="px-3 py-3">{item.serial_number || '-'}</td>
                <td className="px-3 py-3">{item.mac_address || '-'}</td>
                <td className="px-3 py-3">{item.status || '-'}</td>
                <td className="px-3 py-3">{item.is_active ? 'Sí' : 'No'}</td>
                <td className="px-3 py-3">{formatDate(item.last_seen_on)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}