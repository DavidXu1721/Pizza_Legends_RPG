import KeyPressListener from "./KeyPressListener";
import TypewriterText from "./TypewriterText";

class TextMessage {
    constructor({text, config={}, onComplete}) {
        this.text = text;
        this.textSpeed = config.textSpeed || undefined;
        this.isInstant = config.isInstant || false; // determines if the typewriter effect will play or if all the text shows up immediately
        this.manualProgress = config.manualProgress !== undefined? config.manualProgress: true ; // determines if the player can manually progress using the enter key or "next" button
        this.autoProgressEvent = config.autoProgressEvent || null; // this the event key, that if emited, will cause the textMessage to automatically progress
        this.onComplete = onComplete;
        this.element = null;
    }

    createElement() {
        // Create the textbox div element;
        this.element = document.createElement("div");
        this.element.classList.add("TextMessage");

        this.element.innerHTML = (`
            <p class="TextMessage_p"></p>
            ${this.manualProgress? '<button class="TextMessage_button">Next</button>': ''}
        `)
        
        // Initialize the typewriter text
        this.typewriterText = new TypewriterText({
            element: this.element.querySelector(".TextMessage_p"),
            text: this.text,
            speed: this.textSpeed
        })

        if (this.manualProgress) {
            this.element.querySelector('button').addEventListener("click", () => { // gets disconnected when the element is removed, so this is fine, without a removeEventListener
                // Close the text message
                this.finish();
            });
            this.actionListener = new KeyPressListener("Enter", () => {
                console.log("progressing text message")
                this.finish();
                //this.done();
            })
        }
        
        if (this.autoProgressEvent) {
            console.log(this.autoProgressEvent);
            
            document.addEventListener(this.autoProgressEvent, () => {
                if (!this.typewriterText.isDone) {
                    this.typewriterText.skipToDone();
                }
                this.finish();
            }, {once: true})
        }
    }

    finish() {

        if (this.typewriterText.isDone) {
            
            this.element.remove();
            this.actionListener && this.actionListener.unbind();
            this.onComplete();
        } else { // the text is not finished appearing
            
            this.typewriterText.skipToDone();
        }
        
    }

    init(parentContainer) {
        this.createElement();
        parentContainer.appendChild(this.element)
        this.typewriterText.init()

        if (this.isInstant) { // the text message is to be completed instantly
            this.typewriterText.skipToDone();
        }
    }
}

export default TextMessage