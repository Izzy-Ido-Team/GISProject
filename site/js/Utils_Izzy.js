function getSubElements(element) {
    var subElements = [];
    for (var i = 0; i < element.children.length; i++) {
        subElements.push(element.children[i]);
    }
    return subElements;
}