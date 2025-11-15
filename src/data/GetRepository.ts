import { gql } from "graphql-request";
import type {
	GetRepositoryQuery,
	GetRepositoryQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";

const GetRepository = gql`
	query GetRepository($owner: String!, $name: String!) {
		repository(owner: $owner, name: $name) {
			id
			name
			stargazerCount
			forkCount
			visibility
			primaryLanguage {
				name
				color
			}
		}
	}
`;

export function getRepositoryQueryOptions(owner: string, repo: string) {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["repository", owner, repo],
		queryFn: async () => {
			return graphQLClient.request<
				GetRepositoryQuery,
				GetRepositoryQueryVariables
			>(GetRepository, {
				owner,
				name: repo,
			});
		},
	};
}
