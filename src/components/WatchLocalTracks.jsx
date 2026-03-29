import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { MediaPlayer, MediaProvider, useMediaState } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const ffmpeg = createFFmpeg({ log: false });

// ── The only two knobs ────────────────────────────────────────────────────────
const CHUNK_SEC = 10; // seconds of audio fetched per chunk (forward only)
const REFETCH_AT = 6; // seconds remaining before fetching next chunk
// ─────────────────────────────────────────────────────────────────────────────

// ── FFmpeg mutex ──────────────────────────────────────────────────────────────
let ffmpegLocked = false;
const ffmpegWaiters = [];
const acquireFFmpeg = () =>
    new Promise((resolve) => {
        if (!ffmpegLocked) {
            ffmpegLocked = true;
            resolve();
        } else {
            ffmpegWaiters.push(resolve);
        }
    });
const releaseFFmpeg = () => {
    if (ffmpegWaiters.length > 0) ffmpegWaiters.shift()();
    else ffmpegLocked = false;
};
const runFFmpeg = async (...args) => {
    await acquireFFmpeg();
    try {
        if (!ffmpeg.isLoaded()) await ffmpeg.load();
        await ffmpeg.run(...args);
    } catch (e) {
        if (e?.message?.includes("not ready")) {
            try {
                await ffmpeg.load();
                await ffmpeg.run(...args);
            } catch (retryErr) {
                releaseFFmpeg();
                throw retryErr;
            }
        } else {
            releaseFFmpeg();
            throw e;
        }
    }
    releaseFFmpeg();
};
// ─────────────────────────────────────────────────────────────────────────────

const LANGS = {
    eng: "English",
    hin: "Hindi",
    jpn: "Japanese",
    fra: "French",
    fre: "French",
    ger: "German",
    deu: "German",
    spa: "Spanish",
    por: "Portuguese",
    chi: "Chinese",
    zho: "Chinese",
    kor: "Korean",
    ara: "Arabic",
    rus: "Russian",
    ita: "Italian",
    tur: "Turkish",
    tam: "Tamil",
    tel: "Telugu",
    ben: "Bengali",
    und: "Unknown",
};
const trackLabel = (lang, idx) => (lang ? LANGS[lang] || lang.toUpperCase() : `Track ${idx + 1}`);

