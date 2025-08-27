import GameObject from "./GameObject";
import utils from "./utils";

class Person extends GameObject {
    constructor(config) {
        super(config);
        this.movingProgressRemaining = 0;
        this.standingProgressRemaining = 0; //TODO: the way it is now haveing a timeout in the "stand" behaviour code makes it so that if we pause the game, the standing time still "runs" so I want to have a standingProgressRemaining property that updates with the game loop
        this.isStanding = false; // this is to indicate when an NPC is currently in a stand command currently not necessary as I have already dealt with events not overriding other stand events
        this.isTryingToMove = false; // niche case, but in situations where NPCs are being blocked, I'd want them to still play the walking animation
        this.isPlayerControlled = config.isPlayerControlled || false

        this.directionVelocities = { 
            // NOTE: velocities may not be accurately reflected in game, since the player can't move faster than 16 pixels per frame and any overflow in the pixels travelled will be lost, (eg, velocity of 15 will mean that in 2 frames, the character should travel 30 pixels but that gets cut down to 16, effective speed is 8)
            // Due to the grid based movement of this game, this is fine for now.
            "up"    : ["y", -1],
            "down"  : ["y", 1],
            "left"  : ["x", -1],
            "right" : ["x", 1],
        }
    }

    update(state) {
        super.update(state);
        // console.log("Updating Person")

        // if(this.id === "npcB"){
        //     console.log(this.movingProgressRemaining)
        //     console.log(!this.isTryingToMove); 
        // }

        if (this.movingProgressRemaining > 0){
            // do  nothing, this is an artifact from previous bad code
        } else {
            // Case: We are keyboard ready and have an arrow pressed
            if (!state.map.isCutscenePlaying && state.arrow && this.isPlayerControlled) { 
                //This code fires then player has completed grid movement and now wants to start another one
                this.startBehaviour(state, {
                    type: 'walk',
                    direction: state.arrow,
                    retry: false //added for clarity
                })
                
            }
            
        }

        this.updatePosition(); // An incredibly pedantic pet peeve, but putting the update position here instead up in if else clause makes it so that the person will immediately start moving then they are able too, if we only called update position when this.movingProgressRemaining > 0then the player will be ever so slightly slower than NPCs

        // updating the animations needs to be done here and not in the 'else' block, since for NPCs the behaviours are executed in the super.update, and therefore will never be reached when the NPC is constantly walking 
        this.updateSpriteAnimations(state);
        
    }

    startBehaviour(state, behaviour) {
        //console.log(behaviour)
        // if (this.id === "npcB"){
        //     console.log(behaviour)
        // }

        if (!this.map.isCutscenePlaying || !behaviour.isRetry) { // if a cutscene is playing AND the move is a retry, we disregard the direction of the move, since we are going to terminate it.
            this.direction = behaviour.direction;
        }
       
        //console.log(this.id + ' ' + this.direction)

        
        switch (behaviour.type) {
            case "walk":
                // Stop here if the space is not free
                if (state.map.detectObstruction(this.x, this.y, this.direction)){
                    // we only set isTryingToMove to true when behaviour.retry is true since if this was a player in a non-cutscene event, trying to walk in an obstruction will cause isTryingToMove to become true, and it will only be set to false on the next successful movement, NOT when you let go of the direction, this will cause the hero's walking animation to play in cutscenes
                    if (behaviour.retry) {
                        // if the cutscene is playing, then don't continue trying to walk, otherwise, do. EXCEPT if the walk is actually a part of the cutscene (typically only relevant in parallel cutscene events)
                        if (!this.map.isCutscenePlaying || behaviour.isCutscene) {
                            console.log("KEEP TRYING!!!!");
                            
                            this.isTryingToMove = true
                            setTimeout(() => {
                                this.startBehaviour(state, {...behaviour, isRetry: true})
                            }, 10) // tbh I don't like this, as it detachs from the main game loop
                        } else {
                            console.log("ABORT");
                            this.isTryingToMove = false
                            utils.emitEvent("PersonWalkingComplete", {
                                targetId: this.id
                            })
                            this.behaviourLoopIndex -= 1;// we decrement the behaviourLoopIndex since we are going to have the continue retrying the move after the cutscene ends
                        }
                    }
                    
                    
                    return;
                };

                //Ready to walk!
                this.isTryingToMove = false;
                this.movingProgressRemaining = utils.withGrid(1);
                break;
            case 'stand':
                this.isStanding = true

                setTimeout(() => {
                    utils.emitEvent("PersonStandingComplete", {
                        targetId: this.id
                    })
                    this.isStanding = false
                }, behaviour.time)
                break;
            default:
                console.error(`Error: invalid behaviour type '${behaviour.type}'`);
                
        }

    }

    updatePosition() {
        const [axis, velocity] = this.directionVelocities[this.direction];
        
        const moveDist = Math.min(this.movingProgressRemaining, Math.abs(velocity)) // the most likely won't end up negative (aka, overshooting) but I', going to omit a 0 here so that it can "self-correct" just in case.

        if (velocity >= 0) { // moveDist is an absolute value so we need to look at the sign of the velocity
            this[axis] += moveDist;
        } else {
            this[axis] -= moveDist;
        }
        
        this.movingProgressRemaining -= moveDist;

        if (this.movingProgressRemaining === 0 && moveDist > 0 /* We also need to check if the person actually moved */) {
            //We finished the walk!
            utils.emitEvent("PersonWalkingComplete", {
                targetId: this.id
            })
            
        }
    }

    updateSpriteAnimations(state){

        if (this.isPlayerControlled && !state.map.isCutscenePlaying){ // chances are if a cut scene is playing, the player doesn't have control of any character, so we can consider every person as an NPC
            if (this.movingProgressRemaining === 0 && !state.arrow) {// the player is no longer moving/trying to move, start idle animations
                this.sprite.setAnimation("idle_" + this.direction);
            } else { // the player is either currently moving, or attempting to move
                this.sprite.setAnimation("walk_"+ this.direction); 
            }
        } else { // the person is an NPC
            // if(this.id === "npcB") {
            //     console.log(this.movingProgressRemaining)
            //     console.log(this.isTryingToMove)
            // }
            if (this.movingProgressRemaining === 0 && !this.isTryingToMove){
                this.sprite.setAnimation("idle_" + this.direction);
            } else { 
                this.sprite.setAnimation("walk_"+ this.direction); 
            }
        }
        
    }
}

export default Person