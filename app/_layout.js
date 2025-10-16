import { View, ScrollView, StyleSheet } from "react-native";
import { createContext, useEffect, useState, useRef } from "react";
import { useAsyncEffect } from "@react-hook/async";
import { useFonts, Corben_400Regular } from "@expo-google-fonts/corben";
import { Slot } from "expo-router";
import { getLocales } from "expo-localization";
//import wiki from "wikipedia"
import css from "../styles/global.js";
import SearchBar from "../components/SearchBar";
import * as SQLite from "expo-sqlite";

export const Context = createContext();

export default function Layout() {
  const timeoutId = useRef(0);
  const db = useRef({});

  const [chain, setChain] = useState({});
  const [status, setStatus] = useState(JSON.stringify({ action: "loading" }));
  const [search, setSearch] = useState("");
  const [loadingText, setLoadingText] = useState(false);

  const [topic, setTopic] = useState("");
  const [disciple, setDisciple] = useState("juampi.gnr@gmail.com");
  const [discipleLanguage, setDiscipleLanguage] = useState("en");

  const [interestChain, setInterestChain] = useState({});

  const clickedSections = useRef(new Set());
  const allSections = useRef(1);

  const typeHandler = (change) => {
    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      setStatus({ action: "search", value: change });
    }, 2000);
  };

  useAsyncEffect(async () => {
    const locales = getLocales();
    let firstLocale;

    if (Array.isArray(locales) && locales.length) {
      firstLocale = getLocales()[0];
      if (firstLocale.languageCode.length <= 3) {
        firstLocale = firstLocale.languageCode;
      } else {
        firstLocale = "en";
      }
    }

    db.current = await SQLite.openDatabaseAsync("mentr.db");

    //await db.current.execAsync(`DROP TABLE IF EXISTS interest`);
    //await db.current.execAsync(`DROP TABLE IF EXISTS disciple`);

    await db.current.execAsync(
      `
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS disciple (
        email VARCHAR(100) PRIMARY KEY,
        language VARCHAR(3) DEFAULT 'en',
        fullname VARCHAR(100) DEFAULT NULL,
        dk VARCHAR(255) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS interest (
        id VARCHAR(64) PRIMARY KEY,
        disciple_email VARCHAR(100) NOT NULL,
        name VARCHAR(64) NOT NULL,
        spent INT NOT NULL DEFAULT 0,
        chain VARCHAR(64) NOT NULL,
        FOREIGN KEY (disciple_email) REFERENCES disciple(email)
      );

      CREATE TABLE IF NOT EXISTS mentor (
        id VARCHAR(64) PRIMARY KEY,
        disciple_email VARCHAR(100) NOT NULL,
        chain_id VARCHAR(64) NOT NULL,
        name VARCHAR(64) NOT NULL,
        spent INT NOT NULL DEFAULT 0,
        FOREIGN KEY (disciple_email) REFERENCES disciple(email)
        FOREIGN KEY (chain_id) REFERENCES chain(id)

      );
    `,
    );

    const result = await db.current.runAsync(
      `INSERT OR IGNORE INTO disciple VALUES ('juampi.gnr@gmail.com','${firstLocale}','Juan Pablo Behler','pbkdf2_sha256$100000$');`,
    );

    const firstRow = await db.current.getFirstAsync("SELECT * FROM disciple");

    console.log(firstRow);

    setDiscipleLanguage(firstRow.language);

    return () => {
      if (db.current) {
        db.current.close();
      }
    };
  }, []);

  let [fontsLoaded, error] = useFonts({
    Corben_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <Context.Provider
      value={{
        db: db.current,
        chain: chain,
        setChain: setChain,
        status: status,
        setStatus: setStatus,
        search: search,
        setSearch: setSearch,
        topic: topic,
        setTopic: setTopic,
        disciple: disciple,
        discipleLanguage: discipleLanguage,
        setDisciple: setDisciple,
        interestChain: interestChain,
        setInterestChain: setInterestChain,
        clickedSections: clickedSections,
        allSections: allSections,
        loadingText: loadingText,
        setLoadingText: setLoadingText,
      }}
    >
      <View style={css.body}>
        <Slot />
      </View>
      <SearchBar onType={typeHandler} />
    </Context.Provider>
  );
}
