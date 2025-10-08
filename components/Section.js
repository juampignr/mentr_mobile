import { useContext, useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../app/_layout.js";
import { Link } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import css from "../styles/global.js";

export default function Section({ children }) {
  const ctx = useContext(Context);

  const template = (content) => `
  <html>
    <head>
      <meta charset="utf-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Corben:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
          renderMathInElement(document.body, {
            delimiters: [
              {left: "$$", right: "$$", display: true},
              {left: "$", right: "$", display: false}
            ]
          });
        });
      </script>
      <style>
        body {
          font-family: -apple-system, Roboto, sans-serif;
          padding: 8px;
          color: #fff;
          background-color: transparent;
        }
	  .corben-regular {
		font-family: "Corben", serif;
		font-weight: 400; font-style: normal;
	  }
	  .corben-bold {
	  font-family: "Corben", serif;
	  font-weight: 700;
	  font-style: normal;
	  }
      </style>
    </head>
    <body>${content}</body>
  </html>`;

  const templateOneLiner = (content) =>
    '<html><head><meta charset="utf-8"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Corben:wght@400;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script><script>document.addEventListener("DOMContentLoaded",function(){renderMathInElement(document.body,{delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}]});});</script><style>body{font-family:-apple-system, Roboto, sans-serif;padding:8px;color:#fff;background-color:transparent}.corben-regular{font-family:"Corben", serif;font-weight:400;font-style:normal}.corben-bold{font-family:"Corben", serif;font-weight:700;font-style:normal}</style></head><body>' +
    content +
    "</body></html>";

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
      ctx.clickedSections.current.add(sectionTitle.current);
    }
  }, [isCollapsed]);

  //<Text style={css.sectionContent}>{sectionContent.current}</Text>
  console.log(templateOneLiner(sectionContent.current));
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
      </TouchableOpacity>
      <WebView
        originWhitelist={["*"]}
        source={{
          html: templateOneLiner(sectionContent.current).replace(/\n*/g, " "),
        }}
        style={{ height: 100 }} // always give some initial height
      />
    </>
  );
}
