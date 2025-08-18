import KeyboardMenu from "../KeyboardMenu";

class SubmissionMenu {
    constructor({ caster, enemy, onComplete, items, replacements}) {
        this.caster = caster;
        this.enemy = enemy;
        this.onComplete = onComplete;

        this._actionDataCache = null; // internal cache of the action data

        let quantityMap = {};
        items.forEach(item => {
            if (item.team === caster.team) {

                let existingItemSlot = quantityMap[item.actionId];
                if (existingItemSlot) { // there is more than one copy of the item so we can put it in that slot
                    existingItemSlot.quantity += 1;
                } else {
                    quantityMap[item.actionId] = {
                        actionId: item.actionId,
                        quantity: 1,
                        instanceId : item.instanceId,
                    }
                }
            }
        })
        this.items = Object.values(quantityMap);
        
        this.replacements = replacements;
    }

    async _getActionData() {
        if (!this._actionDataCache) {
            const response = await fetch("./src/data/BattleActions.json");
            this._actionDataCache = await response.json();
            console.log("Successfully retrieved BattleActions Data: "+ this._actionDataCache);
        }
        return this._actionDataCache
    }

    async getPage(pageId) {
        const backOption = {
            label: "Go Back",
            description: "Return to the previous page",
            handler: () => {
                this.keyboardMenu.setOptions(this.getPage("root"))
            }
        }

        let actionData;  // kinda bs, but I need to declare it here
        
        switch (pageId) {
            case "root":
                return [
                    {
                        label: "Attack",
                        description: "Choose an attack",
                        handler: () => {
                            //Do something when chosen...
                            this.keyboardMenu.setOptions( this.getPage('attacks') )
                        }
                    },
                    {
                        label: "Items", 
                        description: "Choose an item",
                        disabled: false,
                        handler: () => {
                            //Go to items page...
                            this.keyboardMenu.setOptions( this.getPage('items') )
                        }
                    },
                    {
                        label: "Swap",
                        description: "Change to another pizza",
                        handler: () => {
                            //See pizza options
                            this.keyboardMenu.setOptions( this.getPage('replacements') )
                        }
                    }
                ];
            case "attacks":
                try {
                    actionData = (await this._getActionData()).Actions;
                }catch (error) {
                    console.error("Error loading map:", error);
                }

                return [
                    ...this.caster.actions.map(key => {
                        const action = actionData[key];
                        return {
                            label: action.name,
                            description: action.description,
                            handler: () => {
                                this.menuSubmitAction(action);
                            }
                        }
                    }),
                    backOption
                ]
            case "items":
                try {
                    actionData = (await this._getActionData()).Actions;
                }catch (error) {
                    console.error("Error loading map:", error);
                }

                return [
                    ...this.items.map(itemSlot => {
                        const action = actionData[itemSlot.actionId];
                        
                        return {
                            label: action.name,
                            description: action.description,
                            right: () => {
                                return "x" + itemSlot.quantity
                            },
                            handler: () => {
                                this.menuSubmitAction(action, itemSlot.instanceId);
                            }
                        }
                    }),
                    backOption
                ]
            case "replacements":
                return [
                    ...this.replacements.map(replacement => {
                        return {
                            label: replacement.name,
                            description: replacement.description,
                            handler: () => {
                                // Swap this pizza in
                                this.menuSubmitReplacement(replacement)
                            }
                        }
                    }),
                    backOption
                ]
            default:
                console.error("Error: Invalid PageId, " + pageId);
        }

    }

    menuSubmitReplacement(replacement) {
        this.keyboardMenu?.end();
        this.onComplete({
            replacement
        })
    }

    menuSubmitAction(action, instanceId=null){
        // we end the keyboardMenu since we have submitted what we want
        this.keyboardMenu?.end();

        this.onComplete({
            action,
            // if the move's targetType is friendly, we set the stateChangeTarget to the caster (may expand functionality in the future)
            target: action.targetType === "friendly" ? this.caster: this.enemy,
            instanceId
        })
    }

    
    async decide() {
        // get the action data
        let data
        try {
            data = await this._getActionData()
        }catch (error) {
            console.error("Error loading map:", error);
        }

        const actionData = data.Actions;

        //TODO: Enemies should randomly decide what to do
        this.onComplete({
            action: actionData[this.caster.actions[0]],
            target: this.enemy
        })
    }
    
    showMenu(container) {
        this.keyboardMenu = new KeyboardMenu();
        this.keyboardMenu.init(container);
        this.keyboardMenu.setOptions( this.getPage('root') );
    }

    async init(container) {
        if (this.caster.isPlayerControlled) {
            //Show some UI
            this.showMenu(container)
        } else{
            this.decide()
        }

    }
}

export default SubmissionMenu