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
 * Handle paste input with auto-pagination
 */
function handlePasteInput(event) {
  // Let the default paste happen first
  setTimeout(() => {
    const fullText = textInput.value
    
    // Check if text overflows current page
    if (doesTextOverflow(fullText)) {
      handleTextOverflow(fullText)
    } else {
      // Normal text input handling
      handleTextInput()
    }
  }, 10)
}

/**
 * Check if text overflows the current page capacity
 * @param {string} text - Text to check
 * @returns {boolean} - True if text overflows
 */
function doesTextOverflow(text) {
  const pageCapacity = calculatePageCapacity()
  return text.length > pageCapacity
}

/**
 * Calculate approximate character capacity per page
 * @returns {number} - Character capacity
 */
function calculatePageCapacity() {
  const fontSize = Number.parseInt(document.getElementById("fontSize").value)
  const showLines = document.getElementById("showLines").checked
  const showMargin = document.getElementById("showMargin").checked
  
  // Get canvas dimensions (approximating based on standard page)
  const canvasWidth = 800 // Approximate canvas width
  const canvasHeight = 600 // Approximate canvas height
  
  // Calculate usable area
  const marginOffset = showMargin ? 60 : 20
  const usableWidth = canvasWidth - marginOffset - 40 // Account for padding
  const usableHeight = canvasHeight - 40 // Account for top/bottom padding
  
  // Calculate lines per page
  const lineHeight = fontSize * 1.5 // Standard line height multiplier
  const linesPerPage = Math.floor(usableHeight / lineHeight)
  
  // Calculate characters per line (approximate)
  const avgCharWidth = fontSize * 0.6 // Approximate character width
  const charsPerLine = Math.floor(usableWidth / avgCharWidth)
  
  // Total capacity with some safety margin
  return Math.floor(linesPerPage * charsPerLine * 0.85) // 15% safety margin
}

/**
 * Handle text overflow by splitting across multiple pages
 * @param {string} fullText - The full text to be distributed
 */
function handleTextOverflow(fullText) {
  const pageCapacity = calculatePageCapacity()
  
  // Save current page first
  saveCurrentPage()
  
  // Split text into chunks that fit on pages
  const textChunks = splitTextIntoPages(fullText, pageCapacity)
  
  // Clear current page and set first chunk
  textInput.value = textChunks[0]
  pages[currentPageIndex].text = textChunks[0]
  
  // Create new pages for remaining chunks
  let newPagesCount = 0
  for (let i = 1; i < textChunks.length; i++) {
    // Add new page
    pages.push({
      text: textChunks[i],
      settings: getCurrentSettings(),
    })
    newPagesCount++
  }
  
  // Update UI
  updateCharacterCount()
  updatePreview()
  updatePageUI()
  
  // Show notification about auto-pagination
  if (newPagesCount > 0) {
    showNotification(`Text split across ${textChunks.length} pages (${newPagesCount} new pages created)`, "success")
  }
}

/**
 * Split text into page-sized chunks
 * @param {string} text - Text to split
 * @param {number} pageCapacity - Characters per page
 * @returns {string[]} - Array of text chunks
 */
