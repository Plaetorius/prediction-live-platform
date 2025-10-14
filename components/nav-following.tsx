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
import Link from "next/link"
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
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="border-t border-brand-pink-dark">
      <SidebarGroupLabel>Following</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.online ? '' : 'grayscale'}`} style={{boxShadow: item.online ? 'inset 0 0 0 2px white' : ''}}>
                  <Image
                    src={item.image.url}
                    width={24}
                    height={24}
                    className="rounded-full"
                    alt={item.image.alt}
                  />
                </div>
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
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
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
