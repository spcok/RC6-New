import { useState } from 'react';
import { Outlet, useLocation, Link } from '@tanstack/react-router';
import { LayoutContext } from './LayoutContext';
import { useAuthStore } from '../../store/authStore';
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { 
  LayoutDashboard, ClipboardList, CheckSquare, CalendarDays, 
  Stethoscope, ArrowRightLeft, Plane, Wrench, AlertTriangle, 
  Cross, ShieldAlert, Clock, Calendar, Users, FileCheck, 
  BarChart2, Settings, HelpCircle, LogOut, Menu, X, ChevronLeft, ChevronRight,
  Accessibility, Pill
} from 'lucide-react';
import { A11yControlPanel } from './A11yControlPanel';
import { ClockInButton } from '../staff/ClockInButton';
import { UserPermissions } from '../../types';

const lockedPermissions: UserPermissions = {
  dashboard: false, dailyLog: false, tasks: false, medical: false,
  movements: false, safety: false, maintenance: false, settings: false,
  flightRecords: false, feedingSchedule: false, attendance: false,
  holidayApprover: false, attendanceManager: false, missingRecords: false,
  reports: false, rounds: false, view_archived_records: false,
  userManagement: false, viewMedications: false, viewQuarantine: false
};

const NAVIGATION_GROUPS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permKey: null },
    ]
  },
  {
    title: 'Husbandry',
    items: [
      { name: 'Daily Logs', path: '/daily-log', icon: ClipboardList, permKey: 'dailyLog' },
      { name: 'Daily Rounds', path: '/daily-rounds', icon: CheckSquare, permKey: 'rounds' },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare, permKey: 'tasks' },
      { name: 'Feeding Schedule', path: '/feeding-schedule', icon: CalendarDays, permKey: null },
    ]
  },
  {
    title: 'Animals',
    items: [
      { name: 'Animals', path: '/animals', icon: ClipboardList, permKey: null },
      { name: 'Clinical Notes', path: '/medical', icon: Stethoscope, permKey: 'medical' },
      { name: 'Medications', path: '/medications', icon: Pill, permKey: 'viewMedications' },
      { name: 'Quarantine', path: '/quarantine', icon: ShieldAlert, permKey: 'viewQuarantine' },
    ]
  },
  {
    title: 'Logistics',
    items: [
      { name: 'Movements', path: '/movements', icon: ArrowRightLeft, permKey: 'movements' },
      { name: 'Flight Records', path: '/flights', icon: Plane, permKey: null },
    ]
  },
  {
    title: 'Safety',
    items: [
      { name: 'Maintenance', path: '/site-maintenance', icon: Wrench, permKey: 'maintenance' },
      { name: 'Incidents', path: '/incidents', icon: AlertTriangle, permKey: 'safety' },
      { name: 'First Aid', path: '/first-aid', icon: Cross, permKey: 'safety' },
      { name: 'Safety Drills', path: '/safety-drills', icon: ShieldAlert, permKey: 'safety' },
    ]
  },
  {
    title: 'Staff',
    items: [
      { name: 'Timesheets', path: '/staff-timesheets', icon: Clock, permKey: 'attendance' },
      { name: 'Holidays', path: '/staff-holidays', icon: Calendar, permKey: 'attendance' },
      { name: 'Rota', path: '/staff-rota', icon: Users, permKey: null },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Compliance', path: '/compliance', icon: FileCheck, permKey: 'missingRecords' },
      { name: 'Reports', path: '/reports', icon: BarChart2, permKey: 'reports' },
      { name: 'Settings', path: '/settings', icon: Settings, permKey: 'settings' },
      { name: 'Help', path: '/help', icon: HelpCircle, permKey: null },
    ]
  }
];

export default function Layout() {
  useSupabaseRealtime();
  const location = useLocation();
  const currentUser = useAuthStore(s => s.currentUser);
  const logout = useAuthStore(s => s.logout);
  const permissions = currentUser?.permissions || lockedPermissions;
  const { isOnline } = useNetworkStatus();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isA11yOpen, setIsA11yOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 text-sm font-semibold text-center z-50 shrink-0 shadow-sm">
          ⚠️ You are offline. Operating from 30-Day Shadow Database. Changes will sync automatically when connected.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/90 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`
            fixed md:static inset-y-0 left-0 z-50
            bg-slate-900 text-slate-300
            transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
            w-64 flex flex-col border-r border-slate-800
          `}
        >
          <div className="flex items-center justify-between h-16 px-4 bg-slate-950 border-b border-slate-800">
            {!isSidebarCollapsed && <span className="text-xl font-bold text-white">KOA Manager</span>}
            {isSidebarCollapsed && <span className="text-xl font-bold text-white mx-auto">KM</span>}
            <button 
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
            <nav className="space-y-6 px-2">
              {NAVIGATION_GROUPS.map((group) => {
                const visibleItems = group.items.filter(item => {
                  if (!item.permKey) return true;
                  return permissions[item.permKey as keyof UserPermissions];
                });

                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.title} className="space-y-1">
                    {!isSidebarCollapsed && (
                      <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        {group.title}
                      </h3>
                    )}
                    {visibleItems.map((item) => {
                      const isActive = location.pathname === item.path || 
                        (item.path !== '/' && location.pathname.startsWith(item.path));
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`
                            flex items-center px-3 py-2 rounded-md transition-colors
                            ${isActive 
                              ? 'bg-emerald-600 text-white' 
                              : 'hover:bg-slate-800 hover:text-white'
                            }
                            ${isSidebarCollapsed ? 'justify-center' : ''}
                          `}
                          title={isSidebarCollapsed ? item.name : undefined}
                        >
                          <item.icon size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />
                          {!isSidebarCollapsed && <span>{item.name}</span>}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
            <button
              onClick={() => setIsA11yOpen(true)}
              className={`
                flex items-center w-full px-3 py-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `}
              title={isSidebarCollapsed ? "Accessibility" : undefined}
            >
              <Accessibility size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />
              {!isSidebarCollapsed && <span>Accessibility</span>}
            </button>
            <button
              onClick={logout}
              className={`
                flex items-center w-full px-3 py-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `}
              title={isSidebarCollapsed ? "Logout" : undefined}
            >
              <LogOut size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />
              {!isSidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 min-h-[4rem] pt-[env(safe-area-inset-top)] flex items-center justify-between px-4 z-10">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
              <button
                className="hidden md:block p-2 text-slate-600 hover:bg-slate-100 rounded-md"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <ClockInButton />
              <span className="text-sm font-medium text-slate-700">
                {currentUser?.name || currentUser?.email}
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 pb-[env(safe-area-inset-bottom)]">
            <LayoutContext.Provider value={{ isSidebarCollapsed }}>
              <Outlet />
            </LayoutContext.Provider>
          </main>
        </div>
        
        <A11yControlPanel isOpen={isA11yOpen} onClose={() => setIsA11yOpen(false)} />
      </div>
    </div>
  );
}
