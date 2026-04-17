import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Factory,
  FileWarning,
  Gauge,
  Leaf,
  LogOut,
  Radar,
  Search,
  Settings,
  ShieldCheck,
  Sprout,
  Users,
  Waves,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { postSearch } from '@/api/search';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/hooks/useAuth';
import { clientApi, type ClientOption } from '@/modules/clients/api/clientApi';
import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { navigationSections } from '@/shared/navigation/navigation';
import { Dropdown } from '@/shared/ui/Dropdown';
import { SidebarNavItem } from '@/shared/ui/SidebarNavItem';

const iconMap = {
  Dashboard: <Gauge size={18} />,
  Plants: <Sprout size={18} />,
  Installations: <Factory size={18} />,
  Devices: <Radar size={18} />,
  Alerts: <FileWarning size={18} />,
  Readings: <Waves size={18} />,
  Users: <Users size={18} />,
  Clients: <ShieldCheck size={18} />,
  Settings: <Settings size={18} />,
} as const;

const timeOptions = ['Today', 'Last 7 Days', 'This Month'];
const languageOptions = ['Català', 'Español', 'English'];
const MIN_CLIENT_SEARCH_LENGTH = 2;

interface InstallationSearchFilters {
  clientId: string;
}

interface InstallationOption {
  installationId?: string;
  id?: string;
  code?: string;
  name?: string;
}

function getInstallationValue(installation: InstallationOption) {
  return installation.installationId ?? installation.id ?? installation.code ?? installation.name ?? '';
}

