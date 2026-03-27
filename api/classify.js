export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  try {
    const { messages } = req.body;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages,
      }),
    });

    const data = await anthropicRes.json();
    console.log("[classify] anthropic status:", anthropicRes.status, "| error:", data?.error?.message || "none");

    // Always return 200 from our function — include anthropic status in body if error
    if (!anthropicRes.ok) {
      return res.status(200).json({
        error: data?.error?.message || "Anthropic API error",
        anthropic_status: anthropicRes.status,
        content: [{ text: "[]" }],
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("[classify] exception:", err.message);
    return res.status(200).json({ error: err.message, content: [{ text: "[]" }] });
  }
}
