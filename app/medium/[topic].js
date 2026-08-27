import {
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
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

        let selectResult;
        try {
          selectResult = ctx.db.getFirstSync(
            `SELECT * FROM interest WHERE disciple_email = 'juampi.gnr@gmail.com' AND name = '${topic}'`,
          );
        } catch (error) {
          console.info(`Mentr (ERROR.MEDIUM) Unable to record chain of interest on focus: ${error.message}`);
        }

        const estimatedSpent =
          timeSpent *
          (ctx.clickedSections.current.size / ctx.allSections.current);
        if (selectResult) {
          const insertResult = await ctx.db.runAsync(
            `UPDATE interest SET spent = spent + ? WHERE id = ?`,
            [estimatedSpent, selectResult.id],
          );
        } else {
          const insertResult = await ctx.db.runAsync(
            `INSERT OR IGNORE INTO interest (id, disciple_email, name, spent, chain)
             VALUES (?, ?, ?, ?, ?)`,
            [
              randomUUID(),
              "juampi.gnr@gmail.com",
              topic,
              estimatedSpent,
              firstTopic,
            ],
          );
        }
      };
    }, []),
  );

  useAsyncEffect(async () => {
    const wiki = new RNWiki(ctx.discipleLanguage);

    const result = await wiki.getPage(topic);

    setSummary(!result[0]?.section ? result[0] : result[1]);

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

        const data = await ctx.wikiFetch(ctx.status?.value, {
          action: "opensearch",
          search: ctx.status?.value,
          namespace: "0",
        });

        queryResult = data[1]; // The second element contains the list of suggestions

      } catch (error) {
        console.info(`Mentr (ERROR.MEDIUM) Unable to search on medium: ${error.message}`);
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
