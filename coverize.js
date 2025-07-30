/*╭────────────────────────────────────────────────╮ 
  │ COVERIZE.JS - Book Cover Generation Library    │
  │ Version: 1.0.0                                 │
  │ License: GPL-3.0                               │
  ╰────────────────────────────────────────────────╯*/

(function(window) {
  'use strict';

  // =================================================================
  // CONSTANTS & CONFIGURATION
  // =================================================================

  const CONFIG = {
    MAX_LINE_LENGTH: 12,
    DEFAULT_GRADIENT: 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)',
    RESIZE_THROTTLE: 16, // ~60fps
    FONT_SCALE_MIN: 0.3,
    FONT_SCALE_MAX: 2.5,
    BASE_WIDTH: 200
  };

  const COLOR_PRESETS = [
    ['#e6fdf5', '#2c3861'], ['#c5f3e3', '#3a4254'], ['#e6de88', '#385652'], ['#e8bf68', '#e77352'],
    ['#f4a436', '#6fb295'], ['#eada85', '#850b07'], ['#f3bebe', '#1271be'], ['#f87e85', '#857ef8'],
    ['#f5a665', '#3a4857'], ['#c0c0c0', '#4b545b'], ['#6d727f', '#e54c4c'], ['#547656', '#4e3135']
  ];

  const COLOR_PRESET_NAMES = [
    'Pearl Shore', 'Sage Abbey', 'Mossy Hollow', 'Honey Chapel', 'Olive Grove', 'Sienna Reach',
    'Azure Vale', 'Carmine Bay', 'Copper Barrow', 'Pewter Steppe', 'Brandy Copse', 'Jasper Forge'
  ];
  // Typography & Layout Constants
  const SECONDARY_WORDS = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of', 
    'with', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', '&', 'vs', 'vs.', 
    'etc', 'etc.', 'i.e.', 'e.g.', 'et', 'al', 'et al', 'et al.'
  ]);

  const COMMON_PHRASELETS = [
    ['of', 'the'], ['in', 'the'], ['on', 'the'], ['to', 'the'], ['at', 'the'], ['by', 'the'], 
    ['for', 'the'], ['with', 'the'], ['from', 'the'], ['is', 'the'], ['was', 'the'], ['and', 'the'],
    ['of', 'a'], ['in', 'a'], ['on', 'a'], ['to', 'a'], ['at', 'a'], ['by', 'a'], ['for', 'a'], ['with', 'a']
  ];

  // Layout Pattern Rules
  const KNOWN_PATTERNS = {
    'PP': [['P', 'P']], 'SP': [['S'], ['P']], 'PS': [['P'], ['S']], 'SS': [['S', 'S']],
    'PSP': [['P'], ['S'], ['P']], 'PPS': [['P', 'P'], ['S']], 'SPP': [['S'], ['P'], ['P']],
    'PPP': [['P'], ['P'], ['P']], 'SSP': [['S', 'S'], ['P']], 'PSS': [['P'], ['S', 'S']],
    'SPS': [['S'], ['P'], ['S']], 'SSS': [['S', 'S'], ['S']],
    'PSSP': [['P'], ['S', 'S'], ['P']], 'SPSP': [['S'], ['P'], ['S'], ['P']],
    'PPPP': [['P'], ['P', 'P'], ['P']], 'SSPP': [['S', 'S'], ['P'], ['P']],
    'PPSS': [['P'], ['P'], ['S', 'S']], 'SSSS': [['S', 'S'], ['S', 'S']],
    'PSPSP': [['P'], ['S'], ['P'], ['S'], ['P']], 'SSPSP': [['S', 'S'], ['P'], ['S'], ['P']],
    'SPSPP': [['S'], ['P'], ['S'], ['P'], ['P']]
  };

  // =================================================================
  // TYPESETTING ENGINE
  // =================================================================
  /**
   * Main typesetting function that processes title and author text
   * @param {string} title - The book title
   * @param {string} author - The author name
   * @returns {Array} Array of line objects with text, emphasis, role, and size properties
   */
  function typeset(title, author) {
    if (!title && author) {
      return [{ text: author, emphasis: false, role: 'author', size: 1.0 }];
    }
    
    if (!title && !author) return [];
    
    const titleLayout = title ? typesetTitle(title) : [];
    const processedLayout = titleLayout.map((line, index) => ({
      ...line,
      text: applySmartTitleCase(line.text, index === 0)
    }));
    
    if (author) {
      processedLayout.push({ text: author, emphasis: false, role: 'author', size: 1.0 });
    }
    
    return processedLayout.map(({ text, emphasis, role, size }) => ({ text, emphasis, role, size }));
  }

  /**
   * Calculate responsive font scale based on text length
   * @param {number} length - Character length of text
   * @returns {number} Scale factor (0.2 to 1.0)
   */
  function calculateScaleForLength(length) {
    if (length <= 8) return 1.0;
    if (length <= 12) return 1.0 - ((length - 8) / 4) * 0.15;
    if (length <= 20) return 0.85 - ((length - 12) / 8) * 0.35;
    if (length <= 30) return 0.5 - ((length - 20) / 10) * 0.2;
    return Math.max(0.2, 0.3 - ((length - 30) / 20) * 0.1);
  }

  function typesetTitle(title) {
    const words = title.split(' ');
    if (words.length === 1) {
      // Single word titles get smooth scaling based on length
      const size = calculateScaleForLength(words[0].length);
      return [{ text: words[0], emphasis: true, size }];
    }

    const groupedWords = groupPhraselets(words);
    const wordData = analyzeWordImportance(groupedWords);
    const result = determineLineBreaks(wordData);
    
    return result.flatMap(strictSplit);
  }

  function applySmartTitleCase(text, isFirstWord) {
    return text.split(' ').map((word, i) => {
      const isSecondary = SECONDARY_WORDS.has(word.toLowerCase());
      return (isSecondary && !(i === 0 && isFirstWord)) 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  function groupPhraselets(words) {
    const processedWords = words.flatMap(word => {
      if (word.includes('-') && word.length > 12) {
        const parts = word.split('-');
        return parts.flatMap((part, i) => i < parts.length - 1 ? [part, '-'] : [part]);
      }
      return [word];
    });
    
    const result = [];
    let i = 0;
    
    while (i < processedWords.length) {
      if (processedWords[i] === '&') {
        result.push(processedWords[i++]);
        continue;
      }
      
      const phraselet = COMMON_PHRASELETS.find(p => 
        i + p.length <= processedWords.length &&
        p.every((word, j) => word.toLowerCase() === processedWords[i + j].toLowerCase())
      );
      
      if (phraselet) {
        result.push(processedWords.slice(i, i + phraselet.length).join(' '));
        i += phraselet.length;
      } else {
        result.push(processedWords[i++]);
      }
    }
    
    return result;
  }

  /**
   * Analyze word importance for layout decisions
   * @param {Array} words - Array of word strings
   * @returns {Array} Array of word objects with metadata
   */
  function analyzeWordImportance(words) {
    return words.map((word, index) => {
      const isNaturallySecondary = word.includes(' ') 
        ? word.split(' ').every(part => SECONDARY_WORDS.has(part.toLowerCase()))
        : SECONDARY_WORDS.has(word.toLowerCase());
      
      // Treat final secondary words as primary for emphasis
      const isLastWord = index === words.length - 1;
      const isSecondary = isNaturallySecondary && !isLastWord;
      
      const weight = word.length * (isSecondary ? 0.6 : 1) * (/[A-Z]/.test(word) ? 1.2 : 1);
      
      return { word, isSecondary, index, weight };
    });
  }

  function determineLineBreaks(wordData) {
    const pattern = wordData.map(w => w.isSecondary ? 'S' : 'P').join('');
    const words = wordData.map(w => w.word);
    
    // Handle special cases
    if (words.length === 2 && pattern === 'PP') {
      return words.map(word => ({ text: word, emphasis: true }));
    }
    
    // Pattern-based rules
    if (KNOWN_PATTERNS[pattern]) {
      return applyPattern(KNOWN_PATTERNS[pattern], words);
    }
    
    // Fallback to balanced approach
    return balanceLinesByWeight(wordData);
  }

  function applyPattern(template, words) {
    const result = [];
    let wordIndex = 0;
    
    template.forEach(group => {
      const groupWords = words.slice(wordIndex, wordIndex + group.length);
      wordIndex += group.length;
      
      result.push({
        text: groupWords.join(' '),
        emphasis: group[0] === 'P'
      });
    });
    
    return result;
  }

  function balanceLinesByWeight(wordData) {
    const groups = [];
    let currentGroup = [wordData[0]];
    let currentIsSecondary = wordData[0].isSecondary;
    
    for (let i = 1; i < wordData.length; i++) {
      if (wordData[i].isSecondary === currentIsSecondary) {
        currentGroup.push(wordData[i]);
      } else {
        groups.push({
          words: currentGroup,
          isSecondary: currentIsSecondary
        });
        currentGroup = [wordData[i]];
        currentIsSecondary = wordData[i].isSecondary;
      }
    }
    groups.push({ words: currentGroup, isSecondary: currentIsSecondary });
    
    return groups.map(group => ({
      text: group.words.map(w => w.word).join(' '),
      emphasis: !group.isSecondary
    }));
  }

  function strictSplit(line) {
    if (!line.emphasis || line.text.length <= CONFIG.MAX_LINE_LENGTH) {
      const length = line.text.length;
      const size = line.emphasis ? calculateScaleForLength(length) : 1.0;
      return [{ ...line, size }];
    }
    
    const words = line.text.split(' ');
    if (words.length === 1) {
      // Handle very long single words with smooth scaling
      const size = calculateScaleForLength(line.text.length);
      return [{ ...line, size }];
    }
    
    // Find optimal split point
    let bestSplit = 1;
    let bestScore = Infinity;
    
    for (let i = 1; i < words.length; i++) {
      const left = words.slice(0, i).join(' ');
      const right = words.slice(i).join(' ');
      
      let score = 0;
      if (left.length > CONFIG.MAX_LINE_LENGTH) score += (left.length - CONFIG.MAX_LINE_LENGTH) * 2;
      if (right.length > CONFIG.MAX_LINE_LENGTH) score += (right.length - CONFIG.MAX_LINE_LENGTH) * 2;
      if (i === 1 && words.length > 2) score += 4;
      if (i === words.length - 1 && words.length > 2) score += 4;
      score += Math.abs(left.length - right.length);
      
      if (score < bestScore) {
        bestScore = score;
        bestSplit = i;
      }
    }
    
    const leftLine = { ...line, text: words.slice(0, bestSplit).join(' ') };
    const rightLine = { ...line, text: words.slice(bestSplit).join(' ') };
    
    return [...strictSplit(leftLine), ...strictSplit(rightLine)];
  }
  
  // COVER CLASS
  class Cover {
    constructor() {
      this._title = '';
      this._author = '';
      this._colors = [];
      this._image = null;
      this._effects = { realism: false, texture: false, depth: false };
      this._options = { ratio: 0.67, font: 'sans', emphasis: 'both', size: 'regular' };
    }

    title(text) { this._title = text; return this; }
    author(text) { this._author = text; return this; }
    image(src) { this._image = src; return this; }
    effects(obj) { Object.assign(this._effects, obj); return this; }
    options(obj) { Object.assign(this._options, obj); return this; }

    size(newSize) {
      this._options.size = newSize;
      const covers = document.querySelectorAll('.coverize-cover');
      covers.forEach(cover => {
        // Remove existing size classes
        cover.classList.remove('coverize-size-small', 'coverize-size-regular', 'coverize-size-large');
        // Add new size class
        cover.classList.add(`coverize-size-${newSize}`);
        if (cover._updateFontSize) cover._updateFontSize();
      });
      return this;
    }

    color(color1, color2) {
      if (typeof color1 === 'number' && color2 === undefined) {
        if (color1 >= 0 && color1 < COLOR_PRESETS.length) {
          this._colors = [...COLOR_PRESETS[color1]];
        } else {
          console.warn(`Color preset ${color1} not found. Valid presets are 0-${COLOR_PRESETS.length - 1}.`);
          this._colors = [];
        }
      } else {
        this._colors = color2 ? [color1, color2] : color1 ? [color1] : [];
      }
      return this;
    }

    render(container) {
      const cover = this._createElement('div', 'coverize-cover coverize');
      
      cover.style.aspectRatio = this._options.ratio.toString();
      
      // Fallback for browsers without aspect-ratio support
      if (!CSS.supports('aspect-ratio', '1')) {
        cover.style.height = `${Math.round(100 / this._options.ratio)}px`;
      }
      
      cover.classList.add(`coverize-size-${this._options.size}`);
      
      if (this._effects.realism) cover.setAttribute('data-realism', 'true');
      if (this._effects.texture) cover.setAttribute('data-texture', 'true');
      if (this._effects.depth) cover.setAttribute('data-depth', 'true');
      
      cover.appendChild(this._createBackground());
      cover.appendChild(this._createTypeset());
      cover.appendChild(this._createEffects());

      if (container) container.appendChild(cover);
      
      this._setupResponsiveScaling(cover);
      
      return cover;
    }

    _createElement(tag, className, textContent) {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (textContent) el.textContent = textContent;
      return el;
    }

    /**
     * Create background element with colors or gradient
     * @returns {HTMLElement} Background element
     */
    _createBackground() {
      const bg = this._createElement('div', 'coverize-background');
      
      if (this._colors.length >= 2) {
        bg.style.background = `linear-gradient(165deg, ${this._colors[0]} -25%, ${this._colors[1]} 125%)`;
      } else if (this._colors.length === 1) {
        bg.style.background = this._colors[0];
      } else {
        bg.style.background = CONFIG.DEFAULT_GRADIENT;
      }

      if (this._image) {
        const img = this._createElement('img', 'coverize-image');
        img.src = this._image;
        bg.appendChild(img);
      }
      
      return bg;
    }

    _createTypeset() {
      const typesetElement = this._createElement('div', 'coverize-typeset');
      
      if (!this._title && !this._author) return typesetElement;

      const lines = typeset(this._title, this._author);
      let titleBlock, authorBlock;

      lines.forEach((line, index) => {
        const lineEl = this._createElement('div', '', line.text);
        
        if (line.role === 'author') {
          if (!authorBlock) {
            authorBlock = this._createElement('div', 'coverize-author-block coverize-text-debossed');
            typesetElement.appendChild(authorBlock);
          }
          lineEl.className = 'coverize-typeset-line coverize-author';
          if (this._options.font === 'serif') lineEl.classList.add('coverize-author-serif');
          authorBlock.appendChild(lineEl);
        } else {
          if (!titleBlock) {
            titleBlock = this._createElement('div', 'coverize-title-block coverize-text-debossed');
            typesetElement.appendChild(titleBlock);
          }
          
          lineEl.className = 'coverize-typeset-line coverize-title';
          
          if (line.emphasis) {
            if (this._options.emphasis === 'bold' || this._options.emphasis === 'both') {
              lineEl.classList.add('coverize-line--bold');
            }
            if (this._options.emphasis === 'case' || this._options.emphasis === 'both') {
              lineEl.classList.add('coverize-line--uppercase');
            }
            if (line.size !== 1) {
              lineEl.style.fontSize = `calc(var(--coverize-title-size) * ${line.size})`;
            }
          } else {
            lineEl.classList.add('coverize-line--secondary');
            if (line.size !== 1) {
              lineEl.style.fontSize = `calc(var(--coverize-secondary-size) * ${line.size})`;
            } else {
              lineEl.style.fontSize = 'var(--coverize-secondary-size)';
            }
          }
          
          if (this._options.font === 'serif') lineEl.classList.add('coverize-title-serif');
          titleBlock.appendChild(lineEl);
        }
      });

      // Add fade-out class to title block if both title and author are present
      if (titleBlock && authorBlock) {
        titleBlock.classList.add('has-author');
      }

      return typesetElement;
    }

    _createEffects() {
      const effects = this._createElement('div', 'coverize-effects');
      
      if (this._effects.realism) this._addRealismEffects(effects);
      if (this._effects.texture) this._addTextureEffects(effects);
      if (this._effects.depth) this._addDepthEffects(effects);

      return effects;
    }

    _addTextureEffects(container) {
      container.appendChild(this._createElement('div', 'coverize-texture'));
    }

    _addRealismEffects(container) {
      container.appendChild(this._createElement('div', 'coverize-realism'));
      container.appendChild(this._createElement('div', 'coverize-spine'));
      container.appendChild(this._createElement('div', 'coverize-sheen'));
    }

    _addDepthEffects(container) {
      container.appendChild(this._createElement('div', 'coverize-depth'));
    }

    /**
     * Setup responsive font scaling for the cover
     * @param {HTMLElement} cover - The cover element
     */
    _setupResponsiveScaling(cover) {
      const updateFontSize = () => {
        const width = cover.offsetWidth;
        if (!width || width <= 0) return;
        
        let baseFontSize = (width / CONFIG.BASE_WIDTH);
        baseFontSize = Math.max(CONFIG.FONT_SCALE_MIN, Math.min(CONFIG.FONT_SCALE_MAX, baseFontSize));
        
        const sizeMultipliers = { 'small': 0.5, 'regular': 1.0, 'large': 1.5 };
        let currentSize = 'regular';
        if (cover.classList.contains('coverize-size-small')) currentSize = 'small';
        else if (cover.classList.contains('coverize-size-large')) currentSize = 'large';
        
        const multiplier = sizeMultipliers[currentSize] || 1.0;
        const finalSize = baseFontSize * multiplier;
        
        cover.style.fontSize = `${finalSize.toFixed(2)}rem`;
      };
      
      cover._updateFontSize = updateFontSize;
      updateFontSize(); // Initial update
      
      // Throttled resize listener
      let resizeTimeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateFontSize, CONFIG.RESIZE_THROTTLE);
      };
      
      window.addEventListener('resize', handleResize);
      cover._resizeHandler = handleResize;
    }

    // Cleanup method
    destroy(cover) {
      if (cover._resizeHandler) {
        window.removeEventListener('resize', cover._resizeHandler);
        delete cover._resizeHandler;
      }
      return this;
    }
  }

  // PUBLIC API
  window.Coverize = {
    cover: () => new Cover(),
    typeset,
    presets: { colors: COLOR_PRESETS, names: COLOR_PRESET_NAMES }
  };

})(window);
