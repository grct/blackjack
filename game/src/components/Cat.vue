<template>
<div>
    <canvas width="30" height="30" ref="cat" />
</div>
</template>

<script>
export default {
    name: 'CatSprite',
    data(){
        return {
            CANVAS_WIDTH: 32,
            CANVAS_HEIGHT: 32,
            spriteWidth: 32,
            spriteHeight: 32,
            frameX: 0,
            frameY: 14,
            gameFrame: 0,
            staggerFrames: 7,
        }
    },
    computed: {
        ctx(){
            return this.$refs.cat.getContext("2d");
        },
        image(){
            return new Image();
        }
    },
    methods: {
        animate(){
            this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
            this.ctx.drawImage(this.image, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight,
            this.spriteWidth, this.spriteHeight, 0, 0, this.spriteWidth, this.spriteHeight);
            if(this.gameFrame % this.staggerFrames == 0){
                if(this.frameX<7) this.frameX++;
                else this.frameX = 0
            }

            this.gameFrame++;
            requestAnimationFrame(this.animate);
        }
    },
    mounted(){
        this.image.onload = () => {
            this.ctx.drawImage(this.image, this.x, this.y);
        };
        this.image.src = require("@/assets/cat.png");
        this.animate();
    }

}
</script>
    
<style scoped>
   @media only screen and (max-width: 768px){
    canvas {
        width: 18vh !important;
        height: 24vh !important;
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
