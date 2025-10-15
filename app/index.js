import { useState, useContext, useEffect } from "react";
import { useAsyncEffect } from "@react-hook/async";
import { Link } from "expo-router";
import { Context } from "./_layout.js";
import { WebView } from "react-native-webview";
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

  const [topics, setTopics] = useState([]);
  const randomIndex = (categories) => {
    return Math.floor(Math.random() * categories.length);
  };

  useAsyncEffect(async () => {
    let queryResult = [];
    let searchSuggestions = [];

    if (ctx.status.action === "search") {
      try {
        show(ctx?.status?.value);
        const response = await fetch(
          `https://es.wikipedia.org/w/api.php?action=opensearch&search=${ctx.status?.value}&limit=30&namespace=0&format=json&origin=*`,
          {
            headers: {
              "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
            },
          },
        );

        show(
          `https://es.wikipedia.org/w/api.php?action=opensearch&search=${ctx.status?.value}&limit=30&namespace=0&format=json&origin=*`,
        );
        show(response);
        const data = await response.json();

        queryResult = data[1]; // The second element contains the list of suggestions

        if (queryResult.length <= 10) {
          const extraResponse = await fetch(
            `https://es.wikipedia.org/w/api.php?action=opensearch&search=${queryResult[1]}&limit=20&namespace=0&format=json&origin=*`,
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
        show(error);
        console.error("Error fetching data from Wikipedia:", error);
      }

      for (const topic of queryResult) {
        searchSuggestions.push(<Pill>{topic}</Pill>);
      }

      setTopics(searchSuggestions);
    }
  }, [ctx.status]);

  useAsyncEffect(async () => {
    const orderedInterests = await ctx.db.getAllAsync(
      `SELECT chain, SUM(spent) AS totalSpent
      FROM
        interest
      WHERE
        disciple_email = 'juampi.gnr@gmail.com'
      GROUP BY
        chain
      ORDER BY
        totalSpent DESC;
      `,
    );

    const interestChain = Object.entries(ctx?.chain);

    if (!orderedInterests?.length) {
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

      setTopics(shuffledPills);
    } else {
      const orderedTopics = orderedInterests.map((element) => (
        <Pill>{element?.chain}</Pill>
      ));
      setTopics(orderedTopics);
    }
  }, []);

  return <PillsView>{topics}</PillsView>;
}
