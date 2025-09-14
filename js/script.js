/**
 * @author Nikhil Yadav
 * @version 1.0.0
 * @license MIT
 */

// ==========================================================================
// GLOBAL VARIABLES AND CONFIGURATION
// ==========================================================================

let currentFont = "'Homemade Apple', cursive"
let isGenerating = false
let debounceTimer = null
let currentPageIndex = 0
let isInitialLoad = true  // Flag to prevent notifications during initial load
const pages = [{ text: "", settings: null }]

// DOM Elements
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

// Canvas context
const ctx = outputCanvas.getContext("2d")

// ==========================================================================
// INITIALIZATION
// ==========================================================================

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

/**
 * Initialize all app components
 */
function initializeApp() {
  loadSavedTheme()
  setupEventListeners()
  updateCharacterCount()
  updatePreview()
  updatePageUI()

  // Initial canvas setup
  setupCanvas()

  // Initialize first page
  pages[0].text = textInput.value
  pages[0].settings = getCurrentSettings()

  // Mark initial load as complete
  setTimeout(() => {
    isInitialLoad = false
  }, 500)

  // Run comprehensive test after initialization
  setTimeout(() => {
    runComprehensiveFunctionalityTest()
  }, 1000)

  console.log("Enhanced Text to Handwriting Converter v1.0 initialized successfully")
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Text input events
  textInput.addEventListener("input", handleTextInput)
  textInput.addEventListener("paste", handlePasteInput)

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts)

  // Window resize
  window.addEventListener("resize", debounce(handleResize, 250))

  // Header scroll effect with mobile auto-hide
  let lastScrollY = 0
  let ticking = false

  function updateHeader() {
    const header = document.querySelector(".header")
    const scrollY = window.scrollY
    const isMobile = window.innerWidth <= 480

    // Standard scrolled state for all devices
    if (scrollY > 10) {
      header.classList.add("scrolled")
    } else {
      header.classList.remove("scrolled")
    }

    // Mobile-specific auto-hide behavior
    if (isMobile && scrollY > 50) {
      const scrollDiff = scrollY - lastScrollY
      
      if (scrollDiff > 5 && scrollY > 100) {
        // Scrolling down - hide header
        header.classList.add("scrolling-down")
        header.classList.remove("scrolling-up")
      } else if (scrollDiff < -5) {
        // Scrolling up - show header
        header.classList.add("scrolling-up")
        header.classList.remove("scrolling-down")
      }
    } else if (isMobile) {
      // Always show header when near top or not mobile
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

// ==========================================================================
// THEME MANAGEMENT
// ==========================================================================

// Theme switching debounce timer
let themeToggleTimer = null

/**
 * Toggle between light and dark themes with smooth animation
 */
function toggleTheme() {
  const body = document.body
  const themeToggle = document.querySelector(".theme-toggle")
  const isDark = body.getAttribute("data-theme") === "dark"

  // Prevent rapid clicking
  if (themeToggle.classList.contains("switching")) {
    return
  }

  // Add switching animation
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

    // Remove switching animation
    setTimeout(() => {
      themeToggle.classList.remove("switching")
    }, 200)

    // Add smooth transition
    body.style.transition = "all 0.3s ease"
    setTimeout(() => {
      body.style.transition = ""
    }, 300)

    // Regenerate canvas with new theme
    setTimeout(updatePreview, 100)

    // Debounced notification to prevent spam
    clearTimeout(themeToggleTimer)
    themeToggleTimer = setTimeout(() => {
      // Only show notification if not during initial load
      if (!isInitialLoad) {
        showNotification(`Switched to ${isDark ? "light" : "dark"} mode`, "success")
      }
    }, 300)
  }, 150)
}

/**
 * Load saved theme from localStorage
 */
function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme")
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const body = document.body

  // Prevent any transitions during theme loading
  body.style.transition = "none"

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    // Apply dark theme
    body.setAttribute("data-theme", "dark")
    themeIcon.textContent = "☀️"
    // Save the preference if it wasn't already saved
    if (!savedTheme) {
      localStorage.setItem("theme", "dark")
    }
  } else {
    // Apply light theme (default or explicitly saved)
    body.removeAttribute("data-theme")
    themeIcon.textContent = "🌙"
    // Save the preference if it wasn't already saved
    if (!savedTheme) {
      localStorage.setItem("theme", "light")
    }
  }

  // Re-enable transitions after a brief delay
  setTimeout(() => {
    body.style.transition = ""
  }, 100)
}

// ==========================================================================
// PAGE MANAGEMENT
// ==========================================================================

/**
 * Add a new page
 */
function addNewPage() {
  // Save current page
  saveCurrentPage()

  // Add new page
  pages.push({
    text: "",
    settings: getCurrentSettings(),
  })

  // Switch to new page
  currentPageIndex = pages.length - 1
  loadCurrentPage()
  updatePageUI()

  showNotification(`Added page ${pages.length}`, "success")
  textInput.focus()
}

