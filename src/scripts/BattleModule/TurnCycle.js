class TurnCycle {
    constructor({ battle, onNewEvent}){
        this.battle = battle;
        this.onNewEvent = onNewEvent;
        this.currentTeam = "player"; // or "enemy"
    }

    async turn(){
        //Get the caster
        const casterId = this.battle.activeCombatants[this.currentTeam];
        const caster = this.battle.combatants[casterId];
        const enemyId = this.battle.activeCombatants[caster.team === "player" ? "enemy" : "player"];
        const enemy = this.battle.combatants[enemyId];

        //Handle the submission of next move

        const submission = await this.onNewEvent({
            type: "submissionMenu",
            caster,
            enemy
        });

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
        
        // Switch the current team ant do another turn
        this.currentTeam = (this.currentTeam === "player") ? "enemy" : "player";
        this.turn();
    }

    async init() {

        // await this.onNewEvent({
        //     type: "textMessage",
        //     text: "The battle is starting!"
        // })

        // Start the first turn!
        this.turn();

    }
}

export default TurnCycle;