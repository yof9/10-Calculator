"use strict";

const expression = document.querySelector('.expression');
let expCalc = expression.textContent;
const expVal = document.querySelector('.eval');
const history = document.querySelector('.history');

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
            
            // IF -ve base and exponent is a fraction (odd root)
            if ((1 / b) % 2 !== 0) return -Math.pow(Math.abs(a), b)
                
            // if -ve base and exponent is a fraction (even root:handled by isError(), just precaution)
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
        expNew = exp.replace(/(?<!\d)(\-?\d+(?:\.\d+)?(?:e[\+\-]\d+)?)(%)/, ($0, $1, $2) => operate(+$1, null, $2) ?? $0);
        if (expNew === exp) return NaN;
        else exp = expNew;
    }
    // Eval roots
    while(exp.includes("√")) {
        expNew = exp.replace(/(√)(-?\d+(?:\.\d+)?(?:e[\+\-]\d+)?)/, ($0, $1, $2) => operate(+$2, null, $1) ?? $0);
        if (expNew === exp) return NaN;
        else exp = expNew;
    }
    // Eval exponentials, multiplications & divisions, sums & substractions(ltr)
    let regExp = null;
    for (let operator of ['\\^', '\\*\\/', '\\-\\+']) {
        // While there are still operators to evaluate, make sure "-" is not a negative sign
        regExp = new RegExp(`(?<!\\d)(-?\\d+(?:\\.\\d+)?(?:e[\\+\\-]\\d+)?)([${operator}])(-?\\d+(?:\\.\\d+)?(?:e[\\+\\-]\\d+)?)`)
        while(regExp.test(exp)) {
            
            expNew = exp.replace(regExp, ($0, $1, $2, $3) => operate(+$1, +$3, $2) ?? $0);
            if (expNew === exp) return NaN;
            else exp = expNew;
        }
    }

    return exp;
}
function isError(exp){
    
    let errorMatch = null;

    // Dividing by zero
    errorMatch = exp.matchAll(/(?:\/\-?)((?:\d+\.\d+|\d+(?!\.))(?:e[\+\-]\d+)?)/g);
    for (let ex of errorMatch) {
        if (+ex.at(1) === 0) { 
            return {"error": "Zero Division Error!!"};
        }
    }

    // Square root of -ve
    errorMatch = exp.matchAll(/(?:\√\-)((?:\d+\.\d+|\d+(?!\.))(?:e[\+\-]\d+)?)/g);
    for (let ex of errorMatch) {
        if (+ex.at(1) !== 0) {
            return {"error": "Negative Numbers Don't Have Square Root!!"};
        }
    }

    //-ve base and exponent is a fraction evaluating to odd root
    errorMatch = exp.matchAll(/(?:\-\d+(?:\.\d+)?(?:e[\+\-]\d+)?\^\-?)((?:\d+\.\d+|\d+(?!\.))(?:e[\+\-]\d+)?)/g);
    for (let ex of errorMatch) {
        if (+ex.at(1) > 0 && +ex.at(1) < 1 && (1 / +ex.at(1)) % 2 === 0) {
            return {"error": "Negative Numbers Don't Have even Root!!"};
        }
    }
}

function validateDigit(num) {
    let errorMatch = null;

    // More than 10 digits after decimal point
    errorMatch = num.match(/\.\d{18,}|\.\d{17,}(?=e[\+\-]\d+)/);
    if (errorMatch) {
        return {"error": "Only 17 Digits allowed after Decimal Point!!"};
    }

    // More than 15 digits in total
    errorMatch = num.matchAll(/(\d+)(?:\.)?(\d*)(e[\+\-]\d+)?/g);
    for (let ex of errorMatch) {
        if ((ex.at(1).concat(ex.at(2)).length > 22 && !ex.at(3)) || 
            (ex.at(1).concat(ex.at(2)).length > 21 && ex.at(3))
        ) { 
            return {"error": "Total number of Digits can't exceed 22!!"};
        }
    }
}

