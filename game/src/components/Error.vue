<template>
  <div class="error-message" v-if="error.length > 1">
    <Cat/>
    <h1 v-if="error == 'crash'">Uups! We can't reach the server</h1>
    <a href="https://www.youtube.com/results?search_query=cute+cats" target="_blank">Go watch cute cats videos</a>
  </div>
</template>

<script>
import Cat from './Cat.vue'
export default {
  components: { Cat },
    name: 'ConnectionError',
    props: {
        error: String
    }
}
</script>

<style scoped>
@media only screen and (max-width: 768px){
  .error-message {
    font-size: 0.6rem !important;
  }
  .error-message > a {
    font-size: 0.8rem !important;
  }
}
.error-message {
    position: absolute;
    z-index: 150;
    left: 0;
    right: 0;
    top: 20%;
    bottom: 0;
    margin: auto;
    font-size: 0.5vw;
}
.error-message > h1 {
    margin-bottom: 2vh;
}
.error-message > a {
    font-size: 0.8vw;
    color: var(--primary);
}
</style>