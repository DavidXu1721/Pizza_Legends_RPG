const response = await fetch("./src/data/BattleActions.json");
const {Actions} = await response.json();
const ACTION_DATA = Actions;
console.log("successfully retrieved BattleActions Data: "+ JSON.stringify(ACTION_DATA));

class SubmissionMenu {
    constructor({ caster, enemy, onComplete}) {
        this.caster = caster;
        this.enemy = enemy;
        this.onComplete = onComplete;
    }

    decide() {
        this.onComplete({
            action: ACTION_DATA[this.caster.actions[0]],
            target: this.enemy
        })
    }

    init(container) {
        this.decide()
    }
}

export default SubmissionMenu