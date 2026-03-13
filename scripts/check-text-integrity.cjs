const path = require('path');

const scriptPath = path.resolve(__dirname, '..', '..', 'scripts', 'check-text-integrity.js');
const { main } = require(scriptPath);

main(process.argv.slice(2));
