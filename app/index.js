import { useState,useContext,useEffect } from "react"
import { useAsyncEffect } from "@react-hook/async"
import { Link } from "expo-router"
import { Context } from "./_layout.js"
import PillsView from "../components/PillsView"
import Pill from "../components/Pill"

export default function Curiosity() {
  
  const ctx = useContext(Context)

  const [topics,setTopics] = useState([])
  const randomIndex = categories => { return Math.floor(Math.random() * categories.length) }

  useAsyncEffect(async () => {

    console.log(`Alerted from PillsView index:`)
    console.log(ctx.status)
    
    if(ctx.status.action === "search"){

      let searchSuggestions = await ctx.wiki.search(ctx.status?.value ?? "", {suggestion: true, limit: 30})
      
      searchSuggestions = searchSuggestions.results.map(item => item.title)

      setTopics(searchSuggestions)
    }

  },[ctx.status])

  
  useAsyncEffect(async () => {

    if(!ctx?.chain){
            
      let interestSuggestions = await ctx.wiki.search("Professional", {suggestion: true, limit: 300})

      interestSuggestions = interestSuggestions.results.map(item => item.title)

      console.log(interestSuggestions)

      const selectedSuggestions = []

      while (selectedSuggestions.length <= 25) {
       
        const element = interestSuggestions[randomIndex(interestSuggestions)]
        
      if(!selectedSuggestions.includes(element) && !/.*profession.*/ig.test(element))
          selectedSuggestions.push(element)
      }

      /*
      while (selectedTradeTopics.length <=10) {
       
        const element = allTradeTopics[randomIndex(allTradeTopics)]

        if(!selectedTradeTopics.includes(element))
          selectedTradeTopics.push(element)
      }

      const selectedProfessionalTopics = []

      while (selectedProfessionalTopics.length <=10) {
       
        const element = allProfessionTopics[randomIndex(allProfessionTopics)]
        if(!selectedProfessionalTopics.includes(element))
          selectedProfessionalTopics.push(element)
      }
      */
      setTopics(selectedSuggestions)
    }

  },[])
  
  return (
    <PillsView>
      {topics.map(topic => <Pill>{topic}</Pill>)}
    </PillsView>
   
  )
}


