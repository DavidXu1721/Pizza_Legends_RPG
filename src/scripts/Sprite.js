import utils from "./utils";

class Sprite {
    constructor(config) {

        //Set up the image
        this.image = new Image();
        this.image.src = config.src;
        this.image.onload = () => {
            this.isLoaded = true;
        }

        //Shadow
        this.shadow = new Image();
        this.useShadow = true; //config.useShadow || false
        if (this.useShadow) {
            this.shadow.src = "/src/assets/characters/shadow.png";
            this.shadow.onload = () => {
                this.isShadowLoaded = true;
            }
        }
        

        //Configure Animation & Inital State
        this.animations = config.animations || {
            idle_down   : [[0, 0]],
            idle_right  : [[0, 1]],
            idle_up     : [[0, 2]],
            idle_left   : [[0, 3]],
            walk_down   : [[1, 0], [0, 0], [3, 0], [0, 0]],
            walk_right  : [[1, 1], [0, 1], [3, 1], [0, 1]],
            walk_up     : [[1, 2], [0, 2], [3, 2], [0, 2]],
            walk_left   : [[1, 3], [0, 3], [3, 3], [0, 3]]
        }

        this.currentAnimationName = config.currentAnimationName || "idle_down";
        this.currentAnimationFrame = 0;

        this.animationFrameLimit = config.animationFrameLimit || 16;
        this.animationFrameProgress = this.animationFrameLimit;

        //Reference the game object
        this.gameObject = config.gameObject;
    }

    get frame() {
        return this.animations[this.currentAnimationName][this.currentAnimationFrame];
    }

    setAnimation(key) {
        if (this.currentAnimationName !== key) {
            this.currentAnimationName = key;
            this.currentAnimationFrame = 0;
            this.animationFrameProgress = this.animationFrameLimit;
        }
    }

    updateAnimationProgress() {
        // Downtick frame progress
        if (this.animationFrameProgress > 0) {
            this.animationFrameProgress -= 1;
        } else { // Reset the counter
            this.animationFrameProgress = this.animationFrameLimit;
            this.currentAnimationFrame += 1;

            // after updating the frame index, check if the animation hasn't already reached the end and if so, loop the animation back to the starting frame 
            if (this.frame === undefined) {
                this.currentAnimationFrame = 0;
            }
        }
    }

    draw(ctx, cameraTarget) {

        // TODO: make it so that the cameratarget doesn't have to be a person
        const x = this.gameObject.x - 8 + utils.withGrid((utils.CONFIG_DATA.SCREEN_DIMENSIONS[0] - 1)/2) - cameraTarget.x; 
        const y = this.gameObject.y - 18 + utils.withGrid((utils.CONFIG_DATA.SCREEN_DIMENSIONS[1] - 1)/2) - cameraTarget.y;

        this.isShadowLoaded && ctx.drawImage(this.shadow, x, y);

        const [frameX, frameY] = this.frame;

        this.isLoaded && ctx.drawImage(this.image,
            frameX * 32, frameY * 32,
            32, 32,
            x, y,
            32, 32
        );

        this.updateAnimationProgress();
    }
}

export default Sprite