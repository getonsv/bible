    let projectionWindow = null;
    let currentSearchResults = [];
    let currentIndex = 0;
    let bibleData = {};
    let pinnedVerses = JSON.parse(localStorage.getItem('pinnedVerses')) || {};
    let verseNotes = JSON.parse(localStorage.getItem('verseNotes')) || {};
  
    function openProjection() {
    if (!projectionWindow || projectionWindow.closed) {
      projectionWindow = window.open("bible/projection", "Projection", "width=800,height=600");
    } else {
      projectionWindow.focus();
    }
    // Hide the open projection button now that the projection is open.
    document.getElementById("openProjectionBtn").style.display = "none";
    document.getElementById("miniProjection").style.display = "block";
    document.getElementById("prevProjection").style.display = "inline-block";
    document.getElementById("nextProjection").style.display = "inline-block";
    updateProjectionScreenForCurrent();
  }
  
    function updateProjectionScreenForCurrent() {
      if (currentSearchResults.length === 0) return;
      const verse = currentSearchResults[currentIndex];
  
      // Look for an existing container in #verseDisplay
      let verseElem = document.querySelector(
        `#verseDisplay [data-verse="${verse.book}-${verse.chapter}-${verse.verse}"]`
      );
  
      // Use the container's HTML if found; otherwise, build a new one
      let verseHtml = verseElem ? verseElem.outerHTML : buildVerseHTML(verse);
  
      // Send the HTML to the projection window if it's open
      if (projectionWindow && !projectionWindow.closed) {
        projectionWindow.postMessage(verseHtml, "*");
      }
  
      // Also update the miniProjection element
      document.getElementById("miniProjection").innerHTML = verseHtml;
    }
  
    function nextProjection() {
      if (currentSearchResults.length === 0) return;
      if (currentIndex < currentSearchResults.length - 1) {
        currentIndex++;
        updateProjectionScreenForCurrent();
      } else {
        let fullBible = flattenBible();
        const currentVerse = currentSearchResults[currentIndex];
        const fullIndex = fullBible.findIndex(item =>
          item.book.toLowerCase() === currentVerse.book.toLowerCase() &&
          item.chapter === currentVerse.chapter &&
          item.verse === currentVerse.verse
        );
        if (fullIndex === -1 || fullIndex === fullBible.length - 1) {
          alert("This is the last verse in the Bible.");
          return;
        }
        const nextVerse = fullBible[fullIndex + 1];
        currentSearchResults.push(nextVerse);
        currentIndex++;
        updateProjectionScreenForCurrent();
      }
    }
  
    function previousProjection() {
      if (currentSearchResults.length === 0) return;
      if (currentIndex > 0) {
        currentIndex--;
        updateProjectionScreenForCurrent();
      } else {
        let fullBible = flattenBible();
        const currentVerse = currentSearchResults[currentIndex];
        const fullIndex = fullBible.findIndex(item =>
          item.book.toLowerCase() === currentVerse.book.toLowerCase() &&
          item.chapter === currentVerse.chapter &&
          item.verse === currentVerse.verse
        );
        if (fullIndex === -1 || fullIndex === 0) {
          alert("This is the first verse in the Bible.");
          return;
        }
        const previousVerse = fullBible[fullIndex - 1];
        currentSearchResults.unshift(previousVerse);
        updateProjectionScreenForCurrent();
      }
    }
  
    const xmlUrl = "https://cdn.jsdelivr.net/gh/getonsv/bible@refs/heads/main/NIV84.xml";
  
    function parseXML(xmlString) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      bibleData = {};
      const bookNumbers = {};
      const tables = xmlDoc.getElementsByTagName("Table");
      for (let table of tables) {
        if (table.getAttribute("name") === "books") {
          const rows = table.getElementsByTagName("Row");
          for (let row of rows) {
            const longNameEl = row.getElementsByTagName("long_name")[0];
            const bookNumberEl = row.getElementsByTagName("book_number")[0];
            if (longNameEl && bookNumberEl) {
              const bookName = longNameEl.textContent.trim();
              const bookNum = bookNumberEl.textContent.trim();
              bibleData[bookName] = {};
              bookNumbers[bookNum] = bookName;
            }
          }
        }
      }
      for (let table of tables) {
        if (table.getAttribute("name") === "verses") {
          const rows = table.getElementsByTagName("Row");
          for (let row of rows) {
            const bookNumberEl = row.getElementsByTagName("book_number")[0];
            const chapterEl = row.getElementsByTagName("chapter")[0];
            const verseEl = row.getElementsByTagName("verse")[0];
            const textEl = row.getElementsByTagName("text")[0];
            if (bookNumberEl && chapterEl && verseEl && textEl) {
              const bookNum = bookNumberEl.textContent.trim();
              const chapter = chapterEl.textContent.trim();
              const verse = verseEl.textContent.trim();
              const text = textEl.textContent.trim();
              const bookName = bookNumbers[bookNum];
              if (bookName) {
                if (!bibleData[bookName][chapter]) {
                  bibleData[bookName][chapter] = {};
                }
                bibleData[bookName][chapter][verse] = text;
              }
            }
          }
        }
      }
      console.log("Parsed bibleData:", bibleData);
      document.getElementById("rangeSearchInput").value = "John 1:1-18";
      searchQuery();
      updatePinnedVersesDisplay();
    }
  
    document.addEventListener("DOMContentLoaded", function () {
      fetch(xmlUrl)
        .then(response => response.text())
        .then(xmlString => { parseXML(xmlString); })
        .catch(error => { console.error("Error fetching XML:", error); });
    });
  
    function getFullBookName(abbr) {
      abbr = abbr.toLowerCase().trim();
      const books = Object.keys(bibleData);
      const matches = books.filter(book => book.toLowerCase().startsWith(abbr));
      if (matches.length >= 1) { return matches[0]; }
      return abbr;
    }
  
    function flattenBible() {
      let flat = [];
      Object.keys(bibleData).forEach(book => {
        Object.keys(bibleData[book])
          .sort((a, b) => parseInt(a) - parseInt(b))
          .forEach(chapter => {
            Object.keys(bibleData[book][chapter])
              .sort((a, b) => parseInt(a) - parseInt(b))
              .forEach(verse => {
                flat.push({ book, chapter, verse, text: bibleData[book][chapter][verse] });
              });
          });
      });
      console.log("Flattened Bible:", flat);
      return flat;
    }
  
    function searchQuery() {
      const input = document.getElementById("rangeSearchInput").value.trim();
      const displayDiv = document.getElementById("verseDisplay");
      let content = "";
      currentSearchResults = [];
      currentIndex = 0;
      let flatBible;
  
      // Show highlight toolbar only for range search results
      document.getElementById("highlightToolbar").style.display = "flex";
  
      // Handle multiple verse/chapter references (commas or "and")
      if (/[,]|(?:\band\b)/i.test(input)) {
        let tokens = input.split(/,|\band\b/i);
        let verses = [];
        let baseBook = null;
        let baseChapter = null;
  
        tokens.forEach(token => {
          token = token.trim();
          if (!token) return;
          // Full reference e.g., "John 1:1"
          let fullMatch = token.match(/^([\w\s]+)\s+(\d+):(\d+)$/);
          if (fullMatch) {
            baseBook = getFullBookName(fullMatch[1]);
            baseChapter = fullMatch[2];
            if (bibleData[baseBook] && bibleData[baseBook][baseChapter] && bibleData[baseBook][baseChapter][fullMatch[3]]) {
              verses.push({ 
                book: baseBook, 
                chapter: baseChapter, 
                verse: fullMatch[3], 
                text: bibleData[baseBook][baseChapter][fullMatch[3]] 
              });
            } else {
              content += `<p>No verse found for ${baseBook} ${baseChapter}:${fullMatch[3]}</p>`;
            }
            return;
          }
          // Chapter and verse reference e.g., "3:4" – if baseBook exists
          let chapVerseMatch = token.match(/^(\d+):(\d+)$/);
          if (chapVerseMatch && baseBook) {
            baseChapter = chapVerseMatch[1];
            if (bibleData[baseBook] && bibleData[baseBook][baseChapter] && bibleData[baseBook][baseChapter][chapVerseMatch[2]]) {
              verses.push({ 
                book: baseBook, 
                chapter: baseChapter, 
                verse: chapVerseMatch[2], 
                text: bibleData[baseBook][baseChapter][chapVerseMatch[2]] 
              });
            } else {
              content += `<p>No verse found for ${baseBook} ${chapVerseMatch[1]}:${chapVerseMatch[2]}</p>`;
            }
            return;
          }
          // Verse-only reference e.g., "3" – if baseBook and baseChapter are set
          let verseOnlyMatch = token.match(/^(\d+)$/);
          if (verseOnlyMatch && baseBook && baseChapter) {
            if (bibleData[baseBook] && bibleData[baseBook][baseChapter] && bibleData[baseBook][baseChapter][verseOnlyMatch[1]]) {
              verses.push({ 
                book: baseBook, 
                chapter: baseChapter, 
                verse: verseOnlyMatch[1], 
                text: bibleData[baseBook][baseChapter][verseOnlyMatch[1]] 
              });
            } else {
              content += `<p>No verse found for ${baseBook} ${baseChapter}:${verseOnlyMatch[1]}</p>`;
            }
            return;
          }
          // Chapter-only reference e.g., "Genesis 1" or "John 1"
          let chapterOnlyMatch = token.match(/^([\w\s]+)\s+(\d+)$/);
          if (chapterOnlyMatch) {
            let book = getFullBookName(chapterOnlyMatch[1]);
            let chapter = chapterOnlyMatch[2];
            if (bibleData[book] && bibleData[book][chapter]) {
              Object.keys(bibleData[book][chapter]).sort((a, b) => parseInt(a) - parseInt(b)).forEach(verse => {
                verses.push({ 
                  book: book, 
                  chapter: chapter, 
                  verse: verse, 
                  text: bibleData[book][chapter][verse] 
                });
              });
              baseBook = book;
              baseChapter = chapter;
            } else {
              content += `<p>No chapter found for ${book} ${chapter}</p>`;
            }
            return;
          }
        });
  
        if (verses.length > 0) {
          content += "<h3>Multiple Verse/Chapter Result:</h3>";
          verses.forEach(verseObj => {
            content += renderVerse(verseObj);
            currentSearchResults.push(verseObj);
          });
        } else {
          content += "<p>No valid verses found in the input.</p>";
        }
  
        displayDiv.innerHTML = content;
        if (projectionWindow && !projectionWindow.closed) {
          updateProjectionScreenForCurrent();
        }
        return;
      }
  
      // Handle other patterns
      const sameBookRangePattern = /^\s*([\w\s]+)\s+(\d+):(\d+)\s*-\s*(\d+)\s*$/;
      const fullRangePattern = /^\s*([\w\s]+)\s+(\d+):(\d+)\s*-\s*(\d+):(\d+)\s*$/;
      const bookRangePattern = /^\s*([\w\s]+)\s+(\d+)\s*-\s*([\w\s]+)\s+(\d+)\s*$/;
      const versePattern = /^\s*([\w\s]+)\s+(\d+):(\d+)\s*$/;
      const chapterPattern = /^\s*([\w\s]+)\s+(\d+)\s*$/;
      const bookPattern = /^\s*([\w\s]+)\s*$/;
  
      if (sameBookRangePattern.test(input)) {
        const matches = input.match(sameBookRangePattern);
        let book = getFullBookName(matches[1]);
        let chapter = matches[2];
        let fromVerse = matches[3];
        let toVerse = matches[4];
        flatBible = flattenBible();
        const startIndex = flatBible.findIndex(item =>
          item.book.toLowerCase() === book.toLowerCase() &&
          item.chapter === chapter &&
          item.verse === fromVerse
        );
        const endIndex = flatBible.findIndex(item =>
          item.book.toLowerCase() === book.toLowerCase() &&
          item.chapter === chapter &&
          item.verse === toVerse
        );
        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
          displayDiv.innerHTML = "<p>Invalid same-book range. Ensure the 'from' reference comes before the 'to' reference.</p>";
          return;
        }
        let prevBook = "", prevChapter = "";
        content += "<h3></h3>";
        for (let i = startIndex; i <= endIndex; i++) {
          const verseObj = flatBible[i];
          if (verseObj.book !== prevBook || verseObj.chapter !== prevChapter) {
            if (prevBook !== "") { content += "<br><br>"; }
            content += `<h3>${verseObj.book} ${verseObj.chapter}</h3>`;
            prevBook = verseObj.book;
            prevChapter = verseObj.chapter;
          }
          content += renderVerse(verseObj);
          currentSearchResults.push(verseObj);
        }
      } else if (fullRangePattern.test(input)) {
        const matches = input.match(fullRangePattern);
        let fromBook = getFullBookName(matches[1]);
        let fromChapter = matches[2];
        let fromVerse = matches[3];
        let toChapter = matches[4];
        let toVerse = matches[5];
        flatBible = flattenBible();
        const startIndex = flatBible.findIndex(item =>
          item.book.toLowerCase() === fromBook.toLowerCase() &&
          item.chapter === fromChapter &&
          item.verse === fromVerse
        );
        const endIndex = flatBible.findIndex(item =>
          item.book.toLowerCase() === fromBook.toLowerCase() &&
          item.chapter === toChapter &&
          item.verse === toVerse
        );
        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
          displayDiv.innerHTML = "<p>Invalid range selected. Ensure the 'from' reference comes before the 'to' reference.</p>";
          return;
        }
        let prevBook = "", prevChapter = "";
        content += "<h3></h3>";
        for (let i = startIndex; i <= endIndex; i++) {
          const verseObj = flatBible[i];
          if (verseObj.book !== prevBook || verseObj.chapter !== prevChapter) {
            if (prevBook !== "") { content += "<br><br>"; }
            content += `<h3>${verseObj.book} ${verseObj.chapter}</h3>`;
            prevBook = verseObj.book;
            prevChapter = verseObj.chapter;
          }
          content += renderVerse(verseObj);
          currentSearchResults.push(verseObj);
        }
      } else if (bookRangePattern.test(input)) {
        const matches = input.match(bookRangePattern);
        let fromBook = getFullBookName(matches[1]);
        let fromChapter = matches[2];
        let toBook = getFullBookName(matches[3]);
        let toChapter = matches[4];
        flatBible = flattenBible();
        const startIndex = flatBible.findIndex(item =>
          item.book.toLowerCase() === fromBook.toLowerCase() &&
          item.chapter === fromChapter
        );
        let endIndex = -1;
        for (let i = flatBible.length - 1; i >= 0; i--) {
          if (flatBible[i].book.toLowerCase() === toBook.toLowerCase() &&
              flatBible[i].chapter === toChapter) {
            endIndex = i;
            break;
          }
        }
        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
          displayDiv.innerHTML = "<p>Invalid range across books. Ensure the 'from' reference comes before the 'to' reference.</p>";
          return;
        }
        let prevBook = "", prevChapter = "";
        content += "<h3></h3>";
        for (let i = startIndex; i <= endIndex; i++) {
          const verseObj = flatBible[i];
          if (verseObj.book !== prevBook || verseObj.chapter !== prevChapter) {
            if (prevBook !== "") { content += "<br><br>"; }
            content += `<h3>${verseObj.book} ${verseObj.chapter}</h3>`;
            prevBook = verseObj.book;
            prevChapter = verseObj.chapter;
          }
          content += renderVerse(verseObj);
          currentSearchResults.push(verseObj);
        }
      } else if (versePattern.test(input)) {
        const matches = input.match(versePattern);
        let book = getFullBookName(matches[1]);
        let chapter = matches[2];
        let verse = matches[3];
        if (bibleData[book] && bibleData[book][chapter] && bibleData[book][chapter][verse]) {
          const verseObj = { book, chapter, verse, text: bibleData[book][chapter][verse] };
          content += `<h3>${book} ${chapter}:${verse}</h3>`;
          content += renderVerse(verseObj);
          currentSearchResults.push(verseObj);
        } else {
          content += `<p>No verse found for ${book} ${chapter}:${verse}</p>`;
        }
      } else if (chapterPattern.test(input)) {
        const matches = input.match(chapterPattern);
        let book = getFullBookName(matches[1]);
        let chapter = matches[2];
        if (bibleData[book] && bibleData[book][chapter]) {
          content += `<h3>${book} ${chapter}</h3>`;
          Object.keys(bibleData[book][chapter])
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach(verse => {
              const verseObj = { book, chapter, verse, text: bibleData[book][chapter][verse] };
              content += renderVerse(verseObj);
              currentSearchResults.push(verseObj);
            });
        } else {
          content += `<p>No chapter found for ${book} ${chapter}</p>`;
        }
      } else if (bookPattern.test(input)) {
        const matches = input.match(bookPattern);
        let book = getFullBookName(matches[1]);
        if (bibleData[book]) {
          let prevBook = "";
          content += `<h3>${book}</h3>`;
          Object.keys(bibleData[book])
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach(chapter => {
              content += `<br><h3>${book} ${chapter}</h3>`;
              Object.keys(bibleData[book][chapter])
                .sort((a, b) => parseInt(a) - parseInt(b))
                .forEach(verse => {
                  const verseObj = { book, chapter, verse, text: bibleData[book][chapter][verse] };
                  content += renderVerse(verseObj);
                  currentSearchResults.push(verseObj);
                });
            });
        } else {
          content += `<p>No book found for ${book}. Retry your search using the first 3 alphabets or the full book name.</p>`;
        }
      } else {
        content = "<p>Invalid format. Use 'Genesis 1:1-2', 'Genesis 1:1-2:2', 'Genesis 1:1', 'Genesis 1', or 'Genesis'.</p>";
      }
  
      displayDiv.innerHTML = content;
      if (projectionWindow && !projectionWindow.closed) {
        updateProjectionScreenForCurrent();
      }
  
      // Helper: Render a verse for search results with clickable functionality.
      function renderVerse(verseObj) {
        const verseKey = `${verseObj.book}-${verseObj.chapter}-${verseObj.verse}`;
        const isPinned = pinnedVerses[verseKey];
        const hasNote = verseNotes[verseKey];
        const noteHtml = hasNote ? `<div class="note-text">${verseNotes[verseKey]}</div>` : "";
        return `
          <div class="verse-container ${isPinned ? "pinned" : ""}" data-verse="${verseKey}" onclick="openVerseInQuery('${verseObj.book}', '${verseObj.chapter}', '${verseObj.verse}')">
            <div class="verse-header">
              <div class="verse-badge">
                ${verseObj.book} ${verseObj.chapter}:${verseObj.verse}
                ${hasNote ? '📝' : ''}
              </div>
              <div class="action-buttons">
                <button onclick="pinVerse('${verseObj.book}', '${verseObj.chapter}', '${verseObj.verse}', this); event.stopPropagation();">📌</button>
                <button onclick="addNoteToVerse('${verseObj.book}', '${verseObj.chapter}', '${verseObj.verse}', this); event.stopPropagation();">📝</button>
                <button onclick="shareVerseImage('${verseObj.book}', '${verseObj.chapter}', '${verseObj.verse}', this); event.stopPropagation();">📤</button>
              </div>
            </div>
            <div class="verse-content">
              <div class="verse-text">${verseObj.text}</div>
              ${noteHtml}
            </div>
          </div>
        `;
      }
    }
  
    // Modified openVerseInQuery: simply update the projection screen without changing the search results.
    function openVerseInQuery(book, chapter, verse) {
      // Check if the verse is already in currentSearchResults.
      const index = currentSearchResults.findIndex(v =>
        v.book === book && v.chapter === chapter && v.verse === verse
      );
      if (index !== -1) {
        currentIndex = index;
        updateProjectionScreenForCurrent();
      } else {
        // If not found, create the verse object from bibleData.
        if (bibleData[book] && bibleData[book][chapter] && bibleData[book][chapter][verse]) {
          const verseObj = {
            book: book,
            chapter: chapter,
            verse: verse,
            text: bibleData[book][chapter][verse]
          };
          // Add it to the current results so navigation can work.
          currentSearchResults.push(verseObj);
          currentIndex = currentSearchResults.length - 1;
          updateProjectionScreenForCurrent();
        } else {
          alert("Verse not found.");
        }
      }
    }


    function openBook(book) {
      document.getElementById("rangeSearchInput").value = book;
      searchQuery();
    }
  
    function openVerse(book, chapter, verse) {
      document.getElementById("rangeSearchInput").value = `${book} ${chapter}:${verse}`;
      searchQuery();
    }
  
    function searchBible() {
      const query = document.getElementById("searchInput").value.trim().toLowerCase();
      const resultsDiv = document.getElementById("searchResults");
      resultsDiv.innerHTML = "";
      document.getElementById("highlightToolbar").style.display = "none";
      if (!query) {
        resultsDiv.innerHTML = "<p>Please enter a valid search.</p>";
        return;
      }
  
      let oldResultsHTML = [];
      let newResultsHTML = [];
      let keywordResults = [];
      let bookCount = {};
  
      for (let book in bibleData) {
        for (let chapter in bibleData[book]) {
          for (let verse in bibleData[book][chapter]) {
            if (bibleData[book][chapter][verse].toLowerCase().includes(query)) {
              const verseObj = { book, chapter, verse, text: bibleData[book][chapter][verse] };
              keywordResults.push(verseObj);
  
              let resultHTML = `
                <div class="verse-container" style="cursor:pointer" onclick="openVerseInQuery('${book}', '${chapter}', '${verse}')">
                  <div class="verse-text">${verseObj.text}</div>
                  <div class="searchBible-badge"><strong>${book} ${chapter}:${verse}</strong></div>
                </div>
              `;
              if (["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"].includes(book)) {
                oldResultsHTML.push(resultHTML);
              } else {
                newResultsHTML.push(resultHTML);
              }
              bookCount[book] = (bookCount[book] || 0) + 1;
            }
          }
        }
      }
  
      let bookTags = Object.entries(bookCount)
      .map(([bk, count]) => `<span class="result-tag" style="cursor:pointer" onclick="filterResultsByBook('${bk}')">${bk}: ${count}</span>`)
      .join(" ");

  
      resultsDiv.innerHTML =
        (oldResultsHTML.length + newResultsHTML.length) > 0
          ? `<p>Searched Results: Total ${oldResultsHTML.length + newResultsHTML.length}</p>
             <div class="result-tags">${bookTags}</div>
             <br><h3>Old Testament: ${oldResultsHTML.length}</h3>${oldResultsHTML.join("")}
             <br><h3>New Testament: ${newResultsHTML.length}</h3>${newResultsHTML.join("")}`
          : "<p>No results found.</p>";
  
      currentSearchResults = keywordResults;
      currentIndex = 0;
      // Projection screen update is only triggered when a verse is clicked.
    }

    function filterResultsByBook(book) {
      // Filter the current search results by the selected book.
      let filteredResults = currentSearchResults.filter(r => r.book === book);

      // Build HTML for filtered results.
      let oldResultsHTML = [];
      let newResultsHTML = [];
      filteredResults.forEach(verseObj => {
        let resultHTML = `
          <div class="verse-container" style="cursor:pointer" onclick="openVerseInQuery('${verseObj.book}', '${verseObj.chapter}', '${verseObj.verse}')">
            <div class="verse-text">${verseObj.text}</div>
            <div class="searchBible-badge"><strong>${verseObj.book} ${verseObj.chapter}:${verseObj.verse}</strong></div>
          </div>
        `;
        // Adjust the array of books for Old Testament filtering if needed.
        if (["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"].includes(verseObj.book)) {
          oldResultsHTML.push(resultHTML);
        } else {
          newResultsHTML.push(resultHTML);
        }
      });

      // Update the book tags based on the filtered results.
      let bookCount = {};
      filteredResults.forEach(r => {
        bookCount[r.book] = (bookCount[r.book] || 0) + 1;
      });
      let bookTags = Object.entries(bookCount)
        .map(([bk, count]) => `<span class="result-tag" style="cursor:pointer" onclick="filterResultsByBook('${bk}')">${bk}: ${count}</span>`)
        .join(" ");

      let total = filteredResults.length;
      let html = `<p>Searched Results: Total ${total}</p>
                <div class="result-tags">${bookTags}</div>
                <br><h3>Old Testament: ${oldResultsHTML.length}</h3>${oldResultsHTML.join("")}
                <br><h3>New Testament: ${newResultsHTML.length}</h3>${newResultsHTML.join("")}`;
      document.getElementById("searchResults").innerHTML = html;
    }

  
    document.getElementById("searchInput").addEventListener("keypress", function (event) {
      if (event.key === "Enter") searchBible();
    });
  
    document.getElementById("rangeSearchInput").addEventListener("keypress", function (event) {
      if (event.key === "Enter") searchQuery();
    });

    setInterval(function() {
      if (projectionWindow && projectionWindow.closed) {
        document.getElementById("miniProjection").style.display = "none";
        document.getElementById("prevProjection").style.display = "none";
        document.getElementById("nextProjection").style.display = "none";
        projectionWindow = null;
        // Show the open projection button when the projection window is closed.
        document.getElementById("openProjectionBtn").style.display = "block";
      }
    }, 1000);

  
    // Highlight functions remain unchanged.
    function highlightSelection(color) {
      if (!currentSearchResults.length) return;
      const selection = window.getSelection();
      if (!selection.isCollapsed) {
        try {
          const range = selection.getRangeAt(0);
          const span = document.createElement('span');
          span.style.backgroundColor = color;
          span.className = "highlighted";
          range.surroundContents(span);
          selection.removeAllRanges();
          saveHighlights();
          updateProjectionScreenForCurrent();
        } catch (e) {
          alert("Unable to apply highlight. Please try selecting a smaller portion of text.");
        }
      }
    }
  
    function eraseHighlight() {
      const selection = window.getSelection();
      if (!selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        while (node && node !== document.body) {
          if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("highlighted")) {
            const parent = node.parentNode;
            parent.replaceChild(document.createTextNode(node.textContent), node);
            saveHighlights();
            updateProjectionScreenForCurrent();
            return;
          }
          node = node.parentNode;
        }
      }
    }
  
    function clearHighlights() {
      const displayDiv = document.getElementById("verseDisplay");
      const highlighted = displayDiv.querySelectorAll("span.highlighted");
      highlighted.forEach(span => {
        span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
      });
      localStorage.removeItem('highlights');
      updateProjectionScreenForCurrent();
    }
  
    function saveHighlights() {
      const displayDiv = document.getElementById("verseDisplay");
      const highlighted = displayDiv.querySelectorAll("span.highlighted");
      const highlights = [];
      highlighted.forEach(span => {
        highlights.push({
          text: span.textContent,
          color: span.style.backgroundColor
        });
      });
      localStorage.setItem('highlights', JSON.stringify(highlights));
    }
  
    function toggleHighlightToolbar(event) {
      event.stopPropagation();
      const toolbar = document.getElementById("highlightToolbar");
      if (toolbar.classList.contains("expanded")) {
         toolbar.classList.remove("expanded");
      } else {
         toolbar.classList.add("expanded");
      }
    }
  
    function collapseHighlightToolbar() {
      document.getElementById("highlightToolbar").classList.remove("expanded");
    }
  
    document.addEventListener("click", function(event){
      if (!event.target.closest("#highlightToolbar")) {
        collapseHighlightToolbar();
      }
    });
  
    window.onload = function() {
      const savedHighlights = JSON.parse(localStorage.getItem('highlights')) || [];
      const displayDiv = document.getElementById("verseDisplay");
      savedHighlights.forEach(highlight => {
        const span = document.createElement('span');
        span.className = "highlighted";
        span.style.backgroundColor = highlight.color;
        span.textContent = highlight.text;
        displayDiv.innerHTML = displayDiv.innerHTML.replace(highlight.text, span.outerHTML);
      });
    };
  
    // Pin verse function.
    function pinVerse(book, chapter, verse, btn) {
      const ref = `${book}-${chapter}-${verse}`;
      const container = btn.closest('.verse-container');
      if (pinnedVerses[ref]) {
        delete pinnedVerses[ref];
        container.classList.remove("pinned");
      } else {
        pinnedVerses[ref] = true;
        container.classList.add("pinned");
      }
      localStorage.setItem('pinnedVerses', JSON.stringify(pinnedVerses));
      updatePinnedVersesDisplay();
    }
  
    function buildVerseHTML(verseObj) {
      return `
        <div class="verse-container" data-verse="${verseObj.book}-${verseObj.chapter}-${verseObj.verse}">
          <div class="verse-header">
            <div class="verse-badge">${verseObj.book} ${verseObj.chapter}:${verseObj.verse}</div>
          </div>
          <div class="verse-content">
            <div class="verse-text">${verseObj.text}</div>
          </div>
        </div>
      `;
    }
  
    // Add note function.
    function addNoteToVerse(book, chapter, verse, btn) {
      const ref = `${book}-${chapter}-${verse}`;
      let note = prompt("Enter a note for this verse:", verseNotes[ref] || "");
      if (note !== null) {
        if (note.trim() === "") {
          delete verseNotes[ref];
        } else {
          verseNotes[ref] = note.trim();
        }
        localStorage.setItem('verseNotes', JSON.stringify(verseNotes));
        searchQuery();
      }
    }
  
    // Share verse as image.
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
            navigator.share({
              title: `${book} ${chapter}:${verse}`,
              text: "Sharing a Bible verse",
              files: [file]
            }).catch(console.error);
          } else {
            alert("Sharing is not supported on this device. You can manually save the image.");
          }
        }, 'image/png');
      });
    }
  
    // Update pinned verses display.
    function updatePinnedVersesDisplay() {
      const container = document.getElementById("pinnedVersesContainer");
      container.innerHTML = "";
      Object.keys(pinnedVerses).forEach(ref => {
        let parts = ref.split("-");
        let book = parts.slice(0, parts.length - 2).join(" ");
        let chapter = parts[parts.length - 2];
        let verse = parts[parts.length - 1];
        let badge = document.createElement("div");
        badge.className = "pinned-verse";
        let noteIcon = verseNotes[ref] ? " 📝" : "";
        badge.innerHTML = `<span class="verse-badge">${book} ${chapter}:${verse}${noteIcon}</span>`;
        badge.onclick = function() { openVerse(book, chapter, verse); };
        container.appendChild(badge);
      });
    }
  
    // Function to unpin all verses.
    function unpinAllVerses() {
      pinnedVerses = {};
      localStorage.setItem('pinnedVerses', JSON.stringify(pinnedVerses));
      updatePinnedVersesDisplay();
    }
  
    // Function to clear all notes from pinned verses (or all notes, if desired).
    function clearAllPinnedNotes() {
      for (let ref in pinnedVerses) {
        if (verseNotes.hasOwnProperty(ref)) {
          delete verseNotes[ref];
        }
      }
      localStorage.setItem('verseNotes', JSON.stringify(verseNotes));
      updatePinnedVersesDisplay();
    }
  
    function clearAllHighlights() {
      const displayDiv = document.getElementById("verseDisplay");
      const highlighted = displayDiv.querySelectorAll("span.highlighted");
      highlighted.forEach(span => {
        span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
      });
      localStorage.removeItem('highlights');
    }
    function generateRangeImage() {
      console.log("generateRangeImage called");
      if (!currentSearchResults || currentSearchResults.length === 0) {
        alert("No verses available to generate an image. Please run a search first.");
        return;
      }

      // 1) Helper function to remove <br> (or any HTML) from verse text.
      function sanitizeVerseText(text) {
        // Simple approach: replace any <br> or <br/> tag with a space
        return text.replace(/<br\s*\/?>/gi, " ");
      }

      // Group verses by book and chapter using currentSearchResults.
      let groups = {};
      currentSearchResults.forEach(v => {
        let key = v.book + " " + v.chapter;
        if (!groups[key]) {
          groups[key] = { book: v.book, chapter: v.chapter, verses: [] };
        }
        groups[key].verses.push({ verse: v.verse, text: v.text });
      });

      // Create a new container element to build the combined HTML.
      let container = document.createElement("div");
      container.style.padding = "30px";
      container.style.backgroundColor = "#f4ecda";
      container.style.border = "2px solid rgba(190,171,125,1)";
      container.style.borderRadius = "20px";
      container.style.fontSize = "16px";
      container.style.lineHeight = "1.5";
      container.style.color = "#333";
      container.style.maxWidth = "500px";

      // Append the container off-screen so html2canvas can capture it.
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      // Build HTML content for each group.
      let firstGroup = true;
      for (let key in groups) {
        let group = groups[key];

        if (!firstGroup) {
          container.appendChild(document.createElement("br"));
        }
        firstGroup = false;

        let header = document.createElement("h3");
        header.textContent = `${group.book} ${group.chapter}`;
        container.appendChild(header);

        // 2) Sanitize each verse text in the .map(...) call:
        group.verses.sort((a, b) => parseInt(a.verse) - parseInt(b.verse));
        let combinedText = group.verses
          .map(v => `${v.verse} ${sanitizeVerseText(v.text)}`)
          .join("  ");
          
        let p = document.createElement("p");
        p.textContent = combinedText;
        container.appendChild(p);
      }

      console.log("Container built. Capturing image...");

      // Use html2canvas to capture the container.
      html2canvas(container, { backgroundColor: null }).then(canvas => {
        // Remove the temporary container after capturing.
        document.body.removeChild(container);

        canvas.toBlob(blob => {
          const file = new File([blob], "BibleVerses.png", { type: "image/png" });
          console.log("Image file created. Attempting to share...");

          // Use Web Share API if available.
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              title: "Bible Verses",
              text: "Sharing Bible verses",
              files: [file]
            }).catch(err => {
              console.error("Error sharing:", err);
              alert("Error sharing the image.");
            });
          } else {
            alert("Sharing is not supported on this device. The image will be downloaded instead.");
            const link = document.createElement("a");
            link.href = URL.createObjectURL(file);
            link.download = "BibleVerses.png";
            link.click();
            URL.revokeObjectURL(link.href);
          }
        }, 'image/png');
      }).catch(error => {
        console.error("Error generating image:", error);
        alert("An error occurred while generating the image.");
        // Clean up by removing the container if needed.
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      });
    }