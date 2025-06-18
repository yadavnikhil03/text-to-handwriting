# Text-to-Handwriting Converter ✍️

A modern, responsive web application that transforms your digital text into beautiful handwritten notes with customizable styles, colors, and paper types. Generate professional-looking handwritten documents with multi-page support and PDF export functionality.

![Text-to-Handwriting Converter](https://img.shields.io/badge/Status-Active-brightgreen) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

### ✨ Core Functionality
- **Real-time Text Conversion**: Convert typed text to handwriting instantly as you type
- **Multiple Handwriting Styles**: Choose from 4 distinct handwriting fonts:
  - **Classic**: Traditional cursive style (Homemade Apple)
  - **Modern**: Clean contemporary handwriting (Caveat)
  - **Artistic**: Unique artistic flair (Liu Jian Mao Cao)
  - **Elegant**: Sophisticated script style (Dancing Script)

### 🎨 Customization Options
- **Pen Color Selection**: Choose from any color with a color picker
- **Font Size Control**: Adjustable font size from 8pt to 24pt
- **Paper Customization**:
  - Toggle ruled lines on/off
  - Show/hide margin lines
  - Paper background

### 📄 Multi-Page Management
- **Add/Remove Pages**: Create multiple pages for longer documents
- **Page Navigation**: Easy navigation between pages with visual indicators
- **Page Counter**: Track current page and total pages
- **Individual Page Settings**: Each page maintains its own text and formatting

### 🌙 User Experience
- **Dark Mode Toggle**: Seamless light/dark theme switching
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Smooth Animations**: Polished transitions and micro-interactions
- **Sticky Header**: Always-accessible navigation with user branding
- **Real-time Statistics**: Character and word count display

### 📥 Export Options
- **PNG Download**: Download individual pages as high-quality images
- **PDF Generation**: Combine all pages into a single PDF document
- **High-DPI Support**: Crisp output on all screen types

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + D`: Toggle dark mode
- `Ctrl/Cmd + S`: Download current page as PNG
- `Ctrl/Cmd + P`: Generate PDF
- `Ctrl/Cmd + K`: Clear current page text
- `Ctrl/Cmd + N`: Add new page
- `Ctrl/Cmd + ←/→`: Navigate between pages

## 🛠️ Technologies Used

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **Vanilla JavaScript**: Core functionality and DOM manipulation

### Libraries & Dependencies
- **jsPDF**: PDF generation and export functionality
- **Google Fonts**: Custom handwriting font integration
  - Inter (UI font)
  - Homemade Apple (Classic handwriting)
  - Caveat (Modern handwriting)
  - Liu Jian Mao Cao (Artistic handwriting)
  - Dancing Script (Elegant handwriting)

### Browser APIs
- **Canvas API**: Real-time handwriting rendering
- **Local Storage API**: Theme preference persistence
- **File API**: Image and PDF download functionality

## 🚀 Installation

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software required - runs entirely in the browser!

### Quick Start
1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yadavnikhil03/text-to-handwriting.git
   cd text-to-handwriting
   \`\`\`

2. **Open the application**
   \`\`\`bash
   # Option 1: Open directly in browser
   open index.html
   
   # Option 2: Use a local server (recommended)
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   \`\`\`

3. **Access the application**
   - Direct file: Open `index.html` in your browser
   - Local server: Navigate to `http://localhost:8000`

### Development Setup
For development with live reload:
\`\`\`bash
# Using Live Server (VS Code extension) or
# Using any static file server of your choice
\`\`\`

## 📖 Usage

### Getting Started
1. **Enter Your Text**: Type or paste your text in the input area on the left panel
2. **Choose a Style**: Select from 4 handwriting styles (Classic, Modern, Artistic, Elegant)
3. **Customize Appearance**:
   - Adjust pen color using the color picker
   - Modify font size with the slider
   - Toggle paper lines and margins
4. **Preview**: Watch your handwriting appear in real-time on the right panel

### Multi-Page Documents
1. **Add Pages**: Click "Add Page" to create additional pages
2. **Navigate**: Use the page navigation controls or click page indicators
3. **Manage Content**: Each page maintains independent text and settings
4. **Delete Pages**: Remove unwanted pages (minimum 1 page required)

### Exporting Your Work
1. **Single Page**: Click "Download PNG" to save the current page
2. **Full Document**: Click "Generate PDF" to create a multi-page PDF
3. **File Naming**: Files are automatically named with timestamps

### Keyboard Navigation
Use the keyboard shortcuts listed above for efficient workflow management.

### Key Files Description

- **`index.html`**: Contains the complete HTML structure including semantic markup, accessibility features, and meta tags for SEO
- **`styles.css`**: Comprehensive CSS with custom properties, responsive design, dark mode support, and smooth animations
- **`script.js`**: Full JavaScript implementation including:
  - Canvas rendering engine
  - Page management system
  - PDF generation logic
  - Theme management
  - Event handling and keyboard shortcuts
  - Comprehensive testing suite

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started
1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes** following our coding standards
5. **Test thoroughly** using the built-in test suite
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to your branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request** with a clear description

### Coding Standards
- **HTML**: Use semantic elements and maintain accessibility
- **CSS**: Follow BEM methodology and use CSS custom properties
- **JavaScript**: Use ES6+ features, maintain consistent formatting
- **Comments**: Document complex logic and functions
- **Testing**: Ensure all functionality tests pass

### Areas for Contribution
- 🎨 Additional handwriting fonts and styles
- 🌍 Internationalization and localization
- 📱 Progressive Web App (PWA) features
- 🔧 Performance optimizations
- 🐛 Bug fixes and improvements
- 📚 Documentation enhancements

### Reporting Issues
- Use the GitHub issue tracker
- Provide detailed reproduction steps
- Include browser and OS information
- Add screenshots when applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nikhil Yadav**
- GitHub: [@yadavnikhil03](https://github.com/yadavnikhil03)

## 🙏 Acknowledgments

### Libraries and Resources
- **[jsPDF](https://github.com/parallax/jsPDF)** - Client-side PDF generation
- **[Google Fonts](https://fonts.google.com)** - Beautiful web fonts
- **[MDN Web Docs](https://developer.mozilla.org)** - Comprehensive web development documentation

### Community
- Thanks to the open-source community for inspiration and resources

## 📸 Screenshots

### Light Mode
![Light Mode Interface](https://via.placeholder.com/800x600/ffffff/333333?text=Light+Mode+Interface)

### Dark Mode
![Dark Mode Interface](https://via.placeholder.com/800x600/1e293b/ffffff?text=Dark+Mode+Interface)

### Multi-Page Management
![Multi-Page Management](https://via.placeholder.com/800x400/f8fafc/333333?text=Multi-Page+Management)

## 🌐 Live Demo

Experience the application live: [Text-to-Handwriting Converter](https://yadavnikhil03.github.io/text-to-handwriting)

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/yadavnikhil03/text-to-handwriting?style=social)
![GitHub forks](https://img.shields.io/github/forks/yadavnikhil03/text-to-handwriting?style=social)
![GitHub issues](https://img.shields.io/github/issues/yadavnikhil03/text-to-handwriting)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yadavnikhil03/text-to-handwriting)

---

<div align="center">

**Made with ❤️ by [Nikhil Yadav](https://github.com/yadavnikhil03)**

⭐ Star this repository if you found it helpful!

</div>