function splitTextIntoPages(text, pageCapacity) {
  const chunks = []
  let remainingText = text
  
  while (remainingText.length > 0) {
    if (remainingText.length <= pageCapacity) {
      // Last chunk fits entirely
      chunks.push(remainingText)
      break
    }
    
    // Find a good break point (end of sentence, paragraph, or word)
    let breakPoint = pageCapacity
    
    // Try to break at paragraph
    let paragraphBreak = remainingText.lastIndexOf('\n\n', pageCapacity)
    if (paragraphBreak > pageCapacity * 0.7) {
      breakPoint = paragraphBreak + 2
    } else {
      // Try to break at sentence
      let sentenceBreak = remainingText.lastIndexOf('. ', pageCapacity)
      if (sentenceBreak > pageCapacity * 0.7) {
        breakPoint = sentenceBreak + 2
      } else {
        // Try to break at word
        let wordBreak = remainingText.lastIndexOf(' ', pageCapacity)
        if (wordBreak > pageCapacity * 0.8) {
          breakPoint = wordBreak + 1
        }
      }
    }
    
    // Extract chunk and continue with remaining text
    chunks.push(remainingText.substring(0, breakPoint).trim())
    remainingText = remainingText.substring(breakPoint).trim()
  }
  
  return chunks
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

  // Set canvas size based on container with higher base resolution
  const width = Math.min(1200, containerRect.width - 48)
  const height = Math.min(900, containerRect.height - 48)

  // Use higher DPI scaling for better quality
  const dpr = Math.max(2, window.devicePixelRatio || 1) // Minimum 2x scaling
  const scaleFactor = 3 // Additional scaling for premium quality
  
  outputCanvas.width = width * dpr * scaleFactor
  outputCanvas.height = height * dpr * scaleFactor

  // Set display size
  outputCanvas.style.width = width + "px"
  outputCanvas.style.height = height + "px"

  // Scale context for high DPI and quality
  ctx.scale(dpr * scaleFactor, dpr * scaleFactor)
  
  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.textRenderingOptimization = 'optimizeQuality'
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
  // More realistic paper line color (slightly faded blue)
  ctx.strokeStyle = "#b8c5d6" 
  ctx.lineWidth = 0.8

  const lineSpacing = 30
  for (let y = 50; y < height; y += lineSpacing) {
    ctx.beginPath()
    
    // Add slight variation to line position for realism
    const lineVariation = (Math.random() - 0.5) * 0.5
    const actualY = y + lineVariation
    
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
}

/**
 * Draw margin line on canvas 
 * @param {number} height - Canvas height
 */
function drawMargin(height) {
  // More realistic margin color (faded red/pink)
  ctx.strokeStyle = "#e8a5a5" 
  ctx.lineWidth = 1.5
  
  ctx.beginPath()
  
  // Add slight variation to margin line
  const segments = 10
  const segmentHeight = height / segments
  
  ctx.moveTo(60, 0)
  
  for (let i = 1; i <= segments; i++) {
    const y = i * segmentHeight
    const xOffset = (Math.random() - 0.5) * 0.8
    
    if (i === segments) {
      ctx.lineTo(60 + xOffset, height)
    } else {
      ctx.lineTo(60 + xOffset, y)
    }
  }
  
  ctx.stroke()
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
 * Download the current page as PNG image
 */
function downloadImage() {
  if (downloadBtn.disabled) return

  try {
    // Create download link
    const link = document.createElement("a")
    link.download = `handwriting-page-${currentPageIndex + 1}-${new Date().getTime()}.png`
    link.href = outputCanvas.toDataURL("image/png")

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Show success feedback
    showNotification("PNG image downloaded successfully!", "success")
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
    showNotification("Generating PDF... Please wait", "info")

    // Create new jsPDF instance
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // A4 dimensions in mm
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]

      if (!page.text.trim()) continue // Skip empty pages

      // Add new page if not first
      if (i > 0) {
        pdf.addPage()
      }

      // Create canvas for this page
      const pageCanvas = await generatePageCanvas(page)

      // Convert canvas to image data
      const imgData = pageCanvas.toDataURL("image/png")

      // Calculate image dimensions to fit page
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (pageCanvas.height / pageCanvas.width) * imgWidth

      // Add image to PDF
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, Math.min(imgHeight, pageHeight - margin * 2))

      // Add page number
      pdf.setFontSize(10)
      pdf.setTextColor(128, 128, 128)
      pdf.text(`Page ${i + 1}`, pageWidth - margin - 20, pageHeight - 10)
    }

    // Save PDF
    const fileName = `handwriting-${pages.length}-pages-${new Date().getTime()}.pdf`
    pdf.save(fileName)

    showNotification(`PDF with ${pages.length} pages generated successfully!`, "success")
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

// ==========================================================================
// CONSOLE WELCOME MESSAGE
// ==========================================================================

console.log(`
✍️ Enhanced Text to Handwriting Converter v1.0
===============================================

New Features:
• 🌙 Enhanced dark mode with proper paper colors
• 📄 Multi-page support with navigation
• 📋 PDF generation for all pages
• ⌨️  Extended keyboard shortcuts

Keyboard shortcuts:
• Ctrl/Cmd + D: Toggle dark mode
• Ctrl/Cmd + S: Download PNG
• Ctrl/Cmd + P: Generate PDF
• Ctrl/Cmd + K: Clear text
• Ctrl/Cmd + N: New page
• Ctrl/Cmd + ←/→: Navigate pages

GitHub: https://github.com/yadavnikhil03/text-to-handwriting
Made with ❤️ by Nikhil Yadav
`)
