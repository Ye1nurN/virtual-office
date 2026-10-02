using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Ostrov
{
    [DataContract]
    public sealed class Track
    {
        [DataMember] public string Path { get; set; }
        [DataMember] public string Title { get; set; }
        [DataMember] public string Artist { get; set; }
        [DataMember] public string Album { get; set; }
        [DataMember] public string Genre { get; set; }
        [DataMember] public bool Favorite { get; set; }
        [DataMember] public int Plays { get; set; }
        [DataMember] public long LastPlayedUtc { get; set; }
        public string Subtitle { get { return string.IsNullOrWhiteSpace(Artist) ? "Локальная музыка" : Artist; } }
    }

    [DataContract]
    public sealed class Preferences
    {
        [DataMember] public List<Track> Tracks { get; set; } = new List<Track>();
        [DataMember] public double Volume { get; set; } = 0.5;
        [DataMember] public string LastPath { get; set; }
        [DataMember] public double LastPosition { get; set; }
        [DataMember] public bool EdgeEnabled { get; set; } = true;
        [DataMember] public bool SmartNext { get; set; }
        [DataMember] public string Source { get; set; } = "now";
    }

    public sealed class Store
    {
        readonly string directory;
        public Preferences State { get; private set; }
        public string Warning { get; private set; }
        public Store(string folder)
        {
            directory = folder;
            State = Read(System.IO.Path.Combine(folder, "library.json")) ?? Read(System.IO.Path.Combine(folder, "library.bak")) ?? new Preferences();
            State.Tracks = (State.Tracks ?? new List<Track>()).Where(t => t != null && !string.IsNullOrWhiteSpace(t.Path))
                .GroupBy(t => t.Path, StringComparer.OrdinalIgnoreCase).Select(g => g.First()).ToList();
            State.Volume = double.IsNaN(State.Volume) ? .5 : Math.Max(0, Math.Min(1, State.Volume));
            State.LastPosition = double.IsNaN(State.LastPosition) || double.IsInfinity(State.LastPosition) ? 0 : Math.Max(0, State.LastPosition);
            if (State.Source != "local" && State.Source != "telegram") State.Source = "now";
        }
        Preferences Read(string path)
        {
            if (!File.Exists(path)) return null;
            try { using (var stream = File.OpenRead(path)) return (Preferences)new DataContractJsonSerializer(typeof(Preferences)).ReadObject(stream); }
            catch (Exception ex) when (ex is IOException || ex is SerializationException || ex is UnauthorizedAccessException)
            { Warning = "Не удалось прочитать настройки. Использована резервная копия или новая библиотека."; return null; }
        }
        public bool Save()
        {
            try
            {
                Directory.CreateDirectory(directory);
                string target = System.IO.Path.Combine(directory, "library.json"), temp = target + ".tmp";
                using (var stream = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.None))
                { new DataContractJsonSerializer(typeof(Preferences)).WriteObject(stream, State); stream.Flush(true); }
                if (File.Exists(target)) File.Replace(temp, target, System.IO.Path.Combine(directory, "library.bak"));
                else File.Move(temp, target);
                Warning = null; return true;
            }
            catch (Exception ex) when (ex is IOException || ex is UnauthorizedAccessException || ex is SerializationException)
            { Warning = "Не удалось сохранить библиотеку. Проверь доступ к папке настроек."; return false; }
        }
    }

    public static class Library
    {
        static readonly HashSet<string> Extensions = new HashSet<string>(new[] { ".mp3", ".wav", ".m4a", ".wma", ".aac", ".flac" }, StringComparer.OrdinalIgnoreCase);
        public static bool Supported(string path) { return Extensions.Contains(System.IO.Path.GetExtension(path)); }
        public static IEnumerable<string> Enumerate(string directory)
        {
            var pending = new Stack<string>(); pending.Push(directory);
            while (pending.Count > 0)
            {
                var current = pending.Pop(); string[] files, folders;
                try { files = Directory.GetFiles(current); folders = Directory.GetDirectories(current); }
                catch (Exception ex) when (ex is IOException || ex is UnauthorizedAccessException) { continue; }
                foreach (var file in files) if (Supported(file)) yield return file;
                foreach (var folder in folders)
                {
                    try { if ((File.GetAttributes(folder) & FileAttributes.ReparsePoint) == 0) pending.Push(folder); }
                    catch (Exception ex) when (ex is IOException || ex is UnauthorizedAccessException) { }
                }
            }
        }
        // One short-lived STA worker for Shell metadata, never a polling service.
        public static Task<List<Track>> ImportAsync(IEnumerable<string> paths, ICollection<string> existing)
        {
            var completion = new TaskCompletionSource<List<Track>>();
            var worker = new Thread(() =>
            {
                object shellObject = null;
                try
                {
                    var result = new List<Track>(); var seen = new HashSet<string>(existing, StringComparer.OrdinalIgnoreCase);
                    try { shellObject = Activator.CreateInstance(Type.GetTypeFromProgID("Shell.Application")); } catch { }
                    foreach (var file in paths)
                    {
                        if (!Supported(file) || !File.Exists(file)) continue;
                        var absolute = System.IO.Path.GetFullPath(file); if (!seen.Add(absolute)) continue;
                        var track = new Track { Path = absolute, Title = System.IO.Path.GetFileNameWithoutExtension(file), Artist = "Локальная музыка" };
                        object folderObject = null, itemObject = null;
                        try
                        {
                            if (shellObject != null)
                            {
                                dynamic shell = shellObject;
                                folderObject = shell.NameSpace(System.IO.Path.GetDirectoryName(absolute));
                                dynamic folder = folderObject; itemObject = folder.ParseName(System.IO.Path.GetFileName(absolute));
                                dynamic item = itemObject;
                                track.Title = Text(item.ExtendedProperty("System.Title")) ?? track.Title;
                                track.Artist = Text(item.ExtendedProperty("System.Music.Artist")) ?? track.Artist;
                                track.Album = Text(item.ExtendedProperty("System.Music.AlbumTitle"));
                                track.Genre = Text(item.ExtendedProperty("System.Music.Genre"));
                            }
                        }
                        catch { /* A missing/corrupt tag must not prevent importing the file. */ }
                        finally { Release(itemObject); Release(folderObject); }
                        result.Add(track);
                    }
                    completion.SetResult(result);
                }
                catch (Exception ex) { completion.SetException(ex); }
                finally { Release(shellObject); }
            });
            worker.IsBackground = true; worker.SetApartmentState(ApartmentState.STA); worker.Start(); return completion.Task;
        }
        static string Text(object value)
        {
            var list = value as string[]; var text = list == null ? value as string : string.Join(", ", list);
            return string.IsNullOrWhiteSpace(text) ? null : text;
        }
        static void Release(object value) { if (value != null && Marshal.IsComObject(value)) Marshal.ReleaseComObject(value); }

        public static List<Track> Recommend(IEnumerable<Track> tracks, Track current, int count)
        {
            return tracks.Where(t => t != current).OrderByDescending(t => Score(t, current)).ThenBy(t => t.LastPlayedUtc)
                .ThenBy(t => t.Title, StringComparer.CurrentCultureIgnoreCase).Take(count).ToList();
        }
        static double Score(Track track, Track current)
        {
            double score = track.Favorite ? 5 : 0;
            if (current != null)
            {
                if (!string.IsNullOrEmpty(track.Genre) && string.Equals(track.Genre, current.Genre, StringComparison.OrdinalIgnoreCase)) score += 4;
                if (!string.IsNullOrEmpty(track.Artist) && track.Artist != "Локальная музыка" && string.Equals(track.Artist, current.Artist, StringComparison.OrdinalIgnoreCase)) score += 3;
            }
            if (track.LastPlayedUtc > 0 && DateTime.UtcNow.Ticks - track.LastPlayedUtc < TimeSpan.FromHours(2).Ticks) score -= 12;
            return score + 2.0 / (1 + Math.Max(0, track.Plays));
        }
    }
}
