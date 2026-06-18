const fs = require('fs');
let lines = fs.readFileSync('src/components/IngredientsView.vue', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    // line 351: badge organic
    if (lines[i].includes('class="badge organic">') && lines[i].includes('/span>')) {
        lines[i] = lines[i].replace('/span>', '</span>');
    }
    // line 430
    if (lines[i].includes('isEditing ?')) {
        lines[i] = `            <h3>{{ isEditing ? '蜴滓攝譁呎ュ蝣' : '譁E' }}</h3>`;
    }
    // line 465: placeholder
    if (lines[i].includes('placeholder="萓E 繧E繝ｪ繝ｼ繝ｳ繝吶ず繧E繝悶Ν譬E蠑丈ｼ夂､E')) {
        if (!lines[i].endsWith('"')) lines[i] = lines[i] + '"';
    }
    // line 471: legend
    if (lines[i].includes('<legend class="fieldset-title">') && lines[i].includes('/legend>')) {
        lines[i] = lines[i].replace('/legend>', '</legend>');
    }
    // line 522: 
    if (lines[i].includes("{{ isEditing ? '螟画峩繧剁E晏ｭ・' : '逋ｻ骭E' }}")) {
        lines[i] = `              {{ isEditing ? '螟画峩' : '逋ｻ骭' }}`;
    }
    // line 547: text-sub text-sm mb-4
    if (lines[i].includes('<p class="text-sub text-sm mb-4"')) {
        // Maybe it's missing quotes or something
        lines[i] = `<p class="text-sub text-sm mb-4" style="line-height: 1.5; color: var(--text-light);">`;
    }
    // and if there's a /p>
    if (lines[i].includes('/p>')) {
        lines[i] = lines[i].replace('/p>', '</p>');
    }
}

fs.writeFileSync('src/components/IngredientsView.vue', lines.join('\n'), 'utf8');
