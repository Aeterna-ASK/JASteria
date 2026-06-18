import os

file_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'

print("Starting definitive template-end patch on MenusView.vue...")

if not os.path.exists(file_path):
    print("Error: MenusView.vue not found!")
    exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The broken slice at the end of the template
broken_part = """                    <div v-else class="empty-photo-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center; padding: 1rem;">
                      <Camera :size="28" class="text-gray-300" style/* ----------------------------------------------------------------------------
 * 印刷用メディアクエリ (PDF出力時に完全に帳票のみにする)
 * ---------------------------------------------------------------------------- */"""

# The correct complete HTML end tags and transition to <style scoped>
corrected_part = """                    <div v-else class="empty-photo-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center; padding: 1rem;">
                      <Camera :size="28" class="text-gray-300" style="color: #cbd5e1; margin-bottom: 0.25rem;" />
                      <span style="font-size: 0.7rem; color: #94a3b8; font-weight: bold;">[画像未登録]</span>
                      <span style="font-size: 0.6rem; color: #cbd5e1; margin-top: 0.1rem;">メニュー「編集」ボタンから写真をアップロードできます</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        <div class="modal-footer no-print">
          <button class="btn btn-outline" @click="showSpecSheet = false">閉じる</button>
          <button class="btn btn-primary flex items-center gap-1" @click="handlePrint">
            <Printer :size="16" /> この帳票を印刷 (PDF出力)
          </button>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ----------------------------------------------------------------------------
 * 印刷用メディアクエリ (PDF出力時に完全に帳票のみにする)
 * ---------------------------------------------------------------------------- */"""

# Normalize line endings
normalized_content = content.replace('\r\n', '\n')
normalized_broken = broken_part.replace('\r\n', '\n')
normalized_corrected = corrected_part.replace('\r\n', '\n')

if normalized_broken in normalized_content:
    print("Found exact broken transition segment! Applying patch...")
    new_content = normalized_content.replace(normalized_broken, normalized_corrected)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: HTML template end tags and transition patched successfully!")
else:
    print("WARNING: Exact match failed. Using flexible search...")
    # Flexible literal match
    broken_lines_part = 'style/* -----------------';
    # Let's search if "style/* --------" is in the content
    if "style/*" in normalized_content:
        print("Found 'style/*' pattern in file! Applying targeted replacement...")
        # Replace the broken tr/style line up to the print media query start
        target_str = """                      <Camera :size="28" class="text-gray-300" style/* ----------------------------------------------------------------------------"""
        replacement_str = """                      <Camera :size="28" class="text-gray-300" style="color: #cbd5e1; margin-bottom: 0.25rem;" />
                      <span style="font-size: 0.7rem; color: #94a3b8; font-weight: bold;">[画像未登録]</span>
                      <span style="font-size: 0.6rem; color: #cbd5e1; margin-top: 0.1rem;">メニュー「編集」ボタンから写真をアップロードできます</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        <div class="modal-footer no-print">
          <button class="btn btn-outline" @click="showSpecSheet = false">閉じる</button>
          <button class="btn btn-primary flex items-center gap-1" @click="handlePrint">
            <Printer :size="16" /> この帳票を印刷 (PDF出力)
          </button>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ----------------------------------------------------------------------------"""
        new_content = normalized_content.replace(target_str, replacement_str)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("SUCCESS: Target-based patch applied successfully!")
    else:
        print("CRITICAL ERROR: Could not locate 'style/*' syntax anywhere in MenusView.vue.")
