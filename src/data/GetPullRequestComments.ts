import { gql } from "graphql-request";
import type {
	GetPullRequestCommentsQuery,
	GetPullRequestCommentsQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";

const GetPullRequestComments = gql`
	query GetPullRequestComments(
		$owner: String!
		$name: String!
		$number: Int!
	) {
		repository(owner: $owner, name: $name) {
			pullRequest(number: $number) {
				id
				comments(first: 100) {
					nodes {
						id
						bodyHTML
						createdAt
						author {
							login
							avatarUrl
						}
					}
				}
				reviews(first: 100) {
					nodes {
						id
						bodyHTML
						state
						createdAt
						author {
							login
							avatarUrl
						}
					}
				}
			}
		}
	}
`;

export function getPullRequestCommentsQueryOptions(
	owner: string,
	repo: string,
	prNumber: number,
) {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequestComments", owner, repo, prNumber],
		queryFn: async () => {
			return graphQLClient.request<
				GetPullRequestCommentsQuery,
				GetPullRequestCommentsQueryVariables
			>(GetPullRequestComments, {
				owner,
				name: repo,
				number: prNumber,
			});
		},
	};
}
