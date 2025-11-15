import { gql } from "graphql-request";
import type {
	GetIssuesQuery,
	GetIssuesQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";

const GetIssues = gql`
	query GetIssues($owner: String!, $name: String!) {
		repository(owner: $owner, name: $name) {
			issues(
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
						avatarUrl
					}
					comments {
						totalCount
					}
					labels(first: 5) {
						nodes {
							name
							color
						}
					}
				}
			}
		}
	}
`;

export function getIssuesQueryOptions(owner: string, repo: string) {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["repositoryIssues", owner, repo],
		queryFn: async () => {
			return graphQLClient.request<GetIssuesQuery, GetIssuesQueryVariables>(
				GetIssues,
				{ owner, name: repo },
			);
		},
	};
}
