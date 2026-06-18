const fs = require('fs');
let content = fs.readFileSync('src/components/IngredientsView.vue', 'utf8');

function replaceAll(search, replace) {
    content = content.split(search).join(replace);
}

// Fix exact broken tags
replaceAll('逅・/h2>', '逅・</h2>');
replaceAll('蜷梧悁E/button>', '蜷梧悁E</button>');
replaceAll('{{ ing.name }} /td>', '{{ ing.name }} </td>');
replaceAll('class="badge organic"> /span>', 'class="badge organic"> </span>');
replaceAll('{{ ing.supplier }} /td>', '{{ ing.supplier }} </td>');
replaceAll('title="邱E髮・ @click=', 'title="邱E髮・" @click=');
replaceAll('placeholder="萓E 譛E岼JAS繧E繝懊き繝E', 'placeholder="萓E 譛E岼JAS繧E繝懊き繝E"');
replaceAll('<span>譛画E櫟AS隱榊ｮ夊ｨE譏取嶌繧貞叙蠕励・菫晉ｮE縺励※縺・E /span>', '<span>譛画E櫟AS隱榊ｮ夊ｨE譏取嶌繧貞叙蠕励・菫晉ｮE縺励※縺・E </span>');
replaceAll('<p class="checkbox-help">窶E蟷E谺E蟁E譟ｻ譎ゅ↓縲∽E募E蜈医°繧牙叙繧雁EE・○縺滓怏蜉E縺E險E譏取嶌縺E蜴滓悽・亥・縺暦E峨′蠢・E√〒縺吶€・/p>', '<p class="checkbox-help">窶E蟷E谺E蟁E譟ｻ譎ゅ↓縲∽E募E蜈医°繧牙叙繧雁EE・○縺滓怏蜉E縺E險E譏取嶌縺E蜴滓悽・亥・縺暦E峨′蠢・E√〒縺吶€・</p>');
replaceAll('<span>蜿怜E譎ゅ↓闕E蟋ｿ縺E縲梧怏讖櫟AS繝槭・繧E縲阪・雋ｼ莉倥′縺めEE/span>', '<span>蜿怜E譎ゅ↓闕E蟋ｿ縺E縲梧怏讖櫟AS繝槭・繧E縲阪・雋ｼ莉倥′縺めEE</span>');
replaceAll('<p class="checkbox-help">窶EJAS繝槭・繧E縺後E縺・EE逕｣迚ｩ繧偵€梧怏讖溘€阪→縺励※菴E逕ｨ縺吶E縺薙E縺E縺E縺阪∪縺帙ｓ縲・/p>', '<p class="checkbox-help">窶EJAS繝槭・繧E縺後E縺・EE逕｣迚ｩ繧偵€梧怏讖溘€阪→縺励※菴E逕ｨ縺吶E縺薙E縺E縺E縺阪∪縺帙ｓ縲・</p>');
replaceAll('<p class="text-xs text-sub mb-2">※ここに登録しておくと、日、E受E記録での写真添付が不要になります、E/p>', '<p class="text-xs text-sub mb-2">※ここに登録しておくと、日、E受E記録での写真添付が不要になります、E</p>');
replaceAll('ÁE/button>', 'ÁE</button>');
replaceAll('<label class="form-label" style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.375rem; display: block;">繧E繧E繝Eけ繧E繧E繧E繝ｳ繝磯∈謚E/label>', '<label class="form-label" style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.375rem; display: block;">繧E繧E繝Eけ繧E繧E繧E繝ｳ繝磯∈謚E</label>');
replaceAll('<label class="form-label" style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">繝代せ繝ｯ繝ｼ繝E/label>', '<label class="form-label" style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">繝代せ繝ｯ繝ｼ繝E</label>');

replaceAll("JAS繝槭・繧E譛E : '陦E", "JAS繝槭・繧E譛E' : '陦E");
replaceAll("'蜴滓攝譁呎ュ蝣E縺E邱E髮・ : '譁E", "'蜴滓攝譁呎ュ蝣E縺E邱E髮・' : '譁E");
replaceAll("'螟画峩繧剁E晏ｭ・ : '逋ｻ骭E", "'螟画峩繧剁E晏ｭ・' : '逋ｻ骭E");
replaceAll("'繧E繧E繝ｳ繧E繝ｳ & 蜷梧悁EE... : '繧E", "'繧E繧E繝ｳ繧E繝ｳ & 蜷梧悁EE...' : '繧E");

// For the `逋ｻ骭E縺吶EE }}` missing quote, the line is `{{ isEditing ? '螟画峩繧剁E晏ｭ・ : '逋ｻ骭E縺吶EE }}`
replaceAll(`逋ｻ骭E縺吶EE }}`, `逋ｻ骭E縺吶EE' }}`);
replaceAll(`蜷梧悁E }}`, `蜷梧悁E' }}`);
replaceAll(`title="Ri-Ry-Link 縺九ｉ繝Eｼ繧ｿ繧貞叙蠕E @click=`, `title="Ri-Ry-Link 縺九ｉ繝Eｼ繧ｿ繧貞叙蠕E" @click=`);

// A few more fixes
replaceAll('</button>>', '</button>'); // cleanup

fs.writeFileSync('src/components/IngredientsView.vue', content, 'utf8');
