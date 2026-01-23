export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;

    // --- 設定部分 ---
    // Gemma 2 9B 専用のURLを指定（routerではなく直接モデルのエンドポイントを叩く）
    const API_URL = "https://api-inference.huggingface.co/models/google/gemma-2-9b-it/v1/chat/completions";
    
    // サイト情報（ここは元のまま）
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

    // システムプロンプト（内容は元のまま）
    const systemInstruction = `
あなたはRubyプログラミング学習サイト『RubyTech』の専属AIメンターです。
ユーザーは初心者です。優しく励ます口調で接してください。
Markdownコードブロックを使用し、答えをすぐに教えずヒントを出してください。
「問題を出して」と言われたら簡単なRubyクイズを出してください。
ITや本サイト以外の質問には答えず断ってください。
参照知識: ${CUSTOM_KNOWLEDGE}
    `.trim();

    // 【重要修正】Gemmaは "system" role が苦手な場合があるため、
    // ユーザーのメッセージの先頭に「命令」として結合して送ります。
    const combinedMessage = `${systemInstruction}\n\n----------\n\nユーザーの質問: ${message}`;

    // --- APIリクエスト ---
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // model: "..." はURLで指定しているので不要
        messages: [
          // role: "system" を使わず、userのメッセージとして送る
          { role: "user", content: combinedMessage }
        ],
        max_tokens: 512, // 無料枠での安定性のため少し減らします
        stream: false
      }),
    });

    // --- エラー処理（チャット画面にエラー内容を表示するデバッグモード） ---
    if (!response.ok) {
        const errorText = await response.text();
        // ここでエラー内容を「AIの返事」として返します
        // これでチャット画面に「何が悪いか」が英語で表示されます
        return new Response(JSON.stringify({ 
            reply: `【システムエラー】\nHugging Face APIから以下のエラーが返ってきました:\n\n${errorText}\n\n(ステータスコード: ${response.status})`
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