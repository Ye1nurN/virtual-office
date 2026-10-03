using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Threading;

namespace Ostrov
{
    public sealed class VolumeState
    {
        public string Target { get; }
        public bool Available { get; }
        public double Level { get; }
        public bool Muted { get; }
        public VolumeState(string target, bool available = false, double level = 0, bool muted = false)
        { Target = target; Available = available; Level = level; Muted = muted; }
    }

    public sealed class AppVolume : IDisposable
    {
        readonly Dispatcher dispatcher;
        readonly BlockingCollection<Action> work = new BlockingCollection<Action>();
        readonly Thread worker;
        readonly List<Manager> managers = new List<Manager>();
        readonly List<Session> sessions = new List<Session>();
        readonly object commandLock = new object();
        IMMDeviceEnumerator devices;
        Notifications notifications;
        int generation, refreshQueued, readQueued;
        volatile bool disposed;
        string target;
        float? pendingLevel;
        bool? pendingMute;
        int pendingVersion;
        bool writeQueued;
        static Guid eventContext = new Guid("07C9B8B4-D273-4937-AD33-995B90E1E960");
        public VolumeState State { get; private set; } = new VolumeState(null);
        public event Action Changed;

        public AppVolume(Dispatcher dispatcher)
        {
            this.dispatcher = dispatcher;
            worker = new Thread(Run) { IsBackground = true, Name = "Ostrov audio mixer" };
            worker.SetApartmentState(ApartmentState.MTA); worker.Start();
        }
        // UI-thread entry points. A new target immediately invalidates old commands and callbacks.
        public void SetTarget(string appId)
        {
            if (disposed || string.Equals(target, appId, StringComparison.OrdinalIgnoreCase)) return;
            target = appId; int version = Interlocked.Increment(ref generation);
            State = new VolumeState(appId); Changed?.Invoke();
            Post(() => { Detach(); if (Current(version) && appId != null) Attach(appId, version); });
        }
        public void SetVolume(double level)
        {
            if (!State.Available || double.IsNaN(level) || double.IsInfinity(level)) return;
            float value = (float)Math.Max(0, Math.Min(1, level));
            QueueWrite(value, false);
        }
        public void SetMute(bool muted)
        {
            if (State.Available) QueueWrite(null, muted);
        }
        void QueueWrite(float? level, bool muted)
        {
            lock (commandLock)
            {
                // Coalesce slider positions, but retain the level when a mute click follows a drag.
                if (pendingVersion != generation) pendingLevel = null;
                pendingVersion = generation;
                if (level.HasValue) pendingLevel = level;
                pendingMute = muted;
                if (writeQueued) return;
                writeQueued = true;
                Post(() =>
                {
                    float? value; bool? silent; int version;
                    lock (commandLock)
                    {
                        value = pendingLevel; silent = pendingMute; version = pendingVersion;
                        pendingLevel = null; pendingMute = null; writeQueued = false;
                    }
                    if (!Current(version)) return;
                    foreach (var session in sessions)
                    {
                        if (!Current(version)) break;
                        try
                        {
                            if (value.HasValue) Check(session.Volume.SetMasterVolume(value.Value, ref eventContext));
                            if (silent.HasValue) Check(session.Volume.SetMute(silent.Value, ref eventContext));
                        }
                        catch (COMException) { } catch (InvalidComObjectException) { }
                    }
                    ReadState(target, version);
                });
            }
        }
        void Run()
        {
            // Explicit MTA initialization is required for IAudioSessionNotification delivery.
            int initialized = CoInitializeEx(IntPtr.Zero, 0);
            try
            {
                foreach (var action in work.GetConsumingEnumerable())
                {
                    try { action(); }
                    catch (Exception ex) when (ex is COMException || ex is InvalidComObjectException || ex is UnauthorizedAccessException)
                    { Publish(new VolumeState(target), generation); }
                }
            }
            finally { Detach(); if (initialized >= 0) CoUninitialize(); }
        }
        void Attach(string appId, int version)
        {
            devices = (IMMDeviceEnumerator)new MMDeviceEnumerator();
            notifications = new Notifications(() => QueueRefresh(appId, version), () => QueueRead(appId, version));
            Check(devices.RegisterEndpointNotificationCallback(notifications));
            Rebuild(appId, version);
        }
        void Rebuild(string appId, int version)
        {
            ClearSessions();
            IMMDeviceCollection collection = null;
            try
            {
                Check(devices.EnumAudioEndpoints(0, 1, out collection)); // All active render endpoints, including per-app routing.
                uint count; Check(collection.GetCount(out count));
                for (uint i = 0; i < count && Current(version); i++)
                {
                    IMMDevice device = null;
                    try { Check(collection.Item(i, out device)); AddDevice(device, appId); }
                    catch (COMException) { } // One disappearing endpoint must not hide the remaining devices.
                    finally { Release(device); }
                }
            }
            finally { Release(collection); }
            ReadState(appId, version);
        }
        void AddDevice(IMMDevice device, string appId)
        {
            object instance = null;
            IAudioSessionEnumerator list = null;
            try
            {
                Guid id = typeof(IAudioSessionManager2).GUID;
                Check(device.Activate(ref id, 23, IntPtr.Zero, out instance));
                var manager = (IAudioSessionManager2)instance;
                Check(manager.RegisterSessionNotification(notifications));
                managers.Add(new Manager { Control = manager, Callback = notifications }); instance = null;
                Check(manager.GetSessionEnumerator(out list));
                int count; Check(list.GetCount(out count)); // Enables session-created notifications.
                for (int i = 0; i < count; i++)
                {
                    object control = null;
                    try
                    {
                        Check(list.GetSession(i, out control));
                        var session = (IAudioSessionControl2)control;
                        uint pid; int state;
                        if (session.GetProcessId(out pid) < 0 || pid == 0 || session.IsSystemSoundsSession() == 0 ||
                            session.GetState(out state) < 0 || state == 2 || !MatchesProcess(appId, pid)) continue;
                        var volume = (ISimpleAudioVolume)control;
                        Check(session.RegisterAudioSessionNotification(notifications));
                        sessions.Add(new Session { Control = session, Volume = volume, Callback = notifications }); control = null;
                    }
                    catch (COMException) { } catch (InvalidCastException) { }
                    finally { Release(control); }
                }
            }
            finally { Release(list); Release(instance); }
        }
        void ReadState(string appId, int version)
        {
            if (!Current(version)) return;
            double level = 0; bool muted = true, available = false;
            foreach (var session in sessions)
            {
                float value; bool silent; int state;
                try
                {
                    if (session.Control.GetState(out state) < 0 || state == 2 || session.Volume.GetMasterVolume(out value) < 0 || session.Volume.GetMute(out silent) < 0) continue;
                    available = true; level = Math.Max(level, value); muted &= silent;
                }
                catch (COMException) { }
            }
            Publish(new VolumeState(appId, available, level, muted), version);
        }
        void QueueRefresh(string appId, int version)
        {
            if (!Current(version) || Interlocked.Exchange(ref refreshQueued, 1) != 0) return;
            Post(() => { Interlocked.Exchange(ref refreshQueued, 0); if (Current(version)) Rebuild(appId, version); });
        }
        void QueueRead(string appId, int version)
        {
            if (!Current(version) || Interlocked.Exchange(ref readQueued, 1) != 0) return;
            Post(() => { Interlocked.Exchange(ref readQueued, 0); ReadState(appId, version); });
        }
        void Publish(VolumeState state, int version)
        {
            if (!Current(version) || dispatcher.HasShutdownStarted) return;
            dispatcher.BeginInvoke(new Action(() => { if (Current(version)) { State = state; Changed?.Invoke(); } }));
        }
        bool Current(int version) { return !disposed && version == Volatile.Read(ref generation); }
        void Post(Action action) { try { if (!disposed) work.Add(action); } catch (InvalidOperationException) { } }
        void ClearSessions()
        {
            foreach (var session in sessions)
            {
                try { session.Control.UnregisterAudioSessionNotification(session.Callback); } catch (COMException) { }
                Release(session.Control); // Volume is another interface on the same RCW; release it only once.
            }
            sessions.Clear();
            foreach (var manager in managers)
            {
                try { manager.Control.UnregisterSessionNotification(manager.Callback); } catch (COMException) { }
                Release(manager.Control);
            }
            managers.Clear();
        }
        void Detach()
        {
            ClearSessions();
            if (devices != null)
            {
                try { if (notifications != null) devices.UnregisterEndpointNotificationCallback(notifications); } catch (COMException) { }
                Release(devices); devices = null;
            }
            notifications = null;
        }
        public void Dispose()
        {
            if (disposed) return;
            disposed = true; Interlocked.Increment(ref generation); work.CompleteAdding();
            worker.Join(2000);
        }
        static void Check(int result) { if (result < 0) Marshal.ThrowExceptionForHR(result); }
        static void Release(object value) { if (value != null && Marshal.IsComObject(value)) Marshal.ReleaseComObject(value); }

