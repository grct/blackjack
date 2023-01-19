<template>
  <main></main>
</template>

<script>
export default {
    name: 'ConfettiGen',
    methods: {
      start() {
        this.$confetti.start();
        this.$confetti.update({
          particles: [
            {
              type: 'rect',
            },
          ],
          defaultDropRate: 8,
          defaultSize: 4,
          particlesPerFrame: 1,
          defaultColors: [
            '#f5ef42',
            '#BB86FC',
            '#03DAC6',
            'white'
          ],
        });
      },
      stop() {
        this.$confetti.stop();
      },
    }
}
</script>

<style>

</style>