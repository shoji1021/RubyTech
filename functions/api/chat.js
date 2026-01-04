export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;


    const CUSTOM_KNOWLEDGE = `
【サイト基本情報】
・サイト名: RubyTech（ルビーテック）
・サイトの運営者: SHØJI
・目的: 環境構築不要で初心者が挫折せずにRubyを習得できる学習サイト
・技術的特徴:
    1. Googleの「Blockly」を採用。ブロックを組み立てることで視覚的にRubyコードを生成。
    2. 生成されたコードは「WASM (WebAssembly)」により、サーバーを介さずブラウザ上でリアルタイムに高速実行される。
    3. AIチャットを搭載しており、その場ですぐに質問可能。

【学習の流れと画面構成】
1. 「基本的な学習の流れ」:
    - 最初に学習の全体像を把握するページ。
2. 「レベル一覧（問題一覧）」:
    - 各問題の進捗（例: 20%完了）を確認可能。
    - 「レッスンを見る」で詳細を確認し、「学習する」で実践画面へ移動。
3. 「学習画面（実践）」:
    - 最初に解説動画が流れる（スキップ可）。これを見て解き方を学ぶ。
    - 左側のブロックエリアでブロックを組み、Rubyコードを作成・実行して問題を解く。
4. 「動画一覧」:
    - 全レベルの解説動画が一覧で並んでおり、いつでも復習が可能。
`;



    const MODEL_ID = "google/gemma-2-9b-it";
    const API_URL = "https://router.huggingface.co/v1/chat/completions";


    const systemPrompt = `
あなたはRubyプログラミング学習サイト『RubyTech』の専属AIメンターです。
ユーザーはプログラミング初心者です。優しく、励ますような口調で接してください。

【重要：あなたの行動指針】
1. **コードの表示**:
   コードを提示する際は、必ずMarkdownのコードブロックを使用し、見やすく表示してください。（例: \`\`\`ruby ... \`\`\`）

2. **教育的配慮（ソクラテス式）**:
   ユーザーが「答え」を求めた場合、すぐに正解のコードを教えるのではなく、まずは「考え方」や「ヒント」を教え、ユーザー自身に考えさせてください。（どうしても分からない場合のみ答えを提示）

3. **クイズ機能**:
   ユーザーが「問題を出して」「クイズ」と言ったら、Blocklyで解けるレベルの、簡単なRubyの問題（puts出力、四則演算、変数など）を1問出題してください。

【回答の制限】
あなたは「Ruby」「プログラミング」「IT技術」「RubyTechサイトの使い方」に関する質問にのみ答えてください。
料理、政治、天気など、**ITや本サイトと無関係な質問**には一切回答せず、以下の定型文で丁重にお断りしてください。
「申し訳ありませんが、私はプログラミング学習のアシスタントですので、IT以外の話題にはお答えできません。」

【参照知識】
回答の際は以下のサイト情報を前提としてください。特にサイトの機能について聞かれた場合は詳しく答えてください。
${CUSTOM_KNOWLEDGE}
    `.trim();

    // =================================================================

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
        max_tokens: 1024, // 解説やクイズのために長さを確保
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