const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let s = fs.readFileSync(file, 'utf8');

const targetStr = `          <button class="btn btn-primary flex items-center gap-1" @click="handlePrint" style="background-color: #166534; border-color: #15803d; color: white; font-weight: bold; padding: 0.5rem 1.5rem;">
            <Printer :size="16" /> この帳票を印刷 (PDF出力)
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>`;

const replaceStr = `          <button class="btn btn-primary flex items-center gap-1" @click="handlePrint" style="background-color: #166534; border-color: #15803d; color: white; font-weight: bold; padding: 0.5rem 1.5rem;">
            <Printer :size="16" /> この帳票を印刷 (PDF出力)
          </button>
        </div>
      </div>
    </div>
    </Teleport>
</template>

<style scoped>`;

if (!s.includes(targetStr)) {
  console.log("Could not find the target string! Trying fallback...");
  // Fallback if the file has something else
  const fallbackStr = `          <button class="btn btn-primary flex items-center gap-1" @click="handlePrint" style="background-color: #166534; border-color: #15803d; color: white; font-weight: bold; padding: 0.5rem 1.5rem;">
            <Printer :size="16" /> この帳票を印刷 (PDF出力)
          </button>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<style scoped>`;
  if (s.includes(fallbackStr)) {
    s = s.replace(fallbackStr, replaceStr);
    fs.writeFileSync(file, s);
    console.log("Fixed EOF using fallback!");
  } else {
    // Super fallback: find the button and replace up to </template>
    const startIdx = s.indexOf('<button class="btn btn-primary flex items-center gap-1" @click="handlePrint"');
    const endIdx = s.indexOf('</template>', startIdx);
    if (startIdx !== -1 && endIdx !== -1) {
      const correctEnding = `          <button class="btn btn-primary flex items-center gap-1" @click="handlePrint" style="background-color: #166534; border-color: #15803d; color: white; font-weight: bold; padding: 0.5rem 1.5rem;">
            <Printer :size="16" /> この帳票を印刷 (PDF出力)
          </button>
        </div>
      </div>
    </div>
    </Teleport>
`;
      s = s.substring(0, startIdx) + correctEnding + s.substring(endIdx);
      fs.writeFileSync(file, s);
      console.log("Fixed EOF using super fallback!");
    } else {
      console.log("Super fallback failed too!");
    }
  }
} else {
  s = s.replace(targetStr, replaceStr);
  fs.writeFileSync(file, s);
  console.log('Fixed EOF successfully!');
}
