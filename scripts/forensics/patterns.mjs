// Shared error patterns used by the forensics rules and the runner.
export const NETWORK = /net::ERR_|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|getaddrinfo|socket hang up/;
export const CODE = /\b(TypeError|ReferenceError|SyntaxError)\b|Cannot find module|is not a function|is not defined/;
export const LOCATOR = /strict mode violation|waiting for (getBy|locator)|element\(s\) not found|Locator:/;