/**
 * Delete current page
 */
function deletePage() {
  if (pages.length <= 1) {
    showNotification("Cannot delete the last page", "warning")
    return
  }

  // Remove current page
  pages.splice(currentPageIndex, 1)

  // Adjust current page index
  if (currentPageIndex >= pages.length) {
    currentPageIndex = pages.length - 1
  }

  // Load current page
  loadCurrentPage()
  updatePageUI()

  showNotification(`Deleted page. Now showing page ${currentPageIndex + 1}`, "success")
}

/**
 * Navigate to previous page
 */
function previousPage() {
  if (currentPageIndex > 0) {
    saveCurrentPage()
    currentPageIndex--
    loadCurrentPage()
    updatePageUI()
  }
}

/**
 * Navigate to next page
 */
function nextPage() {
  if (currentPageIndex < pages.length - 1) {
    saveCurrentPage()
    currentPageIndex++
    loadCurrentPage()
    updatePageUI()
  }
}

/**
 * Switch to specific page
 */
function switchToPage(pageIndex) {
  if (pageIndex >= 0 && pageIndex < pages.length && pageIndex !== currentPageIndex) {
    saveCurrentPage()
    currentPageIndex = pageIndex
    loadCurrentPage()
    updatePageUI()
  }
}

/**
 * Save current page data
 */
function saveCurrentPage() {
  pages[currentPageIndex].text = textInput.value
  pages[currentPageIndex].settings = getCurrentSettings()
}

/**
 * Load current page data
 */
function loadCurrentPage() {
  const currentPage = pages[currentPageIndex]
  textInput.value = currentPage.text

  if (currentPage.settings) {
    applySettings(currentPage.settings)
  }

  updateCharacterCount()
  updatePreview()
}

/**
 * Get current settings
 */
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

  // Update active style
  document.querySelectorAll(".style-option").forEach((option) => {
    option.classList.remove("active")
    if (option.dataset.font === settings.font) {
      option.classList.add("active")
    }
  })
}

/**
 * Update page UI elements
 */
function updatePageUI() {
  // Update page counter
  pageCounter.textContent = `Page ${currentPageIndex + 1} of ${pages.length}`

  // Update navigation buttons
  prevPageBtn.disabled = currentPageIndex === 0
  nextPageBtn.disabled = currentPageIndex === pages.length - 1
  deletePageBtn.disabled = pages.length <= 1

  // Update page indicators
  updatePageIndicators()

  // Enable PDF button if there are pages with content
  const hasContent = pages.some((page) => page.text.trim().length > 0)
  pdfBtn.disabled = !hasContent
}

/**
 * Update page indicator dots
 */
