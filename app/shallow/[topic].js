import { useContext, useState, useRef, useEffect, memo } from "react";
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
import { all } from "axios";

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
  const firstLoad = useRef(true);
  const currentPosition = useRef(-1);
  const currentFlatList = useRef();

  const [related, setRelated] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  const [cardsMatrix, setCardsMatrix] = useState({});

  const [pageNumber, setPageNumber] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [swipeableView, setSwipeableView] = useState([]);
  const [paginate, setPaginate] = useState(0);
  const [momentum, setMomentum] = useState(0);
  const [cardsMatrixLimits, setCardsMatrixLimits] = useState({});

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

  const populateCards = async (pageno) => {
    let scopedRelated = [];

    /*
    if (swipeableView[pageno]) {
      show("Page already set");
      return;
    }
    */

    if (pageno === 0 && related.length) {
      pageno = 1;
    }

    if (pageno < pageNumber) {
      return;
    }

    scopedRelated = cardsMatrix["0"];

    setPageNumber(pageno);

    const topicURL = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${scopedRelated[pageno + 1]?.title}&format=json&origin=*`;
    const topicResponse = await fetch(topicURL);

    let topicData = await topicResponse.json();
    topicData = Object.values(topicData.query.pages)[0];

    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(scopedRelated[pageno + 1]?.title)}&gsrlimit=200&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
    const response = await fetch(url);

    const data = await response.json();

    let pages = Object.values(data.query.pages).filter((page) => page.extract);

    pages = pages.filter((page) => page.extract);

    let formattedData = pages.map((page) => ({
      id: page.pageid.toString(),
      title: page.title,
      summary: page.extract,
    }));

    if (data?.continue) {
      setCardsMatrixLimits({
        ...cardsMatrixLimits,
        [currentPosition.current - 1]: data?.continue?.excontinue,
      });
    }

    setCardsMatrix(
      (oldMatrix) =>
        (oldMatrix = {
          ...oldMatrix,
          [pageno]: [
            {
              id: topicData.pageid,
              title: topicData.title,
              summary: topicData.extract,
            },
            ...formattedData,
          ],
        }),
    );
    /*
    if (formattedData[0]?.title !== scopedRelated[pageno]?.title) {
      setCardsMatrix(
        (oldMatrix) =>
          (oldMatrix = {
            ...oldMatrix,
            [pageno]: [
              {
                id: topicData.pageid,
                title: topicData.title,
                summary: topicData.extract,
              },
              ...formattedData,
            ],
          }),
      );
    } else {
      setCardsMatrix(
        (oldMatrix) => (oldMatrix = { ...oldMatrix, [pageno]: formattedData }),
      );
    }
    */
  };

  const onSwipe = async (event) => {
    let viewPosition = event.nativeEvent.position;

    currentPosition.current = viewPosition;
    await populateCards(viewPosition);
  };

  const paginationHandler = async (event) => {
    setPaginate(1);
  };

  useAsyncEffect(async () => {
    const topicURL = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(topic)}&format=json&origin=*`;
    const topicResponse = await fetch(topicURL);

    let topicData = await topicResponse.json();
    topicData = Object.values(topicData.query.pages)[0];

    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(topic)}&gsrlimit=200&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
    const response = await fetch(url);

    const data = await response.json();

    let pages = Object.values(data.query.pages).filter((page) => page.extract);

    pages = pages.filter((page) => page.extract);

    let formattedData = {};
    for (const page of pages) {
      formattedData[page.pageid.toString()] = {
        title: page.title,
        summary: page.extract,
      };
    }

    if (data?.continue) {
      setCardsMatrixLimits({
        ...cardsMatrixLimits,
        [currentPosition.current - 1]: data?.continue?.excontinue,
      });
    }

    setRelated(formattedData);
    setIsLoading(false);

    /*
    let allData = [
      {
        id: topicData.pageid.toString(),
        title: topicData.title,
        summary: topicData.extract,
      },
      ...formattedData,
    ];
    */

    let allData = {
      [topicData.pageid.toString()]: {
        title: topicData.title,
        summary: topicData.extract,
      },
      ...formattedData,
    };

    const allInterests = await ctx.db.getAllAsync(
      `SELECT name
      FROM
        interest
      WHERE
        chain = '${encodeURIComponent(topic)}'
      ORDER BY spent DESC
      `,
    );

    let combinedAllData = [];

    for (const interest of allInterests.reverse()) {
      const interestURL = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(interest?.name)}&format=json&origin=*`;
      const response = await fetch(interestURL);

      let interestData = await response?.json();
      interestData = Object.values(interestData.query.pages)[0];

      if (allData[interestData.pageid.toString()]) {
        delete allData[interestData.pageid.toString()];
      }

      combinedAllData = [
        {
          id: interestData.pageid.toString(),
          title: interestData.title,
          summary: interestData.extract,
        },
        ...combinedAllData,
      ];
    }

    for (const key in allData) {
      combinedAllData.push({
        id: key,
        title: allData[key].title,
        summary: allData[key].summary,
      });
    }

    setPageNumber(0);
    setCardsMatrix({ 0: combinedAllData });
  }, []);

  useAsyncEffect(async () => {
    let viewsArray = [];

    for (const key in cardsMatrix) {
      setSwipeableView([
        ...swipeableView,
        <View>
          <FlatList
            //ref={currentFlatList}
            data={cardsMatrix[key]}
            contentContainerStyle={{ alignItems: "center" }}
            onEndReached={paginationHandler}
            onMomentumScrollBegin={() => setMomentum(1)}
            onMomentumScrollEnd={() => setMomentum(0)}
            renderItem={(item) => <Card firstTopic={topic}>{item}</Card>}
            keyExtractor={(item) => item.id}
          />
        </View>,
      ]);
    }
  }, [cardsMatrix]);

  useAsyncEffect(async () => {
    show(`Paginate ${paginate}, momentum ${momentum}`);
    if (paginate && !momentum) {
      show(cardsMatrix);
      let updatedCards =
        currentPosition.current === -1
          ? cardsMatrix["-1"]
          : cardsMatrix["" + (currentPosition.current - 1)];

      show(updatedCards);
      const updatedSwipeableView = swipeableView;

      const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(updatedCards[0]?.title)}&gsrlimit=200&excontinue=${cardsMatrixLimits[currentPosition.current - 1]}&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
      show(url);
      const response = await fetch(url);

      const data = await response.json();

      let pages = Object.values(data.query.pages).filter(
        (page) => page.extract,
      );

      let formattedData = pages.map((page) => ({
        id: page.pageid.toString(),
        title: page.title,
        summary: page.extract,
      }));

      if (data?.continue) {
        setCardsMatrixLimits({
          ...cardsMatrixLimits,
          [currentPosition.current - 1]: data?.continue?.excontinue,
        });
      }

      updatedCards = [...updatedCards, ...formattedData];

      updatedSwipeableView[currentPosition.current] = (
        <View>
          <FlatList
            data={updatedCards}
            contentContainerStyle={{ alignItems: "center" }}
            onEndReached={paginationHandler}
            onMomentumScrollBegin={() => setMomentum(1)}
            onMomentumScrollEnd={() => setMomentum(0)}
            renderItem={(item) => <Card firstTopic={topic}>{item}</Card>}
            keyExtractor={(item) => item.id}
          />
        </View>
      );

      setSwipeableView(updatedSwipeableView);
      setPaginate(0);
    }
  }, [paginate, momentum]);

  return (
    (isLoading && <Spinner />) || (
      <PagerView
        style={css.swipeableView}
        initialPage={0}
        onPageSelected={onSwipe}
        overdrag={true}
      >
        {swipeableView}
      </PagerView>
    )
  );
}
