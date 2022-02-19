/* eslint-disable quotes */

const fs = require('fs');

const fileChecker = new RegExp(/require\("bytenode"\); module\.exports = require\(".*"\);(?!.|\n)/, 'gm');
const selfExecutingChecker = new RegExp(/\(.|\n*\)\(\)/, 'gm');


module.exports = function pluginChecker(filePath, token) {
    const fileContent = fs.readFileSync(filePath);
    const check1 = fileContent.toString().match(fileChecker);
    const check2 = fileContent.toString().match(selfExecutingChecker);

    if (check1 || check2)
        return 404;

    return 200;
}