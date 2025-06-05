import { useContext, useState, useRef, useEffect, useMemo } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../_layout.js";
import { useLocalSearchParams } from "expo-router";
import css from "../../styles/global.js";
import chalk from "chalk";
import Section from "../../components/Section.js";
import RNWiki from "../../libraries/RNWiki.mjs";

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
  const { topic } = useLocalSearchParams();

  const [sections, setSections] = useState([]);
  const [summary, setSummary] = useState("");

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
          title: title,
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
        //Footer to take into account searchBar
        <View style={{ marginTop: 30 }}></View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({ ...css });