function evaluate(exp) {

    let errorChecked = null; 

    // If empty, NaN (NaN doesn't equal itself) or number
    if (!exp || exp !== exp || /^\-?\d+(?:\.\d+)?(?:e[\+\-]\d+)?$/.test(exp)) {
        errorChecked = isError(exp)
        return errorChecked?.error ? errorChecked : exp;
    }
    
    // Do root, exponential, multiplication, division, percentage, addition, subtraction
    if (!/[()]/g.test(exp)) {
        errorChecked = isError(exp)
        return errorChecked?.error ? errorChecked : equals(exp);
    }
    
    // Loop over all internal parenthesis replace them with their evaluated value
    for (let ex of exp.matchAll(/\(([^\(\)]*)\)/g)) {
        errorChecked = evaluate(ex[1])

        // If value returned for error before replacing
        if (errorChecked?.error) return errorChecked
        exp = exp.replace(ex[0], errorChecked);
     }

    // Call evaluate again to evaluate the new expression
    return evaluate(exp)
}

function padWithParenthesis(exp) {

    let parenthesisMissing = exp.split("(").length - exp.split(")").length
    return exp.padEnd(expCalc.length + parenthesisMissing, ')');
}

function displayError(error, errorClass) {

    // Assign error value
    expVal.textContent = error;

    // Set error styling
    errorClass = errorClass || "error";

    !expVal.classList.contains(errorClass) ? 
    expVal.classList.add(errorClass) : undefined;
        

}
function displayValue(value) {
    cl("vv",value, typeof value)

    // Assign value valid number
    if (/^\-?\d+(?:\.\d+)?(?:e[\+\-]\d+)?$/.test(value)) {

        let parts = value.trimStart("-").replace(/e[\+\-]\d+$/, "1").split(".") 
        
        value = parts.join("")?.length > 22 || parts.at(1)?.length > 17 ?
        (+value).toExponential(16) : value;

        expVal.innerHTML = value.replaceAll("-", "&minus;")
    }
    else {
        // operator/"("...
        expVal.textContent = ""
    }
    // Set valid styling
    expVal.classList.remove("error", "digitError");
    
}

function updateResult() {

    // Pad then evaluate
    let evaluated = evaluate(padWithParenthesis(expCalc));
    cl(evaluated)
    
    evaluated?.error ? displayError(evaluated.error) : displayValue(evaluated);
    
}

