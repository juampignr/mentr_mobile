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
        result = {
          ...result,
          [element.pageid]: {
            title: element.title,
            summary: element.extract,
          },
        };
      }
    }

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
          const formulaPart = part.replace(/\n/g, "").replace(/\s{2,}/g, "  ");

          //console.log(formulaPart);
          const formulaRegex = /[\{]*\\displaystyle([\s\S]*?)[\}]*\s{2}/g;
          const alignedRegex = /\{\\begin\{aligned\}([\s\S]*?)\\end\{aligned/g;

          //const formulaRegex = /\{([\s\S]*?)\}/g;
          const formulasMatch = [];

          let match;
          let parsedFormulaPart;

          while ((match = formulaRegex.exec(formulaPart)) !== null) {
            formulasMatch.push(match[1].trim());
          }

          if (formulaRegex.test(formulaPart)) {
            parsedFormulaPart = formulaPart.replace(
              formulaRegex,
              (_, inner) => {
                // Check if inner contains \begin{aligned}
                if (inner.includes("\\begin{aligned}")) {
                  return inner.replace(alignedRegex, (_, content) => {
                    return ` $$\\begin{aligned}${content}\\end{aligned}$$ `;
                  });
                }
                // fallback for other \displaystyle formulas
                return ` $${inner}$ `;
              },
            );
          } else {
            parsedFormulaPart = formulaPart;
          }

          parsedResponse.push(parsedFormulaPart);
        }

        lastPartType = "content";
      }
    }

    console.log(parsedResponse);
    return parsedResponse;
  }
}
