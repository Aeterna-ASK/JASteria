const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const target = `            </div>
            
            </div></div></div>

          </div>
        </div>


        <div class="modal-footer no-print"`;

const replacement = `            </div>

          </div>
        </div>


        <div class="modal-footer no-print"`;

if (content.includes('</div></div></div>')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Removed 3 extra divs from fix_missing.cjs.');
} else {
    console.log('No 3 extra divs found.');
}
