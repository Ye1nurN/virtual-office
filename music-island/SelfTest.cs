using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace Ostrov
{
    public static class SelfTest
    {
        public static async Task<int> Run(string report)
        {
            var output = new StringBuilder();
            string root = Path.Combine(Path.GetDirectoryName(Path.GetFullPath(report)), "run-" + DateTime.Now.ToString("yyyyMMdd-HHmmss"));
            Directory.CreateDirectory(root);
            Action<bool, string> check = (condition, name) => { if (!condition) throw new Exception(name); output.AppendLine("PASS " + name); };
            try
            {
                string wav = Path.Combine(root, "Проверка музыки.wav"); WriteSilence(wav, 3);
                var imported = await Library.ImportAsync(new[] { wav, wav, Path.Combine(root, "missing.mp3") }, new string[0]);
                check(imported.Count == 1, "Import deduplicates Unicode paths and ignores missing files");
                check(Library.Enumerate(root).Count() == 1, "Folder scan includes supported audio only");
                using (var native = new NativeHost(() => { }, () => { }, false))
                    check(native.Registered, "Global hotkey and native activation host initialize");
                var store = new Store(Path.Combine(root, "data"));
                store.State.Tracks.AddRange(imported); store.State.Tracks[0].Favorite = true; store.State.Volume = .23;
                check(store.Save(), "Atomic settings save");
                var restored = new Store(Path.Combine(root, "data"));
                check(restored.State.Tracks.Count == 1 && restored.State.Tracks[0].Favorite && Math.Abs(restored.State.Volume - .23) < .001, "Library and preferences survive restart");
                restored.State.Volume = .3; restored.Save();
                File.WriteAllText(Path.Combine(root, "data", "library.json"), "invalid json");
                check(new Store(Path.Combine(root, "data")).State.Tracks.Count == 1, "Corrupted settings recover from backup");
                var current = new Track { Title = "Current", Path = "current", Genre = "Ambient" };
                var related = new Track { Title = "Related", Path = "related", Genre = "Ambient", Favorite = true };
                var other = new Track { Title = "Other", Path = "other" };
                check(Library.Recommend(new[] { current, other, related }, current, 3).SequenceEqual(new[] { related, other }), "Recommendations exclude current and prioritize matching tags/favorites");
                related.LastPlayedUtc = DateTime.UtcNow.Ticks;
                check(Library.Recommend(new[] { current, other, related }, current, 1)[0] == other, "Recent tracks are penalized");
                check(NowPlaying.IsTelegram("Telegram.exe") && NowPlaying.IsTelegram("Telegram.TelegramDesktop.some-id") && NowPlaying.IsTelegram("TelegramMessengerLLP.TelegramDesktop_abc!App"), "Telegram desktop, portable and Store identifiers are recognized");
                check(!NowPlaying.IsTelegram("brave.exe") && !NowPlaying.IsTelegram("fake-Telegram.exe") && !NowPlaying.IsTelegram(null), "Telegram filter excludes browsers and unrelated sessions");
                check(AppVolume.MatchesIdentity("brave.exe", "brave") && AppVolume.MatchesIdentity(@"C:\Apps\Telegram.exe", "Telegram") && AppVolume.MatchesIdentity("TelegramMessengerLLP.TelegramDesktop_abc!App", "Telegram"), "Mixer matches browser and Telegram desktop/Store processes");
                check(!AppVolume.MatchesIdentity("brave.exe", "chrome") && !AppVolume.MatchesIdentity("fake-Telegram.exe", "Telegram") && !AppVolume.MatchesIdentity("Package!Player", "Player") && !AppVolume.MatchesIdentity(null, "brave"), "Mixer never falls through to a different application");
                check(AppVolume.MatchesIdentity("Package!Player", "host", "Package!Player") && !AppVolume.MatchesIdentity("Package!Player", "host", "Other!Player"), "Store audio processes require an exact application identity");
                var sessions = new[] { "paused-browser", "playing-telegram" };
                check(NowPlaying.Choose(sessions, sessions[0], s => s == sessions[1]) == sessions[1], "Playing Telegram wins over current paused browser");
                check(NowPlaying.Choose(sessions, sessions[0], s => true) == sessions[0], "OS current session wins when multiple sources play");
                check(NowPlaying.Choose(new string[0], "unrelated", s => true) == null && NowPlaying.Choose(new[] { "paused-telegram" }, "unrelated", s => false) == "paused-telegram", "Empty and filtered session lists never fall through to unrelated apps");
                var timestamp = DateTimeOffset.UtcNow;
                check(!NowPlaying.TimelineAvailable(0, 0, DateTimeOffset.FromFileTime(0)), "Telegram zero timeline is unavailable, not the start of a track");
                check(NowPlaying.TimelineAvailable(180, 0, timestamp), "Real track at 0:00 retains its timeline");
                check(!NowPlaying.TimelineAvailable(180, 0, DateTimeOffset.FromFileTime(0)) && !NowPlaying.TimelineAvailable(double.NaN, 10, timestamp) && !NowPlaying.TimelineAvailable(180, double.PositiveInfinity, timestamp), "Unset timestamps and invalid timeline values are rejected");
                check(NowPlaying.EstimatePosition(20, 100, true, 1, timestamp.AddSeconds(-5), timestamp) == 25 && NowPlaying.EstimatePosition(20, 100, false, 1, timestamp.AddSeconds(-5), timestamp) == 20, "External timeline advances only while playing");
                check(NowPlaying.EstimatePosition(98, 100, true, 2, timestamp.AddSeconds(-5), timestamp) == 100 && NowPlaying.EstimatePosition(5, 0, true, 1, timestamp, timestamp) == 0, "External progress clamps at the end and handles missing duration");
                using (var media = new NowPlaying(Application.Current.Dispatcher))
                {
                    check(!await media.Command("toggle") && !await media.Command("seek", 12), "Disconnected media commands safely do nothing");
                }
                using (var engine = new AudioEngine { Volume = 0 })
                {
                    engine.Open(imported[0], true);
                    await WaitUntil(() => engine.Ready || engine.Error != null, 8000);
                    check(engine.Ready && engine.Error == null && Math.Abs(engine.Duration - 3) < .1, "Windows audio decoder opens real PCM WAV");
                    await Task.Delay(550);
                    check(engine.Playing && engine.Position > .2, "Actual playback clock advances");
                    engine.Toggle(); double paused = engine.Position;
                    await Task.Delay(250);
                    check(!engine.Playing && Math.Abs(engine.Position - paused) < .08, "Actual pause holds position");
                    await TestMixer(check);
                    engine.Seek(1.6); await Task.Delay(100);
                    check(Math.Abs(engine.Position - 1.6) < .15, "Actual seek changes playback position");
                    var ended = new TaskCompletionSource<bool>(); engine.Ended += () => ended.TrySetResult(true);
                    var window = new MainWindow(store, engine);
                    var slider = (System.Windows.Controls.Slider)window.FindName("VolumeSlider");
                    slider.Value = .42;
                    check(Math.Abs(engine.Volume - .42) < .001 && ((System.Windows.Controls.TextBlock)window.FindName("VolumePercent")).Text == "42%", "Local volume slider updates the actual player and percentage");
                    var mute = (System.Windows.Controls.Button)window.FindName("MuteButton");
                    mute.RaiseEvent(new RoutedEventArgs(System.Windows.Controls.Button.ClickEvent));
                    check(engine.Volume == 0, "Local speaker button mutes playback");
                    mute.RaiseEvent(new RoutedEventArgs(System.Windows.Controls.Button.ClickEvent));
                    check(Math.Abs(engine.Volume - .42) < .001, "Local speaker button restores the previous volume");
                    engine.Toggle();
                    check(!window.IsVisible && !window.ProgressTimerRunning && engine.Playing, "Hidden window has no progress timer while audio continues");
                    check(await Task.WhenAny(ended.Task, Task.Delay(5000)) == ended.Task, "MediaEnded is raised without UI polling");
                    window.Close();
                }
                using (var missing = new AudioEngine())
                {
                    missing.Open(new Track { Path = Path.Combine(root, "missing.wav") });
                    check(!missing.Playing && missing.Error != null, "Missing audio reports an error without crashing");
                }
                output.AppendLine("RESULT: PASSED");
                File.WriteAllText(report, output.ToString(), Encoding.UTF8); return 0;
            }
            catch (Exception ex)
            {
                output.AppendLine("FAIL " + ex); output.AppendLine("RESULT: FAILED");
                File.WriteAllText(report, output.ToString(), Encoding.UTF8); return 1;
            }
        }
        static async Task WaitUntil(Func<bool> predicate, int timeout)
        {
            var watch = Stopwatch.StartNew();
            while (!predicate() && watch.ElapsedMilliseconds < timeout) await Task.Delay(50);
        }
        static async Task TestMixer(Action<bool, string> check)
        {
            string ownApp = Process.GetCurrentProcess().ProcessName + ".exe";
            using (var mixer = new AppVolume(Application.Current.Dispatcher))
            using (var observer = new AppVolume(Application.Current.Dispatcher))
            {
                mixer.SetTarget(ownApp); observer.SetTarget(ownApp);
                await WaitUntil(() => mixer.State.Available && observer.State.Available, 5000);
                check(mixer.State.Available && observer.State.Available, "Core Audio locates this test process's real audio session");
                double original = observer.State.Level; bool wasMuted = observer.State.Muted;
                try
                {
                    mixer.SetVolume(.37);
                    await WaitUntil(() => Math.Abs(observer.State.Level - .37) < .001 && !observer.State.Muted, 3000);
                    check(Math.Abs(observer.State.Level - .37) < .001 && !observer.State.Muted, "Application volume reaches Windows mixer and another event subscriber");
                    mixer.SetMute(true);
                    await WaitUntil(() => observer.State.Muted, 3000);
                    check(observer.State.Muted && Math.Abs(observer.State.Level - .37) < .001, "Application mute preserves its previous volume");
                    mixer.SetVolume(.64);
                    await WaitUntil(() => !observer.State.Muted && Math.Abs(observer.State.Level - .64) < .001, 3000);
                    check(!observer.State.Muted && Math.Abs(observer.State.Level - .64) < .001, "Moving the volume slider unmutes the actual audio session");
                    for (int i = 1; i <= 80; i++) mixer.SetVolume(i / 100.0);
                    mixer.SetMute(true);
                    await WaitUntil(() => observer.State.Muted && Math.Abs(observer.State.Level - .8) < .001, 3000);
                    check(observer.State.Muted && Math.Abs(observer.State.Level - .8) < .001, "Rapid volume changes followed by mute preserve the last requested level");
                    mixer.SetTarget("ostrov-nonexistent-self-test.exe");
                    mixer.SetVolume(.99);
                    await Task.Delay(150);
                    check(!mixer.State.Available && Math.Abs(observer.State.Level - .8) < .001, "Switching to an unavailable source cannot change the previous app volume");
                    mixer.SetTarget(null); observer.SetVolume(.21);
                    await WaitUntil(() => Math.Abs(observer.State.Level - .21) < .001, 3000);
                    check(mixer.State.Target == null && !mixer.State.Available && Math.Abs(observer.State.Level - .21) < .001, "Hidden mixer detaches while the audio session remains independently controllable");
                }
                finally
                {
                    observer.SetVolume(original);
                    await WaitUntil(() => Math.Abs(observer.State.Level - original) < .001, 2000);
                    observer.SetMute(wasMuted);
                    await WaitUntil(() => observer.State.Muted == wasMuted, 2000);
                }
            }
        }
        static void WriteSilence(string path, int seconds)
        {
            int bytes = 44100 * 2 * seconds;
            using (var writer = new BinaryWriter(File.Create(path)))
            {
                writer.Write(Encoding.ASCII.GetBytes("RIFF")); writer.Write(36 + bytes); writer.Write(Encoding.ASCII.GetBytes("WAVEfmt "));
                writer.Write(16); writer.Write((short)1); writer.Write((short)1); writer.Write(44100); writer.Write(88200); writer.Write((short)2); writer.Write((short)16);
                writer.Write(Encoding.ASCII.GetBytes("data")); writer.Write(bytes); writer.Write(new byte[bytes]);
            }
        }
    }
}
