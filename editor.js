/* ----------------------------------------------------------------
    Notes:
-------------------------------------------------------------------

    Per cycle: {
        Do rendering based on previous data!
        If any time is left, do new data calculations,
        when time is up, start next cycle.
    }
    
    Such a cycle requires that we have some idea how many
    operations each requested action requires and that these
    operations all stay pretty consistent in how much time it
    takes. Consider binary, logical and arithmatic operators.

    The functions that I'm imagining now look a lot like
    excell formula bullshit. Not sure if that is something we
    like...

---------------------------------------------------------------- */

( function loadBootupScript() {

    "use strict";

    var document_ready_event,
        core,
        display,
        graphicsLib,
        editor;
    
    function constructCore() {

        var core;

        function isUndefined( value ) {

            return ( typeof value === "undefined" );

        }

        function isDefined( value ) {

            return ( ! isUndefined( value ) );

        }

        function isString( value ) {

            return ( typeof value === "string" );

        }

        function isArray( value ) {

            return ( Array.isArray( value ) );

        }

        function attempt( proposedFunction, args ) {

            try {

                return proposedFunction.apply( null, args );

            } catch ( err ) {

                faultOnError( err );

            }

        }

        function faultOnError( err ) {

            var errBody = document.createElement( "body" );

            errBody.style.backgroundColor = "#cc3333";
            errBody.style.color = "#ffffff";

            errBody.innerHTML = "<pre>" + err + "</pre>";

            document.body = errBody;

            throw new Error( err );

        }

        function mergeOneObjectIntoTheOther( one, the_other ) {

            // #TODO: look into checking whether Object.assign is available and use that instead? 
            // #NOTE: Use pointers for changing functions. I prefer that over excessive if statements 

            var object_keys;

            function addKeyToTheOtherObject( object_key, index, current_list ) {

                // if (isUndefined(the_other[object_key])) { 

                    // the_other[object_key] = one[object_key]; 

                // } 

                the_other[ object_key ] = one[ object_key ];

            }

            if ( isUndefined( one ) ) {

                faultOnError( "object one is undefined" );

            }

            if ( isUndefined( the_other ) ) {

                faultOnError( "object the_other is undefined" );

            }

            object_keys = Object.keys( one );

            object_keys.forEach( addKeyToTheOtherObject );

            return the_other;

        }

        core = {
            "isUndefined": isUndefined,
            "isDefined": isDefined,
            "isString": isString,
            "isArray": isArray,
            "attempt": attempt,
            "faultOnError": faultOnError,
            "mergeOneObjectIntoTheOther": mergeOneObjectIntoTheOther
        }

        return core;

    }

// ------------------------------------------------------------------------------------------------ 
// [CLASS] Display 
// ------------------------------------------------------------------------------------------------ 
    function ConstructDisplayIn( parent ) {

        // variable declarations 
        var display,
            canvas,
            display_element_tree,
            render_list,
            graphicsLib,
            we_require_validating,
            we_require_rendering;

        // function declarations 
        function resizeHandler() {

            canvas.width = parent.innerWidth;
            canvas.height = parent.innerHeight;

            validateRenderList();

        }

        function validateRenderList() {

            function addChildToRenderList( displayElement, index, current_iteration_list ) {

                if (render_list.indexOf( displayElement ) < 0) {

                    render_list.push( displayElement );

                }

            }

            display_element_tree.forEach( addChildToRenderList );

        }

        function render() {

            var children,
                current_render_list,
                next_render_list,
                local_x,
                local_y,
                local_width,
                local_height,
                isUndefined,
                displayElement;

            function addChildToNextIteration( displayElement, index, current_iteration_list ) {

                next_render_list.push( displayElement );

            }

            // Early exit for performance reasons? 
            if ( render_list.length > 0 ) {

                // console.log("Rendering.")

                // Upvalues for speed? 
                isUndefined = core.isUndefined;

                local_x = 0;
                local_y = 0;
                local_width = canvas.width;
                local_height = canvas.height;

                while ( render_list.length > 0 ) {

                    next_render_list = [];

                    while ( render_list.length > 0 ) {

                        displayElement = render_list.shift();

                        displayElement.render( graphicsLib, local_x, local_y, local_width, local_height );

                        children = displayElement.getChildren();

                        children.forEach( addChildToNextIteration );

                        local_x += displayElement.contentOffsetLeft;
                        local_y += displayElement.contentOffsetTop;
                        local_width -= displayElement.contentOffsetLeft;
                        local_height -= displayElement.contentOffsetTop;

                    }

                    render_list = next_render_list;

                }

            }

            we_require_rendering = false;

        }

        function validateEveryDisplayElement( display_element_tree ) {

            var current_layer_of_elements,
                next_layer_of_elements,
                children;

            function validateDisplayElementPropertiesAndCheckForChildren( displayElement, index, display_element_tree ) {

                displayElement.validateProperties();

                children = displayElement.getChildren();

                children.forEach( addChildToNextIteration );

            }

            function addChildToNextIteration( displayElement, index, current_iteration_list ) {

                next_layer_of_elements.push( displayElement );

            }

            current_layer_of_elements = display_element_tree;

            // console.log("Validating.")

            while ( current_layer_of_elements.length > 0 ) {

                next_layer_of_elements = [];

                current_layer_of_elements.forEach( validateDisplayElementPropertiesAndCheckForChildren );

                current_layer_of_elements = next_layer_of_elements;

            }

            we_require_validating = false;

        }

        function getGraphicsLibrary() {

            return graphicsLib;

        }

        function newElement( blueprint ) {

            var display_element,
                parent_element,
                children,
                contentOffsetLeft,
                contentOffsetTop,
                contentWidth,
                contentHeight;

            function validateProperties() {

                // console.log("validateProperties was called");

            }

            function addChild( element ) {

                if ( core.isUndefined( element ) || ! element.isDisplayElement() ) {

                    core.faultOnError( "element must be valid displayElement" );

                }

                children.push( element );

                element.setParent( this );

            }

            function getChildren() {

                return this.children;

            }

            function setParent(element) {

                this.parent_element = element;

            }

            function getParent() {

                return this.parent_element;

            }

            function render(graphicsLib, local_x, local_y, local_width, local_height) {

                graphicsLib.fillStyle = "rgba(220, 22, 22, 1)";
                graphicsLib.fillRect(local_x, local_y, local_width, local_height);

                graphicsLib.fillStyle = "rgba(255, 255, 255, 1)";
                graphicsLib.font = "14px Courier New";
                graphicsLib.fillText("NOT RENDERED", 10, 14 + (local_height / 2) );

            }
            
            function setContentOffsetLeft(value) {

                contentOffsetLeft = value;

            }

            function getContentOffsetLeft() {

                return contentOffsetLeft;

            }

            function setContentOffsetTop(value) {

                contentOffsetTop = value;

            }

            function getContentOffsetTop() {

                return contentOffsetTop;

            }

            function setContentWidth(value) {

                contentWidth = value;

            }

            function getContentWidth() {

                return contentWidth;

            }

            function setContentHeight(value) {

                contentHeight = value;

            }

            function getContentHeight() {

                return contentHeight;

            }

            function isValidDisplayElementBlueprint(proposed_blueprint) {

                return !core.isUndefined(proposed_blueprint);

            }

            contentOffsetLeft = 0;
            contentOffsetTop = 0;
            contentWidth = 0;
            contentHeight = 0;

            display_element = {
                "validateProperties": validateProperties,
                "addChild": addChild,
                "getChildren": getChildren,
                "getParent": getParent,
                "setParent": setParent,
                "render": render,
                "children": [],
                "tic": tic
            };

            Object.defineProperty(display_element, "contentOffsetLeft", {
                "set": setContentOffsetLeft,
                "get": getContentOffsetLeft
            })

            Object.defineProperty(display_element, "contentOffsetTop", {
                "set": setContentOffsetTop,
                "get": getContentOffsetTop
            })

            Object.defineProperty(display_element, "contentWidth", {
                "set": setContentWidth,
                "get": getContentWidth
            })

            Object.defineProperty(display_element, "contentHeight", {
                "set": setContentHeight,
                "get": getContentHeight
            })

            if (isValidDisplayElementBlueprint(blueprint)) {

                core.mergeOneObjectIntoTheOther(blueprint, display_element);

            }

            return display_element;

        }

        // This looks a lot like displayElement.addChild
        function addElementToDisplay(displayElement) {

            display_element_tree.push(displayElement);

            validateRenderList();

        }
        
        function tic() {

            // console.log("tic");

            if (we_require_validating) {

                validateEveryDisplayElement(display_element_tree);

            }

            if (we_require_rendering) {

                validateRenderList();
                render();

            }

        }

        function invalidateProperties() {

            we_require_validating = true;

        }

        function invalidateRendering() {

            we_require_rendering = true;

        }

        // Logic 
        canvas = document.createElement("canvas");
        
        canvas.style.position = "absolute";
        canvas.style.top = "0px";
        canvas.style.left = "0px";
        canvas.height = parent.innerHeight;
        canvas.width = parent.innerWidth;

        document.body.appendChild(canvas);

        graphicsLib = canvas.getContext("2d");

        render_list = [];
        display_element_tree = [];

        we_require_rendering = true;
        we_require_validating = true;

        parent.addEventListener("resize", resizeHandler);

        display = {
            "getGraphicsLibrary": getGraphicsLibrary,
            "render": render,
            "validateEveryDisplayElement": validateEveryDisplayElement,
            "newElement": newElement,
            "addChild": addElementToDisplay,
            "tic": tic,
            "invalidateProperties": invalidateProperties,
            "invalidateRendering": invalidateRendering
        }

        return display;

    }

// ------------------------------------------------------------------------------------------------ 
// [CLASS] Editor 
// ------------------------------------------------------------------------------------------------ 
    function constructEditor() {

        // ----------------------------------------------------------------
        // -- Variable declarations -- 
        // ----------------------------------------------------------------
        var editor,
            code_lines,
            caret,
            editorMemory,
            file_index_locations,
            registered_characters,
            lower_case_letters,
            upper_case_letters,
            numbers,
            special_characters,
            quotes,
            captors,
            numerical_operators,
            slashes,
            single_space;

        // ----------------------------------------------------------------
        // -- Function declarations -- 
        // ----------------------------------------------------------------
        function renderEditor(graphicsLib, left, top, width, height) {

            var raw_code_block,
                code_block,
                linenumber,
                number_of_lines,
                current_line_height,
                text_size,
                character_width,
                margins;

            graphicsLib.fillStyle = "rgba(25, 24, 23, 1)";
            graphicsLib.fillRect(left, top, width, height);

            linenumber = 1;
            number_of_lines = getNumberOfTotalLines();
            text_size = 14;
            character_width = text_size * 0.57125;
            margins = 4;

            graphicsLib.fillStyle = "rgba(255, 255, 255, 1)";
            graphicsLib.font = text_size + "px Courier New";

            for (linenumber; linenumber <= number_of_lines; linenumber += 1) {

                current_line_height = (linenumber * (text_size + margins));

                // I need to tokenise the text so I can have some impact on the looks and feels of the letters n stuff. 
                graphicsLib.fillText(getLineAt(linenumber), 4, current_line_height);
                
            }

            graphicsLib.fillStyle = "rgba(255, 255, 255, 0.8)";
            graphicsLib.fillRect(
                left + 4 + (character_width * (caret.current_column - 1)),
                (caret.current_line - 1) * (text_size + margins) + margins,
                // character_width,
                1,
                text_size + margins
            );

        }

        function moveCaretLine(steps) {

            caret.current_line += steps;

            // This would end up above the first line, there is no code here. 
            if (caret.current_line < 1) {

                caret.current_line = 1;

            }

            // this would end up below <EOF>, there is no code here either. 
            if (caret.current_line > code_lines.length) {

                //#NOTE1: I had code_lines.length + 1 here for a reason, cannot remember why. But it causes trouble with arrow down events as it sets the current line to 2 if current_line is set to 2 and code_lines.length = 1.
                caret.current_line = code_lines.length;

            }

            moveCaretColumn(0);

            display.invalidateRendering();

        }

        function moveCaretColumn(steps) {

            var line;

            caret.current_column += steps;

            // This would be left the first column, no code here. 
            if (caret.current_column < 1) {

                caret.current_column = 1;

            }

            line = getLineAtCaret();
            
            // This would be beyond the right of the last char in the current line, no code here either.
            if (caret.current_column > line.length + 1) {

                caret.current_column = line.length + 1;

            }

            display.invalidateRendering();

        }

        function insertNewLineToCodeAtCaret(proposed_code) {

            code_lines.splice(caret.current_line, 0, proposed_code);

            moveCaretLine(1);
            // This is a bit dirty, but works for now.
            moveCaretColumn(proposed_code.length + 1);

        }

        function getNumberOfTotalLines() {

            return code_lines.length;

        }

        function getLineAt(linenumber) {

            return code_lines[linenumber - 1];

        }

        function getLineAtCaret() {

            return getLineAt(caret.current_line);

        }

        function setCodeAtLineNumber(proposed_line_number, proposed_code) {

            code_lines[proposed_line_number - 1] = proposed_code;

            display.invalidateProperties();

        }

        function addSymbolsRightOfCaret(character) {

            var line,
                left_part,
                right_part,
                joined_string;

            // console.log("adding: '",character, "'");

            line = getLineAtCaret();

            left_part = line.slice(0, caret.current_column - 1);

            right_part = line.slice(caret.current_column - 1, line.length);

            joined_string = left_part + character + right_part;

            setCodeAtLineNumber(caret.current_line, joined_string);

            moveCaretColumn(1);

            display.invalidateRendering();

        }

        function getRawCodeBlock() {

            return code_lines.join("\n");

        }

        function getExecutableCode() {

            return code_lines.join("");

        }

        function getCodeLines() {

            return code_lines;

        }

        function removeCharLeftOfCaret() {

            var line,
                left_part,
                right_part,
                joined_parts;

            line = getLineAtCaret();

            left_part = line.slice(0, caret.current_column - 2);

            right_part = line.slice(caret.current_column - 1, line.length);

            if (caret.current_column === 1) {

                if (caret.current_line === 1) {

                    // we're at the very beginning of the file now. Cannot remove anything here.
                    return;

                }

                removeLineAtCaret();

                moveCaretLine(-1);

                line = getLineAtCaret();

                moveCaretColumn(line.length + 1);

                addSymbolsRightOfCaret(right_part);

            } else {

                joined_parts = left_part.concat(right_part);

                setCodeAtLineNumber(caret.current_line, joined_parts);

                moveCaretColumn(-1);

            }

            display.invalidateProperties();
            display.invalidateRendering();

        }

        function removeLineAtCaret() {

            // we'd remove the last line in the file. Not sure I want that.
            if (code_lines.length === 1) {

                core.faultOnError("Unexpected request to remove last line in file.");

            }

            code_lines.splice(caret.current_line - 1, 1);

        }

        function isRegisteredCharacter(character) {

            return (registered_characters.test(character));

        }

        function keyDown_handler(keyboard_event) {

            // console.log(
            //     "keyboard_event.keyCode", keyboard_event.keyCode,
            //     "keyboard_event", keyboard_event
            // );

            if (keyboard_event.keyCode === 8) {

                keyboard_event.preventDefault();

                removeCharLeftOfCaret();

            } else if (keyboard_event.keyCode === 13) {

                keyboard_event.preventDefault();

                insertNewLineToCodeAtCaret("");

            } else if (keyboard_event.keyCode === 32) {

                keyboard_event.preventDefault();

                // Space bar pressed.
                addSymbolsRightOfCaret(single_space);

            } else if (keyboard_event.keyCode === 35) {

                keyboard_event.preventDefault();

                // End button was pressed, move caret to end of line.
                moveCaretColumn(getLineAtCaret().length);

            } else if (keyboard_event.keyCode === 36) {

                keyboard_event.preventDefault();

                // Home button was pressed, move caret to start of line.
                moveCaretColumn(1 - caret.current_column);

            } else if (keyboard_event.keyCode === 37) {

                keyboard_event.preventDefault();

                // Left arrow was pressed, move caret left.
                moveCaretColumn(-1);

            } else if (keyboard_event.keyCode === 38) {

                keyboard_event.preventDefault();

                // Up arrow was pressed, move caret up.
                moveCaretLine(-1);

            } else if (keyboard_event.keyCode === 39) {

                keyboard_event.preventDefault();

                // Right arrow was pressed, move caret right.
                moveCaretColumn(1);

            } else if (keyboard_event.keyCode === 40) {

                keyboard_event.preventDefault();

                // Down arrow was pressed, move caret down.
                moveCaretLine(1);

            }

        }

        function keyPress_handler(keyboard_event) {

            var charCode,
                keyCode,
                character;

            charCode = keyboard_event.charCode;
            keyCode = keyboard_event.keyCode;
            character = String.fromCharCode(charCode);

            // console.log(
            //     "keyPress_handler was called:",
            //     "\nkeyCode", keyCode,
            //     "\ncharCode", charCode,
            //     "\nString.fromCharCode(keyCode)", String.fromCharCode(keyCode),
            //     "\nString.fromCharCode(charCode)", String.fromCharCode(charCode),
            //     "\nkeyboard_event", keyboard_event
            // );

            if (isRegisteredCharacter(character)) {

                addSymbolsRightOfCaret(character);

            }

        }

        function createLocalMemory() {

            var localMemory;

            function addFileData(file) {

                if (!core.isString(file)) {

                    core.faultOnError("'file' is not a string");

                }

                if (core.isUndefined(file.data)) {

                    core.faultOnError("'file' is empty!");

                }

                if (core.isUndefined(file.name)) {

                    core.faultOnError("'file' has no name!");

                }

                // We assume we can use the name identifier for unique identification for now.
                localMemory.storage[file.name] = file.data;

            }

            function updateFileData(file) {

                LocalMemory.storage[file.name] = file;

            }

            localMemory = {
                "storage": {},
                "addFileData": addFileData,
                "updateFileData": updateFileData
            };

            return localMemory;

        }

        function localStorageHasFiles() {

            return (core.isDefined(localStorage[file_index_locations]));

        }

        function loadLocalStorageIntoLocalMemory() {

            var local_filenames;

            function addFileDataToLocalMemory(filepath, index, current_iteration_list) {

                var file;

                if (!core.isString(filepath)) {

                    core.faultOnError("Expected filepath to be a string.");

                }

                file = newFileFromStorageData(localStorage[filepath]);

                editorMemory.addFileData(file);

            }

            if (core.isUndefined(localStorage)) {

                core.faultOnError("Expected localStorage to be defined.");

            }

            if (!core.isString(localStorage.ARE_local_filenames)) {

                core.faultOnError("Expected localstorage.ARE_local_filenames to be a string.");

            }

            local_filenames = JSON.parse(localStorage.ARE_local_filenames);

            if (!core.isArray(local_filenames)) {

                core.faultOnError("Expected parsed filenames to be an array");

            }

            local_filenames.forEach(addFileDataToLocalMemory);

            editorMemory.addFileData(localstorage["ARE_file"]);

        }

        function swapActiveFileWith(file) {

        }

        function saveLocalMemoryIntoLocalStorage() {

            var file,
                file_name;

            for (file_name in editorMemory.storage) {

                file = editorMemory.storage[file_name];

                localStorage[file.name] = JSON.stringify(file);

            }

        }

        function executeFile(file) {

            console.log("Now we'd be parsing:", file);

        }

        // ----------------------------------------------------------------
        // -- Initialisation -- 
        // ----------------------------------------------------------------
        code_lines = [];
        file_index_locations = "ARE_locally_stored_filenames";

        lower_case_letters = "abcdefghijklmnopqrstuvwxyz";
        upper_case_letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        numbers = "0123456789";
        special_characters = "!@#$%&_|;:";
        quotes = "\'\"";
        captors = "()\\[\\]{}";
        numerical_operators = "+\-/*%^";
        slashes = "\\\\/";
        single_space = " ";

        registered_characters = new RegExp("["
            + lower_case_letters
            + upper_case_letters
            + numbers
            + special_characters
            + quotes
            + captors
            + numerical_operators
            + slashes
            + "]");

        editorMemory = createLocalMemory();

        caret = {
            "current_line": 1,
            "current_column": 1
        };

        editor = display.newElement(
            {
                "render": renderEditor,
                "contentOffsetLeft": 8,
                "contentOffsetTop": 8,
                "getNumberOfLines": getNumberOfTotalLines,
                "getLineAtCaret": getLineAtCaret,
                "getRawCodeBlock": getRawCodeBlock,
                "getExecutableCode": getExecutableCode,
                "getCodeLines": getCodeLines,
                "insertNewLineToCodeAtCaret": insertNewLineToCodeAtCaret,
                "removeCharLeftOfCaret": removeCharLeftOfCaret
            }
        );

        // ----------------------------------------------------------------
        // -- Actual logic -- 
        // ----------------------------------------------------------------
        if (localStorageHasFiles()) {

            loadLocalStorageIntoLocalMemory();

        } else {

            code_lines[0] = "";

        }
        
        //#TODO: Need to move this out of the editor constructor and have driver like connectors to sit between the internal handlers and the browser eventlistner mechanics.
        document.addEventListener("keydown", keyDown_handler);
        document.addEventListener("keypress", keyPress_handler);

        return editor;

    }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 
//      INIT operations
// 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function initialise() {

        var fps,
            milliSeconds_per_frame;

        fps = 30;
        milliSeconds_per_frame = (1 / fps) * 1000;

        document.removeEventListener(document_ready_event, initialise);

        /*  Create our display. */
        display = ConstructDisplayIn(window);
        window.setInterval(display.tic, milliSeconds_per_frame);
        graphicsLib = display.getGraphicsLibrary();

        /*  Create an editor instance and add to display. */
        editor = constructEditor();
        display.addChild(editor);

    }

    function attemptInitialisation() {

        /*  Get the core running. */
        console.log("Starting up Core");
        core = constructCore();
        console.log("Core boot completed");
        
        console.log("Attempting to initialise program");
        core.attempt(initialise);

    }

    document_ready_event = "DOMContentLoaded";

    document.addEventListener(document_ready_event, attemptInitialisation);

}());