import utils from "../utils";


const BattleAnimations = {
    async spin(event, onComplete) {
        const element = event.caster.pizzaElement;
        const animationClassName = event.caster.team === "player" ?
            "battle-spin-right" : "battle-spin-left"; // because the player is always on the left side

        element.classList.add(animationClassName);

        //Remove class when animation is fully complete
        element.addEventListener("animationend", () => {
            element.classList.remove(animationClassName);
        }, {once: true});

        //Continue battle cycle right arounf when the pizzas collide
        await utils.wait(100);
        onComplete();
    }
}

export default BattleAnimations