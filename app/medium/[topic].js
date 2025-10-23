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
import PillsView from "../../components/PillsView";
import Pill from "../../components/Pill";

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
  const [isSearching, setIsSearching] = useState(false);
  const [topics, setTopics] = useState([]);
  const clickedSections = useRef(new Set());

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

        const estimatedSpent =
          timeSpent *
          (ctx.clickedSections.current.size / ctx.allSections.current);
        if (selectResult) {
          const insertResult = ctx.db.runSync(
            `UPDATE interest SET spent = spent + ${estimatedSpent} WHERE id = '${selectResult.id}'`,
          );
        } else {
          const insertResult = ctx.db.runSync(
            `INSERT OR IGNORE INTO interest (id,disciple_email,name,spent,chain) VALUES ('${randomUUID()}', 'juampi.gnr@gmail.com', '${topic}', ${estimatedSpent}, '${firstTopic}')`,
          );
        }
      };
    }, []),
  );

  useAsyncEffect(async () => {
    const wiki = new RNWiki(ctx.discipleLanguage);

    const parseJSON = (jsonString) => {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        return null;
      }
    };

    const result = await wiki.getPage(topic);

    //Check this later
    setSummary(
      !result[0]?.section
        ? result[0].replace(/<a[^>]*href="([^"]+)"[^>]*>\1<\/a>/g, "$1")
        : result[1].replace(/<a[^>]*href="([^"]+)"[^>]*>\1<\/a>/g, "$1"),
    );

    ctx.clickedSections.current = new Set();
    ctx.allSections.current = 1;

    for (let i = 0, n = result.length; i < n; i++) {
      const part = result[i];
      const parsedSection = part?.section;
      const parsedSubsection = part?.subsection;

      const nextPart = result[i + 1] ?? "";

      if (parsedSection) {
        const title = parsedSection;
        const subtitle = parsedSubsection;

        const content = nextPart;

        const sectionObject = {
          title: title,
          subtitle: subtitle,
          content: content,
        };
        setSections((prevSections) => [
          ...prevSections,
          <Section>{sectionObject}</Section>,
        ]);
        ctx.allSections.current += 1;
      }
    }
  }, []);

  useAsyncEffect(async () => {
    let queryResult = [];
    let searchSuggestions = [];

    if (ctx.status?.action === "search") {
      try {
        setIsSearching(true);

        const response = await fetch(
          `https://${ctx.discipleLanguage}.wikipedia.org/w/api.php?action=opensearch&search=${ctx.status?.value}&limit=30&namespace=0&format=json&origin=*`,
          {
            headers: {
              "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
            },
          },
        );

        const data = await response.json();

        queryResult = data[1]; // The second element contains the list of suggestions

        if (queryResult.length <= 10) {
          const extraResponse = await fetch(
            `https://${ctx.discipleLanguage}.wikipedia.org/w/api.php?action=opensearch&search=${queryResult[1]}&limit=20&namespace=0&format=json&origin=*`,
            {
              headers: {
                "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
              },
            },
          );

          const extraData = await extraResponse.json();
          queryResult = [...data[1], ...extraData[1]];
        }
      } catch (error) {
        console.error("Error fetching data from Wikipedia:", error);
      }

      for (const topic of queryResult) {
        searchSuggestions.push(<Pill>{topic}</Pill>);
      }

      setTopics(searchSuggestions);
    }
  }, [ctx.status]);

  return (
    (isSearching && <PillsView>{topics}</PillsView>) || (
      <ScrollView style={css.contentView}>
        <Text style={css.contentTitle}>{topic}</Text>
        <Text style={css.contentSummary}>{summary}</Text>
        {sections}
        <View style={{ marginTop: 30 }}></View>
      </ScrollView>
    )
  );
}

const styles = StyleSheet.create({ ...css });
