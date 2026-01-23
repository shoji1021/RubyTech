export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;

    // 1. URLを推奨されている「Router」に戻します
    const API_URL = "https://router.huggingface.co/v1/chat/completions";
    
    // モデルID（ここで指定します）
    const MODEL_ID = "google/gemma-2-9b-it";

    const CUSTOM_KNOWLEDGE = `
【サイト基本情報】
・サイト名: RubyTech（ルビーテック）
・サイトの運営者: SHØJI
・目的: 環境構築不要で初心者が挫折せずにRubyを習得できる学習サイト
・技術的特徴:
    1. Googleの「Blockly」を採用。視覚的にRubyコードを生成。
    2. WASMによりブラウザ上でリアルタイム実行。
    3. AIチャットを搭載。

【学習の流れ】
1. 基本的な学習の流れ
2. レベル一覧（問題一覧）
3. 学習画面（解説動画を見て、ブロックを組んで問題を解く）
4. 動画一覧
`;

    const systemInstruction = `
あなたはRubyプログラミング学習サイト『RubyTech』の専属AIメンターです。
ユーザーは初心者です。優しく励ます口調で接してください。
Markdownコードブロックを使用し、答えをすぐに教えずヒントを出してください。
「問題を出して」と言われたら簡単なRubyクイズを出してください。
ITや本サイト以外の質問には答えず断ってください。
参照知識: ${CUSTOM_KNOWLEDGE}
    `.trim();

    // 2. Gemma対策：「Systemロール」を使わず、ユーザーメッセージと合体させる
    const combinedMessage = `${systemInstruction}\n\n----------\n\nユーザーの質問: ${message}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 3. Routerを使う場合は、ここで必ずモデル名を指定する必要があります！
        model: MODEL_ID, 
        messages: [
          { role: "user", content: combinedMessage }
        ],
        max_tokens: 512,
        stream: false
      }),
    });

    // エラー時の詳細表示（デバッグ用）
    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ 
            reply: `【システムエラー】\nAPIから以下のエラーが返ってきました:\n${errorText}\n(Status: ${response.status})`
        }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    const result = await response.json();
    const reply = result.choices[0]?.message?.content || "すみません、答えられませんでした。";

    return new Response(JSON.stringify({ reply: reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ reply: `サーバー内部エラー: ${err.message}` }), { 
        headers: { "Content-Type": "application/json" }
    });
  }
}