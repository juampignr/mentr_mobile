import css from "../styles/global.js";
import {
  StyleSheet,
  TextInput,
  Text,
  View,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRef, useEffect, useContext, useState } from "react";
import { Context } from "../app/_layout.js";

export default function SearchBar({ children, onType }) {
  const ctx = useContext(Context);
  const [verticalOffset, setVerticalOffset] = useState(-30);
  const placeholder =
    ctx.discipleLanguage === "es"
      ? "¿Qué te interesa hoy?"
      : "What's your interest?";

  useEffect(() => {
    const hideKeyboard = Keyboard.addListener("keyboardDidHide", () => {
      console.log("Hiding keyboard");
      setVerticalOffset(-30);
    });
    const showKeyboard = Keyboard.addListener("keyboardDidShow", () => {
      console.log("Showing keyboard");
      setVerticalOffset(-50);
    });

    return () => {
      hideKeyboard.remove();
      showKeyboard.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={css.searchBarContainer}
      contentContainerStyle={css.searchBar}
      behavior={"position"}
      keyboardVerticalOffset={verticalOffset}
    >
      <TextInput
        style={css.searchBarInput}
        onChangeText={onType}
        placeholder={placeholder}
        placeholderTextColor="ghostwhite"
        textAlign="center"
      />
    </KeyboardAvoidingView>
  );
}

//const styles = StyleSheet.create({ ...css });
