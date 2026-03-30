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

const kpis = [
  {
    title: 'Plantes totals',
    value: 28,
    subtitle: '3 noves aquesta setmana',
    icon: Leaf,
  },
  {
    title: 'Plantes OK',
    value: 23,
    subtitle: '82% en estat saludable',
    icon: Activity,
  },
  {
    title: 'Alertes actives',
    value: 4,
    subtitle: '2 necessiten revisió avui',
    icon: TriangleAlert,
  },
  {
    title: 'Devices online',
    value: '9 / 11',
    subtitle: '81% connectats',
    icon: Wifi,
  },
]

const plants = [
  {
    id: 1,
    name: 'Monstera Deliciosa',
    installation: 'Office Sabadell',
    status: 'OK',
    humidity: 68,
    temperature: 22.4,
    lastReading: 'fa 5 min',
  },
  {
    id: 2,
    name: 'Ficus Lyrata',
    installation: 'Meeting Room A',
    status: 'Warning',
    humidity: 38,
    temperature: 25.1,
    lastReading: 'fa 12 min',
  },
  {
    id: 3,
    name: 'Calathea Orbifolia',
    installation: 'Reception',
    status: 'Critical',
    humidity: 21,
    temperature: 27.3,
    lastReading: 'fa 18 min',
  },
  {
    id: 4,
    name: 'Pothos',
    installation: 'Open Space',
    status: 'OK',
    humidity: 59,
    temperature: 21.6,
    lastReading: 'fa 4 min',
  },
]

const chartData = [
  { hour: '08:00', humidity: 44, temperature: 20.1 },
  { hour: '10:00', humidity: 46, temperature: 20.8 },
  { hour: '12:00', humidity: 49, temperature: 21.5 },
  { hour: '14:00', humidity: 52, temperature: 22.1 },
  { hour: '16:00', humidity: 55, temperature: 22.6 },
  { hour: '18:00', humidity: 53, temperature: 22.2 },
  { hour: '20:00', humidity: 51, temperature: 21.7 },
]

const latestReadings = [
  {
    plant: 'Monstera Deliciosa',
    type: 'Humitat terra',
    value: '68%',
    device: 'esp32-plant-01',
    time: 'fa 5 min',
  },
  {
    plant: 'Ficus Lyrata',
    type: 'Temperatura',
    value: '25.1 °C',
    device: 'esp32-plant-02',
    time: 'fa 12 min',
  },
  {
    plant: 'Calathea Orbifolia',
    type: 'Humitat terra',
    value: '21%',
    device: 'esp32-plant-03',
    time: 'fa 18 min',
  },
  {
    plant: 'Pothos',
    type: 'RSSI',
    value: '-54 dBm',
    device: 'esp32-plant-04',
    time: 'fa 21 min',
  },
]

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
  if (value < 30) return 'text-red-600'
  if (value < 45) return 'text-amber-600'
  return 'text-emerald-600'
}

function progressTone(value) {
  if (value < 30) return 'bg-red-500'
  if (value < 45) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function KpiCard({ title, value, subtitle, icon: Icon }) {
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
    >
      {children}
    </button>
  )
}

export default function Dashboard() {
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
              Estat actual de plantes, sensors i alertes del teu entorn.
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
              Humitat i temperatura de les últimes hores
            </p>
          </div>

          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="humidity" strokeWidth={3} dot={false} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
              Activitat recent dels devices
            </p>
          </div>

          <div className="space-y-4">
            {latestReadings.map((reading) => (
              <div
                key={`${reading.plant}-${reading.type}`}
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
              Resum ràpid per planta i últim valor disponible
            </p>
          </div>

          <button className="w-fit rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Veure totes
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {plants.map((plant) => (
            <div
              key={plant.id}
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
                    Última lectura: {plant.lastReading}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <Leaf className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Droplets className="h-4 w-4" />
                    <span className="text-sm">Humitat terra</span>
                  </div>

                  <p
                    className={`mt-2 text-2xl font-semibold ${humidityTone(
                      plant.humidity
                    )}`}
                  >
                    {plant.humidity}%
                  </p>

                  <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                    <div
                      className={`h-2 rounded-full ${progressTone(plant.humidity)}`}
                      style={{ width: `${plant.humidity}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Thermometer className="h-4 w-4" />
                    <span className="text-sm">Temperatura</span>
                  </div>

                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {plant.temperature} °C
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    Valor disponible més recent
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}