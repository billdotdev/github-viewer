import { gql } from "graphql-request";
import type {
	GetPullRequestQuery,
	GetPullRequestQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";

const GetPullRequest = gql`
	query GetPullRequest($owner: String!, $name: String!, $number: Int!) {
		repository(owner: $owner, name: $name) {
			pullRequest(number: $number) {
				number
				title
				state
				isDraft
				headRefName
				baseRefName
				author {
					login
					avatarUrl
				}
				additions
				deletions
				changedFiles
				comments {
					totalCount
				}
				commits {
					totalCount
				}
			}
		}
	}
`;

export function getPullRequestQueryOptions(
	owner: string,
	repo: string,
	prNumber: number,
) {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequest", owner, repo, prNumber],
		queryFn: async () => {
			return graphQLClient.request<
				GetPullRequestQuery,
				GetPullRequestQueryVariables
			>(GetPullRequest, {
				owner,
				name: repo,
				number: prNumber,
			});
		},
	};
}
