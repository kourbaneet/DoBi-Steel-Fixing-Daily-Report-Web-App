"use client"

import * as React from "react"
import { usePermissions } from "@/hooks/usePermissions"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Home,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Shield,
  Wrench,
  FolderOpen,
  Plus,
  Search,
  CheckSquare,
  User,
  Building,
  UserPlus,
  Cog,
  LogOut,
  Calendar,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "User",
    email: "user@dobiSteel.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "Dobi Steel",
      logo: Shield,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Dockets",
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
      title: "Weekly Timesheets",
      url: "/dashboard/weekly",
      icon: Calendar,
      items:[
        {
          title: "View Timesheets",
          url: "/dashboard/weekly",
        },
      ]
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderOpen,
      items: [
        {
          title: "Projects",
          url: "/projects",
        },
        {
          title: "Add Project",
          url: "/projects/new",
        },
      ],
    },
    {
      title: "Workers",
      url: "/workers",
      icon: Users,
      items: [
        {
          title: "Worker Roster",
          url: "/workers",
        },
        {
          title: "Add Worker",
          url: "/workers/new",
        },
      ],
    },
    {
      title: "Clients",
      url: "/clients",
      icon: Building,
      items: [
        {
          title: "Clients",
          url: "/clients",
        },
        {
          title: "Add Client",
          url: "/clients/new",
        },
      ],
    },
    {
      title: "Approvals",
      url: "/approvals",
      icon: CheckSquare,
      items: [
        {
          title: "To Approve",
          url: "/approvals",
        },
        {
          title: "My Approval History",
          url: "/approvals/history",
        },
      ],
    },
    {
      title: "Reports",
      url: "/reports",
      icon: BarChart3,
      items: [
        {
          title: "Docket Summary",
          url: "/reports/dockets",
        },
        {
          title: "Worker Hours",
          url: "/reports/workers",
        },
        {
          title: "Project Activity",
          url: "/reports/projects",
        },
      ],
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
      title: "Admin",
      url: "/dashboard/admin",
      icon: Cog,
      items: [
        {
          title: "Users",
          url: "/dashboard/admin/users",
        },
        {
          title: "Invite User",
          url: "/dashboard/admin/users/invite",
        },
        {
          title: "Builders",
          url: "/dashboard/admin/builders",
        },
        {
          title: "Company Profile / Settings",
          url: "/dashboard/admin/settings",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Feature 1",
      url: "/feature1",
      icon: User,
    },
    {
      name: "Feature 2",
      url: "/feature2",
      icon: Plus,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { hasPermission, isAdmin, isSupervisor } = usePermissions()

  // Filter and transform navigation items based on permissions
  const filteredNavMain = data.navMain
    .filter(item => {
      // Admin section - only show for users with admin access
      if (item.title === "Admin") {
        return hasPermission("admin.access")
      }

      // Dockets section - filter based on permissions (Admin and Supervisor only)
      if (item.title === "Dockets") {
        return hasPermission("dockets.view") || isAdmin || isSupervisor
      }

      // Weekly Timesheets section - filter based on permissions (Admin and Supervisor only)
      if (item.title === "Weekly Timesheets") {
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
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
