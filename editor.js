////////////////////////////////////////////////////////////////
//
//  NOTES:
//
/*--------------------------------------------------------------

    

--------------------------------------------------------------*/

var core = (function coreConstructor() {

    "use strict";

    var display,
        editor,
        document_ready_event;

    function isUndefined(value) {

        return (typeof value === "undefined");

    }

    ////////////////////////////////////////////////////////////////
    // DISPLAY
    ////////////////////////////////////////////////////////////////
    function constructDisplay() {

        // variable declarations

        var display,
            display_element,
            display_list;

        // function declarations

        // function drawRect(g, x, y, width, height, color) {

        //     var old_fill_style;

        //     old_fill_style = g.fillStyle;

        //     g.fillStyle = color;
        //     g.fillRect(x, y, width, height);

        //     if (old_fill_style) {

        //         g.fillStyle = old_fill_style;

        //     }
        // }

        // function drawPixels(g, pixel_list) {

        //     var pixel;

        //     for (pixel in pixel_list) {

        //         drawRect(g, pixel.x, pixel.y, 1, 1, pixel.color);

        //     }

        // }

        /*
            This just prints out a list of lines but could be made smarter in the future by some smart sorts to figure out gaps or clumps of lines that can be drawn within a single path, or even accept curved lines or more than just 2 dimensions.
        */
        // function drawLines(g, line_list) {

        //     var old_stroke_style,
        //         current_key,
        //         line;

        //     old_stroke_style = g.strokeStyle;

        //     for (current_key in line_list) {

        //         line = line_list[current_key];

        //         if (isUndefined(line)) {

        //             throw new Error("line is undefined");

        //         }

        //         g.strokeStyle = line.color;
        //         g.beginPath();

        //         g.moveTo(line.start.x, line.start.y);

        //         g.lineTo(line.end.x, line.end.y);

        //         g.lineWidth = line.thickness;
        //         g.stroke();

        //     }

        //     if (old_stroke_style) {

        //         g.strokeStyle = old_stroke_style;

        //     }

        // }

        function registerForDisplay(display_component) {

            if (isUndefined(display_component)) {

                throw new Error("display_component is undefined");

            }

            display_list[display_component] = display_component;

        }

        function renderCurrentDisplayList() {

            renderComponents(display_list);

        }

        function renderComponents(component_list) {

            var current_key,
                display_component,
                children,
                child;

            for (current_key in component_list) {

                display_component = component_list[current_key];

                if (isUndefined(display_component)) {

                    throw new Error("display_component is undefined");

                }

                display_component.render(display_element.getContext("2d"), display_element.width, display_element.height);

                children = display_component.getChildren();

                if (!isUndefined(children)) {

                    renderComponents(children);

                }

            }

        }

        function resizeDisplay() {

            display_element.height = window.innerHeight;
            display_element.width = window.innerWidth;

            renderCurrentDisplayList();

        }

        // variable initiations

        display_list = {};

        display_element = document.createElement("canvas");
        console.log("ref to canvas:", display_element);

        // This could be separated into a component initialisation protocol
        display_element.style.position = "absolute";
        display_element.style.top = '0px';
        display_element.style.left = '0px';

        resizeDisplay();

        display = {};

        display.registerForDisplay = registerForDisplay;
        display.renderCurrentDisplayList = renderCurrentDisplayList;


        // function body;

        // This looks to be the responsibility of the display manager?
        document.body.appendChild(display_element);

        /*
            I would like to move this through a central unit. So we can control the events using a single principle. Events are time based and since this is a single system, time management should be handled using a single unit to be able to relate different time frames to oneanother. (i.e. preventing situations where one compares 1 foot to the door with a lat,long,alt metric centralised in Bumsville, Idaho. It doesn't work without a single source of reference.)
        */

        window.addEventListener("resize", resizeDisplay);


        // Return statement

        return display;

    }

    ////////////////////////////////////////////////////////////////
    // DISPLAY COMPONENT
    ////////////////////////////////////////////////////////////////
    function DisplayComponent() {

        function getWidth(related_width) {

            if (this.relative_width !== null) {

                return this.relative_width * related_width;

            }

            return this.width;

        }

        function getHeight(related_height) {

            if (this.relative_height !== null) {

                return this.relative_height * related_height;

            }

            return this.height;

        }

        function addChild(proposed_child) {

            if (isUndefined(proposed_child)) {

                throw new Error("proposed_child is undefined");

            }

            this.children[proposed_child] = proposed_child;

            proposed_child.registerParent(this);

        }

        function registerParent(proposed_parent) {

            if (isUndefined(proposed_parent)) {

                throw new Error("proposed_parent is undefined");

            }

            this.parent = proposed_parent;

        }

        function getChildren() {

            return this.children;

        }

        function render(g, relative_width, relative_height) {

            // Stub for now.

        }

        // Defaults
        this.parent = null;
        this.children = {};

        this.x = 0;
        this.y = 0;
        this.width = 300;
        this.height = 200;
        this.background_color = "#000000";
        this.relative_width = null;
        this.relative_height = null;

        this.render = render;
        this.addChild = addChild;
        this.registerParent = registerParent;
        this.getChildren = getChildren;
        this.getWidth = getWidth;
        this.getHeight = getHeight;

    }

    function constructLetterUppercaseA() {

        var lowercase_a;

        function render(g, relative_width, relative_height) {

            g.strokeStyle = "#ffffff";
            g.beginPath();

            g.moveTo(0, 1);
            g.lineTo(0, 7);

            g.moveTo(1, 0);
            g.lineTo(3, 0);

            g.moveTo(1, 3);
            g.lineTo(3, 3);

            g.moveTo(4, 1);
            g.lineTo(4, 7);

            g.lineWidth = 1;
            g.stroke();

        }

        lowercase_a = new DisplayComponent();

        lowercase_a.render = render;

        return lowercase_a;

    }

    ////////////////////////////////////////////////////////////////
    // EDITOR
    ////////////////////////////////////////////////////////////////
    function constructEditor() {

        var editor,
            letter_a;

        function render(g, relative_width, relative_height) {

            var calculated_x,
                calculated_y,
                calculated_width,
                calculated_height;
                
            calculated_x = editor.x;
            calculated_y = editor.y;
            calculated_width = editor.getWidth(relative_width);
            calculated_height = editor.getHeight(relative_height);

            g.fillStyle = editor.background_color;
            g.fillRect(calculated_x, calculated_y, calculated_width, calculated_height);

        }

        editor = new DisplayComponent();

        editor.render = render;

        editor.relative_width = 1;
        editor.relative_height = 1;

        editor.background_color = "#101010";

        // Create all the children we need here. This eventually needs to be a list that can be filled or defined, OFF-site so we can have configs dealing with which connections happen where.
        letter_a = constructLetterUppercaseA();
        editor.addChild(letter_a);

        return editor;

    }

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

        display.registerForDisplay(editor);

        display.renderCurrentDisplayList();

    }

    document_ready_event = "DOMContentLoaded";

    document.addEventListener(document_ready_event, initialise);

}());