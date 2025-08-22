class TurnCycle {
    constructor({ battle, onNewEvent, onWinner }){
        this.battle = battle;
        this.onNewEvent = onNewEvent; // this is from the Battle Class and makes a BattleEvent on every call
        this.onWinner = onWinner;
        this.currentTeam = "player"; // or "enemy"
    }

    async turn(){
        //Get the caster
        const casterId = this.battle.activeCombatants[this.currentTeam];
        //console.log(casterId);
        
        const caster = await this.battle.combatants[casterId];
        //console.log(caster);
        
        const enemyId = this.battle.activeCombatants[caster.team === "player" ? "enemy" : "player"];
        const enemy = await this.battle.combatants[enemyId];

        //Handle the submission of next move

        const submission = await this.onNewEvent({
            type: "submissionMenu",
            caster,
            enemy
        });

        //Stop here if we are replacing the current Pizza with another one from our team
        if (submission.replacement) {
            await this.onNewEvent({
                type: "replace",
                replacement: submission.replacement
            })
            await this.onNewEvent({
                type: "textMessage",
                text: `Go get 'em, ${submission.replacement.name}!`
            })
            this.nextTurn();
            return;
        }

        // other wise, we can process the rest of the move as usual, typically a replacement will use up your turn, so we are 
        if (submission.instanceId) { // this indicates that an item/consumable was used

            // Add to list to persist to player state later
            this.battle.usedInstanceIds[submission.instanceId] = true;

            // Removing item from battle state
            this.battle.items = this.battle.items.filter(item => item.instanceId !== submission.instanceId)
        }

        const resultingEvents = caster.getReplacedEvents(submission.action);

        for (let i=0; i<resultingEvents.length; i++) {
            const event = {
                ...resultingEvents[i],
                submission,
                action: submission.action,
                caster,
                target: submission.target,
            }

            await this.onNewEvent(event);
        }

        // Did the target die?
        const targetDead = submission.target.hp <= 0;
        if (targetDead) {
            await this.onNewEvent({
                type: "textMessage", text: `${submission.target.name} is ruined!`
            })

            if (submission.target.team === "enemy"){ // there's no point in giving the enemy exp

                const playerActivePizzaId = this.battle.activeCombatants.player;
                const playerActivePizza = this.battle.combatants[playerActivePizzaId];
                const xpAwarded = submission.target.givesXp;

                await this.onNewEvent({
                    type: "giveXp",
                    xp: xpAwarded,
                    combatant: playerActivePizza
                })
                await this.onNewEvent({
                    type: "textMessage", 
                    text: `${playerActivePizza.name} gained ${xpAwarded} xp!`
                })
            }
            
        }

        // Do we have a winning team?
        const winner = this.getWinningTeam();
        if (winner) {
            await this.onNewEvent({
                type: "textMessage",
                text: `${winner.toUpperCase()} WON !!!`
            })
            this.onWinner(winner)
            return;
        }
            

        // WE have a dead target, but still no winner, so bring in a replacement
        if (targetDead) {
            const newReplacement = await this.onNewEvent({
                type: "replacementMenu",
                team: submission.target.team
            })
            await this.onNewEvent({
                type: "replace",
                replacement: newReplacement
            })
            await this.onNewEvent({
                type: "textMessage",
                text: `${newReplacement.name} takes its place!`
            })
            this.nextTurn();
            return;
        }

        // Handle any post-submission events, status effect updates, etc
        const postEvents = caster.getPostEvents();
        for (let i=0; i < postEvents.length; i++) {
            const event = {
                ...postEvents[i],
                submission,
                action: submission.action,
                caster,
                target: submission.target,
            }

            await this.onNewEvent(event);
        }

        // Check if any status effects have expired
        const expiredEvent = caster.decrementStatus();
        if (expiredEvent) {
            await this.onNewEvent(expiredEvent)
        }
        
        // Switch the current team and do another turn
        this.nextTurn();
    }

    nextTurn() {
        this.currentTeam = this.currentTeam === "player" ? "enemy" : "player";
        this.turn();
    }

    getWinningTeam() {
        let aliveTeams = {};
        Object.values(this.battle.combatants).forEach(c => {
            if (c.hp > 0) {
                aliveTeams[c.team] = true;
            }
        })

        // I might want to add a case if both teams lose at the same time, but I feel like a draw should count as a loss in this game
        if (!aliveTeams["player"]) {return "enemy"}
        if (!aliveTeams["enemy"]) {return "player"}
        // If the code reaches here then there is no winning team
        return null;
    }

    async init() {

        await this.onNewEvent({
            type: "textMessage",
            text: `${this.battle.enemy.name} wants to throw down!`
        })

        // Start the first turn!
        this.turn();

    }
}

export default TurnCycle;