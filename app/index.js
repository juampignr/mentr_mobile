import { useState, useContext, useEffect } from "react";
import { useAsyncEffect } from "@react-hook/async";
import { Link } from "expo-router";
import { Context } from "./_layout.js";
import PillsView from "../components/PillsView";
import Pill from "../components/Pill";
import chalk from "chalk";

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

export default function Curiosity() {
  const ctx = useContext(Context);

  show(ctx.chain);
  const [topics, setTopics] = useState([]);
  const randomIndex = (categories) => {
    return Math.floor(Math.random() * categories.length);
  };

  useAsyncEffect(async () => {
    console.log(`Alerted from PillsView index:`);
    console.log(ctx.status);
    let queryResult = [];
    let searchSuggestions = [];

    if (ctx.status.action === "search") {
      try {
        const response = await fetch(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${ctx.status?.value}&limit=30&namespace=0&format=json&origin=*`,
        );
        const data = await response.json();
        show(data);
        queryResult = data[1]; // The second element contains the list of suggestions

        if (queryResult.length <= 10) {
          const extraResponse = await fetch(
            `https://en.wikipedia.org/w/api.php?action=opensearch&search=${queryResult[1]}&limit=20&namespace=0&format=json&origin=*`,
          );

          const extraData = await extraResponse.json();
          queryResult = [...data[1], ...extraData[1]];
        }
      } catch (error) {
        show(error);
        console.error("Error fetching data from Wikipedia:", error);
      }

      for (const topic of queryResult) {
        searchSuggestions.push(<Pill>{topic}</Pill>);
      }
      show(searchSuggestions);

      setTopics(searchSuggestions);
      show(searchSuggestions);
    }
  }, [ctx.status]);

  useAsyncEffect(async () => {
    show(ctx.db);
    const interestChain = Object.entries(ctx?.chain);

    if (!interestChain.length) {
      let selectedSuggestions = [
        "Photography",
        "Environmental science",
        "Gardening",
        "Role-playing games",
        "Creative writing",
        "Yoga",
        "Biology",
        "Calligraphy",
        "Robotics",
        "Painting",
        "Journaling",
        "Birdwatching",
        "Sudoku",
        "Mathematics",
        "Cooking",
        "Astronomy",
        "Chess",
        "Crafting",
        "Digital art",
        "Board games",
        "Meditation",
        "Computer programming",
        "Hiking",
        "Drawing",
        "Video games",
        "Chemistry",
        "Citizen science",
        "Playing a musical instrument",
      ];

      const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          // Generate a random index j such that 0 ≤ j ≤ i
          const j = Math.floor(Math.random() * (i + 1));
          // Swap elements at indices i and j
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      const shuffledSuggestions = shuffle(selectedSuggestions);
      const shuffledPills = [];

      for (const suggestion of shuffledSuggestions) {
        shuffledPills.push(<Pill>{suggestion}</Pill>);
      }

      show(selectedSuggestions);
      setTopics(shuffledPills);
    } else {
      const sortedInterests = Object.keys(ctx.chain).sort(function (a, b) {
        return ctx.chain[a] > ctx.chain[b];
      });
      console.log(sortedInterests);

      const sortedPills = [];

      for (const item of sortedInterests) {
        sortedPills.push(<Pill>{item}</Pill>);
      }
      setTopics(sortedPills);
    }
  }, []);

  return <PillsView>{topics}</PillsView>;
}
