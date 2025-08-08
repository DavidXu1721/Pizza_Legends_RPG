import Overworld from './Overworld';

const GAME_CONTAINER_ID = 'pizza-legends-RPG';

(function() {
    const overworld = new Overworld({
        elementId : GAME_CONTAINER_ID
    });
    overworld.init();
})();