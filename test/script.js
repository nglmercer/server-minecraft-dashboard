class CodeEditor {
    constructor(editorId, initialContent = '', initialLanguage = 'plaintext') {
      this.editorElement = document.getElementById(editorId);
      this.initialContent = initialContent;
      this.initialLanguage = initialLanguage;
      this.currentContent = initialContent;
      this.currentLanguage = initialLanguage;
        if (this.editorElement) {
      this.initializeEditor();
        }
    }
  
    initializeEditor() {
      // Set initial content
      // set editable content
      this.editorElement.contentEditable = true;
      this.editorElement.innerHTML = this.initialContent;
      this.editorElement.style.whiteSpace = 'pre-wrap'; // O 'pre-line'
      // Highlight initial code
      hljs.highlightElement(this.editorElement);
  
      // Debounce function to limit the frequency of updates
      this.debouncedUpdateHighlight = this.debounce(this.updateHighlight.bind(this), 1000);
  
      // Listen for input events
      this.editorElement.addEventListener('input', this.debouncedUpdateHighlight);
  
      // Handle paste event to preserve spaces and line breaks
      this.editorElement.addEventListener('paste', this.handlePaste.bind(this));
    }
  
    debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
  
    saveCursorPosition(element) {
      const selection = window.getSelection();
      let cursorPosition = 0;
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        cursorPosition = preCaretRange.toString().length;
      }
      return cursorPosition;
    }
  
    restoreCursorPosition(element, cursorPosition) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
      let currentPosition = 0;
      let targetNode = null;
      let targetOffset = 0;
  
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeLength = node.length;
  
        if (currentPosition + nodeLength >= cursorPosition) {
          targetNode = node;
          targetOffset = cursorPosition - currentPosition;
          break;
        }
        currentPosition += nodeLength;
      }
  
      if (targetNode) {
        const range = document.createRange();
        range.setStart(targetNode, targetOffset);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        console.log(`Cursor restored to position: ${cursorPosition}`);
      } else {
        console.error('Cursor position could not be restored');
      }
    }
  
    updateHighlight() {
        // Save the current cursor position
        const cursorPosition = this.saveCursorPosition(this.editorElement);
        console.log(`Cursor position before update: ${cursorPosition}`);
      
        // Get the code content with line breaks
        this.currentContent = this.editorElement.innerText;
      
        // Highlight the code
        const result = hljs.highlightAuto(this.currentContent);
        console.log(`Language detected: ${result.language}`, result.value);
        this.editorElement.innerHTML = result.value;
        this.currentLanguage = result.language;
      
        // Restore the cursor position
        this.restoreCursorPosition(this.editorElement, cursorPosition);
      }
    handlePaste(event) {
      event.preventDefault(); // Prevent default paste behavior
  
      // Get pasted text
      const text = (event.clipboardData || window.clipboardData).getData('text');
  
      // Insert the pasted text at the cursor position
      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents(); // Remove any selected text
        range.insertNode(document.createTextNode(text)); // Insert the pasted text
      }
  
      // Trigger input event to update highlighting
      const inputEvent = new Event('input', { bubbles: true });
      this.editorElement.dispatchEvent(inputEvent);
    }
  
    getContent() {
      return this.currentContent;
    }
  
    getLanguage() {
      return this.currentLanguage;
    }
  
    resetToInitial() {
      this.currentContent = this.initialContent;
      this.currentLanguage = this.initialLanguage;
      this.editorElement.innerHTML = this.initialContent;
      hljs.highlightElement(this.editorElement);
    }
  }
  
  // Example usage:
  const editor = new CodeEditor('editor', '// Initial code here', 'javascript');
  setInterval(() => {
    //console.log(editor.currentContent);
    console.log(editor.getContent());
}, 1000);
  // To reset the editor to its initial state
  document.getElementById('reset-button').addEventListener('click', () => {
    editor.resetToInitial();
  });