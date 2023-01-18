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
      }), //options object is Optional
    // vuex: {
    //   store,
    //   actionPrefix: "SOCKET_",
    //   mutationPrefix: "SOCKET_"
    // }
  })
).mount('#app')



// import { createApp } from 'vue'
// import App from './App.vue'
// import VueSocketIO from 'vue-3-socket.io'

// const options = {'reconnection': true,'reconnectionDelay': 500,'maxReconnectionAttempts':Infinity}; //Options object to pass into SocketIO



// createApp(App).use(new VueSocketIO({
//     debug: true,
//     connection: ('http://localhost:3000', options), //options object is Optional
//     // vuex: {
//     //   store,
//     //   actionPrefix: "SOCKET_",
//     //   mutationPrefix: "SOCKET_"
//     // }
//   })
// ).mount('#app')
