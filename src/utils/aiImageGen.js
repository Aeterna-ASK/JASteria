/**
 * 有機料理スペック向け AI画像生成オーケストレーター
 *
 * 設計思想（コスト最小）:
 *  - 画像生成は pollinations.ai（FLUX）= 完全無料・無認証
 *  - Gemini 2.5 Flash は「あれば使う」だけ。未設定でもサーバーサンプルの英語ヒントで動作
 *  - サンプル画像は public/style-samples/ 配下に置いた静的アセット
 *    （同一オリジン配信のためCORS不要、CDN代不要）
 *  - manifest.json でタグ・スタイル英文ヒントを保持し、料理名／食材から自動選定
 */

const MANIFEST_PATH = '/style-samples/manifest.json';
let _manifestCache = null;

async function loadManifest() {
  if (_manifestCache) return _manifestCache;
  try {
    const res = await fetch(MANIFEST_PATH, { cache: 'no-cache' });
    if (!res.ok) return { version: 1, samples: [] };
    _manifestCache = await res.json();
    if (!_manifestCache || !Array.isArray(_manifestCache.samples)) {
      _manifestCache = { version: 1, samples: [] };
    }
    return _manifestCache;
  } catch {
    return { version: 1, samples: [] };
  }
}

/** マニフェストの再読込（追加した直後にUIへ反映したい時に呼ぶ） */
export function invalidateStyleManifestCache() {
  _manifestCache = null;
}

/**
 * 画像のdataURLを localStorage に収まるサイズに圧縮（リサイズ＋JPEG再エンコード）
 * 既定: 長辺800px / JPEG q0.8 → 1枚あたり 30-50KB 程度
 */
export async function compressImageDataUrl(dataUrl, maxSide = 800, quality = 0.8) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('image decode failed'));
      i.src = dataUrl;
    });
    const W = img.naturalWidth, H = img.naturalHeight;
    const ratio = Math.min(1, maxSide / Math.max(W, H));
    const w = Math.max(1, Math.round(W * ratio));
    const h = Math.max(1, Math.round(H * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } catch (e) {
    console.warn('[aiImageGen] compressImageDataUrl failed, returning original:', e);
    return dataUrl;
  }
}

/** サンプル画像のスコアリング（カテゴリ一致=3点 / キーワード=1点） */
function scoreSample(sample, haystackLower) {
  let s = 0;
  for (const cat of (sample.categories || [])) {
    if (haystackLower.includes(String(cat).toLowerCase())) s += 3;
  }
  for (const kw of (sample.keywords || [])) {
    if (haystackLower.includes(String(kw).toLowerCase())) s += 1;
  }
  return s;
}

/** 料理名・食材名からマッチするサンプルを最大N枚返す */
async function pickAutoSamples(dishName, ingNames, maxN = 2) {
  const m = await loadManifest();
  const samples = m.samples || [];
  if (samples.length === 0) return [];
  const haystack = (String(dishName) + ' ' + ingNames.join(' ')).toLowerCase();
  const scored = samples.map(s => ({ s, score: scoreSample(s, haystack) }));
  scored.sort((a, b) => b.score - a.score);
  const positive = scored.filter(x => x.score > 0).slice(0, maxN);
  if (positive.length > 0) return positive.map(x => ({ ...x.s, _score: x.score }));
  // ヒット無し → "default" カテゴリのサンプルがあれば1枚だけ採用
  const def = scored.find(x => (x.s.categories || []).includes('default'));
  return def ? [{ ...def.s, _score: 0 }] : [];
}

/** URLから画像を取得し、長辺指定でリサイズして base64 化（Gemini入力ペイロード削減） */
async function urlToResizedBase64(url, maxSide = 1024, quality = 0.9) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error('sample fetch failed: ' + res.status);
  const blob = await res.blob();
  return blobToResizedBase64(blob, maxSide, quality);
}

