<template>
<div>
  <div class="table">
    Prossimo round:
    {{ timeout }} s
    <h1>Tavolo</h1>
    <p>Punti {{ table.score }}</p>
    <div class="cards">
    <Card v-for="c in table.hand" :key="c" :card="c" />
  </div>
  </div>
  <h1>Le tue carte:</h1>
  <div class="cards">
    <Card v-for="c in hand" :key="c" :card="c" />
  </div>
  <div>
  Ciao {{ name }},
  <br> 
  Punti: {{ score  }}
  </div>
  <button @click="drawCard" v-if="score < 21">draw</button>
  <button @click="changeStay">Stay</button>
  {{  stay }}
  <div class="playerlist">
    <h1>Giocatori:</h1>
    <p v-for="p in players" :key="p.id">{{ p.name == this.name ? "(Tu) " + p.name : p.name }}</p>
  </div>
  <div>
    History:
    {{ history }}
  </div>
</div>
</template>

<script>
import Card from './components/Card.vue'
export default {
  components: { Card },
  name: 'App',
  data(){
    return {
      hand: [],
      stay: true,
      table: [],
      players: [],
      history: [],
      timeout: 0,
    }
  },
  computed: {
    name(){
      return Math.floor(Math.random() * 1100)
    },
    score(){
      let s = 0
      let ace = false;
      if(this.hand != undefined && this.hand.length > 0)
        this.hand.forEach(c => {
          if(c == undefined)
            return
          if(c.value == 'J' || c.value == 'Q' || c.value == 'K'){
            if(ace && s+10 <= 21)
              s += 10
            if(!ace)
              s += 10
            console.log('figura: ' + s)
            return
          }
          if(c.value == 'A'){
            // controllo se è un +11 o +1
            s+11 > 21 ? s++ : s += 11
            ace = true
            console.log('asso ' + s)
            return
          }
          s += parseInt(c.value)
        })
      return s
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
      this.players = players
    },
    updateTable(table) {
      this.table = table
    },
    updatePlayerHand(hand){
      this.hand = hand
    },
    updateTimeout(t){
      this.timeout = t
      // setInterval(this.updateTimeout, 1000);
    },
    showResult(r){
      if(r == 'table')
        this.history.push('Persa')
      if(r == 'player')
        this.history.push('Vinta')
      if(r == 'tie')
        this.history.push('Parità')
        
    }
  },
  methods: {
    drawCard(){
      this.$socket.emit("draw");
    },
    changeStay(){
      this.stay = !this.stay
      this.$socket.emit("playerStay");
    },
    updateTimeout(){
      this.timeout -= 1
    }
  },
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
.cards {
  display: flex;
  /* justify-content: center; */
  align-items: center;
  overflow-x: scroll;
}
.cards *:first-child {
    margin-left: auto;
}

.cards *:last-child {
    margin-right: auto;
}

</style>
