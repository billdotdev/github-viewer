import { gql } from "graphql-request";
import type {
	GetPrStateCountsQuery,
	GetPrStateCountsQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";

const GetPRStateCounts = gql`
	query GetPRStateCounts($owner: String!, $name: String!) {
		repository(owner: $owner, name: $name) {
			open: pullRequests(states: [OPEN]) {
				totalCount
			}
			openPRsForDraftCount: pullRequests(states: [OPEN], first: 100) {
				nodes {
					isDraft
				}
			}
			closed: pullRequests(states: [CLOSED]) {
				totalCount
			}
			merged: pullRequests(states: [MERGED]) {
				totalCount
			}
		}
	}
`;

export function getPRStateCountsQueryOptions(owner: string, repo: string) {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["prStateCounts", owner, repo],
		queryFn: async () => {
			return graphQLClient.request<
				GetPrStateCountsQuery,
				GetPrStateCountsQueryVariables
			>(GetPRStateCounts, {
				owner,
				name: repo,
			});
		},
	};
}
