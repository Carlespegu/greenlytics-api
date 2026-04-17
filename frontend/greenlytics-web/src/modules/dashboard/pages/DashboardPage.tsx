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

import { useI18n } from '@/app/i18n/LanguageProvider';
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
  { name: 'dashboard.thriving', value: 54, color: '#36d399' },
  { name: 'dashboard.monitor', value: 28, color: '#fbbf24' },
  { name: 'dashboard.critical', value: 18, color: '#fb7185' },
];

const latestAlerts = [
  { title: 'dashboard.zoneBIrrigationDrift', scope: 'dashboard.installationInst021', time: 'dashboard.sixMinutesAgo', severity: 'warning' as const },
  { title: 'dashboard.humidityThresholdExceeded', scope: 'dashboard.plantPhalaenopsis018', time: 'dashboard.nineteenMinutesAgo', severity: 'danger' as const },
  { title: 'dashboard.sensorBackOnline', scope: 'dashboard.deviceDev044', time: 'dashboard.fortyTwoMinutesAgo', severity: 'success' as const },
];

const insightCards = [
  {
    icon: <Sparkles size={16} />,
    title: 'dashboard.irrigationOpportunity',
    text: 'dashboard.irrigationOpportunityText',
  },
  {
    icon: <Bot size={16} />,
    title: 'dashboard.analysisReuseReady',
    text: 'dashboard.analysisReuseReadyText',
  },
];

const deviceStatuses = [
  { name: 'ESP32 Soil Cluster', state: 'dashboard.deviceHealthy', coverage: 'dashboard.deviceCoverage1', tone: 'success' as const },
  { name: 'Greenhouse Mesh', state: 'dashboard.deviceWatch', coverage: 'dashboard.deviceCoverage2', tone: 'warning' as const },
  { name: 'North Canopy Probe', state: 'dashboard.deviceOffline', coverage: 'dashboard.deviceCoverage3', tone: 'danger' as const },
];

