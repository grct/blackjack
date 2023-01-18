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
// app.use(cors({ origin: "http://127.0.0.1:3001/", credentials: true }));

const players = [];
let deck = [];
let currentPlayer = 0;

io.on("connection", (socket) => {
    // socket.on("test", (a) => {
    //     console.log('eeee')
    //     console.log(a)
    // })

    socket.on("joinGame", (name) => {
        players.push({ id: socket.id, name, hand: [] });
        console.log('New player: ' + socket.id + ' | Name: ' + name)
        console.log(players.length)
        io.emit("updatePlayers", players);
        if(players.length > 1)
            startGame()
    });

    socket.on("makeBet", (bet) => {
        players[currentPlayer].bet = bet;
        currentPlayer++;
        if (currentPlayer === players.length) {
            currentPlayer = 0;
        }
        io.emit("updatePlayers", players);
    });

    socket.on("disconnect", () => {
        // console.log("Disconnected: " + socket.handshake.headers.origin)
        io.fetchSockets()
        .then((sockets) => {
          sockets.forEach((socket) => {
            console.log(socket.client.id)
          })
        })
        .catch(console.log)

        // io.eio.clients.forEach(e => {
        //     console.log(e.id) 
        // });
        const index = players.findIndex((player) => player.id === socket.id);
        players.splice(index, 1);
        io.emit("updatePlayers", players);
    });
});


// CREA MAZZO
const suits = ["spades", "hearts", "diamonds", "clubs"];
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
// /////////////

// MESCOLA MAZZO
const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const startGame = () => {
    deck = createDeck();
    deck = shuffleDeck(deck);
    console.log('Game started!')
    for (let player of players) {
        player.hand = [];
        for (let i = 0; i < 2; i++) {
            player.hand.push(deck.pop());
        }
        io.emit("updatePlayerHand", player.hand);
    }
    io.emit("updatePlayers", players);
}
  

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
