import { useEffect, useRef, useState } from "react";
import type * as React from "react";
import { ArrowRight, Brush, Circle, Download, Eraser, Highlighter, Minus, Pen, Redo2, RotateCcw, Square, Type, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { uploadMedia } from "@/lib/media-store";
//import { getMedia, putMedia } from "@/lib/media-store";
import type { ContentBlock } from "@/types";
import { arrowHeadPoints } from "./drawing";

type WhiteboardTool = "pen" | "brush" | "highlighter" | "eraser" | "line" | "arrow" | "rectangle" | "ellipse" | "text";
type WhiteboardPaper = "plain" | "grid" | "lined";
const toolShortcuts: Record<string, WhiteboardTool> = {
    p: "pen", b: "brush", h: "highlighter", e: "eraser", l: "line", a: "arrow", r: "rectangle", o: "ellipse", t: "text",
};

export function WhiteboardEditor({ block, onSave, onCancel }: { block: ContentBlock; onSave: (b: ContentBlock) => void; onCancel: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerStart = useRef<{ x: number; y: number } | null>(null);
    const startImage = useRef<ImageData | null>(null);
    const undoStack = useRef<ImageData[]>([]);
    const redoStack = useRef<ImageData[]>([]);
    const [tool, setTool] = useState<WhiteboardTool>("pen");
    const [color, setColor] = useState("#202124");
    const [size, setSize] = useState(4);
    const [labelText, setLabelText] = useState("");
    const [labelSize, setLabelSize] = useState(24);
    const [paper, setPaper] = useState<WhiteboardPaper>(block.whiteboard?.background ?? "plain");
    const [zoom, setZoom] = useState(100);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const historyActions = useRef<{ undo: () => void; redo: () => void }>({ undo: () => { }, redo: () => { } });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    //   useEffect(() => {
    //     const canvas = canvasRef.current;
    //     const ctx = canvas?.getContext("2d");
    //     if (!canvas || !ctx) return;
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);
    //     if (!block.media) return;
    //     let active = true;
    //     let objectUrl: string | null = null;
    //     void getMedia(block.media.id).then((blob) => {
    //       if (!blob || !active) return;
    //       objectUrl = URL.createObjectURL(blob);
    //       const image = new Image();
    //       image.onload = () => {
    //         if (!active) return;
    //         const currentCanvas = canvasRef.current;
    //         const currentCtx = currentCanvas?.getContext("2d");
    //         if (!currentCanvas || !currentCtx) return;
    //         currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
    //         currentCtx.drawImage(image, 0, 0, currentCanvas.width, currentCanvas.height);
    //         undoStack.current = [];
    //         redoStack.current = [];
    //         setCanUndo(false);
    //         setCanRedo(false);
    //       };
    //       image.src = objectUrl;
    //     });
    //     return () => {
    //       active = false;
    //       if (objectUrl) URL.revokeObjectURL(objectUrl);
    //     };
    //   }, [block.media?.id]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!block.url) return;

        let active = true;

        const image = new Image();

        image.crossOrigin = "anonymous";

        image.onload = () => {
            if (!active) return;

            const currentCanvas = canvasRef.current;
            const currentCtx = currentCanvas?.getContext("2d");

            if (!currentCanvas || !currentCtx) return;

            currentCtx.clearRect(
                0,
                0,
                currentCanvas.width,
                currentCanvas.height,
            );

            currentCtx.drawImage(
                image,
                0,
                0,
                currentCanvas.width,
                currentCanvas.height,
            );

            undoStack.current = [];
            redoStack.current = [];

            setCanUndo(false);
            setCanRedo(false);
        };

        image.onerror = () => {
            console.error("Failed to load whiteboard image.");
        };

        image.src = block.url;

        return () => {
            active = false;
            image.onload = null;
            image.onerror = null;
        };
    }, [block.url]);

    const snapshot = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return null;
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    const remember = () => {
        const image = snapshot();
        if (!image) return;
        undoStack.current = [...undoStack.current.slice(-19), image];
        redoStack.current = [];
        setCanUndo(true);
        setCanRedo(false);
    };
    const restore = (image: ImageData) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) ctx.putImageData(image, 0, 0);
    };
    const undo = () => {
        const previous = undoStack.current.pop();
        const current = snapshot();
        if (!previous || !current) return;
        redoStack.current = [...redoStack.current, current];
        restore(previous);
        setCanUndo(undoStack.current.length > 0);
        setCanRedo(true);
    };
    const redo = () => {
        const next = redoStack.current.pop();
        const current = snapshot();
        if (!next || !current) return;
        undoStack.current = [...undoStack.current, current];
        restore(next);
        setCanUndo(true);
        setCanRedo(redoStack.current.length > 0);
    };
    historyActions.current = { undo, redo };
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target;
            if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
            const key = event.key.toLowerCase();
            if (event.metaKey || event.ctrlKey) {
                if (key === "z") {
                    event.preventDefault();
                    if (event.shiftKey) historyActions.current.redo();
                    else historyActions.current.undo();
                } else if (key === "y") {
                    event.preventDefault();
                    historyActions.current.redo();
                }
                return;
            }
            const shortcutTool = toolShortcuts[key];
            if (shortcutTool) {
                event.preventDefault();
                setTool(shortcutTool);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);
    const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = event.currentTarget;
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
    };
    const drawShape = (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) => {
        ctx.beginPath();
        if (tool === "line" || tool === "arrow") {
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            if (tool === "arrow") {
                const head = Math.max(12, size * 4);
                const points = arrowHeadPoints(from, to, head);
                ctx.moveTo(to.x, to.y);
                ctx.lineTo(points.left.x, points.left.y);
                ctx.moveTo(to.x, to.y);
                ctx.lineTo(points.right.x, points.right.y);
            }
        }
        else if (tool === "rectangle") ctx.rect(from.x, from.y, to.x - from.x, to.y - from.y);
        else {
            const rx = Math.abs(to.x - from.x) / 2;
            const ry = Math.abs(to.y - from.y) / 2;
            ctx.ellipse((from.x + to.x) / 2, (from.y + to.y) / 2, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
        }
        ctx.stroke();
    };
    const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (event.button !== 0) return;
        const canvas = event.currentTarget;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        event.preventDefault();
        pointerStart.current = point(event);
        if (tool === "text") {
            if (labelText.trim()) {
                remember();
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = "source-over";
                ctx.fillStyle = color;
                ctx.font = `${labelSize}px sans-serif`;
                ctx.textBaseline = "top";
                const lineHeight = Math.ceil(labelSize * 1.25);
                labelText.split("\n").forEach((line, index) => ctx.fillText(line, pointerStart.current?.x ?? 0, (pointerStart.current?.y ?? 0) + index * lineHeight, canvas.width - (pointerStart.current?.x ?? 0)));
            }
            pointerStart.current = null;
            ctxReset(canvas);
            return;
        }
        canvas.setPointerCapture(event.pointerId);
        remember();
        startImage.current = snapshot();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = tool === "brush" ? size * 2.5 : tool === "highlighter" ? size * 3 : size;
        ctx.strokeStyle = color;
        ctx.globalAlpha = tool === "highlighter" ? 0.28 : 1;
        ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
        if (tool === "pen" || tool === "brush" || tool === "highlighter" || tool === "eraser") {
            ctx.beginPath();
            ctx.moveTo(pointerStart.current.x, pointerStart.current.y);
            ctx.lineTo(pointerStart.current.x + 0.1, pointerStart.current.y + 0.1);
            ctx.stroke();
        }
    };
    const moveDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const from = pointerStart.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!from || !canvas || !ctx) return;
        const to = point(event);
        ctx.lineWidth = tool === "brush" ? size * 2.5 : tool === "highlighter" ? size * 3 : size;
        ctx.strokeStyle = color;
        ctx.globalAlpha = tool === "highlighter" ? 0.28 : 1;
        ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (tool === "line" || tool === "arrow" || tool === "rectangle" || tool === "ellipse") {
            if (startImage.current) ctx.putImageData(startImage.current, 0, 0);
            drawShape(ctx, from, to);
        } else {
            const last = (canvas as HTMLCanvasElement & { lastPoint?: { x: number; y: number } }).lastPoint ?? from;
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            (canvas as HTMLCanvasElement & { lastPoint?: { x: number; y: number } }).lastPoint = to;
        }
    };
    const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = event.currentTarget as HTMLCanvasElement & { lastPoint?: { x: number; y: number } };
        if (pointerStart.current && (tool === "line" || tool === "arrow" || tool === "rectangle" || tool === "ellipse")) {
            const ctx = canvas.getContext("2d");
            const from = pointerStart.current;
            if (ctx && from) {
                ctx.globalAlpha = 1;
                drawShape(ctx, from, point(event));
            }
        }
        delete canvas.lastPoint;
        pointerStart.current = null;
        startImage.current = null;
        ctxReset(canvas);
    };
    const cancelDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = event.currentTarget as HTMLCanvasElement & { lastPoint?: { x: number; y: number } };
        const ctx = canvas.getContext("2d");
        if (ctx && startImage.current) {
            ctx.putImageData(startImage.current, 0, 0);
            undoStack.current.pop();
            setCanUndo(undoStack.current.length > 0);
            setCanRedo(redoStack.current.length > 0);
        }
        delete canvas.lastPoint;
        pointerStart.current = null;
        startImage.current = null;
        ctxReset(canvas);
    };
    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        remember();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    // const save = async () => {
    //     const canvas = canvasRef.current;
    //     if (!canvas) return;
    //     const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    //     if (!blob) return;
    //     const mediaId = block.media?.id ?? uid();
    //     await putMedia(mediaId, blob);
    //     onSave({ ...block, content: "", whiteboard: { background: paper }, media: { id: mediaId, name: "whiteboard.png", mime: "image/png", size: blob.size } });
    // };


    const save = async () => {
        const canvas = canvasRef.current;

        if (!canvas || saving) return;

        setSaving(true);
        setSaveError(null);

        try {
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, "image/png");
            });

            if (!blob) {
                throw new Error("Could not generate whiteboard image.");
            }

            const file = new File(
                [blob],
                "whiteboard.png",
                { type: "image/png" },
            );

            // Upload PNG directly to ImageKit.
            const media = await uploadMedia(file, {
                folder: "/lms/whiteboards",
            });

            // Save ImageKit references in MongoDB.
            await onSave({
                ...block,
                type: "whiteboard",
                url: media.url,
                filename: media.name,
                fileId: media.fileId,
                whiteboard: {
                    background: paper,
                },
            });
        } catch (error: unknown) {
            setSaveError(
                error instanceof Error
                    ? error.message
                    : "Could not save whiteboard.",
            );
        } finally {
            setSaving(false);
        }
    };

    const exportPng = async () => {
        const source = canvasRef.current;
        if (!source) return;
        const output = document.createElement("canvas");
        output.width = source.width;
        output.height = source.height;
        const ctx = output.getContext("2d");
        if (!ctx) return;
        const styles = getComputedStyle(source);
        ctx.fillStyle = styles.getPropertyValue("--whiteboard").trim() || "white";
        ctx.fillRect(0, 0, output.width, output.height);
        if (paper !== "plain") {
            ctx.strokeStyle = styles.getPropertyValue("--whiteboard-grid-line").trim() || "#d1d5db";
            ctx.lineWidth = 1;
            const step = 24;
            ctx.beginPath();
            if (paper === "grid") {
                for (let x = step; x < output.width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, output.height); }
            }
            for (let y = step; y < output.height; y += step) { ctx.moveTo(0, y); ctx.lineTo(output.width, y); }
            ctx.stroke();
        }
        ctx.drawImage(source, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/png"));
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "whiteboard.png";
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const tools: { id: WhiteboardTool; label: string; shortcut: string; icon: typeof Pen }[] = [
        { id: "pen", label: "Pen", shortcut: "P", icon: Pen }, { id: "brush", label: "Brush", shortcut: "B", icon: Brush },
        { id: "highlighter", label: "Highlighter", shortcut: "H", icon: Highlighter }, { id: "eraser", label: "Eraser", shortcut: "E", icon: Eraser },
        { id: "line", label: "Line", shortcut: "L", icon: Minus }, { id: "arrow", label: "Arrow", shortcut: "A", icon: ArrowRight },
        { id: "rectangle", label: "Rectangle", shortcut: "R", icon: Square }, { id: "ellipse", label: "Ellipse", shortcut: "O", icon: Circle },
        { id: "text", label: "Text label", shortcut: "T", icon: Type },
    ];

    return (
        <section className="space-y-3 rounded-md border border-border bg-card p-3" aria-label="Whiteboard editor">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 border-r border-border pr-2">
                    {tools.map(({ id, label, shortcut, icon: Icon }) => (
                        <button key={id} type="button" aria-label={label} title={`${label} (${shortcut})`} onClick={() => setTool(id)} className={`rounded p-2 ${tool === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon className="h-4 w-4" /></button>
                    ))}
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground" title="Ink color">
                    <input aria-label="Ink color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5" />
                    Color
                </label>
                <label className="flex min-w-32 items-center gap-2 text-xs text-muted-foreground">
                    Size <input aria-label="Stroke size" type="range" min="1" max="32" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24 accent-primary" /> <span className="w-5 text-right font-mono">{size}</span>
                </label>
                {tool === "text" && (
                    <>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">Label
                            <textarea aria-label="Text label" rows={1} value={labelText} onChange={(e) => setLabelText(e.target.value)} placeholder="Type, then click the board" className="min-w-36 resize-y rounded border border-input bg-background px-2 py-1.5 text-foreground" />
                        </label>
                        <label className="flex min-w-28 items-center gap-2 text-xs text-muted-foreground">Text size
                            <input aria-label="Text size" type="range" min="12" max="72" step="2" value={labelSize} onChange={(e) => setLabelSize(Number(e.target.value))} className="w-20 accent-primary" />
                            <span className="w-8 text-right font-mono">{labelSize}</span>
                        </label>
                    </>
                )}
                <label className="flex items-center gap-2 text-xs text-muted-foreground">Paper
                    <select aria-label="Paper background" value={paper} onChange={(e) => setPaper(e.target.value as WhiteboardPaper)} className="rounded border border-input bg-background px-2 py-1.5 text-foreground">
                        <option value="plain">Plain</option><option value="grid">Grid</option><option value="lined">Lined</option>
                    </select>
                </label>
                <label className="flex min-w-28 items-center gap-2 text-xs text-muted-foreground">Zoom
                    <input aria-label="Zoom" type="range" min="50" max="150" step="10" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-20 accent-primary" /> <span className="w-10 text-right font-mono">{zoom}%</span>
                </label>
                <div aria-label="Zoom buttons" className="flex items-center gap-1">
                    <button type="button" aria-label="Zoom out" title="Zoom out" disabled={zoom <= 50} onClick={() => setZoom((current) => Math.max(50, current - 10))} className="rounded p-2 text-muted-foreground hover:bg-secondary disabled:opacity-40"><ZoomOut className="h-4 w-4" /></button>
                    <button type="button" aria-label="Reset zoom" title="Reset zoom" onClick={() => setZoom(100)} className="rounded p-2 text-muted-foreground hover:bg-secondary"><RotateCcw className="h-4 w-4" /></button>
                    <button type="button" aria-label="Zoom in" title="Zoom in" disabled={zoom >= 150} onClick={() => setZoom((current) => Math.min(150, current + 10))} className="rounded p-2 text-muted-foreground hover:bg-secondary disabled:opacity-40"><ZoomIn className="h-4 w-4" /></button>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <button type="button" aria-label="Undo" title="Undo" disabled={!canUndo} onClick={undo} className="rounded p-2 text-muted-foreground hover:bg-secondary disabled:opacity-40"><Undo2 className="h-4 w-4" /></button>
                    <button type="button" aria-label="Redo" title="Redo" disabled={!canRedo} onClick={redo} className="rounded p-2 text-muted-foreground hover:bg-secondary disabled:opacity-40"><Redo2 className="h-4 w-4" /></button>
                    <button type="button" onClick={clear} className="rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary">Clear</button>
                    <button type="button" onClick={() => void exportPng()} className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"><Download className="h-3.5 w-3.5" /> PNG</button>
                </div>
            </div>
            <div className={`whiteboard-surface ${paper === "grid" ? "whiteboard-grid" : paper === "lined" ? "whiteboard-lined" : ""} max-h-[70vh] overflow-auto rounded-sm border border-border`} style={{ "--whiteboard-grid-size": `${24 * zoom / 100}px` } as React.CSSProperties}>
                <canvas ref={canvasRef} width={1200} height={675} onPointerDown={startDrawing} onPointerMove={moveDrawing} onPointerUp={stopDrawing} onPointerCancel={cancelDrawing} className="block h-auto max-w-none touch-none" style={{ width: `${zoom}%` }} />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary">Cancel</button>
                <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                    {saving ? "Uploading..." : "Save whiteboard"}
                </button>
            </div>
            {saveError && (
                <p role="alert" className="text-sm text-destructive">
                    {saveError}
                </p>
            )}
        </section>
    );
}

function ctxReset(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
    }
}