        internal static bool MatchesIdentity(string appId, string processName, string processAppId = null)
        {
            if (string.IsNullOrWhiteSpace(appId) || string.IsNullOrWhiteSpace(processName)) return false;
            if (!string.IsNullOrEmpty(processAppId) && string.Equals(appId, processAppId, StringComparison.OrdinalIgnoreCase)) return true;
            if (NowPlaying.IsTelegram(appId)) return string.Equals(processName, "Telegram", StringComparison.OrdinalIgnoreCase);
            // Match an executable exactly, never a partial name or an unrelated Store application.
            if (appId.IndexOf('!') >= 0) return false;
            return string.Equals(Path.GetFileNameWithoutExtension(appId), processName, StringComparison.OrdinalIgnoreCase);
        }
        static bool MatchesProcess(string appId, uint pid)
        {
            try
            {
                using (var process = Process.GetProcessById((int)pid))
                {
                    if (MatchesIdentity(appId, process.ProcessName)) return true;
                    if (appId.IndexOf('!') < 0) return false;
                    IntPtr handle = OpenProcess(0x1000, false, pid);
                    if (handle == IntPtr.Zero) return false;
                    try
                    {
                        uint length = 0;
                        if (GetApplicationUserModelId(handle, ref length, null) != 122 || length > 1024) return false;
                        var value = new StringBuilder((int)length);
                        return GetApplicationUserModelId(handle, ref length, value) == 0 && MatchesIdentity(appId, process.ProcessName, value.ToString());
                    }
                    finally { CloseHandle(handle); }
                }
            }
            catch (ArgumentException) { return false; } catch (InvalidOperationException) { return false; } catch (System.ComponentModel.Win32Exception) { return false; }
        }
        sealed class Manager { public IAudioSessionManager2 Control; public Notifications Callback; }
        sealed class Session { public IAudioSessionControl2 Control; public ISimpleAudioVolume Volume; public Notifications Callback; }

