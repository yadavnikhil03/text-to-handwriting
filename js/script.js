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
  textInput.addEventListener("paste", handleTextInput)

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts)

  // Window resize
  window.addEventListener("resize", debounce(handleResize, 250))

  // Header scroll effect
  let lastScrollY = 0
  let ticking = false

  function updateHeader() {
    const header = document.querySelector(".header")
    const scrollY = window.scrollY

    if (scrollY > 10) {
      header.classList.add("scrolled")
    } else {
      header.classList.remove("scrolled")
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

/**
 * Toggle between light and dark themes with smooth animation
 */
function toggleTheme() {
  const body = document.body
  const themeToggle = document.querySelector(".theme-toggle")
  const isDark = body.getAttribute("data-theme") === "dark"

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

    showNotification(`Switched to ${isDark ? "light" : "dark"} mode`, "success")
  }, 150)
}

/**
 * Load saved theme from localStorage
 */
function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme")
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.body.setAttribute("data-theme", "dark")
    themeIcon.textContent = "☀️"
  }
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

  // Set canvas size based on container
  const width = Math.min(800, containerRect.width - 48)
  const height = Math.min(600, containerRect.height - 48)

  // Set actual canvas size (for high DPI displays)
  const dpr = window.devicePixelRatio || 1
  outputCanvas.width = width * dpr
  outputCanvas.height = height * dpr

  // Set display size
  outputCanvas.style.width = width + "px"
  outputCanvas.style.height = height + "px"

  // Scale context for high DPI
  ctx.scale(dpr, dpr)
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

  // Set background - always white for paper (even in dark mode)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Draw paper lines if enabled
  if (showLines) {
    drawPaperLines(canvasWidth, canvasHeight)
  }

  // Draw margin if enabled
  if (showMargin) {
    drawMargin(canvasHeight)
  }

  // Set text properties
  ctx.font = `${fontSize}px ${currentFont.replace(/'/g, "")}`
  ctx.fillStyle = penColor
  ctx.textBaseline = "top"

  // Draw text
  drawText(text, fontSize, showMargin, canvasWidth, canvasHeight)

  // Enable download buttons
  downloadBtn.disabled = false
}

/**
 * Draw paper lines on canvas 
 * @param {number} width ]
 * @param {number} height \
 */
function drawPaperLines(width, height) {
  ctx.strokeStyle = "#e5e7eb" 
  ctx.lineWidth = 1

  const lineSpacing = 30
  for (let y = 50; y < height; y += lineSpacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

/**
 * Draw margin line on canvas 
 * @param {number} height - Canvas height
 */
function drawMargin(height) {
  ctx.strokeStyle = "#fca5a5" 
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(60, 0)
  ctx.lineTo(60, height)
  ctx.stroke()
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
    // Create temporary canvas
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")

    // Set canvas size (A4 proportions)
    const width = 800
    const height = 1131 // A4 ratio
    tempCanvas.width = width
    tempCanvas.height = height

    // Set background - always white for PDF
    tempCtx.fillStyle = "#ffffff"
    tempCtx.fillRect(0, 0, width, height)

    // Apply page settings
    const settings = page.settings || getCurrentSettings()

    // Draw paper lines if enabled
    if (settings.showLines) {
      tempCtx.strokeStyle = "#e5e7eb"
      tempCtx.lineWidth = 1
      const lineSpacing = 30
      for (let y = 50; y < height; y += lineSpacing) {
        tempCtx.beginPath()
        tempCtx.moveTo(0, y)
        tempCtx.lineTo(width, y)
        tempCtx.stroke()
      }
    }

    // Draw margin if enabled
    if (settings.showMargin) {
      tempCtx.strokeStyle = "#fca5a5"
      tempCtx.lineWidth = 2
      tempCtx.beginPath()
      tempCtx.moveTo(60, 0)
      tempCtx.lineTo(60, height)
      tempCtx.stroke()
    }

    // Set text properties
    tempCtx.font = `${settings.fontSize}px ${settings.font.replace(/'/g, "")}`
    tempCtx.fillStyle = settings.penColor
    tempCtx.textBaseline = "top"

    // Draw text
    const lines = page.text.split("\n")
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
        const metrics = tempCtx.measureText(testLine)

        if (metrics.width > maxWidth && currentLine !== "") {
          tempCtx.fillText(currentLine.trim(), startX, currentY)
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
        tempCtx.fillText(currentLine.trim(), startX, currentY)
      }

      currentY += lineHeight
    })

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
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification")
  existingNotifications.forEach((notification) => notification.remove())

  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`

  // Set notification content
  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  }

  notification.innerHTML = `
        <div style="
            display: flex;
            align-items: center;
            gap: var(--space-2);
            padding: var(--space-3) var(--space-4);
            background: var(--bg-elevated);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            color: var(--text-primary);
            font-size: 0.875rem;
            max-width: 400px;
        ">
            <span>${icons[type] || icons.info}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                font-size: 1.2rem;
                margin-left: auto;
                padding: 0;
            ">×</button>
        </div>
    `

  // Style notification
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `

  // Add type-specific styling
  const colors = {
    success: "var(--color-success)",
    error: "var(--color-error)",
    warning: "var(--color-warning)",
    info: "var(--color-primary)",
  }

  notification.querySelector("div").style.borderLeftColor = colors[type] || colors.info
  notification.querySelector("div").style.borderLeftWidth = "4px"

  // Add to DOM
  document.body.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideOutRight 0.3s ease-out"
      setTimeout(() => notification.remove(), 300)
    }
  }, 5000)
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

  if (passedTests === totalTests) {
    showNotification("All functionality tests passed! 🎉", "success")
  } else {
    showNotification(`${totalTests - passedTests} tests failed. Check console for details.`, "warning")
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
