import Combatant from "./BattleModule/Combatant";
import playerState from "./State/PlayerState";

class Hud {
    constructor(overworld) {
        this.overworld = overworld;

        this.scoreboards = [];
    }

    update() {
        this.scoreboards.forEach(s => { // remember these are combatants
            s.update(playerState.pizzas[s.id])
        })
    }

    async createElement() {

        // Clean up the current element, since we are replace it with a new one
        if (this.element) {
            this.element.remove();
            this.scoreboards = []; // don't forget to reset the scoreboard
        }

        this.element = document.createElement("div");
        this.element.classList.add("Hud");

        await this.overworld.getPizzaData();
        
        console.log(this.overworld.pizzaData);
        

        playerState.lineup.forEach(key => {
            const pizza = playerState.pizzas[key];
            const scoreboard = new Combatant({
                id: key,
                ...this.overworld.pizzaData.Pizzas[pizza.pizzaId],
                ...pizza,
            }, null)
            scoreboard.createElement();
            this.scoreboards.push(scoreboard);
            this.element.appendChild(scoreboard.hudElement);
        })
        this.update();
    }

    async init(container) {
        this.createElement();
        container.appendChild(this.element);

        document.addEventListener("PlayerStateUpdated", () => {
            this.update();
        })

        document.addEventListener("LineupChanged", () => {
            this.createElement();
            container.appendChild(this.element);
        })
    }
}

export default Hud;