import katex from "katex";
import "katex/dist/katex.min.css";

const _ = (prop) => Symbol.for(prop);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let semaphore = false;

async function _wikiFetch(
  searchTerm,
  params = null,
  language = "en",
  attempt = 0,
) {
  const maxRetries = 3;

  try {
    const url = new URL(
      `https://${language}.wikipedia.org/w/api.php?format=json&origin=*`,
    );

    const isPlainObject =
      params !== null && typeof params === "object" && !Array.isArray(params);

    if (!params || !isPlainObject || !Object.keys(params).length) {
      url.searchParams.set("action", "query");
      url.searchParams.set("generator", "search");
      url.searchParams.set("gsrsearch", encodeURIComponent(searchTerm));
      url.searchParams.set("gsrlimit", "50");
      url.searchParams.set("prop", "extracts");
      url.searchParams.set("exintro", "true");
      url.searchParams.set("explaintext", "true");
      url.searchParams.set("exsentences", "3");
      url.searchParams.set("maxlag", "5");
    } else {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }

      if (!url.searchParams.has("maxlag")) {
        url.searchParams.set("maxlag", "5");
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mentr/1.0.0",
      },
    });

    if (!response.ok) {
      const retryAfter = response.headers.get("retry-after");
      const err = new Error(`HTTP error ${response.status}`);
      err.status = response.status;
      err.retryAfter = retryAfter ? Number(retryAfter) : null;
      throw err;
    }

    let data;

    try {
      data = await response.json();
    } catch (error) {
      const err = new Error(
        `Invalid JSON response, please tune your request: HTTP ${response.status}`,
      );
      err.retryAfter = null; // a 200 with an unparseable body won't fix itself on retry
      throw err;
    }

    if (data?.error) {
      const err = new Error(
        `Wiki API error: ${data.error.code} - ${data.error.info}`,
      );
      err.code = data.error.code;
      err.retryAfter = response.headers.get("retry-after")
        ? Number(response.headers.get("retry-after"))
        : null;
      throw err;
    }

    return data;
  } catch (error) {
    const retryable = typeof error.retryAfter === "number";

    if (!retryable || attempt >= maxRetries) {
      return {
        status: "error",
        error: error?.message || "Unknown error",
      };
    } else {
      const serverDelay = !Number.isNaN(error.retryAfter)
        ? error.retryAfter * 1000
        : 1000;

      await sleep(serverDelay);
      return _wikiFetch(searchTerm, params, language, attempt + 1);
    }
  }
}

export async function wikiFetch(searchTerm, params = null, language = "en") {
  while (semaphore) {
    await sleep(300);
  }
  semaphore = true;
  const result = await _wikiFetch(searchTerm, params, language);
  semaphore = false;
  return result;
}

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

      const topicURL = `https://${this.languageCode}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(page)}&format=json&origin=*`;
      const topicResponse = await fetch(topicURL, {
        headers: {
          "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
        },
      });

      topicData = await topicResponse.json();

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
      //Do something here
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

          const formulaRegex = /[\{]*\\displaystyle([\s\S]*?)[\}]*\s{2}/g;
          const alignedRegex = /\{\\begin\{aligned\}([\s\S]*?)\\end\{aligned/g;

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
                      console.error(error);
                    }
                  });
                }

                try {
                  return katex.renderToString(`${inner}`, {
                    displayMode: false,
                  });
                } catch (error) {
                  console.error(error);
                }
              })
              .replace(/\.\n+/g, ".<br><br>");
          } else {
            parsedFormulaPart = formulaPart.replace(/\.\n+/g, ".<br><br>");
          }

          parsedResponse.push(parsedFormulaPart);
        }

        lastPartType = "content";
      }
    }

    return parsedResponse;
  }
}
