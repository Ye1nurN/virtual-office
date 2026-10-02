using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using Windows.Media.Control;
using Windows.Storage.Streams;

namespace Ostrov
{
    // One event-driven connection to Windows. Never reads Telegram chats, files or credentials.
    public sealed class NowPlaying : IDisposable
    {
        readonly Dispatcher dispatcher;
        GlobalSystemMediaTransportControlsSessionManager manager;
        GlobalSystemMediaTransportControlsSession session;
        readonly List<GlobalSystemMediaTransportControlsSession> watched = new List<GlobalSystemMediaTransportControlsSession>();
        IRandomAccessStreamReference thumbnail;
        bool disposed, queued, metadataPending, reading;
        int generation;
        double position, rate = 1;
        DateTimeOffset updatedAt;
        public string Filter { get; private set; } = "now";
        public bool Connected { get { return session != null; } }
        public bool Playing { get; private set; }
        public bool CanToggle { get; private set; }
        public bool CanNext { get; private set; }
        public bool CanPrevious { get; private set; }
        public bool CanSeek { get; private set; }
        public string AppId { get; private set; }
        public string Title { get; private set; }
        public string Artist { get; private set; }
        public string Error { get; private set; }
        public double Duration { get; private set; }
        public bool HasTimeline { get; private set; }
        public double SeekStart { get; private set; }
        public double SeekEnd { get; private set; }
        public int ArtworkVersion { get; private set; }
        public string ApplicationName { get { return AppName(AppId); } }
        public double Position { get { return EstimatePosition(position, Duration, Playing, rate, updatedAt, DateTimeOffset.UtcNow); } }
        public event Action Changed;
        public NowPlaying(Dispatcher dispatcher) { this.dispatcher = dispatcher; }
        public async Task Start()
        {
            if (disposed || manager != null) return;
            try
            {
                var result = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
                if (disposed) return;
                manager = result;
                manager.SessionsChanged += SessionsChanged;
                manager.CurrentSessionChanged += CurrentChanged;
                RefreshSessions();
            }
            catch (Exception) { Error = "Windows не предоставила медиасессии. Нужна Windows 10 версии 1809 или новее."; Changed?.Invoke(); }
        }
        public void SetFilter(string filter)
        {
            Filter = filter == "telegram" ? "telegram" : "now";
            RefreshSessions();
        }
        void Post(Action action)
        {
            if (!disposed && !dispatcher.HasShutdownStarted)
                dispatcher.BeginInvoke(new Action(() => { if (!disposed) action(); }));
        }
        void SessionsChanged(GlobalSystemMediaTransportControlsSessionManager sender, SessionsChangedEventArgs args) { Post(RefreshSessions); }
        void CurrentChanged(GlobalSystemMediaTransportControlsSessionManager sender, CurrentSessionChangedEventArgs args) { Post(() => QueueRefresh(false)); }
        void PlaybackChanged(GlobalSystemMediaTransportControlsSession sender, PlaybackInfoChangedEventArgs args) { Post(() => QueueRefresh(false)); }
        void MediaChanged(GlobalSystemMediaTransportControlsSession sender, MediaPropertiesChangedEventArgs args) { Post(() => { if (sender == session) QueueRefresh(true); }); }
        void TimelineChanged(GlobalSystemMediaTransportControlsSession sender, TimelinePropertiesChangedEventArgs args) { Post(() => { if (sender == session) QueueRefresh(false); }); }
        void RefreshSessions()
        {
            if (manager == null || disposed) return;
            foreach (var old in watched) { try { old.PlaybackInfoChanged -= PlaybackChanged; } catch { } }
            watched.Clear();
            try
            {
                foreach (var item in manager.GetSessions())
                {
                    if (Filter == "telegram" && !IsTelegram(item.SourceAppUserModelId)) continue;
                    watched.Add(item); item.PlaybackInfoChanged += PlaybackChanged;
                }
                QueueRefresh(true);
            }
            catch { ClearSession(); Changed?.Invoke(); }
        }
        public void Refresh() { RefreshSessions(); } // Once on opening, also recovers from missed OS events.
        void QueueRefresh(bool metadata)
        {
            metadataPending |= metadata;
            if (queued || disposed) return;
            queued = true;
            dispatcher.BeginInvoke(new Action(() => { queued = false; if (!disposed) RefreshState(); }), DispatcherPriority.Background);
        }
        static bool IsPlaying(GlobalSystemMediaTransportControlsSession item)
        {
            try { return item.GetPlaybackInfo().PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing; }
            catch { return false; }
        }
        void RefreshState()
        {
            try
            {
                var current = manager?.GetCurrentSession();
                var candidates = watched.Where(s => Filter != "telegram" || IsTelegram(s.SourceAppUserModelId)).ToList();
                var selected = Choose(candidates, current, IsPlaying);
                if (selected != session)
                {
                    ClearSession(); session = selected;
                    if (session != null)
                    {
                        AppId = session.SourceAppUserModelId;
                        session.MediaPropertiesChanged += MediaChanged;
                        session.TimelinePropertiesChanged += TimelineChanged;
                        metadataPending = true;
                    }
                }
                if (session != null)
                {
                    var playback = session.GetPlaybackInfo();
                    Playing = playback.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing;
                    var controls = playback.Controls;
                    CanToggle = Playing ? controls.IsPauseEnabled : controls.IsPlayEnabled;
                    CanNext = controls.IsNextEnabled; CanPrevious = controls.IsPreviousEnabled;
                    var timeline = session.GetTimelineProperties();
                    Duration = Math.Max(0, timeline.EndTime.TotalSeconds);
                    HasTimeline = TimelineAvailable(Duration, timeline.Position.TotalSeconds, timeline.LastUpdatedTime);
                    SeekStart = Math.Max(0, timeline.MinSeekTime.TotalSeconds);
                    SeekEnd = Math.Min(Duration, timeline.MaxSeekTime.TotalSeconds);
                    CanSeek = HasTimeline && controls.IsPlaybackPositionEnabled && SeekEnd > SeekStart;
                    position = timeline.Position.TotalSeconds; updatedAt = timeline.LastUpdatedTime;
                    rate = playback.PlaybackRate ?? 1;
                }
                Changed?.Invoke();
                if (metadataPending && !reading && session != null) ReadMetadata();
            }
            catch { ClearSession(); Changed?.Invoke(); }
        }
        async void ReadMetadata()
        {
            reading = true; metadataPending = false;
            var source = session; int version = generation;
            try
            {
                var properties = await source.TryGetMediaPropertiesAsync();
                if (!disposed && source == session && version == generation && !metadataPending)
                {
                    Title = properties.Title; Artist = properties.Artist;
                    thumbnail = properties.Thumbnail; ArtworkVersion++;
                    Error = null; Changed?.Invoke();
                }
            }
            catch { if (version == generation && !disposed) { Title = "Название недоступно"; Artist = null; thumbnail = null; ArtworkVersion++; Changed?.Invoke(); } }
            finally { reading = false; if (!disposed && metadataPending) QueueRefresh(false); }
        }
        public async Task<BitmapSource> ReadArtwork()
        {
            var reference = thumbnail;
            if (reference == null) return null;
            try
            {
                using (var stream = await reference.OpenReadAsync())
                {
                    if (stream.Size == 0 || stream.Size > 8 * 1024 * 1024) return null;
                    using (var input = stream.AsStreamForRead())
                    {
                        var bitmap = new BitmapImage(); bitmap.BeginInit(); bitmap.CacheOption = BitmapCacheOption.OnLoad;
                        bitmap.DecodePixelWidth = 160; bitmap.StreamSource = input; bitmap.EndInit(); bitmap.Freeze(); return bitmap;
                    }
                }
            }
            catch { return null; }
        }
        public async Task<bool> Command(string command, double seconds = 0)
        {
            var target = session;
            if (target == null || disposed) return false;
            try
            {
                bool result;
                if (command == "toggle" && CanToggle) result = Playing ? await target.TryPauseAsync() : await target.TryPlayAsync();
                else if (command == "next" && CanNext) result = await target.TrySkipNextAsync();
                else if (command == "previous" && CanPrevious) result = await target.TrySkipPreviousAsync();
                else if (command == "seek" && CanSeek && !double.IsNaN(seconds) && !double.IsInfinity(seconds))
                    result = await target.TryChangePlaybackPositionAsync(TimeSpan.FromSeconds(Math.Max(SeekStart, Math.Min(SeekEnd, seconds))).Ticks);
                else return false;
                if (target == session) QueueRefresh(false);
                return result;
            }
            catch { if (!disposed) RefreshSessions(); return false; }
        }
        void ClearSession()
        {
            if (session != null)
            {
                try { session.MediaPropertiesChanged -= MediaChanged; session.TimelinePropertiesChanged -= TimelineChanged; } catch { }
            }
            session = null; generation++; Title = Artist = AppId = null; thumbnail = null; ArtworkVersion++;
            Playing = CanToggle = CanNext = CanPrevious = CanSeek = HasTimeline = false;
            Duration = position = SeekStart = SeekEnd = 0;
        }
        public void Dispose()
        {
            disposed = true;
            if (manager != null) { manager.SessionsChanged -= SessionsChanged; manager.CurrentSessionChanged -= CurrentChanged; }
            foreach (var item in watched) { try { item.PlaybackInfoChanged -= PlaybackChanged; } catch { } }
            watched.Clear(); ClearSession(); manager = null;
        }
        internal static T Choose<T>(IList<T> sessions, T current, Func<T, bool> playing) where T : class
        {
            if (current != null && sessions.Contains(current) && playing(current)) return current;
            return sessions.FirstOrDefault(playing) ?? (sessions.Contains(current) ? current : sessions.FirstOrDefault());
        }
        internal static bool IsTelegram(string id)
        {
            return !string.IsNullOrEmpty(id) && (id.StartsWith("Telegram.TelegramDesktop", StringComparison.OrdinalIgnoreCase)
                || id.StartsWith("TelegramMessengerLLP.TelegramDesktop_", StringComparison.OrdinalIgnoreCase)
                || string.Equals(Path.GetFileName(id), "Telegram.exe", StringComparison.OrdinalIgnoreCase));
        }
        internal static string AppName(string id)
        {
            if (IsTelegram(id)) return "Telegram";
            if (string.IsNullOrWhiteSpace(id)) return "Приложение";
            foreach (var name in new[] { "Spotify", "Brave", "Chrome", "Firefox", "VLC", "Yandex" })
                if (id.IndexOf(name, StringComparison.OrdinalIgnoreCase) >= 0) return name;
            if (id.IndexOf("msedge", StringComparison.OrdinalIgnoreCase) >= 0 || id.IndexOf("MicrosoftEdge", StringComparison.OrdinalIgnoreCase) >= 0) return "Edge";
            try { return Path.GetFileNameWithoutExtension(id); } catch { return "Медиаплеер"; }
        }
        internal static double EstimatePosition(double position, double duration, bool playing, double rate, DateTimeOffset updated, DateTimeOffset now)
        {
            if (duration <= 0 || double.IsNaN(position) || double.IsInfinity(position)) return 0;
            double delta = playing && updated > DateTimeOffset.MinValue && rate > 0 && !double.IsInfinity(rate) ? Math.Max(0, (now - updated).TotalSeconds) * rate : 0;
            return Math.Max(0, Math.Min(duration, position + delta));
        }
        internal static bool TimelineAvailable(double duration, double position, DateTimeOffset updated)
        {
            // A never-published WinRT timeline contains zeroes and the FILETIME epoch (1601).
            // Telegram Desktop currently publishes metadata/playback but no Windows timeline.
            return duration > 0 && !double.IsInfinity(duration) && !double.IsNaN(duration)
                && position >= 0 && !double.IsInfinity(position) && !double.IsNaN(position)
                && updated > DateTimeOffset.FromFileTime(0);
        }
        public static async Task<string> Probe()
        {
            var manager = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
            var lines = new List<string>();
            foreach (var item in manager.GetSessions())
            {
                var media = await item.TryGetMediaPropertiesAsync();
                var playback = item.GetPlaybackInfo();
                var timeline = item.GetTimelineProperties();
                lines.Add(item.SourceAppUserModelId + " | " + playback.PlaybackStatus + " | " + media.Title + " | " + media.Artist);
                lines.Add(string.Format(System.Globalization.CultureInfo.InvariantCulture,
                    "  position={0:R}s start={1:R}s end={2:R}s seekMin={3:R}s seekMax={4:R}s updated={5:O} now={6:O} rate={7} seekEnabled={8}",
                    timeline.Position.TotalSeconds, timeline.StartTime.TotalSeconds, timeline.EndTime.TotalSeconds,
                    timeline.MinSeekTime.TotalSeconds, timeline.MaxSeekTime.TotalSeconds, timeline.LastUpdatedTime, DateTimeOffset.UtcNow,
                    playback.PlaybackRate, playback.Controls.IsPlaybackPositionEnabled));
            }
            return lines.Count == 0 ? "No active media sessions." : string.Join(Environment.NewLine, lines);
        }
    }
}
