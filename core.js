core = (function(){

    "use strict";

    var self,
    	local_screen,
        local_window,
        local_document,
        document_ready_event;

    function initialise() {

        local_document.removeEventListener(document_ready_event, initialise);

        deployScreen();

        /*
            This should be moved offsite eventually. I'm technically having one sibling act like a parent because the actual parent isn't around.
            Problem is... Right now I'm inside the contained area and the decision making for what exactly this bootup sequence boots up is supposed to happen outside this contained area (the parent) I haven't reached the point where I can define that area yet, I think, really, maybe, at night mostly. Soooo I'll have to make due with relation misuse I guess?

            How it's supposed to work, as I see it now: There is a config somewhere that defines what is loaded in this sequence. That list is read first and passed onto here. This initialise then blindly executes the appropriate protocols on each individual registered entry in that list. There should be no actual knowledge of what is inside that list here.

            What I could do ... is just build a quick array and loop over that, but it may actually cause me to blindly go down a dead end that is hard to come back from... so I'm hesitant.

            In fact... the screen deploy inside this initialise should actually be moved off site as well now that I think about it. The load sequence itself doesn't have any real relationship with what is being loaded. It just makes sure it is being loaded and what ever is being loaded follows the proper channels and protocols...

            I think need help with keeping an overview here before I move on in that direction.
        */

        //Just assume that the Editor still needs to construct n everything for now. We can segregate and congregate stuff later.
        editor.initialise();

    }

    function deployScreen() {

        // This could be seperated into a component initialisation protocol
        local_screen.style.position = "absolute";
        local_screen.style.top = '0px';
        local_screen.style.left = '0px';

        // This looks to be the responsibility of the display manager.
        local_document.body.appendChild(local_screen);

        /*
            I would like to move this through a central unit. So we can control the events using a single principle. Events are time based and since this is a single system, time management should be handled using a single unit to be able to relate different time frames to oneanother. (i.e. preventing situations where one compares 1 foot to the door with a lat,long,alt metric centralised in Bumsville, Idaho. It doesn't work without a single source of reference.)
        */
        local_window.addEventListener("resize", resizeScreen);

    }

    function resizeScreen() {

        local_screen.height = local_window.innerHeight;
        local_screen.width = local_window.innerWidth;

    }

    /*----------------------------------------------------------------
    -- Variable initialisation
    ----------------------------------------------------------------*/

    local_window = window;
    local_document = document;

    self = {};

    local_screen = local_document.createElement("canvas");

    document_ready_event = "DOMContentLoaded";

    local_document.addEventListener(document_ready_event, initialise);

    return self;

}());