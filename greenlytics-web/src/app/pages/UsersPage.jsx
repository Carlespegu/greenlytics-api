import BackofficeListHeader from '../components/BackofficeListHeader'

export default function UsersPage() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <BackofficeListHeader title="Llistat d'usuaris" total={0} showNewButton onNew={() => {}} />
      <p className="mt-6 text-sm text-slate-500">
        Aquesta pantalla queda preparada amb el mateix patró visual del backoffice. La integració funcional del llistat general d’usuaris està pendent perquè la gestió actual d’usuaris es fa des del detall de client.
      </p>
    </section>
  )
}
