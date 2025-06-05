import { View, ScrollView, StyleSheet } from "react-native";
import { createContext, useEffect, useState, useRef } from "react";
import { useFonts, Corben_400Regular } from "@expo-google-fonts/corben";
import { Slot } from "expo-router";
//import wiki from "wikipedia"
import css from "../styles/global.js";
import SearchBar from "../components/SearchBar";

export const Context = createContext();

export default function Layout() {
  const styles = StyleSheet.create({ ...css });

  let [fontsLoaded] = useFonts({
    Corben_400Regular,
  });

  const [chain, setChain] = useState({});
  const [status, setStatus] = useState(JSON.stringify({ action: "loading" }));
  const [search, setSearch] = useState("");
  const timeoutId = useRef(0);

  if (!fontsLoaded) return null;

  const typeHandler = (change) => {
    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      setStatus({ action: "search", value: change });
    }, 2000);
  };

  return (
    <Context.Provider
      value={{
        chain: chain,
        setChain: setChain,
        status: status,
        setStatus: setStatus,
        search: search,
        setSearch: setSearch,
        styles: styles,
      }}
    >
      <View style={css.body}>
        <Slot />
      </View>
      <SearchBar onType={typeHandler} />
    </Context.Provider>
  );
}
