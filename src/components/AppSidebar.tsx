import { Link } from "@tanstack/react-router";
import { Home, Settings } from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar() {
	return (
		<Sidebar collapsible="icon" className={cn("border-r-0")}>
			<SidebarContent className={cn("gap-0")}>
				<SidebarGroup className={cn("py-0")}>
					<SidebarGroupContent>
						<SidebarMenu
							className={cn(
								"gap-0.5 px-2 py-2 group-data-[collapsible=icon]:px-0",
							)}
						>
							<SidebarMenuItem>
								<Link to="/">
									{({ isActive }) => (
										<SidebarMenuButton
											tooltip="Home"
											isActive={isActive}
											asChild
										>
											<span>
												<Home className={cn("h-4 w-4")} />
												<span>Home</span>
											</span>
										</SidebarMenuButton>
									)}
								</Link>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className={cn("mt-auto border-t py-0")}>
				<SidebarMenu
					className={cn("gap-0.5 px-2 py-2 group-data-[collapsible=icon]:px-0")}
				>
					<SidebarMenuItem>
						<Link to="/settings">
							{({ isActive }) => (
								<SidebarMenuButton
									tooltip="Settings"
									isActive={isActive}
									asChild
								>
									<span>
										<Settings className={cn("h-4 w-4")} />
										<span>Settings</span>
									</span>
								</SidebarMenuButton>
							)}
						</Link>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
