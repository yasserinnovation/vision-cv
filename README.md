# Industrial Computer Vision — GitHub Pages embed

A static, simulated computer vision front end for the existing Vision Intelligence ServiceNow Command Center.

## Upload
1. Upload `index.html`, `styles.css`, `script.js`, and `assets/industrial-scene.svg` to the **root** of your GitHub repository.
2. GitHub repo → Settings → Pages → Deploy from branch → `main` → `/ (root)`.
3. Open the published URL to check the animation and clickable boxes.
4. ServiceNow → `sys_properties.list` → set `x_snc_vision_int_0.cv_embed_url` to the GitHub Pages URL.
5. Open **Vision Monitoring**, hard refresh, and click a detection.

## Optional real video
Upload a licensed file as `assets/industrial-footage.mp4`. The page will prefer it to the included industrial illustration. **Bounding boxes are simulated and will need retuning to match the subjects in your video**: edit each track's `x`, `y`, `w`, and `h` in `script.js`.

## Messaging
Sends `{source:'vicc-cv', type:'ready', payload:{tracks:4}}`, periodic `detections`, and `detectionSelected`. Receives `{source:'vicc-dashboard',type:'pause'|'resume'|'selectTrack'|'setMode',payload}`. Accepted inbound origin is strictly set in `ALLOWED_PARENT_ORIGINS` inside `script.js`; configure that for your ServiceNow host. Events are not persisted by this static page.

## Important
- The `LIVE SIMULATION` state is still **simulation**, not real AI inference.
- ServiceNow must allow framing GitHub Pages in its CSP/frame-src rules.
- The frame should be sandboxed by the ServiceNow app, as described in its integration contract.
- This is a visual/demo app; no live camera access, video analytics engine, or detection service is included.
- GitHub Pages is public. Do not publish sensitive footage or secrets.
