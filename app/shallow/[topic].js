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
  const currentPosition = useRef(1);
  const currentFlatList = useRef();

  const [related, setRelated] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  const [cardsMatrix, setCardsMatrix] = useState({});

  const [pageNumber, setPageNumber] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState(false);

  const [swipeableView, setSwipeableView] = useState([]);
  const [paginate, setPaginate] = useState(0);
  const [momentum, setMomentum] = useState(0);
  const [cardsMatrixLimits, setCardsMatrixLimits] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [topics, setTopics] = useState([]);

  const { topic } = useLocalSearchParams();

  ctx.setTopic(topic);

  const searchTopic = async (topic) => {
    const url = `https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(topic)}&gsrlimit=200&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
      },
    });

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
    if (currentPosition.current >= pageno) {
      show("Going backwards, not populating");
      return;
    }
    */

    scopedRelated = cardsMatrix["0"].slice(1);

    const topicURL = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${scopedRelated[pageno + 1]?.title}&format=json&origin=*`;
    const topicResponse = await fetch(topicURL, {
      headers: {
        "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
      },
    });

    let topicData = await topicResponse.json();
    topicData = Object.values(topicData.query.pages)[0];

    const url = `https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(scopedRelated[pageno + 1]?.title)}&gsrlimit=200&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
      },
    });

    const data = await response.json();

    let pages = Object.values(data.query.pages).filter((page) => page.extract);

    pages = pages.filter((page) => page.extract);

    let formattedData = pages.map((page) => ({
      id: page.pageid.toString(),
      title: page.title,
      summary: page.extract,
    }));

    if (data?.continue) {
      const newCardsMatrixLimits = cardsMatrixLimits;

      newCardsMatrixLimits[currentPosition.current] =
        data?.continue?.excontinue;
      setCardsMatrixLimits(newCardsMatrixLimits);
    }

    setCardsMatrix((oldMatrix) => ({
      ...oldMatrix,
      [pageno]: [
        {
          id: topicData.pageid,
          title: topicData.title,
          summary: topicData.extract,
        },
        ...formattedData,
      ],
    }));

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
    setPageNumber(pageno + 1);
  };

  const onSwipe = async (event) => {
    let viewPosition = event.nativeEvent.position + 1;

    await populateCards(currentPosition.current);

    currentPosition.current = currentPosition.current + 1;
  };

  const paginationHandler = async (event) => {
    setPaginate(1);
  };

  const initialize = async () => {
    const topicURL = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(topic)}&format=json&origin=*`;
    const topicResponse = await fetch(topicURL, {
      headers: {
        "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
      },
    });

    let topicData = await topicResponse.json();
    topicData = Object.values(topicData.query.pages)[0];

    const url = `https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(topic)}&gsrlimit=200&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
      },
    });

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
      const newCardsMatrixLimits = cardsMatrixLimits;

      newCardsMatrixLimits["0"] = data?.continue?.excontinue;
      setCardsMatrixLimits(newCardsMatrixLimits);
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
        chain = '${topic}'
      ORDER BY spent DESC
      `,
    );

    let combinedAllData = [];

    show(allInterests);
    for (const interest of allInterests.reverse()) {
      const interestURL = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&exsentences=3&titles=${encodeURIComponent(interest?.name)}&format=json&origin=*`;
      const response = await fetch(interestURL, {
        headers: {
          "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
        },
      });

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

    setCardsMatrix({ 0: combinedAllData });
    currentPosition.current = 1;
  };

  useAsyncEffect(initialize, []);

  useAsyncEffect(async () => {
    let viewsArray = [];

    const newView = Object.entries(cardsMatrix).map(([key, cards]) => (
      <View key={key}>
        <FlatList
          data={cards}
          contentContainerStyle={{ alignItems: "center" }}
          onEndReached={paginationHandler}
          onMomentumScrollBegin={() => setMomentum(1)}
          onMomentumScrollEnd={() => setMomentum(0)}
          renderItem={(item) => <Card firstTopic={topic}>{item}</Card>}
          keyExtractor={(item, index) => `${item.id}${index}`}
        />
      </View>
    ));
    setSwipeableView(newView);
  }, [cardsMatrix]);

  useAsyncEffect(async () => {
    if (paginate && !momentum) {
      let updatedCards = cardsMatrix["" + currentPosition.current - 2];

      const updatedSwipeableView = swipeableView;

      const url = `https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(updatedCards[0]?.title)}&gsrlimit=200&excontinue=${cardsMatrixLimits[currentPosition.current - 1]}&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mentr/0.9.0", // required by Wikipedia API
        },
      });

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
          [currentPosition.current - 2]: data?.continue?.excontinue,
        });
      }

      updatedCards = [...updatedCards, ...formattedData];

      setCardsMatrix({
        ...cardsMatrix,
        [`${currentPosition.current - 2}`]: updatedCards,
      });

      /*
      updatedSwipeableView[currentPosition.current - 2] = (
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
      */
      setPaginate(0);
    }
  }, [paginate, momentum]);

  useAsyncEffect(async () => {
    let queryResult = [];
    let searchSuggestions = [];

    if (ctx.status === "loading") {
      setIsLoading(true);
      setLoadingText(ctx.loadingText);
    } else {
      setIsLoading(false);
    }

    if (ctx.status === "mentoring") {
      setLoadingText("Showing the way...");
      let allInterests = [];
      for (const key in ctx.interestChain) {
        allInterests.push({
          id: key,
          title: ctx.interestChain[key].title,
          summary: ctx.interestChain[key].summary,
        });
      }
      setCardsMatrix({ 0: allInterests });
      currentPosition.current = 1;
      setIsLoading(false);
    }

    if (ctx.status?.action === "search") {
      console.log("Spotted search from shallow!");
      console.log(ctx?.status?.value);

      try {
        setIsSearching(true);

        const response = await fetch(
          `https://es.wikipedia.org/w/api.php?action=opensearch&search=${ctx.status?.value}&limit=30&namespace=0&format=json&origin=*`,
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
        console.error("Error fetching data from Wikipedia:", error);
      }

      for (const topic of queryResult) {
        searchSuggestions.push(<Pill>{topic}</Pill>);
      }

      setTopics(searchSuggestions);
    }
  }, [ctx.status]);

  return (
    (isLoading && <Spinner text={ctx.loadingText} />) ||
    (isSearching && <PillsView>{topics}</PillsView>) || (
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
