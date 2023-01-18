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
let timer = undefined;
let time_left = 0;
let round = 0;
let deck = [];
let currentPlayer = 0;

io.on("connection", (socket) => {
    socket.on("joinGame", (name) => {
        players.push({ id: socket.id, name, hand: [], score: 0, ready: false });
        console.log(`(${players.length}) Joined: ${socket.id} | Name: ${name}`)
        io.emit("updatePlayers", players);
        let p = players.find(p => p.id === socket.id);
        io.to(p.id).emit("updateTimeout", time_left);
        if(players.length > 0)
            startGame()
    });

    socket.on("playerReady", () => {
      let p = players.find(p => p.id === socket.id);
      p.ready = !p.ready
      io.emit("updatePlayers", players);
    });

    socket.on("makeBet", (bet) => {
        players[currentPlayer].bet = bet;
        currentPlayer++;
        if (currentPlayer === players.length)
          currentPlayer = 0;
        io.emit("updatePlayers", players);
    });

    socket.on("disconnect", () => {
        console.log(`(${players.length}) Left: ${socket.id}`)
        // Rimuovi giocatore dalla lista
        const index = players.findIndex((player) => player.id === socket.id);
        players.splice(index, 1);
        // Aggiorna i socket
        io.emit("updatePlayers", players);
    });

    socket.on("draw", () => {
      let p = players.find(p => p.id === socket.id);
      console.log(p.name + " is drawing")
      drawCard(p);
    })
});


// CREA MAZZO
const suits = ["spade", "cuori", "quadri", "picche"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const createDeck = () => {
  const deck = [];
  for(let i=0; i<4; i++)
    for (let suit of suits) {
      for (let value of values) {
        deck.push({ suit, value });
      }
    }
  return deck;
};

// MESCOLA MAZZO
const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

// Pesca una carta
const drawCard = (p) => {
  p.hand.push(deck.pop());
  io.to(p.id).emit("updatePlayerHand", p.hand);
  p.score = calcScore(p.hand)
  io.emit("updatePlayers", players);
}

const tableDraw = () => {
  table.hand.push(deck.pop());
  table.score = calcScore(table.hand)
  io.emit("updateTable", table);
}

const newTable = () => {
  table.hand = [];
  table.hand.push(deck.pop());
  table.hand.push(deck.pop());
  table.score = calcScore(table.hand);
  io.emit("updateTable", table);
}

const giveCards = () => {
  players.forEach(p => {
    console.log("Dando mano a: " + p.name)
      p.hand = [];
      p.hand.push(deck.pop());
      p.hand.push(deck.pop());
      p.score = calcScore(p.hand)
      io.to(p.id).emit("updatePlayerHand", p.hand);
      io.emit("updatePlayers", players);
  })
}

const startGame = () => {
  if(timer)
    return
  deck = createDeck();
  deck = shuffleDeck(deck);
  console.log('Game started!')
  // Primo giro
  newRound();
  timer = setInterval(updateTimer, 1000);
  io.emit("updateTimeout", time_left);
}

const updateTimer = () => {
  // Controllo che ci siano dei giocatori
  if(players.length < 1) {
    clearInterval(timer)
    timer = false
    console.log('Round interrotto')
    return
  }
  // Se il tempo è finito
  if(time_left <= 0){
    newRound()
  }
  // Se il timer è ancora attivo
  time_left -= 1
  io.emit("updateTimeout", time_left);
}
 
const newRound = () => {
  if(table.score < 18 && table.hand.length >= 2){
    time_left = 20
    tableDraw()
    return
  }
  time_left = 15
  round++;
  console.log('New round! ' + round)
  newTable()
  giveCards()
  checkWinners()
  io.emit("updateTimeout", time_left);
}

const calcScore = (hand) => {
  let s = 0
  if(hand.length > 0)
    hand.forEach(c => {
      if(c.value == 'J' || c.value == 'Q' || c.value == 'K'){
        s += 10
        return
      }
      if(c.value == 'A'){
        s += 11
        return
      }
      s += parseInt(c.value)
    })
  return s
}

const checkWinners = () => {
  players.forEach(p => {
    let result = null
    // Entrambi blacjack
    if(p.score == 21 && table.score == 21)
      result = 'tie'
    // Player Blackjack
    if(p.score == 21 && table.score != 21)
      result = 'player'
    // Tavolo blackjakc
    if(p.table == 21 && p.score != 21)
      result = 'table'
    // Player si avvicina a 21
    if(p.score > table.score && p.score < 21)
      result = 'player'
    // Tabolo si avvicina a 21
    if(table.score > p.score && table.score < 21)
      result = 'table'
    // Entrambi sopra 21
    if(p.score > 21 && table.score > 21)
      result = 'tie'
    io.to(p.id).emit("showResult", result);
  })
}

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
