<template>
<div>
  {{ name }}
  <br>
  {{ hand }}
  <button @click="drawCard">draw</button>
</div>
</template>

<script>
export default {
  name: 'App',
  data(){
    return {
      hand: []
    }
  },
  computed: {
    name(){
      return Math.floor(Math.random() * 1100)
    }
  },
  sockets: {
    connect() {
        console.log('socket connected')
        console.log(this.$socket)
        this.$socket.emit("joinGame", this.name);
    },
    disconnected() {
      console.log("socket disconnected...")
    },
    updatePlayers(players) {
      console.log(players)
    },
    updatePlayerHand(hand){
      this.hand = hand
      console.log(hand)
    },
  },
  methods: {
    drawCard(){
      this.$socket.emit("draw");
    }
  }
}
</script>











<style>
body {
  background-color: black;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  margin-top: 60px;
  background-color: black;
}
</style>
