import { StyleSheet, Text, View } from 'react-native'
import SearchBar from "./components/SearchBar"

export default function App() {
  return (
    <View style={styles.container}>
      <SearchBar/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
