/**
 * 26b41.js
 * Helper functions for butiran-x/26b41 note.
 *
 * Author: Sparisoma Viridi (https://github.com/dudung)
 * Created: 2026-02-17
 *
 * Exports:
 * - createDiv(id)
 * - changeElementsFlex(...args)
 * - createButton(id, caption)
 */

/**
* Creates div element for container of other elements and applies standardized container styling.
*
* @param {string} id - The id of the div element.
* @returns {HTMLDivElement} The styled div element.
*/
function createDiv(id) {  
  /** @type {HTMLDivElement} */
  const el = document.createElement("div");    
  el.id = id;    
  const styles = {    
    flex: "1",    
    background: "var(--box-bg)",  
  };    
  Object.assign(el.style, styles);    
  return el;
}

/**
 * Changes flex value of some elements.
 * @param {...any} args - [string, string] Pairs of element id and flex value.
 * @returns {void}
 */
function changeElementsFlex(...args) {  
  for(arg of args) {    
    const el = document.getElementById(arg[0]);    
    const flex = arg[1];    
    el.style.flex = flex;  
  }
}

/**
 * Creates button element and applies standardized button styling.
 *
 * @param {string} id - The id of the button element.
 * @param {string} caption - The caption of the button element.
 * @returns {HTMLButtonElement} The styled button element.
*/
function createButton(id, caption) {  
  /** @type {HTMLButtonElement} */
  const el = document.createElement("button");    
  el.id = id;  
  el.innerHTML = caption;    
  const styles = {    
    display: "block",    
    width: "100%",    
    boxSizing: "border-box",  
  };    
  Object.assign(el.style, styles);    
  return el;
}

// marker: 26b41.js
(() => {  
  console.log("[marker] 26b41.js loaded");
})();