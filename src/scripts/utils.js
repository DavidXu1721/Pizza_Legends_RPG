const utils = {
    CONFIG_DATA: {
        SCREEN_DIMENSIONS: [21, 13],
        GRID_SIZE: 16
    },

    /**
     * Converts a grid-based coordinate to pixel units.
     * Grid cell size is set in utils.CONFIG_DATA
     *
     * @param {number} n - The grid coordinate.
     * @returns {number} The pixel value corresponding to the grid coordinate.
     */
    withGrid(n) {
        return n * this.CONFIG_DATA.GRID_SIZE;
    },

    /**
     * Converts grid-based coordinates to a string
     *
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     * @returns {string} a coordinate key to check in a dict
     */

    asGridCoords(x,y) {
        return x*this.CONFIG_DATA.GRID_SIZE+','+y*this.CONFIG_DATA.GRID_SIZE;
    },

    nextPosition(initialX, initialY, direction) {
        let x = initialX;
        let y = initialY;
        const size = this.CONFIG_DATA.GRID_SIZE;
        switch (direction) {
            case 'left':
                x -= size;
                break;
            case 'right':
                x += size;
                break;
            case 'up':
                y -= size;
                break;
            case 'down':
                y += size;
                break;
            default:
                console.error("Error: Invalid Direction Parameter");
        }

        return [x,y];
    },

    emitEvent(name, detail) {
        const event = new CustomEvent(name, {
            detail
        });
        document.dispatchEvent(event);
    },

    /**
     * Waits until a given predicate returns true or a timeout is reached.
     *
     * @param {() => boolean} predicate - A synchronous function that returns a boolean.
     * @param {Object} [options] - Optional settings.
     * @param {number} [options.interval=16] - Time in milliseconds between checks.
     * @param {number} [options.timeout=5000] - Maximum time to wait before rejecting.
     * @returns {Promise<void>} Resolves when predicate returns true, rejects if timeout is exceeded.
     *
     * @example
     * await waitUntil(() => isDataLoaded(), { interval: 100, timeout: 3000 });
     */

    waitUntil(predicate, { interval = 16, timeout = 5000 } = {}) {
        let cancelled = false;

        const promise = new Promise((resolve, reject) => {
            const start = Date.now();

            const check = () => {
                if (cancelled) return;

                if (predicate()) {
                    resolve();
                } else if (Date.now() - start > timeout) {
                    reject(new Error("waitUntil: timeout exceeded"));
                } else {
                    console.log("waiting")
                    setTimeout(check, interval);
                }
            };

            check();
        });

        return {
            promise,
            cancel: () => { cancelled = true; }
        };
    },

    getOppositeDirection(direction) {
        switch (direction) {
            case 'left':
                return 'right';
            case 'right':
                return 'left';
            case 'up':
                return 'down';
            case 'down':
                return 'up';
            default:
                console.error("Error: Invalid Direction Parameter");
        }
    },

    wait(ms, { forceClear } = {}) {
        return new Promise((resolve) => {
            let timeoutId;
            let onForceClear;

            const cleanup = () => {
                clearTimeout(timeoutId);
                if (onForceClear) {
                    document.removeEventListener("keydown", onForceClear);
                }
            };

            // Optional early clear on key press
            if (forceClear) {
                onForceClear = (event) => {
                    if (event.code === forceClear) {
                        cleanup();
                        resolve();
                    }
                };
                document.addEventListener("keydown", onForceClear);
            }

            // Always clear after timeout
            timeoutId = setTimeout(() => {
                cleanup();
                resolve();
            }, ms);
        });
    },

    getAbsoluteOffsetFromBody( el ){   
        // finds the offset of el from the body or html element
        var _x = 0;
        var _y = 0;
        while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) )
        {
            _x += el.offsetLeft - el.scrollLeft + el.clientLeft;
            _y += el.offsetTop - el.scrollTop + el.clientTop;
            el = el.offsetParent;
        }
        return { top: _y, left: _x };
    },

    getAbsoluteOffsetFromGivenElement( el, relativeEl ){   
        // finds the offset of el from relativeEl
        var _x = 0;
        var _y = 0;
        while( el && el != relativeEl && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) )
        {
            _x += el.offsetLeft - el.scrollLeft + el.clientLeft;
            _y += el.offsetTop - el.scrollTop + el.clientTop;
            el = el.offsetParent;
        }
        return { top: _y, left: _x };
    },

    getAbsoluteOffsetFromRelative( el ){   
        // finds the offset of el from the first parent with position: relative
        var _x = 0;
        var _y = 0;

        let valString;
        while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) )
        {
            _x += el.offsetLeft - el.scrollLeft + el.clientLeft;
            _y += el.offsetTop - el.scrollTop + el.clientTop;
            el = el.offsetParent;
            if (el != null)
            {
                if (getComputedStyle !== 'undefined')
                    valString = getComputedStyle(el, null).getPropertyValue('position');
                else
                    valString = el.currentStyle['position'];
                if (valString === "relative")
                    el = null;
            }
        }
        return { top: _y, left: _x };
    },

    getRandomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)]
    },

    /**
     * Returns true with a specified probability, otherwise false
     *
     * @param {number} probability - A probability between 0 and 1
     * 
     * @returns {boolean} 
     *
     * @example
     */

    getRNG(probability) {
        if (probability < 0 || probability > 1){
            console.error("ERROR: probability must be between 0 and 1");
        }

        return (Math.random() < probability)
    }
    
}

export default utils

