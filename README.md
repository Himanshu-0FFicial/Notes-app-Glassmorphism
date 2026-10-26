# Glass Notes

A small, responsive notes app with a glassmorphism interface. It uses plain HTML, CSS, and JavaScript—no build tools or package installation required.

## Open in VS Code

1. Extract this folder.
2. In VS Code, choose **File → Open Folder** and select `glass-notes-vscode`.
3. To preview it, open `index.html` in a browser. For a more reliable local preview, install the **Live Server** extension in VS Code, right-click `index.html`, then choose **Open with Live Server**.

## Features

- Create, edit, pin, and delete notes.
- Organize notes into Ideas, Journal, Reading, Work, and Personal.
- Search note titles, contents, and categories.
- Filter by collection or pinned notes.
- Save notes in this browser with `localStorage`.
- Responsive layout and keyboard shortcuts: `Ctrl/Cmd + K` to search and `Ctrl/Cmd + N` to create a note.

Notes are stored in the browser where you use the app. They are not automatically uploaded to GitHub or shared between browsers.

## Push to GitHub

Create an empty repository on GitHub, then open the extracted project folder in a terminal and run:

```bash
git init
git add .
git commit -m "Add Glass Notes website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository's URL. If Git asks you to sign in, complete the prompt in your terminal or browser.

## Files

- `index.html` — page content and dialogs
- `styles.css` — glass-style layout and responsive styling
- `app.js` — notes, search, filters, and browser storage
