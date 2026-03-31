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
import { File } from "expo-file-system";

import PillsView from "../components/PillsView";
import Pill from "../components/Pill";
import chalk from "chalk";
import logo from "../assets/images/icon.png";
import css from "../styles/global.js";
import { openDatabaseAsync } from "expo-sqlite";

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
  const [dumpLocation, setDumpLocation] = useState(false);
  const [downloadTitle, setDownloadTitle] = useState(
    "Export your data to another device",
  );
  const [downloadExplanation, setDownloadExplanation] = useState(
    "A backup of all your progress will be saved to your device:",
  );

  const randomIndex = (categories) => {
    return Math.floor(Math.random() * categories.length);
  };

  const dumpAndSave = async () => {
    setDownloadTitle("Export your data to another device");
    setDownloadExplanation(
      "A backup of all your progress will be saved to your device:",
    );
    setModalVisible(!modalVisible);
  };

  const loadAndSave = async () => {
    setDownloadTitle("Import your data from another device");
    setDownloadExplanation(
      "Select a backup file from your device to restore your progress:",
    );
    setModalVisible(!modalVisible);
  };

  const exportDB = async () => {
    const dbPath = await ctx.dumpDB();

    const compressedPath = await compressBackup(dbPath);

    setDumpLocation(compressedPath);
    //await shareAsync(compressedPath);
  };

  const importDB = async () => {
    await ctx.db.closeAsync();

    const decompressedPath = await decompressBackup();
    const dbFile = new File(decompressedPath);

    const oldDbPath = new File(`file://${ctx.db.databasePath}`);

    oldDbPath.delete();
    dbFile.move(oldDbPath);

    ctx.setDB(await openDatabaseAsync("mentr.db"));
    //await ctx.db.openAsync(dbFile.uri);
  };

  useAsyncEffect(async () => {
    let queryResult = [];
    let searchSuggestions = [];

    if (ctx.status.action === "search") {
      try {
        const data = await ctx.wikiFetch(ctx.status?.value, {
          action: "opensearch",
          search: ctx.status?.value,
          namespace: "0",
        });

        queryResult = data[1]; // The second element contains the list of suggestions

        if (queryResult.length <= 10) {
          const extraData = await ctx.wikiFetch(queryResult[1], {
            action: "opensearch",
            search: queryResult[1],
            namespace: "0",
          });

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
        <TouchableOpacity onPress={loadAndSave} style={{ alignSelf: "right" }}>
          <FontAwesome6
            style={{ color: "#242424cc" }}
            name="upload"
            size={30}
          />
        </TouchableOpacity>

        <Image source={logo} style={{ width: 50, height: 50 }} />

        <TouchableOpacity onPress={dumpAndSave}>
          <FontAwesome6
            style={{ color: "#242424cc" }}
            name="download"
            size={30}
          />
        </TouchableOpacity>
      </View>
      <PillsView>{topics}</PillsView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setDumpLocation(false);
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
                {downloadTitle}
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
                {downloadExplanation}
              </Text>
              <TouchableOpacity
                style={{
                  borderRadius: 15,
                  elevation: 1,
                  backgroundColor: "#b147ff",
                  paddingHorizontal: 15,
                  paddingVertical: 7,
                }}
                onPress={async () =>
                  downloadTitle.includes("Export")
                    ? await exportDB()
                    : await importDB()
                }
              >
                <Text
                  style={{
                    fontFamily: "Corben_400Regular",
                    fontSize: 20,
                    color: "white",
                    textAlign: "center",
                  }}
                >
                  Let's go!
                </Text>
              </TouchableOpacity>
              {dumpLocation && (
                <Text
                  style={{
                    fontFamily: "Corben_400Regular",
                    fontSize: 18,
                    color: "#ffa020",
                  }}
                >
                  Yay! your progress has been setup...
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