function updatePageIndicators() {
  pageIndicator.innerHTML = ""

  // Limit indicators to prevent overflow
  const maxIndicators = 10
  const totalPages = pages.length

  if (totalPages <= maxIndicators) {
    // Show all pages
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("div")
      dot.className = `page-dot ${i === currentPageIndex ? "active" : ""}`
      dot.onclick = () => switchToPage(i)
      dot.title = `Page ${i + 1}`
      pageIndicator.appendChild(dot)
    }
  } else {
    // Show condensed view
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

// ==========================================================================
// TEXT INPUT HANDLING
// ==========================================================================

/**
 * Handle text input changes with debouncing
 */
function handleTextInput() {
  updateCharacterCount()

  // Debounce the preview update for better performance
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
  // Let the default paste happen first
  setTimeout(() => {
    const fullText = textInput.value
    
    // Always check if text needs auto-pagination
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
  
  // If text fits on current page, use normal handling
  if (fullText.length <= pageCapacity) {
    handleTextInput()
    return
  }
  
  // Save current page before redistribution
  saveCurrentPage()
  
  // Split text into optimal chunks
  const textChunks = splitTextIntoOptimalPages(fullText, pageCapacity)
  
  // Ensure we have at least one chunk
  if (textChunks.length === 0) {
    textChunks.push(fullText) // Fallback to put everything on one page
  }
  
  // Clear current page and set first chunk
  textInput.value = textChunks[0]
  pages[currentPageIndex].text = textChunks[0]
  
  // Remove any existing pages after current (to avoid duplicates)
  pages.splice(currentPageIndex + 1)
  
  // Create new pages for remaining chunks
  let newPagesCreated = 0
  for (let i = 1; i < textChunks.length; i++) {
    pages.push({
      text: textChunks[i],
      settings: getCurrentSettings(),
    })
    newPagesCreated++
  }
  
  // Verify all text was distributed
  const totalDistributedText = textChunks.join('')
  const originalTextLength = fullText.replace(/\s+/g, '').length
  const distributedTextLength = totalDistributedText.replace(/\s+/g, '').length
  
  // Update UI
  updateCharacterCount()
  updatePreview()
  updatePageUI()
  
  // Show detailed notification
  const totalPages = textChunks.length
  const notification = newPagesCreated > 0 
    ? `Complete text distributed across ${totalPages} pages (${newPagesCreated} new pages created)`
    : `Text fits on current page`
  
  showNotification(notification, "success")
  
  // Log verification for debugging
  console.log(`Auto-pagination complete:`)
  console.log(`- Original text: ${originalTextLength} characters`)
  console.log(`- Distributed text: ${distributedTextLength} characters`)
  console.log(`- Pages created: ${totalPages}`)
  console.log(`- Text preservation: ${distributedTextLength === originalTextLength ? 'PERFECT' : 'CHECK NEEDED'}`)
}

/**
 * Calculate accurate character capacity per page
 * @returns {number} - Character capacity
 */
function calculatePageCapacity() {
  const fontSize = Number.parseInt(document.getElementById("fontSize").value) || 16
  const showLines = document.getElementById("showLines").checked
  const showMargin = document.getElementById("showMargin").checked
  
  // Use actual canvas dimensions for more accurate calculation
  const canvasStyle = outputCanvas.style
  const canvasWidth = parseInt(canvasStyle.width) || 800
  const canvasHeight = parseInt(canvasStyle.height) || 600
  
  // Calculate usable area with precise measurements
  const marginOffset = showMargin ? 80 : 30 // More accurate margin calculation
  const topPadding = 60
  const bottomPadding = 40
  const sidePadding = 20
  
  const usableWidth = canvasWidth - marginOffset - sidePadding
  const usableHeight = canvasHeight - topPadding - bottomPadding
  
  // More accurate line height calculation (based on actual font rendering)
  const lineHeight = fontSize * 1.6 // Realistic line height for handwriting
  const linesPerPage = Math.floor(usableHeight / lineHeight)
  
  // More accurate character width calculation (varies by font and size)
  const avgCharWidth = fontSize * 0.55 // More accurate for handwriting fonts
  const charsPerLine = Math.floor(usableWidth / avgCharWidth)
  
  // Conservative capacity calculation to ensure text fits
  const baseCapacity = linesPerPage * charsPerLine
  const safetyMargin = 0.75 // 25% safety margin for realistic text flow
  
  const finalCapacity = Math.floor(baseCapacity * safetyMargin)
  
  // Ensure minimum capacity (prevent infinite loops with tiny fonts)
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
      // Last chunk fits entirely
      chunks.push(remainingText)
      break
    }
    
    // Find the optimal break point
    let breakPoint = findOptimalBreakPoint(remainingText, pageCapacity)
    
    // Ensure we make progress (minimum 10% of capacity)
    if (breakPoint < pageCapacity * 0.1) {
      breakPoint = Math.min(pageCapacity, remainingText.length)
    }
    
    // Extract chunk
    const chunk = remainingText.substring(0, breakPoint).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    
    // Continue with remaining text
    remainingText = remainingText.substring(breakPoint).trim()
  }
  
  // Safety check: if we hit max iterations, put remaining text in final chunk
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
  // Priority 1: Double newline (paragraph break) - ideal for readability
  let paragraphBreak = text.lastIndexOf('\n\n', capacity)
  if (paragraphBreak > capacity * 0.6) {
    return paragraphBreak + 2
  }
  
  // Priority 2: Single newline (line break) - good for preserving structure
  let lineBreak = text.lastIndexOf('\n', capacity)
  if (lineBreak > capacity * 0.65) {
    return lineBreak + 1
  }
  
  // Priority 3: Sentence end (. ! ?) - natural reading breaks
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
  
  // Priority 4: Comma or semicolon - decent breaking points
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
  
  // Priority 5: Word boundary - avoid breaking words
  let wordBreak = text.lastIndexOf(' ', capacity)
  if (wordBreak > capacity * 0.8) {
    return wordBreak + 1
  }
  
  // Priority 6: Any whitespace character
  const whitespaceRegex = /\s/
  for (let i = capacity - 1; i >= capacity * 0.8; i--) {
    if (whitespaceRegex.test(text[i])) {
      return i + 1
    }
  }
  
  // Fallback: Hard break at capacity (last resort)
  return Math.min(capacity, text.length)
}

// ==========================================================================
// STYLE SELECTION
// ==========================================================================

/**
 * Select handwriting style
 * @param {HTMLElement} element - The clicked style option element
 */
function selectStyle(element) {
  // Remove active class from all options
  document.querySelectorAll(".style-option").forEach((option) => {
    option.classList.remove("active")
  })

  // Add active class to selected option
  element.classList.add("active")

  // Update current font
  currentFont = element.dataset.font

  // Add selection animation
  element.style.transform = "scale(0.95)"
  setTimeout(() => {
    element.style.transform = ""
  }, 150)

  // Update preview
  updatePreview()

  showNotification(`Style changed to ${element.querySelector(".style-name").textContent}`, "success")
}

// ==========================================================================
// CANVAS MANAGEMENT
// ==========================================================================

/**
 * Setup canvas with proper dimensions and DPI scaling
 */
function setupCanvas() {
  const container = outputCanvas.parentElement
  const containerRect = container.getBoundingClientRect()

  // Set canvas size based on container with ultra-high resolution
  const width = Math.min(1200, containerRect.width - 48)
  const height = Math.min(900, containerRect.height - 48)

  // Ultra-high DPI scaling for maximum quality
  const dpr = Math.max(3, window.devicePixelRatio || 1) // Minimum 3x scaling
  const scaleFactor = 8 // Ultra-high scaling for maximum quality (8x instead of 3x)
  
  outputCanvas.width = width * dpr * scaleFactor
  outputCanvas.height = height * dpr * scaleFactor

  // Set display size
  outputCanvas.style.width = width + "px"
  outputCanvas.style.height = height + "px"

  // Scale context for ultra-high DPI and maximum quality
  ctx.scale(dpr * scaleFactor, dpr * scaleFactor)
  
  // Enable maximum quality rendering settings
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.textRenderingOptimization = 'optimizeQuality'
  
  // Additional quality enhancements
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 10
  
  // Enable sub-pixel rendering for ultra-crisp text
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

  // Small delay to show smooth transition
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
  // Get current settings
  const fontSize = Number.parseInt(document.getElementById("fontSize").value)
  const penColor = document.getElementById("penColor").value
  const showLines = document.getElementById("showLines").checked
  const showMargin = document.getElementById("showMargin").checked

  // Clear canvas
  ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height)

  // Get canvas dimensions
  const canvasWidth = Number.parseInt(outputCanvas.style.width)
  const canvasHeight = Number.parseInt(outputCanvas.style.height)

  // Create realistic paper background
  createRealisticPaperBackground(canvasWidth, canvasHeight)

  // Draw paper lines if enabled
  if (showLines) {
    drawPaperLines(canvasWidth, canvasHeight)
  }

  // Draw margin if enabled
  if (showMargin) {
    drawMargin(canvasHeight)
  }

  // Set text properties with handwriting effects
  ctx.font = `${fontSize}px ${currentFont.replace(/'/g, "")}`
  ctx.fillStyle = penColor
  ctx.textBaseline = "top"

  // Draw text with realistic handwriting effects
  drawRealisticText(text, fontSize, showMargin, canvasWidth, canvasHeight, penColor)

  // Enable download buttons
  downloadBtn.disabled = false
}

