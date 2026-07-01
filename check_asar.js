const asar = require('@electron/asar');
const files = asar.listPackage('dist/win-unpacked/resources/app.asar');
const renderer = files.filter(f => f.includes('renderer'));
console.log('Renderer files in asar:', renderer.length);
renderer.forEach(f => console.log(f));