const VideoTitle = ({ name }) => {
    const controlsVisible = useMediaState("controlsVisible");
    return (
        <div
            className={`absolute top-0 left-0 w-full px-4 py-3 z-10 bg-gradient-to-b
                        from-black/70 to-transparent text-neutral-50 pointer-events-none
                        transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
        >
            <p className="text-md font-semibold truncate">{name}</p>
        </div>
    );
};

const WatchLocal = () => {
    const [mediaSrc, setMediaSrc] = useState(null);
    const [videoName, setVideoName] = useState("");
    const [tracks, setTracks] = useState([]);
    const [activeIdx, setActiveIdx] = useState(null);
    const [appPhase, setAppPhase] = useState("idle");
    const [isDrag, setIsDrag] = useState(false);

    const fileInputRef = useRef(null);
    const playerRef = useRef(null);
    const videoRef = useRef(null);

    const actxRef = useRef(null);
    const gainRef = useRef(null);
    const srcRef = useRef(null);
    // Track the current object URL so we can revoke it before creating a new one
    const objectURLRef = useRef(null);

    const ck = useRef({
        streamIdx: null,
        chunkStart: 0,
        // NOTE: we do NOT store the AudioBuffer here after scheduling.
        // Once the AudioBufferSourceNode is playing, it holds its own reference.
        // We only need a boolean to know whether a chunk is currently active.
        hasChunk: false,
        nextBuf: null, // pre-fetched next AudioBuffer — released after hand-off
        nextStart: 0,
        fetching: false,
        playing: false,
        gen: 0,
    });

    const tracksRef = useRef([]);
    const activeIdxRef = useRef(null);
    useEffect(() => {
        tracksRef.current = tracks;
    }, [tracks]);
    useEffect(() => {
        activeIdxRef.current = activeIdx;
    }, [activeIdx]);

    // ── AudioContext ──────────────────────────────────────────────────────────
    const getActx = () => {
        if (!actxRef.current || actxRef.current.state === "closed") {
            actxRef.current = new AudioContext();
            gainRef.current = actxRef.current.createGain();
            gainRef.current.connect(actxRef.current.destination);
        }
        if (actxRef.current.state === "suspended") actxRef.current.resume();
        return actxRef.current;
    };

    const killNode = () => {
        if (srcRef.current) {
            try {
                srcRef.current.stop(0);
            } catch {}
            // Disconnect so the node (and its buffer) can be GC'd immediately
            try {
                srcRef.current.disconnect();
            } catch {}
            srcRef.current = null;
        }
    };

    const wipeAll = () => {
        killNode();
        ck.current.hasChunk = false;
        ck.current.nextBuf = null; // release AudioBuffer for GC
        ck.current.nextStart = 0;
        ck.current.fetching = false;
        ck.current.chunkStart = 0;
        ck.current.gen += 1;
    };

    // ── Schedule buffer, offset so audio is in sync with videoTime ────────────
    const scheduleBuffer = useCallback((buf, bufStart, videoTime, rate = 1) => {
        const actx = getActx();
        killNode();

        const offset = Math.max(0, Math.min(videoTime - bufStart, buf.duration - 0.05));

        const node = actx.createBufferSource();
        node.buffer = buf;
        node.playbackRate.value = rate;
        node.connect(gainRef.current);
        node.start(actx.currentTime + 0.03, offset);

        ck.current.chunkStart = bufStart;
        ck.current.hasChunk = true;
        srcRef.current = node;
        // buf reference intentionally NOT stored in ck — the node owns it now.
        // This lets the caller's local `buf` variable go out of scope and be GC'd.

        node.onended = () => {
            if (!ck.current.playing) return;
            const vid = videoRef.current;
            if (!vid || vid.paused) return;

            if (ck.current.nextBuf) {
                const nb = ck.current.nextBuf;
                const nbStart = ck.current.nextStart;
                // Release slot before scheduling so the old buffer is GC-eligible
                // the moment the new node takes ownership
                ck.current.nextBuf = null;
                ck.current.nextStart = 0;
                ck.current.fetching = false;
                scheduleBuffer(nb, nbStart, vid.currentTime, vid.playbackRate);
                prefetchNext(ck.current.streamIdx, nbStart);
            } else {
                console.warn("[NODE] chunk ended — nextBuf EMPTY, audio gap!");
                ck.current.hasChunk = false;
            }
        };
    }, []);

    // ── Extract CHUNK_SEC seconds of audio via the mutex-guarded FFmpeg ───────
    const extractAudio = useCallback(async (streamIdx, from) => {
        const myGen = ck.current.gen;
        const fname = `ck_${streamIdx}_${Math.floor(from)}.mp3`;

        await runFFmpeg(
            "-ss",
            String(from),
            "-i",
            "input.video",
            "-t",
            String(CHUNK_SEC),
            "-map",
            `0:${streamIdx}`,
            "-vn",
            "-acodec",
            "libmp3lame",
            "-q:a",
            "5",
            fname
        );

        if (ck.current.gen !== myGen) {
            try {
                ffmpeg.FS("unlink", fname);
            } catch {}
            throw new Error("stale");
        }

        const raw = ffmpeg.FS("readFile", fname);
        // Unlink immediately — keeps the WASM virtual FS as lean as possible
        try {
            ffmpeg.FS("unlink", fname);
        } catch {}

        // Decode into an AudioBuffer; `raw` can be GC'd after decodeAudioData
        // takes ownership of the underlying ArrayBuffer via transfer.
        const decoded = await getActx().decodeAudioData(raw.buffer.slice(0));
        // raw (Uint8Array) and its backing buffer are now eligible for GC
        return decoded;
    }, []);

    // ── Background pre-fetch: next chunk, forward only ────────────────────────
    const prefetchNext = useCallback(
        async (streamIdx, currentStart) => {
            if (ck.current.fetching) return;
            ck.current.fetching = true;
            try {
                const buf = await extractAudio(streamIdx, currentStart + CHUNK_SEC);
                if (buf) {
                    ck.current.nextBuf = buf;
                    ck.current.nextStart = currentStart + CHUNK_SEC;
                }
            } catch (e) {
                if (e?.message !== "stale") console.error("[PREFETCH] failed:", e);
            }
            ck.current.fetching = false;
        },
        [extractAudio]
    );

    // ── Wipe → fetch → play from videoTime ───────────────────────────────────
    const loadAndPlay = useCallback(
        async (streamIdx, videoTime) => {
            wipeAll();
            ck.current.streamIdx = streamIdx;
            try {
                const buf = await extractAudio(streamIdx, videoTime);
                if (!buf) return;
                if (!ck.current.playing) return;
                const vid = videoRef.current;
                const currentVid = vid?.currentTime ?? videoTime;
                scheduleBuffer(buf, videoTime, currentVid, vid?.playbackRate ?? 1);
                // buf goes out of scope here — node holds the only remaining reference
                prefetchNext(streamIdx, videoTime);
            } catch (e) {
                if (e?.message !== "stale") console.error("[LOAD] error:", e);
            }
        },
        [extractAudio, scheduleBuffer, prefetchNext]
    );

    useEffect(() => {
        if (activeIdx === null || !tracks.length) return;
        const vid = videoRef.current;
        if (!vid) return;
        if (!vid.paused && !ck.current.playing) {
            ck.current.playing = true;
            loadAndPlay(tracks[activeIdx].streamIdx, vid.currentTime);
        }
    }, [activeIdx, tracks, loadAndPlay]);

    // ── Hidden video events ───────────────────────────────────────────────────
    const onPlay = useCallback(async () => {
        const idx = activeIdxRef.current;
        const tks = tracksRef.current;
        if (idx === null || !tks.length) return;
        ck.current.playing = true;
        const actx = getActx();
        if (actx.state === "suspended") await actx.resume();
        await loadAndPlay(tks[idx].streamIdx, videoRef.current.currentTime);
    }, [loadAndPlay]);

    const onPause = useCallback(() => {
        ck.current.playing = false;
        killNode();
    }, []);

    const onSeeked = useCallback(async () => {
        const t = videoRef.current?.currentTime ?? 0;
        if (!ck.current.playing) return;
        await loadAndPlay(ck.current.streamIdx, t);
    }, [loadAndPlay]);

    const onTimeUpdate = useCallback(() => {
        const vid = videoRef.current;
        if (!vid || !ck.current.playing || !ck.current.hasChunk) return;
        const remaining = ck.current.chunkStart + CHUNK_SEC - vid.currentTime;
        if (remaining < REFETCH_AT && !ck.current.fetching && !ck.current.nextBuf) {
            prefetchNext(ck.current.streamIdx, ck.current.chunkStart);
        }
    }, [prefetchNext]);

    // ── Track pill click ──────────────────────────────────────────────────────
    const switchTrack = useCallback(
        async (idx) => {
            if (idx === activeIdxRef.current) return;
            const track = tracksRef.current[idx];
            setActiveIdx(idx);
            if (ck.current.playing) {
                await loadAndPlay(track.streamIdx, videoRef.current.currentTime);
            } else {
                ck.current.streamIdx = track.streamIdx;
            }
        },
        [loadAndPlay]
    );

    // ── Mirror vidstack UI → hidden video ─────────────────────────────────────
    const mirrorPlay = useCallback(() => videoRef.current?.play().catch(console.error), []);
    const mirrorPause = useCallback(() => {
        if (!videoRef.current?.paused) videoRef.current?.pause();
    }, []);
    const mirrorSeek = useCallback(() => {
        const vid = videoRef.current;
        if (playerRef.current && vid) vid.currentTime = playerRef.current.currentTime ?? vid.currentTime;
    }, []);

    // ── File load + FFmpeg probe ──────────────────────────────────────────────
    const processFile = useCallback(async (file) => {
        if (!file) return;

        setAppPhase("probing");
        setTracks([]);
        setActiveIdx(null);
        ck.current = { streamIdx: null, chunkStart: 0, hasChunk: false, nextBuf: null, nextStart: 0, fetching: false, playing: false, gen: 0 };

        // ── Memory: revoke previous object URL before creating a new one ──────
        if (objectURLRef.current) {
            URL.revokeObjectURL(objectURLRef.current);
            objectURLRef.current = null;
        }

        // ── Memory: unlink previous video from WASM FS before writing new one ─
        // This frees the old file's copy from the WASM heap (often 1-4 GB).
        if (ffmpeg.isLoaded()) {
            try {
                ffmpeg.FS("unlink", "input.video");
            } catch {}
        }

        const objectURL = URL.createObjectURL(file);
        objectURLRef.current = objectURL;
        setMediaSrc({ src: file, type: "video/object" });
        setVideoName(file.name);
        if (videoRef.current) videoRef.current.src = objectURL;

        if (!ffmpeg.isLoaded()) await ffmpeg.load();

        // ── Memory: fetchFile returns a Uint8Array — write it then let it drop ─
        // We do NOT store the result in a variable so it's GC-eligible immediately
        // after writeFile copies it into the WASM heap.
        ffmpeg.FS("writeFile", "input.video", await fetchFile(file));

        let log = "";
        ffmpeg.setLogger(({ message }) => (log += message + "\n"));
        await runFFmpeg("-i", "input.video").catch(() => {});
        ffmpeg.setLogger(() => {});

        const found = [];
        log.split("\n").forEach((line) => {
            if (line.includes("Stream #0:") && line.includes("Audio:")) {
                const m = line.match(/Stream #0:(\d+)(?:\((\w+)\))?/);
                if (m) found.push({ streamIdx: m[1], lang: m[2] || null, label: trackLabel(m[2], found.length) });
            }
        });

        setTracks(found);
        if (found.length) setActiveIdx(0);
        setAppPhase("ready");
    }, []);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) processFile(f);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDrag(false);
        processFile(e.dataTransfer.files[0]);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col lg:px-10 pt-4 lg:pt-2 mb-20 bg-bg text-neutral-50 overflow-hidden font-sans">
            <video
                ref={videoRef}
                muted
                playsInline
                style={{ display: "none" }}
                onPlay={onPlay}
                onPause={onPause}
                onSeeked={onSeeked}
                onTimeUpdate={onTimeUpdate}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mkv,.ts,.m2ts"
                onChange={handleFileChange}
                className="hidden"
            />

            {!mediaSrc ? (
                <div className="flex-1 flex flex-col items-center justify-center w-full mx-auto px-4">
                    <div
                        className={`lg:w-xl w-[300px] text-sm aspect-video lg:aspect-[21/9] flex flex-col items-center justify-center
                                border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer shadow-lg
                                ${
                                    isDrag
                                        ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                                        : "border-neutral-700 bg-neutral-900/40 hover:bg-neutral-800/60 hover:border-neutral-500"
                                }`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDrag(true);
                        }}
                        onDragLeave={() => setIsDrag(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                    >
                        <div className={`mb-4 text-5xl transition-colors ${isDrag ? "text-blue-400" : "text-neutral-600"}`}>▣</div>
                        <p className="text-neutral-300 text-lg font-medium mb-2">
                            Drop a video file here or <span className="text-blue-400 hover:text-blue-300 transition-colors">browse</span>
                        </p>
                        <p className="text-sm text-neutral-500">view local video with multiple audio tracks</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row justify-center gap-6 lg:gap-10 w-full">
                    {/* VIDEO PLAYER */}
                    <div className="flex flex-col w-full lg:w-[60vw] max-w-3xl">
                        <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black border border-neutral-800">
                            <MediaPlayer
                                key={videoName}
                                src={mediaSrc}
                                aspectRatio="16/9"
                                autoPlay
                                muted
                                playsInline
                                ref={playerRef}
                                className="relative"
                                onPlay={mirrorPlay}
                                onPause={mirrorPause}
                                onSeeked={mirrorSeek}
                            >
                                <MediaProvider />
                                <VideoTitle name={videoName} />
                                <DefaultVideoLayout icons={defaultLayoutIcons} />
                            </MediaPlayer>
                        </div>
                    </div>

                    {/* TRACKS SIDEBAR */}
                    <div className="flex-col flex gap-5">
                        <div className="w-full lg:w-[350px] lg:h-fit flex flex-col bg-neutral-800/80 rounded-xl p-4 border border-neutral-700/50">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-700">
                                <span className="text-md font-semibold text-neutral-100">Audio Tracks</span>
                                <span className="text-neutral-500">•</span>
                                <span className="text-xs font-normal text-neutral-400">
                                    {tracks.length} {tracks.length === 1 ? "Stream" : "Streams"}
                                </span>
                            </div>

                            {appPhase === "probing" && (
                                <div className="flex flex-col items-center justify-center h-40 text-neutral-400 text-sm gap-4">
                                    <span className="inline-block w-6 h-6 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin" />
                                    <p className="animate-pulse">Probing audio streams...</p>
                                </div>
                            )}

                            {appPhase === "ready" && tracks.length > 0 && (
                                <div className="flex flex-wrap gap-0 overflow-y-auto pr-1 pb-3">
                                    {tracks.map((t, i) => (
                                        <button
                                            key={t.streamIdx}
                                            onClick={() => switchTrack(i)}
                                            className="w-fit h-fit flex gap-4 items-center cursor-pointer text-left p-2.5 rounded-md text-sm transition-all duration-200"
                                        >
                                            <p
                                                className={`font-medium truncate px-3 py-2 rounded-lg transition text-neutral-300
                                                ${activeIdx === i ? "bg-blue-500 hover:bg-blue-600/60" : "bg-neutral-700 hover:bg-neutral-600/50"}`}
                                            >
                                                {t.label || `Audio Stream ${i + 1}`}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {appPhase === "ready" && tracks.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-32 rounded-lg border border-red-900/50 bg-red-950/20 text-center p-4">
                                    <span className="text-red-400 text-xl mb-2">⚠</span>
                                    <p className="text-red-300/80 text-sm">No audio streams detected in this file.</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md text-sm font-medium transition-colors border border-neutral-700 hover:border-neutral-600 shrink-0"
                        >
                            Load Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WatchLocal;
