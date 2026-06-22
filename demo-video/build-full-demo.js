const { spawnSync } = require('child_process');
const path = require('path');

const root = __dirname;

function run(label, script) {
    console.log('');
    console.log('='.repeat(60));
    console.log(label);
    console.log('='.repeat(60));
    const result = spawnSync(process.execPath, [path.join(root, script)], {
        stdio: 'inherit',
        cwd: root
    });
    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}

run('Step 1/3 — Generate voice narration (Windows TTS)', 'generate-narration.js');
run('Step 2/3 — Record browser demo with sample data', 'record-full-demo.js');
run('Step 3/3 — Merge video + voice', 'merge-demo.js');

console.log('');
console.log('All done. Open demo-videos\\Urdu-Shadikhana-Full-Demo-Telugu.mp4');
