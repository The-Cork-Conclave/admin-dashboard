import { Users, CalendarIcon, LayoutDashboard, type LucideIcon, Users2Icon } from "lucide-react";

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
        title: "Members",
        url: "/dashboard/members",
        icon: Users,
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
    ],
  },
];
