export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;

    // ★ 最新の推奨URL（固定）
    const API_URL = "https://router.huggingface.co/v1/chat/completions";

    // ★ あなたのモデルID
    const MODEL_ID = "shoji1021/rubytech-llama3-model";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID, // ここでモデルを指定します
        messages: [
          { role: "user", content: message }
        ],
        max_tokens: 512,
        stream: false
      }),
    });

    // エラーチェック（トークン切れやモデルエラーなど）
    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `API Error: ${response.status} - ${errorText}` }), { status: 500 });
    }

    const result = await response.json();

    // ★ OpenAI互換形式なので、回答の取り出し方が変わります
    const reply = result.choices[0]?.message?.content || "返答が生成されませんでした。";

    return new Response(JSON.stringify({ reply: reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server Error: " + err.message }), { status: 500 });
  }
}