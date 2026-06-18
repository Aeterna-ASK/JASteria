const fs = require('fs');
let lines = fs.readFileSync('src/components/IngredientsView.vue', 'utf8').split('\n');

// Helper to fix missing `<` for ending tags
function fixEndTag(lineNum) {
    if (lines[lineNum]) {
        lines[lineNum] = lines[lineNum].replace(/\s+\/([a-zA-Z0-9]+)>/, ' </$1>');
    }
}

// Helper to fix missing quotes
function fixQuote(lineNum, searchStr, replaceStr) {
    if (lines[lineNum] && lines[lineNum].includes(searchStr)) {
        lines[lineNum] = lines[lineNum].replace(searchStr, replaceStr);
    }
}

// Fix missing end tags
fixEndTag(253); // h2
fixEndTag(308); // td
fixEndTag(350); // span
fixEndTag(364); // td
fixEndTag(475); // span
fixEndTag(477); // p
fixEndTag(492); // span
fixEndTag(494); // p
fixEndTag(501); // p
fixEndTag(513); // button
fixEndTag(555); // label
fixEndTag(588); // label
fixEndTag(262); // button (was 263 in error because of \n)

// Also just globally fix any ' /tag>' just in case
for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(/\s+\/(h2|button|td|span|p|label|div)>/g, ' </$1>');
    // Fix specific quote issues:
    if (lines[i].includes(`title="Ri-Ry-Link 縺九ｉ繝`)) {
        lines[i] = lines[i].replace(/(@click)/, '" $1');
    }
    if (lines[i].includes(`title="邱E髮・ @click=`)) {
        lines[i] = lines[i].replace(`title="邱E髮・ @click=`, `title="邱E髮・" @click=`);
    }
    if (lines[i].includes(`placeholder="萓E 譛E岼JAS`)) {
        lines[i] += '"'; // append quote to end
    }
    if (lines[i].includes(`JAS繝槭・繧E譛E :`)) {
        lines[i] = lines[i].replace(`JAS繝槭・繧E譛E :`, `JAS繝槭・繧E譛E' :`);
    }
    if (lines[i].includes(`'譁E隕丞次譚E侭縺E逋ｻ骭E'`)) {
        // It's probably missing a quote
    }
    if (lines[i].includes(`'螟画峩繧剁E晏ｭ・ :`)) {
        lines[i] = lines[i].replace(`'螟画峩繧剁E晏ｭ・ :`, `'螟画峩繧剁E晏ｭ・' :`);
    }
    if (lines[i].includes(`逋ｻ骭E縺吶EE }}`)) {
        lines[i] = lines[i].replace(`逋ｻ骭E縺吶EE }}`, `逋ｻ骭E縺吶EE' }}`);
    }
    if (lines[i].includes(`'繧E繧E繝ｳ繧E繝ｳ & 蜷梧悁EE... :`)) {
        lines[i] = lines[i].replace(`'繧E繧E繝ｳ繧E繝ｳ & 蜷梧悁EE... :`, `'繧E繧E繝ｳ繧E繝ｳ & 蜷梧悁EE...' :`);
    }
    if (lines[i].includes(`'繧E繧E繝ｳ繧E繝ｳ縺励※蜷梧悁E }}`)) {
        lines[i] = lines[i].replace(`'繧E繧E繝ｳ繧E繝ｳ縺励※蜷梧悁E }}`, `'繧E繧E繝ｳ繧E繝ｳ縺励※蜷梧悁E' }}`);
    }
}

fs.writeFileSync('src/components/IngredientsView.vue', lines.join('\n'), 'utf8');
