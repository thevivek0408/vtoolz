# VtoolZ - Secure, Client-Side Utilities

VtoolZ is a collection of 50+ powerful web utilities that run entirely in your browser. No data is ever sent to a server. 

## 🔒 Privacy Promise
- **100% Client-Side**: All processing (PDF merging, Image compression, etc.) happens on your device.
- **No Uploads**: Your files never leave your computer.
- **No Tracking**: No analytics, cookies, or third-party scripts.
- **Offline Capable**: Works without an internet connection once loaded.

## 🛠️ Features
- **PDF Tools**: Merge, Split, Convert, Rotate, and more.
- **Image Tools**: Compress, Resize, Crop, Convert, Filters.
- **Text Tools**: Word Count, Case Converter, Sort, Clean.
- **Developer Tools**: JSON Formatter, Base64, Hashing, Regex.
- **Security**: Password Generator, Strength Checker.

## 🚀 How to Deploy

### Step 1: Push to GitHub
1. Create a new repository on GitHub (e.g., `vtoolz`).
2. Open your terminal in this project folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/vtoolz.git
   git push -u origin main
   ```

### Step 2: Publish with GitHub Pages
1. Go to your repository **Settings** on GitHub.
2. Select **Pages** from the sidebar.
3. Under **Build and deployment** > **Source**, select `Deploy from a branch`.
4. Select `main` branch and `/ (root)` folder.
5. Click **Save**.
6. Wait 1-2 minutes. Your site will be live at `https://YOUR_USERNAME.github.io/vtoolz/`.

### Step 3: Add Custom Domain (Optional)
1. Buy a domain (e.g., `vtoolz.com`) from a provider like Namecheap or GoDaddy.
2. In GitHub Pages settings, enter your domain in the **Custom domain** field and click **Save**.
3. Log in to your domain provider and add these DNS records:
   - **Type**: `CNAME` | **Name**: `www` | **Value**: `YOUR_USERNAME.github.io`
   - **Type**: `A` | **Name**: `@` | **Value**: `185.199.108.153` (GitHub's IP)
4. GitHub will automatically generate an HTTPS certificate for you.

## 📂 Project Structure
```
/
├── css/              # Global styles & themes
├── js/
│   ├── vendor/       # Third-party libraries (PDF.js, Cropper, etc.)
│   ├── utils/        # Shared logic (Common, SEO)
│   ├── pdf/          # PDF Worker & Facade
│   ├── image/        # Image Worker & Facade
│   ├── text/         # Text implementations
│   └── dev/          # Dev implementations
├── tools/            # Tool-specific HTML pages
│   ├── pdf/
│   ├── image/
│   ├── text/
│   └── dev/
├── index.html        # Landing page
├── sitemap.xml       # SEO Sitemap
└── robots.txt        # Crawler directives
```

## 🤝 Contributing
1. Create a new HTML file in the appropriate `tools/` subdirectory.
2. Link it in `index.html` and the category index.
3. Ensure no external CDNs are used (download libraries to `js/vendor/`).
4. Update `sitemap.xml`.

## 📜 License
MIT License. Free to use and modify.
