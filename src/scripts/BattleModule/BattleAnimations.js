import KeyPressListener from "../KeyPressListener";
import utils from "../utils";

function setupCleanup(element /* the element that the eventListener is attached to*/, cleanUpCallback) {
    const onAnimationEnd = () => {
        cleanUpCallback()
        skipAnimationBind.unbind();
    }

    element.addEventListener("animationend", onAnimationEnd, {once: true});

    const skipAnimationBind = new KeyPressListener("Enter", () => {
        //console.log("skipping animation animation")
        cleanUpCallback()
        element.removeEventListener("animationend", onAnimationEnd)
        skipAnimationBind.unbind();
    })
}

const BattleAnimations = {
    async spin1(event, onComplete) {
        const pizzaElement = event.caster.pizzaElement;
        const animationClassName = event.caster.team === "player" ?
            "battle-spin1-right" : "battle-spin1-left"; // because the player is always on the left side

        pizzaElement.classList.add(animationClassName);

        //Remove class when animation is fully complete
        setupCleanup(pizzaElement, () => {pizzaElement.classList.remove(animationClassName);})

        //Continue battle cycle right arounf when the pizzas collide
        await utils.wait(100, {forceClear: "Enter"});
        onComplete();
    },

    async spin2(event, onComplete) {
        const pizzaElement = event.caster.pizzaElement;
        const animationClassName = event.caster.team === "player" ?
            "battle-spin2-right" : "battle-spin2-left"; // because the player is always on the left side

        pizzaElement.classList.add(animationClassName);

        //Remove class when animation is fully complete
        setupCleanup(pizzaElement, () => {pizzaElement.classList.remove(animationClassName);})

        //Continue battle cycle right around when the pizzas collide
        await utils.wait(400, {forceClear: "Enter"});
        onComplete();
    },

    async glob(event, onComplete) {
        const {caster} = event;
        const globDiv = document.createElement("div");
        globDiv.classList.add("glob-orb");
        globDiv.classList.add(caster.team === "player" ? "battle-glob-right": "battle-glob-left");
        
        globDiv.innerHTML = (`
            <svg viewBox="0 0 32 32" width="32" height="32">
                <circle cx="16" cy="16" r="16" fill="${event.color}" />  
            <svg>
        `)
        
        //Remove element when the animation is complete
        setupCleanup(globDiv, () => {globDiv.remove()})

        //Add to scene
        document.querySelector(".Battle").appendChild(globDiv);

        await utils.wait(820, {forceClear: "Enter"});
        onComplete();
    },

    // async sauce(event, onComplete){

    //     const pizzaElement = event.target.pizzaElement;
    //     const sauceDiv = document.createElement("div");
    //     sauceDiv.classList.add("sauce-effect");
    //     pizzaElement.appendChild(sauceDiv);
    // },

    hurt(event, onComplete) {
        
        const pizzaElement = event.target.pizzaElement;
        pizzaElement.classList.add("battle-damage-effect");
        setupCleanup(pizzaElement, () => {pizzaElement.classList.remove("battle-damage-effect");})
        //Continue battle cycle immediately for this one
        onComplete();
    }
}

export default BattleAnimations