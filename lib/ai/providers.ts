/* eslint-disable @typescript-eslint/no-explicit-any */
import { customProvider } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { getChatModels, DEVELOPMENT_CHAT_MODEL } from "./models";

// Cache for model instances to avoid recreating them
const modelCache: Record<string, any> = {};

const createLanguageModels = () => {
  const models: Record<string, any> = {};

  // Get all available models (from generated file or fallback)
  const chatModels = getChatModels();

  // Create all models using OpenRouter (including GPT-5.4 which is now available on OpenRouter)
  chatModels.forEach((model) => {
    if (!modelCache[model.id]) {
      modelCache[model.id] = openrouter(model.id);
    }
    models[model.id] = modelCache[model.id];
  });

  // Development model (fallback)
  if (!modelCache[DEVELOPMENT_CHAT_MODEL]) {
    modelCache[DEVELOPMENT_CHAT_MODEL] = openrouter(DEVELOPMENT_CHAT_MODEL);
  }
  models[DEVELOPMENT_CHAT_MODEL] = modelCache[DEVELOPMENT_CHAT_MODEL];

  // Title generation model
  if (!modelCache["title-model"]) {
    modelCache["title-model"] = openrouter(DEVELOPMENT_CHAT_MODEL);
  }
  models["title-model"] = modelCache["title-model"];

  return models;
};

/**
 * Get or create a model instance dynamically
 * This allows creating models on-demand for any model ID
 * All models are routed through OpenRouter
 */
export function getModelInstance(modelId: string) {
  if (!modelCache[modelId]) {
    modelCache[modelId] = openrouter(modelId);
  }
  return modelCache[modelId];
}

// Create initial language models
const initialLanguageModels = createLanguageModels();

// Create provider with initial models
// Note: OpenRouter provider can handle any model ID dynamically,
// so models not in the initial list will still work
export const myProvider = customProvider({
  languageModels: initialLanguageModels,
});

/**
 * Ensure a model is available in the provider
 * This is called when a model ID might not be in the initial list
 */
export function ensureModelAvailable(modelId: string) {
  if (!initialLanguageModels[modelId]) {
    // Add the model to the provider's language models
    const modelInstance = getModelInstance(modelId);
    initialLanguageModels[modelId] = modelInstance;
  }
}

// Vision models supported through OpenRouter:
// - openai/gpt-4o (supports vision)
// - openai/gpt-4o-mini (supports vision)
// - openai/gpt-5.4 (supports vision)
// - google/gemini-3.1-pro-preview (supports vision)
// - google/gemini-3.1-flash-lite-preview (supports vision)
// - google/gemini-2.5-pro (supports vision)
// - google/gemini-2.5-flash (supports vision)
// - anthropic/claude-sonnet-4.6 (supports vision)
// OpenRouter automatically handles vision when file parts are included in messages

// Keep isProduction export for backward compatibility (not used for routing anymore)
export const isProduction = process.env.NODE_ENV === "production";