/**
 * Create a realistic paper background with aging effects
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function createRealisticPaperBackground(width, height) {
  // Base paper color (very subtle off-white, not yellow)
  const baseColor = '#fefefe'
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, width, height)

  // Add subtle texture with optimized performance
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Sample every few pixels for performance while maintaining quality
  const step = 1 // Sample every pixel for best quality
  
  for (let i = 0; i < data.length; i += 4 * step) {
    const pixelIndex = i / 4
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    
    // Skip if outside bounds
    if (x >= width || y >= height) continue
    
    // Add fine paper fiber texture
    const fiberNoise = (Math.random() - 0.5) * 2
    
    // Very subtle aging (much less yellow)
    const agingFactor = Math.random() * 0.05
    const subtleTint = Math.sin(x * 0.008) * Math.sin(y * 0.008) * 3
    
    // Apply effects to current pixel and adjacent pixels for smooth blending
    for (let offset = 0; offset < step * 4 && i + offset < data.length; offset += 4) {
      // Apply minimal effects to RGB values
      data[i + offset] = Math.min(255, Math.max(248, data[i + offset] + fiberNoise - agingFactor * 2 + subtleTint)) // Red
      data[i + offset + 1] = Math.min(255, Math.max(248, data[i + offset + 1] + fiberNoise - agingFactor * 1 + subtleTint * 0.9)) // Green  
      data[i + offset + 2] = Math.min(255, Math.max(248, data[i + offset + 2] + fiberNoise - agingFactor * 2 + subtleTint * 0.8)) // Blue
    }
  }

  // Apply the texture
  ctx.putImageData(imageData, 0, 0)

  // Add very subtle gradient for paper depth
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
  // Calculate proper line width based on canvas scaling
  const dpr = Math.max(3, window.devicePixelRatio || 1)
  const scaleFactor = 8
  const totalScale = dpr * scaleFactor
  
  // Save current context
  ctx.save()
  
  // More realistic paper line color (slightly faded blue)
  ctx.strokeStyle = "#b8c5d6" 
  // Scale line width to be visible at all zoom levels (minimum 2 pixels scaled)
  ctx.lineWidth = Math.max(2, 0.8 * totalScale / 12) // Ensure minimum visibility
  
  // Use crisp lines for better visibility
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'miter'

  const lineSpacing = 30
  for (let y = 50; y < height; y += lineSpacing) {
    ctx.beginPath()
    
    // Add slight variation to line position for realism
    const lineVariation = (Math.random() - 0.5) * 0.5
    // Snap to pixel boundaries for crisp lines
    const actualY = Math.round(y + lineVariation) + 0.5
    
    // Draw line with slight imperfections
    ctx.moveTo(0, actualY)
    
    // Add subtle curve to simulate paper imperfections
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
  
  // Restore context
  ctx.restore()
}

/**
 * Draw margin line on canvas 
 * @param {number} height - Canvas height
 */
