import { useContext, useState, useRef, useEffect, useMemo } from "react";
import { FlatList, View, Text } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../_layout.js";
import { useLocalSearchParams } from "expo-router";
import css from "../../styles/global.js";
import chalk from "chalk";
import { DOMParser } from "react-native-html-parser";
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
      let lastPart = i ? response[i - 2] : "";

      if (/^\s{1,2}.{3,100}$/g.test(part)) {
        if (lastPartType === "content") {
          parsedResponse.push(`<${part.trim()}>`);
          lastPartType = "section";
        } else {
          parsedResponse.pop();

          parsedResponse.push(`<${lastPart.trim()}>:<${part.trim()}>`);

          lastPartType = "section";
        }
      } else if (!/^\s*$/g.test(part)) {
        parsedResponse.push(part);
        lastPartType = "content";
        /*
        if (i && !excludedSections.include(lastPart.trim())) {
          parsedResponse.push(part.trim());
          lastPartType = "content";
        } else {
          parsedResponse.pop();
        }
        */
      }
    }

    //console.log(parsedResponse);

    show(parsedResponse);
    return response;
  }
}

export default function Medium() {
  const ctx = useContext(Context);
  const { topic } = useLocalSearchParams();

  useAsyncEffect(async () => {
    const wiki = new RNWiki();

    const result = await wiki.getPage(topic);
  }, []);

  return (
    <>
      <Text>{topic}</Text>
    </>
  );
}
