
const codeInput = document.getElementById("codeInput");
const languageSelect = document.getElementById("language");
const validateBtn = document.getElementById("validateBtn");
const clearBtn = document.getElementById("clearBtn");
const lineNumbers = document.getElementById("lineNumbers");
const status = document.getElementById("status");
const results = document.getElementById("results");

const languageNames = {
    javascript: "JavaScript",
    java: "Java",
    python: "Python",
    cpp: "C++"
};

// Update line numbers while typing
function updateLineNumbers() {
    const lines = codeInput.value.split("\n").length;
    lineNumbers.textContent = Array.from(
        { length: lines },
        (_, i) => i + 1
    ).join("\n");
}

codeInput.addEventListener("input", updateLineNumbers);

codeInput.addEventListener("scroll", () => {
    lineNumbers.scrollTop = codeInput.scrollTop;
});

// Display a result message
function showResult(title, message, type = "neutral") {
    results.innerHTML = "";

    const item = document.createElement("div");
    item.className = "result-item";

    const heading = document.createElement("strong");
    heading.textContent = title;

    const description = document.createElement("p");
    description.textContent = message;

    item.appendChild(heading);
    item.appendChild(description);
    results.appendChild(item);

    status.textContent = title;
    status.className = `status ${type}`;
}

// Check whether the input resembles code
function looksLikeCode(code, language) {
    const text = code.trim();

    if (!text) return false;

    const patterns = {
        javascript: [
            /\b(const|let|var|function|return|if|else|for|while|class|import|export|new|throw|try)\b/,
            /\bconsole\.(log|warn|error)\s*\(/,
            /=>/,
            /[=+\-*/%<>!]=?|&&|\|\|/,
            /[{}();]/
        ],
        java: [
            /\b(public|private|protected|static|void|class|return|new|int|String|boolean|if|else|for|while)\b/,
            /System\.out\.(print|println)\s*\(/,
            /[{}();]/
        ],
        python: [
            /\b(def|class|return|if|elif|else|for|while|import|from|print|True|False|None|pass|in|and|or|not)\b/,
            /:\s*(#.*)?$/,
            /^\s*#/
        ],
        cpp: [
            /#include\b/,
            /\b(using|namespace|std|int|void|return|class|public|private|if|else|for|while|cout|cin)\b/,
            /<<|>>|[{}();]/
        ]
    };

    return patterns[language].some(pattern => pattern.test(text));
}

// Basic programming-language detection
function detectLanguage(code) {
    const patterns = [
        {
            language: "java",
            pattern: /\bpublic\s+static\s+void\s+main\b|System\.out\.(print|println)|\bpublic\s+class\b/
        },
        {
            language: "cpp",
            pattern: /#include\s*<.*>|std::|cout\s*<<|\bint\s+main\s*\(/
        },
        {
            language: "python",
            pattern: /^\s*def\s+\w+\s*\(.*\)\s*:|\bprint\s*\(.*\)|^\s*(if|elif|else|for|while)\b.*:/
        },
        {
            language: "javascript",
            pattern: /\b(console\.(log|warn|error)|const|let|var|function)\b|=>/
        }
    ];

    for (const item of patterns) {
        if (item.pattern.test(code)) {
            return item.language;
        }
    }

    return null;
}

// Check brackets and quotation marks
function checkBrackets(code) {
    const stack = [];
    const pairs = {
        ")": "(",
        "]": "[",
        "}": "{"
    };

    let quote = null;
    let quoteLine = 0;
    let line = 1;
    let inLineComment = false;
    let inBlockComment = false;
    let errors = [];

    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        const next = code[i + 1];

        if (char === "\n") {
            line++;
            inLineComment = false;

            if (quote && quote !== "`") {
                errors.push(
                    `Line ${quoteLine}: Unclosed quotation mark. Add the missing ${quote}.`
                );
                quote = null;
            }

            continue;
        }

        if (inLineComment) continue;

        if (inBlockComment) {
            if (char === "*" && next === "/") {
                inBlockComment = false;
                i++;
            }
            continue;
        }

        if (quote) {
            if (char === "\\") {
                i++;
                continue;
            }

            if (char === quote) {
                quote = null;
            }
            continue;
        }

        if (char === "/" && next === "/") {
            inLineComment = true;
            i++;
            continue;
        }

        if (char === "/" && next === "*") {
            inBlockComment = true;
            i++;
            continue;
        }

        if (char === '"' || char === "'" || char === "`") {
            quote = char;
            quoteLine = line;
            continue;
        }

        if (char === "(" || char === "[" || char === "{") {
            stack.push({ char, line });
        } else if (char === ")" || char === "]" || char === "}") {
            const last = stack[stack.length - 1];

            if (!last || last.char !== pairs[char]) {
                errors.push(
                    `Line ${line}: Unexpected "${char}". Check the matching opening bracket.`
                );
            } else {
                stack.pop();
            }
        }
    }

    if (quote) {
        errors.push(
            `Line ${quoteLine}: Unclosed quotation mark. Add the missing ${quote}.`
        );
    }

    if (inBlockComment) {
        errors.push(
            "Unclosed block comment. Add */ to close the comment."
        );
    }

    for (const item of stack) {
        const closing = { "(": ")", "[": "]", "{": "}" }[item.char];

        errors.push(
            `Line ${item.line}: Missing "${closing}" to close "${item.char}".`
        );
    }

    return errors;
}

// Validate code
validateBtn.addEventListener("click", () => {
    const code = codeInput.value.trim();
    const language = languageSelect.value;

    if (!code) {
        showResult(
            "Empty Input",
            "Please enter code to validate.",
            "warning"
        );
        return;
    }

    // Reject input that does not resemble code
    if (!looksLikeCode(code, language)) {
        showResult(
            "Invalid Code Input",
            "Please enter valid code for the selected language.",
            "error"
        );
        return;
    }

    // Warn when the code appears to belong to another language
    const detectedLanguage = detectLanguage(code);

    if (detectedLanguage && detectedLanguage !== language) {
        showResult(
            "Language Mismatch",
            `This input appears to be ${languageNames[detectedLanguage]}. Please select the correct programming language.`,
            "warning"
        );
        return;
    }

    // Run basic syntax checks
    const errors = checkBrackets(code);

    if (errors.length > 0) {
        showResult(
            "Syntax Issues Detected",
            errors.join("\n"),
            "error"
        );

        const description = results.querySelector("p");
        description.style.whiteSpace = "pre-line";
        return;
    }

    showResult(
        "No Basic Issues Detected",
        "No issues were found by the basic checks. This does not guarantee that the code is fully valid.",
        "success"
    );
});

// Clear editor and results
clearBtn.addEventListener("click", () => {
    codeInput.value = "";
    updateLineNumbers();

    results.innerHTML = "";
    status.textContent = "";
    status.className = "status";

    codeInput.focus();
});

// Initial setup
updateLineNumbers();
    