function getInstallationLabel(installation: InstallationOption) {
  return installation.name ?? installation.code ?? installation.installationId ?? installation.id ?? 'Installation';
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { clientId: activeClientId, clientName: activeClientName, setActiveClient } = useActiveClient();
  const isDashboardRoute = location.pathname === '/dashboard';

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeOptions[1]);
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const trimmedClientSearch = clientSearch.trim();
  const debouncedClientSearch = useDebouncedValue(trimmedClientSearch, 400);
  const canSearchClients = Boolean(
    user
    && user.roleCode === 'ADMIN'
    && isUserMenuOpen
    && isClientSelectorOpen
    && debouncedClientSearch.length >= MIN_CLIENT_SEARCH_LENGTH,
  );

  const clientDetailQuery = useQuery({
    queryKey: ['active-client-detail', activeClientId],
    enabled: Boolean(activeClientId) && !activeClientName,
    queryFn: async () => clientApi.getById(activeClientId!),
    staleTime: 60_000,
  });

  const clientSearchQuery = useQuery({
    queryKey: ['clients-search', debouncedClientSearch],
    enabled: canSearchClients,
    queryFn: async () => clientApi.searchByName(debouncedClientSearch),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const installationsQuery = useQuery({
    queryKey: ['client-installations', activeClientId],
    enabled: Boolean(activeClientId),
    queryFn: async () => {
      const response = await postSearch<InstallationOption, InstallationSearchFilters, 'name'>('/api/installations/search', {
        filters: {
          clientId: activeClientId!,
        },
        pagination: {
          page: 1,
          pageSize: 100,
        },
        sort: {
          field: 'name',
          direction: 'asc',
        },
      });

      return response.items;
    },
    staleTime: 60_000,
  });

  const resolvedClientName = activeClientName ?? clientDetailQuery.data?.name ?? user?.clientName ?? null;

  const installationOptions = useMemo(
    () =>
      (installationsQuery.data ?? [])
        .map((installation) => ({
          value: getInstallationValue(installation),
          label: getInstallationLabel(installation),
        }))
        .filter((installation) => installation.value.length > 0),
    [installationsQuery.data],
  );

  const selectedInstallationLabel = installationOptions.find((option) => option.value === selectedInstallation)?.label
    ?? (installationsQuery.isLoading ? 'Loading installations...' : 'No installations');

  const userInitials = useMemo(() => {
    if (!user?.username) {
      return 'GL';
    }

    return (
      user.username
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || user.username.slice(0, 2).toUpperCase()
    );
  }, [user?.username]);

  useEffect(() => {
    const savedState = window.localStorage.getItem('greenlytics:sidebar-collapsed');

    if (savedState) {
      setIsSidebarCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    if (activeClientId && clientDetailQuery.data?.name && clientDetailQuery.data.name !== activeClientName) {
      setActiveClient({
        clientId: activeClientId,
        clientName: clientDetailQuery.data.name,
      });
    }
  }, [activeClientId, activeClientName, clientDetailQuery.data?.name, setActiveClient]);

  useEffect(() => {
    setSelectedInstallation('');
  }, [activeClientId]);

  useEffect(() => {
    if (!selectedInstallation && installationOptions.length > 0) {
      setSelectedInstallation(installationOptions[0].value);
    }
  }, [installationOptions, selectedInstallation]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      setIsClientSelectorOpen(false);
      setClientSearch('');
    }
  }, [isUserMenuOpen]);

  function toggleSidebar() {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem('greenlytics:sidebar-collapsed', String(next));
      return next;
    });
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function handleSelectClient(client: ClientOption) {
    setActiveClient({
      clientId: client.id,
      clientName: client.name,
    });
    setClientSearch('');
    setIsClientSelectorOpen(false);
  }

  const visibleSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => (user ? item.roles.includes(user.roleCode) : false)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className={`shell shell--sidebar${isSidebarCollapsed ? ' shell--sidebar-collapsed' : ''}`}>
      <div className="shell__ambient shell__ambient--left" />
      <div className="shell__ambient shell__ambient--right" />

      <aside
        className={`shell-sidebar shell-sidebar--expanded${isSidebarCollapsed ? ' shell-sidebar--collapsed' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="shell-sidebar__header">
          <div className={`shell-sidebar__brand shell-sidebar__brand--expanded${isSidebarCollapsed ? ' shell-sidebar__brand--collapsed' : ''}`}>
            <div className="shell-sidebar__logo-mark">
              <img alt="GreenLytics" className="shell-sidebar__logo-image" src="/icon.jpg" />
            </div>
            <div className={`shell-sidebar__brandcopy${isSidebarCollapsed ? ' shell-sidebar__brandcopy--hidden' : ''}`}>
              <span className="shell-sidebar__eyebrow">GreenLytics</span>
            </div>
          </div>

          <button
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="shell-sidebar__toggle"
            type="button"
            onClick={toggleSidebar}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className={`shell-sidebar__nav shell-sidebar__nav--expanded${isSidebarCollapsed ? ' shell-sidebar__nav--collapsed' : ''}`} aria-label="Primary navigation">
          {visibleSections.map((section) => (
            <div className="shell-sidebar__group" key={section.label}>
              {!isSidebarCollapsed ? <span className="shell-sidebar__group-label">{section.label}</span> : null}
              <div className={`shell-sidebar__items shell-sidebar__items--expanded${isSidebarCollapsed ? ' shell-sidebar__items--collapsed' : ''}`}>
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.to}
                    collapsed={isSidebarCollapsed}
                    to={item.to}
                    label={item.label}
                    icon={iconMap[item.label as keyof typeof iconMap] ?? <Leaf size={18} />}
                    pathname={location.pathname}
                    isMatch={(pathname) => pathname.startsWith(item.to + '/')}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="shell-main shell-main--sidebar">
        <header className={`shell-topbar${isDashboardRoute ? ' shell-topbar--dashboard' : ' shell-topbar--module'}`}>
          {isDashboardRoute ? (
            <div className="shell-topbar__intro">
              <h1>Dashboard</h1>
              <p>Plant health, sensors and system status overview</p>
            </div>
          ) : <div />}

          <div className={`shell-topbar__actions${isDashboardRoute ? ' shell-topbar__actions--dashboard' : ' shell-topbar__actions--module'}`}>
            {isDashboardRoute ? (
              <>
                <label className="topbar-search" aria-label="Search">
                  <Search size={16} />
                  <input placeholder="Search..." type="search" />
                </label>

                <Dropdown
                  className="topbar-dropdown"
                  panelClassName="topbar-dropdown__panel"
                  triggerClassName="topbar-dropdown__trigger"
                  trigger={() => (
                    <>
                      <span className="topbar-dropdown__label">{selectedInstallationLabel}</span>
                      <ChevronDown size={16} />
                    </>
                  )}
                >
                  {({ close }) => (
                    <div className="dropdown-menu-list" role="menu">
                      {installationOptions.length === 0 ? (
                        <div className="dropdown-menu-item dropdown-menu-item--muted">{selectedInstallationLabel}</div>
                      ) : (
                        installationOptions.map((option) => (
                          <button
                            key={option.value}
                            className={`dropdown-menu-item${option.value === selectedInstallation ? ' dropdown-menu-item--active' : ''}`}
                            type="button"
                            onClick={() => {
                              setSelectedInstallation(option.value);
                              close();
                            }}
                          >
                            {option.label}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </Dropdown>

                <Dropdown
                  className="topbar-dropdown"
                  panelClassName="topbar-dropdown__panel"
                  triggerClassName="topbar-dropdown__trigger"
                  trigger={() => (
                    <>
                      <span className="topbar-dropdown__label">{selectedTimeRange}</span>
                      <ChevronDown size={16} />
                    </>
                  )}
                >
                  {({ close }) => (
                    <div className="dropdown-menu-list" role="menu">
                      {timeOptions.map((option) => (
                        <button
                          key={option}
                          className={`dropdown-menu-item${option === selectedTimeRange ? ' dropdown-menu-item--active' : ''}`}
                          type="button"
                          onClick={() => {
                            setSelectedTimeRange(option);
                            close();
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </Dropdown>
              </>
            ) : null}

            <button className="topbar-icon-button" type="button" aria-label="Notifications">
              <Bell size={18} />
              <span className="topbar-icon-button__dot" />
            </button>

            <Dropdown
              align="right"
              className="topbar-user-menu"
              open={isUserMenuOpen}
              panelClassName="topbar-user-dropdown"
              triggerClassName="topbar-user-trigger"
              onOpenChange={setIsUserMenuOpen}
              trigger={() => (
                <>
                  <span className="topbar-user-trigger__avatar">{userInitials}</span>
                  <ChevronDown size={16} />
                </>
              )}
            >
              <div role="menu">
                <div className="topbar-user-dropdown__row">
                  <span>Name</span>
                  <strong>{user?.username ?? '-'}</strong>
                </div>
                <div className="topbar-user-dropdown__row">
                  <span>Rol</span>
                  <strong>{user?.roleName ?? user?.roleCode ?? '-'}</strong>
                </div>

                {user?.roleCode === 'ADMIN' ? (
                  <div className="topbar-user-dropdown__field topbar-user-dropdown__field--searchable">
                    <span>Client</span>
                    <Dropdown
                      className="topbar-user-select-dropdown"
                      open={isClientSelectorOpen}
                      panelClassName="topbar-user-select-dropdown__panel topbar-user-client-dropdown"
                      triggerClassName="topbar-user-select"
                      onOpenChange={(nextOpen) => {
                        setIsClientSelectorOpen(nextOpen);
                        if (!nextOpen) {
                          setClientSearch('');
                        }
                      }}
                      trigger={() => (
                        <>
                          <span className="topbar-dropdown__label">{resolvedClientName ?? 'Select client'}</span>
                          <ChevronDown size={16} />
                        </>
                      )}
                    >
                      {({ close }) => (
                        <div className="topbar-user-client-dropdown__content" role="menu">
                          <label className="topbar-user-search" aria-label="Search client">
                            <Search size={14} />
                            <input
                              placeholder="Search client"
                              type="search"
                              value={clientSearch}
                              onChange={(event) => setClientSearch(event.target.value)}
                            />
                          </label>

                          <div className="topbar-user-search-results">
                            {debouncedClientSearch.length < MIN_CLIENT_SEARCH_LENGTH ? (
                              <div className="dropdown-menu-item dropdown-menu-item--muted">
                                Type at least {MIN_CLIENT_SEARCH_LENGTH} characters
                              </div>
                            ) : null}

                            {canSearchClients && clientSearchQuery.isLoading ? (
                              <div className="dropdown-menu-item dropdown-menu-item--muted">Searching clients...</div>
                            ) : null}

                            {canSearchClients && !clientSearchQuery.isLoading && clientSearchQuery.data?.length === 0 ? (
                              <div className="dropdown-menu-item dropdown-menu-item--muted">No clients found</div>
                            ) : null}

                            {canSearchClients ? clientSearchQuery.data?.map((client) => (
                              <button
                                key={client.id}
                                className={`dropdown-menu-item${client.id === activeClientId ? ' dropdown-menu-item--active' : ''}`}
                                type="button"
                                onClick={() => {
                                  handleSelectClient(client);
                                  close();
                                }}
                              >
                                <strong>{client.name}</strong>
                                <span>{client.code}</span>
                              </button>
                            )) : null}
                          </div>
                        </div>
                      )}
                    </Dropdown>
                  </div>
                ) : (
                  <div className="topbar-user-dropdown__row">
                    <span>Client</span>
                    <strong>{resolvedClientName ?? '-'}</strong>
                  </div>
                )}

                <div className="topbar-user-dropdown__field">
                  <span>Select language</span>
                  <Dropdown
                    className="topbar-user-select-dropdown"
                    panelClassName="topbar-user-select-dropdown__panel"
                    triggerClassName="topbar-user-select"
                    trigger={() => (
                      <>
                        <span className="topbar-dropdown__label">{selectedLanguage}</span>
                        <ChevronDown size={16} />
                      </>
                    )}
                  >
                    {({ close }) => (
                      <div className="dropdown-menu-list" role="menu">
                        {languageOptions.map((option) => (
                          <button
                            key={option}
                            className={`dropdown-menu-item${option === selectedLanguage ? ' dropdown-menu-item--active' : ''}`}
                            type="button"
                            onClick={() => {
                              setSelectedLanguage(option);
                              close();
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </Dropdown>
                </div>

                <button className="topbar-user-dropdown__logout" type="button" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </Dropdown>
          </div>
        </header>

        <main className="shell-content shell-content--scrollable">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
