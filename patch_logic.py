filepath = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/AuditDocsView.vue'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

edit_logic = """
// --- 編集モーダル関連 ---
const showEditModal = ref(false);
const editingDocId = ref(null);
const editingSourceType = ref(null);
const editingIngredientId = ref(null);
const editDocForm = ref({
  date: '',
  type: '',
  title: '',
  supplier: '',
  notes: '',
  fileUrl: ''
});

const openEditModal = (item) => {
  editingSourceType.value = item.sourceType;
  if (item.sourceType === 'jas_cert') {
    // jas_cert-id形式からidを抽出
    const ingId = item.id.replace('jas-cert-', '');
    editingIngredientId.value = ingId;
    editingDocId.value = item.id;
    editDocForm.value = {
      date: item.rawDate || '',
      type: '適合証明書',
      title: item.title,
      supplier: item.partnerName,
      notes: item.notes,
      fileUrl: item.fileUrl
    };
  } else {
    editingDocId.value = item.id;
    editDocForm.value = {
      date: item.rawDate || item.date || '',
      type: item.type || '',
      title: item.title || '',
      supplier: item.partnerName || '',
      notes: item.notes || '',
      fileUrl: item.fileUrl || ''
    };
  }
  showEditModal.value = true;
};

const handleEditFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
    alert('PDFまたは画像ファイルを選択してください。');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    editDocForm.value.fileUrl = e.target.result;
  };
  reader.readAsDataURL(file);
};

const saveEditDocument = () => {
  if (!editDocForm.value.title.trim()) {
    alert('資料名は必須です。');
    return;
  }
  if (!editDocForm.value.fileUrl) {
    alert('スキャンファイルまたは画像が選択されていません。');
    return;
  }

  if (editingSourceType.value === 'jas_cert') {
    // 適合証明書の場合は原材料マスタを更新する
    const originalIng = ingredients.value.find(i => i.id === editingIngredientId.value);
    if (!originalIng) {
      alert('エラー：元の原材料が見つかりません。');
      return;
    }
    
    restaurantStore.updateIngredient(editingIngredientId.value, {
      supplier: editDocForm.value.supplier,
      certificateExpiry: editDocForm.value.date,
      jasCertUrl: editDocForm.value.fileUrl
    });
    
  } else {
    // 通常の監査ドキュメントの場合
    restaurantStore.updateAuditDocument(editingDocId.value, {
      date: editDocForm.value.date,
      type: editDocForm.value.type,
      title: editDocForm.value.title,
      supplier: editDocForm.value.supplier,
      notes: editDocForm.value.notes,
      fileUrl: editDocForm.value.fileUrl
    });
  }

  showEditModal.value = false;
  alert('変更を保存しました！');
};
"""
if 'const showEditModal = ref(false);' not in content:
    content = content.replace('const showAddModal = ref(false);', edit_logic + '\nconst showAddModal = ref(false);')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Logic injected successfully.')
else:
    print('Logic already exists.')
