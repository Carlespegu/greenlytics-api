import { useParams } from 'react-router-dom'

export default function InstallationDevicesPage() {
  const { installationId } = useParams()

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Devices</h1>
      <p className="mt-2 text-sm text-slate-500">
        Pantalla pendent d’implementar per a la instal·lació <span className="font-medium text-slate-700">{installationId}</span>.
      </p>
    </section>
  )
}
