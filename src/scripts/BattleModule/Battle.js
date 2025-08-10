import BattleEvent from "./BattleEvent";
import Combatant from "./Combatant";
import TurnCycle from "./TurnCycle";

const ASSET_PATH = './src/assets'

const response = await fetch("./src/data/Pizzas.json")
const {Pizzas} = await response.json()
const PIZZA_DATA = Pizzas;
console.log("successfully retrieved Pizzas Data: "+ JSON.stringify(PIZZA_DATA));

class Battle {
    constructor() {
        this.combatants = {
            "player1": new Combatant({
                ...PIZZA_DATA.s001,
                team: "player",
                hp: 50,
                maxHp: 50,
                xp: 12,
                maxXp: 100,
                level: 1,
                status: {
                    type: "saucy",
                    expiresIn: 3
                },
            }, this),
            "enemy1": new Combatant({
                ...PIZZA_DATA.v001,
                team: "enemy",
                hp: 50,
                maxHp: 50,
                xp: 30,
                maxXp: 100,
                level: 1,
                status: null,
            }, this),
            "enemy2": new Combatant({
                ...PIZZA_DATA.f001,
                team: "enemy",
                hp: 50,
                maxHp: 50,
                xp: 44,
                maxXp: 100,
                level: 1,
                status: null,
            }, this)
        }   
        
        this.activeCombatants = {
            player: "player1",
            enemy: "enemy1"
        }
        
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.classList.add("Battle");
        this.element.innerHTML = (`
            <div class="Battle_hero">
                <img src="${ASSET_PATH + '/characters/people/hero.png'}" alt="Hero" />
            </div>
            <div class="Battle_enemy">
                <img src="${ASSET_PATH + '/characters/people/npc3.png'}" alt="Enemy" />
            </div>
        `)
    }

    init(container) {
        this.createElement();
        container.appendChild(this.element);

        Object.keys(this.combatants).forEach(key => {
            let currentCombatant = this.combatants[key]
            currentCombatant.id = key;
            currentCombatant.init(this.element)
        })

        this.turnCycle = new TurnCycle({
            battle: this,
            onNewEvent: event => {
                return new Promise(resolve => {
                    const battleEvent = new BattleEvent(event, this);
                    battleEvent.init(resolve);
                })
            }
        })

        this.turnCycle.init()
    }
}

export default Battle;