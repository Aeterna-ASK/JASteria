const fs = require('fs');
const path = require('path');
const https = require('https');

const FIREBASE_PROJECT_ID = "organiclog-2f6c7"; // 同一プロジェクトを使用
const CRED_FILE = path.join(__dirname, 'mail_credentials.json'); // 同階層に保存

// 永久固定アドレス用の認証情報
let EMAIL_ADDRESS = null;
let EMAIL_PASSWORD = null;
let JWT_TOKEN = null;

/**
 * httpsリクエストをPromise化するヘルパー（Firestore同期用）
 */
function request(url, options = {}, payload = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 JASAGRI-Restaurant-Mail-Gateway/1.0.0',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (payload) {
      req.write(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }
    req.end();
  });
}

/**
 * 添付ファイルをレストラン用Firestoreドキュメントへ同期（PATCH）
 */
async function uploadToFirestore(fileName, base64Data, contentType) {
  const docUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/restaurants/default`;
  const fileUrl = `data:${contentType};base64,${base64Data}`;
  
  console.log(`[ONLINE MAIL] Firestoreの既存データと同期中...`);
  const getRes = await request(docUrl);
  let inboxDocs = [];
  let existingFields = {};

  if (getRes.statusCode === 200) {
    const docData = JSON.parse(getRes.body.toString());
    existingFields = docData.fields || {};
    try {
      if (existingFields.t_inbox_documents && existingFields.t_inbox_documents.arrayValue && existingFields.t_inbox_documents.arrayValue.values) {
        inboxDocs = existingFields.t_inbox_documents.arrayValue.values;
      }
    } catch (e) {
      console.log('[ONLINE MAIL] 既存ドキュメントが空、またはパースエラーです。新規作成します。');
    }
  } else if (getRes.statusCode === 404) {
    console.log('[ONLINE MAIL] ドキュメント restaurants/default が存在しません。新規作成します。');
  } else {
    console.error('[ONLINE MAIL] Firestoreデータの取得に失敗しました:', getRes.statusCode, getRes.body.toString());
    return;
  }

  const receivedDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 16);
  const isCert = fileName.toLowerCase().includes('cert') || fileName.includes('証明') || fileName.includes('jas');
  
  const newDocValue = {
    mapValue: {
      fields: {
        id: { stringValue: `mail_${Date.now()}_${Math.floor(Math.random()*1000)}` },
        fileName: { stringValue: fileName },
        fileUrl: { stringValue: fileUrl },
        receivedAt: { stringValue: receivedDate },
        status: { stringValue: 'unread' },
        suggestedType: { stringValue: isCert ? 'マスタ証明書' : '納品書' },
        parsedData: {
          mapValue: {
            fields: {
              date: { stringValue: receivedDate.split(' ')[0] },
              partnerName: { stringValue: '' },
              items: {
                arrayValue: {
                  values: [
                    {
                      mapValue: {
                        fields: {
                          ingredientName: { stringValue: isCert ? '有機JAS適合食材' : '' },
                          type: { stringValue: isCert ? 'organic' : 'general' },
                          quantity: { stringValue: '1' },
                          unit: { stringValue: 'kg' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    }
  };

  inboxDocs.push(newDocValue);

  // PATCHアップデートデータの構築
  const patchData = {
    fields: {
      ...existingFields,
      t_inbox_documents: {
        arrayValue: {
          values: inboxDocs
        }
      }
    }
  };

  const patchRes = await request(`${docUrl}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    }
  }, patchData);

  if (patchRes.statusCode === 200) {
    console.log(`====================================================`);
    console.log(`🎉 [ONLINE MAIL] レストラン専用スキャン受信に成功！`);
    console.log(`- ファイル名: ${fileName}`);
    console.log(`- 受信時刻: ${receivedDate}`);
    console.log(`画面上の「スキャン受信箱」にリアルタイムで自動出現・同期されます。`);
    console.log(`====================================================`);
  } else {
    console.error('[ONLINE MAIL] Firestoreへのアップロードに失敗しました:', patchRes.statusCode, patchRes.body.toString());
  }
}

/**
 * 永続的なレストラン専用固定メールアカウントを発行または読み込み
 */
