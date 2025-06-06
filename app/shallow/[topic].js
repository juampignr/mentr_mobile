import { useContext, useState, useRef, useEffect } from "react";
import { FlatList, View } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../_layout.js";
import { useLocalSearchParams } from "expo-router";
import css from "../../styles/global.js";
import Card from "../../components/Card";
import PillsView from "../../components/PillsView";
import Pill from "../../components/Pill";
import PagerView from "react-native-pager-view";
import chalk from "chalk";
import AntDesign from "@expo/vector-icons/AntDesign";
import Spinner from "../../components/Spinner";

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

export default function Shallow() {
  const ctx = useContext(Context);

  const timeoutId = useRef(0);
  const pageLimit = useRef(10);

  const [pageNumber, setPageNumber] = useState(-1);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [swipeableView, setSwipeableView] = useState([]);

  const { topic } = useLocalSearchParams();

  const searchTopic = async (topic) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(topic)}&gsrlimit=200&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
    const response = await fetch(url);

    const data = await response.json();

    let pages = Object.values(data.query.pages).filter((page) => page.extract);

    pages = pages.filter((page) => page.extract);

    const formattedData = pages.map((page) => ({
      id: page.pageid.toString(),
      title: page.title,
      summary: page.extract,
    }));

    return formattedData;
  };

  const populateCards = async (page = topic, pageno = 0) => {
    setPageNumber(pageno);

    const topicURL = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(related[pageno]?.title)}&format=json&origin=*`;
    const topicResponse = await fetch(topicURL);

    let topicData = await topicResponse.json();
    topicData = Object.values(topicData.query.pages)[0];

    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(related[pageno]?.title)}&gsrlimit=200&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
    const response = await fetch(url);

    const data = await response.json();

    let pages = Object.values(data.query.pages).filter((page) => page.extract);

    pages = pages.filter((page) => page.extract);

    let formattedData = pages.map((page) => ({
      id: page.pageid.toString(),
      title: page.title,
      summary: page.extract,
    }));

    return [
      {
        id: topicData.pageid,
        title: topicData.title,
        summary: topicData.extract,
      },
      ...formattedData,
    ];
  };

  const onSwipe = async (event) => {
    show(`Swiped onto ${event.nativeEvent.position}`);

    const viewPosition = event.nativeEvent.position;

    const cardsData = await populateCards(
      related[viewPosition + 1]?.title,
      viewPosition + 1,
    );

    setSwipeableView([
      ...swipeableView,
      <View>
        <FlatList
          data={cardsData}
          contentContainerStyle={{ alignItems: "center" }}
          onEndReached={paginationHandler}
          renderItem={(item) => <Card>{item}</Card>}
          keyExtractor={(item) => item.id}
        />
      </View>,
    ]);
  };

  const paginationHandler = (event) => {
    //show(event);
  };

  useAsyncEffect(async () => {
    if (topic) {
      const topicURL = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(topic)}&format=json&origin=*`;
      const topicResponse = await fetch(topicURL);

      let topicData = await topicResponse.json();
      topicData = Object.values(topicData.query.pages)[0];

      const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(topic)}&gsrlimit=200&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
      const response = await fetch(url);

      setIsLoading(false);

      const data = await response.json();

      let pages = Object.values(data.query.pages).filter(
        (page) => page.extract,
      );

      pages = pages.filter((page) => page.extract);

      let formattedData = pages.map((page) => ({
        id: page.pageid.toString(),
        title: page.title,
        summary: page.extract,
      }));

      let allData = [
        {
          id: topicData.pageid.toString(),
          title: topicData.title,
          summary: topicData.extract,
        },
        ...formattedData,
      ];

      setSwipeableView([
        <View>
          <FlatList
            data={allData}
            contentContainerStyle={{ alignItems: "center" }}
            onEndReached={paginationHandler}
            renderItem={(item) => <Card>{item}</Card>}
            keyExtractor={(item) => item.id}
          />
        </View>,
      ]);

      setRelated(allData);
    }
  }, []);

  return (
    (isLoading && <Spinner />) || (
      <PagerView
        style={css.swipeableView}
        initialPage={0}
        onPageSelected={onSwipe}
        overdrag={true}
      >
        {swipeableView.map((view, index) => (
          <View key={index} nativeID={`page-${index}`}>
            {view}
          </View>
        ))}
      </PagerView>
    )
  );
}
