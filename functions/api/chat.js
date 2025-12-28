export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;

    // 1. Googleの高性能モデル「Gemma 2」を使用
    // (無料枠で非常に安定しており、日本語も流暢です)
    const MODEL_ID = "google/gemma-2-9b-it";
    
    // 2. ★全モデル共通の統合URL★
    // モデルごとの個別URLではなく、ここなら404エラーは起きません
    const API_URL = "https://router.huggingface.co/v1/chat/completions";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID, // ここで使いたいモデルを指定します
        messages: [
          { 
            role: "system", 
            content: "あなたはRubyプログラミング学習サイト『RubyTech』のAIメンターです。初心者にも優しく、わかりやすく日本語でRubyについて教えてください。" 
          },
          { role: "user", content: message }
        ],
        max_tokens: 100,
        stream: false
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ 
            error: `API Error: ${response.status}`, 
            details: errorText 
        }), { status: 100 });
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