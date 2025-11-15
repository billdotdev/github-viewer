import { gql } from "graphql-request";
import type {
	GetPullRequestFilesQuery,
	GetPullRequestFilesQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";

const GetPullRequestFiles = gql`
	query GetPullRequestFiles($owner: String!, $name: String!, $number: Int!, $after: String) {
		repository(owner: $owner, name: $name) {
			pullRequest(number: $number) {
				id
				files(first: 100, after: $after) {
					totalCount
					pageInfo {
						hasNextPage
						endCursor
					}
					nodes {
						path
						additions
						deletions
						changeType
						viewerViewedState
					}
				}
			}
		}
	}
`;

export function getPullRequestFilesQueryOptions(
	owner: string,
	repo: string,
	prNumber: number,
) {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequestFiles", owner, repo, prNumber],
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			return graphQLClient.request<
				GetPullRequestFilesQuery,
				GetPullRequestFilesQueryVariables
			>(GetPullRequestFiles, {
				owner,
				name: repo,
				number: prNumber,
				after: pageParam,
			});
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage: GetPullRequestFilesQuery) => {
			const pageInfo = lastPage.repository?.pullRequest?.files?.pageInfo;
			return pageInfo?.hasNextPage ? pageInfo.endCursor : undefined;
		},
	};
}
