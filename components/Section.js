import { useContext, useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../app/_layout.js";
import { Link } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import katex from "katex";
import css from "../styles/global.js";

export default function Section({ children }) {
  const ctx = useContext(Context);

  const newTemplate = (content) => `
  <body style="margin: 0; padding: 0; border: 0">
    <p id="content" style='font-family:\"Corben\", serif; font-weight:400; font-style:normal; font-size:40px; text-align: left; color: #334f6a; margin: 0; padding: 0'>
        ${content}
    </p>
  </body>
  `;

  const sectionTitle = useRef(children?.title);
  const sectionSubtitle = useRef(children?.subtitle);
  const sectionContent = useRef(children?.content.trimStart());

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [visibility, setVisibility] = useState(css.visible);
  const [iconToggle, setIconToggle] = useState(0);

  const [sectionHeight, setSectionHeight] = useState(100);

  let webViewScript = `
        setTimeout(() => {

          const paragraph = document.querySelector('#content');

          const rect = paragraph.getBoundingClientRect();
          const height = Math.round(rect.height / 2);

          window.ReactNativeWebView.postMessage(""+height);
        }, 300);
  `;

  console.log(newTemplate(sectionContent.current.trim()));
  useAsyncEffect(async () => {
    if (isCollapsed) {
      setIconToggle(0);
      setVisibility(css.invisible);
    } else {
      setIconToggle(1);

      setVisibility(css.visible);
      ctx.clickedSections.current.add(sectionTitle.current);
    }
  }, [isCollapsed]);

  return (
    <>
      <TouchableOpacity onPress={() => setIsCollapsed(!isCollapsed)}>
        <View style={css.section}>
          <Text style={css.sectionTitle}>{sectionTitle.current}</Text>
          {iconToggle === 0 ? (
            <FontAwesome6
              style={css.sectionIcon}
              name="chevron-down"
              size={25}
            />
          ) : (
            <FontAwesome6 style={css.sectionIcon} name="chevron-up" size={25} />
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ ...visibility }}
        onLongPress={() => setIsCollapsed(!isCollapsed)}
      >
        {sectionSubtitle.current && (
          <Text style={css.sectionSubtitle}>• {sectionSubtitle.current}</Text>
        )}
      </TouchableOpacity>
      <WebView
        style={{ height: sectionHeight, ...visibility }}
        source={{
          html: newTemplate(sectionContent.current),
        }}
        originWhitelist={["*"]}
        onMessage={(event) => {
          alert(event?.nativeEvent?.data);
          setSectionHeight(parseInt(event.nativeEvent.data));
        }}
        injectedJavaScript={webViewScript}
      />
    </>
  );
}
