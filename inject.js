const fs = require('fs');
const path = require('path');

const scriptTag = '<script src="wordbank-utils.js"></script>';
const dir = __dirname;

fs.readdir(dir, (err, files) => {
    if (err) throw err;

    const htmlFiles = files.filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'wordbank.html');

    htmlFiles.forEach(file => {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        if (!content.includes(scriptTag)) {
            if (content.includes('</body>')) {
                content = content.replace('</body>', `${scriptTag}\n</body>`);
            } else {
                content += `\n${scriptTag}`;
            }
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Injected into ${file}`);
        } else {
            console.log(`Already injected in ${file}`);
        }
    });
    console.log('Done injecting!');
});
