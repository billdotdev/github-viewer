import { Link } from "@tanstack/react-router";
import { GitFork, Lock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	isPinned,
	type PinnedRepository,
	pinRepository,
	unpinRepository,
} from "@/lib/repositoryStorage";
import { cn } from "@/lib/utils";

interface RepositoryCardProps {
	repository: PinnedRepository;
	onUnpin?: () => void;
}

export function RepositoryCard({ repository, onUnpin }: RepositoryCardProps) {
	const {
		owner,
		name,
		description,
		language,
		languageColor,
		stargazerCount,
		forkCount,
		visibility,
		topics,
		updatedAt,
	} = repository;

	const handleTogglePin = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (isPinned(owner, name)) {
			unpinRepository(owner, name);
			onUnpin?.();
		} else {
			pinRepository(repository);
		}
	};

	const pinned = isPinned(owner, name);
	const lastUpdated = new Date(updatedAt);
	const now = new Date();
	const diffMs = now.getTime() - lastUpdated.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	const getRelativeTime = () => {
		if (diffDays === 0) {
			const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
			if (diffHours === 0) {
				const diffMinutes = Math.floor(diffMs / (1000 * 60));
				return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
			}
			return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
		}
		if (diffDays < 30) {
			return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
		}
		const diffMonths = Math.floor(diffDays / 30);
		if (diffMonths < 12) {
			return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
		}
		const diffYears = Math.floor(diffMonths / 12);
		return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
	};

	return (
		<Card className={cn("transition-colors hover:bg-accent/50")}>
			<Link
				to="/$owner/$repo/pulls"
				params={{ owner, repo: name }}
				className={cn("block")}
			>
				<CardHeader className={cn("pb-3")}>
					<div className={cn("flex items-start justify-between gap-3")}>
						<div className={cn("min-w-0 flex-1")}>
							<div className={cn("flex items-center gap-2 flex-wrap")}>
								<h3 className={cn("font-semibold text-lg text-primary")}>
									{owner}/{name}
								</h3>
								{visibility === "PRIVATE" && (
									<Badge variant="secondary" className={cn("gap-1")}>
										<Lock className={cn("h-3 w-3")} />
										<span>Private</span>
									</Badge>
								)}
							</div>
							{description && (
								<p
									className={cn(
										"mt-1 text-sm text-muted-foreground line-clamp-2",
									)}
								>
									{description}
								</p>
							)}
						</div>
						<Button
							variant={pinned ? "default" : "ghost"}
							size="icon"
							onClick={handleTogglePin}
							className={cn("shrink-0")}
						>
							<Star className={cn("h-4 w-4", pinned && "fill-current")} />
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className={cn("flex flex-wrap items-center gap-4 text-sm")}>
						{language && (
							<div className={cn("flex items-center gap-1.5")}>
								<span
									className={cn("h-3 w-3 rounded-full")}
									style={{ backgroundColor: languageColor || "#ccc" }}
								/>
								<span className={cn("text-muted-foreground")}>{language}</span>
							</div>
						)}
						<div
							className={cn("flex items-center gap-1.5 text-muted-foreground")}
						>
							<Star className={cn("h-4 w-4")} />
							<span>{stargazerCount.toLocaleString()}</span>
						</div>
						<div
							className={cn("flex items-center gap-1.5 text-muted-foreground")}
						>
							<GitFork className={cn("h-4 w-4")} />
							<span>{forkCount.toLocaleString()}</span>
						</div>
						<span className={cn("text-muted-foreground text-xs")}>
							Updated {getRelativeTime()}
						</span>
					</div>
					{topics.length > 0 && (
						<div className={cn("mt-3 flex flex-wrap gap-1.5")}>
							{topics.slice(0, 5).map((topic) => (
								<Badge
									key={topic}
									variant="secondary"
									className={cn("text-xs font-normal")}
								>
									{topic}
								</Badge>
							))}
						</div>
					)}
				</CardContent>
			</Link>
		</Card>
	);
}
