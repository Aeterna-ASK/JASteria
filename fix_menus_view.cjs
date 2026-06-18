const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block; color: #1e40af;">共通メニュー名（集計グループ）</label>
                    <input type="text" v-model="form.masterName" class="input-organic" placeholder="例: 有機野菜のバーニャカウダ" style="background-color: #f8fafc; border-color: #bfdbfe;" />
                  </div>
                </div>`;

const newStr = `                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block; color: #1e40af;">共通メニュー名（集計グループ）</label>
                    <input type="text" v-model="form.masterName" class="input-organic" placeholder="例: 有機野菜のバーニャカウダ" style="background-color: #f8fafc; border-color: #bfdbfe;" />
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 1rem; padding: 0.75rem; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;">
                  <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block; color: #b45309;">バージョン管理グループ名（※履歴をまとめるためのキー）</label>
                  <p style="font-size: 0.7rem; color: #92400e; margin-bottom: 0.5rem; line-height: 1.3;">※この項目に同じ名前が入力されているメニュー同士は、強制的に「同じ料理の履歴（バージョン違い）」として一覧でまとめられます。空白の場合は料理名で判定されます。</p>
                  <input type="text" v-model="form.groupName" class="input-organic" placeholder="例: 有機野菜サラダ" style="background-color: #ffffff; border-color: #fcd34d;" />
                </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated MenusView.vue');
} else {
  console.log('Target string not found in MenusView.vue');
}
