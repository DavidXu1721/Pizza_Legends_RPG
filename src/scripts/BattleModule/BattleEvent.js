import TextMessage from "../TextMessage";
import utils from "../utils";
import BattleAnimations from "./BattleAnimations";
import ReplacementMenu from "./ReplacementMenu";
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
        .replace("{ACTION}", this.event.action?.name);

        const config = this.event.config || {};

        config.textSpeed = 200; // in the battle I want the text to be faster

        const message = new TextMessage({
            text, 
            config,
            onComplete: () => {
                resolve();
            }
        })
        message.init( this.battle.element )
    }

    async stateChange(resolve) {
        const {caster, target, damage, recover, status, action} = this.event;

        // we are actually going to have this function set up to only work in JUST ONE of the damage, recover, status, etc is not undefined/null;
        const changeArray = [damage, recover, status]
        
        if (changeArray.filter(change => (change)).length === 0) {
            console.error("ERROR: stateChange event has zero changes" + JSON.stringify(changeArray))
        } else if (changeArray.filter(change => (change)).length > 1) {
            console.error("ERROR: stateChange event has more than one change (must have EXACTLY one)" + JSON.stringify(changeArray))
        }

        let changeMessage
        let messageEvent

        let stateChangeTarget = this.event.onCaster ? caster : target;

        if (damage) {
            //modify the target to have less HP
            stateChangeTarget.update({
                hp: Math.max(0, target.hp - damage)
            })

            //start blinking
            target.pizzaElement.classList.add("battle-damage-blinking");

            this.battle.turnCycle.onNewEvent({type: "animation", animation: "hurt", target: target})

            messageEvent = {
                ...{type: "textMessage", text: `${damage} damage dealt to {TARGET}`, config: {isInstant: true, manualProgress: false, autoProgressEvent: "statusChangeAutoProgress"}},
                caster,
                target
            }
        }

        if (recover) {
            
            let newHp = stateChangeTarget.hp + recover;
            if(newHp > stateChangeTarget.maxHp) {
                newHp = stateChangeTarget.maxHp;
            }
            // update the target's hp, or the caster if event.onCaster is true
            stateChangeTarget.update({
                hp: newHp
            })

            messageEvent = {
                ...{type: "textMessage", text: `{TARGET} recovered ${recover} health`,  config: {isInstant: true, manualProgress: false, autoProgressEvent: "statusChangeAutoProgress"}},
                target: stateChangeTarget
            }
        }

        if (status) {
            if (status === "reset"){
                stateChangeTarget.update({
                    status: null
                })
                messageEvent = {
                    ...{type: "textMessage", text: `{TARGET} reset their status effects`,  config: {isInstant: true, manualProgress: false, autoProgressEvent: "statusChangeAutoProgress"}},
                    target: stateChangeTarget
                }
            } else {
                stateChangeTarget.update({
                    status: {...status} // make sure to pass a shallow copy instead of the memory address
                })
                messageEvent = {
                    ...{type: "textMessage", text: `{TARGET} became ${stateChangeTarget.status.type}`,  config: {isInstant: true, manualProgress: false, autoProgressEvent: "statusChangeAutoProgress"}},
                    target: stateChangeTarget
                }
            }
            
        }

        if (messageEvent){
            changeMessage = this.battle.turnCycle.onNewEvent(messageEvent)
        }

        // wait a little bit
        await utils.wait(1200, {forceClear: "Enter"}); // so the text message is technically not manually progressed but the utils does have a button (enter) to stop the wait early, 
        if (messageEvent){
            utils.emitEvent(messageEvent.config.autoProgressEvent);
        }

        // update Team components
        this.battle.playerTeam.update();
        this.battle.enemyTeam.update();

        // stop blinking, if the action didn't involve damage, then this doesn't mess anything up as we are removing nothing, the 600 ms timer still makes the state change event take some time
        target.pizzaElement.classList.remove("battle-damage-blinking");

        // wait for the player to process through the message
        await changeMessage;

        resolve();
    }

    submissionMenu(resolve) {
        const {caster} = this.event;
        const menu = new SubmissionMenu({
            caster: caster,
            enemy: this.event.enemy,
            items: this.battle.items,
            replacements: Object.values(this.battle.combatants).filter(c => {
                return c.id !== caster.id && c.team === caster.team && c.hp > 0
            }),
            onComplete: submission => {

                // submission { what move to use, who to use it on }
                resolve(submission)
            }
        })

        menu.init( this.battle.element )
    }

    replacementMenu(resolve) {
        const menu = new ReplacementMenu({
            replacements: Object.values(this.battle.combatants).filter(c => {
                return c.team === this.event.team && c.hp > 0
            }),
            onComplete: replacement => {
                resolve(replacement)
            }
        })

        menu.init( this.battle.element )
    }

    async replace(resolve) {
        const {replacement} = this.event;

        // Clear out the old combatant
        const prevCombatant = this.battle.combatants[this.battle.activeCombatants[replacement.team]];
        this.battle.activeCombatants[replacement.team] = null;
        prevCombatant.update();

        await utils.wait(400);
        // Bring the new pizza in
        this.battle.activeCombatants[replacement.team] = replacement.id;
        replacement.update();
        await utils.wait(400);

        // update Team components
        this.battle.playerTeam.update();
        this.battle.enemyTeam.update();
        
        resolve();
    }

    giveXp(resolve) {
        let xpRemaining = this.event.xp;
        const {combatant} = this.event;
        const step = () => {
            if (xpRemaining > 0) {
                xpRemaining -= 1;
                combatant.xp += 1;

                //Check if we hit a level up point
                if (combatant.xp >= combatant.maxXp) {
                    combatant.xp = combatant.xp - combatant.maxXp;
                    combatant.maxXp = 100;
                    combatant.level += 1;
                }

                combatant.update();
                requestAnimationFrame(step);
                return;
            } 
        }
        resolve();
        requestAnimationFrame(step)
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