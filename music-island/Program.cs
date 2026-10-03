using System;
using System.IO;
using System.Threading;
using System.Windows;
using Forms = System.Windows.Forms;

namespace Ostrov
{
    public static class Program
    {
        [STAThread]
        public static int Main(string[] args)
        {
            var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };
            app.Resources.MergedDictionaries.Add(new ResourceDictionary { Source = new Uri("DarkTheme.xaml", UriKind.Relative) });
            if (args.Length > 1 && args[0] == "--self-test")
            {
                app.Startup += async (s, e) => { int code = await SelfTest.Run(args[1]); app.Shutdown(code); };
                return app.Run();
            }
            if (args.Length > 1 && args[0] == "--media-probe")
            {
                app.Startup += async (s, e) =>
                {
                    try { File.WriteAllText(args[1], await NowPlaying.Probe()); app.Shutdown(0); }
                    catch (Exception ex) { File.WriteAllText(args[1], ex.ToString()); app.Shutdown(1); }
                };
                return app.Run();
            }
            string data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Ostrov");
            int dataArgument = Array.IndexOf(args, "--data-dir");
            if (dataArgument >= 0 && dataArgument + 1 < args.Length) data = Path.GetFullPath(args[dataArgument + 1]);
            string suffix = Environment.UserName;
            using (var sha = System.Security.Cryptography.SHA256.Create()) suffix += "." + BitConverter.ToString(sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(data.ToUpperInvariant()))).Replace("-", "").Substring(0, 12);
            bool first;
            using (var mutex = new Mutex(true, "Local\\Ostrov.Player." + suffix, out first))
            using (var wake = new EventWaitHandle(false, EventResetMode.AutoReset, "Local\\Ostrov.Wake." + suffix))
            {
                if (!first) { wake.Set(); return 0; }
                var store = new Store(data);
                var engine = new AudioEngine { Volume = store.State.Volume };
                var media = new NowPlaying(app.Dispatcher);
                var volume = new AppVolume(app.Dispatcher);
                var window = new MainWindow(store, engine, media, volume); app.MainWindow = window;
                NativeHost host = null; Forms.NotifyIcon tray = null; RegisteredWaitHandle wait = null;
                System.Drawing.Icon trayIcon = null;
                app.Startup += async (s, e) =>
                {
                    host = new NativeHost(() => { if (window.IsVisible) window.Dismiss(); else window.Reveal(); }, window.Reveal, store.State.EdgeEnabled);
                    window.Shortcut = host.Shortcut;
                    var menu = new Forms.ContextMenuStrip { Renderer = new DarkTrayRenderer(), BackColor = System.Drawing.Color.FromArgb(23, 23, 27), ForeColor = System.Drawing.Color.FromArgb(240, 240, 242) };
                    menu.Items.Add("Открыть — " + host.Shortcut, null, (x, y) => window.Reveal());
                    menu.Items.Add("Добавить файлы…", null, (x, y) => window.AddFiles());
                    menu.Items.Add("Добавить папку…", null, (x, y) => window.AddFolder());
                    var edgeItem = new Forms.ToolStripMenuItem("Невидимая зона сверху") { Checked = store.State.EdgeEnabled, CheckOnClick = true };
                    edgeItem.CheckedChanged += (x, y) => { store.State.EdgeEnabled = edgeItem.Checked; host.SetEdge(edgeItem.Checked); store.Save(); }; menu.Items.Add(edgeItem);
                    menu.Items.Add(new Forms.ToolStripSeparator());
                    menu.Items.Add("Выход", null, (x, y) => app.Shutdown());
                    using (var iconStream = Application.GetResourceStream(new Uri("pack://application:,,,/Assets/Ostrov.ico")).Stream)
                    using (var icon = new System.Drawing.Icon(iconStream, Forms.SystemInformation.SmallIconSize))
                        trayIcon = (System.Drawing.Icon)icon.Clone();
                    tray = new Forms.NotifyIcon { Text = "Остров · " + host.Shortcut, Icon = trayIcon, ContextMenuStrip = menu, Visible = true };
                    tray.DoubleClick += (x, y) => window.Reveal();
                    wait = ThreadPool.RegisterWaitForSingleObject(wake, (x, timeout) => app.Dispatcher.BeginInvoke(new Action(window.Reveal)), null, Timeout.Infinite, false);
                    window.Restore();
                    // The first run needs an import screen; subsequent starts remain entirely hidden.
                    if (store.State.Tracks.Count == 0 || !host.Registered) window.Reveal();
                    if (!host.Registered) window.ShowNotice("Горячая клавиша занята. Открой Остров двойным кликом по значку в трее.");
                    await media.Start();
                };
                app.Exit += (s, e) =>
                {
                    window.SavePosition(); wait?.Unregister(null); host?.Dispose();
                    if (tray != null) { tray.Visible = false; tray.Dispose(); } trayIcon?.Dispose(); volume.Dispose(); media.Dispose(); engine.Dispose(); mutex.ReleaseMutex();
                };
                app.DispatcherUnhandledException += (s, e) =>
                {
                    try { Directory.CreateDirectory(data); File.WriteAllText(Path.Combine(data, "last-error.txt"), e.Exception.ToString()); } catch { }
                    window.ShowNotice("Операция не завершена. Попробуй ещё раз или перезапусти Остров.");
                    if (!window.IsVisible) window.Reveal();
                    e.Handled = true;
                };
                return app.Run();
            }
        }
    }
}
