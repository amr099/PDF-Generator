# PDF Generator (HTML/CSS/JS) — Arabic RTL

Static website that takes form inputs (Arabic) and generates a styled PDF in the browser with **preview + download**.

## How to run

Just open `index.html` in your browser.

> Tip: If your browser blocks some CDN assets when opened via `file://`, run a tiny local server:
>
> - PowerShell:
>   - `python -m http.server 8080`
>   - then open `http://localhost:8080`

## Libraries (CDN)

- `html2canvas` (render styled HTML to image)
- `jsPDF` (create the PDF)
- `qrcodejs` (optional QR generation for “باركود”)

