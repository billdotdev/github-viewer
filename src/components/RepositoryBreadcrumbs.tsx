import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export interface BreadcrumbItemData {
	label: string;
	to?: string;
	params?: Record<string, string>;
	icon?: LucideIcon;
	className?: string;
}

interface RepositoryBreadcrumbsProps {
	items: BreadcrumbItemData[];
}

export function RepositoryBreadcrumbs({ items }: RepositoryBreadcrumbsProps) {
	return (
		<header
			className={cn(
				"sticky top-0 z-20 flex h-6 shrink-0 items-center gap-2 border-b bg-background px-4",
			)}
		>
			<Breadcrumb>
				<BreadcrumbList>
					{items.map((item, index) => {
						const isLast = index === items.length - 1;
						const Icon = item.icon;

						const content: ReactNode = Icon ? (
							<span className={cn("flex items-center gap-1")}>
								<Icon className={cn("h-3.5 w-3.5")} />
								<span>{item.label}</span>
							</span>
						) : (
							<span>{item.label}</span>
						);

						return (
							<Fragment key={item.label}>
								<BreadcrumbItem key={item.to || item.label}>
									{isLast || !item.to ? (
										<BreadcrumbPage className={item.className}>
											{content}
										</BreadcrumbPage>
									) : (
										<BreadcrumbLink asChild>
											<Link
												to={item.to}
												params={item.params}
												className={item.className}
											>
												{content}
											</Link>
										</BreadcrumbLink>
									)}
								</BreadcrumbItem>
								{!isLast && <BreadcrumbSeparator />}
							</Fragment>
						);
					})}
				</BreadcrumbList>
			</Breadcrumb>
		</header>
	);
}
