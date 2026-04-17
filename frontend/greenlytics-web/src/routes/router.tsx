import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';

import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage';
import { CreatePlantPage } from '@/modules/plants/pages/CreatePlantPage';
import { PlantDetailPage } from '@/modules/plants/pages/PlantDetailPage';
import { PlantsPage } from '@/modules/plants/pages/PlantsPage';
import { AppLayout } from '@/layouts/AppLayout';
import { DetailTemplate } from '@/shared/components/DetailTemplate';
import { FormTemplate } from '@/shared/components/FormTemplate';
import { SearchTemplate } from '@/shared/components/SearchTemplate';
import type { SearchResponse } from '@/types/api';

const emptySearchData: SearchResponse<Record<string, string>> = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };

function SearchRoute(props: { title: string; description: string; filtersSummary: string; columns: Array<{ key: string; label: string }>; cta?: string }) {
  return <SearchTemplate title={props.title} description={props.description} filtersSummary={props.filtersSummary} data={emptySearchData} columns={props.columns} primaryAction={props.cta ? <a className="primary-button" href={props.cta}>New</a> : undefined} />;
}

function FormRoute(props: { title: string; description: string; note: string }) {
  return <FormTemplate title={props.title} description={props.description}><p className="card-muted">{props.note}</p></FormTemplate>;
}

