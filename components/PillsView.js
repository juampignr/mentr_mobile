import css from "../styles/global.js"
import { View,ScrollView,StyleSheet } from "react-native"


export default function PillsView({children}) {

    const style = StyleSheet.create(css.pillsView)

    return(
        <ScrollView contentContainerStyle={style}>
            {children}
        </ScrollView>
    )
}
