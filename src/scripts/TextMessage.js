import KeyPressListener from "./KeyPressListener";
import TypewriterText from "./TypewriterText";

class TextMessage {
    constructor({text, onComplete}) {
        this.text = text;
        this.onComplete = onComplete;
        this.element = null;
    }

    createElement() {
        // Create the textbox div element;
        this.element = document.createElement("div");
        this.element.classList.add("TextMessage");

        this.element.innerHTML = (`
            <p class="TextMessage_p"></p>
            <button class="TextMessage_button">Next</button>
        `)
        
        // Initialize the typewriter text
        this.typewriterText = new TypewriterText({
            element: this.element.querySelector(".TextMessage_p"),
            text: this.text
        })



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

    finish() {

        if (this.typewriterText.isDone) {
            
            this.element.remove();
            this.actionListener.unbind();
            this.onComplete();
        } else { // the text is not finished appearing
            
            this.typewriterText.skipToDone();
        }
        
    }

    init(parentContainer) {
        this.createElement();
        parentContainer.appendChild(this.element)
        this.typewriterText.init()
    }
}

export default TextMessage