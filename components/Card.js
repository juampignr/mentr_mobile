import css from "../styles/global.js";
import { useContext, useState } from "react";
import { View, Text } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../app/_layout.js";
import { Link } from "expo-router";

export default function Card({ children }) {
  const ctx = useContext(Context);

  const [topic, setTopic] = useState(children?.item);

  return (
    <View style={css.card}>
      <Link href={`/medium/${encodeURI(topic?.title)}`} asChild>
        <Text style={css.cardTitle}>{topic?.title}</Text>
      </Link>
      <Link href={`/medium/${encodeURI(topic?.title)}`} asChild>
        <Text style={css.cardSummary}>{topic?.summary}</Text>
      </Link>
    </View>
  );
}
