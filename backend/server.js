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
let deck = [];
let currentPlayer = 0;

io.on("connection", (socket) => {
    socket.on("joinGame", (name) => {
        players.push({ id: socket.id, name, hand: [], score: 0, ready: false });
        console.log(`(${players.length}) Joined: ${socket.id} | Name: ${name}`)
        io.emit("updatePlayers", players);
        if(players.length > 1)
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
}

const newTable = () => {
  table.hand = [];
  table.hand.push(deck.pop());
  table.hand.push(deck.pop());
  table.score = calcScore(table.hand);
  while(table.score < 18)
    tableDraw()
  io.emit("updateTable", table);
}

const startGame = () => {
    deck = createDeck();
    deck = shuffleDeck(deck);
    console.log('Game started!')
    newTable();
    players.forEach(p => {
      console.log("Dando mano a: " + p.name)
        p.hand = [];
        p.hand.push(deck.pop());
        p.hand.push(deck.pop());
        p.score = calcScore(p.hand)
        io.to(p.id).emit("updatePlayerHand", p.hand);
    })
    io.emit("updatePlayers", players);
}
 
const calcScore = (hand) => {
  let s = 0
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

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
