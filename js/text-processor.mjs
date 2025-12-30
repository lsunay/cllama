/**
 * Text processing utilities for template rendering, token estimation, and truncation
 */
export const TextProcessor = {
  /**
   * Safely renders template strings with variable substitution
   * @param {string} template - Template string containing ${key} placeholders
   * @param {Object} data - Data object for variable substitution
   * @returns {string} Rendered string
   * @example renderTemplate('Hello ${user.name}', {user: {name: 'John'}}) => 'Hello John'
   */
  renderTemplate(template, data) {
    if (typeof template !== 'string' || !data) return template;
    return template.replace(/\${(.*?)}/g, (_, key) => {
      return key.split('.').reduce((obj, k) => (obj || {})[k.trim()], data) || '';
    });
  },

  /**
   * Estimates token count for mixed Chinese/English text
   * @param {string} text - Input text
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    if (!text) return 0;
    
    const chinese = text.match(/[\u4e00-\u9fa5]/g) || [];
    const words = text.split(/[\s\n]+/).filter(w => w);
    const symbols = text.match(/[^\p{L}\s]/gu) || [];
    
    // Estimation based on GPT-4 encoding patterns
    const chineseTokens = chinese.length * 1.3; // ~2.5 tokens per character
    const wordTokens = words.length * 1.3;
    const symbolTokens = symbols.length * 0.7;
    
    // Add 10% safety margin
    return Math.ceil((chineseTokens + wordTokens + symbolTokens) * 1.1);
  },

  /**
   * Normalizes whitespace by converting newlines to spaces and collapsing consecutive spaces
   * @param {string} str - Input string
   * @returns {string} Normalized string
   */
  normalizeWhitespace(str) {
    if (typeof str !== 'string') return '';
    
    return str
      .replace(/\r\n?|\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Intelligently truncates text to fit within token limit
   * Strategy: sentence boundaries → binary search → word boundaries
   * @param {string} str - Original text
   * @param {number} maxTokens - Maximum allowed tokens
   * @returns {string} Truncated text
   */
  truncateToTokens(str, maxTokens) {
    if (typeof str !== 'string' || maxTokens <= 0) return '';

    const text = this.normalizeWhitespace(str);
    if (this.estimateTokens(text) <= maxTokens) return text;

    // Try sentence-level truncation (supports Chinese/English punctuation)
    const sentenceEnders = /([。！？?!.](?=\s|$))/g;
    const sentences = text.split(sentenceEnders).reduce((arr, s, i) => {
      if (i % 2 === 0) arr.push(s);
      else arr[arr.length - 1] += s;
      return arr;
    }, []);

    let result = '';
    for (const sentence of sentences) {
      const temp = result + sentence;
      if (this.estimateTokens(temp) > maxTokens) break;
      result = temp;
    }

    // Binary search for precise length if no complete sentences fit
    if (!result) {
      let low = 0, high = text.length;
      while (low <= high) {
        const mid = (low + high) >>> 1;
        const subText = text.slice(0, mid);
        this.estimateTokens(subText) <= maxTokens 
          ? (result = subText, low = mid + 1) 
          : high = mid - 1;
      }
    }

    // Fine-tune to exact token limit at word boundaries
    const safeTruncate = (str) => {
      const lastBoundary = Math.max(
        str.lastIndexOf(' '),
        str.lastIndexOf('。'),
        str.lastIndexOf('!'),
        str.lastIndexOf('?')
      );
      return lastBoundary > 0 ? str.slice(0, lastBoundary + 1) : str.slice(0, -1);
    };

    while (result && this.estimateTokens(result) > maxTokens) {
      result = safeTruncate(result);
    }

    return result || text.slice(0, 10);
  }
};