import { useContext, useState, useRef } from "react";
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

  const [related, setRelated] = useState([new Map()]);

  const { topic } = useLocalSearchParams();

  console.log(topic);

  useAsyncEffect(async () => {
    let response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&srwhat=text&srlimit=10&srprop=snippet&format=json&origin=*`,
    );
    const data = await response.json();
    for (const r of data.query.search) {
      show(r);
    }
    //similarPages.forEach((element) => {
    //  setRelated([...related, new Map([[element?.pageid, element?.title]])]);
    //});
  }, []);
}
/*
export default function Shallow() {
  const ctx = useContext(Context);

  const timeoutId = useRef(0);
  const pageLimit = useRef(10);

  const [related, setRelated] = useState([new Map()]);

  const { topic } = useLocalSearchParams();

  console.log(topic);

  const updateRelated = async (topic, paginate = false, index = 0) => {
    if (paginate) pageLimit.current += 10;

    let suggestions = await ctx.wiki.search(topic, {
      suggestion: true,
      limit: pageLimit.current,
    });

    suggestions = suggestions?.results;

    const flatListData = [];

    if (paginate) {
      suggestions = suggestions?.slice(pageLimit.current - 10);

      for (const page of suggestions) {
        const id = page?.pageid ?? 0;
        const title = page?.title ?? "";

        addRelated(index, id, title);
      }
    } else {
      if (related[index].size <= 1) {
        for (const page of suggestions) {
          const id = page?.pageid ?? 0;
          const title = page?.title ?? "";

          addRelated(index, id, title);
        }
      }
    }
  };

  const paginationHandler = (event) => {
    updateRelated(topic, true, 0).catch((error) => console.log(error));
  };

  const swipeHandler = (event) => {
    const swipedTo = event?.nativeEvent?.position;

    console.log(related[swipedTo][0]);
    updateRelated(related[swipedTo][0], false, swipedTo).then((res) =>
      console.log(related),
    );
  };

  const addRelated = (index, key, value) => {
    setRelated((lastObjectOfMaps) => {
      if (lastObjectOfMaps.length - 1 < index) lastObjectOfMaps.push(new Map());

      lastObjectOfMaps[index].set(key, value);

      return lastObjectOfMaps;
    });
  };

  useAsyncEffect(async () => {
    if (ctx.status.action === "search") {
      clearTimeout(timeoutId.current);

      timeoutId.current = setTimeout(() => {
        updateRelated(ctx.status.value).catch((error) => console.log(error));
      }, 2000);
    }
  }, [ctx.status]);

  useAsyncEffect(async () => {
    await updateRelated(topic);

    let similarPages = await (
      await ctx.wiki.page(topic)
    ).related({ redirect: true });
    similarPages = similarPages?.pages ?? [];

    similarPages.forEach((element) => {
      setRelated([...related, new Map([[element?.pageid, element?.title]])]);
    });
    console.log(related);
  }, []);

  return (
    <PagerView
      style={css.swipeableView}
      initialPage={0}
      onPageSelected={swipeHandler}
    >
      <View>
        <FlatList
          data={Array.from(related[0].values())}
          contentContainerStyle={{ alignItems: "center" }}
          onEndReached={paginationHandler}
          renderItem={({ item }) => <Card>{item}</Card>}
        />
      </View>
      {related.map((element) => {
        <View>
          <FlatList
            data={Array.from(element.values())}
            contentContainerStyle={{ alignItems: "center" }}
            onEndReached={paginationHandler}
            renderItem={({ item }) => <Card>{item}</Card>}
          />
        </View>;
      })}
    </PagerView>
  );
}
*/
