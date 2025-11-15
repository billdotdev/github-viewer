import { gql } from "graphql-request";
import {
	type GetPullRequestsQuery,
	type GetPullRequestsQueryVariables,
	PullRequestState,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";

const GetPullRequests = gql`
	query GetPullRequests(
		$owner: String!
		$name: String!
		$states: [PullRequestState!]
		$first: Int!
		$after: String
		$before: String
		$last: Int
	) {
		repository(owner: $owner, name: $name) {
			pullRequests(
				states: $states
				first: $first
				after: $after
				before: $before
				last: $last
				orderBy: { field: CREATED_AT, direction: DESC }
			) {
				totalCount
				pageInfo {
					hasNextPage
					hasPreviousPage
					endCursor
					startCursor
				}
				nodes {
					number
					title
					state
					isDraft
					createdAt
					author {
						login
					}
					comments {
						totalCount
					}
					labels(first: 10) {
						nodes {
							id
							name
							color
						}
					}
				}
			}
		}
	}
`;

export type PRStateFilter = "open" | "draft" | "closed" | "merged";

export interface PRSearchParams {
	state?: PRStateFilter;
	author?: string;
	search?: string;
	label?: string;
}

export function getInfinitePullRequestsQueryOptions(
	owner: string,
	repo: string,
	filters: PRSearchParams,
) {
	const graphQLClient = getGraphQLClient();

	let states: PullRequestState[] = [PullRequestState.Open];
	if (filters.state === "closed") {
		states = [PullRequestState.Closed];
	} else if (filters.state === "merged") {
		states = [PullRequestState.Merged];
	} else if (filters.state === "open" || filters.state === "draft") {
		states = [PullRequestState.Open];
	}

	return {
		queryKey: [
			"repositoryPullRequestsInfinite",
			owner,
			repo,
			filters.state,
			filters.author,
			filters.search,
			filters.label,
		],
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			return graphQLClient.request<
				GetPullRequestsQuery,
				GetPullRequestsQueryVariables
			>(GetPullRequests, {
				owner,
				name: repo,
				states,
				first: 30,
				after: pageParam,
				before: undefined,
				last: undefined,
			});
		},
		getNextPageParam: (lastPage: GetPullRequestsQuery) => {
			const pageInfo = lastPage?.repository?.pullRequests?.pageInfo;
			if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
				return pageInfo.endCursor;
			}
			return undefined;
		},
		initialPageParam: undefined,
	};
}
