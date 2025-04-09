There are 2 files on this version;
    1) Bible.html (this being the online version that requires an internet connection)
    2) Bible Offline.html (this being the offline version that does not require an internet connection)


To use Bible; 
    1) Launch "Bible.html" or "Bible Offline.html" on your web browser.
    2) Begin by searching a verse in any of the below format and click "Go";
        Example:
        - John 1
        - John 1:1,2:1
        - John 1:1 and 2:1
        - John 1, Genesis 1
        - John 1 and Genesis 1
        - John 1:1, Genesis 1:1
        - John 1:1 and Genesis 1:1
        - John 1:1, Genesis 1:1, Romans 1:1
        - John 1:1 and Genesis 1:1 and Romans 1:1
        - You are also able to search using first 3 alphabets of the book names (Example: Joh for John and Gen for Genesis).

    3) To combine verse and share as image; click on 📤 beside the "Go" button.
    4) To share image of respective verse, click on 📤 beside each verse.
    5) To open projection screen; click on 🖥️. (bear in mind that any verse selected will be visible on projection screen)
    6) To move to previous verse on projection screen; click on ◀.
    7) To move to next verse on projection screen; click on ▶.
    8) To highlight verse; select verse and click on 🖍️, then pick a color.
    9) To erase highlight; select the verse and click on 🖍️, then click on 🧽.
    10) To erase all highlighted verse; click on 🖍️, then click on ❌.
    11) To Pin a verse; click on 📌.
    12) To add a personal note to a verse; click on 📝 and add your note.
    13) To share verse as image; click on 📝.



Additionally, there are 2 other folders;
⚠️ Warning: DO NOT DELETE THESE FOLDERS - Else you will not be able to use "Bible.html" or "Bible Offline.html"

1) Screen: this is used for projection screen
2) Data: this has part online data for "Bible.html" use and full offline data for "Bible Offline.html" use.


---


ℹ️ If the bible verses are not being displayed, follow this troubleshoot steps:


# Running a Local Web Server (macOS & Windows)

This guide helps you run your "Bible Offline.html" project locally using built-in or simple tools. Choose the steps that match your system.

---

## 📱 For macOS

### ✅ Option 1: Using Python 3

1. Open **Terminal** (Applications > Utilities).
2. Check Python 3:
   ```bash
   python3 --version
   ```
3. Navigate to your project folder:
   ```bash
   cd path/to/your/project
   ```
4. Start the server:
   ```bash
   python3 -m http.server
   ```
5. Open your browser and visit:  
   👉 http://localhost:8000

---

### ✅ Option 2: Using Node.js

1. Install Node.js from [https://nodejs.org](https://nodejs.org) or via Homebrew:
   ```bash
   brew install node
   ```
2. Check npm:
   ```bash
   npm --version
   ```
3. Install http-server:
   ```bash
   npm install -g http-server
   ```
4. Navigate to your project:
   ```bash
   cd path/to/your/project
   ```
5. Start the server:
   ```bash
   http-server
   ```
6. Visit the URL shown (e.g., http://localhost:8080).

---

### ✅ Option 3: Using PHP (if installed)

1. Check PHP:
   ```bash
   php -v
   ```
2. Start the server:
   ```bash
   php -S localhost:8000
   ```
3. Open browser:  
   👉 http://localhost:8000

---

## 💻 For Windows

### ✅ Option 1: Using Python 3

1. Open **Command Prompt** or **PowerShell**.
2. Check Python:
   ```cmd
   python --version
   ```
   or
   ```cmd
   python3 --version
   ```
3. Navigate to your folder:
   ```cmd
   cd C:\path\to\your\project
   ```
4. Start server:
   ```cmd
   python -m http.server
   ```
5. Open browser:  
   👉 http://localhost:8000

---

### ✅ Option 2: Using Node.js

1. Install Node.js from [https://nodejs.org](https://nodejs.org).
2. Open Command Prompt.
3. Install http-server:
   ```cmd
   npm install -g http-server
   ```
4. Navigate to project:
   ```cmd
   cd C:\path\to\your\project
   ```
5. Run:
   ```cmd
   http-server
   ```
6. Visit the shown URL.

---

### ✅ Option 3: Using PHP (if installed)

1. Install PHP or use tools like XAMPP/WAMP.
2. Navigate to project:
   ```cmd
   cd C:\path\to\your\project
   ```
3. Start server:
   ```cmd
   php -S localhost:8000
   ```
4. Open browser:  
   👉 http://localhost:8000

---

Once the server is running, open `Bible Offline.html` via your browser on `localhost`.







---


Folder Map:


Bible/
├── Bible.html
├── Bible Offline.html
├── README.text
├── Screen/
│   └── bibleProjection.html
└── data/
    ├── js/
    │   ├── OfflineQuery.js
    │   ├── Query.js
    │   └── html2canvas.min.js
    ├── css/
    │   └── Style.css
    ├── xml/
    │   └── NIV84.xml
    └─FolderMap.pgsql


---


This service and platform is provided for free and without ads or tracking 
If you wish to support this initiative, channel your giving to HMBC https://www.hm-bc.org/give-to-hmbc.