async function initMailAccount() {
  console.log(`[ONLINE MAIL] レストラン専用・永久不滅のメールインフラ（Mail.tm）を準備中...`);

  if (fs.existsSync(CRED_FILE)) {
    const creds = JSON.parse(fs.readFileSync(CRED_FILE, 'utf8'));
    EMAIL_ADDRESS = creds.address;
    EMAIL_PASSWORD = creds.password;
    console.log(`[ONLINE MAIL] 既存の固定アカウントを読み込みました: ${EMAIL_ADDRESS}`);
  } else {
    console.log(`[ONLINE MAIL] レストラン用の新規の固定アカウントを作成しています...`);
    const domainRes = await fetch('https://api.mail.tm/domains');
    if (!domainRes.ok) throw new Error('ドメイン取得失敗');
    const domains = await domainRes.json();
    const domain = domains['hydra:member'][0].domain;

    EMAIL_ADDRESS = `jas-restaurant-${Date.now()}-${Math.floor(Math.random()*100)}@${domain}`;
    EMAIL_PASSWORD = `pass${Date.now()}`;

    const createRes = await fetch('https://api.mail.tm/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: EMAIL_ADDRESS, password: EMAIL_PASSWORD })
    });
    if (!createRes.ok) throw new Error('アカウント作成失敗: ' + await createRes.text());
    
    fs.writeFileSync(CRED_FILE, JSON.stringify({ address: EMAIL_ADDRESS, password: EMAIL_PASSWORD }));
    console.log(`[ONLINE MAIL] レストラン用の新規固定アカウントを発行・保存しました！`);
  }

  await refreshMailToken();
  console.log(`[ONLINE MAIL] 準備完了！`);
  console.log(`====================================================`);
  console.log(`📬 レストラン専用・クラウドメール連携 稼働開始！`);
  console.log(`- 【完全固定・本番用 送信先アドレス】: ${EMAIL_ADDRESS}`);
  console.log(`- 複合機の「アドレス帳」にこのアドレスを登録してください。`);
  console.log(`- 起動するたびにアドレスが変わることは二度とありません！`);
  console.log(`====================================================`);
}

async function refreshMailToken() {
  const tokenRes = await fetch('https://api.mail.tm/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: EMAIL_ADDRESS, password: EMAIL_PASSWORD })
  });
  if (!tokenRes.ok) throw new Error('トークン取得失敗');
  const data = await tokenRes.json();
  JWT_TOKEN = data.token;
}

/**
 * Mail.tmの新着メールをポーリングし、エラーを握りつぶす安定ループ
 */
async function pollEmails() {
  if (!JWT_TOKEN) return;

  try {
    const listRes = await fetch('https://api.mail.tm/messages', {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });

    if (listRes.status === 401) {
      await refreshMailToken();
      return;
    }
    
    if (!listRes.ok) {
      return;
    }

    const listData = await listRes.json();
    const messages = listData['hydra:member'] || [];

    for (const msg of messages) {
      console.log(`[ONLINE MAIL] 新着メールを検知！ (ID: ${msg.id})`);
      console.log(`- 送信元: ${msg.from.address}`);

      if (msg.hasAttachments) {
        const msgRes = await fetch(`https://api.mail.tm/messages/${msg.id}`, {
          headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
        });
        if (!msgRes.ok) continue;
        
        const msgDetails = await msgRes.json();
        const attachments = msgDetails.attachments || [];

        for (const att of attachments) {
          const fileName = att.filename || att.name || `scan_file_${Date.now()}.pdf`;
          const contentType = att.contentType || 'application/pdf';

          console.log(`- 添付ファイル検出: ${fileName} (${contentType})。ダウンロード中...`);
          
          const attRes = await fetch(`https://api.mail.tm/messages/${msg.id}/attachment/${att.id}`, {
            headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
          });
          
          if (attRes.ok) {
            const arrayBuffer = await attRes.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            await uploadToFirestore(fileName, base64Data, contentType);
          } else {
            console.error(`- 添付ファイルのダウンロードに失敗しました:`, attRes.status);
          }
        }
      } else {
        console.log(`- 添付ファイル（PDF/画像）が検出されませんでした。`);
      }

      // 処理完了したメールを削除
      await fetch(`https://api.mail.tm/messages/${msg.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      });
      console.log(`- 処理済みメールをサーバーから削除しました。`);
    }
  } catch (err) {
    // ネットワーク一時エラーは完全に握りつぶす
  }
}

/**
 * メインループ
 */
async function start() {
  try {
    await initMailAccount();
    
    // 6秒おきに超安定ポーリング
    setInterval(pollEmails, 6000);
  } catch (e) {
    console.error("[ONLINE MAIL] 起動エラー:", e);
  }
}

start();
