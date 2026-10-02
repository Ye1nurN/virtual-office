# Ostrov Windows application

- This is the actual native Windows application. Do not replace it with a website, Electron, or a browser preview.
- Play local audio and observe/control Windows media sessions, including Telegram Desktop. No accounts, server, subscription, or network calls are needed. Never access Telegram chat databases, credentials or tdata.
- Preserve the selected compact dark player. The idle player is entirely hidden; audio continues independently.
- Global Alt+M toggles the panel. Escape and deactivation dismiss it. The tiny top-edge activation zone can be disabled from the tray.
- Do not enable startup automatically. Keep all preferences under LocalApplicationData/Ostrov; never modify source music files.
- No polling or progress timer while the panel is hidden. Do not claim zero total CPU during audio decoding.
- Build with build.ps1 using installed MSBuild and .NET Framework reference assemblies. Run the executable's --self-test before shipping and verify native UI with Computer Use.
- Commit source only. Exclude bin, obj, .qa, settings, audio samples, logs, and generated application binaries.
- Browser work in ../music-island-prototype is abandoned exploratory work and must not be a dependency.
