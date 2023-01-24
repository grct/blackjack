const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  allowEIO3: true,
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});
const table = {
  hand: [],
  score: 0
};
const players = [];
var deck = [];
let timer = undefined;
let time_left = 0;
let round = 0;
let currentPlayer = 0;

app.get('/'), (req, res)=>res.json({message: "200"})

// Connessione iniziale
io.on("connection", (socket) => {
    socket.on("joinGame", (name) => {
        players.push({ id: socket.id, name, hand: [], score: 0, stay: true, wins: 0, loses: 0, ties: 0 });
        console.log(`(${players.length}) Joined: ${socket.id} | Name: ${name}`)
        io.emit("updatePlayers", players);
        let p = players.find(p => p.id === socket.id);
        io.to(p.id).emit("updateId", socket.id);
        io.to(p.id).emit("updateTimeout", time_left);
        if(players.length > 0){
          // setTimeout(function(){
            startGame()
          // }, 5000);
        }
    });

    socket.on("playerStay", (s) => {
      let p = players.find(p => p.id === socket.id);

      // Mano con più carte per capire se qualcuno ha già pescato
      let highest = Math.max(...players.map(o => o.hand.length))
      // Se non ha pescato prima, è obbligato a stare
      if(highest > 2 && p.hand.length <= 2)
        p.stay = true
      else
        p.stay = s

      io.to(p.id).emit("updatePlayerStay", p.stay);
      io.emit("updatePlayers", players);
    });

    // Non in uso
    socket.on("makeBet", (bet) => {
        players[currentPlayer].bet = bet;
        currentPlayer++;
        if (currentPlayer === players.length)
          currentPlayer = 0;
        io.emit("updatePlayers", players);
    });

    // Disconnessione
    socket.on("disconnect", () => {
        console.log(`(${players.length}) Left: ${socket.id}`)
        // Rimuovi giocatore dalla lista
        const index = players.findIndex((player) => player.id === socket.id);
        players.splice(index, 1);
        // Aggiorna i socket
        io.emit("updatePlayers", players);
    });
});


// Crea mazzo (4 mazzi)
const suits = ["spade", "cuori", "quadri", "picche"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const newDeck = () => {
  for(let i=0; i<4; i++)
    for (let suit of suits) {
      for (let value of values) {
        deck.push({ suit, value });
      }
    }
};

// Mescola mazzo
const shuffleDeck = () => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
};

// Player pesca una carta
const drawCard = (p) => {
  p.hand.push(deck.pop());
  io.to(p.id).emit("updatePlayerHand", p.hand);
  p.score = calcScore(p.hand)
  io.emit("updatePlayers", players);
}

// Tavolo pesca una carta
const tableDraw = () => {
  table.hand.push(deck.pop());
  console.log('Tavolo pesca: ' + JSON.stringify(table.hand[table.hand.length-1]))
  console.log(deck.length +  ' Carte rimanenti')
  table.score = calcScore(table.hand)
  io.emit("updateTable", table);
}

// Nuovo tavolo
const newTable = () => {
  table.hand = [];
  table.hand.push(deck.pop());
  table.score = calcScore(table.hand);
  io.emit("updateTable", table);
}

// const clearHands = () => {
//   table.hand = []
//   players.forEach(p => {
//     p.hand = []
//   })
//   io.emit("updateTable", table);
//   io.emit("updatePlayers", players);
// }

// Da la mano iniziale ai players
const giveCards = () => {
  players.forEach(p => {
      p.hand = [];
      p.hand.push(deck.pop());
      p.hand.push(deck.pop());
      p.score = calcScore(p.hand)
      io.to(p.id).emit("updatePlayerHand", p.hand);
      io.emit("updatePlayers", players);
  })
}

// Inizia il gioco
const startGame = () => {
  if(timer)
    return

  console.log('Game started!')
  newDeck()
  shuffleDeck();
  newRound();

  timer = setInterval(updateTimer, 1000);
  io.emit("updateTimeout", time_left);
}

// Timer
const updateTimer = () => {
  // Controllo che ci siano dei giocatori
  // if(players.length < 1) {
  //   clearInterval(timer)
  //   timer = false
  //   console.log('Round interrotto')
  //   return
  // }
  // Se il tempo è finito
  if(time_left <= 0){
    newRound()
  }
  // Se il timer è ancora attivo
  time_left -= 1
  io.emit("updateTimeout", time_left);
}
 
// Nuovo round
const newRound = () => {
  let i

  if(deck.length < 60){
    console.log("New deck added!")
    // let d = createDeck()
    newDeck()
    shuffleDeck()
    console.log(deck)
  }

  // Se i giocatori NON hanno finito di pescare
  if(!players.every(isStaying) && table.hand.length < 2){
    time_left = 15
    io.emit("updateTimeout", time_left);
    return
  }

  // Il tavolo pesca
  if(table.score < 17 && table.hand.length > 0){
    tableDraw()
    i = setInterval(() => {
      if(table.score < 17 && table.hand.length > 0)
        tableDraw()
      else{
        clearInterval(i)
        checkWinners()
      }
    }, 1000);

    time_left = 10
    io.emit("updateTimeout", time_left);
    return
  }
  
  // Nuovo round da 0
  time_left = 15
  round++;
  console.log('New round! ' + round)
  newTable()
  giveCards()
  io.emit("updateTimeout", time_left);
}

// Calcola il punteggio
const calcScore = (hand) => {
  let s = 0
  let ace = false;
  if(hand != undefined && hand.length > 0)
    hand.forEach(c => {
      if(c == undefined)
        return
      if(c.value == 'J' || c.value == 'Q' || c.value == 'K'){
        if(ace && s+10 <= 21){
          s += 10
          ace = false
        }
        if(!ace)
          s += 10
        return
      }
      if(c.value == 'A'){
        // controllo se è un +11 o +1
        s+11 > 21 ? s++ : s += 11
        ace = true
        return
      }
      s += parseInt(c.value)
    })
  return s
}

// Controllo se il player sta
const isStaying = (p, index, array) => {
  if(!p.stay && p.score < 21)
    drawCard(p)
  if(p.score >= 21){
    p.stay = true
    io.to(p.id).emit("updatePlayerStay", p.stay);
  }
  if(index === 0)
      return p.stay
  else
      return p.stay && p.stay === array[index-1].stay
}

// Controllo vincitori
const checkWinners = () => {
  players.forEach(p => {
    let result = ''
    let bj = {
      t: false,
      p: false
    }

    // Mano vuota
    if(p.hand.length < 2)
      return

    // Determina blackjack
    if(table.score === 21 && table.hand.length === 2)
      bj.t = true;
    if(p.score === 21 && p.hand.length === 2)
      bj.p = false;

    if(bj.t && bj.p){
      result = 'tie'
      p.ties++
    }
    else if(bj.t){
      result = 'table'
      p.loses++
    }
    else if(bj.p){
      result = 'player'
      p.wins++
    }

    if(result.length < 3){
      if(table.score > 21 && p.score <= 21){
        result = 'player'
        p.wins++
      }
      else if(table.score === p.score){
        result = 'tie'
        p.ties++
      }
      else if(table.score >= 17 && table.score <= 21)
        if(p.score > table.score && p.score <= 21){
          result = 'player'
          p.wins++
        }
        else {
          result = 'table'
          p.loses++
        }
    }

    io.to(p.id).emit("showResult", result);
    io.emit("updatePlayers", players);
  })
}

server.listen(process.env.PORT || 3000, () => {
  console.log("Server listening online");
});
