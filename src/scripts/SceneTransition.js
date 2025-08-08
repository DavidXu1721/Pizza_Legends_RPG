class SceneTransition {
    constructor() {
        this.element = null;
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.classList.add("SceneTransition");
    }

    fadeOut(){
        this.element.classList.add("fade-out");
        this.element.addEventListener("animationend", () => {
            this.element.remove();
        }, {once: true})
    }

    init(parentContainer, callback) {
        this.createElement();
        parentContainer.appendChild(this.element);

        this.element.addEventListener("animationend", ()=> { // then the fade in animation has completed proceed to change the map or something
            callback();
        }, {once: true})
    }
}

export default SceneTransition;