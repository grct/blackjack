const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,

  pwa: {
    name: 'Blackjack JS',
    themeColor: '#0e0e0e',
    msTileColor: '#0e0e0e',
    manifestOptions: {
      background_color: '#0e0e0e'
    }
  }
})
