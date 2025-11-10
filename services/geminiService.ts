
import { GoogleGenAI, Modality } from "@google/genai";
import { Language } from '../App'; // Assuming Language type is exported from App.tsx

// Fix: Initialize the Google Gemini AI client using the API key from environment variables.
// This resolves the hardcoded API key issue and the associated TypeScript error.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export const PROMPTS = {
    'Digikala': `You are an expert AI photo editor for high-end e-commerce. Your task is to transform the user's photo of eyeglasses into a pristine, studio-quality product shot that appears to be floating.

**PRIMARY DIRECTIVE: ABSOLUTE FIDELITY**
You MUST preserve the 100% identical physical characteristics of the eyeglasses. This includes the exact frame shape, color, material, texture, patterns (like tortoise shell), and any logos or branding. DO NOT alter the physical product.

**CRITICAL LENS RESTORATION MANDATE:**
The goal is to remove environmental reflections while perfectly preserving the original material and finish of the lenses.

1.  **REMOVE ENVIRONMENTAL REFLECTIONS:** You MUST completely eliminate 100% of all identifiable reflections from the environment. This includes, but is not limited to: people, faces, rooms, windows, cameras, and specific light sources.
2.  **PRESERVE LENS MATERIAL & FINISH:** This is crucial. DO NOT change the intrinsic properties of the lenses.
    *   **MIRRORED/REFLECTIVE LENSES:** They MUST retain their mirrored quality. Reconstruct the surface with a neutral, soft, and generic studio lighting reflection.
    *   **GRADIENT TINT LENSES:** You MUST preserve the exact original gradient.
    *   **COLORED/TINTED LENSES:** The underlying base color and darkness must remain unchanged.

**LENS CLEANUP CHECKLIST (MANDATORY):**
*   Remove 100% of environmental reflections (rooms, people, cameras/phones, softboxes, windows, lights, tripods, monitors).
*   Do NOT flatten lenses to a solid fill.
*   Preserve lens material/finish faithfully: clear stays transparent; mirrored keeps only a neutral soft studio sheen (no recognizable scene); gradient/colored keep the original gradient/hue/density.
*   Keep lens edges crisp; no background leakage in rim gaps; no haze, fog, or halos on lenses.
*   For mirrored or colored/gradient/dark-tinted sunglasses, the internal frame/temples must NOT be visible through the lenses; occlude any behind-lens silhouettes.
*   If any reflection remains, fix it before returning the image.

**WORKFLOW:**
1.  **Analyze:** Carefully analyze the eyeglasses to understand their frame and lens properties.
2.  **Isolate:** Perfectly mask and cut out the eyeglasses from their original background.
3.  **Restore Lenses:** Execute the "CRITICAL LENS RESTORATION MANDATE".
4.  **Set Background:** Place the restored eyeglasses on a solid, uniform, pure white (#FFFFFF) background. This is the standard for professional e-commerce product photography.
5.  **NO SHADOWS (CRITICAL):** The final image must be **completely shadowless** to create a floating effect. You MUST eliminate 100% of all shadows, including any cast shadows from the object and, most importantly, any subtle "contact shadows" where the object would theoretically touch a surface. The product must look like it is suspended in mid-air. There is no light source that can create a shadow.
6.  **Maintain Perspective:** Keep the exact original viewing angle.

The final image must be the *exact same pair of glasses*, meticulously cleaned, on a flawless pure white background, appearing to float with absolutely no shadows.`,
    'Studio': `You are an expert AI photo editor for high-end e-commerce. Your task is to transform the user's photo of eyeglasses into a pristine, studio-quality product shot.

**PRIMARY DIRECTIVE: ABSOLUTE FIDELITY**
You MUST preserve the 100% identical physical characteristics of the eyeglasses. This includes the exact frame shape, color, material, texture, patterns (like tortoise shell), and any logos or branding. DO NOT alter the physical product.

**CRITICAL LENS RESTORATION MANDATE (YOUR MOST IMPORTANT TASK):**
The goal is to remove environmental reflections while perfectly preserving the original material and finish of the lenses.

1.  **REMOVE ENVIRONMENTAL REFLECTIONS:** You MUST completely eliminate 100% of all identifiable reflections from the environment. This includes, but is not limited to: people, faces, rooms, windows, cameras, and specific light sources. The lenses must be clean of this visual clutter.

2.  **PRESERVE LENS MATERIAL & FINISH:** This is crucial. DO NOT change the intrinsic properties of the lenses.
    *   **If the lenses are MIRRORED or REFLECTIVE:** They MUST retain their mirrored quality. Reconstruct the surface with a neutral, soft, and generic studio lighting reflection. The result should look shiny and reflective, but not mirror a specific environment. **DO NOT replace a mirrored finish with a flat, non-reflective color.**
    *   **If the lenses have a GRADIENT TINT:** You MUST preserve the exact original gradient, including its colors and direction.
    *   **Preserve Original Color/Tint:** The underlying base color and darkness of the lenses must remain unchanged.

**LENS CLEANUP CHECKLIST (MANDATORY):**
*   Remove 100% of environmental reflections (rooms, people, cameras/phones, softboxes, windows, lights, tripods, monitors).
*   Do NOT fill lenses with a flat color.
*   Preserve lens material/finish: clear = transparent; mirrored = neutral soft studio sheen only; gradient/colored = keep original gradient/hue/density.
*   Ensure crisp, clean rim boundaries with no background leaks; no haze or halos.
*   For mirrored or colored/gradient/dark-tinted sunglasses, do not show internal frame/temples through the lenses; occlude any behind-lens silhouettes.
*   If any reflection remains, fix it before returning the image.

**WORKFLOW:**
1.  **Analyze:** First, carefully analyze the eyeglasses to understand their frame and lens properties.
2.  **Isolate:** Perfectly mask and cut out the eyeglasses from their original background.
3.  **Restore Lenses:** Execute the "CRITICAL LENS RESTORATION MANDATE" as your top priority.
4.  **Set Background:** Place the restored eyeglasses on a solid, uniform, light gray (#F3F4F6) background. This provides a professional, neutral backdrop that ensures good contrast for all frame colors, especially white.
5.  **Maintain Perspective:** Keep the exact original viewing angle and perspective of the glasses.

The final image must be the *exact same pair of glasses*, meticulously cleaned of environmental reflections but retaining their authentic lens finish, on a flawless light gray background.`,
};


