import css from "../styles/global.js"
import { useContext,useState } from "react"
import { View,Text } from "react-native"
import { useAsyncEffect } from "@react-hook/async"
import { Context } from "../app/_layout.js"


export default function Card({children}){

    const ctx = useContext(Context)
    const [title,setTitle] = useState(children)
    const [summary,setSummary] = useState()

    
    useAsyncEffect(async () => { 

        const summaryResult = await (await ctx.wiki.page(title)).summary()
        setSummary(summaryResult?.extract ?? children)
    },[])
    return(

        <View style={css.card}>
            <Text style={css.cardTitle}>{title}</Text>
            <Text style={css.cardSummary}>{summary}</Text>
        </View>
    )
}