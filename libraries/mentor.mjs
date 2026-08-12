import * as SQLite from "expo-sqlite";
import { randomUUID } from "expo-crypto";
import show from "./show";
import RNWiki, { wikiFetch } from "./RNWiki";

export default class Mentor {
  constructor(chain, db = null, disciple = null, languageCode = "en") {
    this.chain = chain ?? "";

    if (db) {
      this.openDB = db;
    } else {
      this.openDB = () => SQLite.openDatabaseSync("mentor.db");
    }

    this.disciple = disciple ?? "";
    this.languageCode = languageCode;
    this.categoryNoise = [
      /\bstub/i,
      /^Category:All /i,
      /^Category:Articles (with|containing|needing)/i,
      /^Category:Pages (with|using)/i,
      /^Category:Wikipedia /i,
      /^Category:CS1 /i,
      /^Category:Short description/i,
      /^Category:Commons category/i,
      /^Category:Use (mdy|dmy) dates/i,
    ];
    this.linkNoise = [/identifier/, /User/, /Talk/];
    this.minInterestsForOverlap = 2;
  }

  async prepare() {
    const db = this.openDB;
    let orderedInterests;

    try {
      orderedInterests = db.getAllSync(
        `SELECT name, chain, spent FROM interest
           WHERE disciple_email = ? AND chain = ?
           ORDER BY spent DESC
           LIMIT 10`,
        [this.disciple, this.chain],
      );
    } catch (error) {
      orderedInterests = [];
    }

    if (!orderedInterests.length) return [];

    // orderedInterests is already sorted by total time spent, so [0] is it.
    const topPick = () => [
      { title: orderedInterests[0].name, sourceCount: 1, count: 0 },
    ];

    // Not enough interests in this chain to compare against each other —
    // skip the network calls entirely and just hand back whatever the
    // disciple has actually spent the most time on.
    if (orderedInterests.length < this.minInterestsForOverlap) {
      return topPick();
    }

    // title -> Set of interest names that surfaced it. This Set is the
    // actual "common ground" signal — size > 1 means it bridges interests.
    const sourcesByTopic = new Map();
    // title -> how many times it was credited in total, used only as a
    // tiebreaker among topics that bridge the same number of interests.
    const countByTopic = new Map();

    const credit = (title, sourceName) => {
      if (!sourcesByTopic.has(title)) sourcesByTopic.set(title, new Set());
      sourcesByTopic.get(title).add(sourceName);
      countByTopic.set(title, (countByTopic.get(title) ?? 0) + 1);
    };

    for (const interest of orderedInterests) {
      let pages;
      try {
        const json = await wikiFetch(
          "",
          {
            action: "query",
            titles: interest.name,
            prop: "categories|links|linkshere",
            cllimit: 50,
            pllimit: 50,
            lhlimit: 50,
          },
          this.languageCode,
        );
        if (json?.status === "error") continue;
        pages = Object.values(json?.query?.pages ?? {});
      } catch (error) {
        continue;
      }

      for (const page of pages) {
        for (const category of page?.categories ?? []) {
          if (this.categoryNoise.every((p) => !p.test(category.title)))
            credit(category.title, interest.name);
        }

        for (const link of page?.links ?? []) {
          if (this.linkNoise.some((p) => p.test(link.title))) continue;
          credit(link.title, interest.name);
        }

        for (const link of page?.linkshere ?? []) {
          if (this.linkNoise.some((p) => p.test(link.title))) continue;
          credit(link.title, interest.name);
        }
      }
    }

    const candidates = [...sourcesByTopic.entries()].map(
      ([title, sources]) => ({
        title,
        sourceCount: sources.size,
        count: countByTopic.get(title),
      }),
    );

    // True common ground: topics tied to at least two distinct interests.
    const commonGround = candidates
      .filter((c) => c.sourceCount > 1)
      .sort((a, b) => b.sourceCount - a.sourceCount || b.count - a.count);

    // No real intersection between interests — fall back to whichever
    // topic the disciple has actually spent the most time on, rather than
    // surfacing a tangent pulled from a single source's link graph.
    if (!commonGround.length) return topPick();

    // Split the overlap set into plain pages and category nodes.
    const categoryItems = commonGround.filter((c) =>
      c.title.startsWith("Category:"),
    );
    const pageItems = commonGround.filter(
      (c) => !c.title.startsWith("Category:"),
    );

    // For the single highest-occurring category, fetch its member pages and
    // inject them into the page pool with the category's own relevance scores.
    // All other category candidates are discarded.
    if (categoryItems.length > 0) {
      const topCategory = categoryItems[0]; // list is already sorted desc

      try {
        const json = await wikiFetch(
          "",
          {
            action: "query",
            list: "categorymembers",
            cmtitle: topCategory.title,
            cmlimit: 50,
            cmtype: "page",
          },
          this.languageCode,
        );
        if (json?.status !== "error") {
          const members = json?.query?.categorymembers ?? [];
          for (const member of members) {
            pageItems.push({
              title: member.title,
              sourceCount: topCategory.sourceCount,
              count: topCategory.count,
            });
          }
        }
      } catch (_) {
        // fetch failed — category simply dropped
      }
    }

    // Re-sort after potential member injection, then return only pages.
    const sortedPages = pageItems.sort(
      (a, b) => b.sourceCount - a.sourceCount || b.count - a.count,
    );

    return sortedPages.length ? sortedPages : topPick();
  }

  async go() {
    const commonGround = await this.prepare();

    // prepare() only comes back empty when the chain has no interests
    // recorded at all. Nothing to look up — skip the network call and hand
    // back the same shape ctx.interestChain expects elsewhere (an object
    // keyed by id), just empty.
    console.log(`Mentoring results: ${JSON.stringify(commonGround)}`);

    const wiki = new RNWiki();
    const topTopics = commonGround.slice(0, 50).map((c) => c.title);

    if (!topTopics.length) return false;

    return await wiki.getJSONPage(topTopics);
  }
}
