import Battle from "./BattleModule/Battle";
import SceneTransition from "./SceneTransition";
import TextMessage from "./TextMessage";
import utils from "./utils";

class OverworldEvent {
    constructor({map, event}) {
        this.map = map;
        this.event = event;
    }

    stand(resolve) {
        const targetObject = this.map.gameObjects[this.event.target];
        targetObject.startBehaviour({
            map: this.map
        }, {
            type: "stand",
            direction: this.event.direction,
            time: this.event.time,
        })

        //Set up a handle to complete when correct person is done walking, then resolve the event
        const completeHandler = e => {
            if (e.detail.targetId === this.event.target) {
                document.removeEventListener("PersonStandingComplete", completeHandler)
                resolve()
            }
        }

        document.addEventListener("PersonStandingComplete", completeHandler)
    }

    walk(resolve) {
        const targetObject = this.map.gameObjects[this.event.target];
        targetObject.startBehaviour({
            map: this.map
        }, {
            type: "walk",
            direction: this.event.direction,
            retry: true // if the path is blocked, the person will attempt to move into the space on the nrext frame
        })

        //Set up a handle to complete when correct person is done walking, then resolve the event
        const completeHandler = e => {
            if (e.detail.targetId === this.event.target) {
                document.removeEventListener("PersonWalkingComplete", completeHandler)
                resolve()
            }
        }

        document.addEventListener("PersonWalkingComplete", completeHandler)
    }

    textMessage(resolve) {

        if (this.event.faceHero) {
            const obj = this.map.gameObjects[this.event.faceHero];
            // because the hero interacts with whatever is directly in front of him, we can just set the direction of the NPC to the oppiste of the hero's
            obj.direction = utils.getOppositeDirection(this.map.gameObjects["hero"].direction);
        }

        const message = new TextMessage({
            text: this.event.text,
            onComplete: () => resolve() // we are decoupling onComplete and resolve so that we may use it in other situations
        })

        message.init(document.querySelector("#" + this.map.elementId))
    }

    async changeMap(resolve) { // this function needs the async as this.map.overworld.loadMapData is an async function
        
        const sceneTransition = new SceneTransition();
        sceneTransition.init(document.querySelector("#" + this.map.elementId), async () => {
            this.map.overworld.startMap(await this.map.overworld.loadMapData(this.event.newMap));
            resolve();
            sceneTransition.fadeOut();
        })
    }

    battle (resolve) {
        const battle = new Battle({
            onComplete: () => {
                resolve();
            }
        })

        battle.init(document.querySelector("#" + this.map.elementId));
    }

    init() {
        return new Promise(resolve => {
            this[this.event.type](resolve)
        })
    }
}

export default OverworldEvent