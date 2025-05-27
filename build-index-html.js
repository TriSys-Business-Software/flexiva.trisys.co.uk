// build-index-html.js
// Simple script to minify index.html and place it in dist folder
const fs = require('fs');
const path = require('path');

function minifyHTML(htmlContent)
{
    let minified = htmlContent;

    // DON'T remove any comments - too risky with IE conditionals
    // Just clean up whitespace and formatting

    // Remove excessive whitespace (3+ spaces become 1)
    minified = minified.replace(/[ \t]{3,}/g, ' ');

    // Clean up attribute spacing
    minified = minified.replace(/\s*=\s*"/g, '="');
    minified = minified.replace(/\s*=\s*'/g, "='");

    // Remove empty lines
    minified = minified.replace(/\n\s*\n/g, '\n');

    // Trim each line but preserve structure
    minified = minified.split('\n').map(line => line.trim()).filter(line => line.length > 0).join(' ');

    return minified;
}

console.log('🚀 Starting HTML minification...');

// Check if index.html exists
if (!fs.existsSync('index.html'))
{
    console.error('❌ index.html not found in current directory');
    process.exit(1);
}

// Create dist folder if it doesn't exist
if (!fs.existsSync('dist'))
{
    fs.mkdirSync('dist', { recursive: true });
    console.log('📁 Created dist folder');
}

try
{
    // Read index.html
    console.log('📖 Reading index.html...');
    const htmlContent = fs.readFileSync('index.html', 'utf8');

    // Minify it
    console.log('🔄 Minifying HTML...');
    const minified = minifyHTML(htmlContent);

    // Write to dist folder
    const outputPath = path.join('dist', 'index.html');
    fs.writeFileSync(outputPath, minified);

    // Show results
    const originalSize = htmlContent.length;
    const minifiedSize = minified.length;
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

    console.log('✅ HTML minified successfully!');
    console.log(`📊 Original size: ${originalSize.toLocaleString()} bytes`);
    console.log(`📊 Minified size: ${minifiedSize.toLocaleString()} bytes`);
    console.log(`📊 Space saved: ${savings}%`);
    console.log(`📁 Output: ${outputPath}`);

} catch (error)
{
    console.error('❌ Error processing HTML:', error.message);
    process.exit(1);
}