/** base64 dataURL を Canvas で再エンコード・リサイズ */
async function base64DataUrlToResized(dataUrl, maxSide = 1024, quality = 0.9) {
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('image decode failed'));
    i.src = dataUrl;
  });
  const W = img.naturalWidth, H = img.naturalHeight;
  const ratio = Math.min(1, maxSide / Math.max(W, H));
  if (ratio === 1) {
    const [meta, b64] = dataUrl.split(';base64,');
    return { mime: (meta.split(':')[1] || 'image/jpeg'), base64: b64 };
  }
  const w = Math.round(W * ratio), h = Math.round(H * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  const out = canvas.toDataURL('image/jpeg', quality);
  const [, b64] = out.split(';base64,');
  return { mime: 'image/jpeg', base64: b64 };
}

async function blobToResizedBase64(blob, maxSide = 1024, quality = 0.9) {
  // createImageBitmap 優先、失敗時 HTMLImageElement にフォールバック
  let drawSrc, W, H;
  try {
    const bmp = await createImageBitmap(blob);
    drawSrc = bmp; W = bmp.width; H = bmp.height;
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('image decode failed'));
        i.src = url;
      });
      drawSrc = img; W = img.naturalWidth; H = img.naturalHeight;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const ratio = Math.min(1, maxSide / Math.max(W, H));
  const w = Math.round(W * ratio), h = Math.round(H * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(drawSrc, 0, 0, w, h);
  const out = canvas.toDataURL('image/jpeg', quality);
  const [, b64] = out.split(';base64,');
  return { mime: 'image/jpeg', base64: b64 };
}

// 日本語料理名 → 英語フォールバック辞書
const FALLBACK_DICT = [
  { match: ['ぬか漬け', '漬物', 'ピクルス'], en: 'Japanese rice bran pickled vegetables' },
  { match: ['サラダ'], en: 'fresh garden salad' },
  { match: ['味噌汁', 'ポタージュ', 'スープ', '汁'], en: 'creamy bowl of soup' },
  { match: ['酢豚', 'すぶた'], en: 'Chinese sweet and sour pork' },
  { match: ['黒酢豚'], en: 'Chinese black vinegar pork' },
  { match: ['ハンバーグ'], en: 'salisbury steak hamburger' },
  { match: ['天ぷら', 'てんぷら'], en: 'tempura with crisp golden batter' },
  { match: ['焼き魚', '塩焼き', '西京焼き'], en: 'grilled fish fillet' },
  { match: ['煮物', '煮付け'], en: 'Japanese simmered vegetables' },
  { match: ['カレー'], en: 'Japanese curry rice' },
  { match: ['パスタ', 'スパゲッティ', 'ペペロンチーノ'], en: 'pasta dish' },
  { match: ['ピザ'], en: 'thin crust pizza' },
  { match: ['丼', 'どんぶり'], en: 'rice bowl topped with savory ingredients' },
  { match: ['寿司', 'すし', '巻き'], en: 'Japanese sushi pieces' },
  { match: ['酢の物'], en: 'vinegared cucumber salad' },
  { match: ['黒酢'], en: 'black vinegar Japanese dish' },
  { match: ['餃子'], en: 'pan fried Japanese gyoza dumplings' },
  { match: ['親子丼'], en: 'Japanese chicken and egg rice bowl' },
  { match: ['炊き込み', '混ぜご飯', 'ご飯', 'ごはん'], en: 'mixed rice with vegetables' },
  { match: ['麺', 'うどん', 'そば', 'ラーメン'], en: 'Japanese noodle bowl' },
  { match: ['卵焼き', '玉子焼き', 'だし巻き'], en: 'Japanese rolled omelet' },
  { match: ['味噌'], en: 'miso based Japanese dish' },
  { match: ['豆腐'], en: 'silken tofu dish' }
];
function dishNameToFallbackEnglish(dishName) {
  for (const { match, en } of FALLBACK_DICT) {
    if (match.some(m => dishName.includes(m))) return en;
  }
  return 'organic Japanese dish';
}

