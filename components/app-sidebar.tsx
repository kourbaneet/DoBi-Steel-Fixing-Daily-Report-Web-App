"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/hooks/usePermissions"
import {
  Home,
  Users,
  FileText,
  Shield,
  Building,
  Cog,
  Calendar,
  Clock,
  History,
  type LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const getStaticData = () => ({
  teams: [
    {
      name: "Dobi Steel",
      logo: Shield,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
      ],
    },
    {
      title: "Daily Dockets",
      url: "/dashboard/dockets",
      icon: FileText,
      items:[
        {
          title: "All Dockets",
          url: "/dashboard/dockets",
        },
      ]
    },
    {
      title: "Weekly Reports",
      url: "/dashboard/weekly",
      icon: Calendar,
      items:[
        {
          title: "View Weekly Summary",
          url: "/dashboard/weekly",
        },
      ]
    },
    {
      title: "Contractors",
      url: "/dashboard/contractors",
      icon: Users,
      items: [
        {
          title: "All Contractors",
          url: "/dashboard/contractors",
        },
      ],
    },
    {
      title: "Builders",
      url: "/dashboard/builders",
      icon: Building,
      items: [
        {
          title: "All Builders",
          url: "/dashboard/builders",
        },
      ],
    },
    {
      title: "Administration",
      url: "/dashboard/admin",
      icon: Cog,
      items: [
        {
          title: "Users",
          url: "/dashboard/admin/users",
        },
        {
          title: "Builders",
          url: "/dashboard/admin/builders",
        },
        {
          title: "Weekly Payments",
          url: "/dashboard/admin/weekly-payments",
        },
      ],
    },
    {
      title: "History & Reports",
      url: "/dashboard/history",
      icon: History,
      items: [
        {
          title: "Dockets History",
          url: "/dashboard/history/dockets",
        },
        {
          title: "Payments History",
          url: "/dashboard/history/payments",
        },
      ],
    },
    {
      title: "My Timesheets",
      url: "/dashboard/me/weeks",
      icon: Clock,
      items: [
        {
          title: "View My Weeks",
          url: "/dashboard/me/weeks",
        },
      ],
    },
  ],
  projects: [] as {
    name: string
    url: string
    icon: LucideIcon
  }[],
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const { hasPermission, isAdmin, isSupervisor, isWorker } = usePermissions()

  const data = getStaticData()

  // Get user data from session or fallback
  const userData = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@dobiSteel.com",
    avatar: session?.user?.image || "/avatars/user.jpg",
  }

  // Filter and transform navigation items based on permissions
  const filteredNavMain = data.navMain
    .filter(item => {
      // Administration section - only show for users with admin access
      if (item.title === "Administration") {
        return hasPermission("admin.access")
      }

      // Daily Dockets section - filter based on permissions (Admin and Supervisor only)
      if (item.title === "Daily Dockets") {
        return hasPermission("dockets.view") || isAdmin || isSupervisor
      }

      // Weekly Reports section - filter based on permissions (Admin and Supervisor only)
      if (item.title === "Weekly Reports") {
        return hasPermission("dockets.view") || isAdmin || isSupervisor
      }

      // Contractors section - filter based on permissions
      if (item.title === "Contractors") {
        return hasPermission("contractors.view")
      }

      // Builders section - filter based on permissions
      if (item.title === "Builders") {
        return hasPermission("builders.view")
      }

      // History & Reports section - only show for admins
      if (item.title === "History & Reports") {
        return hasPermission("admin.access")
      }

      // My Timesheets section - only show for workers
      if (item.title === "My Timesheets") {
        return isWorker
      }

      // Hide admin/supervisor features for workers
      if (isWorker) {
        const workerAllowedSections = ["Dashboard", "My Timesheets"]
        return workerAllowedSections.includes(item.title)
      }

      return true
    })
    .map(item => {
      // Transform Contractors section based on permissions
      if (item.title === "Contractors") {
        if (isSupervisor) {
          // Supervisors get read-only access
          return {
            ...item,
            items: [
              {
                title: "All Contractors",
                url: "/dashboard/contractors",
              }
            ]
          }
        } else if (isAdmin) {
          // Admins get full access - redirect to admin contractors if needed
          return {
            ...item,
            items: [
              {
                title: "All Contractors",
                url: "/dashboard/contractors",
              }
            ]
          }
        }
      }

      // Transform Builders section based on permissions
      if (item.title === "Builders") {
        if (isSupervisor) {
          // Supervisors get read-only access
          return {
            ...item,
            items: [
              {
                title: "All Builders",
                url: "/dashboard/builders",
              }
            ]
          }
        } else if (isAdmin) {
          // Admins get full access - redirect to admin builders
          return {
            ...item,
            items: [
              {
                title: "Manage Builders",
                url: "/dashboard/admin/builders",
              }
            ]
          }
        }
      }

      return item
    })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