const featuredPlantFacts = [
  { label: 'dashboard.species', value: 'dashboard.speciesValue' },
  { label: 'dashboard.healthScoreFact', value: 'dashboard.healthScoreValue' },
  { label: 'dashboard.lastAnalysis', value: 'dashboard.lastAnalysisValue' },
  { label: 'dashboard.moistureTrendFact', value: 'dashboard.moistureTrendValue' },
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
  const { t } = useI18n();
  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>([...defaultWidgetOrder]);

  const storageKey = useMemo(
    () => `greenlytics:dashboard-layout:${user?.userId ?? 'anonymous'}`,
    [user?.userId],
  );
  const translatedHealthDistribution = useMemo(
    () => healthDistribution.map((item) => ({ ...item, translatedName: t(item.name) })),
    [t],
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
          label={t('dashboard.totalPlants')}
          value="1,284"
          delta="+8.4%"
          trend="up"
          tone="green"
          icon={<Flower2 size={18} />}
          hint={t('dashboard.vsPrevious7Days')}
        />
      ),
    },
    devices: {
      span: 'dashboard-widget--metric',
      content: (
        <MetricCard
          label={t('dashboard.activeDevices')}
          value="214"
          delta="+3 online"
          trend="up"
          tone="blue"
          icon={<Cpu size={18} />}
          hint={t('dashboard.networkHealth')}
        />
      ),
    },
    alerts: {
      span: 'dashboard-widget--metric',
      content: (
        <MetricCard
          label={t('dashboard.openAlerts')}
          value="19"
          delta="-4 resolved"
          trend="down"
          tone="amber"
          icon={<ShieldAlert size={18} />}
          hint={t('dashboard.requireActionToday')}
        />
      ),
    },
    health: {
      span: 'dashboard-widget--metric',
      content: (
        <MetricCard
          label={t('dashboard.healthScore')}
          value="87.6"
          delta="+2.1 pts"
          trend="up"
          tone="green"
          icon={<Leaf size={18} />}
          hint={t('dashboard.fleetWeightedAverage')}
        />
      ),
    },
    moisture: {
      span: 'dashboard-widget--wide dashboard-widget--tall',
      content: (
        <DashboardPanel title={t('dashboard.soilMoistureTrend')} eyebrow={t('dashboard.telemetry')} className="dashboard-panel--chart">
          <SectionHeading
            title={t('dashboard.dailyIrrigationStability')}
            subtitle={t('dashboard.chartPlaceholder')}
            action={<StatusBadge label={t('dashboard.syncedRecently')} variant="success" icon={<Wifi size={12} />} />}
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
        <DashboardPanel title={t('dashboard.plantHealthDistribution')} eyebrow={t('dashboard.portfolio')}>
          <SectionHeading title={t('dashboard.currentPortfolioMix')} subtitle={t('dashboard.healthAggregationHint')} />
          <div className="dashboard-split">
            <div className="donut-shell">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={translatedHealthDistribution} dataKey="value" nameKey="translatedName" innerRadius={62} outerRadius={86} paddingAngle={4}>
                    {translatedHealthDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#09151f', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 16 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="stack-list">
              {translatedHealthDistribution.map((item) => (
                <div className="stack-list__item" key={item.name}>
                  <div className="stack-list__legend">
                    <span className="stack-list__swatch" style={{ backgroundColor: item.color }} />
                    <strong>{item.translatedName}</strong>
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
        <DashboardPanel title={t('dashboard.smartOperationalHighlights')} eyebrow={t('dashboard.insights')}>
          <div className="insight-grid">
            {insightCards.map((insight) => (
              <article className="insight-card" key={insight.title}>
                <span className="insight-card__icon">{insight.icon}</span>
                <strong>{t(insight.title)}</strong>
                <p>{t(insight.text)}</p>
                <button className="ghost-button" type="button">
                  {t('dashboard.reviewInsight')} <ArrowUpRight size={14} />
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
        <DashboardPanel title={t('dashboard.latestAlerts')} eyebrow={t('dashboard.attentionNeeded')}>
          <div className="timeline-list">
            {latestAlerts.map((alert) => (
              <div className="timeline-list__item" key={alert.title}>
                <div className="timeline-list__icon">
                  <CircleAlert size={16} />
                </div>
                <div className="timeline-list__content">
                  <strong>{t(alert.title)}</strong>
                  <span>{t(alert.scope)}</span>
                </div>
                <div className="timeline-list__meta">
                  <StatusBadge label={alert.severity} variant={alert.severity} />
                  <span>{t(alert.time)}</span>
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
        <DashboardPanel title={t('dashboard.featuredPlant')} eyebrow={t('dashboard.spotlight')} className="dashboard-panel--spotlight">
          <div className="spotlight-card">
            <div className="spotlight-card__visual">
              <div className="spotlight-card__orb" />
              <Droplets size={34} />
            </div>
            <div>
              <h4>{t('dashboard.featuredPlantName')}</h4>
              <p>{t('dashboard.featuredPlantText')}</p>
            </div>
          </div>
          <div className="detail-chip-grid">
            {featuredPlantFacts.map((fact) => (
              <div className="detail-chip" key={fact.label}>
                <span>{t(fact.label)}</span>
                <strong>{t(fact.value)}</strong>
              </div>
            ))}
          </div>
        </DashboardPanel>
      ),
    },
    deviceStatus: {
      span: 'dashboard-widget--medium',
      content: (
        <DashboardPanel title={t('dashboard.deviceStatus')} eyebrow={t('dashboard.fleetHealth')}>
          <div className="device-status-list">
            {deviceStatuses.map((device) => (
              <div className="device-status-list__item" key={device.name}>
                <div>
                  <strong>{device.name}</strong>
                  <p>{t(device.coverage)}</p>
                </div>
                <StatusBadge label={t(device.state)} variant={device.tone} icon={<Activity size={12} />} />
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
