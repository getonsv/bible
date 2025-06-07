// --- All JS from earlier, with generateRangeImage updated ---
  let projectionWindow = null;
  let currentSearchResults = [];
  let currentIndex = 0;
  let bibleData = {};
  let pinnedVerses = JSON.parse(localStorage.getItem('pinnedVerses')) || {};
  let verseNotes = JSON.parse(localStorage.getItem('verseNotes')) || {};

  document.getElementById('searchBtn').addEventListener('click', searchQuery);
  document.getElementById('openProjectionBtn').addEventListener('click', openProjection);
  document.getElementById('prevProjection').addEventListener('click', previousProjection);
  document.getElementById('nextProjection').addEventListener('click', nextProjection);
  document.getElementById('generateImageBtn').addEventListener('click', generateRangeImage);

  const xmlUrl = "https://cdn.jsdelivr.net/gh/getonsv/bible@refs/heads/main/NIV84.xml";

  document.addEventListener("DOMContentLoaded", () => {
    fetch(xmlUrl)
      .then(r => r.text())
      .then(parseXML)
      .catch(e => console.error(e));
  });

  function parseXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    bibleData = {}; let bookNumbers = {};

    for (let table of xmlDoc.getElementsByTagName("Table")) {
      if (table.getAttribute("name")==="books") {
        for (let row of table.getElementsByTagName("Row")) {
          let longName = row.querySelector("long_name")?.textContent.trim();
          let num      = row.querySelector("book_number")?.textContent.trim();
          if (longName && num) { bibleData[longName]={}; bookNumbers[num]=longName; }
        }
      }
    }
    for (let table of xmlDoc.getElementsByTagName("Table")) {
      if (table.getAttribute("name")==="verses") {
        for (let row of table.getElementsByTagName("Row")) {
          let bn = row.querySelector("book_number")?.textContent.trim();
          let ch = row.querySelector("chapter")?.textContent.trim();
          let vs = row.querySelector("verse")?.textContent.trim();
          let txNode = row.querySelector("text");
          if (!bn||!ch||!vs||!txNode) continue;
          let txt = Array.from(txNode.childNodes).map(n=>n.nodeType===3?n.nodeValue:(n.nodeName==='br'?'<br/>':'' )).join('').trim();
          let bName = bookNumbers[bn];
          bibleData[bName][ch] = bibleData[bName][ch]||{};
          bibleData[bName][ch][vs] = txt;
        }
      }
    }
    document.getElementById('rangeSearchInput').value = "John 1:1-3";
    searchQuery();
  }

  function flattenBible(){
    let arr=[];
    for(let b of Object.keys(bibleData)) {
      for(let c of Object.keys(bibleData[b]).sort((a,b)=>a-b)) {
        for(let v of Object.keys(bibleData[b][c]).sort((a,b)=>a-b)) {
          arr.push({book:b,chapter:c,verse:v,text:bibleData[b][c][v]});
        }
      }
    }
    return arr;
  }

  function getFullBookName(abbr){
    abbr = abbr.toLowerCase();
    return Object.keys(bibleData).find(b=>b.toLowerCase().startsWith(abbr))||abbr;
  }

  function renderVerse(o){
    return `
      <div class="verse-container" data-verse="${o.book}-${o.chapter}-${o.verse}"
           onclick="openVerseInQuery('${o.book}','${o.chapter}','${o.verse}')">
        <strong>${o.book} ${o.chapter}:${o.verse}</strong><br>${o.text}
      </div>`;
  }

  function searchQuery(){
    let input = document.getElementById('rangeSearchInput').value.trim();
    let display = document.getElementById('verseDisplay');
    display.innerHTML = ''; currentSearchResults=[]; currentIndex=0;
    // only handle simple same-book-range A:B–C
    let m = input.match(/^(.+)\\s+(\\d+):(\\d+)-(\\d+)$/);
    if (!m) { display.innerHTML='<p>Use e.g. John 3:16-18</p>'; return; }
    let [_,bk,ch,from,to] = m;
    bk = getFullBookName(bk);
    let flat = flattenBible();
    let si = flat.findIndex(i=>i.book===bk&&i.chapter===ch&&i.verse===from);
    let ti = flat.findIndex(i=>i.book===bk&&i.chapter===ch&&i.verse===to);
    if (si<0||ti<0||si>ti) { display.innerHTML='<p>Invalid range</p>'; return; }
    for(let i=si;i<=ti;i++){
      display.innerHTML += renderVerse(flat[i]);
      currentSearchResults.push(flat[i]);
    }
    updateProjectionScreenForCurrent();
  }

  function openProjection(){
    if (!projectionWindow||projectionWindow.closed) {
      projectionWindow = window.open("", "Projection", "width=800,height=600");
      projectionWindow.document.write("<!DOCTYPE html><body id='proj'></body></html>");
    }
    document.getElementById('openProjectionBtn').style.display='none';
    document.getElementById('miniProjection').style.display='block';
    document.getElementById('prevProjection').style.display='inline-block';
    document.getElementById('nextProjection').style.display='inline-block';
    updateProjectionScreenForCurrent();
  }

  function updateProjectionScreenForCurrent(){
    if (!currentSearchResults.length) return;
    let v = currentSearchResults[currentIndex];
    let html = renderVerse(v);
    // mini
    document.getElementById('miniProjection').innerHTML = html;
    // full proj
    projectionWindow.document.getElementById('proj').innerHTML = html;
  }

  function nextProjection(){
    if (currentIndex < currentSearchResults.length-1) currentIndex++;
    updateProjectionScreenForCurrent();
  }
  function previousProjection(){
    if (currentIndex>0) currentIndex--;
    updateProjectionScreenForCurrent();
  }

  // --- 1080×1920 image export ---
  function generateRangeImage(){
    if (!currentSearchResults.length) { alert("Nothing to export"); return; }
    // group by book+chapter
    let groups = {};
    currentSearchResults.forEach(v=>{
      let key=`${v.book} ${v.chapter}`;
      groups[key]=groups[key]||{book:v.book,chapter:v.chapter,verses:[]};
      groups[key].verses.push(v);
    });
    let cont = document.createElement('div');
    Object.assign(cont.style,{
      width:'1080px',height:'1920px',
      padding:'30px',background:'#f4ecda',
      border:'2px solid #BEAB7D',borderRadius:'20px',
      fontSize:'18px',lineHeight:'1.4',color:'#333',
      position:'absolute',left:'-9999px',top:'0',overflowY:'auto'
    });
    document.body.appendChild(cont);
    let first=true;
    for(let key in groups){
      if(!first) cont.appendChild(document.createElement('br'));
      first=false;
      let h3=document.createElement('h3');
      h3.textContent=`${groups[key].book} ${groups[key].chapter}`;
      cont.appendChild(h3);
      let p=document.createElement('p');
      let html = groups[key].verses
        .sort((a,b)=>a.verse-b.verse)
        .map(v=>`${v.verse} ${v.text}`)
        .join('<br/>');
      p.innerHTML = html;
      cont.appendChild(p);
    }
    html2canvas(cont,{
      backgroundColor:null,
      width:1080,height:1920,scale:1,
      windowWidth:1080,windowHeight:1920
    }).then(canvas=>{
      document.body.removeChild(cont);
      canvas.toBlob(blob=>{
        let link=document.createElement('a');
        link.href=URL.createObjectURL(blob);
        link.download='verses_story.png';
        link.click();
      });
    }).catch(e=>{
      console.error(e);
      document.body.removeChild(cont);
    });
  }

  function openVerseInQuery(b,c,v){
    document.getElementById('rangeSearchInput').value=`${b} ${c}:${v}`;
    searchQuery();
  }
