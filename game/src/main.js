import { createApp } from 'vue'
import App from './App.vue'
import VueSocketIO from 'vue-3-socket.io'
import SocketIO from 'socket.io-client'

createApp(App).use(new VueSocketIO({
    debug: true,
    connection: SocketIO('http://localhost:3000', {
        // you use any options form here https://socket.io/docs/client-api/#new-Manager-url-options
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      }),
  })
).mount('#app')

