import utils from "../utils";

class PlayerState {
    constructor() {
        this.pizzas = {
            "p1": {
                pizzaId: "s001",
                hp: 0,
                maxHp: 50,
                xp: 95,
                maxXp: 100,
                level: 1,
                status: null, 
            },
            "p2": {
                pizzaId: "v001",
                hp: 1,
                maxHp: 50,
                xp: 75,
                maxXp: 100,
                level: 1,
                status: null, 
            },
            "p3": {
                pizzaId: "f001",
                hp: 50,
                maxHp: 50,
                xp: 75,
                maxXp: 100,
                level: 1,
                status: null, 
            }
        }
        this.lineup = ["p1", "p2"];
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