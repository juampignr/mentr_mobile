import React, { useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { Image } from "expo-image";
import css from "../styles/global.js";
import AntDesign from "react-native-vector-icons/AntDesign";
import spinnerImage from "../assets/spinner.webp";

export default function Spinner({
  size = 60,
  color = "#b147ff99",
  text = false,
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  /*
  <Animated.View style={animatedStyle}>
  <AntDesign name="loading" size={size} color={color} />
  </Animated.View>
  */

  return (
    <View style={styles.container}>
      <Animated.View style={[animatedStyle, { width: "20%", height: "20%" }]}>
        <Image
          style={{
            width: "100%",
            height: "100%",
          }}
          source={spinnerImage}
          contentFit="contain"
        />
      </Animated.View>
      {text && <Text style={css.loadingTitle}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
