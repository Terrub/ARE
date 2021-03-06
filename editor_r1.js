/*
    @TEUN: What I need is a way to merge the way I was able to switch between multiple event listeners to initiate the screen back then in core.js, mixed in with what I have already here when it comes to event dispatching combined with what I wrote in Samual.lua and other addons for components to be able to register what internal events they need. I'm getting the feeling I've written all the three parts that make up the event dispatcher's whole story, but fail to see the bigger picture which is needed to bring them all together.
*/

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
            mathCeil,
            keyDownHandler,
            eventDispatcher;

        function isUndefined(value) {

            return (typeof value === "undefined");

        }

        function isDefined(value) {

            return (typeof value !== "undefined");

        }

        function isBoolean(bol) {

            return (typeof bol === "boolean");

        }

        function isNumber(num) {

            return (typeof num === "number");

        }

        function isInteger(value) {

            // #NOTE: Why this? Because... for some really demented reason, (isNaN("") === false) An empty string is apparently a number?
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

        function isOdd(value) {

            onlyProceedIf(value, isNumber);

            return ((value % 2) > 0);

        }

        function onlyProceedIf(statement, check) {

            if (check(statement) !== true) {

                throw new Error("A checkpoint failed, check the stack for more info.");

            }

        }

////////////////////////////////////////////////////////////////
// CLASS formatizer
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

                onlyProceedIf(flag, isString);

                onlyProceedIf(typedefinitionTest, isFunction);

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

                onlyProceedIf(supplied_format, isString);

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
// CLASS display
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

            function drawLine(aX, aY, bX, bY, width) {

                var x1,
                    y1,
                    x2,
                    y2,
                    stroke_offset;

                x1 = (aX * scale) + x_offset;
                y1 = (aY * scale) + y_offset;

                x2 = (bX * scale) + x_offset;
                y2 = (bY * scale) + y_offset;

                // Hey, just a thought here, but... isn't scale supposed to be a number? Can't we convert it to an object of type number then? So we can invoke scale.isOdd() which seems a LOT more OOP like, not to mention more readible; "if scale is odd" vs "if is odd: 'scale'."
                // #TODO: Check whether above statement is feasible or not. As number is a primitive in javascript, I currently believe.
                if (isOdd(scale)) {

                    stroke_offset = 0.5;

                    x1 += stroke_offset;
                    y1 += stroke_offset;
                    x2 += stroke_offset;
                    y2 += stroke_offset;

                }

                g.beginPath();

                g.moveTo(x1, y1);
                g.lineTo(x2, y2);

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

                onlyProceedIf(display_component, isDefined)

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

                    if ( ((display_component.width * scale) + x_offset) > display_element.width) {

                        x_offset = local_x;
                        y_offset += (display_component.height * scale);

                    }

                    onlyProceedIf(display_component, isDefined);

                    // #TODO: Instead of just letting the component do the rendering (which is a possible security breach and delegates our responsibility to the wrong actor.) we should probably hand off a renderable objectlist to the component that wants to render, then have it record all the requested drawing of the component and translate and or execute those requests here. This function is responsible for making sure the canvas gets the right intel, the component is not. We just give the component a means to tell us what they need.
                    // #NOTE: This is where the ARE principle comes in. We wanted to be able to read our own descriptors so the editor itself can tell me (the writer using the editor) what the functions and methods can and cannot do. The object I'm supposed to use explains to me what options I have, then I can choose which of the given options fit my needs the best.
                    display_component.render(gLib, local_width, local_height);

                    children = display_component.getChildren();

                    if (isDefined(children)) {
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
// CLASS displayComponent -- #BLOAT_WARNING
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

            function registerRequiredEvents() {

                var registerable_event,
                    registeredEventHandler;

                for (registerable_event in this.required_events) {

                    eventDispatcher.registerListener(registerable_event, registeredEventHandler);

                }

            }

            function addRequiredEvent(event_name, eventHandler) {

                onlyProceedIf(event_name, eventDispatcher.isRecognisedEvent);

                onlyProceedIf(eventHandler, isFunction);

                this.event_handlers[event_name] = eventHandler;

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
                newDisplayComponent.registerRequiredEvents = registerRequiredEvents;
                newDisplayComponent.addRequiredEvent = addRequiredEvent;

                return newDisplayComponent;

            }

            current_id = 0;

            displayComponent = {};

            displayComponent.createInstance = createInstance;

            return displayComponent;

        }());

////////////////////////////////////////////////////////////////
// CLASS letterUpperCaseA
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
// CLASS editor
////////////////////////////////////////////////////////////////
        function constructEditor() {

            var editor,
                isDrawing;

            function render(g, relative_width, relative_height) {

                g.setColor(0.05, 0.05, 0.05, 1);

                g.drawRect(editor.x, editor.y, relative_width, relative_height);

            }

            function addLetterA() {

                editor.addChild(constructLetterUppercaseA());

                display.renderCurrentDisplayList();

            }

            editor = displayComponent.createInstance();

            editor.render = render;
            editor.padding_left = 4;
            editor.padding_top = 4;

            // This line should eventually replace the one below it.
            // editor.addRequiredEvent(eventDispatcher.KEY_A_PRESSED, addLetterA);
            keyDownHandler.registerListener(editor, addLetterA, 65);

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

////////////////////////////////////////////////////////////////
// SINGLETON keyDownHandler
////////////////////////////////////////////////////////////////        
        // #TODO: I feel like I can refactor this into a general eventHandler class we can instantiate with different events?
        keyDownHandler = (function constructKeyDownHandler() {

            var keyDownHandler,
                index,
                generalKeyDownListeners,
                specificListenersOf,
                entry,
                totalListeners;

            function keyboardEventHandler(keyboardEvent) {

                var keySpecificListeners;

                // console.log(keyboardEvent);

                // Invoke all the registered listeners for the general "keyDown" event.

                for (index in generalKeyDownListeners) {

                    entry = generalKeyDownListeners[index];

                    // #NOTE: I don't want to pass along the keyboard event here because I'd rather extract or extrapolate the needed data here at customs rather than later inside the runtime environment of our closed off core system. If we allowed registered listeners to depend on the keyboardevent, we would never be able to migrate to another system. Besides if they need key specific info, they'd better register for those specific keys then.

                    // Just invoke the entry for now.
                    attempt(entry);

                }

                keySpecificListeners = specificListenersOf[keyboardEvent.keyCode];

                for (index in keySpecificListeners) {

                    entry = keySpecificListeners[index];

                    attempt(entry);

                }

            }

            function registerListener(display_component, callback_function, key) {

                onlyProceedIf(callback_function, isFunction);
                
                if (isUndefined(key)) {

                    generalKeyDownListeners[display_component.id] = callback_function;

                } else {

                    if (isUndefined(specificListenersOf[key])) {

                        specificListenersOf[key] = {};

                    }

                    // #TODO: Really need to use internal mapping of keys in the future. I'm now assuming the invoker knows wtf they are doing and which keys they actually mean, an assumption I'm not keen on making tbh.
                    specificListenersOf[key][display_component.id] = callback_function;

                }

                totalListeners += 1;

                validateReasonToListen();

            }

            function unRegisterListener(display_component, key) {

                if (isUndefined(key)) {

                    delete generalKeyDownListeners[display_component.id];

                } else {

                    // #TODO: Really need to use internal mapping of keys in the future. I'm now assuming the invoker knows wtf they are doing and which keys they actually mean, an assumption I'm not keen on making tbh.
                    delete keySpecificListeners[key][display_component.id];

                }

                totalListeners -= 1;

                validateReasonToListen();

            }

            function validateReasonToListen() {

                if (totalListeners > 0) {

                    document.addEventListener("keydown", keyboardEventHandler);

                } else {

                    document.removeEventListener("keydown", keyboardEventHandler);

                }

            }

            totalListeners = 0;

            keyDownHandler = {};

            generalKeyDownListeners = {};
            specificListenersOf = {};

            keyDownHandler.registerListener = registerListener;
            keyDownHandler.unRegisterListener = unRegisterListener;

            return keyDownHandler;

        }());

////////////////////////////////////////////////////////////////
// SINGLETON eventDispatcher -- #CHAOS_WARNING
////////////////////////////////////////////////////////////////
        eventDispatcher = (function constructEventDispatcher() {

            // #NOTE: This entire singleton needs to be ignored or thoroughly looked at. I've confused external and internal events all over the place. I doubt this can still be made into a nice code like this without extreme caution!

            var eventDispatcher,
                listening_to,
                total_listeners_of,
                registerable_events,
                callback_functions_for;

            // [INTERNAL] This is where a recognised local event triggers the registered call backs to be executed.
            function handleLocalEvent(local_event_name) {

                callback_function = callback_functions_for[local_event_name];
                onlyProceedIf(callback_function, isDefined);

                attempt(callback_function);

            }

            // [DATED] I think this was intended for external use, but not sure.
            function registerListener(event_name, callback_function) {

                var registerable_event;

                registerable_event = registerable_events[event_name];
                onlyProceedIf(registerable_event, isDefined);

                callback_function = callback_functions_for[registerable_event];
                onlyProceedIf(callback_function, isDefined);

            }

            // [DATED] I think this was intended for external use, but not sure.
            function unRegisterListener(event_name, callback_function) {

                var registerable_event;

                registerable_event = registerable_events[event_name];
                onlyProceedIf(registerable_event, isDefined);

                callback_function = callback_functions_for[registerable_event];
                onlyProceedIf(callback_function, isDefined);

            }

            // [DISPATCHER] This is supposed to control which external listeners were actively being monitored based on internal requests.
            function validateReasonToListen() {

                var totalListeners,
                    registerable_event;

                for (index in registerable_events) {

                    registerable_event = registerable_events[index];

                    onlyProceedIf(registerable_event, isDefined);

                    // #NOTE: Michael was able to convince me that "listening_to" was redundant, which later turned out not to be the case. So: The reason why I have the extra check is because we can have multiple components registering for an event listener while we are already listening so there'd be no need to register again. While at the same time we can have a validation cycle where went from 0 to more listeners whilst not listening yet, and then we do need to start listening. We have 2 limits because we transition between listening and not listening, and a transition is by definition not instant.
                    if (total_listeners_of[registerable_event] > 0 && !listening_to[registerable_event]) {

                        document.addEventListener(registerable_event, handleEvent);

                        listening_to[registerable_event] = true;

                    } else if (total_listeners_of[registerable_event] < 1 && listening_to[registerable_event]) {

                        document.removeEventListener(registerable_event, handleEvent);

                        listening_to[registerable_event] = false;

                    }

                }

            }

            // [DISPATCHER] This is a quick mock-up of how I think I want to setup/structure the external handeling.
            function quickTrial() {

                var hostHookingFunction,
                    host_event_name,
                    hookToDispatch,
                    mouseUpHandlers;

                // This function can be declared somewhere using the editor itself or the administrator interface, which is then stored in local config.
                function keyUpHandler(keyboardEvent) {

                    function keyAUpHandler() {

                        handleLocalEvent(eventDispatcher.KEY_A_PRESSED);

                    }
                    // We may just want to map these to handlers specifically instead of using long if-else chains or w/e...
                    if (keyboardEvent.keyCode == 65) {

                        keyAUpHandler();

                    }

                    handleLocalEvent(eventDispatcher.KEY_PRESSED);   

                }

                // Host hooking function    |   Host eventname  |   local hook to dispatch
                // document.addEventListener(  "keyup",             sendKeyUpMarkerToDispatcher);

                hostHookingFunction = document.addEventListener;
                host_event_name = "keyup";
                hookToDispatch = keyUpHandler;

                // Example of mouseUp sub-object
                mouseUpHandlers = {
                    1: {
                        key: "ExmouseUp",
                        value: "InmouseUp"
                    }
                    2: {
                        key: "mouseUp",
                        value: "mouseButton1Up"
                    },
                    3: {
                        key: "mouseUp",
                        value: "mouseButton2Up"
                    }
                };

                events = {
                    mouseUp: {
                        name: "mouseUp",
                        handler: mouseUpHandler,
                        events: {
                            "mouseButton1Up", "mouseButton2Up"
                        }
                    },
                    mouseButton1Up: {
                        name: "mouseButton1Up",
                        handler: mouseButton1UpHandler,
                        events: {}
                    },
                    mouseButton2Up: {
                        name: "mouseButton2Up",
                        handler: mouseButton2UpHandler,
                        events: {}
                    }
                };

                Links{
                    mouseUp: [ "mouseUpHandler". "mouseButton1Up", "mouseButton2Up" ],
                    mouseUpHandler: mouseUpHandler,
                    mouseButton1Up: [ "mouseButton1UpHandler" ],
                    mouseButton1UpHandler: mouseButton1UpHandler,
                    mouseButton2Up: [ "mouseButton2UpHandler" ],
                    mouseButton2UpHandler: mouseButton2UpHandler
                }

                // I kinda want to be able to do stuff like traverse an object with specific values that returns a single item or a set of items.
                

            }

            // [DISPATCHER]? Not sure but I think I wanted this to make sure we're listening to an event that we can actually receive (still).
            function isRecognisedEvent(event_name) {

                return isDefined(registerable_events[event_name]);

            }

            // [EXTERNAL][DATED] This is part of the CRUD to create external hooks for the dispatcher to work with.
            // function addRegisterableEvent(event_name, event_code) {

            //     registerable_events[event_name] = registerableEvent.createInstance(event_name, event_code);

            //     // Not liking this bit much... the event_code should be in the event object, so linking it here feels like extra work when changing stuff?
            //     eventDispatcher[event_code] = event_name;

            //     // Still need a host and a listener to hook it up to as well as a list of events to hook and a way to link the actual hook to one of our locally mapped registerable events. Perhaps I should do the mapping elsewhere?
            //     host_listener

            //     // Hook into the browser event for a keydown followed by a keyup
            //     browser_event.keydown;
            //     browser_event.keyup;

            // }

            eventDispatcher = {};

            listening_to = {};
            total_listeners_of = {};

            // This is the stuff that is supposed to be generated by the functions above which I'm trying to write. This would've been the result after the above functions were being fed the config-files as suggested by Michael and Marc. Lets just do this by hand for now to see if the rest works.
            eventDispatcher.KEY_A_PRESSED = {
                name: "keyboard key 'a' was pressed.",
                code: "KEY_A_PRESSED"
            };

            eventDispatcher.registerListener = registerListener;
            eventDispatcher.unRegisterListener = unRegisterListener;
            eventDispatcher.isRecognisedEvent = isRecognisedEvent;

            return eventDispatcher;

        }());

        // Local upvalues (for speed?)
        mathCeil = Math.ceil;

        document_ready_event = "DOMContentLoaded";

        // throw new Error("BOO\nWOW this works?");

        document.addEventListener(document_ready_event, attemptToInitialise);

    };

    attempt(constructCore);

}());