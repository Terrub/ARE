(function loader() {

    function faultOnError(err) {

        var errBody = document.createElement("body");

        errBody.style.backgroundColor = "#cc3333";
        errBody.style.color = "#ffffff";

        errBody.innerHTML = "<pre>" + err + "</pre>";

        document.body = errBody;

    }

    function attempt(callToAttempt) {

        try {

            callToAttempt();

        } catch (err) {

            faultOnError(err);

            throw err;

        }

    }

    function constructCore() {

        "use strict";

        var display,
            editor,
            displayComponent,
            document_ready_event,
            mathCeil;

        function isUndefined(value) {

            return (typeof value === "undefined");

        }

        function isBoolean(bol) {

            return (typeof bol === "boolean");

        }

        function isNumber(num) {

            return (typeof num === "number");

        }

        function isInteger(value) {

            if (isString(value)) {

                return false;

            }

            var regexp = new RegExp("^[-+]?[0-9]+$");

            return regexp.test(value);

        }

        function isString(str) {

            return (typeof str === "string");

        }

        function isFunction(fnc) {

            return (typeof fnc === "function");

        }

        ////////////////////////////////////////////////////////////////
        // FORMATIZER
        ////////////////////////////////////////////////////////////////
        var formatizer = (function constructFormatizer() {

            "use strict";

            var formatizer,
                arguments_to_format,
                supported_types,
                supported_type_flags,
                pattern,
                pattern_was_changed;

            function addFormatType(flag, typedefinitionTest) {

                if (!isString(flag)) {

                    throw new Error("formatizer.addFormatType expects argument #1 to be a String.");

                }

                if (!isFunction(typedefinitionTest)) {

                    throw new Error("formatizer.addFormatType expects argument #2 to be a Function.");

                }

                supported_types[flag] = typedefinitionTest;
                supported_type_flags += flag;

                pattern_was_changed = true;

            }

            function typeCheck(match, position, type_flag) {

                var insert_value = arguments_to_format[position],
                    type_check = supported_types[type_flag];

                if (isUndefined(insert_value)) {

                    // _report("Formatize parameter mismatch");

                    return "undefined";

                }

                if (!type_check) {

                    // _report("Formatize unsupported type");

                    return "[unsupported type]";

                }

                if (!type_check(insert_value)) {

                    // _report("Formatize type mismatch");

                    return "[type mismatch]";

                }

                return insert_value;

            }

            function updatePattern() {

                /*  Attempt to find n replace en masse to prevent loops. Hopefully the 'g' modifier is enough */
                pattern = new RegExp("{@([0-9]+):([" + supported_type_flags + "])}", "gi");

                pattern_was_changed = false;

            }

            /**
             * Formatises a list of variable arguments into the allocated position of the given format.
             * 
             * Arguments:
             *  <string> "format"
             *      The format the given arguments have to be allocated to.
             *  <*> ... (optional)
             *      A variable list of arguments that will be ordered into the given format.
             *      Available format options:
             *      "{@x:T}" where x is the position of the argument in the provided argument list (optional)
             *      and T = the required type (or types?) the argument needs to adhere to.
             *      Possible types are:
             *      - 'b' Boolean
             *      - 'i' Integer
             *      - 'n' Number
             *      - 's' String
             *
             * Return:
             *  <string>
             *      The formatted arguments
             */
            function format(supplied_format) {

                /* We need to store all the given arguments we received here so we so we can pass them along to the 'typecheck and replace'-function in our String.replace down below. */
                arguments_to_format = arguments;

                if (pattern_was_changed) {

                    updatePattern();

                }

                if (!isString(supplied_format)) {

                    throw new Error("supplied format is not a string");

                }

                return supplied_format.replace(pattern, typeCheck);

            }

            pattern_was_changed = true;

            supported_types = {};
            supported_type_flags = "";

            addFormatType("b", isBoolean);
            addFormatType("n", isNumber);
            addFormatType("i", isInteger);
            addFormatType("s", isString);

            formatizer = {};

            /* Allow the outside to reach us. */
            formatizer.format = format;
            formatizer.addFormatType = addFormatType;

            return formatizer;

        }());

        ////////////////////////////////////////////////////////////////
        // DISPLAY
        ////////////////////////////////////////////////////////////////
        function constructDisplay() {

            // variable declarations

            var display,
                display_element,
                display_list,
                g,
                gLib,
                scale,
                x_offset,
                y_offset;

            // function declarations

            function drawRect(x, y, width, height) {

                g.fillRect(x, y, width, height);

            }

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

            function drawLine(aX, aY, bX, bY, width) {

                g.beginPath();

                g.moveTo(
                    ((aX * scale) + x_offset) + 0.5,
                    ((aY * scale) + y_offset) + 0.5
                );
                g.lineTo(
                    ((bX * scale) + x_offset) + 0.5,
                    ((bY * scale) + y_offset) + 0.5
                );

                g.lineCap = "round";
                g.lineWidth = (width * scale);
                g.stroke();

            }

            function setColor(red, green, blue, alpha) {

                var rgb_unit,
                    color_format,
                    unified_red,
                    unified_green,
                    unified_blue,
                    formatted_color;

                rgb_unit = 255;

                color_format = "rgba({@1:i},{@2:i},{@3:i},{@4:n})";

                if (red < 0 || red > 1) {

                    throw new Error("Supplied red value out of range 0 - 1");

                }

                if (green < 0 || green > 1) {

                    throw new Error("Supplied green value out of range 0 - 1");

                }

                if (blue < 0 || blue > 1) {

                    throw new Error("Supplied blue value out of range 0 - 1");

                }

                if (alpha < 0 || alpha > 1) {

                    throw new Error("Supplied alpha value out of range 0 - 1");

                }

                unified_red = mathCeil(red * rgb_unit);
                unified_green = mathCeil(green * rgb_unit);
                unified_blue = mathCeil(blue * rgb_unit);

                formatted_color = formatizer.format(color_format, unified_red, unified_green, unified_blue, alpha);

                g.strokeStyle = formatted_color;
                g.fillStyle = formatted_color;

            }

            function registerForDisplay(display_component) {

                if (isUndefined(display_component)) {

                    throw new Error("display_component is undefined");

                }

                // #TODO: See comment on similar syntax over at: DisplayComponent.addChild();
                display_list[display_component.id] = display_component;

            }

            function renderCurrentDisplayList() {

                x_offset = 0;
                y_offset = 0;

                renderComponents(display_list, 0, 0, display_element.width, display_element.height);

            }

            function renderComponents(component_list, local_x, local_y, local_width, local_height) {

                var current_key,
                    display_component,
                    children,
                    child;

                    x_offset += local_x;
                    y_offset += local_y;

                for (current_key in component_list) {

                    display_component = component_list[current_key];

                    if (isUndefined(display_component)) {

                        throw new Error("display_component is undefined");

                    }

                    // #TODO: Instead of just letting the component do the rendering (which is a possible security breach and delegates our responsibility to the wrong actor.) we should probably hand off a renderable objectlist to the component that wants to render, then have it record all the requested drawing of the component and translate and or execute those requests here. This function is responsible for making sure the canvas gets the right intel, the component is not. We just give the component a means to tell us what they need.
                    // NOTE_TO_SELF: This is where the ARE principle comes in. We wanted to be able to read our own descriptors so the editor itself can tell me (the writer using the editor) what the functions and methods can and cannot do. The object I'm supposed to use explains to me what options I have, then I can choose which of the given options fit my needs the best.
                    display_component.render(gLib, local_width, local_height);

                    children = display_component.getChildren();

                    if (!isUndefined(children)) {
                        // #TODO: Simple and dirty, just to get it working. This needs to be refactored.
                        renderComponents(children, display_component.padding_left, display_component.padding_top);

                    }

                    x_offset += (display_component.width * scale);

                }

            }

            function resizeDisplay() {

                display_element.height = window.innerHeight;
                display_element.width = window.innerWidth;

                // #TODO: This is not our responsibility. Send it up the chain of command!
                renderCurrentDisplayList();

            }

            // variable initiations

            scale = 1;
            display_list = {};

            display_element = document.createElement("canvas");
            console.log("ref to canvas:", display_element);

            // This could be separated into a component initialisation protocol
            display_element.style.position = "absolute";
            display_element.style.top = '0px';
            display_element.style.left = '0px';

            display = {};

            display.registerForDisplay = registerForDisplay;
            display.renderCurrentDisplayList = renderCurrentDisplayList;

            g = display_element.getContext("2d");

            // I want to look into segregating this into a seperate class altogether. Perhaps even load in a graphics library per specific setting, which would allow us to draw the same or similar results using different techniques depending on user settings. (e.g.: appending a div with a width, height and bg-color or drawing a rectangle with width height and colour on a canvas.)
            gLib = {};

            gLib.drawLine = drawLine;
            gLib.drawRect = drawRect;
            gLib.setColor = setColor;

            // function body;

            resizeDisplay();

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
        displayComponent = (function constructDisplayComponent() {

            var displayComponent,
                current_id;

            function addChild(proposed_child) {

                if (isUndefined(proposed_child)) {

                    throw new Error("proposed_child is undefined");

                }

                this.children[proposed_child.id] = proposed_child;

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
                // Should probably turn this into a recognisable default so we know something is called without a render override? I.e.: Should not be rendered, or should be told how to render.

            }

            function getCurrentId() {

                current_id += 1;

                return current_id;

            }

            function createInstance() {

                var newDisplayComponent;

                newDisplayComponent = {};

                // Defaults
                newDisplayComponent.id = getCurrentId();
                newDisplayComponent.parent = null;
                newDisplayComponent.children = {};

                newDisplayComponent.x = 0;
                newDisplayComponent.y = 0;
                newDisplayComponent.width = 300;
                newDisplayComponent.height = 200;
                newDisplayComponent.padding_left = 0;
                newDisplayComponent.padding_top = 0;

                newDisplayComponent.render = render;
                newDisplayComponent.addChild = addChild;
                newDisplayComponent.registerParent = registerParent;
                newDisplayComponent.getChildren = getChildren;

                return newDisplayComponent;

            }

            current_id = 0;

            displayComponent = {};

            displayComponent.createInstance = createInstance;

            return displayComponent;

        }());

        ////////////////////////////////////////////////////////////////
        // LETTER A
        ////////////////////////////////////////////////////////////////
        function constructLetterUppercaseA() {

            var lowercase_a,
                lines;

            // This is a value that is now hardset, but should be determined based on user input!
            lines = {
               0: {start: {x: 1, y: 8}, end: {x: 1, y: 2}, width: 1}, // Left pole up
               1: {start: {x: 1, y: 2}, end: {x: 2, y: 1}, width: 1}, // left slant up to mid
               2: {start: {x: 2, y: 1}, end: {x: 4, y: 1}, width: 1}, // top bar right
               3: {start: {x: 4, y: 1}, end: {x: 5, y: 2}, width: 1}, // right slant down to right pole
               4: {start: {x: 5, y: 2}, end: {x: 5, y: 8}, width: 1}, // right pole down
               5: {start: {x: 1, y: 4}, end: {x: 5, y: 4}, width: 1} // middle bar right
            }

            function render(g, relative_width, relative_height) {

                var index,
                    line;

                g.setColor(1,1,1,1);

                for (index in lines) {

                    line = lines[index];

                    g.drawLine(line.start.x, line.start.y, line.end.x, line.end.y, line.width);

                }

            }

            lowercase_a = displayComponent.createInstance();

            // This is a value that is now hardset, but should be determined based on user input!
            lowercase_a.width = 6;
            // This is a value that is now hardset, but should be determined based on user input!
            lowercase_a.height = 9;

            lowercase_a.render = render;

            return lowercase_a;

        }

        ////////////////////////////////////////////////////////////////
        // EDITOR
        ////////////////////////////////////////////////////////////////
        function constructEditor() {

            var editor;

            function render(g, relative_width, relative_height) {


                g.setColor(0.05, 0.05, 0.05, 1);

                g.drawRect(editor.x, editor.y, relative_width, relative_height);

            }

            editor = displayComponent.createInstance();

            editor.render = render;
            editor.padding_left = 4;
            editor.padding_top = 4;

            // Create all the children we need here. This eventually needs to be a list that can be filled or defined, OFF-site so we can have configs dealing with which connections happen where.
            // editor.addChild(constructLetterUppercaseA());
            // editor.addChild(constructLetterUppercaseA());
            // editor.addChild(constructLetterUppercaseA());

            return editor;

        }

        function attemptToInitialise() {

            attempt(initialise);

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

        function keyDownHandler(keyboardEvent) {

            console.log(keyboardEvent);

            if (keyboardEvent.keyCode === 65) {

                editor.addChild(constructLetterUppercaseA());

                display.renderCurrentDisplayList();

            }

        }

        mathCeil = Math.ceil;

        document_ready_event = "DOMContentLoaded";

        // throw new Error("BOO\nWOW this works?");

        document.addEventListener(document_ready_event, attemptToInitialise);
        document.addEventListener("keydown", keyDownHandler);

    };

    attempt(constructCore);

}());