"use strict";
/* Requirements covered: REQ_09 (AI fallback — ships with no key by default). See ../../REQUIREMENTS.md for the full map. */
/* ============================================================
   CONFIG — optional hosted-LLM setup (safe to leave as-is)
   ============================================================
   By default the app uses the LOCAL grounded AI engine and needs NO key.
   To enable a hosted LLM, uncomment and fill this in. On ANY failure the
   app automatically falls back to the local engine. Do NOT commit real keys.

   window.__WC_LLM__ = {
     endpoint: "<your-llm-endpoint-url>", // LLM-compatible
     apiKey:   "YOUR_KEY_HERE",
     model:    "your-model-name"
   };
*/
