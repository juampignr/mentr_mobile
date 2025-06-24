import { View, ScrollView, StyleSheet } from "react-native";
import { createContext, useEffect, useState, useRef } from "react";
import { useAsyncEffect } from "@react-hook/async";
import { useFonts, Corben_400Regular } from "@expo-google-fonts/corben";
import { Slot } from "expo-router";
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

  const typeHandler = (change) => {
    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      setStatus({ action: "search", value: change });
    }, 2000);
  };

  useAsyncEffect(async () => {
    db.current = await SQLite.openDatabaseAsync("mentr.db");

    await db.current.execAsync(
      `
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS disciple (
        email VARCHAR(100) PRIMARY KEY,
        fullname VARCHAR(100) DEFAULT NULL,
        dk VARCHAR(255) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS interest (
        id VARCHAR(64) PRIMARY KEY,
        disciple_id VARCHAR(32) NOT NULL,
        name VARCHAR(64) NOT NULL,
        spent INT NOT NULL DEFAULT 0,
        chain VARCHAR(64) NOT NULL,
        FOREIGN KEY (disciple_id) REFERENCES disciple(id)
      );
    `,
    );

    const insertRes = await db.current.runAsync(
      "INSERT INTO disciple values ('juampi.gnr@gmail.com','Juan Pablo Behler','pbkdf2_sha256$100000$');",
    );
    console.log(insertRes.lastInsertRowId, insertRes.changes);
    const firstRow = await db.current.getFirstAsync("SELECT * FROM disciple");
    console.log(firstRow);

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
      }}
    >
      <View style={css.body}>
        <Slot />
      </View>
      <SearchBar onType={typeHandler} />
    </Context.Provider>
  );
}