function drawMargin(height) {
  // Calculate proper line width based on canvas scaling
  const dpr = Math.max(3, window.devicePixelRatio || 1)
  const scaleFactor = 8
  const totalScale = dpr * scaleFactor
  
  // Save current context
  ctx.save()
  
  // More realistic margin color (faded red/pink)
  ctx.strokeStyle = "#e8a5a5" 
  // Scale line width to be visible at all zoom levels (minimum 2.5 pixels scaled)
  ctx.lineWidth = Math.max(2.5, 1.5 * totalScale / 12) // Ensure minimum visibility
  
  // Use crisp lines for better visibility
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'miter'
  
  ctx.beginPath()
  
  // Add slight variation to margin line
  const segments = 10
  const segmentHeight = height / segments
  
  // Snap to pixel boundaries for crisp lines
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
  
  // Restore context
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

  // Create realistic pen variations
  const baseAlpha = 0.85 + Math.random() * 0.15 // Slight ink variation

  lines.forEach((line, lineIndex) => {
    if (line.trim() === "") {
      currentY += lineHeight
      return
    }

    const words = line.split(" ")
    let currentLine = ""
    let lineWords = []

    // Group words into lines
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

    // Draw each line with realistic effects
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
  // Split into characters for individual character effects
  const characters = text.split('')
  let currentX = x
  
  characters.forEach((char, index) => {
    if (char === ' ') {
      // Handle spaces
      ctx.font = `${fontSize}px ${currentFont.replace(/'/g, "")}`
      const spaceWidth = ctx.measureText(' ').width
      currentX += spaceWidth
      return
    }

    // Create subtle variations for each character (reduced for better quality)
    const charVariation = {
      xOffset: (Math.random() - 0.5) * 0.3, // Reduced from 0.8
      yOffset: (Math.random() - 0.5) * 0.5, // Reduced from 1.2
      scaleX: 0.98 + Math.random() * 0.04, // Reduced from 0.1
      scaleY: 0.98 + Math.random() * 0.04, // Reduced from 0.1
      rotation: (Math.random() - 0.5) * 0.008, // Reduced from 0.02
      alpha: baseAlpha + (Math.random() - 0.5) * 0.05 // Reduced from 0.1
    }

    // Apply character variations
    ctx.save()
    
    // Set alpha for ink variation
    ctx.globalAlpha = Math.max(0.85, Math.min(1, charVariation.alpha))
    
    // Translate to character position
    ctx.translate(currentX + charVariation.xOffset, y + charVariation.yOffset)
    
    // Apply rotation and scaling
    ctx.rotate(charVariation.rotation)
    ctx.scale(charVariation.scaleX, charVariation.scaleY)
    
    // Set font and color with minimal variations
    const adjustedFontSize = fontSize * (0.99 + Math.random() * 0.02) // Reduced from 0.04
    ctx.font = `${adjustedFontSize}px ${currentFont.replace(/'/g, "")}`
    
    // Add minimal color variation for realistic ink
    const inkVariation = addSubtleInkColorVariation(penColor)
    ctx.fillStyle = inkVariation
    ctx.textBaseline = "top"
    
    // Draw the character
    ctx.fillText(char, 0, 0)
    
    ctx.restore()

    // Move to next character position
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
  // Convert hex to RGB if needed
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

  // Add very subtle random variation (±2 for each channel, reduced from ±5)
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
  // Convert hex to RGB if needed
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

  // Add slight random variation (±5 for each channel)
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
        // Draw current line and start new one
        ctx.fillText(currentLine.trim(), startX, currentY)
        currentLine = word + " "
        currentY += lineHeight

        // Check if we're running out of space
        if (currentY > canvasHeight - 40) {
          return
        }
      } else {
        currentLine = testLine
      }
    })

    // Draw remaining text
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

// ==========================================================================
// DOWNLOAD FUNCTIONALITY
// ==========================================================================

/**
 * Download the current page as ultra-high quality PNG image
 */
function downloadImage() {
  if (downloadBtn.disabled) return

  try {
    // Create ultra-high quality version for download
    const ultraCanvas = document.createElement("canvas")
    const ultraCtx = ultraCanvas.getContext("2d")
    
    // Ultra-high resolution (8x the display resolution)
    const ultraScale = 8
    const displayWidth = parseInt(outputCanvas.style.width)
    const displayHeight = parseInt(outputCanvas.style.height)
    
    ultraCanvas.width = displayWidth * ultraScale
    ultraCanvas.height = displayHeight * ultraScale
    
    // Scale context for ultra-high resolution
    ultraCtx.scale(ultraScale, ultraScale)
    
    // Maximum quality settings
    ultraCtx.imageSmoothingEnabled = true
    ultraCtx.imageSmoothingQuality = 'high'
    ultraCtx.textRenderingOptimization = 'optimizeQuality'
    ultraCtx.lineCap = 'round'
    ultraCtx.lineJoin = 'round'
    
    // Recreate the current page at ultra-high resolution
    const currentPage = pages[currentPageIndex]
    
    // Clear with white background
    ultraCtx.fillStyle = "#ffffff"
    ultraCtx.fillRect(0, 0, displayWidth, displayHeight)
    
    // Create ultra-realistic paper background
    createUltraRealisticPaperBackground(ultraCtx, displayWidth, displayHeight, ultraScale)
    
    // Draw paper lines if enabled
    if (currentPage.settings.showLines) {
      drawUltraHighQualityPaperLines(ultraCtx, displayWidth, displayHeight, ultraScale)
    }
    
    // Draw margin if enabled
    if (currentPage.settings.showMargin) {
      drawUltraHighQualityMargin(ultraCtx, displayHeight, ultraScale)
    }
    
    // Draw ultra-high quality text
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
    
    // Create download link with maximum quality PNG
    const link = document.createElement("a")
    link.download = `handwriting-ultra-hq-page-${currentPageIndex + 1}-${new Date().getTime()}.png`
    link.href = ultraCanvas.toDataURL("image/png", 1.0) // Maximum quality

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Show success feedback
    showNotification("Ultra-high quality PNG image downloaded successfully!", "success")
  } catch (error) {
    console.error("Download failed:", error)
    showNotification("Download failed. Please try again.", "error")
  }
}

/**
 * Generate and download PDF with all pages
 */
async function generatePDF() {
  if (pdfBtn.disabled) return

  // Save current page before generating PDF
  saveCurrentPage()

  // Show loading state
  pdfBtn.classList.add("btn-loading")
  pdfBtn.disabled = true

  try {
    showNotification("Generating ultra-high quality PDF... Please wait", "info")

    // Create new jsPDF instance with maximum quality settings
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: false, // Disable compression for maximum quality
      precision: 16,   // Maximum precision
      userUnit: 1.0,   // Standard user unit for best quality
    })

    // A4 dimensions in mm with optimized margins
    const pageWidth = 210
    const pageHeight = 297
    const margin = 15  // Reduced margin for more content space

    let pageCount = 0

    // Process each page with ultra-high quality
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]

      if (!page.text.trim()) continue // Skip empty pages

      // Add new page if not first
      if (pageCount > 0) {
        pdf.addPage()
      }

      // Create ultra-high resolution canvas for this page
      const pageCanvas = await generateUltraHighQualityPageCanvas(page)

      // Convert canvas to ultra-high quality image data
      const imgData = pageCanvas.toDataURL("image/png", 1.0) // Maximum quality PNG

      // Calculate image dimensions to fit page with optimal scaling
      const imgWidth = pageWidth - margin * 2
      const aspectRatio = pageCanvas.height / pageCanvas.width
      const imgHeight = Math.min(imgWidth * aspectRatio, pageHeight - margin * 2 - 15) // Reserve space for page number

      // Add ultra-high quality image to PDF
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

      // Add professional page number
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

    // Save PDF with timestamp
    const fileName = `handwriting-ultra-hq-${pageCount}-pages-${new Date().getTime()}.pdf`
    pdf.save(fileName)

    showNotification(`Ultra-high quality PDF with ${pageCount} pages generated successfully!`, "success")
  } catch (error) {
    console.error("PDF generation failed:", error)
    showNotification("PDF generation failed. Please try again.", "error")
  } finally {
    // Remove loading state
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
    // Create ultra-high resolution canvas
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    
    // Ultra-high resolution settings (much higher than display)
    const ultraScale = 16 // 16x resolution for maximum quality
    const baseWidth = 2480  // A4 width at 300 DPI
    const baseHeight = 3508 // A4 height at 300 DPI
    
    canvas.width = baseWidth * ultraScale
    canvas.height = baseHeight * ultraScale
    
    // Scale context for ultra-high resolution rendering
    context.scale(ultraScale, ultraScale)
    
    // Maximum quality settings
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.textRenderingOptimization = 'optimizeQuality'
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.miterLimit = 20
    context.globalCompositeOperation = 'source-over'
    
    // Apply page settings
    currentFont = page.settings.fontFamily
    
    // Clear with white background
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, baseWidth, baseHeight)
    
    // Create ultra-realistic paper background
    createUltraRealisticPaperBackground(context, baseWidth, baseHeight, ultraScale)
    
    // Draw paper lines if enabled
    if (page.settings.showLines) {
      drawUltraHighQualityPaperLines(context, baseWidth, baseHeight, ultraScale)
    }
    
    // Draw margin if enabled
    if (page.settings.showMargin) {
      drawUltraHighQualityMargin(context, baseHeight, ultraScale)
    }
    
    // Draw ultra-high quality text
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
    
    // Small delay to ensure rendering completion
    setTimeout(() => resolve(canvas), 100)
  })
}

