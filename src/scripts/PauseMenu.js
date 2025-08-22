import KeyboardMenu from "./KeyboardMenu";
import KeyPressListener from "./KeyPressListener";
import playerState from "./State/PlayerState";
import utils from "./utils";

class PauseMenu {
    constructor(map, {onComplete}) {
        this.map = map
        this.onComplete = onComplete;
    }

    async getOptions(pageKey) {
        const pizzaData = await this.map.overworld.getPizzaData()

        // Case 1: Show the first page of options
        if (pageKey === "root") {
            
            const lineupPizzas = playerState.lineup.map(id => {
                const {pizzaId} = playerState.pizzas[id];
                const base = pizzaData.Pizzas[pizzaId];
                return {
                    label: base.name,
                    description: base.description,
                    handler: () => {
                        // a strange implementation, but we are essentially using thie self reference to get the respective options should we need them (essentially every pizza other than the one selected)
                        this.keyboardMenu.setOptions( this.getOptions(id) )
                    }
                }
            })

            return [
                //....All of our pizzas (dynamic)
                ...lineupPizzas,
                {
                    label: "Save",
                    description: "Save your progress",
                    handler: () => {
                        //We'll come back to this...
                    }
                },
                {
                    label: "Close",
                    description: "Close the pause menu",
                    handler: () => {
                        this.close()
                    }
                }
            ]
        }

        // Case 2: Show the options for just one pizza (by id)
        const unequippedPizzas = Object.keys(playerState.pizzas).filter(id => {
            return playerState.lineup.indexOf(id) === -1;
        }).map(id => {
            const {pizzaId} = playerState.pizzas[id];
            const base = pizzaData.Pizzas[pizzaId];
            return {
                label: `Swap for ${base.name}`,
                description: base.description,
                handler: () => {
                    playerState.swapLineup(pageKey, id);
                    //return to the root after swapping
                    this.keyboardMenu.setOptions(this.getOptions("root"))
                }
            }
        })

        return [
            //Swap for any unequipped pizza...
            ...unequippedPizzas,
            {
                label: "Move to front",
                description: "Move this pizza to the front of the list",
                handler: () => {
                    playerState.moveToFront(pageKey); // this is because the pizza that we picked would me "pagekey"
                    //return to the root after moveing to front
                    this.keyboardMenu.setOptions(this.getOptions("root"))
                }
            },
            {
                label: "Back",
                description: "Back to pause menu",
                handler: () => {
                    this.keyboardMenu.setOptions(this.getOptions("root") );
                }
            }
        ];
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.classList.add("PauseMenu");
        this.element.innerHTML = (`
            <h2>Pause Menu</h2>    
        `)
    }

    close() {
        this.escBind?.unbind();
        this.keyboardMenu.end();
        this.element.remove();
        this.onComplete();
    }

    init(container) {
        this.createElement();
        this.keyboardMenu = new KeyboardMenu({
            descriptionContainer: {parent: container}
        })
        this.keyboardMenu.init(this.element);
        this.keyboardMenu.setOptions(this.getOptions('root'));

        container.appendChild(this.element);
        this.escBind = new KeyPressListener("Escape", 
            () => {
                this.close();
            }
        )
    }
}

export default PauseMenu;