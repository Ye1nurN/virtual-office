using System;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Forms = System.Windows.Forms;

namespace Ostrov
{
    public sealed class NativeHost : IDisposable
    {
        readonly HwndSource messages;
        readonly HwndSource edge;
        readonly Action toggle;
        readonly Action reveal;
        readonly WinEventDelegate foregroundChanged;
        IntPtr foregroundHook;
        IntPtr locationHook;
        bool enabled;
        public string Shortcut { get; private set; }
        public bool Registered { get; private set; }
        public NativeHost(Action toggle, Action reveal, bool edgeEnabled)
        {
            this.toggle = toggle; this.reveal = reveal;
            messages = new HwndSource(new HwndSourceParameters("Ostrov events") { ParentWindow = new IntPtr(-3), WindowStyle = 0, Width = 0, Height = 0 });
            messages.AddHook(MessageHook);
            Registered = RegisterHotKey(messages.Handle, 1, 0x4001, 0x4D);
            Shortcut = "Alt+M";
            if (!Registered) { Registered = RegisterHotKey(messages.Handle, 1, 0x4003, 0x4D); Shortcut = "Ctrl+Alt+M"; }
            edge = new HwndSource(new HwndSourceParameters("Ostrov activation zone") { WindowStyle = unchecked((int)0x80000000), ExtendedWindowStyle = 0x08080088, Width = 160, Height = 4 });
            edge.AddHook(EdgeHook);
            // Alpha 1/255 receives clicks in a four-pixel strip without showing a pill or handle.
            SetLayeredWindowAttributes(edge.Handle, 0, 1, 2);
            enabled = edgeEnabled;
            foregroundChanged = (hook, ev, window, objectId, childId, thread, time) =>
            {
                if (ev == 3 || (objectId == 0 && window == GetForegroundWindow()))
                    Application.Current?.Dispatcher.BeginInvoke(new Action(UpdateEdge));
            };
            foregroundHook = SetWinEventHook(3, 3, IntPtr.Zero, foregroundChanged, 0, 0, 2);
            locationHook = SetWinEventHook(0x800B, 0x800B, IntPtr.Zero, foregroundChanged, 0, 0, 2);
            Microsoft.Win32.SystemEvents.DisplaySettingsChanged += DisplayChanged;
            UpdateEdge();
        }
        void DisplayChanged(object sender, EventArgs e) { Application.Current?.Dispatcher.BeginInvoke(new Action(UpdateEdge)); }
        IntPtr MessageHook(IntPtr hwnd, int message, IntPtr w, IntPtr l, ref bool handled)
        {
            if (message == 0x312) { toggle(); handled = true; }
            return IntPtr.Zero;
        }
        IntPtr EdgeHook(IntPtr hwnd, int message, IntPtr w, IntPtr l, ref bool handled)
        {
            if (message == 0x21) { handled = true; return new IntPtr(3); }
            if (message == 0x202) { reveal(); handled = true; }
            return IntPtr.Zero;
        }
        public void SetEdge(bool value) { enabled = value; UpdateEdge(); }
        void UpdateEdge()
        {
            if (edge.IsDisposed) return;
            var screen = Forms.Screen.PrimaryScreen;
            RECT active; var window = GetForegroundWindow();
            bool fullscreen = window != IntPtr.Zero && GetWindowRect(window, out active)
                && active.Left <= screen.Bounds.Left && active.Top <= screen.Bounds.Top
                && active.Right >= screen.Bounds.Right && active.Bottom >= screen.Bounds.Bottom
                && !IsShellWindow(window);
            if (!enabled || fullscreen) { ShowWindow(edge.Handle, 0); return; }
            SetWindowPos(edge.Handle, new IntPtr(-1), screen.WorkingArea.Left + (screen.WorkingArea.Width - 160) / 2, screen.WorkingArea.Top, 160, 4, 0x0050);
        }
        static bool IsShellWindow(IntPtr hwnd)
        {
            var buffer = new System.Text.StringBuilder(128); GetClassName(hwnd, buffer, buffer.Capacity);
            return buffer.ToString() == "Progman" || buffer.ToString() == "WorkerW";
        }
        public static Rect PopupArea()
        {
            var screen = Forms.Screen.FromPoint(Forms.Cursor.Position);
            var point = new POINT { X = screen.Bounds.Left + 1, Y = screen.Bounds.Top + 1 };
            uint x = 96, y = 96;
            try { GetDpiForMonitor(MonitorFromPoint(point, 2), 0, out x, out y); } catch { }
            double scale = Math.Max(1, x / 96.0);
            return new Rect(screen.WorkingArea.Left / scale, screen.WorkingArea.Top / scale, screen.WorkingArea.Width / scale, screen.WorkingArea.Height / scale);
        }
        public void Dispose()
        {
            Microsoft.Win32.SystemEvents.DisplaySettingsChanged -= DisplayChanged;
            if (foregroundHook != IntPtr.Zero) UnhookWinEvent(foregroundHook);
            if (locationHook != IntPtr.Zero) UnhookWinEvent(locationHook);
            if (Registered) UnregisterHotKey(messages.Handle, 1);
            edge.Dispose(); messages.Dispose();
        }
        [StructLayout(LayoutKind.Sequential)] struct RECT { public int Left, Top, Right, Bottom; }
        [StructLayout(LayoutKind.Sequential)] struct POINT { public int X, Y; }
        delegate void WinEventDelegate(IntPtr hook, uint ev, IntPtr window, int objectId, int childId, uint thread, uint time);
        [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr hwnd, int id, uint modifiers, uint key);
        [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr hwnd, int id);
        [DllImport("user32.dll")] static extern bool SetLayeredWindowAttributes(IntPtr hwnd, uint key, byte alpha, uint flags);
        [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr hwnd, IntPtr after, int x, int y, int width, int height, uint flags);
        [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr hwnd, int command);
        [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr hwnd, System.Text.StringBuilder name, int count);
        [DllImport("user32.dll")] static extern IntPtr SetWinEventHook(uint min, uint max, IntPtr module, WinEventDelegate callback, uint process, uint thread, uint flags);
        [DllImport("user32.dll")] static extern bool UnhookWinEvent(IntPtr hook);
        [DllImport("user32.dll")] static extern IntPtr MonitorFromPoint(POINT point, uint flags);
        [DllImport("shcore.dll")] static extern int GetDpiForMonitor(IntPtr monitor, int type, out uint x, out uint y);
    }

