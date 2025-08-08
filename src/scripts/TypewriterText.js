class TypewriterText {
    constructor(config) {
        this.element = config.element;
        this.text = config.text;
        this.speed = config.speed || 15; //in characters per second
        this.endDelay = config.endDelay || 200; //this is to avoid the player accidently moving on when they actually wanted to skip to the fully revealed text

        this.timeout = null;
        this.isDone = false;
    }

    revealNextChar(charList){
        const next = charList.splice(0, 1)[0];
        next.span.classList.add("revealed");

        if (charList.length > 0) {
            this.timeout = setTimeout(() => {
                this.revealNextChar(charList)
            }, next.delayAfter)
        } else { // all characters are revealed
            this.timeout = setTimeout(() => {
                this.isDone = true;
            }, this.endDelay)
            
        }
    }
    
    skipToDone() {
        clearTimeout(this.timeout);
        this.isDone = true;

        this.element.querySelectorAll('span').forEach(spanElem => {
            spanElem.classList.add("revealed");
        })
    }

    init() {
        let characters = [];
        this.text.split('').forEach(char => {

            //Create each span with a single character, add to element in DOM
            let span = document.createElement("span");
            span.textContent = char;
            this.element.appendChild(span);

            //Add this span to our internal state array
            characters.push({
                span,
                delayAfter: char === " " ? 0 : 1000/this.speed
            })

        });

        this.revealNextChar(characters);
    }
}

export default TypewriterText;