import css from "../styles/global.js";
import {
  StyleSheet,
  TextInput,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRef, useEffect, useContext } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Context } from "../app/_layout.js";

export default function SearchBar({ children, onType }) {
  const ctx = useContext(Context);
  const ref = useRef(null);
  const insets = useSafeAreaInsets();

  /*
  const onSubmit = () => {
    ctx.setStatus({ action: "submitSearch" });
  };
  */
  let timeout = null;

  return (
    <KeyboardAvoidingView
      style={[styles.searchBarContainer]}
      contentContainerStyle={styles.searchBar}
      behavior={"position"}
      keyboardVerticalOffset={-30}
    >
      <TextInput
        style={styles.searchBarInput}
        onChangeText={onType}
        placeholder="Qué te interesa hoy?"
        placeholderTextColor="ghostwhite"
        textAlign="center"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ ...css });
