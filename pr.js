const { log } = require("node:console");



strs = ["flowerflow","flow","flight"];

var longestCommonPrefix = function(strs) {
    let word= ""
    for (let i = 0; i < strs[0].length; i++) {
        word =strs[0].substring(0, i + 1);
        for (let j = 1; j < strs.length; j++) {
            if (!strs[j].startsWith(word)) {
                return word.substring(0, word.length - 1);
            }
        }
    }

    return word;

};

const data =longestCommonPrefix(strs)
console.log(data)
