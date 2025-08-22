import OverworldEvent from "./OverworldEvent";
import playerState from "./State/PlayerState";
import utils from "./utils";

class OverworldMap {
    constructor(overworld, config) {
        this.elementId = config.elementId;
        this.overworld = overworld;
        this.gameObjects = config.gameObjects;
        this.walls = config.walls || {}; // places the player can't walk through
        this.cutsceneSpaces = config.cutsceneSpaces || {}; // places that trigger cutscenes when walked on

        // Initiating the lower and upper layers
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerSrc;
        
        this.upperImage = new Image();
        this.upperImage.src = config.upperSrc;

        this.isCutscenePlaying = false;
        this.isPaused = false;
    }

    drawLowerImage(ctx, cameraTarget) { // tbh this questionable naming convention will only be trouble some when we add more layers
        ctx.drawImage(this.lowerImage, 
            Math.round(utils.withGrid((utils.CONFIG_DATA.SCREEN_DIMENSIONS[0] - 1)/2) - cameraTarget.x), 
            Math.round(utils.withGrid((utils.CONFIG_DATA.SCREEN_DIMENSIONS[1] - 1)/2) - cameraTarget.y)
        )
    }

    drawUpperImage(ctx, cameraTarget) {
        ctx.drawImage(this.upperImage, 
            Math.round(utils.withGrid((utils.CONFIG_DATA.SCREEN_DIMENSIONS[0] - 1)/2) - cameraTarget.x), 
            Math.round(utils.withGrid((utils.CONFIG_DATA.SCREEN_DIMENSIONS[1] - 1)/2) - cameraTarget.y)
        )
    }

    detectObstruction(currentX, currentY, direction) {
        const coordinates = utils.nextPosition(currentX, currentY, direction);
        //console.log(coordinates);
        return this.walls[coordinates[0] +','+ coordinates[1]];
    }

    mountObjects() {
        Object.keys(this.gameObjects).forEach(key => {

            const object = this.gameObjects[key];

            //TODO: determine if this object should actually mount
            object.mount(this);

        })
    }

    async playEvent(eventPart) {
        const eventHandler = new OverworldEvent({
            event: eventPart,
            map: this
        })

        let result

        if (!eventPart.target) { // if the event didn't specify a target then we don't need to wait for the behaviour to complete
            result = await eventHandler.init();
        } else {
            
            // we need to wait for the character to finish their current behaviour event before doing the next one
            const {promise: behaviourCompletePromise} = utils.waitUntil(() => !this.gameObjects[eventPart.target].isBehaviourRunning)
        
            try {
                //console.log(behaviourCompletePromise)
                await behaviourCompletePromise
                //console.log("behaviour complete");
                //console.log(this.gameObjects[events[i].target].isBehaviourRunning + " should be false");
                //console.log(eventHandler)
                result = await eventHandler.init();
            } catch (e) {
                console.error(e);
            }
        }

        return result;
    }

    async startCutscene(events) {

        this.isCutscenePlaying = true; 

        for (let i=0; i<events.length; i++) {
            const currentEvent = events[i];

            let result 

            if (Array.isArray(currentEvent)){ // if the currentEvent is an array of events, that means that we are doing those events in parallel, and the cutscene will only continue when all the events are complete
                // in retrospect this would end up being kind of crazy if we did pause and battle events in parallel, so...
                // TODO: make safety nets to prevent that nonsense
                await Promise.all(currentEvent.map(eventPart => {
                    return this.playEvent(eventPart)
                }))
                
            } else {
                result = await this.playEvent(currentEvent) // WHY IS THIS RETURNING UNDEFINED????
                console.log(result);
            }
            
            if (result === "LOST_BATTLE") {
                break;
            }

        }

        this.isCutscenePlaying = false

    }

    checkForActionCutscene(){
        const hero = this.gameObjects["hero"];
        const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);

        const match = Object.values(this.gameObjects).find(object => {
            return `${object.x},${object.y}`=== `${nextCoords[0]},${nextCoords[1]}`
        }); 
        if (!this.isCutscenePlaying && match && match.talking.length) { // if the detected object has a talking event, and we are not already in a cutscene, play the cutscene
            
            const relevantScenario = match.talking.find(scenario => {
                return (scenario.requires || []).every(sf => {
                    console.log(sf);
                    console.log(playerState.storyFlags);
                    
                    
                    return playerState.storyFlags[sf]
                })
            })

            relevantScenario && this.startCutscene(relevantScenario.events)
        }
    }

    checkForFootstepCutscene(){
        const hero = this.gameObjects["hero"];
        const match = this.cutsceneSpaces[`${hero.x},${hero.y}`];

        if (!this.isCutscenePlaying && match && match.length) { // same as above
            this.startCutscene(match[0].events)
        }
    }

    addWall(x, y){
        this.walls[`${x},${y}`] = true;
    }
    removeWall(x, y){
        delete this.walls[`${x},${y}`];
    }
    moveWall(prevX, prevY, direction){
        this.removeWall(prevX, prevY);
        const [x,y] = utils.nextPosition(prevX, prevY, direction);
        this.addWall(x,y);
    }
}

export default OverworldMap