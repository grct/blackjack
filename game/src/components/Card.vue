<template>
<div>
    <canvas width="35" height="47" ref="card" />
</div>
</template>

<script>
export default {
    name: 'CardSprite',
    computed: {
        x(){
            if(this.card.value == 'J')
                return -350
            if(this.card.value == 'Q')
                return -385
            if(this.card.value == 'K')
                return -420
            if(this.card.value == 'A')
                return -455
            return this.card.value * -35 + 35
        },
        y(){
            if(this.card.suit == 'fiori')
                return -47
            if(this.card.suit == 'quadri')
                return -94
            if(this.card.suit == 'picche')
                return -141
            return -0
        },
        image(){
            return new Image()
        },
        ctx(){
            return this.$refs.card.getContext("2d")
        }

    },
    props: {
        card: Object,
    },
    mounted(){
    this.image.onload = () => {
        // Draw the image into the canvas
        this.ctx.drawImage(this.image, this.x, this.y);
    };
    this.image.src = require("@/assets/sprites.png");
  }
}
</script>

<style scoped>
    @media only screen and (max-width: 768px){
        canvas {
            width: 9vh !important;
            height: 12vh !important;
        }
    }
    canvas {
        width: 9vw;
        height: 12vw;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: -webkit-crisp-edges;
    }
</style>

<!-- 
33 x 46
  1


Y 0 = cuori
Y -47 = fiori
Y -94 = quadri
Y -141 = picche

X 0 = retro
X -35 = 2
x -70 = 3

X 350 = jack
x 385 = donna
x 420 re
x 455 asso
 -->