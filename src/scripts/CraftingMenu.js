import KeyboardMenu from "./KeyboardMenu";
import playerState from "./State/PlayerState";

class CraftingMenu {
    constructor(map, {pizzas, onComplete}) {
        this.map = map
        this.pizzas = pizzas;
        this.onComplete = onComplete;
    }

    async getOptions(){
        const pizzaData = await this.map.overworld.getPizzaData()

        return this.pizzas.map(id => {
            const base = pizzaData.Pizzas[id];
            return {
                label: base.name,
                description: base.description,
                handler: () => {
                    //create a way to add a pizza to PlayerState
                    playerState.addPizza(id);
                    this.close();
                }
            }
        })
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.classList.add("CraftingMenu");
        this.element.classList.add("overlayMenu");
        this.element.innerHTML = (`
            <h2>Create a Pizza</h2>
        `)
    }

    close() {
        this.keyboardMenu.end();
        this.element.remove();
        this.onComplete();
    }

    async init(container) {
        this.createElement();
        console.log(this.element);
        
        this.keyboardMenu = new KeyboardMenu({
            descriptionContainer: {parent: container}
        })
        this.keyboardMenu.init(this.element)
        this.keyboardMenu.setOptions(await this.getOptions())

        container.appendChild(this.element)
    }
}

export default CraftingMenu;