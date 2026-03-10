import Groq from 'groq-sdk';
import { GROQ_API_KEY, MODELS } from '../config.js';

// ─── Groq Helper ────────────────────────────────────────
// Shared Groq client with automatic retry + backoff
// for handling rate limits.
// ─────────────────────────────────────────────────────────

const groqClient = new Groq({ apiKey: GROQ_API_KEY });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call Groq with automatic retry on 429 rate limit errors.
 * @param {object} options
 * @param {string} options.model - Model name (defaults to MODELS.fast)
 * @param {string} options.contents - The prompt text
 * @param {boolean} options.json - Whether to request JSON response
 * @param {number} options.maxOutputTokens - Max tokens for response
 * @param {number} options.maxRetries - Max retry attempts (default 3)
 * @returns {string} The response text
 */
export async function callGroq({
  model = MODELS.fast,
  contents,
  json = true,
  maxOutputTokens = 4096,
  maxRetries = 3,
}) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Groq requires the prompt to mention "JSON" if using type: "json_object"
      const finalContents = json
        ? contents + '\n\nEnsure the final output is a JSON object with a root key "data" containing the array.'
        : contents;

      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: finalContents }],
        model: model,
        max_completion_tokens: maxOutputTokens,
        response_format: json ? { type: 'json_object' } : undefined,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (err) {
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('rate limit');

      if (isRateLimit && attempt < maxRetries) {
        let waitSeconds = err?.error?.error?.retry_after || Math.pow(2, attempt) * 2; // Groq sometimes gives retry_after directly
        console.log(
          `     ⏳ Rate limited. Waiting ${waitSeconds}s before retry (attempt ${attempt}/${maxRetries})...`
        );
        await sleep(waitSeconds * 1000);
      } else {
        throw err;
      }
    }
  }
}

/**
 * Parse a JSON response from Groq, with fallback regex extraction.
 * @param {string} responseText - Raw response text
 * @returns {Array} Parsed array of objects
 */
export function parseJsonResponse(responseText) {
  try {
    const parsed = JSON.parse(responseText);
    // Groq json_object response format sometimes returns an object with a root key if the prompt didn't strictly force an array. Let's handle arrays or objects
    
    // If it's directly an array:
    if (Array.isArray(parsed)) return parsed;

    // If it's an object wrapping an array (e.g. { "results": [...] })
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) {
        return parsed[key];
      }
    }
    
    // Default wrap
    return [parsed];
  } catch {
    // Fallback: extract JSON array from text
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse JSON from response');
  }
}
