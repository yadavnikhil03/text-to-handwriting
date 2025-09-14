let currentFont = "'Homemade Apple', cursive"
let isGenerating = false
let debounceTimer = null
let currentPageIndex = 0
let isInitialLoad = true
const pages = [{ text: "", settings: null }]
const textInput = document.getElementById("textInput")
const outputCanvas = document.getElementById("outputCanvas")
const outputPlaceholder = document.getElementById("outputPlaceholder")
const downloadBtn = document.getElementById("downloadBtn")
const pdfBtn = document.getElementById("pdfBtn")
const charCount = document.getElementById("charCount")
const wordCount = document.getElementById("wordCount")
const themeIcon = document.getElementById("themeIcon")
const pageCounter = document.getElementById("pageCounter")
const pageIndicator = document.getElementById("pageIndicator")
const prevPageBtn = document.getElementById("prevPageBtn")
const nextPageBtn = document.getElementById("nextPageBtn")
const deletePageBtn = document.getElementById("deletePageBtn")
const ctx = outputCanvas.getContext("2d")
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})
function initializeApp() {
  loadSavedTheme()
  setupEventListeners()
  updateCharacterCount()
  updatePreview()
  updatePageUI()
  setupCanvas()
  pages[0].text = textInput.value
  pages[0].settings = getCurrentSettings()
  setTimeout(() => {
    isInitialLoad = false
  }, 500)
  setTimeout(() => {
    runComprehensiveFunctionalityTest()
  }, 1000)
}
function setupEventListeners() {
  textInput.addEventListener("input", handleTextInput)
  textInput.addEventListener("paste", handlePasteInput)
  document.addEventListener("keydown", handleKeyboardShortcuts)
  window.addEventListener("resize", debounce(handleResize, 250))
  let lastScrollY = 0
  let ticking = false
  function updateHeader() {
    const header = document.querySelector(".header")
    const scrollY = window.scrollY
    const isMobile = window.innerWidth <= 480
    if (scrollY > 10) {
      header.classList.add("scrolled")
    } else {
      header.classList.remove("scrolled")
    }
    if (isMobile && scrollY > 50) {
      const scrollDiff = scrollY - lastScrollY
      if (scrollDiff > 5 && scrollY > 100) {
        header.classList.add("scrolling-down")
        header.classList.remove("scrolling-up")
      } else if (scrollDiff < -5) {
        header.classList.add("scrolling-up")
        header.classList.remove("scrolling-down")
      }
    } else if (isMobile) {
      header.classList.remove("scrolling-down", "scrolling-up")
    }
    lastScrollY = scrollY
    ticking = false
  }
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateHeader)
      ticking = true
    }
  }
  window.addEventListener("scroll", requestTick)
}
let themeToggleTimer = null
function toggleTheme() {
  const body = document.body
  const themeToggle = document.querySelector(".theme-toggle")
  const isDark = body.getAttribute("data-theme") === "dark"
  if (themeToggle.classList.contains("switching")) {
    return
  }
  themeToggle.classList.add("switching")
  setTimeout(() => {
    if (isDark) {
      body.removeAttribute("data-theme")
      themeIcon.textContent = "🌙"
      localStorage.setItem("theme", "light")
    } else {
      body.setAttribute("data-theme", "dark")
      themeIcon.textContent = "☀️"
      localStorage.setItem("theme", "dark")
    }
    setTimeout(() => {
      themeToggle.classList.remove("switching")
    }, 200)
    body.style.transition = "all 0.3s ease"
    setTimeout(() => {
      body.style.transition = ""
    }, 300)
    setTimeout(updatePreview, 100)
    clearTimeout(themeToggleTimer)
    themeToggleTimer = setTimeout(() => {
      if (!isInitialLoad) {
        showNotification(isDark ? "Light mode" : "Dark mode", "info")
      }
    }, 300)
  }, 150)
}
function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme")
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const body = document.body
  body.style.transition = "none"
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    body.setAttribute("data-theme", "dark")
    themeIcon.textContent = "☀️"
    if (!savedTheme) {
      localStorage.setItem("theme", "dark")
    }
  } else {
    body.removeAttribute("data-theme")
    themeIcon.textContent = "🌙"
    if (!savedTheme) {
      localStorage.setItem("theme", "light")
    }
  }
  setTimeout(() => {
    body.style.transition = ""
  }, 100)
}
function addNewPage() {
  saveCurrentPage()
  pages.push({
    text: "",
    settings: getCurrentSettings(),
  })
  currentPageIndex = pages.length - 1
  loadCurrentPage()
  updatePageUI()
  showNotification(`Page ${pages.length}`, "success")
  textInput.focus()
}
function deletePage() {
  if (pages.length <= 1) {
    showNotification("Can't delete last page", "warning")
    return
  }
  pages.splice(currentPageIndex, 1)
  if (currentPageIndex >= pages.length) {
    currentPageIndex = pages.length - 1
  }
  loadCurrentPage()
  updatePageUI()
  showNotification("Page deleted", "success")
}
function previousPage() {
  if (currentPageIndex > 0) {
    saveCurrentPage()
    currentPageIndex--
    loadCurrentPage()
    updatePageUI()
  }
}
function nextPage() {
  if (currentPageIndex < pages.length - 1) {
    saveCurrentPage()
    currentPageIndex++
    loadCurrentPage()
    updatePageUI()
  }
}
function switchToPage(pageIndex) {
  if (pageIndex >= 0 && pageIndex < pages.length && pageIndex !== currentPageIndex) {
    saveCurrentPage()
    currentPageIndex = pageIndex
    loadCurrentPage()
    updatePageUI()
  }
}
function saveCurrentPage() {
  pages[currentPageIndex].text = textInput.value
  pages[currentPageIndex].settings = getCurrentSettings()
}
function loadCurrentPage() {
  const currentPage = pages[currentPageIndex]
  textInput.value = currentPage.text
  if (currentPage.settings) {
    applySettings(currentPage.settings)
  }
  updateCharacterCount()
  updatePreview()
}
function getCurrentSettings() {
  return {
    font: currentFont,
    fontSize: document.getElementById("fontSize").value,
    penColor: document.getElementById("penColor").value,
    showLines: document.getElementById("showLines").checked,
    showMargin: document.getElementById("showMargin").checked,
  }
}
/**
 * Apply settings to UI
 */
