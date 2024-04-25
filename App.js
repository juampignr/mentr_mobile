import { StyleSheet,Text,View } from "react-native"
import { useFonts,Corben_400Regular } from "@expo-google-fonts/corben"
import SearchBar from "./components/SearchBar"
import Context from "./Context"

export default function App() {
  
  let [fontsLoaded] = useFonts({Corben_400Regular})

  if (!fontsLoaded)
    return null
  
  const styles = StyleSheet.create({
    container: {
      fontFamily: "Corben_400Regular",
      fontSize: 10,
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
  })

  return (
    <Context>
      <View style={styles.container}>
        <SearchBar/>
      </View>
    </Context>
  )
}


