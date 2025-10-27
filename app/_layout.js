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

  const [chain, setChain] = useState({});
  const [status, setStatus] = useState(JSON.stringify({ action: "loading" }));
  const [search, setSearch] = useState("");
  const [loadingText, setLoadingText] = useState(false);

  const [topic, setTopic] = useState("");
  const [disciple, setDisciple] = useState("juampi.gnr@gmail.com");
  const [discipleLanguage, setDiscipleLanguage] = useState("en");

  const [interestChain, setInterestChain] = useState({});
  const [db, setDB] = useState({});

  const clickedSections = useRef(new Set());
  const allSections = useRef(1);

  const typeHandler = (change) => {
    clearTimeout(timeoutId.current);
    setStatus("loading");
    timeoutId.current = setTimeout(() => {
      setStatus({ action: "search", value: change });
    }, 2000);
  };

  useAsyncEffect(async () => {
    const dbInstance = await SQLite.openDatabaseAsync("mentr.db");

    await dbInstance.execAsync(
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

    const dbLanguage = await dbInstance.getFirstAsync(
      `select language from disciple where email = 'juampi.gnr@gmail.com'`,
    );

    let firstLocale;

    if (dbLanguage?.language) {
      console.log("Found language:", dbLanguage.language);
      firstLocale = dbLanguage.language;
    } else {
      const locales = getLocales();

      if (Array.isArray(locales) && locales.length) {
        firstLocale = getLocales()[0];
        alert(JSON.stringify(firstLocale));

        if (firstLocale.languageCode.length <= 3) {
          firstLocale = firstLocale.languageCode;
        } else {
          firstLocale = "en";
        }
      }

      console.log("No language found, locale:", firstLocale);
    }

    //await db.current.execAsync(`DROP TABLE IF EXISTS interest`);
    //await db.current.execAsync(`DROP TABLE IF EXISTS disciple`);

    alert(
      `INSERT OR IGNORE INTO disciple VALUES ('juampi.gnr@gmail.com','${firstLocale}','Juan Pablo Behler','pbkdf2_sha256$100000$');`,
    );
    await dbInstance.runAsync(
      `INSERT OR IGNORE INTO disciple VALUES ('juampi.gnr@gmail.com','${firstLocale}','Juan Pablo Behler','pbkdf2_sha256$100000$');`,
    );

    setDB(dbInstance);
    setDiscipleLanguage(firstLocale);

    return () => {
      if (dbInstance) {
        dbInstance.close();
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
        db: db,
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
