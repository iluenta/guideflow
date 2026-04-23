const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync('Landing.html', 'utf8');
const regex = /data:image\/([a-zA-Z]*);base64,([^"']+)/g;
let match;
let count = 0;

const dir = 'public/images';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

while ((match = regex.exec(htmlContent)) !== null) {
    const ext = match[1];
    const b64Data = match[2];
    const filename = `image_${count}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), b64Data, 'base64');
    console.log(`Saved ${filename}`);
    count++;
}

if (count === 0) {
    console.log("No base64 images found.");
}
