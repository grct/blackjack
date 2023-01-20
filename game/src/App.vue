<template>
<div>
  <Confetti ref="confetti"/>
  <div class="head">
    <img src="@/assets/logo.png" alt="logo" class="logo">
  </div>
  <div class="choosename" v-if="name.length < 3 || !logged">
    <h1>Scegli un nome</h1>
    <input type="text" v-model="temp">
    <div class="btn" @click="temp.length >= 3 ? join() : null">Conferma</div>
  </div>
  <div class="playerlist">
    <h1 style="text-align: left">Players:</h1>
    <div class="player" v-for="p in players" :key="p.id">{{ p.name == this.name ? "(Tu) " + p.name : p.name }} > <span class="primary">{{ p.wins }}</span> | <span class="error">{{ p.loses }}</span> | <span class="ties">{{ p.ties }}</span></div>
  </div>
  <!-- GIOCO -->
  <div v-if="name.length >= 3">
    <div class="table" v-if="table.hand">
      <!-- <h1>Tavolo</h1> -->
      <p style="font-size: 0.8vw">{{ table.score }}</p>
      <div class="cards">
      <Card v-for="c in table.hand" :key="c" :card="c" />
    </div>
    </div>
    <!-- OVERLAY -->
    <div class="notplaying" v-if="hand.length < 1 || !logged">
      <h1>Giocherai dal prossimo round</h1>
      <!-- <p class="notplaying-timeout">{{ timeout }}</p> -->
    </div>
    <div class="player-board" v-if="hand.length > 1">
      <!-- <h1>Le tue carte:</h1> -->
      <div class="cards">
        <Card v-for="c in hand" :key="c" :card="c" />
      </div>
      <p style="font-size: 0.8vw">
        {{ score }}
      </p>
      <div class="btns">
        <div class="btn" :class="{ selected: !stay }" @click="setDraw">Draw</div>
        <div class="btn" :class="{ selected: stay }" @click="setStay">Stay</div>
        <div class="timeout">
          {{ timeout }}
        </div>
      </div>
    </div>
    <div id="game" class="game">

    </div>
  </div>
  <!-- <div class="playerlist">
    <h1>Giocatori:</h1>
    <p v-for="p in players" :key="p.id">{{ p.name == this.name ? "(Tu) " + p.name : p.name }}</p>
  </div> -->

</div>
</template>

