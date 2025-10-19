"use client"

import {
  BellIcon,
  CreditCardIcon,
  LogInIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
  UserIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react"
import { Button } from "./ui/button"
import { useProfile } from "@/providers/ProfileProvider"
import Link from "next/link"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { disconnect, loading: disconnectLoading, error: disconnectError } = useWeb3AuthDisconnect();
  const { profile } = useProfile()
  const { connect, isConnected } = useWeb3AuthConnect()

  if (!profile || !isConnected)
    return (
      <SidebarMenuButton
        tooltip="Connect"
        onClick={() => connect()}
        className="group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center flex justify-center items-center bg-brand-pink hover:bg-brand-pink-dark"
      >
        <UserIcon />
        <span className="group-data-[collapsible=icon]:hidden">Connect</span>
        </SidebarMenuButton>
    )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={profile?.pictureUrl} alt={profile.username} />
                <AvatarFallback className="rounded-lg">PL</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{profile.username}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {profile.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={profile.pictureUrl} alt={profile.username} />
                  <AvatarFallback className="rounded-lg">PL</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{profile.username}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {profile.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Button
                  asChild
                  variant='ghost'
                  className="p-0 m-0 h-fit w-fit font-normal"
                >
                  <Link href='/profile'>
                    <UserCircleIcon />
                    Profile
                  </Link>
                </Button>
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Button
                onClick={() => disconnect()}
                variant='ghost'
                className="p-0 m-0 h-fit w-fit font-normal text-red-500"
                disabled={disconnectLoading}
              >
                {disconnectLoading
                  ? (
                    <>
                      Disconnecting
                    </>
                  )
                  : (
                    <>
                      <LogOutIcon />
                      Log out
                    </>
                  )

                }
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