function applySettings(settings) {
  currentFont = settings.font
  document.getElementById("fontSize").value = settings.fontSize
  document.getElementById("penColor").value = settings.penColor
  document.getElementById("showLines").checked = settings.showLines
  document.getElementById("showMargin").checked = settings.showMargin
  document.querySelectorAll(".style-option").forEach((option) => {
    option.classList.remove("active")
    if (option.dataset.font === settings.font) {
      option.classList.add("active")
    }
  })
}
function updatePageUI() {
  pageCounter.textContent = `Page ${currentPageIndex + 1} of ${pages.length}`
  prevPageBtn.disabled = currentPageIndex === 0
  nextPageBtn.disabled = currentPageIndex === pages.length - 1
  deletePageBtn.disabled = pages.length <= 1
  updatePageIndicators()
  const hasContent = pages.some((page) => page.text.trim().length > 0)
  pdfBtn.disabled = !hasContent
}
function updatePageIndicators() {
  pageIndicator.innerHTML = ""
  const maxIndicators = 10
  const totalPages = pages.length
  if (totalPages <= maxIndicators) {
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("div")
      dot.className = `page-dot ${i === currentPageIndex ? "active" : ""}`
      dot.onclick = () => switchToPage(i)
      dot.title = `Page ${i + 1}`
      pageIndicator.appendChild(dot)
    }
  } else {
    const start = Math.max(0, currentPageIndex - 4)
    const end = Math.min(totalPages, start + 9)
    for (let i = start; i < end; i++) {
      const dot = document.createElement("div")
      dot.className = `page-dot ${i === currentPageIndex ? "active" : ""}`
      dot.onclick = () => switchToPage(i)
      dot.title = `Page ${i + 1}`
      pageIndicator.appendChild(dot)
    }
    if (end < totalPages) {
      const ellipsis = document.createElement("span")
      ellipsis.textContent = "..."
      ellipsis.style.color = "var(--text-muted)"
      ellipsis.style.fontSize = "0.75rem"
      pageIndicator.appendChild(ellipsis)
    }
  }
}
function handleTextInput() {
  updateCharacterCount()
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    updatePreview()
    updatePageUI() 
  }, 300)
}
/**
 * Update character and word count display
 */
function updateCharacterCount() {
  const text = textInput.value
  const characters = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  charCount.textContent = `${characters} characters`
  wordCount.textContent = `${words} words`
}
/**
 * Clear all text from current page
 */
function clearText() {
  textInput.value = ""
  updateCharacterCount()
  updatePreview()
  updatePageUI()
  textInput.focus()
  showNotification("Text cleared", "info")
}
/**
 * Handle paste input with robust auto-pagination
 */
function handlePasteInput(event) {
  setTimeout(() => {
    const fullText = textInput.value
    if (fullText.trim().length > 0) {
      handleRobustTextDistribution(fullText)
    } else {
      handleTextInput()
    }
  }, 10)
}
/**
 * Robust text distribution across multiple pages
 * @param {string} fullText - The complete text to distribute
 */
function handleRobustTextDistribution(fullText) {
  const pageCapacity = calculatePageCapacity()
  if (fullText.length <= pageCapacity) {
    handleTextInput()
    return
  }
  saveCurrentPage()
  const textChunks = splitTextIntoOptimalPages(fullText, pageCapacity)
  if (textChunks.length === 0) {
    textChunks.push(fullText) // Fallback to put everything on one page
  }
  textInput.value = textChunks[0]
  pages[currentPageIndex].text = textChunks[0]
  pages.splice(currentPageIndex + 1)
  let newPagesCreated = 0
  for (let i = 1; i < textChunks.length; i++) {
    pages.push({
      text: textChunks[i],
      settings: getCurrentSettings(),
    })
    newPagesCreated++
  }
  const totalDistributedText = textChunks.join('')
  const originalTextLength = fullText.replace(/\s+/g, '').length
  const distributedTextLength = totalDistributedText.replace(/\s+/g, '').length
  updateCharacterCount()
  updatePreview()
  updatePageUI()
  const totalPages = textChunks.length
  const notification = newPagesCreated > 0 
    ? `Complete text distributed across ${totalPages} pages (${newPagesCreated} new pages created)`
    : `Text fits on current page`
  showNotification(notification, "success")
}
/**
 * Calculate accurate character capacity per page
 * @returns {number} - Character capacity
 */
function calculatePageCapacity() {
  const fontSize = Number.parseInt(document.getElementById("fontSize").value) || 16
  const showLines = document.getElementById("showLines").checked
  const showMargin = document.getElementById("showMargin").checked
  const canvasStyle = outputCanvas.style
  const canvasWidth = parseInt(canvasStyle.width) || 800
  const canvasHeight = parseInt(canvasStyle.height) || 600
  const marginOffset = showMargin ? 80 : 30 // More accurate margin calculation
  const topPadding = 60
  const bottomPadding = 40
  const sidePadding = 20
  const usableWidth = canvasWidth - marginOffset - sidePadding
  const usableHeight = canvasHeight - topPadding - bottomPadding
  const lineHeight = fontSize * 1.6 // Realistic line height for handwriting
  const linesPerPage = Math.floor(usableHeight / lineHeight)
  const avgCharWidth = fontSize * 0.55 // More accurate for handwriting fonts
  const charsPerLine = Math.floor(usableWidth / avgCharWidth)
  const baseCapacity = linesPerPage * charsPerLine
  const safetyMargin = 0.75 // 25% safety margin for realistic text flow
  const finalCapacity = Math.floor(baseCapacity * safetyMargin)
  const minCapacity = 100
  return Math.max(minCapacity, finalCapacity)
}
/**
 * Split text into optimal page-sized chunks with zero text loss
 * @param {string} text - Text to split
 * @param {number} pageCapacity - Characters per page
 * @returns {string[]} - Array of text chunks
 */
function splitTextIntoOptimalPages(text, pageCapacity) {
  const chunks = []
  let remainingText = text.trim()
  let safetyCounter = 0
  const maxIterations = 1000 // Prevent infinite loops
  while (remainingText.length > 0 && safetyCounter < maxIterations) {
    safetyCounter++
    if (remainingText.length <= pageCapacity) {
      chunks.push(remainingText)
      break
    }
    let breakPoint = findOptimalBreakPoint(remainingText, pageCapacity)
    if (breakPoint < pageCapacity * 0.1) {
      breakPoint = Math.min(pageCapacity, remainingText.length)
    }
    const chunk = remainingText.substring(0, breakPoint).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    remainingText = remainingText.substring(breakPoint).trim()
  }
  if (remainingText.length > 0 && safetyCounter >= maxIterations) {
    chunks.push(remainingText)
    console.warn('Auto-pagination hit safety limit, added remaining text to final page')
  }
  return chunks
}
/**
 * Find the optimal break point for text splitting
 * @param {string} text - Text to analyze
 * @param {number} capacity - Page capacity
 * @returns {number} - Optimal break point index
 */
