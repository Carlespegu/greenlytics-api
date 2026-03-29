import { useEffect, useState } from 'react'
import { resourceService } from '../services/resourceService'

export default function InstallationsPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await resourceService.listInstallations()
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
      <h1 className="text-2xl font-bold text-slate-900">Installations</h1>
      {isLoading ? <p className="mt-4">Carregant...</p> : null}
      {error ? <p className="mt-4 text-red-600">{error}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-3 py-3">Id</th>
              <th className="px-3 py-3">Nom</th>
              <th className="px-3 py-3">Client</th>
              <th className="px-3 py-3">Ubicació</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-3 py-3">{item.id}</td>
                <td className="px-3 py-3">{item.name || '-'}</td>
                <td className="px-3 py-3">{item.clientId || item.client?.name || '-'}</td>
                <td className="px-3 py-3">{item.location || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}