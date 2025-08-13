import KeyboardMenu from "../KeyboardMenu";

class SubmissionMenu {
    constructor({ caster, enemy, onComplete}) {
        this.caster = caster;
        this.enemy = enemy;
        this.onComplete = onComplete;
        this._actionDataCache = null; // internal cache of the action data
    }

    async getActionData() {
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
                        }
                    }
                ];
            case "attacks":
                let data
                try {
                    data = await this.getActionData()
                }catch (error) {
                    console.error("Error loading map:", error);
                }

                const actionData = data.Actions;

                return [
                    ...this.caster.actions.map(key => {
                        const action = actionData[key];
                        return {
                            label: action.name,
                            description: action.description,
                            handler: () => {
                                this.menuSubmit(action);
                            }
                        }
                    }),
                    backOption
                ]
            case "items":
                return [
                    //items will go here...
                    backOption
                ]
            default:
                console.error("Error: Invalid PageId, " + pageId);
        }

    }

    menuSubmit(action, instanceId=null){
        // we end the keyboardMenu since we have submitted what we want
        this.keyboardMenu?.end();

        this.onComplete({
            action,
            // if the move's targetType is friendly, we set the stateChangeTarget to the caster (may expand functionality in the future)
            target: action.targetType === "friendly" ? this.caster: this.enemy
        })
    }

    
    async decide() {
        // get the action data
        let data
        try {
            data = await this.getActionData()
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