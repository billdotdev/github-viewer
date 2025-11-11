import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Settings } from "lucide-react";
import { TokenPrompt } from "@/components/TokenPrompt";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<>
			<header
				className={cn("flex h-12 shrink-0 items-center gap-2 border-b px-4")}
			>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/" className={cn("flex items-center gap-1")}>
									<Home className={cn("h-3.5 w-3.5")} />
									<span>Home</span>
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className={cn("flex items-center gap-1")}>
								<Settings className={cn("h-3.5 w-3.5")} />
								<span>Settings</span>
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</header>
			<div className={cn("flex flex-1 flex-col overflow-auto")}>
				<div className={cn("container mx-auto max-w-4xl py-6")}>
					<TokenPrompt />
				</div>
			</div>
		</>
	);
}
