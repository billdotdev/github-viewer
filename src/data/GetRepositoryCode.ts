import { gql } from "graphql-request";
import type {
	GetRepositoryCodeQuery,
	GetRepositoryCodeQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";

const GetRepositoryCode = gql`
	query GetRepositoryCode($owner: String!, $name: String!) {
		repository(owner: $owner, name: $name) {
			defaultBranchRef {
				target {
					... on Commit {
						history(first: 20) {
							totalCount
							nodes {
								oid
								messageHeadline
								committedDate
								author {
									avatarUrl
									user {
										login
									}
								}
							}
						}
					}
				}
			}
		}
	}
`;

export function getRepositoryCodeQueryOptions(owner: string, repo: string) {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["repositoryCode", owner, repo],
		queryFn: async () => {
			return graphQLClient.request<
				GetRepositoryCodeQuery,
				GetRepositoryCodeQueryVariables
			>(GetRepositoryCode, {
				owner,
				name: repo,
			});
		},
	};
}
