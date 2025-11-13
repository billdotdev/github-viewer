import { isMatch, Link, useMatches } from "@tanstack/react-router";
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
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function Breadcrumbs() {
	const matches = useMatches();
	if (matches.some((match) => match.status === "pending")) return null;

	const items = matches
		.filter((match) => isMatch(match, "loaderData.crumbs"))
		.flatMap((match) => match.loaderData?.crumbs || []);

	if (items.length === 0) return null;

	return (
		<header className="sticky top-0 z-20 flex h-10 shrink-0 items-center gap-2 border-b bg-background px-4">
			<Breadcrumb>
				<BreadcrumbList>
					{items.map((item, index) => {
						if (!item) return null;
						const isLast = index === items.length - 1;
						const Icon = item && "icon" in item ? item.icon : undefined;

						const content: ReactNode = Icon ? (
							<span className="flex items-center gap-1 justify-center">
								<Icon className="h-4 w-4 shrink-0" />
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
									{item.buttons && (
										<div className="flex items-center gap-2 pl-1">
											{item.buttons.map((button) => {
												return (
													<Button
														key={button.label}
														variant="outline"
														className="h-6 group"
														size="sm"
														asChild
													>
														<Link
															to={button.to}
															preload="viewport"
															activeOptions={{ exact: true }}
															activeProps={{
																className:
																	"bg-secondary text-secondary-foreground",
															}}
														>
															{({ isActive }) => (
																<>
																	<button.icon
																		className={cn(
																			"h-3 w-3 shrink-0",
																			button.iconClassName,
																		)}
																	/>
																	<span>{button.label}</span>

																	{button.badge && (
																		<Badge
																			variant="secondary"
																			className={cn(
																				"text-xs px-1 py-0 group-hover:bg-primary/10",
																				isActive && "bg-primary/10",
																			)}
																		>
																			{button.badge}
																		</Badge>
																	)}
																</>
															)}
														</Link>
													</Button>
												);
											})}
										</div>
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

interface BreadcrumbItemData {
	label: string;
	to?: string;
	params?: Record<string, string>;
	icon?: LucideIcon;
	className?: string;
	buttons?: {
		label: string;
		to: string;
		icon: LucideIcon;
		badge?: number;
		iconClassName?: string;
	}[];
}

export function createCrumb(crumb: BreadcrumbItemData) {
	return crumb;
}
