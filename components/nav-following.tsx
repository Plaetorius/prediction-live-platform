"use client"

import {
  FolderIcon,
  InfoIcon,
  MoreHorizontalIcon,
  ShareIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image"

export function NavFollowing({
  items,
}: {
  items: {
    name: string
    url: string
    online: boolean,
    image: {
      url: string
      alt: string
    }
  }[]
}) {
  const { isMobile, state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarGroup className="border-t border-brand-pink-dark">
      <SidebarGroupLabel>Following</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton 
              tooltip={item.name}
              onClick={() => window.location.href = item.url}
              className="group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center"
            >
              <Image
                src={item.image.url}
                width={24}
                height={24}
                className={`rounded-full ${item.online ? '' : 'grayscale'} group-data-[collapsible=icon]:!size-6 group-data-[collapsible=icon]:!flex-shrink-0 group-data-[collapsible=icon]:!object-cover`}
                style={{boxShadow: item.online ? 'inset 0 0 0 2px white' : ''}}
                alt={item.image.alt}
              />
              <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
            </SidebarMenuButton>
            {!isCollapsed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction
                    showOnHover
                    className="rounded-sm data-[state=open]:bg-accent"
                  >
                    <MoreHorizontalIcon />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-24 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <FolderIcon />
                    <span>Watch</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <InfoIcon />
                    <span>Info</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ShareIcon />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FolderIcon />
                    <span color="font-red-500">Unfollow</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
