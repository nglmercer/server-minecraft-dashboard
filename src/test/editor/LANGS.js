// LANGS.js
class SyntaxHighlighter {
    highlight(text) {
        return text; // No highlighting in base class
    }

    applyStyle(text, style) {
        return `<span style="${style}">${text}</span>`;
    }
}

// JSONHighlighter class
class JSONHighlighter extends SyntaxHighlighter {
    highlight(text) {
        const patterns = [
            { regex: /"(.*?)(?<!\\)":/g, style: 'color: #008000;' }, // Properties (Handles escaped quotes)
            { regex: /:(?<!\\)"(.*?)(?<!\\)"(?=[,\}\]])/g, style: 'color: #0000ff;' }, // Values (Handles escaped quotes and context)
            { regex: /[\{\}]/g, style: 'color: #000080;' }, // Brackets
            { regex: /\b(true|false|null)\b/g, style: 'color: #800080;' }, // Keywords
            { regex: /,(?=[^\s])/g, style: ''} // Commas (removed unnecessary style, could be styled if needed)
        ];

        let highlightedText = text;
        patterns.forEach(rule => {
            highlightedText = highlightedText.replace(rule.regex, (match) => this.applyStyle(match, rule.style));
        });
        return highlightedText;
    }
}

// JavaScriptHighlighter class
class JavaScriptHighlighter extends SyntaxHighlighter {
    highlight(text) {
        const patterns = [
            { regex: /\b(let|const|var|function|return|if|else|while|for|import|from|export|class|extends|super|this|new|typeof|instanceof|try|catch|finally|throw|debugger|in|of|break|continue|switch|case|default|delete|do|void|with|yield|async|await)\b/g, style: 'color: #800080;' }, // Keywords (more keywords added)
            { regex: /\/\/.*?$/gm, style: 'color: #008000;' }, // Single-line comments
            { regex: /\/\*[\s\S]*?\*\//g, style: 'color: #008000;' }, // Multi-line comments
            { regex: /"(.*?)(?<!\\)"/g, style: 'color: #0000ff;' }, // Strings (Handles escaped quotes)
            { regex: /'(.*?)(?<!\\)'/g, style: 'color: #0000ff;' }, // Single quoted strings
            { regex: /\b\d+\b/g, style: 'color: #a71d5d;' }, // Numbers
        ];

        let highlightedText = text;
        patterns.forEach(rule => {
            highlightedText = highlightedText.replace(rule.regex, (match) => this.applyStyle(match, rule.style));
        });
        return highlightedText;
    }
}

// YAMLHighlighter class
class YAMLHighlighter extends SyntaxHighlighter {
    highlight(text) {
        const patterns = [
            // Comments (full lines)
            { regex: /^\s*#.*$/gm, style: 'color: #008000;' },
            // Multiline strings (|, >) - Improved regex for better matching
            { regex: /^\s*([|>])\s*([+-]?)\s*(?:(\d+))?\s*\n([\s\S]*?)(?=\n^\S+|\Z)/gm, style: 'color: #8B4513;' },
            // Strings (double and single quotes, handles escaped quotes)
            { regex: /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'/g, style: 'color: #a31515;' }, // Changed color for strings to be more distinct
            // Keys (part before :)
            { regex: /^(\s*)([^\n#:]+):\s?/gm, style: (match, p1, p2) => p1 + this.applyStyle(p2, 'font-weight: bold; color: #267f99;') }, // Added color to keys
            // Boolean and null values
            { regex: /\b(true|false|null)\b/gi, style: 'color: #008080;' },
            // Numbers (integers, decimals, scientific notation)
            { regex: /\b([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\b/g, style: 'color: #098658;' }, // Changed color for numbers
            // Aliases and anchors (& and *)
            { regex: /(\B[&*][\w-]+)/g, style: 'color: #b267ce;' }, // Changed color for aliases/anchors
            // List items (-)
            { regex: /^(\s*)(-\s+)/gm, style: (match, p1, p2) => p1 + this.applyStyle(p2, 'color: #6a737d;') } // Changed color for list items
        ];

        let highlightedText = text;
        patterns.forEach(rule => {
            highlightedText = highlightedText.replace(rule.regex, (match, ...groups) => {
                if (typeof rule.style === 'function') {
                    return rule.style(match, ...groups);
                } else {
                    return this.applyStyle(match, rule.style);
                }
            });
        });
        return highlightedText;
    }
}

export {
    SyntaxHighlighter,
    JSONHighlighter,
    JavaScriptHighlighter,
    YAMLHighlighter
}