function findOptimalBreakPoint(text, capacity) {
  let paragraphBreak = text.lastIndexOf('\n\n', capacity)
  if (paragraphBreak > capacity * 0.6) {
    return paragraphBreak + 2
  }
  let lineBreak = text.lastIndexOf('\n', capacity)
  if (lineBreak > capacity * 0.65) {
    return lineBreak + 1
  }
  const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
  let bestSentenceBreak = -1
  for (const ender of sentenceEnders) {
    let sentenceBreak = text.lastIndexOf(ender, capacity)
    if (sentenceBreak > capacity * 0.65 && sentenceBreak > bestSentenceBreak) {
      bestSentenceBreak = sentenceBreak + ender.length
    }
  }
  if (bestSentenceBreak > 0) {
    return bestSentenceBreak
  }
  const punctuationBreaks = [', ', '; ', ',\n', ';\n']
  let bestPunctuationBreak = -1
  for (const punct of punctuationBreaks) {
    let punctBreak = text.lastIndexOf(punct, capacity)
    if (punctBreak > capacity * 0.75 && punctBreak > bestPunctuationBreak) {
      bestPunctuationBreak = punctBreak + punct.length
    }
  }
  if (bestPunctuationBreak > 0) {
    return bestPunctuationBreak
  }
  let wordBreak = text.lastIndexOf(' ', capacity)
  if (wordBreak > capacity * 0.8) {
    return wordBreak + 1
  }
  const whitespaceRegex = /\s/
  for (let i = capacity - 1; i >= capacity * 0.8; i--) {
    if (whitespaceRegex.test(text[i])) {
      return i + 1
    }
  }
  return Math.min(capacity, text.length)
}
/**
 * Select handwriting style
 * @param {HTMLElement} element - The clicked style option element
 */
function selectStyle(element) {
  document.querySelectorAll(".style-option").forEach((option) => {
    option.classList.remove("active")
  })
  element.classList.add("active")
  currentFont = element.dataset.font
  element.style.transform = "scale(0.95)"
  setTimeout(() => {
    element.style.transform = ""
  }, 150)
  updatePreview()
  showNotification(element.querySelector(".style-name").textContent, "success")
}
/**
 * Setup canvas with proper dimensions and DPI scaling
 */
function setupCanvas() {
  const container = outputCanvas.parentElement
  const containerRect = container.getBoundingClientRect()
  const width = Math.min(1200, containerRect.width - 48)
  const height = Math.min(900, containerRect.height - 48)
  const dpr = Math.max(3, window.devicePixelRatio || 1) // Minimum 3x scaling
  const scaleFactor = 8 // Ultra-high scaling for maximum quality (8x instead of 3x)
  outputCanvas.width = width * dpr * scaleFactor
  outputCanvas.height = height * dpr * scaleFactor
  outputCanvas.style.width = width + "px"
  outputCanvas.style.height = height + "px"
  ctx.scale(dpr * scaleFactor, dpr * scaleFactor)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.textRenderingOptimization = 'optimizeQuality'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 10
  ctx.globalCompositeOperation = 'source-over'
}
/**
 * Update the handwriting preview
 */
function updatePreview() {
  const text = textInput.value.trim()
  if (!text) {
    showPlaceholder()
    return
  }
  if (isGenerating) return
  isGenerating = true
  hidePlaceholder()
  setTimeout(() => {
    generateHandwriting(text)
    isGenerating = false
  }, 100)
}
/**
 * Generate handwriting on canvas
 * @param {string} text - Text to convert to handwriting
 */
function generateHandwriting(text) {
  const fontSize = Number.parseInt(document.getElementById("fontSize").value)
  const penColor = document.getElementById("penColor").value
  const showLines = document.getElementById("showLines").checked
  const showMargin = document.getElementById("showMargin").checked
  ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height)
  const canvasWidth = Number.parseInt(outputCanvas.style.width)
  const canvasHeight = Number.parseInt(outputCanvas.style.height)
  createRealisticPaperBackground(canvasWidth, canvasHeight)
  if (showLines) {
    drawPaperLines(canvasWidth, canvasHeight)
  }
  if (showMargin) {
    drawMargin(canvasHeight)
  }
  ctx.font = `${fontSize}px ${currentFont.replace(/'/g, "")}`
  ctx.fillStyle = penColor
  ctx.textBaseline = "top"
  drawRealisticText(text, fontSize, showMargin, canvasWidth, canvasHeight, penColor)
  downloadBtn.disabled = false
}
/**
 * Create a realistic paper background with aging effects
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function createRealisticPaperBackground(width, height) {
  const baseColor = '#fefefe'
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const step = 1 // Sample every pixel for best quality
  for (let i = 0; i < data.length; i += 4 * step) {
    const pixelIndex = i / 4
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    if (x >= width || y >= height) continue
    const fiberNoise = (Math.random() - 0.5) * 2
    const agingFactor = Math.random() * 0.05
    const subtleTint = Math.sin(x * 0.008) * Math.sin(y * 0.008) * 3
    for (let offset = 0; offset < step * 4 && i + offset < data.length; offset += 4) {
      data[i + offset] = Math.min(255, Math.max(248, data[i + offset] + fiberNoise - agingFactor * 2 + subtleTint)) // Red
      data[i + offset + 1] = Math.min(255, Math.max(248, data[i + offset + 1] + fiberNoise - agingFactor * 1 + subtleTint * 0.9)) // Green  
      data[i + offset + 2] = Math.min(255, Math.max(248, data[i + offset + 2] + fiberNoise - agingFactor * 2 + subtleTint * 0.8)) // Blue
    }
  }
  ctx.putImageData(imageData, 0, 0)
  const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(1, 'rgba(248, 248, 248, 0.005)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}
/**
 * Draw paper lines on canvas 
 * @param {number} width ]
 * @param {number} height \
 */
function drawPaperLines(width, height) {
  const dpr = Math.max(3, window.devicePixelRatio || 1)
  const scaleFactor = 8
  const totalScale = dpr * scaleFactor
  ctx.save()
  ctx.strokeStyle = "#b8c5d6" 
  ctx.lineWidth = Math.max(2, 0.8 * totalScale / 12) // Ensure minimum visibility
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'miter'
  const lineSpacing = 30
  for (let y = 50; y < height; y += lineSpacing) {
    ctx.beginPath()
    const lineVariation = (Math.random() - 0.5) * 0.5
    const actualY = Math.round(y + lineVariation) + 0.5
    ctx.moveTo(0, actualY)
    const segments = 8
    const segmentWidth = width / segments
    for (let i = 1; i <= segments; i++) {
      const x = i * segmentWidth
      const yOffset = (Math.random() - 0.5) * 0.3
      if (i === segments) {
        ctx.lineTo(width, actualY + yOffset)
      } else {
        ctx.lineTo(x, actualY + yOffset)
      }
    }
    ctx.stroke()
  }
  ctx.restore()
}
/**
 * Draw margin line on canvas 
 * @param {number} height - Canvas height
 */
