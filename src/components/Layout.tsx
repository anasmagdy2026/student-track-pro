import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  X,
  GraduationCap,
  UsersRound,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
  Settings,
  UserX,
  Printer,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/attendance', label: 'الحضور والغياب', icon: Calendar },
  { path: '/attendance/daily-absence', label: 'غياب اليوم', icon: UserX },
  { path: '/groups', label: 'المجموعات', icon: UsersRound },
  { path: '/students', label: 'الطلاب', icon: Users },
  { path: '/lessons', label: 'الحصص', icon: BookOpen },
  { path: '/exams', label: 'الامتحانات', icon: FileText },
  { path: '/alerts', label: 'التنبيهات', icon: Bell },
  { path: '/payments', label: 'المدفوعات', icon: CreditCard },
  { path: '/print-cards', label: 'طباعة الكروت', icon: Printer },
  { path: '/academic-years', label: 'السنوات الدراسية', icon: GraduationCap },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar_collapsed', false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-16 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">مستر محمد مجدي</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full bg-sidebar text-sidebar-foreground transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} bg-sidebar-primary rounded-xl flex items-center justify-center flex-shrink-0`}>
                <GraduationCap className={`${isCollapsed ? 'h-5 w-5' : 'h-7 w-7'} text-sidebar-primary-foreground`} />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="font-bold text-lg">مستر محمد مجدي</h1>
                  <p className="text-sm text-sidebar-foreground/70">نظام متابعة الطلاب</p>
                </div>
              )}
            </div>
          </div>

          {/* Collapse Button - Desktop Only */}
          <div className="hidden lg:flex p-2 border-b border-sidebar-border justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full justify-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {isCollapsed ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <>
                  <PanelLeftClose className="h-5 w-5" />
                  <span>تقليص القائمة</span>
                </>
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'hover:bg-sidebar-accent text-sidebar-foreground'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-sidebar-border space-y-2">
            <Link
              to="/settings"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === '/settings'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'hover:bg-sidebar-accent text-sidebar-foreground'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? 'الإعدادات' : undefined}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">الإعدادات</span>}
            </Link>
            
            <Button
              variant="ghost"
              className={`w-full gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                isCollapsed ? 'justify-center px-0' : 'justify-start'
              }`}
              onClick={handleLogout}
              title={isCollapsed ? 'تسجيل الخروج' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>تسجيل الخروج</span>}
            </Button>
            {!isCollapsed && (
              <p className="text-xs text-center text-sidebar-foreground/50">
                تصميم وبرمجة: أنس أبو المجد
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen pt-16 lg:pt-0 transition-all duration-300 ${
        isCollapsed ? 'lg:mr-20' : 'lg:mr-72'
      }`}>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