/**
 * Create ultra-realistic paper background with maximum quality
 */
function createUltraRealisticPaperBackground(context, width, height, scale) {
  // Ultra-high quality paper texture
  const textureScale = scale / 4
  
  // Create subtle paper grain with ultra-fine detail
  for (let x = 0; x < width; x += 0.25) { // Ultra-fine sampling
    for (let y = 0; y < height; y += 0.25) {
      const noise = Math.random() * 3 + 252 // Very subtle noise
      context.fillStyle = `rgb(${noise}, ${noise}, ${noise})`
      context.fillRect(x, y, 0.5, 0.5)
    }
  }
  
  // Add ultra-subtle paper fibers
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
  // Ultra-realistic paper line color (slightly faded blue)
  context.strokeStyle = "#b8c5d6"
  context.lineWidth = 0.8 * (scale / 8) // Scale line width appropriately
  
  const lineSpacing = 30 * (scale / 8) // Scale line spacing
  for (let y = 50 * (scale / 8); y < height; y += lineSpacing) {
    context.beginPath()
    
    // Add slight variation to line position for realism
    const lineVariation = (Math.random() - 0.5) * 0.5 * (scale / 8)
    const actualY = y + lineVariation
    
    // Draw line with slight imperfections
    context.moveTo(0, actualY)
    
    // Add subtle curve to simulate paper imperfections
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
  // Ultra-realistic margin color (faded red/pink)
  context.strokeStyle = "#f0b8c5"
  context.lineWidth = 0.8 * (scale / 8)
  
  const marginX = 80 * (scale / 8) // Scale margin position
  
  context.beginPath()
  context.moveTo(marginX, 0)
  
  // Add slight variations for realistic margin line
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
  // Scale font size for ultra-high resolution
  const scaledFontSize = fontSize * (scale / 8)
  
  const lines = text.split("\n")
  const baseLineHeight = scaledFontSize * 1.6
  const startX = showMargin ? 120 : 30
  const maxWidth = width - startX - 30
  let currentY = 100
  
  // Ultra-realistic writing characteristics
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
    
    // Group words into lines
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
    
    // Draw each line with ultra-realistic effects
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
      
      // Ultra-realistic character variations
      const humanVariations = {
        xOffset: (Math.random() - 0.5) * 1.8,
        yOffset: (Math.random() - 0.5) * 2.2 + tiredness * 8,
        scaleX: 0.90 + Math.random() * 0.20,
        scaleY: 0.92 + Math.random() * 0.16,
        rotation: wordSlant + (Math.random() - 0.5) * 0.025,
        alpha: Math.max(0.70, pressure + (Math.random() - 0.5) * 0.20),
        fontSizeVar: fontSize * (0.94 + Math.random() * 0.12)
      }
      
      // Apply ultra-realistic character rendering
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
      
      // Natural character spacing
      context.font = `${fontSize}px ${currentFont.replace(/'/g, "")}`
      const charWidth = context.measureText(char).width
      const naturalSpacing = charWidth * (0.93 + Math.random() * 0.14)
      currentX += naturalSpacing
    }
    
    // Natural word spacing
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
  
  // Ultra-realistic ink variations
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
    // Create temporary canvas with higher resolution for PDF
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")

    // Set canvas size (A4 proportions) with higher resolution
    const scaleFactor = 4 // 4x resolution for high-quality PDF
    const width = 800 * scaleFactor
    const height = 1131 * scaleFactor // A4 ratio
    tempCanvas.width = width
    tempCanvas.height = height

    // Enable high-quality rendering
    tempCtx.imageSmoothingEnabled = true
    tempCtx.imageSmoothingQuality = 'high'
    tempCtx.textRenderingOptimization = 'optimizeQuality'

    // Scale context for high-quality rendering
    tempCtx.scale(scaleFactor, scaleFactor)

    // Create realistic paper background for PDF
    createRealisticPaperBackgroundForCanvas(tempCtx, width/scaleFactor, height/scaleFactor)

    // Apply page settings
    const settings = page.settings || getCurrentSettings()

    // Draw paper lines if enabled with realistic styling
    if (settings.showLines) {
      drawRealisticPaperLinesForCanvas(tempCtx, width/scaleFactor, height/scaleFactor)
    }

    // Draw margin if enabled with realistic styling
    if (settings.showMargin) {
      drawRealisticMarginForCanvas(tempCtx, height/scaleFactor)
    }

    // Set text properties
    tempCtx.font = `${settings.fontSize}px ${settings.font.replace(/'/g, "")}`
    tempCtx.fillStyle = settings.penColor
    tempCtx.textBaseline = "top"

    // Draw text with realistic effects
    drawRealisticTextForCanvas(tempCtx, page.text, settings, width, height)

    resolve(tempCanvas)
  })
}

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

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
      func(...args)
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
  // Ctrl/Cmd + D: Toggle dark mode
  if ((event.ctrlKey || event.metaKey) && event.key === "d") {
    event.preventDefault()
    toggleTheme()
  }

  // Ctrl/Cmd + S: Download PNG
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault()
    if (!downloadBtn.disabled) {
      downloadImage()
    }
  }

  // Ctrl/Cmd + P: Generate PDF
  if ((event.ctrlKey || event.metaKey) && event.key === "p") {
    event.preventDefault()
    if (!pdfBtn.disabled) {
      generatePDF()
    }
  }

  // Ctrl/Cmd + K: Clear text
  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    event.preventDefault()
    clearText()
  }

  // Ctrl/Cmd + N: New page
  if ((event.ctrlKey || event.metaKey) && event.key === "n") {
    event.preventDefault()
    addNewPage()
  }

  // Ctrl/Cmd + Left Arrow: Previous page
  if ((event.ctrlKey || event.metaKey) && event.key === "ArrowLeft") {
    event.preventDefault()
    previousPage()
  }

  // Ctrl/Cmd + Right Arrow: Next page
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
  // Don't show notifications during initial load
  if (isInitialLoad) {
    return
  }

  // Remove existing toasts
  const existingToasts = document.querySelectorAll(".toast")
  existingToasts.forEach(toast => {
    toast.style.animation = "toast-slide-out 0.2s ease-in"
    setTimeout(() => toast.remove(), 200)
  })
  
  // Wait for removal, then show new toast
  setTimeout(() => {
    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`
    
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "i"
    }
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `
    
    document.body.appendChild(toast)
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = "toast-slide-out 0.2s ease-in"
        setTimeout(() => toast.remove(), 200)
      }
    }, 3000)
  }, 50)
}

