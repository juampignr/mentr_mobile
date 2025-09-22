import {
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../_layout.js";
import { useLocalSearchParams } from "expo-router";
import { randomUUID } from "expo-crypto";
import css from "../../styles/global.js";
import chalk from "chalk";
import Section from "../../components/Section.js";
import RNWiki from "../../libraries/RNWiki.mjs";
import { all } from "axios";

let show = (arg) => {
  switch (typeof arg) {
    case "string":
      console.log(chalk.inverse(arg));
      break;

    case "object":
      console.log(arg);
      break;

    case "function":
      console.log(arg);
      break;

    default:
      console.log(chalk.bold(arg));
      break;
  }
};

let debug = (arg) => {
  switch (typeof arg) {
    case "string":
      console.log(chalk.red.underline(arg));
      break;

    case "object":
      console.log(arg);
      break;

    case "function":
      console.log(arg);
      break;

    default:
      console.log(chalk.red.underline(arg));
      break;
  }
};

let warn = (arg) => {
  switch (typeof arg) {
    case "string":
      console.log(chalk.bgRed.inverse(arg));
      break;

    case "object":
      console.log(arg);
      break;

    case "function":
      console.log(arg);
      break;

    default:
      console.log(chalk.bgRed(arg));
      break;
  }
};

export default function Medium() {
  const ctx = useContext(Context);
  let { topic } = useLocalSearchParams();
  let chain = topic.split(":");

  const firstTopic = chain[0];
  topic = chain[1];

  const [sections, setSections] = useState([]);
  const [summary, setSummary] = useState("");

  const startTimeRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      // Screen is focused
      startTimeRef.current = Date.now();

      return async () => {
        const endTime = Date.now();
        const timeSpent = endTime - startTimeRef.current;

        ctx.setChain((prevChain) => ({
          ...prevChain,
          [topic]: prevChain[topic] ? prevChain[topic] + timeSpent : timeSpent,
        }));

        const selectResult = ctx.db.getFirstSync(
          `SELECT * FROM interest WHERE disciple_email = 'juampi.gnr@gmail.com' AND name = '${topic}'`,
        );

        const allInterests = ctx.db.getAllSync(
          `SELECT chain,name,spent FROM interest WHERE disciple_email = 'juampi.gnr@gmail.com'`,
        );
        const orderedInterests = Object.values(
          ctx.db.getAllSync(
            `SELECT name, chain, spent
          FROM
            interest
          WHERE
            disciple_email = 'juampi.gnr@gmail.com' AND chain = '${firstTopic}'
          ORDER BY
            chain, spent DESC;
          GROUP BY chain;
          `,
          ),
        );

        const allCategories = [];

        for (let [i, n] = [0, orderedInterests.length]; i < n; i++) {
          if (i < 10) {
            const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(orderedInterests[i].name)}&prop=categories|links|linkshere&cllimit=10&pllimit=10&lhlimit=10&format=json&origin=*`;
            const response = await fetch(url, {
              headers: {
                "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
              },
            });

            let linksResults = (await response.json()).query.pages;

            linksResults = Object.values(linksResults);
            const excludePatterns = [
              /All/,
              /Articles/,
              /Wikipedia/,
              /CS1/,
              /stub/i,
              /weasel/i,
              /unsourced/i,
              /cleanup/i,
            ];

            for (const page of linksResults) {
              page.categories.map((category) => {
                if (!excludePatterns.some((p) => p.test(category.title)))
                  allCategories.push(category.title.replace("Category:", ""));
              });
            }
          }
        }

        show(
          allCategories.reduce((acc, curr) => {
            if (curr in acc) {
              acc[curr] += 1;
            } else {
              acc[curr] = 1;
            }
            return acc;
          }, {}),
        );

        /* Query on shallow
        const allInterests = ctx.db.getAllSync(
          `SELECT
            disciple.email AS disciple,
            interest.name AS topic,
            interest.spent AS spent,
            interest.chain AS firstTopic
          FROM
            disciple
          INNER JOIN
            interest
          ON
            disciple.email = interest.disciple_email
          WHERE
            interest.chain = '${topic}'
          ORDER BY interest.spent DESC;`,
        );
        */

        if (selectResult) {
          const insertResult = ctx.db.runSync(
            `UPDATE interest SET spent = spent + ${timeSpent} WHERE id = '${selectResult.id}'`,
          );
        } else {
          const insertResult = ctx.db.runSync(
            `INSERT OR IGNORE INTO interest (id,disciple_email,name,spent,chain) VALUES ('${randomUUID()}', 'juampi.gnr@gmail.com', '${topic}', ${timeSpent}, '${firstTopic}')`,
          );
        }
      };
    }, []),
  );

  useAsyncEffect(async () => {
    const wiki = new RNWiki();
    const isSectionRegex = /\<.*\>/g;

    const result = await wiki.getPage(topic);

    setSummary(!isSectionRegex.test(result[0]) ? result[0] : result[1]);

    for (let i = 0, n = result.length; i < n; i++) {
      const part = result[i];
      //Best effort to discover the section's content

      const isSection = isSectionRegex.test(part);
      const nextPart = result[i + 1] ?? "";

      if (isSection) {
        const title = part.replace(/[<>]/g, "");
        const subtitle = title.split(":").length > 1 ? title.split(":")[1] : "";
        const content = nextPart;

        const sectionObject = {
          title: title.replace(/:/g, ""),
          subtitle: subtitle,
          content: content,
        };

        setSections((prevSections) => [
          ...prevSections,
          <Section>{sectionObject}</Section>,
        ]);
      }
    }
  }, []);

  return (
    <>
      <ScrollView style={css.contentView}>
        <Text style={css.contentTitle}>{topic}</Text>
        <Text style={css.contentSummary}>{summary}</Text>
        {sections}
        <View style={{ marginTop: 30 }}></View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({ ...css });
