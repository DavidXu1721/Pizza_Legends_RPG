import OverworldEvent from "./OverworldEvent";
import Sprite from "./Sprite";
import utils from "./utils";


class GameObject {
    constructor(config) {
        this.id = config.id || "#missingID"
        this.isMounted = false;
        this.x = utils.withGrid(config.x) || 0;
        this.y = utils.withGrid(config.y) || 0;
        this.direction = config.direction || 'down';
        this.sprite = new Sprite({
            gameObject: this,
            src: config.src || '/src/assets/characters/people/hero.png',
            useShadow: config.type === "Person"
        });

        this.behaviourLoop = config.behaviourLoop || [];
        this.behaviourLoopIndex = 0;
        this.isBehaviourRunning = false

        this.talking = config.talking || [];
    }

    mount(map) {
        console.log("mounting");
        
        this.isMounted = true; 

        this.map = map;
    }

    update() {
        // console.log("Updating GameObject")
        this.sprite.updateAnimationProgress();
        
        this.isBehaviourRunning || this.doBehaviourEvent(this.map);
    }

    async doBehaviourEvent(map) {

        //Don't do anything if there is a more important cutscene or if there aren't any behaviours in the first place
        if (map.isCutscenePlaying || this.behaviourLoop.length === 0) {
            return;
        }

        this.isBehaviourRunning = true

        // Setting up our event with relevant info
        let eventConfig = this.behaviourLoop[this.behaviourLoopIndex];
        eventConfig.target = this.id;

        //Create an event instance out of our next event config
        const eventHandler = new OverworldEvent({ map, event: eventConfig });
        //console.log(`initializing event for ${this.id}`)
        //console.log(eventConfig);
        
        await eventHandler.init();
        
        //Setting the next event to fire
        this.behaviourLoopIndex += 1;
        if (this.behaviourLoopIndex === this.behaviourLoop.length) {
            this.behaviourLoopIndex = 0;
        }

        //Set isBehaviourRunning to false so that it can be done again next update
        //console.log(eventHandler);
        //console.log("completed");
        
        this.isBehaviourRunning = false
    }
}

export default GameObject