function drawMargin(height) {
  const dpr = Math.max(3, window.devicePixelRatio || 1)
  const scaleFactor = 8
  const totalScale = dpr * scaleFactor
  ctx.save()
  ctx.strokeStyle = "#e8a5a5" 
  ctx.lineWidth = Math.max(2.5, 1.5 * totalScale / 12) // Ensure minimum visibility
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'miter'
  ctx.beginPath()
  const segments = 10
  const segmentHeight = height / segments
  const marginX = Math.round(60) + 0.5
  ctx.moveTo(marginX, 0)
  for (let i = 1; i <= segments; i++) {
    const y = i * segmentHeight
    const xOffset = (Math.random() - 0.5) * 0.8
    if (i === segments) {
      ctx.lineTo(marginX + xOffset, height)
    } else {
      ctx.lineTo(marginX + xOffset, y)
    }
  }
  ctx.stroke()
  ctx.restore()
}
/**
 * Draw text with realistic handwriting effects
 * @param {string} text - Text to draw
 * @param {number} fontSize - Font size
 * @param {boolean} showMargin - Whether margin is shown
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {string} penColor - Pen color
 */
function drawRealisticText(text, fontSize, showMargin, canvasWidth, canvasHeight, penColor) {
  const lines = text.split("\n")
  const lineHeight = fontSize * 1.8
  const startX = showMargin ? 80 : 20
  const maxWidth = canvasWidth - startX - 20
  let currentY = 60
  const baseAlpha = 0.85 + Math.random() * 0.15 // Slight ink variation
  lines.forEach((line, lineIndex) => {
    if (line.trim() === "") {
      currentY += lineHeight
      return
    }
    const words = line.split(" ")
    let currentLine = ""
    let lineWords = []
    words.forEach((word) => {
      const testLine = currentLine + word + " "
      ctx.font = `${fontSize}px ${currentFont.replace(/'/g, "")}`
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && currentLine !== "") {
        lineWords.push(currentLine.trim())
        currentLine = word + " "
      } else {
        currentLine = testLine
      }
    })
    if (currentLine.trim() !== "") {
      lineWords.push(currentLine.trim())
    }
    lineWords.forEach((lineText, wordLineIndex) => {
      if (currentY > canvasHeight - 40) return
      drawLineWithInkEffects(lineText, startX, currentY, fontSize, penColor, baseAlpha)
      currentY += lineHeight
    })
  })
}
/**
 * Draw a line of text with realistic ink effects
 * @param {string} text - Text to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} fontSize - Font size
 * @param {string} penColor - Pen color
 * @param {number} baseAlpha - Base alpha for ink variations
 */
function drawLineWithInkEffects(text, x, y, fontSize, penColor, baseAlpha) {
  const characters = text.split('')
  let currentX = x
  characters.forEach((char, index) => {
    if (char === ' ') {
      ctx.font = `${fontSize}px ${currentFont.replace(/'/g, "")}`
      const spaceWidth = ctx.measureText(' ').width
      currentX += spaceWidth
      return
    }
    const charVariation = {
      xOffset: (Math.random() - 0.5) * 0.3, // Reduced from 0.8
      yOffset: (Math.random() - 0.5) * 0.5, // Reduced from 1.2
      scaleX: 0.98 + Math.random() * 0.04, // Reduced from 0.1
      scaleY: 0.98 + Math.random() * 0.04, // Reduced from 0.1
      rotation: (Math.random() - 0.5) * 0.008, // Reduced from 0.02
      alpha: baseAlpha + (Math.random() - 0.5) * 0.05 // Reduced from 0.1
    }
    ctx.save()
    ctx.globalAlpha = Math.max(0.85, Math.min(1, charVariation.alpha))
    ctx.translate(currentX + charVariation.xOffset, y + charVariation.yOffset)
    ctx.rotate(charVariation.rotation)
    ctx.scale(charVariation.scaleX, charVariation.scaleY)
    const adjustedFontSize = fontSize * (0.99 + Math.random() * 0.02) // Reduced from 0.04
    ctx.font = `${adjustedFontSize}px ${currentFont.replace(/'/g, "")}`
    const inkVariation = addSubtleInkColorVariation(penColor)
    ctx.fillStyle = inkVariation
    ctx.textBaseline = "top"
    ctx.fillText(char, 0, 0)
    ctx.restore()
    ctx.font = `${fontSize}px ${currentFont.replace(/'/g, "")}`
    const charWidth = ctx.measureText(char).width
    currentX += charWidth * charVariation.scaleX
  })
}
/**
 * Add subtle color variation to simulate real ink (less variation for better quality)
 * @param {string} baseColor - Base pen color
 * @returns {string} Varied color
 */
function addSubtleInkColorVariation(baseColor) {
  let r, g, b
  if (baseColor.startsWith('#')) {
    const hex = baseColor.slice(1)
    r = parseInt(hex.slice(0, 2), 16)
    g = parseInt(hex.slice(2, 4), 16)
    b = parseInt(hex.slice(4, 6), 16)
  } else if (baseColor.startsWith('rgb')) {
    const matches = baseColor.match(/\d+/g)
    r = parseInt(matches[0])
    g = parseInt(matches[1])
    b = parseInt(matches[2])
  } else {
    return baseColor // Return original if can't parse
  }
  r = Math.max(0, Math.min(255, r + (Math.random() - 0.5) * 4))
  g = Math.max(0, Math.min(255, g + (Math.random() - 0.5) * 4))
  b = Math.max(0, Math.min(255, b + (Math.random() - 0.5) * 4))
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}
/**
 * Add slight color variation to simulate real ink
 * @param {string} baseColor - Base pen color
 * @returns {string} Varied color
 */