function parseInput(input) {
    
    switch(input) {

        case 'c':
        case 'C':
        case 'clear':

            // Clear all
            expression.textContent = expVal.textContent = expCalc = '';

            //remove error styling
            expVal.classList.remove("error", "digitError");
            
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

            // User tried to enter illegal square-root
            if(/(\.|e[\+\-]?)$/.test(expCalc)) break; 

            // Add square root symbols
            if (/[\d\)\%]$/.test(expCalc)) appendMultiply();

            expression.textContent += '√(', expCalc += '√(';
            if (!expVal.classList.contains("error"))expVal.textContent = '';

            break;

        case 'N':
        case 'n':
        case 'negative':

            // User tried to enter illegal negation
            if(/(\.|e[\+\-]?)$/.test(expCalc)) break;
            
            // add negative symbols
            if (/[\d\)\%]$/.test(expCalc)) appendMultiply();

            expression.innerHTML += '(&minus;', expCalc += '(-';
            if (!expVal.classList.contains("error"))expVal.textContent = '';

            break;

        case 'Enter':
        case '=':

            // If digit error update expval
            if(expVal.classList.contains("digitError")) updateResult();
           
            // If evaluated not a valid number, do nothing
            let formattedExpVal = expVal.textContent.replaceAll("−", "-"); 
            if(!/^\-?\d+(?:\.\d+)?(?:e[\+\-]\d+)?$/.test(formattedExpVal)) break;

            // Stack expression to history 
            let previousExp = history.querySelector(".history-values > div:first-child");
            let newExp = document.createElement("div");
            
            newExp.innerHTML = `<div>${padWithParenthesis(expression.textContent)}</div>
                                <div class="stored-eval">=${expVal.textContent}</div>`;
            
            previousExp ?
            previousExp.parentElement.insertBefore(newExp, previousExp) :
            history.lastElementChild.appendChild(newExp)
            
            // Clear/Update expressions
            expression.textContent = expVal.textContent;
            expCalc = formattedExpVal;
            expVal.textContent = "";
            break;

        case '(':
        case ')':
        case '()':

            // User tried to enter illegal close parenthesis, do nothing
            if(input === ')' || /(\.|e[\+\-]?)$/.test(expCalc)) break;
            
            // Open if empty, operator/"("" precedes it, or equal numbers of open and close parenthesis
            if (
                (!expCalc ||
                /[\(\^\*\/\+\-\√]$/.test(expCalc) ||
                expCalc.split("(").length === 
                expCalc.split(")").length)
            ) {

                // If last inputted value is a number/"%"/")" append "*(" to expression
                if (/[\d\)\%]$/.test(expCalc)) appendMultiply();
                expression.textContent += "(", expCalc += "(";

                // Replace digitError with error, by updatingresult
                if(expVal.classList.contains("error", "digitError")) updateResult();

                else if (!expVal.classList.contains("error"))expVal.textContent = '';
            }
            else {
                
                // User tried to enter illegal open parenthesis, do nothing
                if(input === '(') break;

                expression.textContent += ")", expCalc += ")";
                updateResult();   
            }

            break;
        
        case ".": 
            
            // End can't be a number with "." or e
            if(/(\d+\.\d*|e)$/.test(expCalc)) break;

            //Can't add more numbers after it
            if(/\d{22,}$/.test(expCalc)) {

                displayError("Total number of Digits can't exceed 22!!", "digitError")
                break;
            }
            if (/[\)\%]$/.test(expCalc)) appendMultiply();
            
            // If last inputted value is not a number, then append "0" before "."
            if (!expCalc || /\D$/.test(expCalc)) {
                expression.textContent += "0", expCalc += "0";    
            }

            expression.textContent += input, expCalc += input;

            // Update result to parse erroring
            updateResult();
            
            break;

        default:

            // Append numbers
            if (/^\d$/.test(input) && !/(e|e[\+\-]\d{3,})$/.test(expCalc)){
                
                if (/[\)\%]$/.test(expCalc)) appendMultiply();

                //Check validity
                let digitValidation = validateDigit(expCalc+input);
                if(digitValidation?.error) displayError(digitValidation.error, "digitError");
                else expression.textContent += input, expCalc += input, updateResult();
                        
                    

            }
            
            // Append symbols
            else if (/[\%\^\*\/\+\-]/.test(input)) {

                // If Valid end
                if (/([\d\)\%\^\*\/\+]|(?<!\()\-|e[\+\-]|e)$/g.test(expCalc)) {

                    // If end is operator to be replaced, trim
                    if (/([\^\*\/\+]|(?<!\()\-|e[\+\-])$/g.test(expCalc)) {

                        expression.textContent = expression.textContent.slice(0, -1);
                        expCalc = expCalc.slice(0, -1);
                    }
                    if (expCalc.endsWith("e") && !/[\+\-]/.test(input)) break;

                    //account for operator difference in display "/", "*","-"    
                    expression.innerHTML += input === "*" ? "&times;" :
                                            input === "/" ? "&divide":
                                            input === "-" ? "&minus;": input;
                        
                    expCalc += input
                    if (input === "%") updateResult();
                    
                    // Replace digitError with error, by updatingresult
                    else if(expVal.classList.contains("error", "digitError")) updateResult();
                        
                    else if(!expVal.classList.contains("error")) expVal.textContent = '';
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

        // elmt.closest()>returns closest ancester among selectors
        if(e.target.getAttribute("data-value") !== "history" &&
            !e.target.closest(".history")
        ) {
            history.classList.contains("visible") ? 
            history.classList.remove("visible") : undefined 
        }
    });
});
// format with comma

// error if +ve/-ve infinity, 
// style expval after "="

// fix expression overflow && expEval(???)

// border-radius

// clean cl(), refactor
// check trimStart("-") is valid method