export interface GeneratedImage {
    data: string;
    mimeType: string;
}

export interface LensAnalysis {
    reflectionsPresent: boolean;
    throughVisibilityPresent: boolean;
    confidence: number;
    type?: 'environmental' | 'mirror_sheen' | 'none' | 'unknown';
    note?: string;
}

export async function generateStudioImage(base64ImageData: string, mimeType: string, promptText: string): Promise<GeneratedImage> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: promptText,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const outData = part.inlineData.data as string;
                const outMime = (part.inlineData as any).mimeType || 'image/png';
                return { data: outData, mimeType: outMime };
            }
        }
        
        throw new Error("No image data found in the API response.");

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the API.");
    }
}

export async function analyzeLensReflections(base64ImageData: string, mimeType: string): Promise<LensAnalysis> {
    try {
        const prompt = `You are an expert eyewear retoucher.
Judge two things on the lenses:
1) ENVIRONMENTAL REFLECTIONS present? (rooms, people, cameras/phones, windows, softboxes, lights, tripods, monitors)
2) THROUGH-VISIBILITY of internal parts behind the lenses (e.g., temples/arms visible through tinted or mirrored lenses)?
Do NOT penalize neutral soft studio sheen on mirrored lenses.

Return STRICT JSON only with keys: {"reflectionsPresent": boolean, "throughVisibilityPresent": boolean, "confidence": number (0..1), "type": "environmental"|"mirror_sheen"|"none"|"unknown", "note": string}.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64ImageData, mimeType } },
                    { text: prompt },
                ],
            },
        });
        const txt = (response as any).text || (response as any).candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
        try {
            const parsed = JSON.parse(txt);
            return {
                reflectionsPresent: !!parsed.reflectionsPresent,
                throughVisibilityPresent: !!parsed.throughVisibilityPresent,
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
                type: parsed.type || 'unknown',
                note: parsed.note || '',
            };
        } catch {
            return { reflectionsPresent: false, throughVisibilityPresent: false, confidence: 0.0, type: 'unknown', note: 'unparsed' };
        }
    } catch (error) {
        return { reflectionsPresent: false, throughVisibilityPresent: false, confidence: 0.0, type: 'unknown', note: 'error' };
    }
}

// --- New Feature: Find Eyeglasses Online ---

const SEARCH_PROMPT_ENGLISH = `Based on the provided image of eyeglasses, use Google Search to find where this exact model or visually similar models can be purchased online. Provide a brief summary of what you found. The search results will be listed separately.`;
const SEARCH_PROMPT_FARSI = `بر اساس تصویر عینک ارائه شده، از جستجوی گوگل استفاده کن تا پیدا کنی این مدل دقیق یا مدل‌های مشابه از نظر ظاهری را از کجا می‌توان به صورت آنلاین خریداری کرد. خلاصه‌ی کوتاهی از یافته‌های خود به زبان فارسی ارائه بده. نتایج جستجو به صورت جداگانه لیست خواهند شد.`;

export interface ShoppingResult {
    text: string;
    sources: {
        uri: string;
        title: string;
    }[];
}

export async function findEyeglassesOnline(base64ImageData: string, mimeType: string, language: Language = 'en'): Promise<ShoppingResult> {
    try {
        const prompt = language === 'fa' ? SEARCH_PROMPT_FARSI : SEARCH_PROMPT_ENGLISH;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const sources = groundingChunks
            .filter(chunk => chunk.web)
            .map(chunk => ({
                uri: chunk.web.uri,
                title: chunk.web.title || chunk.web.uri,
            }));

        if (!text && sources.length === 0) {
            throw new Error("No results found. The model could not identify the product.");
        }

        return { text, sources };

    } catch (error) {
        console.error("Error calling Gemini API for search:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to search for eyeglasses: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the API for search.");
    }
}
