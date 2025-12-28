export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;

    // 1. 無料で確実に動く「公式のLlama-3」を指定
    const MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct";
    
    // 2. ★URLを最新の形式(router)に変更しました★
    // 旧: https://api-inference.huggingface.co/models/...
    // 新: https://router.huggingface.co/hf-inference/models/...
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}/v1/chat/completions`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          // ここで「役割」を与えます
          { 
            role: "system", 
            content: "あなたはRubyプログラミング学習サイト『RubyTech』のAIメンターです。初心者にも優しく、わかりやすく日本語でRubyについて教えてください。" 
          },
          { role: "user", content: message }
        ],
        max_tokens: 512,
        stream: false
      }),
    });

    // エラーハンドリング
    if (!response.ok) {
        const errorText = await response.text();
        // ログを見やすく整形して返す
        return new Response(JSON.stringify({ 
            error: `API Error: ${response.status}`,
            details: errorText
        }), { status: 500 });
    }

    const result = await response.json();
    const reply = result.choices[0]?.message?.content || "すみません、うまく答えられませんでした。";

    return new Response(JSON.stringify({ reply: reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server Error: " + err.message }), { status: 500 });
  }
}