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

  const [pageNumber, setPageNumber] = useState(0);
  const [related, setRelated] = useState([]);
  const [swipeableView, setSwipeableView] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  const [nextCardsData, setNextCardsData] = useState([]);

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

  /*
  const populateCards = async (page = topic) => {
    const topicURL = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(page)}&format=json&origin=*`;
    const topicResponse = await fetch(topicURL);

    let topicData = await topicResponse.json();
    topicData = Object.values(topicData.query.pages)[0];

    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(page)}&gsrlimit=200&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
    const response = await fetch(url);

    const data = await response.json();

    let pages = Object.values(data.query.pages).filter((page) => page.extract);

    pages = pages.filter((page) => page.extract);

    const formattedData = pages.map((page) => ({
      id: page.pageid.toString(),
      title: page.title,
      summary: page.extract,
    }));

    if (page !== topic) {
      setPagesMatrix((matrix) => [
        ...matrix,
        [
          {
            id: topicData.pageid,
            title: topicData.title,
            summary: topicData.extract,
          },
          ...formattedData,
        ],
      ]);

      show(pagesMatrix);

      setSwipeableView([
        ...swipeableView,
        <View>
          <FlatList
            data={[
              {
                id: topicData.pageid,
                title: topicData.title,
                summary: topicData.extract,
              },
              ...formattedData,
            ]}
            contentContainerStyle={{ alignItems: "center" }}
            //onEndReached={paginationHandler}
            renderItem={(item) => <Card>{item}</Card>}
            keyExtractor={(item) => item.id}
          />
        </View>,
      ]);
    } else {
      setPagesMatrix([
        [
          {
            id: topicData.pageid,
            title: topicData.title,
            summary: topicData.extract,
          },
          ...formattedData,
        ],
      ]);

      setSwipeableView([
        <View>
          <FlatList
            data={[
              {
                id: topicData.pageid,
                title: topicData.title,
                summary: topicData.extract,
              },
              ...formattedData,
            ]}
            contentContainerStyle={{ alignItems: "center" }}
            //onEndReached={paginationHandler}
            renderItem={(item) => <Card>{item}</Card>}
            keyExtractor={(item) => item.id}
          />
        </View>,
      ]);

      setRelated([
        {
          id: topicData.pageid,
          title: topicData.title,
          summary: topicData.extract,
        },
        ...formattedData,
      ]);
    }
  };
  */

  const populateCards = async (page = topic, pageno = 0) => {
    show(pageno);
    const topicURL = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(page)}&format=json&origin=*`;
    const topicResponse = await fetch(topicURL);

    let topicData = await topicResponse.json();
    topicData = Object.values(topicData.query.pages)[0];

    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(page)}&gsrlimit=200&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
    const response = await fetch(url);

    const data = await response.json();

    let pages = Object.values(data.query.pages).filter((page) => page.extract);

    pages = pages.filter((page) => page.extract);

    const formattedData = pages.map((page) => ({
      id: page.pageid.toString(),
      title: page.title,
      summary: page.extract,
    }));

    setCardsData([
      {
        id: topicData.pageid,
        title: topicData.title,
        summary: topicData.extract,
      },
      ...formattedData,
    ]);

    setPageNumber(pageno);
    /*
      if (page != topic) {
        setPageNumber(pageno);

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
      } else {
        setPageNumber(0);

        setSwipeableView([
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

        setRelated([
          {
            id: topicData.pageid,
            title: topicData.title,
            summary: topicData.extract,
          },
          ...formattedData,
        ]);
      }
      */
  };

  const onSwipe = async (event) => {
    show("Swiped!");
    const viewPosition = event.nativeEvent.position;

    if (!viewPosition) {
      await populateCards(related[0]?.title, 0);
    } else {
      await populateCards(related[viewPosition]?.title, viewPosition);
      await populateCards(related[viewPosition + 1]?.title, viewPosition + 1);
    }
  };

  const paginationHandler = (event) => {
    show(event);
  };

  useAsyncEffect(async () => {
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

    setRelated(formattedData);

    await populateCards();
  }, []);

  useEffect(() => {
    if (pageNumber > 0) {
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
    } else {
      setSwipeableView([
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
    }
  }, [cardsData]);

  useAsyncEffect(async () => {
    show(related[1]?.title);
    await populateCards(related[1]?.title, 1);
  }, [related]);

  /*
  useAsyncEffect(async () => {
    if (ctx.status.action === "search") {
      clearTimeout(timeoutId.current);

      timeoutId.current = setTimeout(() => {
        updateRelated(ctx.status.value).catch((error) => console.log(error));
      }, 2000);
    }
  }, [ctx.status]);
  */

  return (
    <PagerView
      style={css.swipeableView}
      initialPage={0}
      onPageSelected={onSwipe}
      overdrag={true}
    >
      {swipeableView}
    </PagerView>
  );
}
