import DOMPurify from "dompurify";

export function sanitizeHTML(html: string) {
	return DOMPurify.sanitize(html);
}
