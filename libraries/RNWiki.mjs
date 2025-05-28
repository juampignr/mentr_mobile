export default class RNWiki {
  constructor(fetch = fetch) {
    this.fetch = fetch;
  }

  async getPage(query) {
    const sectionsURL = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(query)}&prop=sections&origin=*`;

    let sections = await (await fetch(sectionsURL)).json();

    const excludedTitles = [
      "See also",
      "External links",
      "References",
      "Further reading",
      "Explanatory notes",
    ];

    sections = sections.filter(
      (section) => !excludedTitles.includes(section.line),
    );

    const sectionsIndex = sections.map((section) => section.index);

    console.log(sectionsIndex);

    const pageURL = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(query)}&prop=text&section=${sectionsIndex[0]}&origin=*`;
    const pageResponse = await (await fetch(pageURL)).json();
    console.log(pageResponse);
    return pageResponse;
  }
}
