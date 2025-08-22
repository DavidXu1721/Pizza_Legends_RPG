import Battle from "./BattleModule/Battle";
import PauseMenu from "./PauseMenu";
import SceneTransition from "./SceneTransition";
import playerState from "./State/PlayerState";
import TextMessage from "./TextMessage";
import utils from "./utils";

class OverworldEvent {
    constructor({map, event}) {
        this.map = map;
        this.event = event;

        this._enemyDataCache = null // internal cache of the enemy data
    }

    async _getEnemyData() {
        if (!this._enemyDataCache) {
            const response = await fetch("./src/data/Enemies.json");
            this._enemyDataCache = await response.json();
            console.log("Successfully retrieved Enemies Data: "+ this._enemyDataCache);
        }
        return this._enemyDataCache
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
            retry: true // if the path is blocked, the person will attempt to move into the space on the next frame
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

    async battle (resolve) {
        const sceneTransition = new SceneTransition();
        sceneTransition.init(document.querySelector("#" + this.map.elementId), async () => {
            const battle = new Battle(this.map, {
                enemy: (await this._getEnemyData()).Enemies[this.event.enemyId],
                onComplete: (didWin) => {
                    console.log(didWin);
                    
                    resolve(didWin ? "WON_BATTLE": "LOST_BATTLE");
                }
            })

            battle.init(document.querySelector("#" + this.map.elementId));
            sceneTransition.fadeOut()
        })
    }

    pause(resolve) {
        console.log("PAUSE NOW!");
        this.map.isPaused = true;
        const menu = new PauseMenu(this.map ,{
            onComplete: () => {
                console.log("blah");
                
                resolve();
                this.map.isPaused = false;
                this.map.overworld.startGameLoop();
            }
        })
        
        menu.init(document.querySelector('#' + this.map.elementId));
    }

    addStoryFlag(resolve) {
        playerState.storyFlags[this.event.flag] = true;
        resolve();
    }

    init() {
        return new Promise(resolve => {
            this[this.event.type](resolve)
        })
    }
}

export default OverworldEvent