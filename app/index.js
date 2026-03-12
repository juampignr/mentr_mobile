import { useState, useContext, useEffect } from "react";
import { useAsyncEffect } from "@react-hook/async";
import { Link } from "expo-router";
import { Context } from "./_layout.js";
import { View, TouchableOpacity, Modal, Pressable, Text } from "react-native";
import { WebView } from "react-native-webview";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6 } from "@expo/vector-icons";
import { shareAsync } from "expo-sharing";
import { compressBackup, decompressBackup } from "../libraries/Compress";

import PillsView from "../components/PillsView";
import Pill from "../components/Pill";
import chalk from "chalk";
import logo from "../assets/images/icon.png";
import css from "../styles/global.js";

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
  const insets = useSafeAreaInsets();

  const [topics, setTopics] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const randomIndex = (categories) => {
    return Math.floor(Math.random() * categories.length);
  };

  const dumpAndSave = async () => {
    setModalVisible(!modalVisible);
  };

  const shareDB = async () => {
    const dbPath = await ctx.dumpDB();

    show(dbPath);

    const compressedPath = await compressBackup(dbPath);
    //await shareAsync(compressedPath);
  };

  useAsyncEffect(async () => {
    let queryResult = [];
    let searchSuggestions = [];

    if (ctx.status.action === "search") {
      try {
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

  useAsyncEffect(async () => {
    if (Object.keys(ctx.db).length) {
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

      //alert(JSON.stringify(orderedInterests));

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

        console.log(await ctx.dumpDB(ctx.db));
      }
    }
  }, [ctx.db]);

  return (
    <>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: "10%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top,
          paddingHorizontal: 10,
          backgroundColor: "white",
        }}
      >
        <Image source={logo} style={{ width: 50, height: 50 }} />

        <TouchableOpacity onPress={dumpAndSave}>
          <FontAwesome6 style={{ color: "#242424cc" }} name="share" size={30} />
        </TouchableOpacity>
      </View>
      <PillsView>{topics}</PillsView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={css.modalCenteredView}>
          <View
            style={{
              height: "85%",
              width: "95%",
              backgroundColor: "white",
              borderRadius: 20,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              padding: 20,
              alignItems: "left",
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontFamily: "Corben_400Regular",
                  fontSize: 20,
                  lineHeight: 30,
                  textAlign: "center",
                  color: "#4d769f",
                }}
              >
                Export your data to another device
              </Text>
            </View>

            <View
              style={{
                gap: 20,
                flexDirection: "column",
              }}
            >
              <Text
                style={{
                  fontFamily: "Corben_400Regular",
                  fontSize: 18,
                  lineHeight: 30,
                  textAlign: "left",
                  color: "#4d769f",
                }}
              >
                A backup of all your progress will be saved to your device:
              </Text>
              <TouchableOpacity
                style={{
                  borderRadius: 15,
                  elevation: 1,
                  backgroundColor: "#b147ff99",
                  paddingHorizontal: 15,
                  paddingVertical: 7,
                }}
                onPress={async () => await shareDB()}
              >
                <Text
                  style={{
                    fontFamily: "Corben_400Regular",
                    fontSize: 20,
                    color: "white",
                    textAlign: "center",
                  }}
                >
                  Download
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
