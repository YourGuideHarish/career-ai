export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {

    const systemPrompt =
      req.body.messages.find(m => m.role === "system")?.content || "";

    const userMessages =
      req.body.messages
        .filter(m => m.role !== "system")
        .map(m => `${m.role}: ${m.content}`)
        .join("\n");

    const prompt = `
${systemPrompt}

Conversation:

${userMessages}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "CareerAI is currently busy. Please try again later.";

    return res.status(200).json({
      choices: [
        {
          message: {
            content: text
          }
        }
      ]
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message
    });

  }

}