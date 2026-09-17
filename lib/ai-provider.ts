export type AIProvider = "openai" | "gemini" | "anthropic";
export type AICredentials = { provider: AIProvider; key: string };

const PROVIDERS: AIProvider[] = ["openai", "gemini", "anthropic"];
const MODELS: Record<AIProvider, string> = {
  openai: "gpt-5.6-luna",
  gemini: "gemini-3.8-flash",
  anthropic: "claude-sonnet-4-6",
};

function validKey(provider: AIProvider, key: string) {
  if (!key || key.length > 512 || /[\r\n]/u.test(key)) return false;
  if (provider === "openai") return key.startsWith("sk-");
  if (provider === "gemini") return key.startsWith("AIza");
  return key.startsWith("sk-ant-");
}

export function resolveAICredentials(request: Request): AICredentials | null {
  const requestedProvider = request.headers.get("x-ai-provider");
  const requestKey = request.headers.get("x-ai-api-key")?.trim() ?? "";
  if (PROVIDERS.includes(requestedProvider as AIProvider) && validKey(requestedProvider as AIProvider, requestKey)) {
    return { provider: requestedProvider as AIProvider, key: requestKey };
  }

  const configuredProvider = process.env.AI_PROVIDER?.toLowerCase() as AIProvider | undefined;
  const order = configuredProvider && PROVIDERS.includes(configuredProvider)
    ? [configuredProvider, ...PROVIDERS.filter((provider) => provider !== configuredProvider)]
    : PROVIDERS;
  for (const provider of order) {
    const key = process.env[provider === "openai" ? "OPENAI_API_KEY" : provider === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY"]?.trim() ?? "";
    if (validKey(provider, key)) return { provider, key };
  }
  return null;
}

async function requestJSON(credentials: AICredentials, system: string, prompt: string, image?: { mimeType: string; base64: string }) {
  const { provider, key } = credentials;
  let url: string;
  let headers: Record<string, string>;
  let body: unknown;

  if (provider === "openai") {
    url = "https://api.openai.com/v1/responses";
    headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    const content = image
      ? [{ type: "input_text", text: prompt }, { type: "input_image", image_url: `data:${image.mimeType};base64,${image.base64}` }]
      : [{ type: "input_text", text: prompt }];
    body = { model: MODELS.openai, instructions: system, input: [{ role: "user", content }], text: { format: { type: "json_object" } }, max_output_tokens: 1600 };
  } else if (provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent`;
    headers = { "x-goog-api-key": key, "Content-Type": "application/json" };
    const parts: Array<Record<string, unknown>> = [{ text: `${system}\n\n${prompt}` }];
    if (image) parts.push({ inline_data: { mime_type: image.mimeType, data: image.base64 } });
    body = { contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1600 } };
  } else {
    url = "https://api.anthropic.com/v1/messages";
    headers = { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" };
    const content: Array<Record<string, unknown>> = [];
    if (image) content.push({ type: "image", source: { type: "base64", media_type: image.mimeType, data: image.base64 } });
    content.push({ type: "text", text: `${system}\n\n${prompt}` });
    body = { model: MODELS.anthropic, max_tokens: 1600, messages: [{ role: "user", content }], output_config: { format: { type: "json" } } };
  }

  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(25000), cache: "no-store" });
  if (!response.ok) throw new Error(`${provider} API request failed (${response.status})`);
  const data: unknown = await response.json();
  if (!data || typeof data !== "object") throw new Error("AI provider returned an invalid response");
  const record = data as Record<string, unknown>;
  let text: string | undefined;
  if (provider === "openai") {
    if (typeof record.output_text === "string") text = record.output_text;
    if (!text && Array.isArray(record.output)) {
      for (const item of record.output) if (item && typeof item === "object" && Array.isArray((item as Record<string, unknown>).content)) {
        const part = ((item as Record<string, unknown>).content as Array<Record<string, unknown>>).find((entry) => entry.type === "output_text");
        if (typeof part?.text === "string") text = part.text;
      }
    }
  } else if (provider === "gemini") {
    const candidates = record.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    text = candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  } else {
    const content = record.content as Array<{ type?: string; text?: string }> | undefined;
    text = content?.find((part) => part.type === "text")?.text;
  }
  if (!text) throw new Error("AI provider returned no text");
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

export async function generateAIJSON(credentials: AICredentials, system: string, prompt: string) {
  return requestJSON(credentials, system, prompt);
}

export async function generateAIJSONWithImage(credentials: AICredentials, prompt: string, mimeType: string, base64: string) {
  return requestJSON(credentials, "Interpret the provided content carefully and follow the requested JSON format.", prompt, { mimeType, base64 });
}
