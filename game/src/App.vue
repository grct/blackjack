<template>
<div>
  <Error :error="error" v-if="error.length > 1"/>
  <!-- Container del Gioco - Visibile solo se connessi al socket -->
  <div class="container" v-if="error == ''">
    <Confetti ref="confetti"/> <!-- Animazioni -->

    <div class="pregame"> <!-- Pre partita -->
      <div class="head"> <!-- Header -->
        <img src="@/assets/logo.png" alt="logo" style="width: 18vw">
      </div>

      <!-- Input seleziona nome -->
      <div class="choosename" v-if="player.name.length < 3">
        <h1>Scegli un nome</h1>
        <input type="text" v-model="temp">
        <div class="btn" @click="temp.length >= 3 ? join() : null">Conferma</div>
      </div>
    </div>

    <div class="game" v-if="player.name.length >= 3"> <!-- Partita -->
      
      <!-- Attesa del tuo turno -->
      <div class="notplaying" v-if="player.hand.length < 1">
        <h1>Giocherai dal prossimo round</h1>
      </div>

      <!-- Lista players -->
      <div class="playerlist">
        <h1 style="text-align: left">Players:</h1>
        <div class="player" v-for="p in players" :key="p.id">{{ p.id == this.player.id ? "(Tu) " + p.name : p.name }} > <span class="primary">{{ p.wins }}</span> | <span class="error">{{ p.loses }}</span> | <span class="ties">{{ p.ties }}</span></div>
      </div>

      <!-- Tavolo -->
      <div class="table" v-if="table.hand">
        <p style="font-size: 0.8vw">{{ table.score }}</p>
        <div class="cards">
          <Card v-for="c in table.hand" :key="c" :card="c" />
        </div>
      </div>

      <!-- Board Player -->
      <div class="player-board" v-if="player.hand.length > 1">
        <!-- Mano Player -->
        <div class="player-hand">
          <div>
            <div class="cards">
              <Card v-for="c in player.hand" :key="c" :card="c" />
            </div>
            <p style="font-size: 0.8vw">
              {{ score }}
            </p>
          </div>
        </div>

        <!-- Comandi -->
        <div class="btns">
          <div class="btn" :class="{ selected: !player.stay }" @click="setDraw">Draw</div>
          <div class="timeout">
            {{ timeout }}
          </div>
          <div class="btn" :class="{ selected: player.stay }" @click="setStay">Stay</div>
        </div>

      </div> <!-- Fine Board Player  -->

      <!-- Board Altri Players -->
      <div class="otherplayers">
        <div v-for="p in otherPlayers.slice(0, 4)" :key="p.id">
          <div class="cards">
            <Card v-for="c in p.hand" :key="c" :card="c" />
          </div>
          <div v-if="p.hand.length > 1">
            {{ p.name }}
          </div>
        </div>
      </div>

      <div class="background-effects" ref="backgroundEffects" /> <!-- Animazioni  -->
    </div> <!-- Fine Game  -->
  </div> <!-- Fine Container  -->
</div> <!-- Fine componente  -->
</template>

