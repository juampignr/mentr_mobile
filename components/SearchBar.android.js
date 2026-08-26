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
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function SearchBar({ children, onType }) {
  const ctx = useContext(Context);

  const [verticalOffset, setVerticalOffset] = useState(-30);
  const [placeholder, setPlaceholder] = useState("What's your interest?");

  const placeholderByLanguage = useRef({ en: "What's your interest?", es: "¿Qué te interesa hoy?" })

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const hideKeyboard = Keyboard.addListener("keyboardDidHide", () => {
      setVerticalOffset(-30);
    });
    const showKeyboard = Keyboard.addListener("keyboardDidShow", () => {
      setVerticalOffset(-50);
    });

    return () => {
      hideKeyboard.remove();
      showKeyboard.remove();
    };
  }, []);

  useEffect(() => {
    setPlaceholder(
      placeholderByLanguage.current[ctx.discipleLanguage] ??
        placeholderByLanguage.current.en,
    );
  }, [ctx.discipleLanguage])
  return (
    <KeyboardAvoidingView
      style={[css.searchBarContainer, { marginBottom: insets.bottom }]}
      contentContainerStyle={css.searchBar}
      behavior={"position"}
      keyboardVerticalOffset={verticalOffset}
    >

      <TextInput
        key={placeholder}
        style={css.searchBarInput}
        onChangeText={onType}
        placeholder={placeholder}
        placeholderTextColor="ghostwhite"
        textAlign="center"
      />
    </KeyboardAvoidingView>
  );
}
