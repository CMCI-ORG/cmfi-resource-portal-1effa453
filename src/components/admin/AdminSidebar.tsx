import { Link } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Settings,
  Home,
  Youtube,
  Radio,
  FileText,
  BarChart3,
} from "lucide-react"

const menuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    url: "/admin",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/admin/settings",
  },
  {
    title: "YouTube",
    icon: Youtube,
    url: "/admin/youtube",
  },
  {
    title: "Podcasts",
    icon: Radio,
    url: "/admin/podcasts",
  },
  {
    title: "Blog",
    icon: FileText,
    url: "/admin/blog",
  },
]

export function AdminSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className="flex items-center">
                    <Home className="mr-2" />
                    <span>Back to Site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url} className="flex items-center">
                      <item.icon className="mr-2" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}