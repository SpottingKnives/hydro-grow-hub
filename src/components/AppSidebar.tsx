import { Home, Beaker, Leaf, Sprout, FlaskConical, Dna, SlidersHorizontal } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

type Item = { title: string; url: string; icon: any; children?: Item[] };
const mainItems: Item[] = [
  { title: "Home", url: "/", icon: Home },
  { title: "Feed Schedules", url: "/feeds", icon: Beaker, children: [
    { title: "Nutrients & Additives", url: "/nutrients", icon: FlaskConical },
  ]},
  { title: "Environments", url: "/environments", icon: Leaf, children: [
    { title: "Parameters", url: "/parameters", icon: SlidersHorizontal },
  ]},
  { title: "Grow Cycles", url: "/grows", icon: Sprout, children: [
    { title: "Strains", url: "/strains", icon: Dna },
  ]},
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sprout className="w-5 h-5 text-primary-foreground" />
              </div>
              {!collapsed && <span className="text-lg font-bold text-gradient">Hydro Grow OS</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <div key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end={item.url === "/"} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" activeClassName="bg-accent text-accent-foreground font-medium glow-primary">
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {!collapsed && item.children?.map((child) => (
                    <SidebarMenuItem key={child.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={child.url} className="flex items-center gap-3 pl-9 pr-3 py-1.5 rounded-lg text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" activeClassName="bg-accent/50 text-accent-foreground font-medium">
                          <child.icon className="w-4 h-4 shrink-0" />
                          <span>{child.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
