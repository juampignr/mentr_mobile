import {
  useContext,
  useState,
  useRef,
  useEffect,
  memo,
  useCallback,
} from "react";
import { FlatList, View, Alert, BackHandler } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../_layout.js";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { show, warn, debug } from "../../libraries/show";
import css from "../../styles/global.js";
import Card from "../../components/Card";
import PillsView from "../../components/PillsView";
import Pill from "../../components/Pill";
import PagerView from "react-native-pager-view";
import chalk from "chalk";
import AntDesign from "@expo/vector-icons/AntDesign";
import Spinner from "../../components/Spinner";

export default function Shallow() {
  const ctx = useContext(Context);

  const timeoutId = useRef(0);
  const pageLimit = useRef(10);
  const firstLoad = useRef(true);
  const currentPosition = useRef(1);
  const currentFlatList = useRef();
  const hasMentored = useRef(0);
  const lastMatrix = useRef({});

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

  ctx?.setTopic(topic);

  const populateCards = async (pageno) => {
    let scopedRelated = [];

    if(Object.keys(cardsMatrix).length) {
      scopedRelated = cardsMatrix["0"];

      let topicData = await ctx.wikiFetch(scopedRelated[pageno]?.title, {
        action: "query",
        prop: "extracts|categories",
        exintro: true,
        explaintext: true,
        exsentences: 3,
        titles: scopedRelated[pageno]?.title,
      });

      let topicCategories =
        Object.values(topicData.query.pages)[0]?.categories ?? [];

      topicCategories = topicCategories.filter((category) => {
        const categoryNoise = [
          /\bstub/i,
          /^Category:All /i,
          /^Category:Articles (with|containing|needing)/i,
          /^Category:Pages (with|using)/i,
          /^Category:Wikipedia /i,
          /^Category:CS1 /i,
          /^Category:Short description/i,
          /^Category:Commons category/i,
          /^Category:Use (mdy|dmy) dates/i,
        ];
        return !categoryNoise.some((re) => re.test(category?.title));
      });

      let categoryData = await ctx.wikiFetch(topicCategories[0]?.title, {
        action: "query",
        generator: "categorymembers",
        gcmtitle: topicCategories[0]?.title, // g prefix
        gcmnamespace: "0", // g prefix
        gcmlimit: "50", // g prefix
        prop: "extracts",
        exintro: true,
        explaintext: true,
        exsentences: 3,
      });

      categoryData = categoryData?.query?.pages;

      let linksData = await ctx.wikiFetch(scopedRelated[pageno]?.title, {
        action: "query",
        generator: "links",
        titles: scopedRelated[pageno]?.title,
        gplnamespace: "0",
        gpllimit: "50",
        prop: "extracts",
        exintro: true,
        explaintext: true,
        exsentences: 3,
      });

      linksData = linksData?.query?.pages;

      let linksHereData = await ctx.wikiFetch(scopedRelated[pageno]?.title, {
        action: "query",
        generator: "linkshere",
        titles: scopedRelated[pageno]?.title,
        gplnamespace: "0",
        gpllimit: "50",
        prop: "extracts",
        exintro: true,
        explaintext: true,
        exsentences: 3,
      });

      linksHereData = linksHereData?.query?.pages;

      let data = new Map([
        ...Object.entries(categoryData),
        ...Object.entries(linksData),
        ...Object.entries(linksHereData),
      ]);

      data = Object.fromEntries(data);
      data = Object.values(data);
      /*
      const data = await ctx.wikiFetch(scopedRelated[pageno]?.title, {
        action: "query",
        generator: "search",
        gsrsearch: scopedRelated[pageno]?.title,
        gsrlimit: 50,
        prop: "extracts",
        exintro: true,
        explaintext: true,
        exsentences: 3,
      });
      */

      let pages = data.filter((page) => page.extract);

      let formattedData = pages.map((page) => ({
        id: page.pageid.toString(),
        title: page?.title,
        summary: page.extract?.trim(),
      }));

      /*
      if (data?.continue) {
        const newCardsMatrixLimits = cardsMatrixLimits;

        newCardsMatrixLimits[currentPosition.current] =
          data?.continue?.excontinue;
        setCardsMatrixLimits(newCardsMatrixLimits);
      }
      */

      topicData = Object.values(topicData.query.pages)[0];
      setCardsMatrix((oldMatrix) => ({
        ...oldMatrix,
        [pageno]: [
          {
            id: topicData.pageid,
            title: topicData.title,
            summary: topicData.extract.trim(),
          },
          ...formattedData,
        ],
      }));

      setPageNumber(pageno + 1);
    }
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

    let topicBody = await ctx.wikiFetch(topic, {
      action: "query",
      prop: "extracts",
      exintro: true,
      explaintext: true,
      exsentences: 3,
      titles: topic,
    });

    topicBody = Object.values(topicBody.query.pages)[0];

    let topicCategoriesData = await ctx.wikiFetch(topic, {
      action: "query",
      prop: "categories",
      titles: topic,
    });

    let topicCategories =
      Object.values(topicCategoriesData.query.pages)[0]?.categories ?? [];

    topicCategories = topicCategories.filter((category) => {
      const categoryNoise = [
        /\bstub/i,
        /^Category:All /i,
        /^Category:Articles (with|containing|needing)/i,
        /^Category:Pages (with|using)/i,
        /^Category:Wikipedia /i,
        /^Category:CS1 /i,
        /^Category:Short description/i,
        /^Category:Commons category/i,
        /^Category:Use (mdy|dmy) dates/i,
      ];
      return !categoryNoise.some((re) => re.test(category?.title));
    });

    let topicCategoryMembers;

    if (topicCategories[0]?.title) {
      topicCategoryMembers = await ctx.wikiFetch(topicCategories[0]?.title, {
        action: "query",
        generator: "categorymembers",
        gcmtitle: topicCategories[0]?.title, // g prefix
        gcmnamespace: "0", // g prefix
        gcmlimit: "100", // g prefix
        prop: "extracts",
        exintro: true,
        explaintext: true,
        exsentences: 3,
      });
    }

    let pages = Object.values(topicCategoryMembers?.query.pages).filter((page) => page.extract);

    if (pages.length === 0) {

      let linksData = await ctx.wikiFetch(topic, {
        action: "query",
        generator: "links",
        titles: topic,
        gplnamespace: "0",
        gpllimit: "50",
        prop: "extracts",
        exintro: true,
        explaintext: true,
        exsentences: 3,
      });

      let linksHereData = await ctx.wikiFetch(topic, {
        action: "query",
        generator: "linkshere",
        titles: topic,
        gplnamespace: "0",
        gpllimit: "50",
        prop: "extracts",
        exintro: true,
        explaintext: true,
        exsentences: 3,
      });

      pages = Object.values({ ...linksData.query.pages, ...linksHereData.query.pages }).filter((page) => page.extract);

      if (pages.length === 0)
        pages = [topicBody]
    }

    let allData = {};

    for (const page of pages) {
      allData[page?.pageid.toString()] = {
        title: page?.title,
        summary: page?.extract,
      };
    }

    if (topicBody?.extract)
      allData = { [topicBody?.pageid.toString()]: { title: topicBody?.title, summary: topicBody?.extract }, ...allData };

    /*
    if (data?.continue) {
      const newCardsMatrixLimits = cardsMatrixLimits;

      newCardsMatrixLimits["0"] = data?.continue?.excontinue;
      setCardsMatrixLimits(newCardsMatrixLimits);
    }
    */
    setRelated(allData);
    setIsLoading(false);

    let allInterests = [];

    try {
      allInterests = await ctx.db.getAllAsync(
        `SELECT name
        FROM
          interest
        WHERE
          chain = '${topic}'
        ORDER BY spent DESC
        `,
      );
    } catch (error) {
      console.log("Error fetching interests:");
      // Do something later here
    }

    let combinedAllData = [];

    if (allInterests.length === 0 && topicBody?.pageid) {
      combinedAllData.push({
        id: topicBody.pageid.toString(),
        title: topicBody.title,
        summary: topicBody.extract,
      });

      delete allData[topicBody.pageid.toString()];
    }

    for (const interest of allInterests) {
      const interestResult = await ctx.wikiFetch(interest?.name, {
        action: "query",
        prop: "extracts",
        exintro: true,
        explaintext: true,
        exsentences: 3,
        titles: interest?.name,
      });

      let interestData = Object.values(interestResult?.query?.pages ?? {})[0];

      if (interestData?.extract) {
        if (allData[interestData?.pageid.toString()]) {
          delete allData[interestData?.pageid.toString()];
        }

        combinedAllData.push({
          id: interestData?.pageid.toString(),
          title: interestData?.title,
          summary: interestData?.extract.trim(),
        });
      }
    }

    for (const key in allData) {
      combinedAllData.push(allData[key]);
    }

    setCardsMatrix({ 0: combinedAllData });
    currentPosition.current = 1;
  };

  const initializeMentoring = () => {
    let allInterests = [];
    for (const key in ctx.interestChain) {
      allInterests.push({
        id: key,
        title: ctx.interestChain[key].title,
        summary: ctx.interestChain[key].summary,
      });
    }

    ctx.hasMentored.current = 1;

    ctx.setLastMatrix(cardsMatrix);
    setCardsMatrix({ 0: allInterests });
    currentPosition.current = 1;
    //setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (ctx.hasMentored.current === 1) {
          setCardsMatrix(ctx.lastMatrix);
          ctx.hasMentored.current = 0;
          return true;
        }
        return false;
      };

      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => sub.remove();
    }, []),
  );

  useAsyncEffect(async () => {
    if (!ctx.hasMentored.current) {
      await initialize();
    } else {
      initializeMentoring();
    }
  }, []);

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
          renderItem={(item) => (
            <Card firstTopic={topic} isMentoring={ctx.hasMentored.current}>
              {item}
            </Card>
          )}
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

      const data = await ctx.wikiFetch(updatedCards[0]?.title, {
        action: "query",
        generator: "search",
        gsrsearch: updatedCards[0]?.title,
        gsrlimit: 100,
        excontinue: cardsMatrixLimits[currentPosition.current - 1],
        prop: "extracts",
        exintro: true,
        explaintext: true,
        exsentences: 3,
      });

      let pages = Object.values(data.query.pages).filter(
        (page) => page.extract,
      );

      let formattedData = pages.map((page) => ({
        id: page.pageid.toString(),
        title: page.title,
        summary: page.extract.trim(),
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
      setLoadingText(false);
    }

    if (ctx.status === "mentoring") {
      ctx.setStatus("loading");
      ctx.setLoadingText("Showing the way...");

      initializeMentoring();

      setTimeout(() => {
        ctx.setStatus("");
        ctx.setLoadingText(false);
      }, 3000);
    }

    if (ctx.status?.action === "search") {
      try {
        setIsSearching(true);

        const data = await ctx.wikiFetch(ctx.status?.value, {
          action: "opensearch",
          search: ctx.status?.value,
          namespace: "0",
        });

        queryResult = data[1]; // The second element contains the list of suggestions
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