<script>
import Card from './components/Card.vue'
import Confetti from './components/Confetti.vue'
export default {
  components: { Card, Confetti },
  name: 'App',
  data(){
    return {
      hand: [],
      temp: '',
      name: '',
      logged: false,
      stay: true,
      table: [],
      players: [],
      history: [],
      timeout: 0,
    }
  },
  computed: {
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
            // console.log('figura: ' + s)
            return
          }
          if(c.value == 'A'){
            // controllo se è un +11 o +1
            s+11 > 21 ? s++ : s += 11
            ace = true
            // console.log('asso ' + s)
            return
          }
          s += parseInt(c.value)
        })
      return s
    }
  },
  sockets: {
    connect() {
        console.log('Connesso al server')
        console.log(this.$socket)
        if(this.name.length >= 3)
          this.$socket.emit("joinGame", this.name);
    },
    disconnected() {
      console.log("Disconnesso dal server")
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
      setTimeout(function(){
        // document.getElementById('game').style.background = 'transparent'
        document.getElementById('game').style.opacity = '100'
      }, 1000)
      if(r == 'table'){
        this.history.push('Persa')
        document.getElementById('game').style.background = 'linear-gradient(0deg, rgba(251,53,53,1) 0%, rgba(14,14,14,0) 100%)'
      }
        
      if(r == 'player'){
        this.history.push('Vinta')
        this.$refs.confetti.start()
        document.getElementById('game').style.background = 'linear-gradient(0deg, rgba(54,0,179,1) 2%, rgba(14,14,14,1) 100%)'
      }

      if(r == 'tie'){
        this.history.push('Patta')
        document.getElementById('game').style.background = 'linear-gradient(0deg, rgba(255,255,255,0.5956976540616247) 3%, rgba(14,14,14,1) 100%)'
      }

      setTimeout(function(){
        // document.getElementById('game').style.background = 'transparent'
        this.$refs.confetti.stop()
        document.getElementById('game').style.opacity = '0'
      }.bind(this), 5000)
        
    }
  },
  methods: {
    join(){
      if(this.temp.length >= 3){
        this.name = this.temp
        this.logged = true
        localStorage.name = JSON.stringify(this.name)
        localStorage.logged = JSON.stringify(this.logged)
        this.$socket.emit("joinGame", this.name);
      }
    },
    setDraw(){
      this.stay = false
      this.$socket.emit("playerStay", this.stay);
    },
    setStay(){
      this.stay = true
      this.$socket.emit("playerStay", this.stay);
    },
    updateTimeout(){
      this.timeout -= 1
    }
  },
  mounted(){
    if(localStorage.name != undefined && JSON.parse(localStorage.name).length > 2){
      this.name = JSON.parse(localStorage.name)
      this.logged = JSON.parse(localStorage.logged)
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Press+Start+2P&family=VT323&display=swap');
:root {
  --primary: #BB86FC;
  --primary-hover: #bb86fc28;
  --primary-select: #bb86fc4c;
  --primary-variant: #3600b3;
  --primary-variant-dark: #131313;
  --primary-variant-select: #3600b380;
  --secondary: #03DAC6;
  --secondary-hover: #03dac556;
  --secondary-select: #03dac568;
  --error: #CF6679;
  --background: #0e0e0e;
  --surface: #2a2a2a;
  --surface-hover: #404040;
  --surface-border: #565656;
  --on-primary: #000000;
  --on-secondary: #000000;
  --on-background: #FFFFFF;
  --on-surface: #FFFFFF;
  --on-error: #000000;
  --text: var(--on-surface);
}
body {
  background-color: var(--background);
}
* {
  margin: 0;
  padding: 0;
  font-family: 'Press Start 2P', Montserrat, Avenir, Arial, sans-serif;
  overflow: hidden;
  color: var(--text);
  text-align: center;
}
*:focus {
    outline: none;
}
.head {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 15vh;
  /* background-color: var(--primary-variant-dark) */
}
.logo {
  width: 18vw;
}
.choosename {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 3vh;
  position: absolute;
  width: 100%;
  top: 30%;
  z-index: 100;
  background-color: var(--background);
}
.choosename > input {
  background-color: var(--primary-variant-select);
  border: 2px solid var(--primary-variant);
  border-radius: 100vh;
  padding: 1vh 2vw 1vh;
  height: 30px;
  color: #ffffffc8;
 
}
.cards {
  display: flex;
  /* justify-content: center; */
  align-items: center;
  overflow-x: scroll;
  margin: 2vh 0 2vh;
}
.cards *:first-child {
    margin-left: auto;
}

.cards *:last-child {
    margin-right: auto;
}
.table {
  margin: 3vh 0 3vh;
  background: none;
}
.notplaying {
  background-color: #00000041;
  top: 30%;
  width: 100%;
  font-size: 0.8vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 3vh;
  height: 150px;
  position: absolute;
  z-index: 99;
}
.notplaying-timeout {
  font-size: 4rem;
  color: var(--primary);
}
.timeout {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--primary-variant-select);
  border: 2px solid var(--primary-variant);
  height: 4.5vw;
  width: 4.5vw;
  border-radius: 100vh;
  font-size: 1vw;
}
.btns {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2vw;
  margin: 4vh 0 2vh;
}
.btn {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 5px;
  padding: 3vh 3vw 3vh;
  font-size: 1vw;
  transition-duration: 120ms;
}
.btn:hover {
  background-color: var(--surface-hover);
  transition-duration: 120ms;
}
.selected {
  background-color: var(--secondary-select) !important;
  border: 1px solid var(--secondary) !important; 
}
.selected:hover {
  background-color: var(--secondary-hover) !important;
  transition-duration: 120ms;
}
.game {
  height: 100vh;
  width: 100%;
  transition-duration: 500ms;
  opacity: 0;
}
.playerlist {
  position: absolute;
  font-size: 0.7vw;
  text-align: left;
  padding: 3vh 2vw 3vh;
  background-color: var(--surface-hover);
  border: 2px solid var(--surface-border);
  left: 3vw;
}
.player {
  margin-top: 2vh;
  text-align: left;
  font-size: 0.7vw;
}
.primary {
  color: var(--primary) !important;
}
.error {
  color: var(--error) !important;
}
.ties {
  color: #b1b1b1 !important;
}
</style>
