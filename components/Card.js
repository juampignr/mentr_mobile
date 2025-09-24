import css from "../styles/global.js";
import { useContext, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../app/_layout.js";
import { Link } from "expo-router";
import Mentor from "../libraries/mentor";

export default function Card({ children, firstTopic }) {
  const ctx = useContext(Context);

  const [topic, setTopic] = useState(children?.item);

  const pressHandler = (db = None) => {
    const gandalf = new Mentor(firstTopic, ctx.db, ctx.disciple);

    gandalf.go();
  };

  return (
    <View style={css.card}>
      <Link
        href={`/medium/${encodeURI(firstTopic)}:${encodeURI(topic?.title)}`}
        asChild
      >
        <Text style={css.cardTitle}>{topic?.title}</Text>
      </Link>

      <Link
        href={`/medium/${encodeURI(firstTopic)}:${encodeURI(topic?.title)}`}
        asChild
      >
        <Pressable onLongPress={() => pressHandler()} delayLongPress={1000}>
          <Text style={css.cardSummary}>{topic?.summary}</Text>
        </Pressable>
      </Link>
    </View>
  );
}
