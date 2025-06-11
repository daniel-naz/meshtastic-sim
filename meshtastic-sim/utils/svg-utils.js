/**
 * @param {string} svgContent 
 * @returns {SVGElement}
 */
function createSvgFromText(svgContent) {
    const svgNS = "http://www.w3.org/2000/svg";

    const wrapped = `<svg xmlns="${svgNS}"><g>${svgContent}</g></svg>`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(wrapped, "image/svg+xml");

    const g = doc.querySelector("g");

    return document.importNode(g, true);
}

export default {
    createSvgFromText
}