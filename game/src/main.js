import { createApp } from 'vue'
import App from './App.vue'
import VueSocketIO from 'vue-3-socket.io'
import SocketIO from 'socket.io-client'
import VueConfetti from 'vue-confetti'


createApp(App).use(VueConfetti).use(new VueSocketIO({
    debug: false,
    connection: SocketIO('https://blackjack-backend.azurewebsites.net', {
        // you use any options form here https://socket.io/docs/client-api/#new-Manager-url-options
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 3000,
      }),
  })
).mount('#app')

