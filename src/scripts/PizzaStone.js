import GameObject from "./GameObject";
import Sprite from "./Sprite";
import playerState from "./State/PlayerState";

class PizzaStone extends GameObject {
    constructor(config) {
        super(config);
        this.sprite = new Sprite({
            gameObject: this,
            src: "/src/assets/characters/pizza-stone.png",
            animations: {
                "used-down": [ [0, 0] ],
                "unused-down": [ [1, 0] ],
            },
            currentAnimationName: "used-down"
        })
        this.storyFlag = config.storyFlag;
        this.pizzas = config.pizzas;

        this.talking = [
            {
                requires: [this.storyFlag],
                events: [
                    {type: "textMessage",pause: true, text: "You have already used this.", config: {isInstant: true}},
                ]
            },
            {
                events: [
                    {type: "craftingMenu", pizzas: this.pizzas},
                    {type:"addStoryFlag", flag: this.storyFlag}
                ]
            }
        ]

    }

    update() {
        if (playerState.storyFlags[this.storyFlag]) { // using storyflags... it is smart ngl
            this.sprite.currentAnimationName = "used-down";
        } else {
            this.sprite.currentAnimationName = "unused-down";
        }
    }
}

export default PizzaStone;