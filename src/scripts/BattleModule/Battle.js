import BattleEvent from "./BattleEvent";
import Combatant from "./Combatant";
import Team from "./Team";
import TurnCycle from "./TurnCycle";

import playerState from "../State/PlayerState";

const ASSET_PATH = './src/assets'

// const response = await fetch("./src/data/Pizzas.json")
// const {Pizzas} = await response.json()
// const PIZZA_DATA = Pizzas;
// console.log("successfully retrieved Pizzas Data: "+ JSON.stringify(PIZZA_DATA));

class Battle {
    constructor({enemy, onComplete}) {
        this.enemy = enemy;
        this.onComplete = onComplete;

        this._pizzaDataCache = null; // internal cache of the pizza data

        this.combatants = {
            // "player1": new Combatant({
            //     ...PIZZA_DATA.s001,
            //     team: "player",
            //     hp: 1,
            //     maxHp: 50,
            //     xp: 95,
            //     maxXp: 100,
            //     level: 1,
            //     status: null,
            //     isPlayerControlled: true,
            // }, this),
            // "player2": new Combatant({
            //     ...PIZZA_DATA.s002,
            //     team: "player",
            //     hp: 50,
            //     maxHp: 50,
            //     xp: 75,
            //     maxXp: 100,
            //     level: 1,
            //     status: null,
            //     isPlayerControlled: true,
            // }, this),
            // "enemy1": new Combatant({
            //     ...PIZZA_DATA.v001,
            //     team: "enemy",
            //     hp: 1,
            //     maxHp: 50,
            //     xp: 30,
            //     maxXp: 100,
            //     level: 1,
            //     status: {type: "clumsy", expiresIn: 3},
            // }, this),
            // "enemy2": new Combatant({
            //     ...PIZZA_DATA.f001,
            //     team: "enemy",
            //     hp: 50,
            //     maxHp: 50,
            //     xp: 44,
            //     maxXp: 100,
            //     level: 1,
            //     status: null,
            // }, this) 
        }

        this.activeCombatants = {
            player: null, //"player1",
            enemy: null, //"enemy1"
        }
        
        this.items = [
            // {actionId: "item_recoverStatus", instanceId: "p1", team: "player"},
            // {actionId: "item_recoverStatus", instanceId: "p2", team: "player"},
            // {actionId: "item_recoverHp", instanceId: "q1", team: "player"},
            // {actionId: "item_recoverHp", instanceId: "q2", team: "player"},
            // {actionId: "item_recoverHp", instanceId: "q3", team: "player"},
            // {actionId: "item_recoverHp", instanceId: "q4", team: "player"},
            // {actionId: "item_recoverStatus", instanceId: "p3", team: "enemy"},
        ]
        
        this.usedInstanceIds = {};
    }

    async _getPizzaData() {
        if (!this._pizzaDataCache) {
            const response = await fetch("./src/data/Pizzas.json");
            this._pizzaDataCache = await response.json();
            console.log("Successfully retrieved Pizzas Data: "+ this._pizzaDataCache);
        }
        return this._pizzaDataCache
    }

    async addCombatant(id, team, config) {

        //Populate first active pizza
        // we have to do this first because of how await works, otherwise turncycle JS would be reading null
        // if the activeCombatant of that team was already set, when don't do anything, otherwise set it as the id given
        // TODO: fix a bug where the active combatant picked could be a pizza with ZERO health
        this.activeCombatants[team] = this.activeCombatants[team] || id

        this.combatants[id] = new Combatant({
            ...this._pizzaDataCache.Pizzas[config.pizzaId],
            ...config,
            team, 
            isPlayerControlled: team === "player"
        }, this)
        
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.classList.add("Battle");
        this.element.innerHTML = (`
            <div class="Battle_hero">
                <img src="${ASSET_PATH + '/characters/people/hero.png'}" alt="Hero" />
            </div>
            <div class="Battle_enemy">
                <img src="${ASSET_PATH + this.enemy.src}" alt="${this.enemy.src}" />
            </div>
            <canvas class="battle-effects-canvas" width="352" height="198"></canvas>
        `)
        this.effectsCanvas = this.element.querySelector(".battle-effects-canvas");
        this.effectsCtx = this.effectsCanvas.getContext("2d");
    }

    async init(container) {
        
        // load and wait for the Pizza data
        await this._getPizzaData();

        //Dynamically add the Player team
        playerState.lineup.forEach(id => {
            this.addCombatant(id, "player", playerState.pizzas[id])
        })
        //Now the enemy team
        Object.keys(this.enemy.pizzas).forEach(key => {
            //we prefix the id with a 'e_' to avoid conflicts
            this.addCombatant("e_"+ key, "enemy", this.enemy.pizzas[key])
        })

        // Add the player items
        playerState.items.forEach(item => {
            this.items.push({
                ...item,
                team: "player"
            })
        })

        this.createElement();
        container.appendChild(this.element);

        this.playerTeam = new Team("player", "Hero");
        this.enemyTeam = new Team("enemy", "Bully");

        Object.keys(this.combatants).forEach(key => {
            let currentCombatant = this.combatants[key]
            currentCombatant.id = key;
            currentCombatant.init(this.element)

            //Add to the correct team
            if (currentCombatant.team === 'player') {
                this.playerTeam.combatants.push(currentCombatant);
            } else if (currentCombatant.team === 'enemy') {
                this.enemyTeam.combatants.push(currentCombatant);
            }
        })

        this.playerTeam.init(this.element);
        this.enemyTeam.init(this.element);

        this.turnCycle = new TurnCycle({
            battle: this,
            onNewEvent: event => {
                return new Promise(resolve => {
                    const battleEvent = new BattleEvent(event, this);
                    battleEvent.init(resolve);
                })
            },
            onWinner: winner => {

                if (winner === "player") {
                    // if the player is a winner, we update the player state with the state of this.combatants at the end of the battle 
                    Object.keys(playerState.pizzas).forEach(id => {
                        const playerStatePizza = playerState.pizzas[id];
                        const combatant = this.combatants[id];
                        if (combatant) {
                            playerStatePizza.hp = combatant.hp;
                            playerStatePizza.xp = combatant.xp;
                            playerStatePizza.maxHp = combatant.maxHp;
                            playerStatePizza.maxXp = combatant.maxXp;
                            playerStatePizza.level = combatant.level;
                        }
                    })

                    //Get rid of any items that the player used using this.usedInstanceIds
                    playerState.items = playerState.items.filter(item => {
                        return !this.usedInstanceIds[item.instanceId]
                    })
                }

                // before calling onComplete, clean everything up
                this.element.remove()
                this.onComplete()
            }
        })

        this.turnCycle.init()

        // this.effectsCtx.strokeStyle = "rgba(0, 0, 0, 1)";
        // this.effectsCtx.beginPath();
        // this.effectsCtx.moveTo(0, 21.5);
        // this.effectsCtx.lineTo(352, 21.5);
        // this.effectsCtx.stroke();
        
    }
}

export default Battle;