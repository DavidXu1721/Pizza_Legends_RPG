import TextMessage from "../TextMessage";
import utils from "../utils";
import BattleAnimations from "./BattleAnimations";
import SubmissionMenu from "./SubmissionMenu";

class BattleEvent {
    constructor(event, battle) {
        this.event = event;
        this.battle = battle;
    }

    textMessage(resolve) {
        const text = this.event.text
        .replace("{CASTER}", this.event.caster?.name)
        .replace("{TARGET}", this.event.target?.name)
        .replace("{ACTION}", this.event.action?.name)

        const isInstant = this.event.isInstant

        const message = new TextMessage({
            text, 
            isInstant,
            onComplete: () => {
                resolve();
            }
        })
        message.init( this.battle.element )
    }

    async stateChange(resolve) {
        const {caster, target, damage, recover} = this.event;

        let changeMessage 

        if (damage) {
            //modify the target to have less HP
            target.update({
                hp: target.hp - damage
            })

            //start blinking
            target.pizzaElement.classList.add("battle-damage-blinking");

            const messageEvent = {
                ...{type: "textMessage", text: `${damage} damage dealt to {TARGET}`, isInstant: true},
                caster,
                target
            }
            
            changeMessage = this.battle.turnCycle.onNewEvent(messageEvent)
        }

        if (recover) {
            const recoverTarget = this.event.onCaster ? caster : target;
            let newHp = recoverTarget.hp + recover;
            if(newHp > recoverTarget.maxHp) {
                newHp = recoverTarget.maxHp;
            }
            recoverTarget.update({
                hp: newHp
            })
        }

        // wait a little bit
        await utils.wait(600);

        // stop blinking, if the action didn't involve damage, then this doesn't mess anything up as we are removing nothing, the 600 ms timer still makes the state change event take some time
        target.pizzaElement.classList.remove("battle-damage-blinking");

        // wait for the player to process through the message
        await changeMessage;

        resolve();
    }

    submissionMenu(resolve) {
        const menu = new SubmissionMenu({
            caster: this.event.caster,
            enemy: this.event.enemy,
            onComplete: submission => {

                // submission { what move to use, who to use it on }
                resolve(submission)
            }
        })

        menu.init( this.battle.element )
    }

    animation(resolve) {
        const fn = BattleAnimations[this.event.animation];
        fn(this.event, resolve);
    }

    init(resolve) {
        this[this.event.type](resolve);
    }
}

export default BattleEvent