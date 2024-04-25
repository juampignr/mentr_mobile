import css from "../styles/global.js"
import { StyleSheet, TextInput, Text, View} from "react-native"
import { useRef,useEffect,useContext } from "react"
import { Context } from "../Context"

export default function SearchBar({children}){
  
  const ref = useRef(null)
  const ctx = useContext(Context)
  let timeout = null

  const handleTyping = event => {

    clearTimeout(timeout)

    timeout = setTimeout(() => {

        ctx.setSearch(event.target.value)  

        if(ctx.status != "typing")
          ctx.setStatus("typing")

    },1500)
  }

  return(
    
  <View style={styles.searchBar}>  
    <TextInput style={styles.searchBarInput} 
      onChangeText={handleTyping} 
      placeholder="What's your interest?" 
      placeholderTextColor="slategray"
      textAlign="center"
    />
  </View>
  )

}


const styles = StyleSheet.create({...css})