function addInkColorVariation(baseColor) {
  let r, g, b
  if (baseColor.startsWith('#')) {
    const hex = baseColor.slice(1)
    r = parseInt(hex.slice(0, 2), 16)
    g = parseInt(hex.slice(2, 4), 16)
    b = parseInt(hex.slice(4, 6), 16)
  } else if (baseColor.startsWith('rgb')) {
    const matches = baseColor.match(/\d+/g)
    r = parseInt(matches[0])
    g = parseInt(matches[1])
    b = parseInt(matches[2])
  } else {
    return baseColor // Return original if can't parse
  }
  r = Math.max(0, Math.min(255, r + (Math.random() - 0.5) * 10))
  g = Math.max(0, Math.min(255, g + (Math.random() - 0.5) * 10))
  b = Math.max(0, Math.min(255, b + (Math.random() - 0.5) * 10))
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}
/**
 * Draw text on canvas with proper wrapping
 * @param {string} text - Text to draw
 * @param {number} fontSize - Font size
 * @param {boolean} showMargin - Whether margin is shown
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 */
function drawText(text, fontSize, showMargin, canvasWidth, canvasHeight) {
  const lines = text.split("\n")
  const lineHeight = fontSize * 1.8
  const startX = showMargin ? 80 : 20
  const maxWidth = canvasWidth - startX - 20
  let currentY = 60
  lines.forEach((line) => {
    if (line.trim() === "") {
      currentY += lineHeight
      return
    }
    const words = line.split(" ")
    let currentLine = ""
    words.forEach((word) => {
      const testLine = currentLine + word + " "
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && currentLine !== "") {
        ctx.fillText(currentLine.trim(), startX, currentY)
        currentLine = word + " "
        currentY += lineHeight
        if (currentY > canvasHeight - 40) {
          return
        }
      } else {
        currentLine = testLine
      }
    })
    if (currentLine.trim() !== "" && currentY <= canvasHeight - 40) {
      ctx.fillText(currentLine.trim(), startX, currentY)
    }
    currentY += lineHeight
  })
}
/**
 * Show placeholder when no text
 */
function showPlaceholder() {
  outputCanvas.style.display = "none"
  outputPlaceholder.style.display = "block"
  downloadBtn.disabled = true
}
/**
 * Hide placeholder when showing canvas
 */
function hidePlaceholder() {
  outputCanvas.style.display = "block"
  outputPlaceholder.style.display = "none"
}
/**
 * Download the current page as ultra-high quality PNG image
 */
function downloadImage() {
  if (downloadBtn.disabled) return
  try {
    const ultraCanvas = document.createElement("canvas")
    const ultraCtx = ultraCanvas.getContext("2d")
    const ultraScale = 8
    const displayWidth = parseInt(outputCanvas.style.width)
    const displayHeight = parseInt(outputCanvas.style.height)
    ultraCanvas.width = displayWidth * ultraScale
    ultraCanvas.height = displayHeight * ultraScale
    ultraCtx.scale(ultraScale, ultraScale)
    ultraCtx.imageSmoothingEnabled = true
    ultraCtx.imageSmoothingQuality = 'high'
    ultraCtx.textRenderingOptimization = 'optimizeQuality'
    ultraCtx.lineCap = 'round'
    ultraCtx.lineJoin = 'round'
    const currentPage = pages[currentPageIndex]
    ultraCtx.fillStyle = "#ffffff"
    ultraCtx.fillRect(0, 0, displayWidth, displayHeight)
    createUltraRealisticPaperBackground(ultraCtx, displayWidth, displayHeight, ultraScale)
    if (currentPage.settings.showLines) {
      drawUltraHighQualityPaperLines(ultraCtx, displayWidth, displayHeight, ultraScale)
    }
    if (currentPage.settings.showMargin) {
      drawUltraHighQualityMargin(ultraCtx, displayHeight, ultraScale)
    }
    drawUltraHighQualityText(
      ultraCtx,
      currentPage.text,
      currentPage.settings.fontSize,
      currentPage.settings.showMargin,
      displayWidth,
      displayHeight,
      currentPage.settings.penColor,
      ultraScale
    )
    const link = document.createElement("a")
    link.download = `handwriting-ultra-hq-page-${currentPageIndex + 1}-${new Date().getTime()}.png`
    link.href = ultraCanvas.toDataURL("image/png", 1.0) // Maximum quality
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showNotification("Image downloaded", "success")
  } catch (error) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.error("Download failed:", error)
    }
    showNotification("Download failed", "error")
  }
}
/**
 * Generate and download PDF with all pages
 */
async function generatePDF() {
  if (pdfBtn.disabled) return
  saveCurrentPage()
  pdfBtn.classList.add("btn-loading")
  pdfBtn.disabled = true
  try {
    showNotification("Generating PDF...", "info")
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: false, // Disable compression for maximum quality
      precision: 16,   // Maximum precision
      userUnit: 1.0,   // Standard user unit for best quality
    })
    const pageWidth = 210
    const pageHeight = 297
    const margin = 15  // Reduced margin for more content space
    let pageCount = 0
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      if (!page.text.trim()) continue // Skip empty pages
      if (pageCount > 0) {
        pdf.addPage()
      }
      const pageCanvas = await generateUltraHighQualityPageCanvas(page)
      const imgData = pageCanvas.toDataURL("image/png", 1.0) // Maximum quality PNG
      const imgWidth = pageWidth - margin * 2
      const aspectRatio = pageCanvas.height / pageCanvas.width
      const imgHeight = Math.min(imgWidth * aspectRatio, pageHeight - margin * 2 - 15) // Reserve space for page number
      pdf.addImage(
        imgData, 
        "PNG", 
        margin, 
        margin, 
        imgWidth, 
        imgHeight,
        undefined, // alias
        "SLOW"     // Use SLOW compression for maximum quality
      )
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `${pageCount + 1}`, 
        pageWidth / 2, 
        pageHeight - 8, 
        { align: 'center' }
      )
      pageCount++
    }
    const fileName = `handwriting-ultra-hq-${pageCount}-pages-${new Date().getTime()}.pdf`
    pdf.save(fileName)
    showNotification(`PDF ready (${pageCount} pages)`, "success")
  } catch (error) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.error("PDF generation failed:", error)
    }
    showNotification("PDF failed", "error")
  } finally {
    pdfBtn.classList.remove("btn-loading")
    pdfBtn.disabled = false
  }
}
/**
 * Generate ultra-high quality canvas for a specific page
 * @param {Object} page - Page object with text and settings
 * @returns {Promise<HTMLCanvasElement>} Ultra-high quality canvas element
 */
async function generateUltraHighQualityPageCanvas(page) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    const ultraScale = 16 // 16x resolution for maximum quality
    const baseWidth = 2480  // A4 width at 300 DPI
    const baseHeight = 3508 // A4 height at 300 DPI
    canvas.width = baseWidth * ultraScale
    canvas.height = baseHeight * ultraScale
    context.scale(ultraScale, ultraScale)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.textRenderingOptimization = 'optimizeQuality'
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.miterLimit = 20
    context.globalCompositeOperation = 'source-over'
    currentFont = page.settings.fontFamily
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, baseWidth, baseHeight)
    createUltraRealisticPaperBackground(context, baseWidth, baseHeight, ultraScale)
    if (page.settings.showLines) {
      drawUltraHighQualityPaperLines(context, baseWidth, baseHeight, ultraScale)
    }
    if (page.settings.showMargin) {
      drawUltraHighQualityMargin(context, baseHeight, ultraScale)
    }
    drawUltraHighQualityText(
      context,
      page.text,
      page.settings.fontSize,
      page.settings.showMargin,
      baseWidth,
      baseHeight,
      page.settings.penColor,
      ultraScale
    )
    setTimeout(() => resolve(canvas), 100)
  })
}
/**
 * Create ultra-realistic paper background with maximum quality
 */
