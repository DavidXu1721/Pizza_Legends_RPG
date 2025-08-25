import utils from "../utils";

class PlayerState {
    constructor() {
        this.pizzas = {
            // "p1": {
            //     pizzaId: "s001",
            //     hp: 50,
            //     maxHp: 50,
            //     xp: 95,
            //     maxXp: 100,
            //     level: 1,
            //     status: null, 
            // },
            // "p2": {
            //     pizzaId: "v001",
            //     hp: 1,
            //     maxHp: 50,
            //     xp: 75,
            //     maxXp: 100,
            //     level: 1,
            //     status: null, 
            // },
            // "p3": {
            //     pizzaId: "f001",
            //     hp: 50,
            //     maxHp: 50,
            //     xp: 75,
            //     maxXp: 100,
            //     level: 1,
            //     status: null, 
            // }
        }
        this.lineup = [];
        this.items = [
            {actionId: "item_recoverStatus", instanceId: "item1"},
            {actionId: "item_recoverHp", instanceId: "item2"},
            {actionId: "item_recoverStatus", instanceId: "item3"}
        ]
        this.storyFlags = {
            // "DID_SOMETHING": true,
            // "DEFEATED_FIRST_BOSS": true
            // "TALKED_TO_ERIO": true
        }
    }

    addPizza(pizzaId) {
        const newId = `p${Date.now()}` + Math.floor(Math.random() * 99999); // it's incredibly unlikely that a duplicate id will be made
        this.pizzas[newId] = {
            pizzaId,
            hp: 50,
            maxHp: 50,
            xp: 0,
            maxXp: 100,
            level: 1,
            status: null,
        }
        if (this.lineup.length < 3) { // if there is space in the player's lineup, then add the id to the lineup
            this.lineup.push(newId)
        }
        utils.emitEvent("LineupChanged");
        console.log(this)

    }

    swapLineup(oldId, incomingId) {
        const oldIndex = this.lineup.indexOf(oldId);
        this.lineup[oldIndex] = incomingId;
        utils.emitEvent("LineupChanged");
    }

    moveToFront(futureFrontId) {

        this.lineup = this.lineup.filter(id => id !== futureFrontId);
        this.lineup.unshift(futureFrontId);
        utils.emitEvent("LineupChanged");
    }
}

export default new PlayerState();