export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();
    const HF_TOKEN = context.env.HF_API_TOKEN;

    // =================================================================
    // 独自の知識エリア
    // =================================================================
    const CUSTOM_KNOWLEDGE = `
【RubyTechサイト情報】
・サイト名: RubyTech（ルビーテック）
・運営者: SHØJI
・目的: 初心者が挫折せずにRubyを習得できること
`;
    // =================================================================

    const MODEL_ID = "google/gemma-2-9b-it";
    const API_URL = "https://router.huggingface.co/v1/chat/completions";

    // ★ここに「質問の制限」を追加しました
    const systemPrompt = `
あなたはRubyプログラミング学習サイト『RubyTech』のAIメンターです。
初心者にも優しく、わかりやすく日本語でRubyやプログラミングについて教えてください。

【重要：回答の制限】
あなたは「Ruby」「プログラミング」「IT技術」「コンピュータサイエンス」に関する質問にのみ答えてください。

もしユーザーから、料理、政治、恋愛、今日の天気など、**ITと無関係な質問**をされた場合は、
決して回答を生成せず、以下の定型文で丁寧に断ってください。
「申し訳ありませんが、私はプログラミング学習のアシスタントですので、IT以外の話題にはお答えできません。」

【独自知識の参照】
以下の情報はあなたの知識として持っておいてください。
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
        max_tokens: 512,
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