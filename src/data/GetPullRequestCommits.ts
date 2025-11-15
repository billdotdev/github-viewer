import { gql } from "graphql-request";
import type {
	GetPullRequestCommitsQuery,
	GetPullRequestCommitsQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";

const GetPullRequestCommits = gql`
	query GetPullRequestCommits($owner: String!, $name: String!, $number: Int!) {
		repository(owner: $owner, name: $name) {
			pullRequest(number: $number) {
				commits(first: 100) {
					nodes {
						commit {
							oid
							messageHeadline
							committedDate
							author {
								user {
									login
									avatarUrl
								}
							}
							additions
							deletions
						}
					}
				}
			}
		}
	}
`;

export function getPullRequestCommitsQueryOptions(
	owner: string,
	repo: string,
	prNumber: number,
) {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequestCommits", owner, repo, prNumber],
		queryFn: async () => {
			return graphQLClient.request<
				GetPullRequestCommitsQuery,
				GetPullRequestCommitsQueryVariables
			>(GetPullRequestCommits, {
				owner,
				name: repo,
				number: prNumber,
			});
		},
	};
}