<script>
import Card from './components/Card.vue'
import Confetti from './components/Confetti.vue'
import Error from './components/Error.vue'
export default {
  components: { Card, Confetti, Error },
  name: 'App',
  data(){
    return {
      table: [],
      players: [],
      player: {
        id: '',
        name: '',
        logged: '',
        hand: '',
        stay: '',
        history: []
      },
      temp: '',
      timeout: 0,
      error: '',
    }
  },
  computed: {
    // Calcolo punteggio
    score(){
      let s = 0
      let ace = false;
      if(this.player.hand != undefined && this.player.hand.length > 0)
        this.player.hand.forEach(c => {
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
    },
    otherPlayers(){
      return this.players.filter(p => p.id != this.player.id)
    }
  },
  // Gestione eventi sockets
  sockets: {
    connect() {
        console.log('Connesso al server')
        console.log(this.$socket)
        this.error = ''
        if(this.player.name.length >= 3)
          this.$socket.emit("joinGame", this.player.name);
    },
    disconnect() {
      this.error = 'crash'
    },
    connect_error() {
      this.error = 'crash'
    },
    updateId(id){
      this.player.id = id
    },
    updatePlayers(players) {
      this.players = players
    },
    updateTable(table) {
      this.table = table
    },
    updatePlayerHand(hand){
      this.player.hand = hand
    },
    updatePlayerStay(stay){
      this.player.stay = stay
    },
    updateTimeout(t){
      this.timeout = t
    },
    // Effetto in base al risultato del round
    showResult(r){
      setTimeout(function(){
        this.$refs.backgroundEffects.style.opacity = '100'
      }.bind(this), 1000)
      if(r == 'table'){
        this.player.history.push('Lose')
        this.$refs.backgroundEffects.style.background = 'linear-gradient(0deg, rgba(251,53,53,1) 0%, rgba(14,14,14,0) 100%)'
      }
        
      if(r == 'player'){
        this.history.push('Win')
        this.$refs.confetti.start()
        this.$refs.backgroundEffects.style.background = 'linear-gradient(0deg, rgba(54,0,179,1) 2%, rgba(14,14,14,1) 100%)'
      }

      if(r == 'tie'){
        this.player.history.push('Tie')
        this.$refs.backgroundEffects.style.background = 'linear-gradient(0deg, rgba(255,255,255,0.5956976540616247) 3%, rgba(14,14,14,1) 100%)'
      }

      setTimeout(function(){
        this.$refs.confetti.stop()
        this.$refs.backgroundEffects.style.opacity = '0'
      }.bind(this), 5000)
        
    }
  },
  methods: {
    // Unisciti alla partita
    join(){
      if(this.temp.length >= 3){
        this.player.name = this.temp
        this.player.ogged = true
        localStorage.name = JSON.stringify(this.player.name)
        // localStorage.logged = JSON.stringify(this.player.logged)
        this.$socket.emit("joinGame", this.player.name);
      }
    },
    // Gestion Stay-Draw
    setDraw(){
      this.player.stay = false
      this.$socket.emit("playerStay", this.player.stay);
    },
    setStay(){
      this.player.stay = true
      this.$socket.emit("playerStay", this.player.stay);
    },
    updateTimeout(){
      this.timeout -= 1
    }
  },
  mounted(){
    // Cache
    if(localStorage.name != undefined && JSON.parse(localStorage.name).length > 2){
      this.player.name = JSON.parse(localStorage.name)
      // this.player.logged = JSON.parse(localStorage.logged)
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
  --surface-hover: #40404079;
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
}

/* Selezione del nome */
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

/* Overlay attesa prossimo turno */
.notplaying {
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

  background: rgba(0, 0, 0, 0.44);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4.2px);
  -webkit-backdrop-filter: blur(4.2px);
  border: 1px solid rgba(0, 0, 0, 0.3);
}
.notplaying-timeout {
  font-size: 4rem;
  color: var(--primary);
}

/* Player */
.player {
  margin-top: 2vh;
  text-align: left;
  font-size: 0.7vw;
}
.player-hand {
  z-index: 10;
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: 1fr;
  grid-column-gap: 1vw;
}
.player-hand > div { grid-area: 1 / 3 / 2 / 4; }

/* Banco */
.table {
  margin: 3vh 0 3vh;
  background: none;
}

/* Altri Giocatori */
.otherplayers {
  position: absolute;
  width: 100%;
  top: 50%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-column-gap: 1vw;
  z-index: 1;
}
.otherplayers > * > .cards > * > canvas {
  width: 6vw;
  height: 8vw;
}
.otherplayers > *:nth-child(1) {
  grid-area: 1 / 1 / 2 / 2;
}
.otherplayers > *:nth-child(2) {
  grid-area: 1 / 2 / 2 / 3;
}
.otherplayers > *:nth-child(3) {
  grid-area: 1 / 4 / 2 / 5;
}
.otherplayers > *:nth-child(4) {
  grid-area: 1 / 5 / 2 / 6;
}

/* Mano */
.cards {
  display: flex;
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

/* Comandi Player */
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
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

/* Lista Players */
.playerlist {
  position: absolute;
  font-size: 0.7vw;
  text-align: left;
  padding: 3vh 2vw 3vh;
  background-color: var(--surface-hover);
  border: 2px solid var(--surface-border);
  left: 3vw;
  top: 4vh;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

/* Effetti e color */
.background-effects {
  position: absolute;
  top: 0;
  height: 100vh;
  /* background-color: red; */
  width: 100%;
  transition-duration: 500ms;
  z-index: -1;
  opacity: 0;
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
