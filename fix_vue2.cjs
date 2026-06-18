const fs = require('fs');
let content = fs.readFileSync('src/components/IngredientsView.vue', 'utf8');

// Fix exact broken tags
content = content.replace(/逅・\/h2>/g, '逅・</h2>');
content = content.replace(/蜷梧悁E\/button>/g, '蜷梧悁E</button>');
content = content.replace(/{{ ing\.name }} \/td>/g, '{{ ing.name }} </td>');
content = content.replace(/class="badge organic"> \/span>/g, 'class="badge organic"> </span>');
content = content.replace(/{{ ing\.supplier }} \/td>/g, '{{ ing.supplier }} </td>');
content = content.replace(/title="邱E髮・ @click=/g, 'title="邱E髮・" @click=');
content = content.replace(/placeholder="萓E 譛E岼JAS繧E繝懊き繝E/g, 'placeholder="萓E 譛E岼JAS繧E繝懊き繝E"');
content = content.replace(/<span>譛画E櫟AS隱榊ｮ夊ｨE譏取嶌繧貞叙蠕励・菫晉ｮE縺励※縺・E /span>/g, '<span>譛画E櫟AS隱榊ｮ夊ｨE譏取嶌繧貞叙蠕励・菫晉ｮE縺励※縺・E </span>');
content = content.replace(/<p class="checkbox-help">窶E蟷E谺E蟁E譟ｻ譎ゅ↓縲∽E募E蜈医°繧牙叙繧雁EE・○縺滓怏蜉E縺E險E譏取嶌縺E蜴滓悽・亥・縺暦E峨′蠢・E√〒縺吶€・\/p>/g, '<p class="checkbox-help">窶E蟷E谺E蟁E譟ｻ譎ゅ↓縲∽E募E蜈医°繧牙叙繧雁EE・○縺滓怏蜉E縺E險E譏取嶌縺E蜴滓悽・亥・縺暦E峨′蠢・E√〒縺吶€・</p>');
content = content.replace(/<span>蜿怜E譎ゅ↓闕E蟋ｿ縺E縲梧怏讖櫟AS繝槭・繧E縲阪・雋ｼ莉倥′縺めEE\/span>/g, '<span>蜿怜E譎ゅ↓闕E蟋ｿ縺E縲梧怏讖櫟AS繝槭・繧E縲阪・雋ｼ莉倥′縺めEE</span>');
content = content.replace(/<p class="checkbox-help">窶EJAS繝槭・繧E縺後E縺・EE逕｣迚ｩ繧偵€梧怏讖溘€阪→縺励※菴E逕ｨ縺吶E縺薙E縺E縺E縺阪∪縺帙ｓ縲・\/p>/g, '<p class="checkbox-help">窶EJAS繝槭・繧E縺後E縺・EE逕｣迚ｩ繧偵€梧怏讖溘€阪→縺励※菴E逕ｨ縺吶E縺薙E縺E縺E縺阪∪縺帙ｓ縲・</p>');
content = content.replace(/<p class="text-xs text-sub mb-2">※ここに登録しておくと、日、E受E記録での写真添付が不要になります、E\/p>/g, '<p class="text-xs text-sub mb-2">※ここに登録しておくと、日、E受E記録での写真添付が不要になります、E</p>');
content = content.replace(/ÁE\/button>/g, 'ÁE</button>');
content = content.replace(/<label class="form-label" style="font-size: 0.75rem; color: var\(--text-light\); margin-bottom: 0.375rem; display: block;">繧E繧E繝Eけ繧E繧E繧E繝ｳ繝磯∈謚E\/label>/g, '<label class="form-label" style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.375rem; display: block;">繧E繧E繝Eけ繧E繧E繧E繝ｳ繝磯∈謚E</label>');
content = content.replace(/<label class="form-label" style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">繝代せ繝ｯ繝ｼ繝E\/label>/g, '<label class="form-label" style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">繝代せ繝ｯ繝ｼ繝E</label>');

content = content.replace(/JAS繝槭・繧E譛E : '陦E/g, "JAS繝槭・繧E譛E' : '陦E");
content = content.replace(/'蜴滓攝譁呎ュ蝣E縺E邱E髮・ : '譁E/g, "'蜴滓攝譁呎ュ蝣E縺E邱E髮・' : '譁E");
content = content.replace(/逋ｻ骭E' }}/g, "逋ｻ骭E' }}"); // this is probably fine
content = content.replace(/逋ｻ骭E' }}/g, "逋ｻ骭E' }}"); 
content = content.replace(/'螟画峩繧剁E晏ｭ・ : '逋ｻ骭E/g, "'螟画峩繧剁E晏ｭ・' : '逋ｻ骭E");
content = content.replace(/'繧E繧E繝ｳ繧E繝ｳ & 蜷梧悁EE\.\.\. : '繧E/g, "'繧E繧E繝ｳ繧E繝ｳ & 蜷梧悁EE...' : '繧E");
content = content.replace(/蜷梧悁E }}/g, "蜷梧悁E' }}");

fs.writeFileSync('src/components/IngredientsView.vue', content, 'utf8');
