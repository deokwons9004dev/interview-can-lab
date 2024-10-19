import { extractLinks, extractDomain, isSpam } from "..";

it("should return a list of extracted links from a string content", () => {

    expect(extractLinks("http:/moiming.page.link/exam?_impl=1&test=1"))
        .toEqual([]);

    expect(extractLinks("http://moiming.page.link/exam?_impl=1&test=1"))
        .toEqual(["http://moiming.page.link/exam?_impl=1&test=1"]);

    expect(extractLinks("https://moiming.page.link/exam?_impl=1 https://moiming.page.link/exam?_impl=1"))
        .toEqual(["https://moiming.page.link/exam?_impl=1", "https://moiming.page.link/exam?_impl=1"]);

    expect(extractLinks("stuff not::link http://moiming.page.link/exam?_impl=1 https://moiming.page.link/exam?_impl=1"))
        .toEqual(["http://moiming.page.link/exam?_impl=1", "https://moiming.page.link/exam?_impl=1"]);
});

it("should return the domain of a link", () => {

    expect(extractDomain("http://moiming.page.link/exam?_impl=1&test=1"))
        .toEqual("moiming.page.link");

    expect(extractDomain("http://docs.github.com/repos"))
        .toEqual("docs.github.com");

    expect(extractDomain("http://sub.naver.com/repos"))
        .toEqual("sub.naver.com");
});

it("should return true if the content contains a spam link", async () => {

    expect(await isSpam("http://moiming.page.link/exam?_impl=1&test=1", ["moiming.page.link"], 1))
        .toEqual(true);

    expect(await isSpam("http://moiming.page.link/exam?_impl=1&test=1", ["moiming.page.link"], 2))
        .toEqual(true);

    expect(await isSpam("http://moiming.page.link/exam?_impl=1&test=1", ["moiming.page.link"], 0))
        .toEqual(true);

    expect(await isSpam("spam spam https://moiming.page.link/exam?_imcp=1", ["docs.github.com"], 1))
        .toEqual(false);

    expect(await isSpam("spam spam https://moiming.page.link/exam?_imcp=1", ["moiming.page.link"], 1))
        .toEqual(true);

    expect(await isSpam("spam spam https://moiming.page.link/exam?_imcp=1", ["github.com"], 2))
        .toEqual(true);

    expect(await isSpam("spam spam https://moiming.page.link/exam?_imcp=1", ["docs.github.com"], 2))
        .toEqual(false);

    expect(await isSpam("spam spam https://moiming.page.link/exam?_imcp=1", ["docs.github.com"], 3))
        .toEqual(true);
}, 60 * 1000); // 60 seconds timeout