function DetailRoute(props: { title: string; description: string; paramName: string; facts: Array<{ label: string; value: string }> }) {
  const params = useParams();
  const identifier = params[props.paramName] ?? `unknown-${props.paramName}`;
  return <DetailTemplate title={props.title} description={props.description} identifier={identifier} facts={props.facts} />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'plants/search', element: <PlantsPage /> },
      { path: 'plants/new', element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><CreatePlantPage /></ProtectedRoute> },
      { path: 'plants/:plantId', element: <PlantDetailPage /> },
      { path: 'plants/:plantId/photos', element: <DetailRoute title="Plant photos" description="Ready for signed URL search, photo upload and chronology flows." paramName="plantId" facts={[{ label: 'Search pattern', value: 'POST /api/plants/photos/search' }, { label: 'Upload pattern', value: 'POST /api/plants/{plantId}/photos' }, { label: 'Validation', value: 'Rich backend field errors supported' }]} /> },
      { path: 'plants/:plantId/chronology', element: <DetailRoute title="Plant chronology" description="Timeline view scaffold for photo evolution and future analysis snapshots." paramName="plantId" facts={[{ label: 'Search pattern', value: 'POST /api/plants/photos/chronology/search' }, { label: 'UI intent', value: 'History and evolution' }, { label: 'Reuse', value: 'Shared search and detail building blocks' }]} /> },
      { path: 'plants/:plantId/analysis', element: <DetailRoute title="Plant analysis" description="Reserved for OpenAI-driven analysis snapshots and interpretation views." paramName="plantId" facts={[{ label: 'Current backend', value: 'Create and analyze flows already available' }, { label: 'Future', value: 'Historical analysis snapshots' }, { label: 'Frontend phase', value: 'Detail and compare results' }]} /> },
      { path: 'plants/:plantId/readings', element: <DetailRoute title="Plant readings" description="Bridge between plant context and device sensor data." paramName="plantId" facts={[{ label: 'Search pattern', value: 'POST /api/readings/search' }, { label: 'Charts', value: 'POST /api/readings/timeseries' }, { label: 'Scope', value: 'Strict client and role-aware access' }]} /> },
      { path: 'plants/:plantId/alerts', element: <DetailRoute title="Plant alerts" description="Alert configuration and monitoring in plant context." paramName="plantId" facts={[{ label: 'Module', value: 'Alerts' }, { label: 'Scope', value: 'Plant + client aware' }, { label: 'Next UI step', value: 'Rule list and alert form' }]} /> },
      { path: 'installations/search', element: <SearchRoute title="Installations" description="Client-scoped installation search with reusable POST filters." filtersSummary="filters.code, name, clientId, isActive, location, city, country, createdFrom, createdTo" columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'city', label: 'City' }, { key: 'active', label: 'Active' }]} cta="/installations/new" /> },
      { path: 'installations/new', element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><FormRoute title="Create installation" description="Ready for client-scoped create and update flows in V3." note="Connect this page next to the installation create mutation, role checks and backend validation errors." /></ProtectedRoute> },
      { path: 'installations/:installationId', element: <DetailRoute title="Installation detail" description="Detail scaffold for installation overview, devices and plants." paramName="installationId" facts={[{ label: 'GET endpoint', value: '/api/installations/{installationId}' }, { label: 'Role model', value: 'Admin all, manager own client, viewer read-only' }, { label: 'Next UI step', value: 'Summary cards and linked resources' }]} /> },
      { path: 'devices/search', element: <SearchRoute title="Devices" description="Device inventory with client scope, installation assignment and search-body contracts." filtersSummary="filters.code, name, serialNumber, clientId, installationId, deviceTypeId, isActive, createdFrom, createdTo" columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'serialNumber', label: 'Serial' }, { key: 'status', label: 'Status' }]} cta="/devices/new" /> },
      { path: 'devices/new', element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><FormRoute title="Create device" description="Ready for device create, assign-installation and validation flows." note="Next step: connect device type lookup, installation assignment and duplicate-code handling." /></ProtectedRoute> },
      { path: 'devices/:deviceId', element: <DetailRoute title="Device detail" description="Detail scaffold for device metadata, assignment and ingestion health." paramName="deviceId" facts={[{ label: 'Detail endpoint', value: '/api/devices/{deviceId}' }, { label: 'IoT bridge', value: 'Readings ingest and device API keys' }, { label: 'Next UI step', value: 'Assignment history and latest telemetry' }]} /> },
      { path: 'alerts/search', element: <SearchRoute title="Alerts" description="Rules search ready for condition filters, severity evolution and scope-aware operations." filtersSummary="filters.name, clientId, installationId, plantId, readingTypeId, isActive, channel, conditionType, createdFrom, createdTo" columns={[{ key: 'name', label: 'Name' }, { key: 'channel', label: 'Channel' }, { key: 'scope', label: 'Scope' }, { key: 'active', label: 'Active' }]} cta="/alerts/new" /> },
      { path: 'alerts/new', element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><FormRoute title="Create alert" description="Ready for rule builder forms, condition validation and linked entity selectors." note="Next step: connect reading types, condition operators and channel-specific validation." /></ProtectedRoute> },
      { path: 'alerts/:alertId', element: <DetailRoute title="Alert detail" description="Rule detail, target entities and future execution history." paramName="alertId" facts={[{ label: 'Detail endpoint', value: '/api/alerts/{alertId}' }, { label: 'Activation model', value: 'Activate/deactivate instead of hard delete' }, { label: 'Future step', value: 'Execution history and notifications' }]} /> },
      { path: 'readings/search', element: <SearchRoute title="Readings" description="Search sensor telemetry with strict client scope and operations filters." filtersSummary="filters.deviceId, plantId, readingTypeId, dateFrom, dateTo, valueMin, valueMax, clientId, installationId" columns={[{ key: 'recordedAt', label: 'Recorded at' }, { key: 'device', label: 'Device' }, { key: 'readingType', label: 'Reading type' }, { key: 'value', label: 'Value' }]} /> },
      { path: 'readings/timeseries', element: <FormRoute title="Readings timeseries" description="Ready for chart filters, bucket selection and aggregated dashboard views." note="Phase 2: bind this page to POST /api/readings/timeseries with hour/day buckets and avg/min/max metrics." /> },
      { path: 'users/search', element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><SearchRoute title="Users" description="User provisioning and client-scoped access management aligned with V3 auth." filtersSummary="filters.email, username, firstName, lastName, roleId, isActive, clientId, createdFrom, createdTo" columns={[{ key: 'email', label: 'Email' }, { key: 'username', label: 'Username' }, { key: 'role', label: 'Role' }, { key: 'active', label: 'Active' }]} cta="/users/new" /></ProtectedRoute> },
      { path: 'users/new', element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><FormRoute title="Create user" description="Ready for invite/password provisioning flows and field-level validation feedback." note="Next step: wire role lookup, client rules and provisioning mode selection." /></ProtectedRoute> },
      { path: 'users/:userId', element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><DetailRoute title="User detail" description="User profile, access role and activation actions." paramName="userId" facts={[{ label: 'Module', value: 'Users' }, { label: 'Provisioning', value: 'Invite or password' }, { label: 'Scope', value: 'Admin global, manager own client' }]} /></ProtectedRoute> },
      { path: 'clients/search', element: <ProtectedRoute allowedRoles={['ADMIN']}><SearchRoute title="Clients" description="Global client administration reserved for ADMIN users." filtersSummary="filters.code, name, isActive, createdFrom, createdTo" columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'active', label: 'Active' }, { key: 'createdOn', label: 'Created on' }]} cta="/clients/new" /></ProtectedRoute> },
      { path: 'clients/new', element: <ProtectedRoute allowedRoles={['ADMIN']}><FormRoute title="Create client" description="Ready for clean SaaS client administration flows." note="Next step: wire create/update mutations and duplicate-code validation handling." /></ProtectedRoute> },
      { path: 'clients/:clientId', element: <ProtectedRoute allowedRoles={['ADMIN']}><DetailRoute title="Client detail" description="Global client overview with users, installations and devices." paramName="clientId" facts={[{ label: 'Module', value: 'Clients' }, { label: 'Role access', value: 'Admin only' }, { label: 'Future step', value: 'Tenant-level health and billing data' }]} /></ProtectedRoute> },
      { path: 'settings', element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><FormRoute title="Settings" description="Client-scoped settings and future operator preferences." note="Phase 2: add client branding, profile and operational preferences." /></ProtectedRoute> },
    ],
  },
]);
