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

    const ck = useRef({
        streamIdx: null,
        chunkStart: 0,
        buf: null,
        nextBuf: null,
        nextStart: 0,
        fetching: false,
        playing: false,
    });

    // Refs so event callbacks always see the latest values without stale closures
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
            console.log("[ACTX] creating new AudioContext");
            actxRef.current = new AudioContext();
            gainRef.current = actxRef.current.createGain();
            gainRef.current.connect(actxRef.current.destination);
        }
        if (actxRef.current.state === "suspended") {
            console.log("[ACTX] resuming suspended context");
            actxRef.current.resume();
        }
        console.log("[ACTX] state:", actxRef.current.state);
        return actxRef.current;
    };

    const killNode = () => {
        if (srcRef.current) {
            console.log("[NODE] stopping AudioBufferSourceNode");
            try {
                srcRef.current.stop(0);
            } catch {}
            srcRef.current = null;
        }
    };

    const wipeAll = () => {
        console.log("[WIPE] clearing all buffers and stopping audio");
        killNode();
        ck.current.buf = null;
        ck.current.nextBuf = null;
        ck.current.nextStart = 0;
        ck.current.fetching = false;
        ck.current.chunkStart = 0;
    };

    // ── Schedule buffer, offset to sync with videoTime ────────────────────────
    const scheduleBuffer = useCallback((buf, bufStart, videoTime, rate = 1) => {
        const actx = getActx();
        killNode();

        const offset = Math.max(0, Math.min(videoTime - bufStart, buf.duration - 0.05));
        console.log(
            `[SCHEDULE] bufStart=${bufStart.toFixed(2)}s  videoTime=${videoTime.toFixed(2)}s  offset=${offset.toFixed(
                2
            )}s  rate=${rate}  bufDur=${buf.duration.toFixed(2)}s`
        );

        const node = actx.createBufferSource();
        node.buffer = buf;
        node.playbackRate.value = rate;
        node.connect(gainRef.current);
        node.start(actx.currentTime + 0.03, offset);

        ck.current.buf = buf;
        ck.current.chunkStart = bufStart;
        srcRef.current = node;

        node.onended = () => {
            console.log("[NODE] chunk ended naturally");
            if (!ck.current.playing) {
                console.log("[NODE] not playing — skip rollover");
                return;
            }
            const vid = videoRef.current;
            if (!vid || vid.paused) {
                console.log("[NODE] video paused — skip rollover");
                return;
            }

            if (ck.current.nextBuf) {
                console.log(`[NODE] rolling into nextBuf at ${ck.current.nextStart.toFixed(2)}s`);
                const nb = ck.current.nextBuf;
                const nbStart = ck.current.nextStart;
                ck.current.nextBuf = null;
                ck.current.nextStart = 0;
                ck.current.fetching = false;
                scheduleBuffer(nb, nbStart, vid.currentTime, vid.playbackRate);
                prefetchNext(ck.current.streamIdx, nbStart);
            } else {
                console.warn("[NODE] chunk ended but nextBuf is EMPTY — audio gap!");
            }
        };
    }, []);

    // ── Extract CHUNK_SEC of audio via FFmpeg ─────────────────────────────────
    const extractAudio = useCallback(async (streamIdx, from) => {
        const fname = `ck_${streamIdx}_${Math.floor(from)}.mp3`;
        console.log(`[EXTRACT] stream=0:${streamIdx}  from=${from.toFixed(2)}s  → ${fname}`);
        await ffmpeg.run(
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
        const raw = ffmpeg.FS("readFile", fname);
        try {
            ffmpeg.FS("unlink", fname);
        } catch {}
        console.log(`[EXTRACT] encoded ${raw.byteLength} bytes, decoding audio…`);
        const decoded = await getActx().decodeAudioData(raw.buffer.slice(0));
        console.log(`[EXTRACT] ✓ decoded: dur=${decoded.duration.toFixed(2)}s  ch=${decoded.numberOfChannels}  sr=${decoded.sampleRate}Hz`);
        return decoded;
    }, []);

    // ── Background pre-fetch: next chunk, forward only ────────────────────────
    const prefetchNext = useCallback(
        async (streamIdx, currentStart) => {
            if (ck.current.fetching) {
                console.log("[PREFETCH] already in-flight, skip");
                return;
            }
            ck.current.fetching = true;
            const nextFrom = currentStart + CHUNK_SEC;
            console.log(`[PREFETCH] fetching next chunk from ${nextFrom.toFixed(2)}s`);
            try {
                const buf = await extractAudio(streamIdx, nextFrom);
                ck.current.nextBuf = buf;
                ck.current.nextStart = nextFrom;
                console.log(`[PREFETCH] ✓ nextBuf ready at ${nextFrom.toFixed(2)}s`);
            } catch (e) {
                console.error("[PREFETCH] failed:", e);
            }
            ck.current.fetching = false;
        },
        [extractAudio]
    );

    // ── Wipe → fetch → play from videoTime ───────────────────────────────────
    const loadAndPlay = useCallback(
        async (streamIdx, videoTime) => {
            console.log(`[LOAD] fresh start — stream=0:${streamIdx}  from=${videoTime.toFixed(2)}s`);
            wipeAll();
            ck.current.streamIdx = streamIdx;

            try {
                const buf = await extractAudio(streamIdx, videoTime);
                if (!ck.current.playing) {
                    console.warn("[LOAD] aborted — paused while decoding");
                    return;
                }
                const vid = videoRef.current;
                const currentVid = vid?.currentTime ?? videoTime;
                console.log(`[LOAD] scheduling — vid.currentTime now=${currentVid.toFixed(2)}s`);
                scheduleBuffer(buf, videoTime, currentVid, vid?.playbackRate ?? 1);
                prefetchNext(streamIdx, videoTime);
            } catch (e) {
                console.error("[LOAD] error:", e);
            }
        },
        [extractAudio, scheduleBuffer, prefetchNext]
    );

    // ── KEY FIX: video can autoplay before tracks are probed.
    //    When activeIdx finally becomes valid and video is already running,
    //    onPlay won't fire again — this effect manually kicks audio off. ────────
    useEffect(() => {
        if (activeIdx === null || !tracks.length) return;
        const vid = videoRef.current;
        if (!vid) return;

        console.log(`[EFFECT:activeIdx] activeIdx=${activeIdx}  vid.paused=${vid.paused}  ck.playing=${ck.current.playing}`);

        if (!vid.paused && !ck.current.playing) {
            console.log("[EFFECT:activeIdx] video already playing but audio not started — starting now");
            ck.current.playing = true;
            loadAndPlay(tracks[activeIdx].streamIdx, vid.currentTime);
        }
    }, [activeIdx, tracks, loadAndPlay]);

    // ── Hidden video events ───────────────────────────────────────────────────
    const onPlay = useCallback(async () => {
        const idx = activeIdxRef.current;
        const tks = tracksRef.current;
        console.log(`[VIDEO:onPlay] activeIdx=${idx}  tracks=${tks.length}  ck.playing=${ck.current.playing}`);

        if (idx === null || !tks.length) {
            console.warn("[VIDEO:onPlay] no track selected yet — skipping audio start");
            return;
        }
        ck.current.playing = true;
        const actx = getActx();
        if (actx.state === "suspended") await actx.resume();
        await loadAndPlay(tks[idx].streamIdx, videoRef.current.currentTime);
    }, [loadAndPlay]);

    const onPause = useCallback(() => {
        console.log("[VIDEO:onPause] stopping audio");
        ck.current.playing = false;
        killNode();
    }, []);

    const onSeeked = useCallback(async () => {
        const t = videoRef.current?.currentTime ?? 0;
        console.log(`[VIDEO:onSeeked] position=${t.toFixed(2)}s  playing=${ck.current.playing}`);
        if (!ck.current.playing) return;
        await loadAndPlay(ck.current.streamIdx, t);
    }, [loadAndPlay]);

    const onTimeUpdate = useCallback(() => {
        const vid = videoRef.current;
        if (!vid || !ck.current.playing || !ck.current.buf) return;
        const remaining = ck.current.chunkStart + CHUNK_SEC - vid.currentTime;
        if (remaining < REFETCH_AT && !ck.current.fetching && !ck.current.nextBuf) {
            console.log(`[TIMEUPDATE] ${remaining.toFixed(1)}s left — triggering prefetch`);
            prefetchNext(ck.current.streamIdx, ck.current.chunkStart);
        }
    }, [prefetchNext]);

    // ── Track pill click ──────────────────────────────────────────────────────
    const switchTrack = useCallback(
        async (idx) => {
            if (idx === activeIdxRef.current) {
                console.log("[TRACK] same track, no-op");
                return;
            }
            const track = tracksRef.current[idx];
            console.log(`[TRACK] switching → idx=${idx}  stream=0:${track?.streamIdx}  playing=${ck.current.playing}`);
            setActiveIdx(idx);
            if (ck.current.playing) {
                await loadAndPlay(track.streamIdx, videoRef.current.currentTime);
            } else {
                ck.current.streamIdx = track.streamIdx;
                console.log("[TRACK] not playing — streamIdx updated for next play");
            }
        },
        [loadAndPlay]
    );

    // ── Mirror vidstack UI → hidden video ─────────────────────────────────────
    const mirrorPlay = useCallback(() => {
        console.log("[MIRROR] → play hidden video");
        videoRef.current?.play().catch((e) => console.error("[MIRROR] play failed:", e));
    }, []);

    const mirrorPause = useCallback(() => {
        console.log("[MIRROR] → pause hidden video");
        if (!videoRef.current?.paused) videoRef.current?.pause();
    }, []);

    const mirrorSeek = useCallback(() => {
        const vid = videoRef.current;
        if (playerRef.current && vid) {
            const t = playerRef.current.currentTime ?? vid.currentTime;
            console.log(`[MIRROR] → seek hidden video to ${t.toFixed(2)}s`);
            vid.currentTime = t;
        }
    }, []);

    // ── File load + FFmpeg probe ──────────────────────────────────────────────
    const processFile = useCallback(async (file) => {
        if (!file) return;
        console.log("[FILE] loading:", file.name, `(${(file.size / 1e6).toFixed(1)} MB)`);

        setAppPhase("probing");
        setTracks([]);
        setActiveIdx(null);
        ck.current = { streamIdx: null, chunkStart: 0, buf: null, nextBuf: null, nextStart: 0, fetching: false, playing: false };

        const objectURL = URL.createObjectURL(file);
        setMediaSrc({ src: file, type: "video/object" });
        setVideoName(file.name);
        if (videoRef.current) videoRef.current.src = objectURL;

        if (!ffmpeg.isLoaded()) {
            console.log("[FILE] loading FFmpeg WASM…");
            await ffmpeg.load();
        }
        ffmpeg.FS("writeFile", "input.video", await fetchFile(file));
        console.log("[FILE] written to FFmpeg FS, probing…");

        let log = "";
        ffmpeg.setLogger(({ message }) => (log += message + "\n"));
        try {
            await ffmpeg.run("-i", "input.video");
        } catch {}
        ffmpeg.setLogger(() => {});

        const found = [];
        log.split("\n").forEach((line) => {
            if (line.includes("Stream #0:") && line.includes("Audio:")) {
                const m = line.match(/Stream #0:(\d+)(?:\((\w+)\))?/);
                if (m) {
                    const t = { streamIdx: m[1], lang: m[2] || null, label: trackLabel(m[2], found.length) };
                    console.log(`[PROBE] stream 0:${t.streamIdx}  lang=${t.lang}  → "${t.label}"`);
                    found.push(t);
                }
            }
        });

        console.log(`[PROBE] total: ${found.length} audio stream(s)`);
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
        <div className="flex flex-col  lg:px-10 pt-4 lg:pt-6 mb-20 bg-bg text-neutral-50 overflow-hidden font-sans">
            {/* --- HIDDEN CORE LOGIC ELEMENTS --- */}
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

            {/* --- UI RENDER --- */}
            {!mediaSrc ? (
                /* DRAG AND DROP ZONE */
                <div className="flex-1 flex flex-col items-center justify-center w-full  mx-auto px-4">
                    <div
                        className={`lg:w-4xl w-[300px] text-sm aspect-video lg:aspect-[21/9] flex flex-col items-center justify-center 
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
                        <div className={` mb-4 text-5xl transition-colors ${isDrag ? "text-blue-400" : "text-neutral-600"}`}>▣</div>
                        <p className="text-neutral-300  font-medium mb-2">
                            Drop a video file here or <span className="text-blue-400 hover:text-blue-300 transition-colors">browse</span>
                        </p>
                        {/* <p className="text-neutral-500 text-sm font-mono tracking-wide">MKV · MP4 · AVI · TS · M2TS · WebM</p> */}
                    </div>
                </div>
            ) : (
                /* MAIN PLAYER & SIDEBAR LAYOUT */
                <div className="flex flex-col lg:flex-row justify-center gap-6 lg:gap-10 w-full mt-2 lg:mt-4">
                    {/* LEFT: VIDEO PLAYER AREA */}
                    <div className="flex flex-col w-full lg:w-[60vw] max-w-5xl">
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

                    {/* RIGHT: TRACKS SIDEBAR (Mimicking the Watch Playlist) */}
                    <div className="flex-col flex justify-between">
                        <div className="w-full lg:w-[350px] lg:h-fit flex flex-col bg-neutral-800/80 rounded-xl p-4 border border-neutral-700/50">
                            {/* SIDEBAR HEADER */}
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-700">
                                <span className="text-md font-semibold text-neutral-100">Audio Tracks</span>
                                <span className="text-neutral-500">•</span>
                                <span className="text-xs font-normal text-neutral-400">
                                    {tracks.length} {tracks.length === 1 ? "Stream" : "Streams"}
                                </span>
                            </div>

                            {/* PROBING STATE */}
                            {appPhase === "probing" && (
                                <div className="flex flex-col items-center justify-center h-40 text-neutral-400 text-sm gap-4">
                                    <span className="inline-block w-6 h-6 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin" />
                                    <p className="animate-pulse">Probing audio streams...</p>
                                </div>
                            )}

                            {/* TRACKS LIST */}
                            {appPhase === "ready" && tracks.length > 0 && (
                                <div className="flex flex-wrap gap-0 overflow-y-auto pr-1 pb-3 custom-scrollbar">
                                    {tracks.map((t, i) => (
                                        <button
                                            key={t.streamIdx}
                                            onClick={() => switchTrack(i)}
                                            className={`w-fit h-fit flex gap-4 items-center cursor-pointer text-left p-2.5 rounded-md text-sm transition-all duration-200
                                        `}
                                        >
                                            <p
                                                className={`font-medium truncate px-3 py-2 rounded-lg transition  text-neutral-300 ${
                                                    activeIdx === i ? "bg-blue-500 hover:bg-blue-600/60" : "bg-neutral-700 hover:bg-neutral-600/50"
                                                }`}
                                            >
                                                {t.label || `Audio Stream ${i + 1}`}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* NO TRACKS FALLBACK */}
                            {appPhase === "ready" && tracks.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-32 mt-4 rounded-lg border border-red-900/50 bg-red-950/20 text-center p-4">
                                    <span className="text-red-400 text-xl mb-2">⚠</span>
                                    <p className="text-red-300/80 text-sm">No audio streams detected in this file.</p>
                                </div>
                            )}
                        </div>
                        {/* VIDEO META & CONTROLS */}
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
