class DirectionInput {
    constructor() {
        // for improved responsiveness we use an array for the directions, that way previous inputs still register if they were never let go of

        // TODO: make a general user input class
        this.heldDirections = [];

        this.directionKeyMap = {
            "ArrowUp": "up",
            "KeyW": "up",
            "ArrowDown": "down",
            "KeyS": "down",
            "ArrowLeft": "left",
            "KeyA": "left",
            "ArrowRight": "right",
            "KeyD": "right",
        }

        this.activeKeys = {};

        const directions = ["up", "down", "left", "right"];

        directions.forEach(dir =>{
            const keysHeld = {}

            Object.keys(this.directionKeyMap).forEach(key => {
                if (this.directionKeyMap[key] === dir) {
                    keysHeld[key] = false
                }
            })

            this.activeKeys[dir] = keysHeld
        }) // this is to show which keys are currently responsible for each direction, questionable at best, but it is the simpliest implementation I can think of do handle multiple keys that can be used for each direction.
        
        console.log(this.activeKeys)
    }

    get direction(){
        return this.heldDirections[0]
    }

    init() {
        //tbh, this implementation is a mess, but it should work
        document.addEventListener("keydown", e => {
            if (e.repeat) {return} // I honestly feel like keydown was really unintuitive

            const dir = this.directionKeyMap[e.code];
            
            if (dir !== undefined){ 
                const i = this.heldDirections.indexOf(dir)
                if (i !== -1) { //niche situation, think pressing KeyA, then KeyS, then ArrowLeft, this "refreshes" the left direction without having duplicate directions  
                    this.heldDirections.splice(i, 1)
                }

                this.heldDirections.unshift(dir);
                this.activeKeys[dir][e.code] = true;
            }
        });
        document.addEventListener("keyup", e => {
            if (e.repeat) {return} // I don't even know how repeat works with keyup

            const dir = this.directionKeyMap[e.code];
            
            if (dir !== undefined){ 
                this.activeKeys[dir][e.code] = false;

                if (Object.keys(this.activeKeys[dir]).every(key => !this.activeKeys[dir][key])){
                    const i = this.heldDirections.indexOf(dir)
                    if (i !== -1) { 
                        this.heldDirections.splice(i, 1)
                    }
                }
            }
        })
    }
}

export default DirectionInput