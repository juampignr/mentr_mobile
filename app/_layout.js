import { View,ScrollView } from "react-native"
import { createContext,useEffect,useState } from "react"
import { useFonts, Corben_400Regular, Corben_700Bold } from '@expo-google-fonts/corben';
import { Slot } from 'expo-router'
import wiki from "wikipedia"
import css from "../styles/global.js"
import SearchBar from "../components/SearchBar"

export const Context = createContext()

export default function Layout() {
  
    let [fontsLoaded] = useFonts({
        Corben_400Regular,
        Corben_700Bold,
    })

    const [chain,setChain] = useState(false);
    const [status,setStatus] = useState(JSON.stringify({action:"loading"}))
    const [search,setSearch] = useState("")

    if (!fontsLoaded)
        return null
    
    const typeHandler = change => {

        setStatus({action:"search",value:change})
    }
        
    return (
    <Context.Provider value={{chain:chain, setChain:setChain, wiki:wiki, status:status, setStatus:setStatus, search:search, setSearch:setSearch}}>
        <View style={css.body}>
        <Slot/>
        <SearchBar onType={typeHandler}/>
        </View>
    </Context.Provider>
    )
}


