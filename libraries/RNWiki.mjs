const _ = (prop) => Symbol.for(prop);

export default class RNWiki {
  constructor() {
    this.fetch = fetch;
  }

  async [_("getJSONPage")](query) {
    let page = query;

    if (Array.isArray(query)) {
      page = query.join("|");
    }

    const topicURL = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(page)}&format=json&origin=*`;
    const topicResponse = await fetch(topicURL, {
      headers: {
        "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
      },
    });

    let topicData = await topicResponse.json();
    let result;

    if (Array.isArray(topicData.query.pages)) {
      const element = Object.values(topicData.query.pages)[0];

      result = {
        [element.pageid]: {
          title: element.title,
          summary: element.extract,
        },
      };
    } else {
      for (const element of Object.values(topicData.query.pages)) {
        console.log(element);
        result = {
          ...result,
          [element.pageid]: {
            title: element.title,
            summary: element.extract,
          },
        };
      }
    }

    console.log(result);

    return result;
  }

  async getJSONPage(query) {
    return await this[_("getJSONPage")](query);
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
