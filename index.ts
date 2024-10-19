/**
 * Extracts all links from the content.
 * Its not the complete HTTP URL regex, but does matches the following URL:
 * - <PROTOCOL>://<HOSTNAME>/<PATH>?<QUERY>#<FRAGMENT>
 * 
 * Username, password, and port are not included as they seem to no be very
 * relevant.
 *
 * @param   {string[]}  content  The content to extract links from.
 *
 * @return  {string[]}           A list of links extracted from the content.
 */
export function extractLinks(content: string): string[] {
    const links = content.match(/https?:\/\/[a-zA-Z0-9\-\.]+(?:\/[^\s?#"']*)?(?:\?[^\s#"']*)?(?:#[^\s"']*)?/g) || [];
    return links;
}
/**
 * Extracts the domain from a link using the URL's hostname.
 *
 * @param   {string}  link  A valid HTTP link.
 *
 * @return  {string}        The domain of the link.
 */
export function extractDomain(link: string): string {
    const url = new URL(link);
    return url.hostname;
}

/**
 * Check if the content contains a spam link.
 *
 * @param   {string[]}                     links             A list of links to
 * check. The links are assumed to be valid HTTP links.
 * @param   {string[]}                     spamLinkDomains   A list of spam
 * links to check. The domains are assumed to be valid HTTP domains.
 * @param   {number}                       redirectionDepth  The number of times
 * to follow a redirection. If the redirectionDepth is 0, the function will not 
 * follow any redirection.
 * @param   {Map<string, Promise<boolean>>} memo             A memoization map
 * 
 * @return  {Promise<boolean>}                              True if the content
 * contains a spam link, false otherwise.
 */
async function _isSpam(links: string[], spamLinkDomains: string[], redirectionDepth: number, memo: Map<string, Promise<boolean>>): Promise<boolean> {

    // I will assume that each link will have redirectionDepth many attempts to
    // check if it is spam.
    if (links.length === 0) return false;

    // For each link, check if it is spam.
    // First, check if the domain is in the spamLinkDomains.
    const link = links[0];

    // Construct the key for the memoization as the combination of the link and
    // the redirectionDepth. The separation character is '|', which is not
    // used as a character in the URL specification.
    const key = `${link}|${redirectionDepth}`;
    if (memo.has(key)) return memo.get(key)!;

    // Prepare a promise to check if the link is spam.
    const promise = (async () => {
        const domain = extractDomain(link);
        if (spamLinkDomains.includes(domain)) return true;

        // Second, use 1 redirection to make a request to the link and check if
        // the response is a redirected(301 or 302) URL which is in the
        // spamLinkDomains.
        if (redirectionDepth > 0) {
            const res = await fetch(link);
            if (res.redirected) {
                const redirectedDomain = extractDomain(res.url);
                if (spamLinkDomains.includes(redirectedDomain)) return true;
                else {
                    // If the redirected domain is not in the spamLinkDomains,
                    // we will recursively check the redirected URL.
                    if (await _isSpam([res.url], spamLinkDomains, redirectionDepth - 1, memo)) return true;
                }
            }

            // Third, if the response if instead a HTML page, find any anchor
            // tags and check if the href is in the spamLinkDomains. If so,
            // return true.
            const html = await res.text();
            const anchorLinks = extractLinks(html);
            const nonSpamAnchorLinks = [];
            for (const anchorLink of anchorLinks) {
                const anchorDomain = extractDomain(anchorLink);
                if (spamLinkDomains.includes(anchorDomain)) return true;
                else nonSpamAnchorLinks.push(anchorLink);
            }

            // If the anchor links are not spam, we will recursively check the
            // anchor links.
            if (await _isSpam(nonSpamAnchorLinks, spamLinkDomains, redirectionDepth - 1, memo)) return true;
        }

        // Take out the first link and recursively check the rest of the links.
        if (await _isSpam(links.slice(1), spamLinkDomains, redirectionDepth, memo)) return true;

        return false;
    })();

    memo.set(key, promise);
    return promise;
}

/**
 * Check if the content contains a spam link.
 *
 * @param   {string}            content           The raw string content to
 * check. The content may or may not contain valid HTTP links.
 * @param   {string[]}          spamLinkDomains   A list of spam links to check.
 * @param   {number<boolean>}   redirectionDepth  The number of times to follow.
 *
 * @return  {Promise<boolean>}                    True if the content contains a
 * spam link, false otherwise.
 */
export async function isSpam(content: string, spamLinkDomains: string[], redirectionDepth: number): Promise<boolean> {
    const links = extractLinks(content);
    return _isSpam(links, spamLinkDomains, redirectionDepth, new Map());
}