/**
 * Patches all EJS files to use local FontAwesome instead of CDN
 */
const fs = require('fs');
const path = require('path');

function walk(dir) {
    const results = [];
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) results.push(...walk(p));
        else if (p.endsWith('.ejs')) results.push(p);
    }
    return results;
}

const viewsDir = path.join(__dirname, '../views');
const files = walk(viewsDir);
let count = 0;

for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('font-awesome')) {
        // Replace any CDN font-awesome link with local version
        const updated = content.replace(
            /<link[^>]*font-awesome[^>]*>/g,
            '<link rel="stylesheet" href="/css/fa-all.min.css">'
        );
        if (updated !== content) {
            fs.writeFileSync(f, updated);
            console.log('Updated:', path.relative(viewsDir, f));
            count++;
        }
    }
}

// Also patch vcard-ui.js to use local FA
const vcardJs = path.join(__dirname, '../public/js/vcard-ui.js');
let jsContent = fs.readFileSync(vcardJs, 'utf8');
const updatedJs = jsContent.replace(
    /const FONT_AWESOME_CDN = '[^']+';/,
    "const FONT_AWESOME_CDN = '/css/fa-all.min.css';"
);
if (updatedJs !== jsContent) {
    fs.writeFileSync(vcardJs, updatedJs);
    console.log('Updated: vcard-ui.js CDN URL -> local');
}

console.log(`\nDone. Updated ${count} EJS files + vcard-ui.js`);
