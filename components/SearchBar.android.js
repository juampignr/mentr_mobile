import css from '../styles/global.js'
import { StyleSheet, TextInput, Text, View } from 'react-native';
/*
import { Context } from '../pages/_app';
import { useRef,useEffect,useContext } from 'react';
*/
export default function SearchBar({children}){


  const handleTyping = event => {

    console.log(event)
  }

  /*
  const ref = useRef(null);
  const ctx = useContext(Context);
  let timeout = null;

  const handleTyping = event => {

    clearTimeout(timeout)

    timeout = setTimeout(() => {

        ctx.setSearch(event.target.value)  

        if(ctx.status != "typing")
          ctx.setStatus("typing")

    },1500)
  };
  */

  
  return(
  <View style={styles.searchBar}>  
    <TextInput onChangeText={handleTyping} placeholder="What's your interest?"/>
  </View>
  )

}


const styles = StyleSheet.create({searchBar:{...css.searchBar}})