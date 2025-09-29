export default class RNWiki {
  constructor() {
    this.fetch = fetch;
  }

  async getRawPage(query) {
    const topicURL = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(query)}&format=json&origin=*`;
    const topicResponse = await fetch(topicURL, {
      headers: {
        "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
      },
    });

    let topicData = await topicResponse.json();
    topicData = Object.values(topicData.query.pages)[0];

    return {
      [topicData.pageid.toString()]: {
        title: topicData.title,
        summary: topicData.extract,
      },
    };
  }

  async getPage(query) {
    const excludedSections = [
      "See also",
      "External links",
      "References",
      "Further reading",
      "Explanatory notes",
    ];
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(query)}&prop=extracts&explaintext`;
    let response = await (
      await fetch(url, {
        headers: {
          "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
        },
      })
    ).json();

    response = Object.values(response.query.pages)[0];
    response = response.extract;
    //show(response);

    response = response.split(/[=]{1,2}\s*[a-zA-Z]*\s*[=]{1,2}/gm);

    let lastPartType = "content";
    let lastPartContent = "start";

    let parsedResponse = [];

    for (let i = 0, n = response.length; i < n; i++) {
      let part = response[i];
      let lastSection = i ? response[i - 2] : "";
      let lastPart = i ? response[i - 1] : "";

      if (/^\=.*$/gm.test(part)) {
        i++;
        part = response[i];
        lastSection = i ? response[i - 2] : "";
      }

      if (/^\s{1,2}.{3,100}$/g.test(part)) {
        if (lastPartType === "content") {
          parsedResponse.push(`<${part.trim()}>`);
          lastPartType = "section";
        } else {
          parsedResponse.pop();

          parsedResponse.push(`<${lastSection.trim()}>:<${part.trim()}>`);

          lastPartType = "section";
        }
      } else if (!/^\s*$/g.test(part)) {
        if (
          lastPartType === "section" &&
          excludedSections.includes(lastPart.trim())
        ) {
          parsedResponse.pop();
        } else {
          parsedResponse.push(part.replace(/\n/g, "\n\n").trimEnd());
        }

        lastPartType = "content";
      }
    }

    return parsedResponse;
  }
}
