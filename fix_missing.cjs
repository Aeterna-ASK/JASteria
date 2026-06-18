const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const target = `            </div>

          </div>
        </div>


        <div class="modal-footer no-print"`;

const replacement = `            </div>
            
            </div></div></div>

          </div>
        </div>


        <div class="modal-footer no-print"`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Added 3 divs.');
