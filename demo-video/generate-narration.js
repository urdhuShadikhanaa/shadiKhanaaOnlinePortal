const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const scenarios = require('./scenarios');

const OUTPUT_DIR = path.join(__dirname, '..', 'demo-videos');
const NARRATION_DIR = path.join(OUTPUT_DIR, 'narration');
const MANIFEST_PATH = path.join(NARRATION_DIR, 'manifest.json');
const TELUGU_VOICE = 'te-IN-ShrutiNeural';

function runFfmpeg(args) {
    const result = spawnSync(ffmpegPath, args, { encoding: 'utf8' });
    if (result.status !== 0) {
        throw new Error(result.stderr || result.stdout || 'ffmpeg failed');
    }
}

async function generateSegmentWav(text, wavPath) {
    const mp3Path = `${wavPath}.mp3`;
    const tts = new MsEdgeTTS();
    await tts.setMetadata(TELUGU_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text);

    await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(mp3Path);
        audioStream.on('error', reject);
        writeStream.on('error', reject);
        audioStream.on('close', resolve);
        audioStream.pipe(writeStream);
    });

    runFfmpeg(['-y', '-i', mp3Path, '-ar', '22050', '-ac', '1', wavPath]);
    fs.unlinkSync(mp3Path);

    if (!fs.existsSync(wavPath)) {
        throw new Error(`Failed to create narration file: ${wavPath}`);
    }
}

function getWavDurationSeconds(wavPath) {
    const buffer = fs.readFileSync(wavPath);
    const byteRate = buffer.readUInt32LE(28);
    if (!byteRate) {
        return 5;
    }
    const dataSize = buffer.length - 44;
    return Math.max(1, dataSize / byteRate);
}

async function buildManifest() {
    fs.mkdirSync(NARRATION_DIR, { recursive: true });

    const segments = [];
    let cursorMs = 0;

    for (let index = 0; index < scenarios.length; index += 1) {
        const step = scenarios[index];
        const wavPath = path.join(NARRATION_DIR, `${String(index + 1).padStart(2, '0')}-${step.id}.wav`);
        console.log(`Generating Telugu voice [${index + 1}/${scenarios.length}]: ${step.id}`);

        await generateSegmentWav(step.narration, wavPath);
        const durationMs = Math.ceil(getWavDurationSeconds(wavPath) * 1000);

        segments.push({
            id: step.id,
            wavPath,
            voice: TELUGU_VOICE,
            startMs: cursorMs,
            durationMs,
            stepWaitMs: step.waitMs
        });

        cursorMs += Math.max(step.waitMs, durationMs + 500);
    }

    fs.writeFileSync(
        MANIFEST_PATH,
        JSON.stringify(
            {
                language: 'te-IN',
                voice: TELUGU_VOICE,
                segments,
                totalMs: cursorMs
            },
            null,
            2
        )
    );

    console.log('');
    console.log('Telugu narration manifest:', MANIFEST_PATH);
    console.log('Voice:', TELUGU_VOICE);
    console.log('Total planned duration:', `${(cursorMs / 1000).toFixed(1)}s`);
}

buildManifest().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
