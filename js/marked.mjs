import { Marked } from "./marked/marked.esm.js";
import { markedHighlight } from "./marked/marked-highlight.js";
import hljs from './marked/highlight.js';
import markedKatex from "./marked/marked-katex.js";

const marked1 = new Marked();

marked1.use(markedKatex({
    throwOnError: false
}));


marked1.use(markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
}))

export {marked1 as marked};
