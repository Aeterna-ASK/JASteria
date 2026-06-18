const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let s = fs.readFileSync(file, 'utf8');

// 1. Restore the lost block 1
s = s.replace('<div style="background: #15803d; border-radius: 12px; padding: 16px; color: white; position: relative;">', `<!-- 右: 有機サマリー＆写真 -->
              <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px;">
                
                <!-- 有機・非有機サマリー -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a; display: inline-block;"></span>
                    有機JAS 適合集計
                  </h3>
                  
                  <!-- 有機カード -->
                  <div style="background: #15803d; border-radius: 12px; padding: 16px; color: white; position: relative;">`);

// 2. Restore the end of the file that was cut off
const missingEnd = `          <button class="btn btn-primary flex items-center gap-1" @click="handlePrint" style="background-color: #166534; border-color: #15803d; color: white; font-weight: bold; padding: 0.5rem 1.5rem;">
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

s = s.replace(`          <button class="btn btn-outline" @click="showSpecSheet = false">閉じる</button>
          <button class="btn btn-primary flex items-center gap-1" @click="handlePrint" style="background-color: #166534; border-color: #15803d; color: white; font-weight: bold; padding: 0.5rem 1.5rem;">
    ============================================================================ */`, `          <button class="btn btn-outline" @click="showSpecSheet = false">閉じる</button>\n${missingEnd}`);

fs.writeFileSync(file, s);
console.log('Fixed chunks');
