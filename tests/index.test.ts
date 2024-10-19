import { extractLinks } from "..";


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

