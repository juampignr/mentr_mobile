import { View, ScrollView, StyleSheet,TouchableOpacity, Text } from "react-native";
import { createContext, useEffect, useState, useRef } from "react";
import { useAsyncEffect } from "@react-hook/async";
import { useFonts, Corben_400Regular } from "@expo-google-fonts/corben";
import { Slot } from "expo-router";
import { getLocales } from "expo-localization";
import { File, Paths, Directory } from "expo-file-system";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import css from "../styles/global.js";
import SearchBar from "../components/SearchBar";
import * as SQLite from "expo-sqlite";
import * as Sentry from '@sentry/react-native';
import Onboarding from 'react-native-onboarding-swiper';
import onboardingStepOne from "../assets/images/onboardingStepOne.png";
import onboardingStepTwo from "../assets/images/onboardingStepTwo.png";
import onboardingStepThree from "../assets/images/onboardingStepThree.png";
import onboardingStepFour from "../assets/images/onboardingStepFour.png";
import onboardingStepOneSpa from "../assets/images/onboardingStepOneSpa.png";
import onboardingStepTwoSpa from "../assets/images/onboardingStepTwoSpa.png";
import onboardingStepThreeSpa from "../assets/images/onboardingStepThreeSpa.png";
import onboardingStepFourSpa from "../assets/images/onboardingStepFourSpa.png";
import searchImage from "../assets/images/1-search.png";

