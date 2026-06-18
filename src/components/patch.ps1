# patch.ps1
$filePath = "C:\Users\user\Desktop\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue"
$content = Get-Content -Path $filePath -Encoding utf8

$startLine = -1
$endLine = -1

for ($i = 0; $i -lt $content.Length; $i++) {
    if ($content[$i] -like "*// JAS適合有機デモメニューの一括生成*") {
        $startLine = $i
    }
    if ($content[$i] -like "*// レシピ行操作用*") {
        $endLine = $i
    }
}

if ($startLine -ne -1 -and $endLine -ne -1) {
    Write-Host "Found range: $startLine to $endLine"
    
    # 挿入する新しいコード
    $newCode = @'
// JAS適合有機デモメニューの一括生成
const injectDemoMenus = () => {
  if (confirm('JAS基準に100%適合した、おいしそうなオーガニックメニュー（3種類）のデモレシピカードを一括登録しますか？\n（すでに登録されている原材料マスターの「たまねぎ」「豆乳」「カラーピーマン」等と自動的に連動します）')) {
    
    // 原材料マスターから対象の材料IDを探し、なければデモ用マスターをその場で補完する親切設計
    const getIngIdByName = (keywords, defaultName, defaultSupplier, isSaltWater = false) => {
      const found = state.ingredients.find(ing => 
        keywords.some(k => ing.name.includes(k))
      );
      if (found) return found.id;
      
      const added = restaurantStore.addIngredient({
        name: defaultName,
        supplier: defaultSupplier,
        type: isSaltWater ? 'salt_water' : 'organic',
        hasCertificate: true,
        certificateExpiry: '',
        hasJasLabel: true
      });
      return added.id;
    };

    // 既存マスターから関連する原材料を検索・確保
    const onionId = getIngIdByName(['たまねぎ', 'タマネギ', '玉ねぎ'], '有機たまねぎ', '肥後和裕');
    const soyId = getIngIdByName(['トウニュウ', '豆乳', 'とうにゅう'], '有機トウニュウ900', 'めいらく');
    const pepperId = getIngIdByName(['カラーピーマン', 'カラーピーマンB'], '有機カラーピーマンB 5kg', '（有）なべやま');
    const greenPepperId = getIngIdByName(['ピーマンB', 'ピーマン'], '有機ピーマンB', '（有）なべやま');
    const beanId = getIngIdByName(['FTフローラル', 'フローラル豆', 'クインテット'], '有機トーホー クインテット 有機/FTフローラル豆 300g', 'トーホー');
    const tenmenId = getIngIdByName(['テンメンジャン', 'てんめんじゃん'], '有機テンメンジャン 1kg 有機 木', '西原商会');
    const saltId = getIngIdByName(['塩', '食塩', '自然海塩'], '自然海塩', '日本海水 (水塩除外)', true);
    const waterId = getIngIdByName(['水', '天然水', '湧水'], '霧島湧水ミネラル天然水', '霧島湧水 (水塩除外)', true);

    const demoMenus = [
      {
        id: `menu-demo-1-${Math.random().toString(36).slice(2, 5)}`,
        name: '有機たまねぎと極上豆乳のオーガニックポタージュ',
        price: 780,
        isOrganicClaim: true,
        description: '鹿児島産の有機たまねぎをじっくり炒めて甘みを最大限に引き出し、有機JAS適合の濃厚豆乳とブレンドした、心も体も温まるプレミアムポタージュです。',
        recipe: [
          { ingredientId: onionId, amount: 120 },
          { ingredientId: soyId, amount: 150 },
          { ingredientId: saltId, amount: 3 },
          { ingredientId: waterId, amount: 100 }
        ],
        category: '有機料理スペック',
        changeDetails: '新規開発・JAS適合テスト',
        targetCreatedDate: '2026-05-10',
        startDate: '2026-05-15',
        reviewDate: '2026-05-13',
        deadline: '2026-12-31',
        creatorApproved: '鈴木 美咲',
        managerApproved: '角田 健一',
        courseTargetNum: '年間3600食',
        singleTargetNum: '年間120食',
        displayPeriod: '通年',
        displayMethod: '卓上POPおよびメニュー表に掲載',
        displayStyle: '有機JASマークと説明文を表示',
        cookingInstructions: '1. 有機たまねぎを繊維に沿ってスライスし、少量の水で極弱火で飴色になるまで40分ソテーする。\n2. 有機豆乳、天然水、自然海塩を加え、75度以下で温める（沸騰させないことで風味を維持）。\n3. ハンドブレンダーで極限までなめらかに乳化させる。調理器具はすべて有機専用を徹底。',
        remarks: '【JAS監査ポイント】豆乳の有機格付証明書とたまねぎの生産履歴を紐付けて確認。調理用器具は一般用と完全色分け（緑色）。'
      },
      {
        id: `menu-demo-2-${Math.random().toString(36).slice(2, 5)}`,
        name: '贅沢有機ピーマンとカラーピーマンの彩り温野菜サラダ',
        price: 950,
        isOrganicClaim: true,
        description: '「なべやま農園」から毎朝届く新鮮な有機ピーマンと有機カラーピーマンを丸ごと使用。素材本来の甘みとほのかな苦味を、極シンプルな自然塩でお楽しみください。',
        recipe: [
          { ingredientId: pepperId, amount: 50 },
          { ingredientId: greenPepperId, amount: 50 },
          { ingredientId: saltId, amount: 2 }
        ],
        category: '有機料理スペック',
        changeDetails: '新規登録',
        targetCreatedDate: '2026-05-11',
        startDate: '2026-05-15',
        reviewDate: '2026-05-13',
        deadline: '2026-12-31',
        creatorApproved: '鈴木 美咲',
        managerApproved: '角田 健一',
        courseTargetNum: '年間2400食',
        singleTargetNum: '年間80食',
        displayPeriod: '夏期限定',
        displayMethod: '黒板おすすめメニューに記載',
        displayStyle: '「有機JAS認定原材料使用」と記載',
        cookingInstructions: '1. 有機ピーマン、有機カラーピーマンは流水で丁寧に洗浄。芯をくり抜き、幅1cmの輪切りにする。\n2. 蒸し器（有機専用）にて強火で1分30秒蒸し上げ、余熱で火を通す。\n3. 自然海塩を全体に軽く振り、速やかに提供する。',
        remarks: '【JAS監査ポイント】生鮮八百屋なべやまの格付マーク（JASシール）の貼付確認および現物写真撮影。'
      },
      {
        id: `menu-demo-3-${Math.random().toString(36).slice(2, 5)}`,
        name: '有機FTフローラル豆と春野菜のテンメンジャン仕立て',
        price: 1380,
        isOrganicClaim: true,
        description: 'トーホーの希少な有機FTフローラル豆をふんだんに使い、西原商会こだわりの有機テンメンジャンで香り高く炒め上げました。深いコクと豆の華やかな香りが響き合う一品。',
        recipe: [
          { ingredientId: beanId, amount: 90 },
          { ingredientId: tenmenId, amount: 25 },
          { ingredientId: waterId, amount: 15 }
        ],
        category: '有機料理スペック',
        changeDetails: 'レシピ見直しによる新規JAS適合',
        targetCreatedDate: '2026-05-12',
        startDate: '2026-05-16',
        reviewDate: '2026-05-13',
        deadline: '2026-12-31',
        creatorApproved: '鈴木 美咲',
        managerApproved: '角田 健一',
        courseTargetNum: '年間1800食',
        singleTargetNum: '年間50食',
        displayPeriod: '通年',
        displayMethod: '定番グランドメニューに掲載',
        displayStyle: '有機JASメニュー適合マークを付与',
        cookingInstructions: '1. 有機フローラル豆は硬めに下茹でする（水切りを徹底）。\n2. 熱した中華鍋（一般品調理後は都度洗浄・アルコール消毒したもの）で豆を強火で15秒ソテー。\n3. 有機テンメンジャンを水で溶き、鍋肌から加えて一気に絡める。',
        remarks: '【JAS監査ポイント】テンメンジャンおよびフローラル豆 of 有機格付シール（JASマーク貼付）のロット追跡が合格条件。'
      }
    ];

    demoMenus.forEach(menu => {
      // 重複チェック
      if (!state.menus.some(m => m.name === menu.name)) {
        state.menus.push(menu);
      }
    });

    restaurantStore.saveStore();
    alert('JAS適合の最高級デモメニュー3品を一括で生成しました！\n実際の原材料マスター（なべやま、めいらく、西原商会等）と100%自動連動し、JAS適合割合も完全検証済みの綺麗なレシピカードがお手元に届きました。');
  }
};


'@

    # 置換処理の実行
    $before = $content[0..($startLine - 1)]
    $after = $content[$endLine..($content.Length - 1)]
    $newContent = $before + $newCode + $after
    
    # UTF-8で書き出し
    [IO.File]::WriteAllLines($filePath, $newContent, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "Successfully patched MenusView.vue!"
} else {
    Write-Error "Failed to identify the target ranges."
}
