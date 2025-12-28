export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    
    // Cloudflareの環境変数からトークンを取得
    const HF_TOKEN = context.env.HF_API_TOKEN;
    const MODEL_ID = "shoji1021/rubytech-llama3-model"; // あなたのモデルID
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: message, // Llama-3用のフォーマット
        parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            return_full_text: false 
        }
      }),
    });

    const result = await response.json();

    if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), { status: 500 });
    }

    // 配列の最初の要素からテキストを取得
    const reply = result[0]?.generated_text || "返答が生成されませんでした。";

    return new Response(JSON.stringify({ reply: reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server Error: " + err.message }), { status: 500 });
  }
}