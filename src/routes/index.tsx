import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { gql } from "graphql-request";
import { useEffect, useState } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { getToken } from "@/lib/tokenStorage";
import { cn } from "@/lib/utils";
import { TokenPrompt } from "../components/TokenPrompt";
import type {
	GetPullRequestsQuery,
	GetPullRequestsQueryVariables,
} from "../generated/graphql";

const getPullRequestsQueryOptions = (owner: string, repo: string) => {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequests", owner, repo],
		queryFn: async () => {
			return graphQLClient.request<
				GetPullRequestsQuery,
				GetPullRequestsQueryVariables
			>(GET_PULL_REQUESTS, {
				owner,
				name: repo,
			});
		},
	};
};

export const Route = createFileRoute("/")({
	component: App,
});

const GET_PULL_REQUESTS = gql`
  query GetPullRequests($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      pullRequests(
        first: 50
        states: OPEN
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          number
          title
          createdAt
          author {
			login
          }
        }
      }
    }
  }
`;

function App() {
	const [hasToken, setHasToken] = useState<boolean | null>(null);

	useEffect(() => {
		getToken().then((token) => {
			setHasToken(!!token);
		});
	}, []);

	const { data } = useQuery({
		...getPullRequestsQueryOptions("simbuka", "applications"),
		enabled: hasToken === true,
	});

	if (hasToken === null) {
		return null;
	}

	if (!hasToken) {
		return (
			<div className={cn("flex min-h-screen items-center justify-center p-4")}>
				<TokenPrompt />
			</div>
		);
	}

	const pullRequests =
		data?.repository?.pullRequests.nodes?.filter((pr) => pr !== null) || [];

	if (pullRequests.length === 0) {
		return (
			<>
				<header
					className={cn("flex h-12 shrink-0 items-center gap-2 border-b px-4")}
				>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbPage className={cn("flex items-center gap-1")}>
									<span>Home</span>
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</header>
				<div className={cn("flex flex-1 items-center justify-center p-4")}>
					<p className={cn("text-muted-foreground")}>No pull requests found</p>
				</div>
			</>
		);
	}

	return (
		<>
			<header
				className={cn("flex h-12 shrink-0 items-center gap-2 border-b px-4")}
			>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbPage className={cn("flex items-center gap-1")}>
								<span>Home</span>
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</header>
			<div className={cn("flex flex-1 flex-col overflow-auto")}>
				<div className={cn("container mx-auto max-w-4xl py-6")}>
					<div className={cn("rounded-md border")}>
						<ul className={cn("divide-y")}>
							{pullRequests.map((pr) => (
								<li key={pr.number}>
									<Link
										to="/$owner/$repo/$number"
										params={{
											owner: "simbuka",
											repo: "applications",
											number: pr.number.toString(),
										}}
										className={cn(
											"block transition-colors hover:bg-accent/50 focus:bg-accent/50",
										)}
									>
										<div className={cn("px-4 py-3")}>
											<div className={cn("flex items-start gap-1")}>
												<div className={cn("min-w-0 flex-1")}>
													<div
														className={cn("truncate font-medium leading-tight")}
													>
														{pr.title}
													</div>
													<div
														className={cn(
															"mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground",
														)}
													>
														<span
															className={cn("flex min-w-0 items-center gap-1")}
														>
															{pr.author?.login}
														</span>
														<span>•</span>
														<span className={cn("flex items-center gap-1")}>
															{new Date(pr.createdAt).toLocaleString()}
														</span>
														<span>•</span>
														<span>#{pr.number}</span>
													</div>
												</div>
											</div>
										</div>
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</>
	);
}
