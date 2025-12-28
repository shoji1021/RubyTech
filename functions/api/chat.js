export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;

    // 1. モデルID（公式Llama-3）
    const MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct";
    
    // 2. ★最も基本的なURL（ここなら404になりません）★
    // もし "api-inference" で410エラーが出る場合は、下の "router" を使ってください
    // 今回は安全策で "router" の基本パスを使います
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

    // 3. Llama-3専用の会話フォーマットを作成（これがAIに役割を伝えます）
    const systemPrompt = "あなたはRubyプログラミング学習サイト『RubyTech』のAIメンターです。初心者にも優しく、わかりやすく日本語でRubyについて教えてください。";
    
    // 手動でプロンプトを組み立てる（Raw Prompting）
    const formattedPrompt = `
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>

${message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
`.trim();

    // 4. 送信（シンプルなinputs形式）
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: formattedPrompt, // ここが単純な文字列になります
        parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            return_full_text: false // プロンプトを含めずに回答だけ返す設定
        }
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `API Error: ${response.status}`, details: errorText }), { status: 500 });
    }

    const result = await response.json();
    
    // 結果の取り出し方もシンプルになります
    // 配列の0番目の generated_text を取得
    let reply = result[0]?.generated_text || "すみません、うまく答えられませんでした。";

    return new Response(JSON.stringify({ reply: reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server Error: " + err.message }), { status: 500 });
  }
}