export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;

    // 1. 手続き不要で、日本語に強い最強モデル「Qwen 2.5」を指定
    const MODEL_ID = "Qwen/Qwen2.5-7B-Instruct";
    
    // 2. URL（Router経由）
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

    // 3. Qwen専用の会話フォーマットを作成
    const systemPrompt = "あなたはRubyプログラミング学習サイト『RubyTech』のAIメンターです。初心者にも優しく、わかりやすく日本語でRubyについて教えてください。";
    
    // Qwenのフォーマット (ChatML形式)
    const formattedPrompt = `
<|im_start|>system
${systemPrompt}<|im_end|>
<|im_start|>user
${message}<|im_end|>
<|im_start|>assistant
`.trim();

    // 4. 送信
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: formattedPrompt,
        parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            return_full_text: false
        }
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `API Error: ${response.status}`, details: errorText }), { status: 500 });
    }

    const result = await response.json();
    
    // 配列の0番目から回答を取得
    let reply = result[0]?.generated_text || "すみません、うまく答えられませんでした。";

    return new Response(JSON.stringify({ reply: reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server Error: " + err.message }), { status: 500 });
  }
}