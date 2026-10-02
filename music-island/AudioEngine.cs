using System;
using System.IO;
using System.Windows.Media;

namespace Ostrov
{
    public sealed class AudioEngine : IDisposable
    {
        MediaPlayer player;
        double volume = .5;
        public Track Current { get; private set; }
        public bool Playing { get; private set; }
        public bool Ready { get; private set; }
        public double Duration { get; private set; }
        public string Error { get; private set; }
        public event Action Changed;
        public event Action Ended;
        public double Position { get { return player == null || !Ready ? 0 : player.Position.TotalSeconds; } }
        public double Volume { get { return volume; } set { volume = Math.Max(0, Math.Min(1, value)); if (player != null) player.Volume = volume; } }
        void Notify() { Changed?.Invoke(); }
        public void Open(Track track, bool play = true, double resume = 0)
        {
            if (player != null) player.Close();
            player = null; Current = track; Ready = false; Playing = false; Duration = 0; Error = null;
            if (track == null) { Notify(); return; }
            if (!File.Exists(track.Path)) { Error = "Файл перемещён или недоступен. Добавь его заново."; Notify(); return; }
            var next = new MediaPlayer(); player = next; next.Volume = volume;
            next.MediaOpened += (sender, args) =>
            {
                if (player != next) return;
                if (!next.HasAudio) { Error = "В этом файле нет доступной аудиодорожки."; next.Close(); Ready = false; Notify(); return; }
                Duration = next.NaturalDuration.HasTimeSpan ? next.NaturalDuration.TimeSpan.TotalSeconds : 0;
                Ready = true; Seek(resume);
                if (play) { next.Play(); Playing = true; } Notify();
            };
            next.MediaFailed += (sender, args) =>
            {
                if (player != next) return;
                Ready = false; Playing = false; Error = "Не удалось открыть аудио. Попробуй MP3 или WAV; другие форматы зависят от кодеков Windows.";
                next.Close(); Notify();
            };
            next.MediaEnded += (sender, args) =>
            {
                if (player != next) return;
                Playing = false; Notify(); Ended?.Invoke();
            };
            try { next.Open(new Uri(track.Path)); }
            catch (Exception) { Error = "Не удалось открыть этот файл."; next.Close(); }
            Notify();
        }
        public void Toggle()
        {
            if (!Ready || player == null) return;
            if (Playing) player.Pause(); else player.Play(); Playing = !Playing; Notify();
        }
        public void Seek(double seconds)
        {
            if (player == null || !Ready || double.IsNaN(seconds)) return;
            player.Position = TimeSpan.FromSeconds(Math.Max(0, Math.Min(Math.Max(0, Duration - .02), seconds)));
        }
        public void Dispose() { if (player != null) player.Close(); player = null; Ready = false; Playing = false; }
    }
}
