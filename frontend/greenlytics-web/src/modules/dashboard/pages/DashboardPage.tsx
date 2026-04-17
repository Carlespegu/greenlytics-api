import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bot,
  CircleAlert,
  Cpu,
  Droplets,
  Flower2,
  GripVertical,
  Leaf,
  ShieldAlert,
  Sparkles,
  Wifi,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useAuth } from '@/hooks/useAuth';
import { DashboardPanel } from '@/shared/ui/DashboardPanel';
import { MetricCard } from '@/shared/ui/MetricCard';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { StatusBadge } from '@/shared/ui/StatusBadge';

const moistureTrend = [
  { label: '00:00', moisture: 44, target: 48 },
  { label: '04:00', moisture: 41, target: 48 },
  { label: '08:00', moisture: 53, target: 48 },
  { label: '12:00', moisture: 58, target: 48 },
  { label: '16:00', moisture: 51, target: 48 },
  { label: '20:00', moisture: 47, target: 48 },
  { label: 'Now', moisture: 49, target: 48 },
];

const healthDistribution = [
  { name: 'Thriving', value: 54, color: '#36d399' },
  { name: 'Monitor', value: 28, color: '#fbbf24' },
  { name: 'Critical', value: 18, color: '#fb7185' },
];

const latestAlerts = [
  { title: 'Zone B irrigation drift', scope: 'Installation INST-021', time: '6 min ago', severity: 'warning' as const },
  { title: 'Humidity threshold exceeded', scope: 'Plant PHALAENOPSIS-018', time: '19 min ago', severity: 'danger' as const },
  { title: 'ESP32 sensor back online', scope: 'Device DEV-044', time: '42 min ago', severity: 'success' as const },
];

const insightCards = [
  {
    icon: <Sparkles size={16} />,
    title: 'Irrigation opportunity',
    text: '23 plants are trending below their moisture baseline over the next 3 hours.',
  },
  {
    icon: <Bot size={16} />,
    title: 'Analysis reuse ready',
    text: 'Photo chronology and analysis history can now be surfaced together in the next UI phase.',
  },
];

const deviceStatuses = [
  { name: 'ESP32 Soil Cluster', state: 'Healthy', coverage: '97% packet success', tone: 'success' as const },
  { name: 'Greenhouse Mesh', state: 'Watch', coverage: '2 devices degraded', tone: 'warning' as const },
  { name: 'North Canopy Probe', state: 'Offline', coverage: 'Last seen 2h ago', tone: 'danger' as const },
];

const featuredPlantFacts = [
  { label: 'Species', value: 'Monstera deliciosa' },
  { label: 'Health score', value: '92 / 100' },
  { label: 'Last analysis', value: '2 hours ago' },
  { label: 'Moisture trend', value: 'Stable' },
];

const defaultWidgetOrder = [
  'plants',
  'devices',
  'alerts',
  'health',
  'moisture',
  'distribution',
  'insights',
  'latestAlerts',
  'featuredPlant',
  'deviceStatus',
] as const;

type WidgetId = (typeof defaultWidgetOrder)[number];

function normalizeWidgetOrder(savedOrder: WidgetId[]) {
  const nextOrder = savedOrder.filter((widgetId) => defaultWidgetOrder.includes(widgetId));

  defaultWidgetOrder.forEach((widgetId) => {
    if (!nextOrder.includes(widgetId)) {
      nextOrder.push(widgetId);
    }
  });

  return nextOrder;
}

