const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let s = fs.readFileSync(file, 'utf8');

const startIdx = s.indexOf('<button class="btn btn-primary flex items-center gap-1" @click="handlePrint"');
const endIdx = s.indexOf('============================================================================ */', startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find start or end index!');
  process.exit(1);
}

const replaceStr = `          <button class="btn btn-primary flex items-center gap-1" @click="handlePrint" style="background-color: #166534; border-color: #15803d; color: white; font-weight: bold; padding: 0.5rem 1.5rem;">
            <Printer :size="16" /> この帳票を印刷 (PDF出力)
          </button>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ============================================================================
   共通モーダル基本スタイル (画面全体へのオーバーレイと中央配置) (v1.2.0)
   ============================================================================ */`;

s = s.substring(0, startIdx) + replaceStr + s.substring(endIdx + '============================================================================ */'.length);

fs.writeFileSync(file, s);
console.log('Force fixed EOF tags!');
