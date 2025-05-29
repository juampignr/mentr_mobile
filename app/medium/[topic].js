import { useContext, useState, useRef, useEffect, useMemo } from "react";
import { FlatList, View, Text, StyleSheet } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../_layout.js";
import { useLocalSearchParams } from "expo-router";
import css from "../../styles/global.js";
import chalk from "chalk";
import Section from "../../components/Section.js";
//import RNWiki from "../../libraries/RNWiki.mjs";

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

class RNWiki {
  constructor() {
    this.fetch = fetch;
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
    let response = await (await fetch(url)).json();

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
          parsedResponse.push(part.trim());
        }

        lastPartType = "content";
      }
    }

    //console.log(parsedResponse);

    return parsedResponse;
  }
}

export default function Medium() {
  const ctx = useContext(Context);
  const { topic } = useLocalSearchParams();

  const [sections, setSections] = useState([]);

  useAsyncEffect(async () => {
    const wiki = new RNWiki();

    const result = await wiki.getPage(topic);

    for (const part of result) {
      const isSection = /^<.{3,100}>$/g.test(part);
      show(isSection);
      if (isSection) {
        setSections((prevSections) => [
          ...prevSections,
          <Section>{part.replace(/[<>]/g, "")}</Section>,
        ]);
      }
    }
  }, []);

  return (
    <>
      <View style={css.contentView}>
        <Text style={css.contentTitle}>{topic}</Text>
        {sections}
      </View>
    </>
  );
}

const styles = StyleSheet.create({ ...css });
