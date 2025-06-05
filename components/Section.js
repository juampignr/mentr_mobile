import { useContext, useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../app/_layout.js";
import { Link } from "expo-router";
import css from "../styles/global.js";
import { FontAwesome6 } from "@expo/vector-icons";

export default function Section({ children }) {
  const ctx = useContext(Context);

  const sectionTitle = useRef(children?.title);
  const sectionSubtitle = useRef(children?.subtitle);
  const sectionContent = useRef(children?.content.trimStart());

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [visibility, setVisibility] = useState(css.visible);

  useAsyncEffect(async () => {
    if (isCollapsed) {
      setVisibility(css.invisible);
    } else {
      setVisibility(css.visible);
    }
  }, [isCollapsed]);

  return (
    <>
      <TouchableOpacity onPress={() => setIsCollapsed(!isCollapsed)}>
        <View style={css.section}>
          <Text style={css.sectionTitle}>{sectionTitle.current}</Text>
          <FontAwesome6 style={css.sectionIcon} name="chevron-up" size={25} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ ...visibility }}
        onLongPress={() => setIsCollapsed(!isCollapsed)}
      >
        {sectionSubtitle.current && (
          <Text style={css.sectionSubtitle}>• {sectionSubtitle.current}</Text>
        )}
        <Text style={css.sectionContent}>{sectionContent.current}</Text>
      </TouchableOpacity>
    </>
  );
}
