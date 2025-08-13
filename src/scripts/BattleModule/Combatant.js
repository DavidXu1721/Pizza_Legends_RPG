import utils from "../utils";

class Combatant {
    constructor(config, battle) {
        Object.keys(config).forEach(key => {
            this[key] = config[key];
        })
        this.battle = battle;
    }

    get hpPercent() {
        const percent = this.hp / this.maxHp * 100;
        return percent > 0 ? percent : 0; // this is for adjusting the healthbar, obviously it can't be negative
    }

    get xpPercent() {
        return this.xp / this.maxXp * 100;
    }

    get isActive() {
        return this.battle.activeCombatants[this.team]===this.id
    }

    createElement() {
        this.hudElement = document.createElement("div");
        this.hudElement.classList.add("Combatant");
        this.hudElement.setAttribute("data-combatant", this.id);
        this.hudElement.setAttribute("data-team", this.team);
        this.hudElement.innerHTML = (`
            <p class="Combatant_name">${this.name}</p>
            <p class="Combatant_level"></p>
            <div class="Combatant_character_crop">
                <img class="Combatant_character" alt="${this.name}" src="${this.src}" />
            </div>
            <img class="Combatant_type" src="${this.icon}" alt="${this.type}" />
            <svg viewBox='0 0 26 3' class="Combatant_life-container">
                <rect x=0 y=0 width="0%" height=1 fill="#82ff71" />
                <rect x=0 y=1 width="0%" height=2 fill="#3ef126" />
            </svg>
            <svg viewBox='0 0 26 2' class="Combatant_xp-container">
                <rect x=0 y=0 width="0%" height=1 fill="#ffd76a" />
                <rect x=0 y=1 width="0%" height=1 fill="#ffc934" />
            </svg>
            <p class="Combatant_status"></p>
            
        `)

        this.pizzaElement = document.createElement("img");
        this.pizzaElement.classList.add("Pizza");
        this.pizzaElement.setAttribute("src", this.src );
        this.pizzaElement.setAttribute("alt", this.name );
        this.pizzaElement.setAttribute("data-team", this.team );

        this.hpFills = this.hudElement.querySelectorAll(".Combatant_life-container > rect");
        this.xpFills = this.hudElement.querySelectorAll(".Combatant_xp-container > rect")
    }

    update(changes={}) {
        //Update property changes incoming
        Object.keys(changes).forEach(key => {
            this[key] = changes[key]
        });

        //Update active flag to show the correct pizza & hud
        this.hudElement.setAttribute("data-active", this.isActive);
        this.pizzaElement.setAttribute("data-active", this.isActive);

        //Update HP & XP poercent fills
        this.hpFills.forEach(rect => rect.style.width = `${this.hpPercent}%`)
        this.xpFills.forEach(rect => rect.style.width = `${this.xpPercent}%`)
        
        //Update level on screen
        this.hudElement.querySelector(".Combatant_level").innerText = this.level;

        //Update status
        const statusElement = this.hudElement.querySelector(".Combatant_status");
        if (this.status) {
            statusElement.setAttribute("data-status", this.status.type);
            statusElement.innerText = `${this.status.type} | ${this.status.expiresIn}`;
            statusElement.style.display = "block";
        } else {
            statusElement.setAttribute("data-status", null);
            statusElement.innerText = "";
            statusElement.style.display = "none";
        }
    }

    getReplacedEvents(action) {
        // so basically, the "success" array of the action is the default array, and any extra conditions replace them, based on the position of each event, 
        let resultEvents = action.success
        console.log(resultEvents)

        if (this.status?.type === "clumsy"){
            resultEvents = resultEvents.map((value, index) => {
                return action.inClumsy[index] !== undefined ? action.inClumsy[index] : value
            })
            console.log(resultEvents)
            
            if (utils.getRNG(0.3)) { // the combatant failed the move
                
                resultEvents.splice(action.inClumsy.length, Infinity, 
                    //{"type": "animation", "animation": "clumsyFlop"},
                    {type: "textMessage", text: `${this.name} flops on its face!`}
                )
            } // else the combatant succeeds, do need to do anything further
        } 
        
        return resultEvents
    }

    getPostEvents() {

        if (this.status?.type === "saucy") {
            return[
                {type: "textMessage", text: `${this.name} is feelin' saucy!`},
                {type: "stateChange", recover: 5, onCaster: true}
            ]
        }

        return []
    }

    decrementStatus() {
        if (this.status?.expiresIn > 0) {
            this.status.expiresIn -= 1;
            if (this.status.expiresIn === 0){

                const expiredStatus = this.status; // we are setting the status to null, so we need to remember it for the text message
                
                this.update({
                    status: null
                })

                return{
                    type: "textMessage",
                    text: `${this.name} is no longer ${expiredStatus.type}!`
                }
            } else {
                this.update() // this is done so that the expires in label ticks down
            }
        } 
    }

    init(container){
        this.createElement();
        container.appendChild(this.hudElement);
        container.appendChild(this.pizzaElement);
        this.update();
    }
}

export default Combatant