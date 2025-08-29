import GameObject from "./GameObject";
import Person from "./Person";
import OverworldMap from "./OverworldMap";
import DirectionInput from "./DirectionInput";
import KeyPressListener from "./KeyPressListener";
import utils from "./utils";
import Hud from "./Hud";
import PizzaStone from "./PizzaStone";
import Progress from "./State/Progress";
import TitleScreen from "./TitleScreen";

const IGNORE_CACHE = true


class Overworld {
    constructor(config) {
        this.elementId = config.elementId;
        this.canvas = document.querySelector('#'+ this.elementId).querySelector(".game-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.map = null
        this._mapDataCache = null; // internal cache of the map data
        this._pizzaDataCache = null; // internal cache of the pizza data
    }

    get pizzaData(){ // that way, whenever any thing needs the data, it an just get it
        if (this._pizzaDataCache) {
            return this._pizzaDataCache
        } else {
            console.error("ERROR: pizzaDataCache is empty!");
        }
    }

    async getMapData() {
        if (!this._mapDataCache || IGNORE_CACHE) {
            const response = await fetch("./src/data/OverworldMaps.json");
            this._mapDataCache = await response.json();
            console.log("Successfully retrieved data: "+ JSON.stringify(this._mapDataCache));
        }
        return this._mapDataCache;
    }

    async getPizzaData() {
        if (!this._pizzaDataCache || IGNORE_CACHE) {
            const response = await fetch("./src/data/Pizzas.json");
            this._pizzaDataCache = await response.json();
            console.log("Successfully retrieved Pizzas Data: "+ this._pizzaDataCache);
        }
        return this._pizzaDataCache
    }

    async loadMapData(mapName) {
        console.log(mapName);
        
        let data;

        try {
            data = await this.getMapData()
        } catch (error) {
            console.error("Error loading map:", error);
        }

        const mapData = data[mapName];
        console.log("Turning the gameobject configs into objects");
        console.log(mapData);
        
        Object.keys(mapData.gameObjects).forEach(key => {
            if (key === "_comment"){
                delete mapData.gameObjects[key];
                return
            }

            mapData.gameObjects[key].id = key // this saves us from having to manually define the keys, since we aren't going to be able to access the "real" key from inside of the person

            let newObject

            switch (mapData.gameObjects[key].type){
                case "Person":
                    console.log("Initiating Person GameObject");
                    newObject = new Person(mapData.gameObjects[key]);
                    break;
                case "PizzaStone":
                    console.log("Initiating PizzaStone GameObject");
                    newObject = new PizzaStone(mapData.gameObjects[key]);
                    break;
                default:
                    console.log("No type specified, initiating Game Object");
                    newObject = new GameObject(mapData.gameObjects[key]);
            }

            mapData.gameObjects[key] = newObject;
        });

        console.log("Processing the walls data");
        const wallDict = {}
        mapData.walls.forEach(coords => {
            wallDict[utils.asGridCoords(coords[0], coords[1])] = true
        })
        mapData.walls = wallDict;

        console.log("Processing the cutsceneSpaces data");
        const cutsceneSpacesDict = {}
        mapData.cutsceneSpaces.forEach(spaceData =>{
            const key = utils.asGridCoords(spaceData.coords[0], spaceData.coords[1])
            if (cutsceneSpacesDict[key] !== undefined) {
                console.error("Error: Same space has more than one cutscene!");
            }
            cutsceneSpacesDict[key] = spaceData.data
        })
        mapData.cutsceneSpaces = cutsceneSpacesDict;

        console.log(mapData);
        return new OverworldMap(this, {...mapData, elementId: this.elementId});
    }

    startMap(map, heroInitialState = null){
        this.map = map;

        if (heroInitialState) {
            console.log(heroInitialState);
            this.map.gameObjects.hero.x = heroInitialState.x;
            this.map.gameObjects.hero.y = heroInitialState.y;
            console.log(heroInitialState.direction);
            
            this.map.gameObjects.hero.direction = heroInitialState.direction;
        }

        this.map.mountObjects(); // do this after adjusting the player location so that the collision is properly updated (the "repositioning" needs the map.moveWall function)
        console.log(map);
        
        this.progress.mapId = map.mapId;
        this.progress.startingHeroX = this.map.gameObjects.hero.x;
        this.progress.startingHeroY = this.map.gameObjects.hero.y;
        this.progress.startingHeroDirection = this.map.gameObjects.hero.direction;
        
        
    }

    gameLoopStepWork(delta) {

        if (this.map === null){ return ;}
        //Clear off the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        //Establish the camera person, currently it is the hero
        const cameraTarget = this.map.gameObjects.hero;

        //console.log(this.map.isCutscenePlaying? "In a cutscene": "Not in cutscene")

        //Update Game Objects
        Object.values(this.map.gameObjects).forEach(object => {
            object.update({
                delta,
                arrow: this.directionInput.direction,
                map: this.map
            });
        })

        //Draw Lower Layer
        this.map.drawLowerImage(this.ctx, cameraTarget);

        //Draw Game Objects
        Object.values(this.map.gameObjects).sort((a, b) => {
            return a.y - b.y;
        }).forEach(object => {
            object.sprite.draw(this.ctx, cameraTarget);
        })

        //Draw Upper Layer
        this.map.drawUpperImage(this.ctx, cameraTarget);

        if (this.map.isPaused) {
            this.ctx.fillStyle = "red";
            this.ctx.font = "20px Pixelify Sans";
            this.ctx.textAlign = "right";
            this.ctx.fillText("GAME PAUSED", utils.CONFIG_DATA.SCREEN_DIMENSIONS[0] * utils.CONFIG_DATA.GRID_SIZE + 9, 20.5);
        } else if (this.map.isCutscenePlaying) {
            this.ctx.fillStyle = "red";
            this.ctx.font = "20px Pixelify Sans";
            this.ctx.textAlign = "right";
            this.ctx.fillText("CUTSCENE PLAYING", utils.CONFIG_DATA.SCREEN_DIMENSIONS[0] * utils.CONFIG_DATA.GRID_SIZE + 9, 20.5);
        }
            
    }

    startGameLoop() {

        let previousMs;
        const step = 1/60;

        console.log("starting gameplay loop")
        const stepFn = (timestampMs) => {
            // console.log("stepping")

            if (this.map.isPaused) {
                return;
            }

            if (previousMs === undefined) {
                previousMs = timestampMs
            }
            
            let delta = (timestampMs - previousMs) / 1000;
            while (delta >= step) {
                this.gameLoopStepWork(delta)
                delta -= step
            }
            previousMs = timestampMs - delta * 1000;

            //Business as usual tick
            requestAnimationFrame(stepFn);
        }
        // First kickoff tick
        requestAnimationFrame(stepFn);
    }

    bindActionInput() {
        new KeyPressListener("Enter", () => {
            // is there a person here to talk to?
            console.log("performing action")
            this.map.checkForActionCutscene()
        })
        new KeyPressListener("Escape", () => {
            if (!this.map.isCutscenePlaying) { // I would want to make it so that you can pause in cutscenes, but I feel like that might break some stuff
                this.map.startCutscene([
                    {type: "pause"}
                ])
            }
        })
    }

    bindHeroPositionCheck() {
        document.addEventListener("PersonWalkingComplete", e => {
            if (e.detail.targetId === "hero") {
                // Hero's position has changed
                this.map.checkForFootstepCutscene()
            }
        })
    }

    async init() { 
        console.log("Hello from the Overworld", this);

        const gameContainer = document.querySelector('#'+ this.elementId)

        //Create a new Progress tracker
        this.progress = new Progress();

        //Show the title screen
        this.titleScreen = new TitleScreen({
            progress: this.progress
        })
        const useSaveFile = await this.titleScreen.init(gameContainer)

        //Load save data if it exists and the player chose to use it
        let initialHeroState = null;
        if (useSaveFile) {
            this.progress.load();
            initialHeroState = {
                x: this.progress.startingHeroX,
                y: this.progress.startingHeroY,
                direction: this.progress.startingHeroDirection,
            }
        }

        //Load the HUD
        this.hud = new Hud(this);
        this.hud.init(gameContainer);

        // Start the first map
        
        this.startMap(await this.loadMapData(this.progress.mapId), initialHeroState)

        // Create controls
        this.bindActionInput();
        this.bindHeroPositionCheck();

        this.directionInput = new DirectionInput();
        this.directionInput.init();
        
        // startGameLoop starts after the cutscene to prevent any initial behaviours from running
       
        // this.map.startCutscene([
        //     {type: "battle", enemyId: "erio"}
        //     //{type: "changeMap", newMap: "Kitchen"},
        //     //{type: "textMessage", text: "This is the very first message!"},
        //     // {target: "hero", type: "walk", direction: "down"},
        //     // {target: "hero", type: "walk", direction: "down"},
        //     // {target: "npcA", type: "walk", direction: "up"},
        //     // {target: "npcA", type: "walk", direction: "left"},
        //     // {target: "hero", type: "stand", direction: "right", time: 200},
        //     // {type:"textMessage", text: "WHY HELLO THERE!"},
        //     // {target: "npcB", type: "stand", direction: "up", time: 200},
        //     // {target: "npcB", type: "stand", direction: "left", time: 800},
        //     // {target: "npcB", type: "stand", direction: "down", time: 200},
        //     // {target: "npcB", type: "stand", direction: "right", time: 900},
        //     // {target: "hero", type: "walk", direction: "down"},
        //     // {target: "npcB", type: "walk", direction: "right"},
        //     // {target: "hero", type: "walk", direction: "down"},
        //     // {target: "npcB", type: "walk", direction: "right"},
        //     // {target: "npcB", type: "walk", direction: "right"},
        //     // {target: "npcA", type: "walk", direction: "left"},
        //     // {target: "npcA", type: "walk", direction: "left"},
        //     // {target: "npcA", type: "stand", direction: "up", time: 800},
        // ])

        this.startGameLoop();
    }
}

export default Overworld