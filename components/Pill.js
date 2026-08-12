import css from "../styles/global.js";
import { TouchableOpacity, Text } from "react-native";
import { useContext } from "react";
import { Link } from "expo-router";
import { Context } from "../app/_layout";

export default function Pill({ children }) {
  const ctx = useContext(Context);

  const rawTopic = typeof children === "string" ? children : "";

  const topic =
    rawTopic.length > 20
      ? `${rawTopic.replace(/_/g, " ").substr(0, 20)}...`
      : rawTopic.replace(/_/g, " ");

  return (
    <Link href={`/shallow/${encodeURI(rawTopic)}`} asChild>
      <TouchableOpacity
        style={css.pill}
        onPress={() => ctx.setStatus("loading")}
      >
        <Text style={css.pillText}>{topic}</Text>
      </TouchableOpacity>
    </Link>
  );
}