function createUltraRealisticPaperBackground(context, width, height, scale) {
  const textureScale = scale / 4
  for (let x = 0; x < width; x += 0.25) { // Ultra-fine sampling
    for (let y = 0; y < height; y += 0.25) {
      const noise = Math.random() * 3 + 252 // Very subtle noise
      context.fillStyle = `rgb(${noise}, ${noise}, ${noise})`
      context.fillRect(x, y, 0.5, 0.5)
    }
  }
  context.strokeStyle = "rgba(240, 240, 240, 0.3)"
  context.lineWidth = 0.1
  for (let i = 0; i < width * height / 5000; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const length = Math.random() * 8 + 2
    const angle = Math.random() * Math.PI * 2
    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
    context.stroke()
  }
}
/**
 * Draw ultra-high quality paper lines
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} scale - Ultra-high quality scale factor
 */
function drawUltraHighQualityPaperLines(context, width, height, scale) {
  context.strokeStyle = "#b8c5d6"
  context.lineWidth = 0.8 * (scale / 8) // Scale line width appropriately
  const lineSpacing = 30 * (scale / 8) // Scale line spacing
  for (let y = 50 * (scale / 8); y < height; y += lineSpacing) {
    context.beginPath()
    const lineVariation = (Math.random() - 0.5) * 0.5 * (scale / 8)
    const actualY = y + lineVariation
    context.moveTo(0, actualY)
    const segments = 12 // More segments for ultra-high quality
    const segmentWidth = width / segments
    for (let i = 1; i <= segments; i++) {
      const x = i * segmentWidth
      const yOffset = (Math.random() - 0.5) * 0.3 * (scale / 8)
      if (i === segments) {
        context.lineTo(width, actualY + yOffset)
      } else {
        context.lineTo(x, actualY + yOffset)
      }
    }
    context.stroke()
  }
}
/**
 * Draw ultra-high quality margin line
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {number} height - Canvas height
 * @param {number} scale - Ultra-high quality scale factor
 */
function drawUltraHighQualityMargin(context, height, scale) {
  context.strokeStyle = "#f0b8c5"
  context.lineWidth = 0.8 * (scale / 8)
  const marginX = 80 * (scale / 8) // Scale margin position
  context.beginPath()
  context.moveTo(marginX, 0)
  const segments = Math.floor(height / (40 * (scale / 8)))
  const segmentHeight = height / segments
  for (let i = 1; i <= segments; i++) {
    const y = i * segmentHeight
    const xOffset = (Math.random() - 0.5) * 0.5 * (scale / 8)
    if (i === segments) {
      context.lineTo(marginX + xOffset, height)
    } else {
      context.lineTo(marginX + xOffset, y)
    }
  }
  context.stroke()
}
/**
 * Draw ultra-high quality text with maximum realism
 */
function drawUltraHighQualityText(context, text, fontSize, showMargin, width, height, penColor, scale) {
  const scaledFontSize = fontSize * (scale / 8)
  const lines = text.split("\n")
  const baseLineHeight = scaledFontSize * 1.6
  const startX = showMargin ? 120 : 30
  const maxWidth = width - startX - 30
  let currentY = 100
  let writingPressure = 0.85 + Math.random() * 0.15
  let handTiredness = 0
  let baselineSlant = (Math.random() - 0.5) * 0.002
  lines.forEach((line, lineIndex) => {
    if (line.trim() === "") {
      currentY += baseLineHeight
      return
    }
    const words = line.split(" ")
    let currentLine = ""
    let lineWords = []
    words.forEach((word) => {
      const testLine = currentLine + word + " "
      context.font = `${scaledFontSize}px ${currentFont.replace(/'/g, "")}`
      const metrics = context.measureText(testLine)
      if (metrics.width > maxWidth && currentLine !== "") {
        lineWords.push(currentLine.trim())
        currentLine = word + " "
      } else {
        currentLine = testLine
      }
    })
    if (currentLine.trim() !== "") {
      lineWords.push(currentLine.trim())
    }
    lineWords.forEach((lineText, wordLineIndex) => {
      if (currentY > height - 60) return
      drawUltraRealisticLine(
        context, 
        lineText, 
        startX, 
        currentY, 
        scaledFontSize, 
        penColor, 
        writingPressure, 
        handTiredness, 
        baselineSlant,
        scale
      )
      currentY += baseLineHeight + (Math.random() - 0.5) * 6
      handTiredness += 0.001
      writingPressure = Math.max(0.7, writingPressure - 0.002)
    })
  })
}
/**
 * Draw ultra-realistic line with maximum human-like variations
 */
function drawUltraRealisticLine(context, text, x, y, fontSize, penColor, pressure, tiredness, slant, scale) {
  const words = text.split(' ')
  let currentX = x
  words.forEach((word, wordIndex) => {
    const wordBaseline = y + (Math.random() - 0.5) * 3
    const wordSlant = slant + (Math.random() - 0.5) * 0.001
    for (let i = 0; i < word.length; i++) {
      const char = word[i]
      const humanVariations = {
        xOffset: (Math.random() - 0.5) * 1.8,
        yOffset: (Math.random() - 0.5) * 2.2 + tiredness * 8,
        scaleX: 0.90 + Math.random() * 0.20,
        scaleY: 0.92 + Math.random() * 0.16,
        rotation: wordSlant + (Math.random() - 0.5) * 0.025,
        alpha: Math.max(0.70, pressure + (Math.random() - 0.5) * 0.20),
        fontSizeVar: fontSize * (0.94 + Math.random() * 0.12)
      }
      context.save()
      context.globalAlpha = humanVariations.alpha
      const charX = currentX + humanVariations.xOffset
      const charY = wordBaseline + humanVariations.yOffset
      context.translate(charX, charY)
      context.rotate(humanVariations.rotation)
      context.scale(humanVariations.scaleX, humanVariations.scaleY)
      context.font = `${humanVariations.fontSizeVar}px ${currentFont.replace(/'/g, "")}`
      context.fillStyle = createUltraRealisticInkVariation(penColor, pressure, scale)
      context.textBaseline = "top"
      context.fillText(char, 0, 0)
      context.restore()
      context.font = `${fontSize}px ${currentFont.replace(/'/g, "")}`
      const charWidth = context.measureText(char).width
      const naturalSpacing = charWidth * (0.93 + Math.random() * 0.14)
      currentX += naturalSpacing
    }
    if (wordIndex < words.length - 1) {
      context.font = `${fontSize}px ${currentFont.replace(/'/g, "")}`
      const spaceWidth = context.measureText(' ').width * (0.7 + Math.random() * 0.6)
      currentX += spaceWidth
    }
  })
}
/**
 * Create ultra-realistic ink color variations
 */
