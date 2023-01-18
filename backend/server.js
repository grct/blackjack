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
const players = [];
let deck = [];
let currentPlayer = 0;

io.on("connection", (socket) => {
    socket.on("joinGame", (name) => {
        players.push({ id: socket.id, name, hand: [] });
        console.log(`(${players.length}) Joined: ${socket.id} | Name: ${name}`)
        io.emit("updatePlayers", players);
        if(players.length > 1)
            startGame()
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
      console.log(p + " is drawing")
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
  io.emit("updatePlayers", players);
}

const startGame = () => {
    deck = createDeck();
    deck = shuffleDeck(deck);
    console.log('Game started!')
    players.forEach(p => {
      console.log("Dando mano a: " + p.name)
        p.hand = [];
        p.hand.push(deck.pop());
        p.hand.push(deck.pop());
        io.to(p.id).emit("updatePlayerHand", p.hand);
    })
    io.emit("updatePlayers", players);
}
  

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
