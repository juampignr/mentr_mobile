import katex from "katex";
import "katex/dist/katex.min.css";
import { warn, show } from "./show";

const _ = (prop) => Symbol.for(prop);

export default class RNWiki {
  constructor(language = "en") {
    this.fetch = fetch;
    this.languageCode = language;
  }

  async [_("getJSONPage")](query) {
    let result;
    let topicData;

    try {
      let page = query;

      if (Array.isArray(query)) {
        page = query.join("|");
      }

      alert(
        `https://${this.languageCode}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(page)}&format=json&origin=*`,
      );
      const topicURL = `https://${this.languageCode}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(page)}&format=json&origin=*`;
      const topicResponse = await fetch(topicURL, {
        headers: {
          "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
        },
      });

      topicData = await topicResponse.json();

      alert(JSON.stringify(topicData));

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
    } catch (error) {
      alert(error);
    }
    return result;
  }

  async getJSONPage(query) {
    return await this[_("getJSONPage")](query);
  }
  async getJsonPage(query) {
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

    const url = `https://${this.languageCode}.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(query)}&prop=extracts|links&explaintext&pllimit=max&origin=*`;

    let response = await (
      await fetch(url, {
        headers: {
          "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
        },
      })
    ).json();
    let responseLinks;

    response = Object.values(response.query.pages)[0];
    responseLinks = response.links.map((link) => link.title);
    response = response.extract;

    show(response);
    response = response.split(/[=]{1,2}\s*[a-zA-Z]*\s*[=]{1,2}/gm);

    for (const link of responseLinks) {
      for (let i = 1, n = response.length; i < n; i++) {
        if (!response[i].startsWith(" ")) {
          response[i] = response[i].replace(
            link,
            `<a style="color:#4d769f" href="${link}">${link}</a>`,
          );
        }
      }
    }

    show(response);
    let lastPartType = "content";
    let lastPartContent = "start";

    let parsedResponse = [response[0].replace(/\.\n+/g, "\.\n\n")];

    for (let i = 1, n = response.length; i < n; i++) {
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
          parsedResponse.push({ section: part.trim() });
          lastPartType = "section";
        } else {
          parsedResponse.pop();
          parsedResponse.push({
            section: lastSection.trim(),
            subsection: part.trim(),
          });

          lastPartType = "section";
        }
      } else if (!/^\s*$/g.test(part)) {
        if (
          lastPartType === "section" &&
          excludedSections.includes(lastPart.trim())
        ) {
          parsedResponse.pop();
        } else {
          const formulaPart = part;

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
            parsedFormulaPart = formulaPart
              .replace(formulaRegex, (_, inner) => {
                if (inner.includes("\\begin{aligned}")) {
                  return inner.replace(alignedRegex, (_, content) => {
                    try {
                      return katex.renderToString(
                        `\\begin{aligned}${content}\\end{aligned}`,
                        {
                          displayMode: false,
                        },
                      );
                    } catch (error) {
                      warn(error);
                    }
                  });
                }

                try {
                  return katex.renderToString(`${inner}`, {
                    displayMode: false,
                  });
                } catch (error) {
                  warn(error);
                }
              })
              .replace(/\.\n*/g, ".<br><br>");
          } else {
            parsedFormulaPart = formulaPart.replace(/\.\n*/g, ".<br><br>");
          }

          show(parsedResponse);
          parsedResponse.push(parsedFormulaPart);
        }

        lastPartType = "content";
      }
    }

    /*
      for (const element of parsedResponse) {
        if (typeof element === "string") {
          show(element);
        }
      }
      */

    return parsedResponse;
  }
}
