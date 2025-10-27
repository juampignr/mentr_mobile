import { useContext, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../app/_layout.js";
import { Link } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import katex from "katex";
import css from "../styles/global.js";
import show from "../libraries/show";
import RNWiki from "../libraries/RNWiki";

export default function Section({ children }) {
  const ctx = useContext(Context);

  const newTemplate = (content) => `
    <body style="margin-top: 40px; padding: 0; border: 0; background: transparent; font-family: 'Corben', serif; font-weight: 400; font-style: normal; font-size: 45px; text-align: left; color: #334f6a; line-height: 1.25">
      <p id="content" style='margin: 0; padding: 0;'>
          ${content}
      </p>
    </body>
    `;

  const sectionTitle = useRef(children?.title);
  const sectionSubtitle = useRef(children?.subtitle);
  const sectionContent = useRef(children?.content.trimEnd("\n"));
  const modalContent = useRef(null);
  const modalLink = useRef(null);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [visibility, setVisibility] = useState(css.visible);
  const [iconToggle, setIconToggle] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const [sectionHeight, setSectionHeight] = useState(100);

  let webViewScript = `
        document.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: "linkClicked",
                url: this.href,
              }),
            );
          });
        });

        setTimeout(() => {

          const paragraph = document.querySelector('#content');

          const rect = paragraph.getBoundingClientRect();
          const height = Math.round(rect.height / 2);

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "setHeight",
            height: height,
          }));

        }, 300);
  `;

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

        <WebView
          style={{ height: sectionHeight }}
          source={{
            html: newTemplate(sectionContent.current),
          }}
          originWhitelist={["*"]}
          onMessage={async (event) => {
            let parsedMessage;
            try {
              parsedMessage = JSON.parse(event.nativeEvent.data);
            } catch (error) {
              //Best effort here
            }

            if (parsedMessage?.type === "setHeight") {
              setSectionHeight(parsedMessage?.height);
            } else if (parsedMessage?.type === "linkClicked") {
              alert("Link clicked");
              const wiki = new RNWiki(ctx.discipleLanguage);

              try {
                const page = await wiki.getJsonPage(parsedMessage?.url);

                modalContent.current =
                  Object.values(page)[0].summary.slice(0, 300) + "...";
                setModalVisible(true);

                modalLink.current = parsedMessage?.url;
              } catch (error) {
                alert(error);
              }
            }
          }}
          injectedJavaScript={webViewScript}
        />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={css.modalCenteredView}>
          <View style={css.modalView}>
            <Text style={css.modalSummary}>{modalContent.current}</Text>
            <TouchableOpacity
              style={[css.modalButton, { marginTop: 20 }]}
              onPress={() => setModalVisible(false)}
            >
              <Link
                href={`/medium/${encodeURIComponent(ctx.topic)}:${encodeURIComponent(modalLink.current)}`}
                asChild
              >
                <Text style={css.modalButtonText}>
                  {ctx.discipleName === "en" ? "More" : "Ver Más"}
                </Text>
              </Link>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
