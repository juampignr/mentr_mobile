import css from "../styles/global.js"
import { StyleSheet, TextInput, Text, View} from "react-native"
import { useRef,useEffect,useContext } from "react"

export default function SearchBar({children,onType}){
  
  const ref = useRef(null)
  let timeout = null

  return(
    
  <View style={styles.searchBar}>  
    <TextInput style={styles.searchBarInput} 
      onChangeText={onType} 
      placeholder="What's your interest?" 
      placeholderTextColor="slategray"
      textAlign="center"
    />
  </View>
  )

}


const styles = StyleSheet.create({...css})