export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;

    // 1. 無料で確実に動く「公式のLlama-3」を指定します
    // (これならエラーが出ません)
    const MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct";
    
    // APIのURL（OpenAI互換）
    const API_URL = "https://api-inference.huggingface.co/models/" + MODEL_ID + "/v1/chat/completions";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          // ★ ここで「性格」と「役割」を注入します（これであなたのモデルと同じ動きをします）
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

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `API Error: ${response.status} - ${errorText}` }), { status: 500 });
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