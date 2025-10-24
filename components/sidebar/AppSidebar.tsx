"use client"

import * as React from "react"
import {
  CameraIcon,
  FileCodeIcon,
  FileTextIcon,
  Heart,
  Home,
  OrbitIcon,
} from "lucide-react"

import { NavFollowing } from "@/components/sidebar/NavFollowing"
import { NavMain } from "@/components/sidebar/NavMain"
import { NavSecondary } from "@/components/sidebar/NavSecondary"
import { NavUser } from "@/components/sidebar/NavUser"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image"
import Link from "next/link"
import { NavFeatured } from "./NavFeatured"

const data = {
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Discover",
      url: "/streams",
      icon: OrbitIcon,
    },
    {
      title: "Following",
      url: "/following",
      icon: Heart,
    },
  ],

  featured: [
    {
      name: "twitch/otplol_",
      url: "/streams/twitch/otplol_",
      online: true,
      image: {
        url: "/logos/channels/otplol_.png",
        alt: "otplol_ channel's icon",
      },
    },
    {
      name: "kick/otplol_",
      url: "/streams/kick/otplol_",
      online: false,
      image: {
        url: "/logos/channels/otplol_.png",
        alt: "otplol_ channel's icon",
      },
    },
  ],
  following: [
    {
      name: "twitch/otplol_",
      url: "/streams/twitch/otplol_",
      online: true,
      image: {
        url: "/logos/channels/otplol_.png",
        alt: "otplol_ channel's icon",
      },
    },
    {
      name: "kick/otplol_",
      url: "/streams/kick/otplol_",
      online: false,
      image: {
        url: "/logos/channels/otplol_.png",
        alt: "otplol_ channel's icon",
      },
    },
  ],
  navSecondary: [
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: SettingsIcon,
    // },
    // {
    //   title: "Get Help",
    //   url: "#",
    //   icon: HelpCircleIcon,
    // },
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: SearchIcon,
    // },
  ],
}

// Component to handle conditional logo rendering
function SidebarLogo() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Link href="/">
      {isCollapsed
      ? (<Image 
          src='/logos/prediction_live/square-white-transparent.png'
          alt="Prediction Live Logo"
          width={32}
          height={32}
          className="mt-1 hover:bg-gray-400 hover:bg-opacity-20 rounded-full"
        />)
      : (<Image 
          src='/logos/prediction_live/full-white-transparent.png'
          alt="Prediction Live Logo"
          width={200}
          height={80}
          className="object-contain transition-all duration-200"
        />)
      }
    </Link>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="flex py-6 justify-center items-center data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <SidebarLogo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavFollowing items={data.following} />
        <NavFeatured items={data.featured} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
