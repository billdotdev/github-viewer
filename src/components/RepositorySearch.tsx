import { useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { Search, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGraphQLClient } from "@/lib/graphqlClient";
import {
	isPinned,
	type PinnedRepository,
	pinRepository,
	unpinRepository,
} from "@/lib/repositoryStorage";
import { cn } from "@/lib/utils";

interface SearchResult {
	id: string;
	name: string;
	owner: {
		login: string;
	};
	description: string | null;
	stargazerCount: number;
	forkCount: number;
	primaryLanguage: {
		name: string;
		color: string;
	} | null;
	visibility: string;
	repositoryTopics: {
		nodes: Array<{
			topic: {
				name: string;
			};
		}>;
	};
	updatedAt: string;
	url: string;
}

interface SearchRepositoriesData {
	search: {
		nodes: SearchResult[];
	};
}

const SEARCH_REPOSITORIES = gql`
	query SearchRepositories($query: String!) {
		search(query: $query, type: REPOSITORY, first: 10) {
			nodes {
				... on Repository {
					id
					name
					owner {
						login
					}
					description
					stargazerCount
					forkCount
					primaryLanguage {
						name
						color
					}
					visibility
					repositoryTopics(first: 5) {
						nodes {
							topic {
								name
							}
						}
					}
					updatedAt
					url
				}
			}
		}
	}
`;

interface RepositorySearchProps {
	onRepositoryPinned?: () => void;
}

export function RepositorySearch({
	onRepositoryPinned,
}: RepositorySearchProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [showResults, setShowResults] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchQuery);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	const graphQLClient = getGraphQLClient();
	const { data, isLoading } = useQuery({
		queryKey: ["searchRepositories", debouncedQuery],
		queryFn: async () => {
			return graphQLClient.request<SearchRepositoriesData>(
				SEARCH_REPOSITORIES,
				{
					query: debouncedQuery,
				},
			);
		},
		enabled: debouncedQuery.length >= 2,
	});

	const repositories = data?.search?.nodes || [];

	const handlePin = (repo: SearchResult) => {
		const owner = repo.owner.login;
		const name = repo.name;

		if (isPinned(owner, name)) {
			unpinRepository(owner, name);
		} else {
			const pinnedRepo: PinnedRepository = {
				owner,
				name,
				description: repo.description,
				language: repo.primaryLanguage?.name || null,
				languageColor: repo.primaryLanguage?.color || null,
				stargazerCount: repo.stargazerCount,
				forkCount: repo.forkCount,
				visibility: repo.visibility,
				topics: repo.repositoryTopics.nodes.map((n) => n.topic.name),
				updatedAt: repo.updatedAt,
				url: repo.url,
			};
			pinRepository(pinnedRepo);
		}
		onRepositoryPinned?.();
	};

	return (
		<div className={cn("relative w-full")}>
			<div className={cn("relative")}>
				<Search
					className={cn(
						"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
					)}
				/>
				<Input
					type="text"
					placeholder="Search repositories..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					onFocus={() => setShowResults(true)}
					onBlur={() => setTimeout(() => setShowResults(false), 200)}
					className={cn("pl-10")}
				/>
			</div>

			{showResults && debouncedQuery.length >= 2 && (
				<div
					className={cn(
						"absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-md",
					)}
				>
					{isLoading ? (
						<div
							className={cn("p-4 text-center text-sm text-muted-foreground")}
						>
							Searching...
						</div>
					) : repositories.length === 0 ? (
						<div
							className={cn("p-4 text-center text-sm text-muted-foreground")}
						>
							No repositories found
						</div>
					) : (
						<ul className={cn("max-h-96 overflow-y-auto")}>
							{repositories.map((repo) => {
								const owner = repo.owner.login;
								const name = repo.name;
								const pinned = isPinned(owner, name);

								return (
									<li
										key={repo.id}
										className={cn(
											"flex items-start gap-3 border-b p-3 last:border-b-0 hover:bg-accent",
										)}
									>
										<div className={cn("min-w-0 flex-1")}>
											<div className={cn("flex items-center gap-2")}>
												<span className={cn("font-semibold text-sm")}>
													{owner}/{name}
												</span>
												{repo.visibility === "PRIVATE" && (
													<span
														className={cn(
															"rounded-md border px-1.5 py-0.5 text-xs",
														)}
													>
														Private
													</span>
												)}
											</div>
											{repo.description && (
												<p
													className={cn(
														"mt-1 text-xs text-muted-foreground line-clamp-2",
													)}
												>
													{repo.description}
												</p>
											)}
											<div
												className={cn(
													"mt-2 flex items-center gap-3 text-xs text-muted-foreground",
												)}
											>
												{repo.primaryLanguage && (
													<div className={cn("flex items-center gap-1")}>
														<span
															className={cn("h-3 w-3 rounded-full")}
															style={{
																backgroundColor:
																	repo.primaryLanguage.color || "#ccc",
															}}
														/>
														<span>{repo.primaryLanguage.name}</span>
													</div>
												)}
												<div className={cn("flex items-center gap-1")}>
													<Star className={cn("h-3 w-3")} />
													<span>{repo.stargazerCount.toLocaleString()}</span>
												</div>
											</div>
										</div>
										<Button
											variant={pinned ? "default" : "outline"}
											size="sm"
											onClick={() => handlePin(repo)}
											className={cn("shrink-0")}
										>
											<Star
												className={cn("h-4 w-4", pinned && "fill-current")}
											/>
										</Button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
