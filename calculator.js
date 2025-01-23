"use strict";

const history = document.querySelector('.history');
const expression = document.querySelector('.expression');
const expVal = document.querySelector('.eval');
let expCalc = expression.textContent;
const cl = console.log;
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
    while(exp.includes("%")) {
        expNew = exp.replace(/(?<!\d)(\-?\d+(?:\.\d+)?)(%)/, ($0, $1, $2) => operate(+$1, null, $2) ?? $0);
        if (expNew === exp) return NaN;
        else exp = expNew;
    }
    // Eval roots
    while(exp.includes("√")) {
        expNew = exp.replace(/(√)(-?\d+(?:\.\d+)?)/, ($0, $1, $2) => operate(+$2, null, $1) ?? $0);
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

function padWithParenthesis(exp) {

    let parenthesisMissing = exp.split("(").length - exp.split(")").length
    return exp.padEnd(expCalc.length + parenthesisMissing, ')');
}

function updateResult() {

    // Pad then evaluate
    let evaluated = evaluate(padWithParenthesis(expCalc));
    expVal.textContent = /^\-?\d+(?:\.\d+)?$/.test(evaluated) ? Math.round(evaluated*1e10)/1e10  : '';
}
let pressed = null;
function parseInput(input) {
    switch(input) {

        case 'c':
        case 'C':
        case 'clear':

            // Clear all
            expression.textContent = expVal.textContent = expCalc = '';
            break;

        case 'Delete':
        case 'Backspace':
        case 'D':
        case 'd':

            // Delete last character
            expression.textContent = expression.textContent.slice(0, -1);
            expCalc = expCalc.slice(0, -1);
            updateResult();
            break;

        case 'H':
        case 'h':

            history.classList.toggle("visible");
            break;

        case 'history':

            // Open history display with expression history
            history.classList.contains("visible") ? undefined : history.classList.add("visible");
           
            break;

        case 'Escape':
        case 'close':

            // Close history display
            history.classList.contains("visible") ? history.classList.remove("visible") : undefined
            break;

        case 'square-root':

            // Add square root symbols
            if (/[\d\)\%]$/.test(expCalc)) appendMultiply();

            expression.textContent += '√(', expCalc += '√(', expVal.textContent = '';
            break;

        case 'N':
        case 'n':
        case 'negative':

            if(expCalc.endsWith(".")) break; 
            
            // add negative symbols
            if (/[\d\)\%]$/.test(expCalc)) appendMultiply();

            expression.innerHTML += '(&minus;', expCalc += '(-', expVal.textContent = '';
            break;

        case 'Enter':
        case '=':

            // If evaluated not a valid number, do nothing 
            if(!/^\-?\d+(?:\.\d+)?$/.test(expVal.textContent.toString())) break;

            // Stack expression to history 
            let previousExp = history.querySelector(".history-values > div:first-child");
            let newExp = document.createElement("div");
            
            newExp.innerHTML = `<div>${padWithParenthesis(expression.textContent)}</div>
                                <div class="stored-eval">=${expVal.textContent}</div>`;
            
            previousExp ?
            previousExp.parentElement.insertBefore(newExp, previousExp) :
            history.lastElementChild.appendChild(newExp)
            
            // Clear/Update expressions
            expression.textContent = expCalc = expVal.textContent;
            expVal.textContent = "";
            break;

        case '(':
        case ')':
        case '()':
            
            // Open if empty, operator/"("" precedes it, or equal numbers of open and close parenthesis
            if (
                (!expCalc ||
                /[\(\^\*\/\+\-\√\.]$/.test(expCalc) || 
                expCalc.split("(").length === 
                expCalc.split(")").length)
            ) {

                // User tried to enter illegal close parenthesis, do nothing
                if(input === ')') break;

                // If last inputted value is a number/"%"/")" append "*(" to expression
                if (/[\d\)\%]$/.test(expCalc)) appendMultiply();
                expression.textContent += "(", expCalc += "(", expVal.textContent = '';
            }
            else {
                
                // User tried to enter illegal open parenthesis, do nothing
                if(input === '(') break;

                expression.textContent += ")", expCalc += ")";
                updateResult();   
            }
            break;
        
        case ".": 
            
            // End can't be a number with "."
            if(/\d+\.\d*$/.test(expCalc)) break;
            
            if (/[\)\%]$/.test(expCalc)) appendMultiply();
            
            // If last inputted value is not a number, then append "0" before "."
            if (!expCalc || /\D$/.test(expCalc)) {
                expression.textContent += "0", expCalc += "0";    
            }

            expression.textContent += input, expCalc += input;
            expVal.textContent = '';    
            break;

        default:

            // Append numbers
            if (/^\d$/.test(input)){
                
                if (/[\)\%]$/.test(expCalc)) appendMultiply();
        
                expression.textContent += input, expCalc += input;
                updateResult();
            }
            
            // Append symbols
            else if (/[\%\^\*\/\+\-]/.test(input)) {

                // If Valid end
                if (/[\d\)\%]$/.test(expCalc)) {

                    //account for operator difference in display "/", "*","-"
                    expression.innerHTML += input === "*" ? "&times;" :
                                            input === "/" ? "&divide":
                                            input === "-" ? "&minus;": input
                                        
                    expCalc += input;
                    
                    if (input === "%") updateResult();
                    else expVal.textContent = '';
                }
            }
    }
} 

document.addEventListener('DOMContentLoaded', function() {
        
    let btns = document.querySelectorAll('button');
    btns.forEach(btn => {
        btn.addEventListener('click', function() {
            parseInput(this.getAttribute("data-value"));
        });
    });
    document.addEventListener("keydown", (e) => {
        e.preventDefault()
        parseInput(e.key)
    });
    // Add functionality to close history by just clicking outside history
    document.addEventListener("click",(e) => {
        // elmt.closest()>returns closest ancesstor among selectors
        if(e.target.getAttribute("data-value") !== "history" &&
            !e.target.closest(".history")
        ) {
            history.classList.contains("visible") ? 
            history.classList.remove("visible") : undefined 
        }
    });
});

// fix user () keyboard insert>>deny if illegal else insert desired, not current behaviour

// read instruction on top

// fix expression and expval overflow
// border-radius

// clean cl(), refactor