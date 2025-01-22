"use strict";

const historyDisplay = document.querySelector('.history-values');
const expression = document.querySelector('.expression');
const expVal = document.querySelector('.eval');
let expCalc = expression.textContent;

function appendMultiply() {
    expression.textContent += "×";      
    expCalc += "*";
}

function operate (a,b, operator) {
    if (isNaN(a) || isNaN(b)) {
        return null;
    }
    switch(operator) {
        case '+':
            return a + b;
        case '-':
            return a - b;
        case '*':
            return a * b;
        case '/':
            return a / b;
        case '^':
            
            // If positive base or exponent isn't a fraction
            if (a >= 0 || Math.abs(b) >= 1 || b == 0) return Math.pow(a, b)
            
            // IF odd root
            if ((1 / b) % 2 !== 0) return -Math.pow(Math.abs(a), b)
            
            return null
            
        case '√':
            return Math.sqrt(a);
        case '%':
            return a / 100;
    }
}

// Evaluate expression, operate returns undefined if a or b is NaN. isNaN(null) -> false so used null cause isNaN(undefined) -> true
function equals(exp) {
    
    let expNew = exp;
    // Eval percentages
    while(expNew = exp.replace(/(?<!\d)(\-?\d+(?:\.\d+)?)(%)/, ($0, $1, $2) => operate(+$1, null, $2) ?? $0)) {
        if (expNew === exp) return NaN;
        else exp = expNew;
    }
    // Eval roots
    while(exp.inew = exp.replace(/(√)(-?\d+(?:\.\d+)?)/, ($0, $1, $2) => operate(+$2, null, $1) ?? $0)) {
        if (expNew === exp) return NaN;
        else exp = expNew;
    }
    
    // Eval exponentials, multiplications & divisions, sums & substractions(ltr)
    let regExp = null;
    for (let operator of ['\\^', '\\*\\/', '\\-\\+']) {

        // While there are still operators to evaluate, make sure "-" is not a negative sign
        regExp = new RegExp(`(?<!\\d)(-?\\d+(?:\\.\\d+)?)([${operator}])(-?\\d+(?:\\.\\d+)?)`);
        while(regExp.test(exp)) {
            
            expNew = exp.replace(regExp, ($0, $1, $2, $3) => operate(+$1, +$3, $2) ?? $0);
            if (expNew === exp) return NaN;
            else exp = expNew;
        }
    }

    return exp;
}

function evaluate(exp) {
    
    // If empty, NaN (NaN doesn't equal itself) or number
    if (!exp || exp !== exp || /^\-?\d+(?:\.\d+)?$/.test(exp)) return exp;
    
    // Do root, exponential, multiplication, division, percentage, addition, subtraction
    if (!/[()]/g.test(exp)) return equals(exp);

    // Loop over all internal parenthesis replace them with their evaluated value
    for (let ex of exp.matchAll(/\(([^\(\)]*)\)/g)) {
        exp = exp.replace(ex[0], evaluate(ex[1]));
    }

    // Call evaluate again to evaluate the new expression
    return evaluate(exp)
}

// Note: below expCalc is passed by value, so not changed. while expVal is passed by reference, so changed
function updateResult() {

    // Pad end with ")", to account for unclosed parenthesis
    let parenthesisMissing = expCalc.split("(").length - expCalc.split(")").length
    let expCalcTemp = expCalc.padEnd(expCalc.length + parenthesisMissing, ')')

    // If evaluated expression is a number, then display it
    let evaluated = evaluate(expCalcTemp);
    expVal.textContent = /^\-?\d+(?:\.\d+)?$/.test(evaluated) ? evaluated : '';
}

function parseInput(btn) {
    switch(btn.getAttribute("data-value")) {
        case 'clear':

            // Clear all
            expression.textContent = expVal.textContent = expCalc = '';
            break;

        case "delete":

            // Delete last character
            expression.textContent = expression.textContent.slice(0, -1);
            expCalc = expCalc.slice(0, -1);
            updateResult();
            break;

        case 'history':

            // TODO: Open history display with expression, closing unclosed parenthesis
            break;

        case 'close':

            // TODO: close history display
            break;

        case 'square-root':

            // add square root symbols
            if (/[\d\)\%]/.test(expression.textContent.at(-1))) appendMultiply();

            expression.textContent += '√(', expCalc += '√(', expVal.textContent = '';
            break;

        case 'negative':
            if(expression.textContent.endsWith(".")) break; 
            // add negative symbols
            if (/[\d\)\%]/.test(expression.textContent.at(-1))) appendMultiply();

            expression.textContent += '(-', expCalc += '(-', expVal.textContent = '';
            break;

        case '=':

            // Todo: append expression to history, clear expressions, add a way to restore dispaly to original
            // Todo: display history

            // If value not a number return
            if(!/^\-?\d+(?:\.\d+)?$/g.test(expVal)) break;
            historyDisplay.innerHTML += `<div>
                                            <div>${expression.textContent}</div>
                                            <div class="stored-eval">=${expVal.textContent}</div>
                                        </div>`;
            expression.textContent = expVal;
            expCalc.textContent = expVal.textContent = ""; 
            break;

        case '()':

            // Open if empty, operator/"("" precedes it, or equal numbers of open and close parenthesis
            if (
                !expression.textContent ||
                /[\(\^\*\÷\+\-\√\.]/.test(expression.textContent.at(-1)) || 
                expression.textContent.split("(").length === 
                expression.textContent.split(")").length
            ) {

                // If last inputted value is a number or close parenthesis, then append "*(" to expression
                if (/[\d\)\%]/.test(expression.textContent.at(-1))) appendMultiply();
                expression.textContent += "(", expCalc += "(", expVal.textContent = '';
            }
            else {
                expression.textContent += ")", expCalc += ")";
                updateResult();   
            }
            break;
        
        case ".": 
            if(expression.textContent.endsWith(".")) break;
            
            if (/[\)\%]/.test(expression.textContent.at(-1))) appendMultiply();
            
            // If last inputted value is not a number, then append "0" before "."
            if (!expression.textContent || /\D/.test(expression.textContent.at(-1))) {
                expression.textContent += "0", expCalc += "0";    
            }

            expression.textContent += btn.textContent, expCalc += btn.textContent;
            expVal.textContent = '';    
            break;

        default:

            // Append numbers
            if (/^\d$/.test(btn.textContent)){
                
                if (/[\)\%]/.test(expression.textContent.at(-1))) appendMultiply();
        
                expression.textContent += btn.textContent, expCalc += btn.textContent;
                updateResult();
            }
            
            // Append symbols
            else if (/[\%\^\*\/\+\-]/.test(btn.getAttribute("data-value"))) {
                if (/[\d\)\%]/.test(expression.textContent.at(-1))) {

                    //account for operator difference in "/", "*", "^"
                    if (btn.getAttribute("data-value") === "^") expression.textContent += btn.getAttribute("data-value");
                    else expression.textContent += btn.textContent;
                    expCalc += btn.getAttribute("data-value");
                    
                    if (btn.textContent === "%") updateResult();
                    else expVal.textContent = '';
                }
            }
    }
} 
document.addEventListener('DOMContentLoaded', function() {
    let btns = document.querySelectorAll('button');
    btns.forEach(btn => {
        btn.addEventListener('click', function(event) {
            parseInput(btn);
        });
    });   
});
// keyboard functionality
// round numbers for diplay
// equal, heistory close