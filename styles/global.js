
export default css = {
  searchBarInput:{

    fontFamily: "Corben_400Regular",
    fontSize: 20,
    paddingTop: "5%",
    color: "slategray"
  },
  searchBar: {
    width: "97%",
    height: "10%",
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: "#5cc6b5e6",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#ececec",
    position: "absolute",
    bottom: -1,
    zIndex: 999
  },
  body: {
    flex: 1,
    fontFamily: "Corben_400Regular",
    fontSize: 10,
    backgroundColor: '#fff',
    marginTop: "7%"
  },
  pillsView: {
    maxHeight: "81%",
    marginTop: "10%",
    padding: 10,
    fontSize: 10,
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    columnGap: 5,
    rowGap: 10
  },
  pill: {
    borderRadius: 15,
    borderWidth: 0,
    padding: 1,
    backgroundColor: "#5c91c6b0",
    borderWidth: 2,
    borderColor: "#5282b2b0",
    color: "ghostwhite",
    textAlign: "center",
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  pillText: {
    fontFamily:"Corben_400Regular",
    fontSize:15, 
    color: "ghostwhite"
  },
  card: {
    width: "95%",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#7c8c9c87",
    backgroundColor: "#2196f303",
    shadowColor: '#70809042',
    shadowOffset: {width: -2, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginTop: 10
  },
  cardTitle: {
    fontFamily:"Corben_400Regular",
    fontSize: 15,
    textAlign: "center",
    color: "#7c8c9c",
    marginBottom: 15
  },
  cardSummary: {
    fontFamily:"Corben_400Regular",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "left",
    color: "#4d769f"
  },
  listView: {
    padding: 10,
    fontSize: 10,
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    columnGap: 5,
    rowGap: 10
  },
}