function sanitizePrompt(s) {
  let t = (s || '').toString();
  t = t.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
  t = t.replace(/[,:;()\[\]\{\}<>"'`]/g, ' ').replace(/\s+/g, ' ').trim();
  return t;
}
function clampWords(s, max) {
  const words = s.split(/\s+/).filter(Boolean);
  return words.length > max ? words.slice(0, max).join(' ') : words.join(' ');
}

/** Gemini に頼らない無料パスのプロンプト合成 */
function buildFallbackPrompt(dishName, ingredientList, picks) {
  const fallback = dishNameToFallbackEnglish(dishName);
  const hint = (picks[0] && picks[0].promptHints) || 'top 30 degree angle soft natural lighting plain neutral background';
  // 食材英訳は行わず、プロンプトは料理ラベル + 配合説明 + サンプル英語ヒントで簡潔に
  return clampWords(sanitizePrompt(
    `plain neutral background single ceramic plate containing ${fallback} ${hint} minimal food catalog photography`
  ), 25);
}

/**
 * メイン: メニュー画像を生成して base64 で返す
 *
 * @param {object} args
 * @param {string} args.dishName - 料理名（必須）
 * @param {Array<{ingredientId:string, amount:number}>} args.recipeItems - レシピ配合
 * @param {Array<{id:string,name:string}>} args.ingredients - 原材料マスター
 * @param {string} [args.geminiApiKey] - Gemini APIキー（任意。無くても動く）
 * @param {string} [args.manualSampleDataUrl] - 手動アップロードしたサンプル画像(base64 dataURL)。あれば自動選定より優先
 * @param {(msg:string)=>void} [args.onProgress] - 進捗コールバック
 * @returns {Promise<{imageDataUrl:string, seed:number, prompt:string, usedSamples:Array, mode:'gemini'|'free'}>}
 */
export async function generateMenuImage({
  dishName,
  recipeItems,
  ingredients,
  geminiApiKey,
  manualSampleDataUrl,
  onProgress
}) {
  const log = (m) => { if (onProgress) onProgress(m); };
  if (!dishName || !dishName.trim()) throw new Error('料理名を入力してください。');
  dishName = dishName.trim();

  const ingMap = new Map((ingredients || []).map(i => [i.id, i]));
  const ingDetails = (recipeItems || []).map(it => {
    const ing = ingMap.get(it.ingredientId);
    return ing ? { name: ing.name, amount: Number(it.amount) || 0 } : null;
  }).filter(Boolean);
  const ingNames = ingDetails.map(d => d.name);
  const ingredientList = ingDetails.map(d => `${d.name} (${d.amount}g)`).join(', ');

  // ── サンプル選定（手動が最優先、無ければサーバーから自動） ──
  // 最良の参照画像（先頭）は image-to-image の入力に使う
  const geminiImageParts = [];
  const usedSamples = [];
  let pickedManifestEntries = [];
  let primaryReferenceBase64 = null;
  let primaryReferenceMime = 'image/jpeg';

  if (manualSampleDataUrl) {
    log('手動アップロードのサンプルを読込中…');
    try {
      const { mime, base64 } = await base64DataUrlToResized(manualSampleDataUrl, 1024, 0.9);
      geminiImageParts.push({ inlineData: { mimeType: mime, data: base64 } });
      usedSamples.push({ source: 'manual', label: '手動アップロード' });
      primaryReferenceBase64 = base64;
      primaryReferenceMime = mime;
    } catch (e) {
      console.warn('[aiImageGen] manual sample resize failed:', e);
    }
  } else {
    log('サーバーサンプルから自動選定中…');
    const picks = await pickAutoSamples(dishName, ingNames, 2);
    pickedManifestEntries = picks;
    for (const [idx, p] of picks.entries()) {
      try {
        const url = `/style-samples/${p.file}`;
        const { mime, base64 } = await urlToResizedBase64(url, 1024, 0.9);
        geminiImageParts.push({ inlineData: { mimeType: mime, data: base64 } });
        usedSamples.push({ source: 'server', label: p.id || p.file, score: p._score });
        if (idx === 0) {
          primaryReferenceBase64 = base64;
          primaryReferenceMime = mime;
        }
      } catch (e) {
        console.warn('[aiImageGen] server sample load failed:', p, e);
      }
    }
  }

  // ── 経路A：真の image-to-image（Gemini 2.5 Flash Image / nano-banana） ──
  // 参照画像があり Gemini キーもある場合に最優先で試す。
  // サンプルの皿・テーブル・小鉢・光・構図を維持しつつ、料理本体だけを差し替える。
  // 失敗時は経路Bへフォールバック。
  if (geminiApiKey && primaryReferenceBase64) {
    log('Gemini Image で参照画像を編集中（image-to-image）…');
    try {
      const edited = await geminiEditImage({
        apiKey: geminiApiKey,
        dishName,
        ingredientList,
        referenceBase64: primaryReferenceBase64,
        referenceMime: primaryReferenceMime
      });
      log(`完了（Gemini image-to-image / ${edited.model}）`);
      // localStorage 容量対策：保存前に長辺800pxへ圧縮
      const compressed = await compressImageDataUrl(edited.dataUrl, 800, 0.85);
      return {
        imageDataUrl: compressed,
        seed: 0,
        prompt: `(Gemini ${edited.model} による参照画像の編集)`,
        usedSamples,
        mode: 'gemini-image',
        model: edited.model
      };
    } catch (e) {
      console.warn('[aiImageGen] Gemini Image failed, falling back to text-to-image:', e?.message || e);
      // 続けて経路Bを試す
    }
  }

  // ── プロンプト生成 ──
  let cleanPrompt = '';
  let mode = 'free';
  if (geminiApiKey) {
    log('Gemini でスタイル抽出・プロンプト生成中…');
    const baseInstruction =
`You are a world class prompt engineer for AI image generation (FLUX).
Generate a SHORT food catalog photography prompt in English (max 22 words).

RULES:
1. Output MUST be 22 words or less. Plain English words separated by single spaces. NO commas colons brackets or other symbols.
2. The dish: "${dishName}". CRITICAL: You MUST ONLY depict the exact ingredients listed here: "${ingredientList}". Do NOT draw any other ingredients, sauces, herbs, or garnishes even if they are traditionally part of the dish.
3. The image MUST be on a plain neutral background with one ceramic plate or bowl. NO cutlery napkins tablecloth windows hands or background clutter.
4. Translate Japanese culinary terms into descriptive English when needed.
5. Output ONLY the raw prompt string. No preface no markdown no explanation.`;

    const styleRefBlock = geminiImageParts.length > 0
      ? `\n\nThe attached ${geminiImageParts.length} image${geminiImageParts.length > 1 ? 's are' : ' is a'} STYLE REFERENCE ONLY. Extract plate shape color material, camera angle, lighting and plating density. IGNORE the actual dish shown in the reference${geminiImageParts.length > 1 ? 's' : ''}. The generated prompt must produce a NEW image of "${dishName}" using ONLY the listed ingredients but rendered in that visual style.`
      : '';

    const parts = [{ text: baseInstruction + styleRefBlock }, ...geminiImageParts];

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) }
      );
      if (res.ok) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          cleanPrompt = clampWords(sanitizePrompt(raw), 22);
          if (cleanPrompt) mode = 'gemini';
        }
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || '';
        if (msg.includes('are blocked') || /referer|referrer|PERMISSION_DENIED/i.test(msg)) {
          console.warn('[aiImageGen] Gemini blocked by HTTP referrer restriction. Falling back to free prompt.');
        } else {
          console.warn('[aiImageGen] Gemini error, falling back:', msg);
        }
      }
    } catch (e) {
      console.warn('[aiImageGen] Gemini call failed, falling back:', e);
    }
  }

  if (!cleanPrompt) {
    cleanPrompt = buildFallbackPrompt(dishName, ingredientList, pickedManifestEntries);
    mode = 'free';
  }

  // ── 画像生成（Pollinations, 無料） ──
  // FLUX は匿名Tierで制限されることがあるため turbo を既定にし、turbo で失敗時に flux へフォールバック
  const seed = Math.floor(Math.random() * 1_000_000);
  const { blob, model: usedModel } = await fetchPollinationsImage(cleanPrompt, seed, log);

  const rawDataUrl = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result);
    reader.onerror = () => rej(new Error('画像のBase64変換に失敗しました'));
    reader.readAsDataURL(blob);
  });

  // localStorage 容量対策：保存前に圧縮
  const dataUrl = await compressImageDataUrl(rawDataUrl, 800, 0.85);

  log('完了');
  return { imageDataUrl: dataUrl, seed, prompt: cleanPrompt, usedSamples, mode, model: usedModel };
}

