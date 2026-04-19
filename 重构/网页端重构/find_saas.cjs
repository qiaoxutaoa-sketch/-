const fs = require('fs');
const css = fs.readFileSync('src/assets/original_v1.css', 'utf8');

const match = css.match(/\.saas-card\{[^}]+\}/g);
if (match) {
    console.log(match.join('\n'));
} else {
    console.log('Not found');
}
