import { GraphQLClient } from "graphql-request";
import { getToken } from "./tokenStorage";

const GITHUB_API_URL = "https://api.github.com/graphql";

let sharedClient: GraphQLClient | null = null;
let token: string | null = null;

export function getGraphQLClient(): GraphQLClient {
	if (sharedClient) return sharedClient;

	sharedClient = new GraphQLClient(GITHUB_API_URL, {
		requestMiddleware: async (request) => {
			if (!token) {
				token = await getToken();
			}
			if (!token) {
				throw new Error("No token available");
			}
			return {
				...request,
				headers: {
					...(request.headers as Record<string, string> | undefined),
					Authorization: `Bearer ${token}`,
				},
			};
		},
	});

	return sharedClient;
}
