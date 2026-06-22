const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const OUTPUT_DIR = path.join(__dirname, '..', 'demo-videos');
const VIDEO_INPUT = path.join(OUTPUT_DIR, 'Urdu-Shadikhana-Full-Demo-video.webm');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'narration', 'manifest.json');
const NARRATION_DIR = path.join(OUTPUT_DIR, 'narration');
const AUDIO_TRACK = path.join(OUTPUT_DIR, 'Urdu-Shadikhana-Full-Demo-audio.wav');
const FINAL_MP4 = path.join(OUTPUT_DIR, 'Urdu-Shadikhana-Full-Demo-Telugu.mp4');
const FINAL_WEBM = path.join(OUTPUT_DIR, 'Urdu-Shadikhana-Full-Demo-Telugu.webm');
const SILENCE_SECONDS = 0.35;

function runFfmpeg(args) {
    const result = spawnSync(ffmpegPath, args, { encoding: 'utf8' });
    if (result.status !== 0) {
        throw new Error(result.stderr || result.stdout || 'ffmpeg failed');
    }
}

function buildCombinedAudio(manifest) {
    const listPath = path.join(NARRATION_DIR, 'concat-list.txt');
    const lines = [];

    manifest.segments.forEach((segment, index) => {
        lines.push(`file '${segment.wavPath.replace(/\\/g, '/')}'`);
        if (index < manifest.segments.length - 1) {
            lines.push(`file '${path.join(NARRATION_DIR, 'gap.wav').replace(/\\/g, '/')}'`);
        }
    });

    runFfmpeg([
        '-y',
        '-f',
        'lavfi',
        '-i',
        'anullsrc=r=22050:cl=mono',
        '-t',
        String(SILENCE_SECONDS),
        '-q:a',
        '9',
        path.join(NARRATION_DIR, 'gap.wav')
    ]);

    fs.writeFileSync(listPath, lines.join('\n'), 'utf8');
    runFfmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c:a', 'pcm_s16le', AUDIO_TRACK]);
}

function mergeVideoAudio() {
    if (!fs.existsSync(VIDEO_INPUT)) {
        throw new Error(`Missing video: ${VIDEO_INPUT}. Run npm run record:full first.`);
    }
    if (!fs.existsSync(MANIFEST_PATH)) {
        throw new Error(`Missing narration: ${MANIFEST_PATH}. Run npm run narrate first.`);
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    console.log('Building combined narration track...');
    buildCombinedAudio(manifest);

    console.log('Merging video and voice into MP4...');
    runFfmpeg([
        '-y',
        '-i',
        VIDEO_INPUT,
        '-i',
        AUDIO_TRACK,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-shortest',
        FINAL_MP4
    ]);

    console.log('Creating WebM copy with voice...');
    runFfmpeg([
        '-y',
        '-i',
        VIDEO_INPUT,
        '-i',
        AUDIO_TRACK,
        '-c:v',
        'copy',
        '-c:a',
        'libopus',
        '-shortest',
        FINAL_WEBM
    ]);

    const mp4Stats = fs.statSync(FINAL_MP4);
    console.log('');
    console.log('Final demo videos with voice:');
    console.log(' ', FINAL_MP4);
    console.log(' ', `${(mp4Stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(' ', FINAL_WEBM);
}

mergeVideoAudio();
