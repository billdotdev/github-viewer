declare module "refractor/core" {
	const refractor: {
		register: (syntax: unknown) => void;
		languages: Record<string, unknown>;
		highlight: (value: string, language: string) => unknown;
	};
	export default refractor;
}

declare module "refractor/lang/*" {
	const syntax: unknown;
	export default syntax;
}
