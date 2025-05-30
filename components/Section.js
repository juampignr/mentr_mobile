import { useContext, useState, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../app/_layout.js";
import { Link } from "expo-router";
import css from "../styles/global.js";
import { FontAwesome6 } from "@expo/vector-icons";

export default function Section({ children }) {
  const sectionTitle = useRef(children?.title);
  const sectionContent = useRef(children?.content);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [visibility, setVisibility] = useState({ display: "none" });

  useAsyncEffect(async () => {
    if (!isCollapsed) {
      setVisibility({ display: "block" });
    }
  }, [isCollapsed]);

  return (
    <TouchableOpacity onPress={() => setIsCollapsed(!isCollapsed)}>
      <View style={css.section}>
        <Text style={css.sectionTitle}>{sectionTitle.current}</Text>
        <FontAwesome6 style={css.sectionIcon} name="chevron-up" size={25} />
      </View>
      <View style={{ ...isVisible, ...css.sectionContent }}></View>
    </TouchableOpacity>
  );
}
