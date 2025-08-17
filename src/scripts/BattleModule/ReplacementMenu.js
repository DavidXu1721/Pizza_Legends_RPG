import KeyboardMenu from "../KeyboardMenu";

class ReplacementMenu{
    constructor({ replacements, onComplete }){
        this.replacements = replacements;
        this.onComplete = onComplete;
    }

    decide() {
        this.menuSubmit(this.replacements[0])
    }

    menuSubmit(replacement) {
        this.keyboardMenu?.end();
        this.onComplete(replacement);
    }

    showMenu(container) {
        this.keyboardMenu = new KeyboardMenu();
        this.keyboardMenu.init(container);
        this.keyboardMenu.setOptions(this.replacements.map(replacement => {
            return {
                label: replacement.name,
                description: replacement.description,
                handler: () => {
                    this.menuSubmit(replacement)
                }
            }
        }));
    }

    init(container) {
        if (this.replacements[0].isPlayerControlled) { // imo not a great wayt do determine to team, but it works
            this.showMenu(container)
        } else {
            this.decide()
        }
        
    }
}

export default ReplacementMenu