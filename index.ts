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

    // console.log(`Extracted links from ${content}:`);
    const links = content.match(/https?:\/\/[a-zA-Z0-9\-\.]+(?:\/[^\s?#"']*)?(?:\?[^\s#"']*)?(?:#[^\s"']*)?/g) || [];
    // console.log(links);

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

    // console.log(link);

    const url = new URL(link);
    return url.hostname;
}

async function _isSpam(links: string[], spamLinkDomains: string[], redirectionDepth: number, memo: Map<string, boolean>): Promise<boolean> {

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

    const domain = extractDomain(link);
    if (spamLinkDomains.includes(domain)) return true;

    // Second, use 1 redirection to make a request to the link and check if the
    // response is a redirected(301 or 302) URL which is in the spamLinkDomains.
    let found1 = false;
    let found2 = false;
    if (redirectionDepth > 0) {
        // console.log(`Fetching ${link}`);
        const res = await fetch(link);
        if (res.redirected) {
            const redirectedDomain = extractDomain(res.url);
            if (spamLinkDomains.includes(redirectedDomain)) return true;
            else {
                // If the redirected domain is not in the spamLinkDomains, we
                // will recursively check the redirected URL.
                const redirectedLinks = [res.url];
                found1 = await _isSpam(redirectedLinks, spamLinkDomains, redirectionDepth - 1, memo);
            }
        }

        // Third, if the response if instead a HTML page, find any anchor tags
        // and check if the href is in the spamLinkDomains. If so, return true.
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
        found2 = await _isSpam(nonSpamAnchorLinks, spamLinkDomains, redirectionDepth - 1, memo);
    }

    // Take out the first link and recursively check the rest of the links.
    const found3 = await _isSpam(links.slice(1), spamLinkDomains, redirectionDepth, memo);

    // Memoize the result.
    const result = found1 || found2 || found3;
    memo.set(key, result);
    return result;
}

export async function isSpam(content: string, spamLinkDomains: string[], redirectionDepth: number): Promise<boolean> {
    const links = extractLinks(content);
    return await _isSpam(links, spamLinkDomains, redirectionDepth, new Map());
}

async function test() {
    console.log(await isSpam("http://moiming.page.link/exam?_impl=1&test=1", ["moiming.page.link"], 1) === true);
    console.log(await isSpam("http://moiming.page.link/exam?_impl=1&test=1", ["moiming.page.link"], 2) === true);
    console.log(await isSpam("http://moiming.page.link/exam?_impl=1&test=1", ["moiming.page.link"], 0) === true);

    console.log(await isSpam("spam spam https://moiming.page.link/exam?_imcp=1", ["docs.github.com"], 1) === false);
    console.log(await isSpam("spam spam https://moiming.page.link/exam?_imcp=1", ["moiming.page.link"], 1) === true);
    console.log(await isSpam("spam spam https://moiming.page.link/exam?_imcp=1", ["github.com"], 2) === true);
    console.log(await isSpam("spam spam https://moiming.page.link/exam?_imcp=1", ["docs.github.com"], 2) === false);
    console.log(await isSpam("spam spam https://moiming.page.link/exam?_imcp=1", ["docs.github.com"], 3) === true);
}

// test();