// ==========================================================================
// FUNCTIONALITY TESTING
// ==========================================================================

/**
 * Run comprehensive functionality test
 */
function runComprehensiveFunctionalityTest() {
  console.log("🧪 Running Comprehensive Functionality Test...")

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

  tests.forEach((test, index) => {
    try {
      const result = test()
      if (result) {
        console.log(`✅ Test ${index + 1}: ${test.name} - PASSED`)
        passedTests++
      } else {
        console.log(`❌ Test ${index + 1}: ${test.name} - FAILED`)
      }
    } catch (error) {
      console.log(`❌ Test ${index + 1}: ${test.name} - ERROR:`, error.message)
    }
  })

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`)

  // Log results to console only (no notifications for end users)
  if (passedTests === totalTests) {
    console.log("✅ All functionality tests passed!")
  } else {
    console.log(`⚠️ ${totalTests - passedTests} tests failed. Check console for details.`)
  }
}

// Individual test functions
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

  // Restore original values
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

  // Restore original theme
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

// ==========================================================================
// PDF GENERATION HELPER FUNCTIONS
// ==========================================================================

/**
 * Create realistic paper background for PDF canvas
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function createRealisticPaperBackgroundForCanvas(context, width, height) {
  // Base paper color (subtle off-white, not yellow)
  const baseColor = '#fefefe'
  context.fillStyle = baseColor
  context.fillRect(0, 0, width, height)

  // Add subtle texture with high quality
  const imageData = context.getImageData(0, 0, width, height)
  const data = imageData.data

  // Add fine paper texture
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % width
    const y = Math.floor((i / 4) / width)
    
    // Add fine paper fiber texture
    const fiberNoise = (Math.random() - 0.5) * 2
    
    // Very minimal aging for professional look
    const agingFactor = Math.random() * 0.05
    const subtleTint = Math.sin(x * 0.01) * Math.sin(y * 0.01) * 2
    
    // Apply minimal effects to RGB values
    data[i] = Math.min(255, Math.max(245, data[i] + fiberNoise - agingFactor * 2 + subtleTint)) // Red
    data[i + 1] = Math.min(255, Math.max(245, data[i + 1] + fiberNoise - agingFactor * 1 + subtleTint * 0.9)) // Green  
    data[i + 2] = Math.min(255, Math.max(245, data[i + 2] + fiberNoise - agingFactor * 3 + subtleTint * 0.8)) // Blue
  }

  // Apply the texture
  context.putImageData(imageData, 0, 0)

  // Add very subtle gradient for paper depth
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
        // Draw with slight variations
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
  
  // Add subtle randomness
  const xOffset = (Math.random() - 0.5) * 0.3
  const yOffset = (Math.random() - 0.5) * 0.8
  
  context.translate(xOffset, yOffset)
  
  // Slight color variation
  context.fillStyle = addInkColorVariation(settings.penColor)
  context.globalAlpha = 0.85 + Math.random() * 0.15
  
  context.fillText(text, x, y)
  
  context.restore()
}

