/**
 * Extracts all links from the content.
 *
 * @param   {string[]}  content  The content to extract links from.
 *
 * @return  {string[]}           A list of links extracted from the content.
 */
export function extractLinks(content: string): string[] {

    return content.match(/https?:\/\/[^ ]+/g) || [];
}

export function extractDomain(link: string): string {

    const url = new URL(link);
    console.log(url);

    return url.hostname;
}
console.log(extractDomain("http://moiming.page.link/exam?_impl=1&test=1") === "moiming.page.link");
console.log(extractDomain("http://docs.github.com/repos") === "docs.github.com");
console.log(extractDomain("http://sub.naver.com/repos") === "docs.github.com");


function isSpam(content: string, spamLinkDomains: string[], redirectionDepth: number): boolean {

    // Extract links from content.
    const links = extractLinks(content);

    // We will TRY TO use bottom-up dynamic programming to solve this problem.
    // First we will just try to do this recursively.

    // For each link, check if it is spam.
    // First, check if the domain is in the spamLinkDomains.
    for (let link of links) {
        const domain = extractDomain(link);
        if (spamLinkDomains.includes(domain)) {
            return true;
        }
    }

    // Second, use 1 redirection to make a request to the link and check if the
    // response is a redirected(301 or 302) URL which is in the spamLinkDomains.
    // TODO: Implement this.


    // Third, if the response if instead a HTML page, find any anchor tags and
    // check if the href is in the spamLinkDomains. 
    // TODO: Implement this.

    return false;
}