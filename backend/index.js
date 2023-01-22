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

app.get('/'), (req, res)=>res.json({message: "ok"})

io.on("connection", (socket) => {
    socket.on("joinGame", (name) => {
        players.push({ id: socket.id, name, hand: [], score: 0, stay: true, wins: 0, loses: 0, ties: 0 });
        context.log(`(${players.length}) Joined: ${socket.id} | Name: ${name}`)
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
      p.stay = s
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
        context.log(`(${players.length}) Left: ${socket.id}`)
        // Rimuovi giocatore dalla lista
        const index = players.findIndex((player) => player.id === socket.id);
        players.splice(index, 1);
        // Aggiorna i socket
        io.emit("updatePlayers", players);
    });

    // socket.on("draw", () => {
    //   let p = players.find(p => p.id === socket.id);
    //   context.log(p.name + " is drawing")
    //   drawCard(p);
    // })
});


// CREA MAZZO
const suits = ["spade", "cuori", "quadri", "picche"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const createDeck = () => {
  let d = [];
  for(let i=0; i<4; i++)
    for (let suit of suits) {
      for (let value of values) {
        deck.push({ suit, value });
      }
    }
  return d;
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
  // context.log('Utente pesca!')
  p.hand.push(deck.pop());
  io.to(p.id).emit("updatePlayerHand", p.hand);
  p.score = calcScore(p.hand)
  io.emit("updatePlayers", players);
}

const tableDraw = () => {
  table.hand.push(deck.pop());
  context.log('Tavolo pesca: ' + JSON.stringify(table.hand[table.hand.length-1]))
  context.log(deck.length +  ' Carte rimanenti')
  table.score = calcScore(table.hand)
  io.emit("updateTable", table);
}

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

const giveCards = () => {
  players.forEach(p => {
    // context.log("Dando mano a: " + p.name)
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
  context.log('Game started!')
  // Primo giro
  newRound();
  timer = setInterval(updateTimer, 1000);
  io.emit("updateTimeout", time_left);
}

const updateTimer = () => {
  // Controllo che ci siano dei giocatori
  // if(players.length < 1) {
  //   clearInterval(timer)
  //   timer = false
  //   context.log('Round interrotto')
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
 
const newRound = () => {
  let i

  if(deck.length < 60){
    context.log("New deck added!")
    let d = createDeck()
    d = shuffleDeck(d)
    deck.concat(d)
  }

  // Se i giocatori NON hanno finito di pescare
  if(!players.every(isStaying) && table.hand.length < 2){
    time_left = 15
    io.emit("updateTimeout", time_left);
    return
  }

  // Il tavolo pesca
  if(table.score < 17 && table.hand.length > 0){
    // while(table.score < 17 && table.hand.length > 0){
      // time_left = 20
      // io.emit("updateTimeout", time_left);
    tableDraw()
    i = setInterval(() => {
      if(table.score < 17 && table.hand.length > 0)
        tableDraw()
      else{
        clearInterval(i)
        checkWinners()
      }
    }, 1000);

    // }
    time_left = 10
    io.emit("updateTimeout", time_left);
    // setTimeout(function(){
    //   clearHands()
    // }, 3000);
    return
  }
  
  // Nuovo round da 0
  time_left = 15
  round++;
  context.log('New round! ' + round)
  newTable()
  giveCards()
  io.emit("updateTimeout", time_left);
}

const calcScore = (hand) => {
  let s = 0
  let ace = false;
  if(hand != undefined && hand.length > 0)
    hand.forEach(c => {
      if(c == undefined)
        return
      if(c.value == 'J' || c.value == 'Q' || c.value == 'K'){
        if(ace && s+10 <= 21)
          s += 10
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
  context.log("Server listening online");
});
