/**
 * Script to download FontAwesome 6.4.0 locally with forced IPv4 DNS resolution
 * Run: node scripts/download-fa.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

const FA_VERSION = '6.4.0';
const OUT_CSS_DIR = path.join(__dirname, '../public/css');
const OUT_WEBFONTS_DIR = path.join(__dirname, '../public/webfonts');

// Create webfonts directory if not exists
if (!fs.existsSync(OUT_WEBFONTS_DIR)) {
    fs.mkdirSync(OUT_WEBFONTS_DIR, { recursive: true });
}

function download(url, dest) {
    return new Promise((resolve, reject) => {
        // Force IPv4 by resolving hostname manually
        const parsedUrl = new URL(url);
        dns.resolve4(parsedUrl.hostname, (err, addresses) => {
            if (err) {
                console.error(`DNS resolve failed for ${parsedUrl.hostname}:`, err.message);
                return reject(err);
            }
            
            const ipv4 = addresses[0];
            console.log(`  Resolved ${parsedUrl.hostname} -> ${ipv4}`);
            
            const options = {
                hostname: ipv4,
                port: 443,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: { 'Host': parsedUrl.hostname }
            };
            
            const file = fs.createWriteStream(dest);
            const req = https.request(options, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    file.close();
                    return resolve(download(res.headers.location, dest));
                }
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`  ✅ Saved: ${path.basename(dest)} (${res.statusCode})`);
                    resolve();
                });
            });
            req.on('error', reject);
            req.end();
        });
    });
}

async function run() {
    const baseUrl = `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/${FA_VERSION}`;
    
    // Files to download
    const files = [
        // CSS
        { url: `${baseUrl}/css/all.min.css`, dest: path.join(OUT_CSS_DIR, 'fa-all.min.css') },
        // Webfonts
        { url: `${baseUrl}/webfonts/fa-solid-900.woff2`, dest: path.join(OUT_WEBFONTS_DIR, 'fa-solid-900.woff2') },
        { url: `${baseUrl}/webfonts/fa-regular-400.woff2`, dest: path.join(OUT_WEBFONTS_DIR, 'fa-regular-400.woff2') },
        { url: `${baseUrl}/webfonts/fa-brands-400.woff2`, dest: path.join(OUT_WEBFONTS_DIR, 'fa-brands-400.woff2') },
        { url: `${baseUrl}/webfonts/fa-solid-900.ttf`, dest: path.join(OUT_WEBFONTS_DIR, 'fa-solid-900.ttf') },
        { url: `${baseUrl}/webfonts/fa-regular-400.ttf`, dest: path.join(OUT_WEBFONTS_DIR, 'fa-regular-400.ttf') },
        { url: `${baseUrl}/webfonts/fa-brands-400.ttf`, dest: path.join(OUT_WEBFONTS_DIR, 'fa-brands-400.ttf') },
    ];
    
    console.log(`\n📦 Downloading FontAwesome ${FA_VERSION} locally...\n`);
    
    for (const f of files) {
        console.log(`Downloading: ${f.url}`);
        try {
            await download(f.url, f.dest);
        } catch (e) {
            console.error(`  ❌ Failed: ${e.message}`);
        }
    }
    
    // Patch the CSS file to use local webfont paths
    const cssFile = path.join(OUT_CSS_DIR, 'fa-all.min.css');
    if (fs.existsSync(cssFile)) {
        let css = fs.readFileSync(cssFile, 'utf8');
        // Replace absolute CDN font paths with our local /webfonts/ path
        css = css.replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/[\d.]+\/webfonts\//g, '/webfonts/');
        fs.writeFileSync(cssFile, css);
        console.log('\n✅ CSS patched to use local /webfonts/ paths');
    }
    
    console.log('\n🎉 Done! Now update your EJS files to use <link rel="stylesheet" href="/css/fa-all.min.css">\n');
}

run().catch(console.error);
