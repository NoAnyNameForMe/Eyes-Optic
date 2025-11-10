import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateStudioImage, findEyeglassesOnline, ShoppingResult, PROMPTS, analyzeLensReflections } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

// --- Icon Components ---
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

const ModernSpinner: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white">
        <style>{`.spinner_V8m1{transform-origin:center;animation:spinner_zKoa 2s linear infinite}.spinner_V8m1 circle{stroke-linecap:round;animation:spinner_YpZS 1.5s ease-in-out infinite}@keyframes spinner_zKoa{100%{transform:rotate(360deg)}}@keyframes spinner_YpZS{0%{stroke-dasharray:0 150;stroke-dashoffset:0}47.5%{stroke-dasharray:42 150;stroke-dashoffset:-16}95%,100%{stroke-dasharray:42 150;stroke-dashoffset:-59}}`}</style>
        <g className="spinner_V8m1">
            <circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="3"></circle>
        </g>
    </svg>
);


// --- UI Components ---

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    previewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, previewUrl }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageSelect(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageSelect(file);
        }
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <div className="w-full aspect-square bg-white/5 rounded-2xl p-2">
            <label 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                htmlFor="file-upload" 
                className="relative w-full h-full border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-white/5 transition-all duration-300 group"
            >
                {previewUrl ? (
                    <img src={previewUrl} alt="Original preview" className="object-contain w-full h-full rounded-xl p-2 transition-opacity duration-300 opacity-100" />
                ) : (
                    <div className="text-center text-slate-400 transition-all duration-300 group-hover:scale-105">
                        <UploadIcon className="mx-auto h-10 w-10 text-slate-500 group-hover:text-purple-400 transition-colors" />
                        <p className="mt-2 text-sm font-medium">Drag & drop or click to upload</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP</p>
                    </div>
                )}
            </label>
            <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
};

