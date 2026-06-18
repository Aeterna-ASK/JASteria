import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Clean up multiple modal blocks
# The block starts with <!-- AIレシピ自動生成モーダル --> and ends with the closing </div> of that modal.
# Since the modal has a specific structure:
modal_regex = re.compile(r'<!-- AIレシピ自動生成モーダル -->.*?</div>\s*</div>\s*</div>', re.DOTALL)
content = modal_regex.sub('', content)

# 2. Add Teleport Modal at the very end of <template>
# Find the LAST </template> in the file. Wait, actually the file ends with </style>.
# Let's find the last </template>
last_template_idx = content.rfind('</template>')

teleport_modal_html = """
  <!-- AIレシピ自動生成モーダル -->
  <Teleport to="body">
    <div v-if="showAiRecipeModal" class="modal-overlay animate-fade-in" @click.self="showAiRecipeModal = false" style="z-index: 100000;">
      <div class="modal-content animate-slide-up" style="max-width: 500px; padding: 2rem; border-radius: 12px; background: white; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); z-index: 100001;">
        <div class="modal-header flex items-center justify-between mb-4">
          <h3 class="font-bold flex items-center gap-2" style="font-size: 1.25rem; color: #1e293b;">
            <Sparkles :size="24" style="color: #a855f7;" /> AIレシピ自動生成
          </h3>
          <button type="button" class="icon-btn text-sub" @click="showAiRecipeModal = false"><X :size="24" /></button>
        </div>
        
        <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; line-height: 1.5;">
          指定した期間（前後10日間）の納品実績から食材を抽出し、有機JAS品の構成比を最大化するレシピをAIが自動考案します。
        </p>

        <div class="form-group mb-4">
          <label class="form-label font-bold text-dark">対象期間 (開始 - 終了)</label>
          <div class="flex gap-2">
            <input v-model="aiRecipeConfig.startDate" type="date" class="input-organic" />
            <span style="display: flex; align-items: center;">〜</span>
            <input v-model="aiRecipeConfig.endDate" type="date" class="input-organic" />
          </div>
        </div>
        
        <div v-if="!currentId" class="form-group mb-4">
          <label class="form-label font-bold text-dark">1食あたりの目標総重量 (g)</label>
          <input v-model.number="aiRecipeConfig.targetGrams" type="number" class="input-organic" placeholder="200" />
        </div>

        <div v-if="aiRecipeError" class="alert alert-danger mb-4" style="background: #fef2f2; color: #b91c1c; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem;">
          <AlertTriangle :size="16" style="display: inline; margin-top: -2px;" /> {{ aiRecipeError }}
        </div>

        <div class="modal-actions flex gap-2 justify-end mt-6">
          <button type="button" class="btn btn-outline" @click="showAiRecipeModal = false" :disabled="isGeneratingAiRecipe">キャンセル</button>
          <button type="button" class="btn" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; border: none; font-weight: bold;" @click.prevent="generateRecipeWithAi" :disabled="isGeneratingAiRecipe">
            <span v-if="isGeneratingAiRecipe" class="spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; margin-right: 8px;"></span>
            {{ isGeneratingAiRecipe ? '生成中...' : '自動生成を実行' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
"""

if last_template_idx != -1:
    content = content[:last_template_idx] + teleport_modal_html + "\n" + content[last_template_idx:]

# 3. Fix the button to have type="button" and @click.prevent
button_old = '<button class="btn btn-sm flex items-center gap-1" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; border: none;" @click="openAiRecipeModal">'
button_new = '<button type="button" class="btn btn-sm flex items-center gap-1" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; border: none;" @click.prevent="openAiRecipeModal">'

content = content.replace(button_old, button_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleaned up modals, added Teleport, and fixed button.")
