const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/CookingLogsView.vue';
let content = fs.readFileSync(file, 'utf8');

// 1. Import watch
content = content.replace(/import \{ ref, computed \} from 'vue';/, "import { ref, computed, watch } from 'vue';");

// 2. Add formYear and formMonth refs and watch
const formSetupTarget = /const form = ref\(\{\s*date: '',/;
const formSetupReplacement = `const formYear = ref(new Date().getFullYear());
const formMonth = ref(new Date().getMonth() + 1);

watch([formYear, formMonth], ([year, month]) => {
  form.value.date = \`\${year}-\${String(month).padStart(2, '0')}\`;
});

const form = ref({
  date: '',`;
if (!content.includes('const formYear = ref(')) {
    content = content.replace(formSetupTarget, formSetupReplacement);
}

// 3. Update openAddModal
const openAddTarget = /form\.value = \{\s*date: new Date\(\)\.toISOString\(\)\.slice\(0, 7\),/;
const openAddReplacement = `const now = new Date();
    formYear.value = now.getFullYear();
    formMonth.value = now.getMonth() + 1;
    
    form.value = {
      date: \`\${formYear.value}-\${String(formMonth.value).padStart(2, '0')}\`,`;
content = content.replace(openAddTarget, openAddReplacement);

// 4. Update openEditModal
const openEditTarget = /form\.value = \{\s*date: log\.date\.substring\(0, 7\),/;
const openEditReplacement = `const [y, m] = log.date.substring(0, 7).split('-');
  formYear.value = parseInt(y, 10);
  formMonth.value = parseInt(m, 10);
  
  form.value = {
    date: log.date.substring(0, 7),`;
content = content.replace(openEditTarget, openEditReplacement);

// 5. Replace HTML input with selects
const inputTarget = /<input v-model="form\.date" type="month" class="input-organic" \/>/;
const inputReplacement = `<div style="display: flex; gap: 8px;">
                    <select v-model="formYear" class="input-organic" style="flex: 1;">
                      <option v-for="y in [2024, 2025, 2026, 2027, 2028, 2029, 2030]" :key="y" :value="y">{{ y }}年</option>
                    </select>
                    <select v-model="formMonth" class="input-organic" style="flex: 1;">
                      <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                    </select>
                  </div>`;
content = content.replace(inputTarget, inputReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated to Year/Month dropdowns.');
