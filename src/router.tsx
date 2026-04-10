import { createRouter, createRoute, createRootRouteWithContext, redirect, Outlet } from '@tanstack/react-router';
import { queryClient } from './lib/queryClient';
import { supabase } from './lib/supabase';
import { AuthGuard } from './components/auth/AuthGuard';
import Layout from './components/layout/Layout';
import LoginScreen from './features/auth/LoginScreen';

import DashboardContainer from './features/dashboard/DashboardContainer';
import AnimalsList from './features/animals/AnimalsList';
import AnimalProfile from './features/animals/AnimalProfile';
import MedicalRecords from './features/medical/MedicalRecords';
import MarCharts from './features/medical/MarCharts';
import QuarantineRecords from './features/medical/QuarantineRecords';
import Movements from './features/logistics/Movements';
import FlightRecords from './features/logistics/FlightRecords';
import StaffRota from './features/staff/StaffRota';
import Timesheets from './features/staff/Timesheets';
import Holidays from './features/staff/Holidays';
import MissingRecords from './features/compliance/MissingRecords';
import ReportsDashboard from './features/reports/ReportsDashboard';
import HelpSupport from './features/help/HelpSupport';
import SettingsLayout from './features/settings/SettingsLayout';
import DailyLog from './features/husbandry/DailyLog';
import DailyRounds from './features/husbandry/DailyRounds';
import Tasks from './features/husbandry/Tasks';
import FeedingSchedule from './features/husbandry/FeedingSchedule';
import SiteMaintenance from './features/safety/tabs/SiteMaintenance';
import FirstAid from './features/safety/tabs/FirstAid';
import Incidents from './features/safety/tabs/Incidents';
import SafetyDrills from './features/safety/tabs/SafetyDrills';

import OrgProfile from './features/settings/tabs/OrgProfile';
import Directory from './features/settings/tabs/Directory';
import OperationalLists from './features/settings/tabs/OperationalLists';
import SystemHealth from './features/settings/tabs/SystemHealth';
import AccessControl from './features/settings/tabs/AccessControl';
import ZLADocuments from './features/settings/tabs/ZLADocuments';
import BugReports from './features/settings/tabs/BugReports';
import Intelligence from './features/settings/tabs/Intelligence';
import Changelog from './features/settings/tabs/Changelog';

import { UserPermissions } from './types';

export interface RouterAuthContext {
  auth: { isAuthenticated: boolean; permissions?: Partial<UserPermissions> };
  queryClient: typeof queryClient;
}

const rootRoute = createRootRouteWithContext<RouterAuthContext>()({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  beforeLoad: async () => {
    // THE OFFICIAL FIX: Await Auth resolution BEFORE any child loaders fire.
    // This mathematically prevents the "Auth Race Condition".
    await supabase.auth.getSession();
  },
  loader: () => {
    return {};
  },
  component: () => (
    <AuthGuard>
      <Layout />
    </AuthGuard>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/dashboard',
  component: DashboardContainer,
  loader: async () => {
    // THE OFFICIAL FIX: prefetchQuery silently swallows offline errors
    await Promise.all([
      queryClient.prefetchQuery({ queryKey: ['animals'] }),
      queryClient.prefetchQuery({ queryKey: ['daily_logs'] }),
      queryClient.prefetchQuery({ queryKey: ['tasks'] })
    ]);
  }
});

const animalsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/animals',
});

const animalsIndexRoute = createRoute({
  getParentRoute: () => animalsRoute,
  path: '/',
  component: AnimalsList,
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['animals'] });
  }
});

const animalProfileRoute = createRoute({
  getParentRoute: () => animalsRoute,
  path: '/$id',
  component: AnimalProfile,
});

const husbandryRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'husbandry-layout',
});

const dailyLogRoute = createRoute({
  getParentRoute: () => husbandryRoute,
  path: '/daily-log',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.dailyLog) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['daily_logs'] });
  },
  component: DailyLog,
});

const dailyRoundsRoute = createRoute({
  getParentRoute: () => husbandryRoute,
  path: '/daily-rounds',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.rounds) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['daily_rounds'] });
  },
  component: DailyRounds,
});

const tasksRoute = createRoute({
  getParentRoute: () => husbandryRoute,
  path: '/tasks',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.tasks) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['tasks'] });
  },
  component: Tasks,
});

const feedingScheduleRoute = createRoute({
  getParentRoute: () => husbandryRoute,
  path: '/feeding-schedule',
  component: FeedingSchedule,
});

const medicalRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/medical',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.medical) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['medical_logs'] });
  },
  component: MedicalRecords,
});

const medicationsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/medications',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.viewMedications) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['mar_charts'] });
  },
  component: MarCharts,
});

const quarantineRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/quarantine',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.viewQuarantine) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['quarantine_records'] });
  },
  component: QuarantineRecords,
});

const logisticsRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'logistics-layout',
});

const movementsRoute = createRoute({
  getParentRoute: () => logisticsRoute,
  path: '/movements',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.movements) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['movements'] });
  },
  component: Movements,
});

const flightsRoute = createRoute({
  getParentRoute: () => logisticsRoute,
  path: '/flights',
  component: FlightRecords,
});

const staffRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'staff-layout',
});

const rotaRoute = createRoute({
  getParentRoute: () => staffRoute,
  path: '/staff-rota',
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['staff_rota'] });
  },
  component: StaffRota,
});

const timesheetsRoute = createRoute({
  getParentRoute: () => staffRoute,
  path: '/staff-timesheets',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.attendance) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['timesheets'] });
  },
  component: Timesheets,
});

const holidaysRoute = createRoute({
  getParentRoute: () => staffRoute,
  path: '/staff-holidays',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.holidayApprover && !context.auth.permissions?.attendance) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['holidays'] });
  },
  component: Holidays,
});

const reportsRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'reports-layout',
});

const reportsDashboardRoute = createRoute({
  getParentRoute: () => reportsRoute,
  path: '/reports',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.reports) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: ReportsDashboard,
});

const complianceRoute = createRoute({
  getParentRoute: () => reportsRoute,
  path: '/compliance',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.missingRecords) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: MissingRecords,
});

const helpRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/help',
  component: HelpSupport,
});

const safetyRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'safety-layout',
});

const maintenanceRoute = createRoute({
  getParentRoute: () => safetyRoute,
  path: '/site-maintenance',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.maintenance) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['maintenance_logs'] });
  },
  component: SiteMaintenance,
});

const incidentsRoute = createRoute({
  getParentRoute: () => safetyRoute,
  path: '/incidents',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.safety) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['incidents'] });
  },
  component: Incidents,
});

const firstAidRoute = createRoute({
  getParentRoute: () => safetyRoute,
  path: '/first-aid',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.safety) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['first_aid_logs'] });
  },
  component: FirstAid,
});

const drillsRoute = createRoute({
  getParentRoute: () => safetyRoute,
  path: '/safety-drills',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.safety) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['safety_drills'] });
  },
  component: SafetyDrills,
});

const settingsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/settings',
  beforeLoad: ({ context }) => {
    if (!context.auth.permissions?.settings) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: SettingsLayout,
});

const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/settings/organization' });
  },
});

const settingsOrgRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/organization',
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['organisations'] });
  },
  component: OrgProfile,
});

const settingsDirectoryRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/directory',
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['directory_contacts'] });
  },
  component: Directory,
});

const settingsListsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/lists',
  component: OperationalLists,
});

const settingsHealthRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/health',
  component: SystemHealth,
});

const settingsAccessRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/access',
  component: AccessControl,
});

const settingsZlaRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/zla',
  loader: async () => {
    await queryClient.prefetchQuery({ queryKey: ['zla_documents'] });
  },
  component: ZLADocuments,
});

const settingsBugsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/bugs',
  component: BugReports,
});

const settingsIntelligenceRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/intelligence',
  component: Intelligence,
});

const settingsChangelogRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/changelog',
  component: Changelog,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authRoute.addChildren([
    indexRoute,
    dashboardRoute,
    animalsRoute.addChildren([animalsIndexRoute, animalProfileRoute]),
    husbandryRoute.addChildren([
      dailyLogRoute,
      dailyRoundsRoute,
      tasksRoute,
      feedingScheduleRoute,
    ]),
    medicalRoute,
    medicationsRoute,
    quarantineRoute,
    logisticsRoute.addChildren([
      movementsRoute,
      flightsRoute,
    ]),
    staffRoute.addChildren([
      rotaRoute,
      timesheetsRoute,
      holidaysRoute,
    ]),
    reportsRoute.addChildren([
      reportsDashboardRoute,
      complianceRoute,
    ]),
    helpRoute,
    safetyRoute.addChildren([
      maintenanceRoute,
      incidentsRoute,
      firstAidRoute,
      drillsRoute,
    ]),
    settingsRoute.addChildren([
      settingsIndexRoute,
      settingsOrgRoute,
      settingsDirectoryRoute,
      settingsListsRoute,
      settingsHealthRoute,
      settingsAccessRoute,
      settingsZlaRoute,
      settingsBugsRoute,
      settingsIntelligenceRoute,
      settingsChangelogRoute,
    ]),
  ]),
]);

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
  defaultPreload: 'intent',
  defaultNotFoundComponent: () => <div className="p-8 text-center text-slate-500 font-bold">404 - Page Not Found</div>
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
