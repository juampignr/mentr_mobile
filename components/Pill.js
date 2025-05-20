import css from "../styles/global.js";
import { TouchableOpacity, Text } from "react-native";
import { Link } from "expo-router";

export default function Pill({ children }) {
  const rawTopic = typeof children === "string" ? children : "";

  const topic =
    rawTopic.length > 20
      ? `${rawTopic.replace(/_/g, " ").substr(0, 20)}...`
      : rawTopic.replace(/_/g, " ");

  return (
    <Link href={`/shallow/${encodeURI(rawTopic)}`} asChild>
      <TouchableOpacity style={css.pill}>
        <Text style={css.pillText}>{topic}</Text>
      </TouchableOpacity>
    </Link>
  );
}
