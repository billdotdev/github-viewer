import { gql } from "graphql-request";
import type {
	GetPullRequestBodyQuery,
	GetPullRequestBodyQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";

const GetPullRequestBody = gql`
	query GetPullRequestBody($owner: String!, $name: String!, $number: Int!) {
		repository(owner: $owner, name: $name) {
			pullRequest(number: $number) {
				id
				bodyHTML
				createdAt
				author {
					login
					avatarUrl
				}
			}
		}
	}
`;

export function getPullRequestBodyQueryOptions(
	owner: string,
	repo: string,
	prNumber: number,
) {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequestBody", owner, repo, prNumber],
		queryFn: async () => {
			return graphQLClient.request<
				GetPullRequestBodyQuery,
				GetPullRequestBodyQueryVariables
			>(GetPullRequestBody, {
				owner,
				name: repo,
				number: prNumber,
			});
		},
	};
}
