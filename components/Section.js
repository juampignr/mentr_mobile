import { useContext, useState } from "react";
import { View, Text } from "react-native";
import { useAsyncEffect } from "@react-hook/async";
import { Context } from "../app/_layout.js";
import { Link } from "expo-router";
import css from "../styles/global.js";
import { FontAwesome6 } from "@expo/vector-icons";

export default function Section({ children }) {
  console.log(children);

  return (
    <View style={css.section}>
      <Text style={css.sectionTitle}>{children}</Text>
      <FontAwesome6 style={css.sectionIcon} name="chevron-up" size={25} />
    </View>
  );
}