        [DllImport("ole32.dll")] static extern int CoInitializeEx(IntPtr reserved, uint flags);
        [DllImport("ole32.dll")] static extern void CoUninitialize();
        [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(uint access, bool inherit, uint processId);
        [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern int GetApplicationUserModelId(IntPtr process, ref uint length, StringBuilder id);
    }

    // Callbacks only enqueue work: COM forbids unregistering/releasing sessions inside a notification.
    [ComVisible(true), ClassInterface(ClassInterfaceType.None)]
    public sealed class Notifications : IMMNotificationClient, IAudioSessionNotification, IAudioSessionEvents
    {
        readonly Action refresh, read;
        public Notifications(Action refresh, Action read) { this.refresh = refresh; this.read = read; }
        public int OnSessionCreated(IntPtr control) { refresh(); return 0; }
        public int OnSimpleVolumeChanged(float level, bool muted, IntPtr context) { read(); return 0; }
        public int OnStateChanged(int state) { read(); return 0; }
        public int OnSessionDisconnected(int reason) { refresh(); return 0; }
        public int OnDeviceStateChanged(string id, uint state) { refresh(); return 0; }
        public int OnDeviceAdded(string id) { refresh(); return 0; }
        public int OnDeviceRemoved(string id) { refresh(); return 0; }
        public int OnDefaultDeviceChanged(int flow, int role, string id) { if (flow == 0) refresh(); return 0; }
        public int OnPropertyValueChanged(string id, AudioPropertyKey key) { return 0; }
        public int OnDisplayNameChanged(string name, IntPtr context) { return 0; }
        public int OnIconPathChanged(string path, IntPtr context) { return 0; }
        public int OnChannelVolumeChanged(uint count, IntPtr levels, uint channel, IntPtr context) { return 0; }
        public int OnGroupingParamChanged(IntPtr grouping, IntPtr context) { return 0; }
    }
}