function createUltraRealisticInkVariation(baseColor, pressure, scale) {
  let r, g, b
  if (baseColor.startsWith('#')) {
    const hex = baseColor.slice(1)
    r = parseInt(hex.slice(0, 2), 16)
    g = parseInt(hex.slice(2, 4), 16)
    b = parseInt(hex.slice(4, 6), 16)
  } else if (baseColor.startsWith('rgb')) {
    const matches = baseColor.match(/\d+/g)
    r = parseInt(matches[0])
    g = parseInt(matches[1])
    b = parseInt(matches[2])
  } else {
    return baseColor
  }
  const pressureEffect = pressure * 20
  const naturalVariation = (Math.random() - 0.5) * 12
  const qualityEffect = scale * 0.5 // Enhanced for ultra-high resolution
  r = Math.max(0, Math.min(255, r + pressureEffect + naturalVariation + qualityEffect))
  g = Math.max(0, Math.min(255, g + pressureEffect + naturalVariation + qualityEffect))
  b = Math.max(0, Math.min(255, b + pressureEffect + naturalVariation + qualityEffect))
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}
/**
 * Generate canvas for a specific page
 * @param {Object} page - Page object with text and settings
 * @returns {Promise<HTMLCanvasElement>} Canvas element
 */
async function generatePageCanvas(page) {
  return new Promise((resolve) => {
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")
    const scaleFactor = 4 // 4x resolution for high-quality PDF
    const width = 800 * scaleFactor
    const height = 1131 * scaleFactor // A4 ratio
    tempCanvas.width = width
    tempCanvas.height = height
    tempCtx.imageSmoothingEnabled = true
    tempCtx.imageSmoothingQuality = 'high'
    tempCtx.textRenderingOptimization = 'optimizeQuality'
    tempCtx.scale(scaleFactor, scaleFactor)
    createRealisticPaperBackgroundForCanvas(tempCtx, width/scaleFactor, height/scaleFactor)
    const settings = page.settings || getCurrentSettings()
    if (settings.showLines) {
      drawRealisticPaperLinesForCanvas(tempCtx, width/scaleFactor, height/scaleFactor)
    }
    if (settings.showMargin) {
      drawRealisticMarginForCanvas(tempCtx, height/scaleFactor)
    }
    tempCtx.font = `${settings.fontSize}px ${settings.font.replace(/'/g, "")}`
    tempCtx.fillStyle = settings.penColor
    tempCtx.textBaseline = "top"
    drawRealisticTextForCanvas(tempCtx, page.text, settings, width, height)
    resolve(tempCanvas)
  })
}
/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      try {
        func(...args)
      } catch (error) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.error("Debounced function error:", error)
        }
      }
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
/**
 * Handle window resize
 */
function handleResize() {
  setupCanvas()
  updatePreview()
}
/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardShortcuts(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "d") {
    event.preventDefault()
    toggleTheme()
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault()
    if (!downloadBtn.disabled) {
      downloadImage()
    }
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "p") {
    event.preventDefault()
    if (!pdfBtn.disabled) {
      generatePDF()
    }
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    event.preventDefault()
    clearText()
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "n") {
    event.preventDefault()
    addNewPage()
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "ArrowLeft") {
    event.preventDefault()
    previousPage()
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "ArrowRight") {
    event.preventDefault()
    nextPage()
  }
}
/**
 * Show minimal notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = "info") {
  if (isInitialLoad) {
    return
  }
  
  const existingToasts = document.querySelectorAll(".toast")
  existingToasts.forEach(toast => {
    toast.style.animation = "toast-fade-out 0.2s ease-in"
    setTimeout(() => toast.remove(), 200)
  })
  
  setTimeout(() => {
    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`
    
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "•"
    }
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = "toast-fade-out 0.2s ease-in"
        setTimeout(() => toast.remove(), 200)
      }
    }, 2000)
  }, 150)
}
/**
 * Run comprehensive functionality test
 */
