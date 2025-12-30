import { findMatchingParentNode, hasClass, openHtmlInNewTab } from "../util.js";

/**
 * Initializes code toolbars for all <pre> elements within the given element
 * @param {HTMLElement} elem - The container element to search for <pre> tags
 */
export function copyToClipboard(elem) {  
  const allPres = elem.querySelectorAll('pre');
  allPres.forEach(pre => {
    // Skip self-messages and elements within .think containers
    if (hasClass(pre, "self-message") || findMatchingParentNode(pre, ".think")) {
      return;
    }
    
    // Create toolbar if not already present
    if (!pre.getAttribute("toolbar")) {
      createToolbarCoder(pre);
    }
  });
}

/**
 * Creates and attaches a toolbar to a code block with copy, run, and download functionality
 * @param {HTMLElement} pre - The <pre> element to enhance with a toolbar
 */
function createToolbarCoder(pre) {
  const preCodeHtml = pre.innerHTML;
  const codeContent = pre.textContent.trim();
  
  const toolbarTemplate = `
    <div class="code-container">
      <div class="toolbar d-flex justify-content-between">
        <a href="#" class="run btn-sm btn-outline-primary btn-toolbar" style="border:0px;visibility:hidden;" title="Click to Run">
          <svg class="bi theme-icon-active"><use href="#svg_run"></use></svg>
        </a>
        <div class="btn-group">
          <a href="#" class="download btn-sm btn-outline-secondary btn-toolbar" title="Click to Download" style="border:0px;display:none;">
            <svg class="bi theme-icon-active"><use href="#svg_download"></use></svg>
          </a>
          <a href="#" class="copy btn-sm btn-outline-secondary btn-toolbar" title="Click to Copy" style="border:0px;">
            <svg class="bi theme-icon-active svgcopy"><use href="#svg_copy"></use></svg>
            <svg class="bi theme-icon-active svgcheck" style="display:none;"><use href="#svg_check"></use></svg>
          </a>                            
        </div>                        
      </div>
      <pre style="margin-bottom:0px;">${preCodeHtml}</pre>
    </div>
  `;
  
  const doc = new DOMParser().parseFromString(`<div>${toolbarTemplate}</div>`, 'text/html');
  const container = doc.body.firstChild.cloneNode(true);
  const codeElement = doc.getElementsByTagName("code")[0];
  const isHtmlCode = hasClass(codeElement, "language-html");
  const isSvgCode = codeContent.startsWith("<svg");

  // Enable run and download buttons for HTML/SVG content
  if (isSvgCode || isHtmlCode) {
    setupRunButton(container, codeContent);
    setupDownloadButton(container, codeContent, isHtmlCode);
  }

  setupCopyButton(container, codeContent);
  
  container.querySelector("pre").setAttribute("toolbar", "true");
  pre.parentNode.replaceChild(container, pre);
}

/**
 * Sets up the run button to open HTML/SVG content in a new tab
 */
function setupRunButton(container, content) {
  const runBtn = container.querySelector(".run");
  runBtn.style.visibility = "visible";
  runBtn.addEventListener("click", e => {
    openHtmlInNewTab(content);
    e.preventDefault();
  });
}

/**
 * Sets up the download button to save HTML/SVG content as a file
 */
function setupDownloadButton(container, content, isHtml) {
  const downloadBtn = container.querySelector(".download");
  downloadBtn.style.display = "";
  
  downloadBtn.addEventListener("click", e => {
    const extension = isHtml ? "html" : "svg";
    const mimeType = `application/${extension}`;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    e.preventDefault();
  });
}

/**
 * Sets up the copy button to copy code content to clipboard with visual feedback
 */
function setupCopyButton(container, content) {
  const copyBtn = container.querySelector(".copy");
  const svgCopy = copyBtn.querySelector(".svgcopy");
  const svgCheck = copyBtn.querySelector(".svgcheck");
  let timeout = null;
  
  copyBtn.addEventListener("click", e => {
    navigator.clipboard.writeText(content);
    
    // Show checkmark feedback
    svgCopy.style.display = "none";
    svgCheck.style.display = "";
    
    // Reset to copy icon after 2 seconds
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      svgCopy.style.display = "";
      svgCheck.style.display = "none";
    }, 2000);
    
    e.preventDefault();
  });
}

/**
 * Initializes collapsible functionality for all .think elements
 * @param {HTMLElement} elem - The container element to search for .think elements
 */
export function thinkCollapseExpanded(elem) {
  const thinkElements = elem.querySelectorAll('.think');
  thinkElements.forEach(thinkElement => {
    collapseExpanded(thinkElement);
  });
}

/**
 * Makes a .think element collapsible if it has sufficient content
 * @param {HTMLElement} elem - The .think element to make collapsible
 */
function collapseExpanded(elem) {
  const htmlContent = elem.innerHTML;
  
  // Only create collapsible UI if content is substantial
  if (htmlContent.length > 15) {
    const foldableContent = createFoldableContent(htmlContent);
    
    foldableContent.querySelectorAll(".collapse-expand").forEach(btn => {
      btn.addEventListener('click', e => {
        const wrapper = foldableContent.querySelector('.think-content-wrapper');
        wrapper.classList.toggle('think-collapsed');
        foldableContent.classList.toggle('think-expanded');
        e.preventDefault();
      });
    });
    
    elem.parentNode.replaceChild(foldableContent, elem);
  }
}

/**
 * Creates a foldable container with expand/collapse controls
 * @param {string} content - The HTML content to wrap
 * @returns {HTMLElement} The foldable container element
 */
function createFoldableContent(content) {
  const template = `
    <div class="think-foldable-content" id="container">
      <div class="think-content-wrapper think-collapsed">
        <div class="think">${content}</div>
      </div>
      <span class="expand-btn collapse-expand"></span>
      <div class="collapse-btn collapse-expand">‹‹‹</div>
    </div>
  `;
  
  const doc = new DOMParser().parseFromString(`<div>${template}</div>`, 'text/html');
  return doc.body.firstChild.cloneNode(true);
}