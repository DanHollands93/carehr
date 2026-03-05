
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home, Calendar, User, FileText, Bell, LogOut, Settings, Users,
  Clock, CheckCircle, BarChart3, Menu as MenuIcon, UserPlus, Mail, Building2, ChevronDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useActiveCompany } from "@/contexts/ActiveCompanyContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { unifiedMenuConfig } from "@/config/menuConfig";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import ImpersonateUserDialog from "@/components/ImpersonateUserDialog";
import ImpersonationBanner from "@/components/ImpersonationBanner";

const iconMap: Record<string, any> = {
  Home, Calendar, User, FileText, Bell, Settings, Users,
  Clock, CheckCircle, BarChart3, Menu: MenuIcon, UserPlus, Mail, Building2
};

const TopNavigation = () => {
  const { signOut, user, userRole } = useAuth();
  const { hasPermission, loading: permissionsLoading, permissions } = usePermissions();
  const { hasModule } = useCompanyModules();
  const { activeCompanyId, activeCompanyName, setActiveCompany, companies, isSuperAdmin } = useActiveCompany();
  const { unseenCount } = useNotifications();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('first_name, last_name, employee_id')
        .eq('id', user.id)
        .single()
        .then(async ({ data }) => {
          if (data?.first_name) { setProfileName(data.first_name); return; }
          if (data?.employee_id) {
            const { data: emp } = await supabase
              .from('employees')
              .select('first_name, last_name')
              .eq('id', data.employee_id)
              .single();
            if (emp?.first_name) setProfileName(emp.first_name);
          }
        });
    }
  }, [user?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  const isMenuItemVisible = (item: any) => {
    if (!item.requiredPermission) return true;
    if (item.requiredPermission === '__super_admin__') return userRole === 'super_admin';
    return hasPermission(item.requiredPermission, item.location);
  };

  const getVisibleGroups = () => {
    return unifiedMenuConfig
      .filter(group => {
        if (group.moduleKey && !hasModule(group.moduleKey)) return false;
        return true;
      })
      .map(group => ({
        ...group,
        items: group.items.filter(isMenuItemVisible)
      }))
      .filter(group => group.items.length > 0);
  };

  const visibleGroups = getVisibleGroups();

  const isGroupActive = (group: typeof visibleGroups[0]) => {
    return group.items.some(item => location.pathname === item.path);
  };

  const getDisplayGreeting = () => {
    const firstName = profileName || user?.user_metadata?.first_name || null;
    if (firstName) return firstName;
    return user?.email?.split('@')[0] || 'User';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Mobile navigation
  if (isMobile) {
    return (
      <>
        <ImpersonationBanner />
        <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 bg-card">
                  <div className="flex flex-col h-full">
                    <div className="p-5 border-b border-border">
                      <h2 className="text-lg font-bold">
                        <span className="text-primary">Care</span>
                        <span className="text-secondary">HR</span>
                      </h2>
                    </div>

                    {isSuperAdmin && companies && companies.length > 0 && (
                      <div className="px-5 py-3 border-b border-border">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> Viewing Company
                        </label>
                        <Select
                          value={activeCompanyId || ""}
                          onValueChange={(val) => {
                            const comp = companies.find(c => c.id === val);
                            setActiveCompany(val, comp?.name || null);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select company..." />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((c) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto py-2">
                      {visibleGroups.map(group => (
                        <div key={group.label} className="mb-1">
                          <div className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {group.label}
                          </div>
                          {group.items.map(item => {
                            const Icon = iconMap[item.icon] || FileText;
                            return (
                              <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                  cn(
                                    "flex items-center gap-3 px-5 py-2.5 text-sm transition-all",
                                    isActive
                                      ? "text-primary bg-primary/5 border-r-2 border-primary font-medium"
                                      : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                                  )
                                }
                              >
                                <Icon className="w-4 h-4" />
                                <span>{item.title}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-border">
                      <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-lg font-bold">
                <span className="text-primary">Care</span>
                <span className="text-secondary">HR</span>
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <ImpersonateUserDialog />
              <div className="relative">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/hr/notifications')}>
                  <Bell className={cn("h-4 w-4", unseenCount > 0 ? "text-destructive" : "text-muted-foreground")} />
                </Button>
                {unseenCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                    {unseenCount > 9 ? '9+' : unseenCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
      </>
    );
  }

  // Desktop navigation
  return (
    <>
      <ImpersonationBanner />
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl" ref={dropdownRef}>
        {/* Top row: Brand + User actions */}
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-primary">Care</span>
              <span className="text-secondary">HR</span>
            </h1>

            {isSuperAdmin && companies && companies.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <Select
                  value={activeCompanyId || ""}
                  onValueChange={(val) => {
                    const comp = companies.find(c => c.id === val);
                    setActiveCompany(val, comp?.name || null);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs w-[180px] border-border/50 bg-muted/30">
                    <SelectValue placeholder="Select company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ImpersonateUserDialog />
            
            <div className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate('/hr/notifications')}>
                <Bell className={cn("h-4 w-4", unseenCount > 0 ? "text-destructive" : "text-muted-foreground")} />
              </Button>
              {unseenCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                  {unseenCount > 9 ? '9+' : unseenCount}
                </span>
              )}
            </div>

            <div className="h-6 w-px bg-border/60 mx-1" />

            <Button
              variant="ghost"
              className="h-9 gap-2 rounded-full px-3 text-sm font-medium text-foreground/80 hover:text-foreground"
              onClick={() => navigate('/hr/profile')}
            >
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="hidden lg:inline">{getDisplayGreeting()}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation row: Tab groups with dropdowns */}
        {!permissionsLoading && (
          <nav className="flex items-center px-6 gap-1 overflow-visible">
            {visibleGroups.map(group => {
              const isSingleItem = group.items.length === 1;
              const active = isGroupActive(group);
              const isOpen = activeDropdown === group.label;

              if (isSingleItem) {
                const item = group.items[0];
                const Icon = iconMap[item.icon] || FileText;
                return (
                  <NavLink
                    key={group.label}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium transition-all border-b-2 whitespace-nowrap",
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      )
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </NavLink>
                );
              }

              return (
                <div
                  key={group.label}
                  className="relative"
                  onMouseEnter={() => {
                    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                    setActiveDropdown(group.label);
                  }}
                  onMouseLeave={() => {
                    closeTimerRef.current = setTimeout(() => setActiveDropdown(null), 150);
                  }}
                >
                  <button
                    onClick={() => setActiveDropdown(isOpen ? null : group.label)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-all border-b-2 whitespace-nowrap",
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    <span>{group.label}</span>
                    <ChevronDown className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )} />
                  </button>

                  {/* Dropdown panel */}
                  {isOpen && (
                    <div className="absolute top-full left-0 mt-px min-w-[220px] rounded-lg border border-border/60 bg-card shadow-lg shadow-black/5 py-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-150 z-50">
                      {group.items.map(item => {
                        const Icon = iconMap[item.icon] || FileText;
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setActiveDropdown(null)}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                                isActive
                                  ? "text-primary bg-primary/5 font-medium"
                                  : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                              )
                            }
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.title}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </header>
    </>
  );
};

export default TopNavigation;