Sentry.init({
  dsn: 'https://b8ba7db798f1262aeab871ba1b102afb@o4511911001980928.ingest.us.sentry.io/4511911009517568',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
      Sentry.feedbackIntegration({
        // Additional SDK configuration goes in here, for example:
        styles: {
          submitButton: {
            backgroundColor: "#6a1b9a",
          },
        },
        namePlaceholder: "Fullname",

      }),
    ],
  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export const Context = createContext();

export default Sentry.wrap(function Layout() {
  const timeoutId = useRef(0);

  const [chain, setChain] = useState({});
  const [status, setStatus] = useState(JSON.stringify({ action: "loading" }));
  const [search, setSearch] = useState("");
  const [loadingText, setLoadingText] = useState(false);

  const [topic, setTopic] = useState("");
  const [disciple, setDisciple] = useState("juampi.gnr@gmail.com");
  const [discipleLanguage, setDiscipleLanguage] = useState("en");
  const [buttonsText, setButtonsText] = useState({ en: { next: "Next", done: "Done", skip: "Skip" }, es: { next: "Siguiente", done: "Listo", skip: "Saltar" } });

  const [interestChain, setInterestChain] = useState({});
  const [lastMatrix, setLastMatrix] = useState({});

  const [db, setDB] = useState({});
  const [wiki, setWiki] = useState({});

  const [isOnboarding, setIsOnboarding] = useState(false);


  const hasMentored = useRef(0);
  const clickedSections = useRef(new Set());
  const allSections = useRef(1);

  const timeSemaphore = useRef(false);

  const insets = useSafeAreaInsets();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const typeHandler = (change) => {
    clearTimeout(timeoutId.current);
    setStatus("loading");
    timeoutId.current = setTimeout(() => {
      if (change.length) {
        setLastMatrix({});
        setInterestChain({});
        hasMentored.current = 0;
        setStatus({ action: "search", value: change });
      }
    }, 2000);
  };

  const dumpDB = async function () {
    const backupDir = new Directory(Paths.cache, "mentr_backup");

    backupDir.create({ idempotent: true, intermediates: true });

    const sourceDb = db ? db : await SQLite.openDatabaseAsync("mentr.db");
    const destDb = await SQLite.openDatabaseAsync(
      "mentr-backup.db",
      {},
      backupDir.uri,
    );

    await SQLite.backupDatabaseAsync({
      sourceDatabase: sourceDb,
      sourceDatabaseName: "main",
      destDatabase: destDb,
      destDatabaseName: "main",
    });

    return destDb.databasePath;
  };

  const wikiFetch = async (searchTerm, params = null, attempt = 0) => {
    while (timeSemaphore.current) {
      await sleep(300);
    }

    timeSemaphore.current = true;
    const result = await _wikiFetch(searchTerm, params, attempt);
    timeSemaphore.current = false;
    return result;
  };

  const _wikiFetch = async function (searchTerm, params = null, attempt = 0) {
    const maxRetries = 3;

    try {
      const url = new URL(
        `https://${discipleLanguage}.wikipedia.org/w/api.php?format=json&origin=*`,
      );

      if (!params) {
        url.searchParams.set("action", "query");
        url.searchParams.set("generator", "search");
        url.searchParams.set("gsrsearch", encodeURIComponent(searchTerm));
        url.searchParams.set("gsrlimit", "50");
        url.searchParams.set("prop", "extracts");
        url.searchParams.set("exintro", "true");
        url.searchParams.set("explaintext", "true");
        url.searchParams.set("exsentences", "3");
        url.searchParams.set("maxlag", "5");
        console.log(url.toString());
      } else {
        const safeParams =
          params && typeof params === "object" && !Array.isArray(params)
            ? params
            : {};

        for (const [key, value] of Object.entries(safeParams)) {
          url.searchParams.set(key, String(value));
        }

        if (!url.searchParams.has("maxlag")) {
          url.searchParams.set("maxlag", "5");
        }
      }

      console.log(url.toString());
      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Mentr/1.0.0",
        },
      });

      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          `Invalid JSON response, please tune your request: HTTP ${response.status}`,
        );
      }

      if (!response.ok) {
        const retryAfter = response.headers.get("retry-after");
        const err = new Error(`HTTP error ${response.status}`);
        err.status = response.status;
        err.retryAfter = retryAfter ? Number(retryAfter) : null;
        throw err;
      }

      if (data?.error) {
        const err = new Error(
          `Wiki API error: ${data.error.code} - ${data.error.info}`,
        );
        err.code = data.error.code;
        err.retryAfter = response.headers.get("retry-after")
          ? Number(response.headers.get("retry-after"))
          : null;
        throw err;
      }

      return data;
    } catch (error) {
      const retryable = error.retryAfter !== null;

      if (!retryable || attempt >= maxRetries) {
        return {
          status: "error",
          error: error?.message || "Unknown error",
        };
      } else {
        const serverDelay = !Number.isNaN(error.retryAfter)
          ? error.retryAfter * 1000
          : 1000;

        console.log(`Attempt #${attempt} with backoff of ${serverDelay}ms`);

        await sleep(serverDelay);
        return wikiFetch(searchTerm, params, attempt + 1);
      }
    }
  };

  const SkipButton = (props) => (
    <TouchableOpacity
        {...props}
        style={css.buttonSkip}
      >
        <Text style={[css.pillText, {color: "#b147ff88"}]}>{buttonsText.skip}</Text>
      </TouchableOpacity>
  );

  const NextButton = (props) => (
    <TouchableOpacity
        {...props}
        style={css.buttonRight}
      >
      <Text style={css.pillText}>{buttonsText.next}</Text>
      </TouchableOpacity>
  );

  const DoneButton = (props) => (
    <TouchableOpacity
        {...props}
        style={css.buttonDone}
      >
        <Text style={css.pillText}>{buttonsText.done}</Text>
      </TouchableOpacity>
  );

  useAsyncEffect(async () => {
    /*
    setInterval(() => {
      console.log(`clearing timeSemaphore`);
      timeSemaphore.current = false;
    }, 1000);
    */

    const dbInstance = await SQLite.openDatabaseAsync("mentr.db");

    /*const insets = useSafeAreaInsets();

    PRAGMA journal_mode = WAL;
    */
    await dbInstance.execAsync(
      `
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
      firstLocale = dbLanguage.language;
      setIsOnboarding(false);

    } else {
      const locales = getLocales();

      if (Array.isArray(locales) && locales.length) {
        firstLocale = getLocales()[0];

        if (firstLocale.languageCode.length <= 3) {
          firstLocale = firstLocale.languageCode;
        } else {
          firstLocale = "en";
        }
      }

      setIsOnboarding(true);
    }

    setButtonsText(buttonsText[firstLocale])
    //await db.current.execAsync(`DROP TABLE IF EXISTS interest`);
    //await db.current.execAsync(`DROP TABLE IF EXISTS disciple`);
    //await db.current.execAsync(`DROP TABLE IF EXISTS mentor`);

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
        setDB: setDB,
        dumpDB: dumpDB,
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
        lastMatrix: lastMatrix,
        setLastMatrix: setLastMatrix,
        allSections: allSections,
        loadingText: loadingText,
        setLoadingText: setLoadingText,
        hasMentored: hasMentored,
        wikiFetch: wikiFetch,
        isOnboarding: isOnboarding,
        setIsOnboarding: setIsOnboarding,
      }}
    >
      {isOnboarding ? (<Onboarding
        SkipButtonComponent={SkipButton}
        NextButtonComponent={NextButton}
        DoneButtonComponent={DoneButton}
        bottomBarHighlight={false}
        bottomBarHeight={75 + insets.bottom}
        onSkip={() => setIsOnboarding(false)}
        onDone={() => setIsOnboarding(false)}
        pages={[
          {
            backgroundColor: 'ghostwhite',
            image: <Image source={discipleLanguage === 'es' ? onboardingStepOneSpa : onboardingStepOne} style={{ height: "100%", width: "100%" }} />,
          },
          {
            backgroundColor: 'ghostwhite',
            image: <Image source={discipleLanguage === 'es' ? onboardingStepTwoSpa : onboardingStepTwo} style={{ height: "100%", width: "100%" }} />,
          },
          {
            backgroundColor: 'ghostwhite',
            image: <Image source={discipleLanguage === 'es' ? onboardingStepThreeSpa : onboardingStepThree} style={{ height: "100%", width: "100%" }} />,
          },
          {
            backgroundColor: 'ghostwhite',
            image: <Image source={discipleLanguage === 'es' ? onboardingStepFourSpa : onboardingStepFour} style={{ height: "100%", width: "100%" }} />,
          },
        ]}
      />) :
      <><View style={css.body}>
          <Slot />
        </View>
        <SearchBar onType={typeHandler} />
      </>}

    </Context.Provider>
  );
});
