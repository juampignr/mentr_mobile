import css from "../styles/global.js";
import { useContext, useState, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../app/_layout.js";
import { Link } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

import Mentor from "../libraries/mentor";

export default function Card({ children, firstTopic, isMentoring }) {
  const ctx = useContext(Context);

  const [topic, setTopic] = useState(children?.item);

  const [cardStyle, setCardStyle] = useState(
    isMentoring ? { ...css.card, borderColor: "#ffa020aa" } : css.card,
  );

  const [cardTitleStyle, setCardTitleStyle] = useState(
    isMentoring ? css.cardTitlePlus : css.cardTitle,
  );

  const scaleAnim = useSharedValue(1);
  const colorProgress = useSharedValue(0);
  const radiusLeftProgress = useSharedValue(0);
  const radiusRightProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scaleY: withTiming(scaleAnim.value, {
            duration: 300,
            easing: Easing.out(Easing.quad),
          }),
        },
        {
          scaleX: withTiming(scaleAnim.value, {
            duration: 300,
            easing: Easing.out(Easing.quad),
          }),
        },
      ],
      borderTopLeftRadius: withTiming(radiusLeftProgress.value, {
        duration: 300,
      }),

      borderTopRightRadius: withTiming(radiusRightProgress.value, {
        duration: 300,
      }),
      borderColor: interpolateColor(
        colorProgress.value,
        [0, 1],
        [cardStyle.borderColor, "#ffa020aa"],
      ),
    };
  });

  const pressHandler = async () => {
    scaleAnim.value = scaleAnim.value === 1 ? 1.025 : 1;
    colorProgress.value = colorProgress.value === 0 ? 1 : 0;
    radiusLeftProgress.value = radiusLeftProgress.value === 0 ? 20 : 0;
    radiusRightProgress.value = radiusRightProgress.value === 0 ? 20 : 0;

    setCardTitleStyle(css.cardTitlePlus);

    console.log(
      `Calling mentor method with firstTopic: ${firstTopic}, db: ${ctx.db}, disciple: ${ctx.disciple}, discipleLanguage: ${ctx.discipleLanguage}`,
    );

    const gandalf = new Mentor(
      firstTopic,
      ctx.db,
      ctx.disciple,
      ctx.discipleLanguage,
    );

    const result = await gandalf.go();

    ctx.setInterestChain(result);

    ctx.setStatus("mentoring");
  };

  return (
    <Animated.View style={[cardStyle, animatedStyle]}>
      <Link
        href={`/medium/${encodeURI(firstTopic)}:${encodeURI(topic?.title)}`}
        asChild
      >
        <Text style={cardTitleStyle}>{topic?.title}</Text>
      </Link>

      <Link
        href={`/medium/${encodeURI(firstTopic)}:${encodeURI(topic?.title)}`}
        asChild
      >
        <Pressable
          onLongPress={() => !isMentoring && pressHandler()}
          delayLongPress={1000}
        >
          <Text style={css.cardSummary}>{topic?.summary}</Text>
        </Pressable>
      </Link>
    </Animated.View>
  );
}
