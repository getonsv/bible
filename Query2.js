// Bible Projection and Search App JavaScript
let projectionWindow = null;
let currentSearchResults = [];
let currentIndex = 0;
let bibleData = {};
let pinnedVerses = JSON.parse(localStorage.getItem('pinnedVerses')) || {};
let verseNotes = JSON.parse(localStorage.getItem('verseNotes')) || {};

// Open projection window
function openProjection() {
  if (!projectionWindow || projectionWindow.closed) {
    projectionWindow = window.open("bible/projection", "Projection", "width=800,height=600");
  } else {
    projectionWindow.focus();
  }
  document.getElementById("openProjectionBtn").style.display = "none";
  document.getElementById("miniProjection").style.display = "block";
  document.getElementById("prevProjection").style.display = "inline-block";
  document.getElementById("nextProjection").style.display = "inline-block";
  updateProjectionScreenForCurrent();
}

// Update projection and mini view
function updateProjectionScreenForCurrent() {
  if (currentSearchResults.length === 0) return;
  const verse = currentSearchResults[currentIndex];
  let verseElem = document.querySelector(
    `#verseDisplay [data-verse="${verse.book}-${verse.chapter}-${verse.verse}"]`
  );
  let verseHtml = verseElem ? verseElem.outerHTML : buildVerseHTML(verse);
  if (projectionWindow && !projectionWindow.closed) {
    projectionWindow.postMessage(verseHtml, "*");
  }
  document.getElementById("miniProjection").innerHTML = verseHtml;
}

// Navigation
function nextProjection() { /* ... unchanged ... */ }
function previousProjection() { /* ... unchanged ... */ }

// XML fetching and parsing
const xmlUrl = "https://cdn.jsdelivr.net/gh/getonsv/bible@refs/heads/main/NIV84.xml";
function parseXML(xmlString) { /* ... unchanged ... */ }

document.addEventListener("DOMContentLoaded", function () {
  fetch(xmlUrl)
    .then(response => response.text())
    .then(xmlString => parseXML(xmlString))
    .catch(error => console.error("Error fetching XML:", error));
});

// Helpers: book name resolution, flatten Bible data
function getFullBookName(abbr) { /* ... unchanged ... */ }
function flattenBible() { /* ... unchanged ... */ }

// Search queries and rendering
function searchQuery() { /* ... unchanged ... */ }
function renderVerse(verseObj) { /* ... unchanged ... */ }
function openVerseInQuery(book, chapter, verse) { /* ... unchanged ... */ }
function openBook(book) { /* ... unchanged ... */ }
function openVerse(book, chapter, verse) { /* ... unchanged ... */ }
function searchBible() { /* ... unchanged ... */ }
function filterResultsByBook(book) { /* ... unchanged ... */ }

// Event listeners for inputs
// ... unchanged keypress handlers ...

// Projection window close detection
setInterval(function() { /* ... unchanged ... */ }, 1000);

// Highlight functions
function highlightSelection(color) { /* ... unchanged ... */ }
function eraseHighlight() { /* ... unchanged ... */ }
function clearHighlights() { /* ... unchanged ... */ }
function saveHighlights() { /* ... unchanged ... */ }
function toggleHighlightToolbar(event) { /* ... unchanged ... */ }
function collapseHighlightToolbar() { /* ... unchanged ... */ }
document.addEventListener("click", function(event){ /* ... unchanged ... */ });
window.onload = function() { /* ... unchanged ... */ };

// Pinning and notes
function pinVerse(book, chapter, verse, btn) { /* ... unchanged ... */ }
function buildVerseHTML(verseObj) { /* ... unchanged ... */ }
function addNoteToVerse(book, chapter, verse, btn) { /* ... unchanged ... */ }

// --- Updated: Share verse as image with story dimensions ---
function shareVerseImage(book, chapter, verse, btn) {
  const verseKey = `${book}-${chapter}-${verse}`;
  const verseContainer = document.querySelector(`[data-verse="${verseKey}"]`);
  const actionButtons = verseContainer.querySelector(".action-buttons");
  if (actionButtons) actionButtons.style.display = "none";
  html2canvas(verseContainer, { backgroundColor: null }).then(canvas => {
    if (actionButtons) actionButtons.style.display = "";
    canvas.toBlob(blob => {
      const file = new File([blob], `${book}-${chapter}-${verse}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ title: `${book} ${chapter}:${verse}`, text: "Sharing a Bible verse", files: [file] }).catch(console.error);
      } else {
        alert("Sharing is not supported on this device. You can manually save the image.");
      }
    }, 'image/png');
  });
}

// --- Updated: generateRangeImage for 1080x1920px output ---
function generateRangeImage() {
  if (!currentSearchResults.length) {
    alert("No verses available to generate an image. Please run a search first.");
    return;
  }
  if (typeof html2canvas !== "function") {
    alert("Error: html2canvas not found. Did you include it?");
    return;
  }
  // Group verses by book+chapter
  let groups = {};
  currentSearchResults.forEach(v => {
    let key = `${v.book} ${v.chapter}`;
    if (!groups[key]) groups[key] = { book: v.book, chapter: v.chapter, verses: [] };
    groups[key].verses.push({ verse: v.verse, text: v.text });
  });
  // Build off-screen container at story size
  let container = document.createElement("div");
  Object.assign(container.style, {
    width:        "1080px",
    height:       "1920px",
    padding:      "30px",
    backgroundColor: "#f4ecda",
    border:       "2px solid rgba(190,171,125,1)",
    borderRadius: "20px",
    fontSize:     "16px",
    lineHeight:   "1.5",
    color:        "#333",
    position:     "absolute",
    left:         "-9999px",
    top:          "0",
    overflowY:    "auto"
  });
  document.body.appendChild(container);

  // Populate content
  let firstGroup = true;
  for (let key in groups) {
    if (!firstGroup) container.appendChild(document.createElement("br"));
    firstGroup = false;
    let h3 = document.createElement("h3");
    h3.textContent = `${groups[key].book} ${groups[key].chapter}`;
    container.appendChild(h3);
    let verses = groups[key].verses.sort((a,b) => parseInt(a.verse) - parseInt(b.verse));
    let p = document.createElement("p");
    p.innerHTML = verses.map(v => `${v.verse} ${v.text}`).join("<br/>");
    container.appendChild(p);
  }

  // Capture at exact 1080x1920px
  html2canvas(container, {
    backgroundColor: null,
    width:           1080,
    height:          1920,
    scale:           1,
    windowWidth:     1080,
    windowHeight:    1920
  }).then(canvas => {
    document.body.removeChild(container);
    canvas.toBlob(blob => {
      const file = new File([blob], "BibleVerses_Story.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ title: "Bible Verses", files: [file] }).catch(console.error);
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = "BibleVerses_Story.png";
        link.click();
        URL.revokeObjectURL(link.href);
      }
    }, "image/png");
  }).catch(err => {
    console.error("html2canvas error:", err);
    alert("An error occurred generating the image.");
    if (document.body.contains(container)) document.body.removeChild(container);
  });
}
