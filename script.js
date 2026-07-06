const equation = document.getElementById("equation");
const numbers = document.getElementById("numbers");
const deleteBtn = document.getElementById("deleteBtn");
const levelText = document.getElementById("level");

// عناصر تصنيفات اللعبة
const btnAddSub = document.getElementById("mode-add-sub");
const btnMulDiv = document.getElementById("mode-mul-div");
const btnRandom = document.getElementById("mode-random");

let level = 1;
let currentMode = "random"; // الوضع الافتراضي: مختلط

let answer = [];
let player = [];
let operators = [];
let target = 0;

// إدارة اختيار الأوضاع / التصنيفات
function setMode(mode, button) {
    currentMode = mode;
    document.querySelectorAll(".mode-btn").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    level = 1; // إعادة تعيين المستوى عند تغيير التصنيف
    newLevel();
}

btnAddSub.onclick = () => setMode("add_sub", btnAddSub);
btnMulDiv.onclick = () => setMode("mul_div", btnMulDiv);
btnRandom.onclick = () => setMode("random", btnRandom);

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLevelData() {
    let operationCount = 1;
    if (level >= 6) operationCount = 2;
    if (level >= 15) operationCount = 3;
    if (level >= 30) operationCount = 4;

    let count = operationCount + 1;
    
    let tempAnswer = [];
    while (tempAnswer.length < count) {
        let n = random(1, 9);
        if (!tempAnswer.includes(n)) {
            tempAnswer.push(n);
        }
    }

    let tempOperators = [];
    for (let i = 0; i < operationCount; i++) {
        let allowed = [];
        
        if (currentMode === "add_sub") {
            allowed = ["+", "-"];
        } else if (currentMode === "mul_div") {
            allowed = ["×"];
            if (level >= 5) allowed.push("÷"); 
        } else {
            allowed = ["+", "-"];
            if (level >= 8) allowed.push("×");
            if (level >= 20) allowed.push("÷");
        }

        tempOperators.push(allowed[random(0, allowed.length - 1)]);
    }

    return { tempAnswer, tempOperators };
}

// دالة فحص مسبق للتأكد من أن المسألة لها حل ممكن متاح بالأرقام المتبقية من 1 إلى 9
function hasValidSolution(targetNum, opsCount, currentOps) {
    let possibleNums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let foundSolution = false;

    function permute(currentPerm, remaining) {
        if (foundSolution) return;
        
        if (currentPerm.length === opsCount + 1) {
            if (calculate(currentPerm, currentOps) === targetNum) {
                // فحص للتأكد من أن خطوات القسمة المرحلية لا تنتج كسوراً
                if (currentOps.includes("÷")) {
                    let testExpr = "";
                    let isStepValid = true;
                    for(let i=0; i<currentPerm.length; i++) {
                        if(i > 0 && currentOps[i-1] === "÷") {
                            if(eval(testExpr) % currentPerm[i] !== 0) {
                                isStepValid = false;
                            }
                        }
                        testExpr += currentPerm[i];
                        if(i < currentOps.length) {
                            testExpr += currentOps[i] === "×" ? "*" : currentOps[i] === "÷" ? "/" : currentOps[i];
                        }
                    }
                    if(!isStepValid) return;
                }
                foundSolution = true;
            }
            return;
        }

        for (let i = 0; i < remaining.length; i++) {
            currentPerm.push(remaining[i]);
            let nextRemaining = remaining.filter((_, idx) => idx !== i);
            permute(currentPerm, nextRemaining);
            currentPerm.pop();
        }
    }

    permute([], possibleNums);
    return foundSolution;
}

function newLevel() {
    player = [];
    equation.innerHTML = "";
    numbers.innerHTML = "";
    levelText.textContent = "Level " + level;

    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 300) {
        attempts++;
        let data = generateLevelData();
        let res = calculate(data.tempAnswer, data.tempOperators);
        
        // شروط صارمة: رقم صحيح، ناتج غير سالب، وله حل مؤكد ومتاح في كيبورد الأرقام
        if (Number.isInteger(res) && isFinite(res) && res >= 0) {
            if (hasValidSolution(res, data.tempOperators.length, data.tempOperators)) {
                answer = data.tempAnswer;
                operators = data.tempOperators;
                target = res;
                valid = true;
            }
        }
    }

    // حالة احتياطية بسيطة جداً لمنع أي تعليق
    if (!valid) {
        answer = [2, 3];
        operators = ["+"];
        target = 5;
    }

    buildEquation();
    buildNumbers();
}

function buildEquation() {
    equation.innerHTML = "";

    for (let i = 0; i < answer.length; i++) {
        const box = document.createElement("div");
        box.className = "box";
        equation.appendChild(box);

        if (i < operators.length) {
            const op = document.createElement("div");
            op.className = "operator";
            op.textContent = operators[i];
            equation.appendChild(op);
        }
    }

    const equal = document.createElement("div");
    equal.className = "operator";
    equal.textContent = "=";
    equation.appendChild(equal);

    const result = document.createElement("div");
    result.className = "result";
    result.textContent = target;
    equation.appendChild(result);
}

function buildNumbers() {
    numbers.innerHTML = "";
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement("button");
        btn.className = "number";
        btn.textContent = i;
        btn.onclick = function () {
            selectNumber(btn, i);
        };
        numbers.appendChild(btn);
    }
}

function selectNumber(button, number) {
    if (player.includes(number)) return;
    if (player.length >= answer.length) return;

    player.push(number);
    const boxes = document.querySelectorAll(".box");
    
    // تعبئة المربع وإضافة تأثير التغميق (filled) له هو فقط
    let currentBox = boxes[player.length - 1];
    currentBox.textContent = number;
    currentBox.classList.add("filled");
    
    button.classList.add("used");

    if (player.length === answer.length) {
        setTimeout(checkAnswer, 250);
    }
}

deleteBtn.onclick = function () {
    if (player.length === 0) return;

    const last = player.pop();
    const boxes = document.querySelectorAll(".box");
    
    // إزالة الرقم وإلغاء التغميق من المربع المستهدف
    let currentBox = boxes[player.length];
    currentBox.textContent = "";
    currentBox.classList.remove("filled");

    document.querySelectorAll(".number").forEach(btn => {
        if (Number(btn.textContent) === last) {
            btn.classList.remove("used");
        }
    });
};

function calculate(nums, ops) {
    let expression = "";
    for (let i = 0; i < nums.length; i++) {
        expression += nums[i];
        if (i < ops.length) {
            switch (ops[i]) {
                case "×": expression += "*"; break;
                case "÷": expression += "/"; break;
                default: expression += ops[i];
            }
        }
    }
    try {
        return Math.round(Function("return " + expression)());
    } catch {
        return 0;
    }
}

function checkAnswer() {
    let result = calculate(player, operators);

    if (result === target) {
        level++;
        setTimeout(() => {
            newLevel();
        }, 400);
    } else {
        shake();
        setTimeout(() => {
            player = [];
            document.querySelectorAll(".box").forEach(box => {
                box.textContent = "";
                box.classList.remove("filled");
            });
            document.querySelectorAll(".number").forEach(btn => {
                btn.classList.remove("used");
            });
        }, 350);
    }
}

function shake() {
    equation.animate(
        [
            { transform: "translateX(-6px)" },
            { transform: "translateX(6px)" },
            { transform: "translateX(-6px)" },
            { transform: "translateX(6px)" },
            { transform: "translateX(0px)" }
        ],
        { duration: 300 }
    );
}

newLevel();