function runComprehensiveFunctionalityTest() {
  const tests = [
    testTextInput,
    testHandwritingStyles,
    testCustomizationOptions,
    testDarkModeToggle,
    testPageManagement,
    testPDFGeneration,
    testKeyboardShortcuts,
    testResponsiveDesign,
  ]
  
  let passedTests = 0
  const totalTests = tests.length
  
  tests.forEach((test) => {
    try {
      const result = test()
      if (result) {
        passedTests++
      }
    } catch (error) {
      // Silent failure in production
    }
  })
  
  // Only log in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log(`Test Results: ${passedTests}/${totalTests} tests passed`)
  }
}
function testTextInput() {
  if (!textInput) return false
  const originalValue = textInput.value
  textInput.value = "Test input"
  textInput.dispatchEvent(new Event("input"))
  const result = charCount && wordCount && charCount.textContent.includes("10") && wordCount.textContent.includes("2")
  textInput.value = originalValue
  textInput.dispatchEvent(new Event("input"))
  return result
}
function testHandwritingStyles() {
  const styleOptions = document.querySelectorAll(".style-option")
  if (styleOptions.length === 0) return false
  const firstStyle = styleOptions[0]
  const secondStyle = styleOptions[1]
  secondStyle.click()
  const result = !firstStyle.classList.contains("active") && secondStyle.classList.contains("active")
  firstStyle.click()
  return result
}
function testCustomizationOptions() {
  const penColor = document.getElementById("penColor")
  const fontSize = document.getElementById("fontSize")
  const showLines = document.getElementById("showLines")
  const showMargin = document.getElementById("showMargin")
  if (!penColor || !fontSize || !showLines || !showMargin) return false
  const originalColor = penColor.value
  const originalSize = fontSize.value
  const originalLines = showLines.checked
  const originalMargin = showMargin.checked
  penColor.value = "#ff0000"
  penColor.dispatchEvent(new Event("change"))
  fontSize.value = "18"
  fontSize.dispatchEvent(new Event("input"))
  showLines.checked = !originalLines
  showLines.dispatchEvent(new Event("change"))
  showMargin.checked = !originalMargin
  showMargin.dispatchEvent(new Event("change"))
  penColor.value = originalColor
  fontSize.value = originalSize
  showLines.checked = originalLines
  showMargin.checked = originalMargin
  return true
}
function testDarkModeToggle() {
  const body = document.body
  const originalTheme = body.getAttribute("data-theme")
  const originalIcon = themeIcon.textContent
  toggleTheme()
  const themeChanged = body.getAttribute("data-theme") !== originalTheme
  const iconChanged = themeIcon.textContent !== originalIcon
  if (originalTheme) {
    body.setAttribute("data-theme", originalTheme)
  } else {
    body.removeAttribute("data-theme")
  }
  themeIcon.textContent = originalIcon
  return themeChanged && iconChanged
}
function testPageManagement() {
  const originalPageCount = pages.length
  addNewPage()
  const addedPage = pages.length > originalPageCount
  if (pages.length > 1) {
    previousPage()
    const navigatedBack = currentPageIndex < pages.length - 1
    nextPage()
    const navigatedForward = currentPageIndex === pages.length - 1
    deletePage()
    const deletedPage = pages.length === originalPageCount
    return addedPage && navigatedBack && navigatedForward && deletedPage
  }
  return addedPage
}
function testPDFGeneration() {
  if (typeof window.jspdf === "undefined") {
    console.warn("jsPDF library not loaded")
    return false
  }
  const hasContent = pages.some((page) => page.text && page.text.trim().length > 0)
  const buttonStateCorrect = pdfBtn.disabled !== hasContent
  return buttonStateCorrect
}
function testKeyboardShortcuts() {
  const hasKeyboardListeners = typeof handleKeyboardShortcuts === "function"
  const testEvent = new KeyboardEvent("keydown", {
    key: "d",
    ctrlKey: true,
    bubbles: true,
  })
  try {
    document.dispatchEvent(testEvent)
    return hasKeyboardListeners
  } catch (error) {
    return false
  }
}
function testResponsiveDesign() {
  const styles = getComputedStyle(document.body)
  const hasResponsiveStyles = true
  const viewport = document.querySelector('meta[name="viewport"]')
  const hasViewport = viewport && viewport.content.includes("width=device-width")
  return hasResponsiveStyles && hasViewport
}
/**
 * Create realistic paper background for PDF canvas
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function createRealisticPaperBackgroundForCanvas(context, width, height) {
  const baseColor = '#fefefe'
  context.fillStyle = baseColor
  context.fillRect(0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % width
    const y = Math.floor((i / 4) / width)
    const fiberNoise = (Math.random() - 0.5) * 2
    const agingFactor = Math.random() * 0.05
    const subtleTint = Math.sin(x * 0.01) * Math.sin(y * 0.01) * 2
    data[i] = Math.min(255, Math.max(245, data[i] + fiberNoise - agingFactor * 2 + subtleTint)) // Red
    data[i + 1] = Math.min(255, Math.max(245, data[i + 1] + fiberNoise - agingFactor * 1 + subtleTint * 0.9)) // Green  
    data[i + 2] = Math.min(255, Math.max(245, data[i + 2] + fiberNoise - agingFactor * 3 + subtleTint * 0.8)) // Blue
  }
  context.putImageData(imageData, 0, 0)
  const gradient = context.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(1, 'rgba(245, 245, 245, 0.005)')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
}
/**
 * Draw realistic paper lines for PDF
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function drawRealisticPaperLinesForCanvas(context, width, height) {
  context.strokeStyle = "#b8c5d6"
  context.lineWidth = 0.8
  const lineSpacing = 30
  for (let y = 50; y < height; y += lineSpacing) {
    context.beginPath()
    const lineVariation = (Math.random() - 0.5) * 0.3
    const actualY = y + lineVariation
    context.moveTo(0, actualY)
    const segments = 8
    const segmentWidth = width / segments
    for (let i = 1; i <= segments; i++) {
      const x = i * segmentWidth
      const yOffset = (Math.random() - 0.5) * 0.2
      if (i === segments) {
        context.lineTo(width, actualY + yOffset)
      } else {
        context.lineTo(x, actualY + yOffset)
      }
    }
    context.stroke()
  }
}
/**
 * Draw realistic margin for PDF
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {number} height - Canvas height
 */
function drawRealisticMarginForCanvas(context, height) {
  context.strokeStyle = "#e8a5a5"
  context.lineWidth = 1.5
  context.beginPath()
  const segments = 10
  const segmentHeight = height / segments
  context.moveTo(60, 0)
  for (let i = 1; i <= segments; i++) {
    const y = i * segmentHeight
    const xOffset = (Math.random() - 0.5) * 0.6
    if (i === segments) {
      context.lineTo(60 + xOffset, height)
    } else {
      context.lineTo(60 + xOffset, y)
    }
  }
  context.stroke()
}
/**
 * Draw realistic text for PDF canvas
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {string} text - Text to draw
 * @param {Object} settings - Text settings
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function drawRealisticTextForCanvas(context, text, settings, width, height) {
  const lines = text.split("\n")
  const lineHeight = Number.parseInt(settings.fontSize) * 1.8
  const startX = settings.showMargin ? 80 : 20
  const maxWidth = width - startX - 20
  let currentY = 60
  lines.forEach((line) => {
    if (line.trim() === "") {
      currentY += lineHeight
      return
    }
    const words = line.split(" ")
    let currentLine = ""
    words.forEach((word) => {
      const testLine = currentLine + word + " "
      context.font = `${settings.fontSize}px ${settings.font.replace(/'/g, "")}`
      const metrics = context.measureText(testLine)
      if (metrics.width > maxWidth && currentLine !== "") {
        drawTextWithVariationsForPDF(context, currentLine.trim(), startX, currentY, settings)
        currentLine = word + " "
        currentY += lineHeight
        if (currentY > height - 40) {
          return
        }
      } else {
        currentLine = testLine
      }
    })
    if (currentLine.trim() !== "" && currentY <= height - 40) {
      drawTextWithVariationsForPDF(context, currentLine.trim(), startX, currentY, settings)
    }
    currentY += lineHeight
  })
}
/**
 * Draw text with subtle variations for PDF
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {string} text - Text to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} settings - Text settings
 */
function drawTextWithVariationsForPDF(context, text, x, y, settings) {
  context.save()
  const xOffset = (Math.random() - 0.5) * 0.3
  const yOffset = (Math.random() - 0.5) * 0.8
  context.translate(xOffset, yOffset)
  context.fillStyle = addInkColorVariation(settings.penColor)
  context.globalAlpha = 0.85 + Math.random() * 0.15
  context.fillText(text, x, y)
  context.restore()
}
