import { useAsyncEffect } from '@react-hook/async'
import { useState,useEffect,createContext } from "react"
import { useFonts,Corben_400Regular } from "@expo-google-fonts/corben"
import wiki from "wikipedia"

export const Context = createContext()

export default function ContextManager({children}){

    useAsyncEffect(async () => {
  
        const page = await wiki.page('Batman')
        console.log(page)
    
        if(status.indexOf("error") != -1){
    
          console.log(status)
          //If dev do something, if prod do another thing
    
        }
    },[status])
    const [chain,setChain] = useState({curiosityChain:{}});
    const [status,setStatus] = useState("loading")
    const [search,setSearch] = useState("")

    return(
        <Context.Provider value={{chain:chain, setChain:setChain, wiki:wiki, status:status, setStatus:setStatus, search:search, setSearch:setSearch}}>
        {children}
        </Context.Provider>
    )
}