interface ResultDisplayProps {
    imageUrl: string | null;
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ imageUrl, isLoading, loadingMessage, error }) => {
    return (
        <div className="w-full aspect-square bg-white/5 rounded-2xl p-2">
            <div className="relative w-full h-full border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-10 rounded-xl backdrop-blur-sm">
                        <ModernSpinner />
                        <p className="mt-4 text-white font-medium text-center px-4">{loadingMessage}</p>
                    </div>
                )}
                {error && !isLoading && (
                     <div className="text-center text-red-400 p-4">
                        <p className="font-semibold">An Error Occurred</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}
                {!isLoading && !error && imageUrl && (
                    <img src={imageUrl} alt="Generated result" className="object-contain w-full h-full rounded-xl p-2 animate-fade-in" />
                )}
                 {!isLoading && !error && !imageUrl && (
                    <div className="text-center text-slate-500">
                         <SparklesIcon className="mx-auto h-12 w-12" />
                         <p className="mt-2 text-sm font-medium">Your studio-quality image will appear here</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

interface ShoppingResultsProps {
    results: ShoppingResult | null;
    isLoading: boolean;
    error: string | null;
    language: 'en' | 'fa';
    onLanguageChange: (lang: 'en' | 'fa') => void;
}

const ShoppingResultsDisplay: React.FC<ShoppingResultsProps> = ({ results, isLoading, error, language, onLanguageChange }) => {
    const showComponent = isLoading || error || results;
    if (!showComponent) {
        return null;
    }

    return (
        <section className="mt-12 w-full animate-fade-in" aria-live="polite">
            <div className="flex justify-between items-center mb-4 px-1">
                 <h2 className="text-2xl font-bold text-slate-200">Shopping Results</h2>
                 {results && !error && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onLanguageChange('en')}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${language === 'en' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                        >
                            English
                        </button>
                        <button 
                            onClick={() => onLanguageChange('fa')}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${language === 'fa' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                        >
                            فارسی
                        </button>
                    </div>
                 )}
            </div>
            <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 min-h-[200px] flex flex-col justify-center">
                {isLoading && (
                    <div className="text-center text-slate-400">
                        <svg className="animate-spin mx-auto h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-3 font-medium">Searching the web for your glasses...</p>
                    </div>
                )}
                {error && (
                     <div className="text-center text-red-400 p-4">
                        <p className="font-semibold">Search Failed</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}
                {results && !isLoading && (
                    <div className="text-slate-300">
                        <p className={`whitespace-pre-wrap leading-relaxed ${language === 'fa' ? 'text-right font-light' : 'text-left'}`}>{results.text}</p>
                        {results.sources && results.sources.length > 0 && (
                             <div className="mt-8">
                                <h3 className={`font-semibold text-slate-200 mb-4 ${language === 'fa' ? 'text-right' : 'text-left'}`}>Sources Found</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {results.sources.map((source, index) => (
                                        <a
                                            key={index}
                                            href={source.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group bg-white/5 p-4 rounded-xl hover:bg-white/10 border border-white/10 hover:border-purple-500 transition-all duration-300 flex items-center justify-between text-left"
                                        >
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-medium text-slate-200 group-hover:text-purple-300 transition-colors truncate">{source.title}</p>
                                            </div>
                                            <ExternalLinkIcon className="h-5 w-5 text-slate-500 group-hover:text-purple-300 transition-colors ml-4 flex-shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                         {results.sources?.length === 0 && !results.text && (
                            <p className="text-center text-slate-500">We couldn't find any matching products online.</p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

// --- Main App Component ---

export type Language = 'en' | 'fa';
type AiStyle = keyof typeof PROMPTS;
type ShoppingResultsCache = {
    [key in Language]?: ShoppingResult;
};

const LOADING_MESSAGES = [
    "AI is working its magic...",
    "Analyzing image details...",
    "Removing background noise...",
    "Restoring lens clarity...",
    "Applying studio lighting...",
    "Polishing the final image...",
];

const STRICT_APPEND = `Keep ONLY the eyeglasses (frame, lenses, bridge, nose pads, hinges, screws, temples). Remove all other objects and all reflections of rooms/people/cameras/lights.

Background: solid pure white (#FFFFFF), uniform, no texture/border, no shadows/halos/fringing.

Lenses: remove environmental reflections but preserve material/finish. Clear stays transparent; mirrored keeps neutral soft studio sheen (no recognizable scene); gradient/colored keep original gradient/hue/density.

Fidelity: do not change angle, crop, geometry, colors, materials, textures, patterns, or logos. Output one image, same size, no text/borders.`;

const REFINE_APPEND = `Fix only background cleanup. Remove any remaining backdrop edges, paper sweep curves, box corners, seam or horizon lines, gradients, texture, or any non-glasses pixels near the edges. Replace with perfectly uniform pure white (#FFFFFF) with zero shadows/halos/fringing. Do not change the product geometry, angle, crop, colors, materials, or lens finish.`;

const LENS_REFINE_APPEND = `Fix only lens cleanup. Remove 100% of environmental reflections from the lens surfaces (rooms, people, cameras, lights, windows).

Preserve lens material/finish strictly:
- Clear lenses: remain transparent and optically clean (never flat-filled).
- Mirrored lenses: keep only a neutral soft studio sheen (no recognizable scene).
- Gradient/colored/dark-tinted lenses: keep original gradient/hue/density.

Visibility rule:
- For mirrored or colored/gradient/dark-tinted sunglasses, internal parts behind the lenses (temples/arms/internal frame) must NOT be visible; occlude them consistently with the lens tint/finish.
- For clear lenses, do not artificially occlude the frame behind; keep true transparency.

Maintain crisp rim boundaries, no background leaks, no haze/halos. Do not alter product geometry/colors or the pure white background (#FFFFFF).`;

async function checkWhiteBackground(
    dataUrl: string,
    edgeMargin = 0.18,
    tolerance = 8,
    minEdgeRatio = 0.999,
    middleBandHeight = 0.08,
    middleSkipCenter = 0.4,
    minMiddleRatio = 0.995,
): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(true);
            ctx.drawImage(img, 0, 0);
            const { width: w, height: h } = canvas;
            // Edge bands
            const topH = Math.max(1, Math.floor(h * edgeMargin));
            const botY = h - topH;
            const leftW = Math.max(1, Math.floor(w * edgeMargin));
            const rightX = w - leftW;
            let white = 0, total = 0;
            const step = 2;
            for (let y = 0; y < topH; y += step) {
                const row = ctx.getImageData(0, y, w, 1).data;
                for (let x = 0; x < w * 4; x += 4 * step) {
                    const r = row[x], g = row[x + 1], b = row[x + 2];
                    const ok = r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
                    if (ok) white++;
                    total++;
                }
            }
            for (let y = botY; y < h; y += step) {
                const row = ctx.getImageData(0, y, w, 1).data;
                for (let x = 0; x < w * 4; x += 4 * step) {
                    const r = row[x], g = row[x + 1], b = row[x + 2];
                    const ok = r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
                    if (ok) white++;
                    total++;
                }
            }
            for (let x = 0; x < leftW; x += step) {
                const col = ctx.getImageData(x, 0, 1, h).data;
                for (let y = 0; y < h * 4; y += 4 * step) {
                    const r = col[y], g = col[y + 1], b = col[y + 2];
                    const ok = r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
                    if (ok) white++;
                    total++;
                }
            }
            for (let x = rightX; x < w; x += step) {
                const col = ctx.getImageData(x, 0, 1, h).data;
                for (let y = 0; y < h * 4; y += 4 * step) {
                    const r = col[y], g = col[y + 1], b = col[y + 2];
                    const ok = r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
                    if (ok) white++;
                    total++;
                }
            }
            const edgeRatio = total > 0 ? white / total : 1;

            // Middle horizontal band (to catch sweep/horizon lines). Skip center area where product likely is.
            const bandH = Math.max(1, Math.floor(h * middleBandHeight));
            const yStart = Math.max(0, Math.floor(h * 0.35));
            const yEnd = Math.min(h, yStart + bandH);
            const skipStartX = Math.floor(w * (0.5 - middleSkipCenter / 2));
            const skipEndX = Math.ceil(w * (0.5 + middleSkipCenter / 2));
            let whiteMid = 0, totalMid = 0;
            for (let y = yStart; y < yEnd; y += step) {
                const row = ctx.getImageData(0, y, w, 1).data;
                for (let x = 0; x < w; x += step) {
                    if (x >= skipStartX && x <= skipEndX) continue; // skip center region
                    const i = x * 4;
                    const r = row[i], g = row[i + 1], b = row[i + 2];
                    const ok = r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
                    if (ok) whiteMid++;
                    totalMid++;
                }
            }
            const middleRatio = totalMid > 0 ? whiteMid / totalMid : 1;

            resolve(edgeRatio >= minEdgeRatio && middleRatio >= minMiddleRatio);
        };
        img.src = dataUrl;
    });
}

export default function App() {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
    const [error, setError] = useState<string | null>(null);
    const [aiStyle, setAiStyle] = useState<AiStyle>('Digikala');

    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [shoppingResultsCache, setShoppingResultsCache] = useState<ShoppingResultsCache | null>(null);
    const [shoppingLanguage, setShoppingLanguage] = useState<Language>('en');

    // Effect for cycling loading messages
    useEffect(() => {
        let interval: number;
        if (isLoading) {
            let messageIndex = 0;
            interval = window.setInterval(() => {
                messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
                setLoadingMessage(LOADING_MESSAGES[messageIndex]);
            }, 2000);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
                setLoadingMessage(LOADING_MESSAGES[0]); // Reset on stop
            }
        };
    }, [isLoading]);


    const handleImageSelect = useCallback((file: File) => {
        setOriginalFile(file);
        setGeneratedImageUrl(null);
        setError(null);
        setShoppingResultsCache(null);
        setSearchError(null);
        setShoppingLanguage('en');
        if (originalImageUrl) {
            URL.revokeObjectURL(originalImageUrl);
        }
        setOriginalImageUrl(URL.createObjectURL(file));
    }, [originalImageUrl]);


    const handleGenerate = async () => {
        const currentFile = originalFile;
        if (!currentFile) {
            setError("Please upload an image first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImageUrl(null); // Clear previous result

        // Always clear previous search results when generating a new image
        setShoppingResultsCache(null);
        setSearchError(null);

        try {
            const base64Data = await fileToBase64(currentFile);
            const mimeType = currentFile.type;
            const promptText = `${PROMPTS[aiStyle]}\n\n${STRICT_APPEND}`;
            // First pass
            let result = await generateStudioImage(base64Data, mimeType, promptText);
            let dataUrl = `data:${result.mimeType || 'image/png'};base64,${result.data}`;
            // Background verify + up to 2 refine passes
            let bgOk = await checkWhiteBackground(dataUrl);
            let attempts = 0;
            while (!bgOk && attempts < 2) {
                const refinePrompt = `${REFINE_APPEND}\n\n${STRICT_APPEND}`;
                result = await generateStudioImage(result.data, result.mimeType || 'image/png', refinePrompt);
                dataUrl = `data:${result.mimeType || 'image/png'};base64,${result.data}`;
                bgOk = await checkWhiteBackground(dataUrl);
                attempts++;
            }
            // Lens reflection analysis and up to two targeted refine passes
            let lensVerdict = await analyzeLensReflections(result.data, result.mimeType || 'image/png');
            let lensAttempts = 0;
            while ((lensVerdict.reflectionsPresent || lensVerdict.throughVisibilityPresent) && lensVerdict.confidence >= 0.6 && lensAttempts < 2) {
                const lensRefinePrompt = `${LENS_REFINE_APPEND}\n\n${STRICT_APPEND}`;
                result = await generateStudioImage(result.data, result.mimeType || 'image/png', lensRefinePrompt);
                dataUrl = `data:${result.mimeType || 'image/png'};base64,${result.data}`;
                lensVerdict = await analyzeLensReflections(result.data, result.mimeType || 'image/png');
                lensAttempts++;
            }
            setGeneratedImageUrl(dataUrl);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSearch = async () => {
        if (!originalFile) {
            setSearchError("Please upload an image first.");
            return;
        }

        setIsSearching(true);
        setSearchError(null);
        setShoppingResultsCache(null);
        const initialLang: Language = 'en';
        setShoppingLanguage(initialLang);

        try {
            const base64Data = await fileToBase64(originalFile);
            const mimeType = originalFile.type;
            
            const results = await findEyeglassesOnline(base64Data, mimeType, initialLang);
            
            setShoppingResultsCache({ [initialLang]: results });
        } catch (err) {
            console.error(err);
            setSearchError(err instanceof Error ? err.message : "An unknown error occurred during the search.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleLanguageChange = async (lang: Language) => {
        if (!originalFile || lang === shoppingLanguage) return;

        setShoppingLanguage(lang);

        if (shoppingResultsCache?.[lang]) {
            return; // Already cached, just switch view
        }

        setIsSearching(true);
        setSearchError(null);
        try {
            const base64Data = await fileToBase64(originalFile);
            const mimeType = originalFile.type;
            const results = await findEyeglassesOnline(base64Data, mimeType, lang);
            setShoppingResultsCache(prev => ({ ...prev, [lang]: results }));
        } catch (err) {
            console.error(err);
            setSearchError(err instanceof Error ? err.message : "An unknown error occurred during language switch.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImageUrl) return;
        const link = document.createElement('a');
        link.href = generatedImageUrl;
        link.download = `studio_${originalFile?.name.split('.')[0] || 'image'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen text-white flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="text-center animate-fade-in">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                    Eyeglass Studio AI
                </h1>
                <p className="text-slate-400 mt-3 text-sm md:text-base max-w-2xl mx-auto">
                    Transform your eyeglass photos into professional product shots, then find them in online stores.
                </p>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center w-full max-w-5xl mx-auto mt-8">
                <div className="w-full bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl shadow-purple-900/10 animate-fade-in" style={{ animationDelay: '100ms', opacity: 0 }}>
                    {/* Image Panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                        <div className="flex flex-col gap-3">
                            <h2 className="text-lg font-semibold text-slate-300 text-center">Original Image</h2>
                            <ImageUploader onImageSelect={handleImageSelect} previewUrl={originalImageUrl} />
                        </div>
                        <div className="flex flex-col gap-3">
                            <h2 className="text-lg font-semibold text-slate-300 text-center">Studio Result</h2>
                            <ResultDisplay imageUrl={generatedImageUrl} isLoading={isLoading} loadingMessage={loadingMessage} error={error} />
                        </div>
                    </div>

                    {/* Style Selector */}
                    <div className="mt-6 text-center">
                        <label className="text-lg font-semibold text-slate-300 mb-4 block">AI Style</label>
                        <div className="inline-flex rounded-xl bg-white/5 p-1.5 gap-2">
                             {(Object.keys(PROMPTS) as AiStyle[]).map(style => (
                                <button
                                    key={style}
                                    onClick={() => setAiStyle(style)}
                                    className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${aiStyle === style ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-300 hover:bg-white/10'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleGenerate}
                            disabled={!originalFile || isLoading || isSearching}
                            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:from-slate-600 disabled:to-slate-700 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <SparklesIcon className="h-5 w-5" />
                            <span>{isLoading ? 'Generating...' : 'Studiofy Image'}</span>
                        </button>
                        <button
                            onClick={handleSearch}
                            disabled={!originalFile || isLoading || isSearching}
                            className="w-full sm:w-auto px-6 py-3 bg-white/10 text-white font-bold rounded-xl shadow-lg hover:bg-white/20 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <SearchIcon className="h-5 w-5" />
                            <span>{isSearching && !shoppingResultsCache ? 'Searching...' : 'Find Online'}</span>
                        </button>
                        {generatedImageUrl && !isLoading && (
                            <button
                                onClick={handleDownload}
                                className="w-full sm:w-auto px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 hover:shadow-cyan-500/40 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                <DownloadIcon className="h-5 w-5" />
                                <span>Download</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Shopping Results Section */}
                <ShoppingResultsDisplay 
                    results={shoppingResultsCache?.[shoppingLanguage] ?? null} 
                    isLoading={isSearching} 
                    error={searchError} 
                    language={shoppingLanguage}
                    onLanguageChange={handleLanguageChange}
                />
            </main>
        </div>
    );
}