    public static class CoverArt
    {
        [StructLayout(LayoutKind.Sequential)] struct SIZE { public int Width, Height; }
        [ComImport, Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        interface IShellItemImageFactory { [PreserveSig] int GetImage(SIZE size, uint flags, out IntPtr bitmap); }
        [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
        static extern void SHCreateItemFromParsingName(string path, IntPtr context, ref Guid iid, [MarshalAs(UnmanagedType.Interface)] out IShellItemImageFactory factory);
        [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr value);
        public static ImageSource Read(string path)
        {
            IShellItemImageFactory factory = null; IntPtr bitmap = IntPtr.Zero;
            try
            {
                Guid iid = typeof(IShellItemImageFactory).GUID;
                SHCreateItemFromParsingName(path, IntPtr.Zero, ref iid, out factory);
                if (factory.GetImage(new SIZE { Width = 160, Height = 160 }, 8, out bitmap) != 0 || bitmap == IntPtr.Zero) return null;
                var source = Imaging.CreateBitmapSourceFromHBitmap(bitmap, IntPtr.Zero, Int32Rect.Empty, BitmapSizeOptions.FromWidthAndHeight(160, 160));
                source.Freeze(); return source;
            }
            catch { return null; }
            finally { if (bitmap != IntPtr.Zero) DeleteObject(bitmap); if (factory != null) Marshal.ReleaseComObject(factory); }
        }
    }
}
