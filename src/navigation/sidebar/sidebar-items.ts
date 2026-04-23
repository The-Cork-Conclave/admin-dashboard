import {
  CalendarIcon,
  LayoutDashboard,
  type LucideIcon,
  Users2Icon,
  // , Logs, CirclePile
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Events",
        url: "/dashboard/events",
        icon: CalendarIcon,
      },
      {
        title: "Admins",
        url: "/dashboard/admins",
        icon: Users2Icon,
      },
      // {
      //   title: "Jobs",
      //   url: "/dashboard/jobs",
      //   icon: CirclePile,
      // },
      // {
      //   title: "Logs",
      //   url: "/dashboard/logs",
      //   icon: Logs,
      // },
    ],
  },
];