/**
 * Gemini 2.5 Flash Image による参照画像の編集（真の image-to-image）
 * サンプル画像の皿・テーブル・小鉢・光・構図を保持しつつ、料理の中身だけを
 * 指定食材に差し替える。新しいモデル名と古いモデル名の両方を順に試行。
 *
 * @returns {Promise<string>} 生成画像の base64 dataURL
 */
async function geminiEditImage({ apiKey, dishName, ingredientList, referenceBase64, referenceMime }) {
  // モデル候補（推奨順）。1つ目で200なら確定、404/未対応時のみ次を試行
  // gemini-2.5-flash-image は2024-2025年の "nano-banana" として一般提供されている画像編集モデル
  const MODELS = [
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp-image-generation',
    'gemini-2.0-flash-exp'
  ];

  // 編集指示プロンプト：サンプルから何を保持し、何を変えるかを厳密に指定
  // ※モデルが入力画像を確実に編集対象として扱うよう、"edit"・"keep the same image"・"do not regenerate from scratch"
  //   を強く繰り返す
  const instruction =
`TASK: Generate a new food photograph using the attached image strictly as a REFERENCE for the plate shape, camera angle, and plating atmosphere. Do NOT keep the food or ingredients from the attached image.

STRICT CONSTRAINTS (YOU MUST FOLLOW THESE):
1. REFERENCE ONLY: Use the attached image ONLY to reference the plate shape, camera angle, and plating atmosphere. Do NOT use any ingredients, food, or sauces from the sample image.
2. INGREDIENTS: You must STRICTLY consist ONLY of these ingredients:
   [ ${ingredientList} ]
3. NO HALLUCINATION: Do NOT draw any common ingredients, sauces, herbs, or garnishes associated with "${dishName}" if they are not explicitly listed in the list above. Absolutely no exceptions.
4. DISH NAME: The core concept is "${dishName}", but ONLY constructed using the allowed ingredients.

OUTPUT: a photorealistic food image.`;

  let lastError = null;

  for (const model of MODELS) {
    console.log(`[aiImageGen] Gemini Image: trying model "${model}" ...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
      contents: [{
        parts: [
          { text: instruction },
          { inlineData: { mimeType: referenceMime || 'image/jpeg', data: referenceBase64 } }
        ]
      }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        temperature: 0.2 // 編集忠実度を優先（低いほど参照に近い）
      }
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${res.status}`;
        console.warn(`[aiImageGen] Gemini Image "${model}" failed: HTTP ${res.status} — ${msg}`);
        lastError = new Error(`${model}: ${msg}`);
        // モデル未対応・モデル不在の時だけ次候補へ
        if (res.status === 404 || /not found|unsupported|not.*support/i.test(msg)) {
          continue;
        }
        // それ以外のエラーは打ち切り（レート制限・無効キー・参照制限など）
        throw lastError;
      }
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      for (const p of parts) {
        if (p.inlineData && p.inlineData.data) {
          const mime = p.inlineData.mimeType || 'image/png';
          console.log(`[aiImageGen] Gemini Image: success with model "${model}"`);
          return { dataUrl: `data:${mime};base64,${p.inlineData.data}`, model };
        }
      }
      // 200だが画像パートが無い（安全フィルタ等）→ 別モデルは試さず終了
      const finishReason = data?.candidates?.[0]?.finishReason;
      throw new Error(`${model}: 画像を含む応答がありませんでした (finishReason=${finishReason || 'unknown'})`);
    } catch (e) {
      lastError = e;
      // 404系のみ次候補。それ以外は即時 throw
      if (!/404|not found|unsupported|not.*support/i.test(String(e.message))) {
        throw e;
      }
    }
  }
  throw lastError || new Error('Gemini Image: 利用可能なモデルが見つかりませんでした');
}

