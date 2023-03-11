// The purpose of this file is to generate the UI overlaying the arcgis map
// The map itself is created in Map.js, not here

// Get the ui div from the page


// This variable stores the active map layers by name
var activeLayers = [];

var maxUIElementID = 0;

// This function generates the UI, recreating it if it already exists.
// Because it destroys and recreates most of the page, it should 
// only be called when the page loads, or when when a new dataset is loaded
function generateOrRegenerateUI(uiWrapper, mapWrapper) {
    getSubElements(uiWrapper).forEach(child => {
        if (child.id != "map") {
            uiWrapper.removeChild(child);
        }
        // Add ui elements here
        
        var timeSlider = createUIElement(uiWrapper, "input");
        timeSlider.type = "range";
        timeSlider.min = "0";
        timeSlider.max = "100";
        timeSlider.step = "1";
        timeSlider.style.right = "10px";
        timeSlider.style.top = "10px";
        timeSlider.style.width = "300px";
        timeSlider.style.height = "20px";
    });
}

// Creates a ui element with no configuration and returns 
// an object that can be used to reference in in the future
function createUIElement(parent, type, applyDefaultStyling = true) {
    var element = document.createElement(type);
    parent.appendChild(element);
    element.id = `ui-${maxUIElementID}`;
    maxUIElementID += 1;
    if (applyDefaultStyling) {
        element.style.position = "absolute";
    }
    return element;
}


generateOrRegenerateUI(document.getElementById("UI"));