function moveWidget(order: WidgetId[], activeWidgetId: WidgetId, targetWidgetId: WidgetId) {
  if (activeWidgetId === targetWidgetId) {
    return order;
  }

  const nextOrder = [...order];
  const activeIndex = nextOrder.indexOf(activeWidgetId);
  const targetIndex = nextOrder.indexOf(targetWidgetId);

  if (activeIndex === -1 || targetIndex === -1) {
    return order;
  }

  nextOrder.splice(activeIndex, 1);
  nextOrder.splice(targetIndex, 0, activeWidgetId);

  return nextOrder;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>([...defaultWidgetOrder]);

  const storageKey = useMemo(
    () => `greenlytics:dashboard-layout:${user?.userId ?? 'anonymous'}`,
    [user?.userId],
  );

  useEffect(() => {
    const savedLayout = window.localStorage.getItem(storageKey);

    if (!savedLayout) {
      setWidgetOrder([...defaultWidgetOrder]);
      return;
    }

    try {
      const parsed = JSON.parse(savedLayout) as WidgetId[];
      setWidgetOrder(normalizeWidgetOrder(parsed));
    } catch {
      setWidgetOrder([...defaultWidgetOrder]);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(widgetOrder));
  }, [storageKey, widgetOrder]);

  const widgets: Record<WidgetId, { span: string; content: ReactNode }> = {
    plants: {
      span: 'dashboard-widget--metric',
      content: (
        <MetricCard
          label="Total plants"
          value="1,284"
          delta="+8.4%"
          trend="up"
          tone="green"
          icon={<Flower2 size={18} />}
          hint="Vs previous 7 days"
        />
      ),
    },
    devices: {
      span: 'dashboard-widget--metric',
      content: (
        <MetricCard
          label="Active devices"
          value="214"
          delta="+3 online"
          trend="up"
          tone="blue"
          icon={<Cpu size={18} />}
          hint="96.8% network health"
        />
      ),
    },
    alerts: {
      span: 'dashboard-widget--metric',
      content: (
        <MetricCard
          label="Open alerts"
          value="19"
          delta="-4 resolved"
          trend="down"
          tone="amber"
          icon={<ShieldAlert size={18} />}
          hint="5 require action today"
        />
      ),
    },
    health: {
      span: 'dashboard-widget--metric',
      content: (
        <MetricCard
          label="Health score"
          value="87.6"
          delta="+2.1 pts"
          trend="up"
          tone="green"
          icon={<Leaf size={18} />}
          hint="Fleet weighted average"
        />
      ),
    },
    moisture: {
      span: 'dashboard-widget--wide dashboard-widget--tall',
      content: (
        <DashboardPanel title="Soil moisture trend" eyebrow="Telemetry" className="dashboard-panel--chart">
          <SectionHeading
            title="Daily irrigation stability"
            subtitle="Placeholder demo data shaped for real /api/readings/timeseries integration later."
            action={<StatusBadge label="Synced 2 min ago" variant="success" icon={<Wifi size={12} />} />}
          />
          <div className="chart-shell">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={moistureTrend}>
                <defs>
                  <linearGradient id="moistureFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#36d399" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#36d399" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#8fa4a0', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8fa4a0', fontSize: 12 }} width={34} />
                <Tooltip contentStyle={{ background: '#09151f', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 16 }} />
                <Area type="monotone" dataKey="target" stroke="#5eead4" strokeDasharray="6 6" fill="none" />
                <Area type="monotone" dataKey="moisture" stroke="#36d399" strokeWidth={3} fill="url(#moistureFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>
      ),
    },
    distribution: {
      span: 'dashboard-widget--medium',
      content: (
        <DashboardPanel title="Plant health distribution" eyebrow="Portfolio">
          <SectionHeading title="Current portfolio mix" subtitle="Health bands can map later to analysis and alert aggregation." />
          <div className="dashboard-split">
            <div className="donut-shell">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={healthDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={4}>
                    {healthDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#09151f', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 16 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="stack-list">
              {healthDistribution.map((item) => (
                <div className="stack-list__item" key={item.name}>
                  <div className="stack-list__legend">
                    <span className="stack-list__swatch" style={{ backgroundColor: item.color }} />
                    <strong>{item.name}</strong>
                  </div>
                  <span>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </DashboardPanel>
      ),
    },
    insights: {
      span: 'dashboard-widget--medium',
      content: (
        <DashboardPanel title="Smart operational highlights" eyebrow="Insights">
          <div className="insight-grid">
            {insightCards.map((insight) => (
              <article className="insight-card" key={insight.title}>
                <span className="insight-card__icon">{insight.icon}</span>
                <strong>{insight.title}</strong>
                <p>{insight.text}</p>
                <button className="ghost-button" type="button">
                  Review insight <ArrowUpRight size={14} />
                </button>
              </article>
            ))}
          </div>
        </DashboardPanel>
      ),
    },
    latestAlerts: {
      span: 'dashboard-widget--medium',
      content: (
        <DashboardPanel title="Latest alerts" eyebrow="Attention needed">
          <div className="timeline-list">
            {latestAlerts.map((alert) => (
              <div className="timeline-list__item" key={alert.title}>
                <div className="timeline-list__icon">
                  <CircleAlert size={16} />
                </div>
                <div className="timeline-list__content">
                  <strong>{alert.title}</strong>
                  <span>{alert.scope}</span>
                </div>
                <div className="timeline-list__meta">
                  <StatusBadge label={alert.severity} variant={alert.severity} />
                  <span>{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>
      ),
    },
    featuredPlant: {
      span: 'dashboard-widget--medium',
      content: (
        <DashboardPanel title="Featured plant" eyebrow="Spotlight" className="dashboard-panel--spotlight">
          <div className="spotlight-card">
            <div className="spotlight-card__visual">
              <div className="spotlight-card__orb" />
              <Droplets size={34} />
            </div>
            <div>
              <h4>Monstera Canopy 07</h4>
              <p>
                Strong health trend with stable moisture, no active alerts and fresh photo analysis available for comparison.
              </p>
            </div>
          </div>
          <div className="detail-chip-grid">
            {featuredPlantFacts.map((fact) => (
              <div className="detail-chip" key={fact.label}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        </DashboardPanel>
      ),
    },
    deviceStatus: {
      span: 'dashboard-widget--medium',
      content: (
        <DashboardPanel title="Device status" eyebrow="Fleet health">
          <div className="device-status-list">
            {deviceStatuses.map((device) => (
              <div className="device-status-list__item" key={device.name}>
                <div>
                  <strong>{device.name}</strong>
                  <p>{device.coverage}</p>
                </div>
                <StatusBadge label={device.state} variant={device.tone} icon={<Activity size={12} />} />
              </div>
            ))}
          </div>
        </DashboardPanel>
      ),
    },
  };

  return (
    <div className="dashboard-page">
      <section className="dashboard-widget-grid">
        {widgetOrder.map((widgetId) => {
          const widget = widgets[widgetId];

          return (
            <div
              key={widgetId}
              className={`dashboard-widget ${widget.span}${draggedWidgetId === widgetId ? ' dashboard-widget--dragging' : ''}`}
              draggable
              onDragEnd={() => setDraggedWidgetId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDraggedWidgetId(widgetId)}
              onDrop={() => {
                if (!draggedWidgetId) {
                  return;
                }

                setWidgetOrder((currentOrder) => moveWidget(currentOrder, draggedWidgetId, widgetId));
                setDraggedWidgetId(null);
              }}
            >
              <div className="dashboard-widget__handle" aria-hidden="true">
                <GripVertical size={16} />
              </div>
              {widget.content}
            </div>
          );
        })}
      </section>
    </div>
  );
}
