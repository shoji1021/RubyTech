export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;

    // =================================================================
    // ★独自の知識エリア（ここを大幅に強化しました）
    // =================================================================
    const CUSTOM_KNOWLEDGE = `
【サイト基本情報】
・サイト名: RubyTech（ルビーテック）
・サイトの運営者: SHØJI
・目的: 初心者が挫折せずにRubyを習得できる学習サイト
・技術的特徴（重要）:
    1. Googleの「Blockly」というサービスを採用しており、ブロックを組み立てることで視覚的にRubyのコードを生成できる。
    2. 生成されたコードは「WASM (WebAssembly)」技術により、サーバーを介さずブラウザ上でリアルタイムに高速実行される。
    3. AIチャットを搭載しており、分からないことはその場ですぐに質問できる。

【学習の流れと画面構成】
1. 「基本的な学習の流れ（学び方）」:
    - 最初にこのページで学習の全体像を把握する。
2. 「レベル一覧（問題一覧）」:
    - ここで各問題の進捗状況（20%完了など）を確認できる。
    - 「レッスンを見る」ボタンでその問題の詳細（概要）を確認できる。
    - 「学習する」ボタンで実際の実践画面へ移動する。
3. 「学習画面（実践）」:
    - ページを開くと最初に解説動画が流れる（スキップも可能）。これを見て解き方を学ぶ。
    - 動画で学んだ後、左側のブロックエリアでブロックを組み、Rubyコードを作成・実行して問題を解く。
4. 「動画一覧」:
    - 全てのレベルの解説動画が一覧で並んでいるページ。
    - ここからいつでも過去の動画を見て復習することができる。
`;
    // =================================================================

    // モデル設定（Google Gemma 2）
    const MODEL_ID = "google/gemma-2-9b-it";
    const API_URL = "https://router.huggingface.co/v1/chat/completions";

    // システムプロンプト（役割＋制限＋知識）
    const systemPrompt = `
あなたはRubyプログラミング学習サイト『RubyTech』のAIメンターです。
初心者にも優しく、わかりやすく日本語でRubyやプログラミングについて教えてください。

【重要：回答の制限】
あなたは「Ruby」「プログラミング」「IT技術」「RubyTechサイトの使い方」に関する質問にのみ答えてください。

もしユーザーから、料理、政治、恋愛、天気など、**ITや本サイトと無関係な質問**をされた場合は、
回答を生成せず、以下の定型文で丁寧に断ってください。
「申し訳ありませんが、私はプログラミング学習のアシスタントですので、IT以外の話題にはお答えできません。」

【独自知識の参照（最優先）】
ユーザーからの質問には、以下の【RubyTechサイト情報】を前提知識として踏まえて回答してください。
特に「このサイトの仕組み」や「学習の進め方」を聞かれた場合は、以下の情報を元に詳しく答えてください。

${CUSTOM_KNOWLEDGE}
    `.trim();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 512, // 回答の長さを確保
        stream: false
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ 
            error: `API Error: ${response.status}`, 
            details: errorText 
        }), { status: 500 });
    }

    const result = await response.json();
    const reply = result.choices[0]?.message?.content || "すみません、答えられませんでした。";

    return new Response(JSON.stringify({ reply: reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server Error: " + err.message }), { status: 500 });
  }
}