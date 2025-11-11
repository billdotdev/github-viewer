import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { AppSidebar } from "../components/AppSidebar";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import { Toaster } from "../components/ui/sonner";
import { useSystemTheme } from "../hooks/useSystemTheme";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { cn } from "../lib/utils";

interface MyRouterContext {
	queryClient: QueryClient;
}

function RootComponent() {
	useSystemTheme();

	return (
		<SidebarProvider defaultOpen={false}>
			<AppSidebar />
			<SidebarInset className={cn("flex flex-col")}>
				<Outlet />
			</SidebarInset>
			<Toaster />
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					TanStackQueryDevtools,
				]}
			/>
		</SidebarProvider>
	);
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
});