/**
 * pollinations.ai から画像を取得（モデル自動フォールバック付き）
 *
 * 重要: pollinations.ai は 2024〜2025 にかけて Cloudflare Turnstile を導入し、
 * ブラウザの Origin/Referer ヘッダが付いたリクエストを 403 で拒否します。
 * このため、Vite 開発サーバーの `/pollinations-proxy` を経由して
 * サーバーサイドからアクセスし、Turnstile を回避しています。
 *
 * 本番環境では `/pollinations-proxy/...` を pollinations.ai に転送する
 * サーバーレス関数（例：Cloudflare Workers, Vercel Function）を用意してください。
 */
async function fetchPollinationsImage(prompt, seed, log) {
  const MODELS = ['turbo', 'flux']; // turbo を既定、ダメなら flux
  const baseParams = `width=768&height=768&nologo=true&seed=${seed}&referrer=jasteria`;
  // ブラウザでは proxy 経由、SSR/Node では直接アクセス
  const POLLINATIONS_BASE = '/pollinations-proxy';
  let lastError = null;

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    log(`画像生成中（Pollinations ${model}）…`);
    const url =
      `${POLLINATIONS_BASE}/prompt/${encodeURIComponent(prompt)}` +
      `?${baseParams}&model=${model}`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) {
        const body = await r.text().catch(() => '');
        lastError = { status: r.status, body: body.slice(0, 240), model };
        console.warn(`[aiImageGen] pollinations ${model} HTTP ${r.status}:`, lastError.body);
        // 403/429/5xx は別モデルで再試行
        if ([402, 403, 408, 429, 500, 502, 503, 504].includes(r.status)) {
          await new Promise(res => setTimeout(res, 1500));
          continue;
        }
        // それ以外のエラーは打ち切り
        throw new Error(`画像生成APIエラー: HTTP ${r.status}`);
      }
      const blob = await r.blob();
      // 2KB未満は実体ファイルでない可能性（キュー溢れJSON等）。本文をのぞいて判定
      if (blob.size < 2048) {
        const txt = await blob.text().catch(() => '');
        let queueMsg = null;
        try { const j = JSON.parse(txt); if (j && j.error) queueMsg = j.error; } catch {}
        lastError = { status: 200, body: queueMsg || txt.slice(0, 240), model };
        console.warn(`[aiImageGen] pollinations ${model} returned small body:`, lastError.body);
        await new Promise(res => setTimeout(res, 1500));
        continue;
      }
      return { blob, model };
    } catch (e) {
      if (e.name === 'AbortError') {
        lastError = { status: 'timeout', body: '60秒以内に応答がありません', model };
        console.warn(`[aiImageGen] pollinations ${model} timeout`);
        continue;
      }
      lastError = { status: 'network', body: String(e.message || e), model };
      console.warn(`[aiImageGen] pollinations ${model} fetch failed:`, e);
    } finally {
      clearTimeout(timer);
    }
  }

  // 全モデル失敗
  const tail = lastError ? `（HTTP ${lastError.status} on ${lastError.model}: ${lastError.body}）` : '';
  if (lastError && lastError.body && (lastError.body.includes('Queue full') || lastError.body.includes('queued'))) {
    throw new Error(`画像生成サービスが混雑中（同一IPからのキューが溢れています）。30秒〜1分ほど待って再試行してください。${tail}`);
  }
  if (lastError && [402, 403].includes(lastError.status)) {
    throw new Error(`画像生成サービスから拒否されました。匿名Tierの制限の可能性があります。少し時間をおいて再試行してください。${tail}`);
  }
  if (lastError && lastError.status === 429) {
    throw new Error(`画像生成のレート制限に達しました。1〜2分待って再試行してください。${tail}`);
  }
  throw new Error(`画像生成に失敗しました。${tail}`);
}
