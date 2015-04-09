////////////////////////////////////////////////////////////////
//
//  NOTES:
//
/*--------------------------------------------------------------

    

--------------------------------------------------------------*/

core = (function coreConstructor() {

    "use strict";

    var display,
        editor,
        document_ready_event;

    function initialise() {

        document.removeEventListener(document_ready_event, initialise);

        display = constructDisplay();

        /*
            This should be moved offsite eventually. I'm technically having one sibling act like a parent because the actual parent isn't around.
            Problem is... Right now I'm inside the contained area and the decision making for what exactly this bootup sequence boots up is supposed to happen outside this contained area (the parent) I haven't reached the point where I can define that area yet, I think, really, maybe, at night mostly. Soooo I'll have to make due with relation misuse I guess?

            How it's supposed to work, as I see it now: There is a config somewhere that defines what is loaded in this sequence. That list is read first and passed onto here. This initialise then blindly executes the appropriate protocols on each individual registered entry in that list. There should be no actual knowledge of what is inside that list here.

            What I could do ... is just build a quick array and loop over that, but it may actually cause me to blindly go down a dead end that is hard to come back from... so I'm hesitant.

            In fact... the screen deploy inside this initialise should actually be moved off site as well now that I think about it. The load sequence itself doesn't have any real relationship with what is being loaded. It just makes sure it is being loaded and what ever is being loaded follows the proper channels and protocols...

            I think I need help with keeping an overview here before I move on in that direction.
        */

        // Lets start building the editor itself.
        editor = constructEditor();

        display.renderCurrentDisplayList();

    }

    function constructDisplay() {

    // variable declarations

        var self,
            display_element,
            display_list;

    // function declarations

        function resizeDisplay() {

            display_element.height = window.innerHeight;
            display_element.width = window.innerWidth;

            renderCurrentDisplayList();

        }

        function addDisplayComponent(display_component) {

            display_list[display_component] = display_component;

        }

        function renderCurrentDisplayList() {

            var current_key,
                display_component,
                calculated_x,
                calculated_y,
                calculated_width,
                calculated_height;

            for (current_key in display_list) {

                display_component = display_list[current_key];

                if (display_component === undefined) {

                    throw new Error("found empty display_component?");

                }

                calculated_x = display_component.x;
                calculated_y = display_component.y;
                calculated_width = display_component.getAbsoluteOrRelativeWidth(display_element.width);
                calculated_height = display_component.getAbosluteOrRelativeHeight(display_element.height);
                


                if (display_component.relative_height !== null) {

                    calculated_height = display_component.relative_height * display_element.height;

                } else {

                    calculated_height = display_component.height;

                }

                drawRect(
                    display_element.getContext('2d'),
                    calculated_x,
                    calculated_y,
                    calculated_width,
                    calculated_height,
                    display_component.background_color
                );

            }

        }

        function drawPixel (g, x, y, color) {

            drawRect(g, x, y, 1, 1, color);

        }

        function drawRect (g, x, y, w, h, c) {

            var old_fill_style;

            old_fill_style = g.fillStyle

            g.fillStyle = c;
            g.fillRect(x, y, w, h);

            if (old_fill_style)
            {
                g.fillStyle = old_fill_style;
            }
        }

    // variable initiations

        display_list = {};

        display_element = document.createElement("canvas");
        console.log("ref to canvas:", display_element);
        // This could be seperated into a component initialisation protocol
        display_element.style.position = "absolute";
        display_element.style.top = '0px';
        display_element.style.left = '0px';

        resizeDisplay();

        self = {};

        self.addDisplayComponent = addDisplayComponent;
        self.renderCurrentDisplayList = renderCurrentDisplayList;

    // function body;

        // This looks to be the responsibility of the display manager?
        document.body.appendChild(display_element);

        /*
            I would like to move this through a central unit. So we can control the events using a single principle. Events are time based and since this is a single system, time management should be handled using a single unit to be able to relate different time frames to oneanother. (i.e. preventing situations where one compares 1 foot to the door with a lat,long,alt metric centralised in Bumsville, Idaho. It doesn't work without a single source of reference.)
        */

        window.addEventListener("resize", resizeDisplay);

    // Return statement

        return self;

    }

    function DisplayComponent() {

        function getAbsoluteOrRelativeWidth(related_width) {

            if (this.relative_width !== null) {

                return this.relative_width * related_width;

            } else {

                return this.width;

            }

        }

        function getAbosluteOrRelativeHeight(related_height) {

            if (this.relative_height !== null) {

                return this.relative_height * related_height;

            } else {

                return this.height;

            }

        }


        // Defaults
        this.x = 0;
        this.y = 0;
        this.width = 300;
        this.height = 200;
        this.background_color = "#000000";
        this.background_alpha = 0.8;
        this.border_size = 1;
        this.border_color = "#333333";
        this.relative_width = null;
        this.relative_height = null;

        this.getAbsoluteOrRelativeWidth = getAbsoluteOrRelativeWidth;
        this.getAbosluteOrRelativeHeight = getAbosluteOrRelativeHeight;

    }

    function constructEditor() {

        self = new DisplayComponent();

        self.relative_width = 1;
        self.relative_height = 1;

        self.background_color = "#101010";

        display.addDisplayComponent(self);

        return self;

    }

    document_ready_event = "DOMContentLoaded";

    document.addEventListener(document_ready_event, initialise);

}());