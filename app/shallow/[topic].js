import { useContext,useState } from "react"
import { FlatList,View } from "react-native"
import { useAsyncEffect } from "@react-hook/async"
import { Context } from "../_layout.js"
import { useLocalSearchParams } from "expo-router"
import Card from "../../components/Card"
import PillsView from "../../components/PillsView"
import Pill from "../../components/Pill"

export default function Shallow() {
  
  const ctx = useContext(Context)
  const [related, setRelated] = useState()
  const [topics, setTopics] = useState([])

  const {topic} = useLocalSearchParams()
    
  useAsyncEffect(async () => {

    //Change global topic and all cards upon search!
    console.log(`Alerted from Shallow:`)
    console.log(ctx.status)
    
    if(ctx.status.action === "search"){

      let searchSuggestions = await ctx.wiki.search(ctx.status?.value ?? "", {suggestion: true, limit: 30})
      
      searchSuggestions = searchSuggestions.results.map(item => item.title)

      setTopics(searchSuggestions)
    }

  },[ctx.status])

  useAsyncEffect(async () => {
    
    let suggestions = await ctx.wiki.search(topic, {suggestion: true, limit: 10})
    suggestions = suggestions?.results

    const flatListData = []

    for (const page of suggestions) {
      
      const id = page?.pageid ?? 0
      const title = page?.title ?? ""

      flatListData.push({id:id,title:title})
    }

    console.log(flatListData)
    setRelated(flatListData)
  },
  [])


  return (
    <View>
      <PillsView>{topics.map(topic => <Pill>{topic}</Pill>)}</PillsView>
      <FlatList data={related} contentContainerStyle={{ alignItems: 'center' }} renderItem={({item}) => <Card>{item?.title}</Card>}/>
    </View>
    )

}