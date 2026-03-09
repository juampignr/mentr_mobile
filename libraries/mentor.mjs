import * as SQLite from "expo-sqlite";
import { randomUUID } from "expo-crypto";
import show from "./show";
import RNWiki from "./RNWiki";

export default class Mentor {
  constructor(chain, db = None, disciple = None, languageCode = "en") {
    this.chain = chain ?? "";

    if (db) {
      this.openDB = db;
    } else {
      this.openDB = () => SQLite.openDatabaseSync("mentor.db");
    }

    this.disciple = disciple ?? "";
    this.languageCode = languageCode;
  }

  async prepare() {
    const db = this.openDB;

    const orderedInterests = Object.values(
      db.getAllSync(
        `SELECT name, chain, spent
              FROM
                interest
              WHERE
                disciple_email = '${this.disciple}' AND chain = '${this.chain}'
              ORDER BY
                chain, spent DESC;
              GROUP BY chain;
              `,
      ),
    );

    const allRelatedTopics = [];

    for (let [i, n] = [0, orderedInterests.length]; i < n; i++) {
      if (i < 10) {
        const url = `https://${this.languageCode}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(orderedInterests[i].name)}&prop=categories|links|linkshere&cllimit=50&pllimit=50&lhlimit=50&format=json&origin=*`;
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
          },
        });

        let linksResults = (await response.json()).query.pages;

        linksResults = Object.values(linksResults);
        const excludePatterns = [/identifier/, /User/, /Talk/];

        for (const page of linksResults) {
          page.links.map((category) => {
            if (!excludePatterns.some((p) => p.test(category.title)))
              allRelatedTopics.push(category.title.replace("Category:", ""));
          });

          page.linkshere.map((category) => {
            if (!excludePatterns.some((p) => p.test(category.title)))
              allRelatedTopics.push(category.title.replace("Category:", ""));
          });
        }
      }
    }

    const relatedTopicsCount = allRelatedTopics.reduce((acc, curr) => {
      if (curr in acc) {
        acc[curr] += 1;
      } else {
        acc[curr] = 1;
      }
      return acc;
    }, {});

    const sortedTopics = Object.entries(relatedTopicsCount).sort(
      (a, b) => b[1] - a[1],
    );

    return sortedTopics;
  }

  async go(sortedTopics) {
    const result = await this.prepare();
    const wiki = new RNWiki();

    let insertBulk = "";

    let allTopics = result.filter(([topic, count]) => count > 1);

    allTopics = allTopics.length > 20 ? allTopics.slice(1, 20) : allTopics;

    allTopics = allTopics.map(([topic, count]) => topic);

    return await wiki.getJSONPage(allTopics);

    //this.db.execSync(insertBulk);
  }
}
