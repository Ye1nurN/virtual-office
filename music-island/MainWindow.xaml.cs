using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Threading;
using Forms = System.Windows.Forms;

namespace Ostrov
{
    public partial class MainWindow : Window
    {
        readonly Store store;
        readonly AudioEngine engine;
        readonly NowPlaying media;
        readonly DispatcherTimer progress;
        readonly DispatcherTimer search;
        bool closing, modal, importing, updating, seeking, commandPending;
        string view = "player", coverPath;
        ImageSource cachedCover;
        int coverRequest;
        double lastVolume = .5;
        public string Shortcut { get; set; } = "Alt+M";
        public bool ProgressTimerRunning { get { return progress.IsEnabled; } }
        internal bool TimelineVisible { get { return ProgressPanel.Visibility == Visibility.Visible; } }
        bool External { get { return media != null && store.State.Source != "local"; } }
        bool Playing { get { return External ? media.Playing : engine.Playing; } }
        public MainWindow(Store store, AudioEngine engine, NowPlaying media = null)
        {
            this.store = store; this.engine = engine; this.media = media;
            InitializeComponent();
            progress = new DispatcherTimer(DispatcherPriority.Background) { Interval = TimeSpan.FromMilliseconds(500) };
            progress.Tick += (s, e) => UpdateProgress();
            search = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(160) };
            search.Tick += (s, e) => { search.Stop(); RefreshList(); };
            engine.Changed += EngineChanged; engine.Ended += TrackEnded;
            if (media != null) { media.Changed += EngineChanged; media.SetFilter(store.State.Source); }
            VolumeSlider.Value = store.State.Volume;
            Closed += (s, e) => { progress.Stop(); search.Stop(); engine.Changed -= EngineChanged; engine.Ended -= TrackEnded; if (media != null) media.Changed -= EngineChanged; };
        }
        public void Restore()
        {
            var current = store.State.Tracks.FirstOrDefault(t => t.Path == store.State.LastPath) ?? store.State.Tracks.FirstOrDefault();
            if (current != null) engine.Open(current, false, current.Path == store.State.LastPath ? store.State.LastPosition : 0);
            if (store.Warning != null) ShowNotice(store.Warning);
        }
        public void Reveal()
        {
            if (IsVisible && !closing) { Activate(); return; }
            closing = false; view = "player";
            if (External) media.Refresh();
            Surface.BeginAnimation(OpacityProperty, null); Slide.BeginAnimation(TranslateTransform.YProperty, null);
            Surface.Opacity = 1; Slide.Y = 0;
            var area = NativeHost.PopupArea(); Width = Math.Min(440, area.Width - 16);
            Left = area.Left + (area.Width - Width) / 2; Top = area.Top + 4;
            MaxHeight = area.Height - 12;
            Show(); Activate(); Focus(); UpdateUI();
            if (SystemParameters.ClientAreaAnimation)
            {
                Slide.BeginAnimation(TranslateTransform.YProperty, new DoubleAnimation(-Math.Max(80, ActualHeight), 0, TimeSpan.FromMilliseconds(200)) { EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut } });
                Surface.BeginAnimation(OpacityProperty, new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(170)));
            }
            ManageTimer();
        }
        public void Dismiss()
        {
            if (!IsVisible || closing || modal) return;
            closing = true; progress.Stop(); search.Stop(); SavePosition();
            if (!SystemParameters.ClientAreaAnimation) { Hide(); closing = false; return; }
            var animation = new DoubleAnimation(Slide.Y, -Math.Max(80, ActualHeight), TimeSpan.FromMilliseconds(140)) { EasingFunction = new CubicEase { EasingMode = EasingMode.EaseIn } };
            animation.Completed += (s, e) => { if (closing) { Hide(); closing = false; } };
            Slide.BeginAnimation(TranslateTransform.YProperty, animation);
            Surface.BeginAnimation(OpacityProperty, new DoubleAnimation(0, TimeSpan.FromMilliseconds(140)));
        }
        void ManageTimer() { if (IsVisible && !closing && Playing && view == "player" && (!External || media.HasTimeline)) progress.Start(); else progress.Stop(); }
        void EngineChanged()
        {
            ManageTimer();
            if (IsVisible && !closing) UpdateUI();
        }
        void TrackEnded()
        {
            if (engine.Current != null) { engine.Current.Plays++; engine.Current.LastPlayedUtc = DateTime.UtcNow.Ticks; }
            NextTrack(); SavePosition();
        }
        void UpdateUI()
        {
            bool external = External, empty = external ? !media.Connected : store.State.Tracks.Count == 0;
            EmptyPane.Visibility = empty && !external ? Visibility.Visible : Visibility.Collapsed;
            ExternalEmptyPane.Visibility = empty && external ? Visibility.Visible : Visibility.Collapsed;
            PlayerPane.Visibility = !empty && view == "player" ? Visibility.Visible : Visibility.Collapsed;
            LibraryPane.Visibility = !external && !empty && view != "player" ? Visibility.Visible : Visibility.Collapsed;
            SourceButton.Content = (external ? store.State.Source == "telegram" ? "Telegram" : "Сейчас играет" : "Моя музыка") + " ▾";
            ExternalEmptyTitle.Text = store.State.Source == "telegram" ? "Включи трек в Telegram" : "Включи музыку";
            ExternalEmptyHint.Text = media?.Error ?? (store.State.Source == "telegram"
                ? "Запусти музыку в Telegram Desktop. Когда он передаст трек Windows, название появится здесь."
                : "Запусти трек в Telegram Desktop или другом плеере. Он появится здесь, если приложение поддерживает медиапанель Windows.");
            ShortcutHint.Text = Shortcut + " — открыть · Esc — скрыть";
            ExternalShortcutHint.Text = ShortcutHint.Text;
            var track = engine.Current;
            TrackTitle.Text = external ? string.IsNullOrWhiteSpace(media.Title) ? "Текущий трек" : media.Title : track?.Title ?? "Выбери трек";
            TrackArtist.Text = external ? string.IsNullOrWhiteSpace(media.Artist) ? media.ApplicationName : media.Artist : track?.Subtitle ?? "Локальная музыка";
            TrackTitle.ToolTip = TrackTitle.Text;
            PlayIcon.Data = (Geometry)FindResource(Playing ? "IconPause" : "IconPlay");
            PlayButton.IsEnabled = !commandPending && (external ? media.CanToggle : engine.Ready);
            PreviousButton.IsEnabled = !commandPending && (external ? media.CanPrevious : engine.Ready);
            NextButton.IsEnabled = !commandPending && (external ? media.CanNext : engine.Ready);
            System.Windows.Automation.AutomationProperties.SetName(PlayButton, Playing ? "Пауза" : "Воспроизвести");
            FavoriteButton.IsEnabled = track != null;
            FavoriteButton.Visibility = external ? Visibility.Collapsed : Visibility.Visible;
            LocalVolume.Visibility = LocalActions.Visibility = external ? Visibility.Collapsed : Visibility.Visible;
            ExternalStatus.Visibility = ExternalFooter.Visibility = external ? Visibility.Visible : Visibility.Collapsed;
            if (external) ExternalStatus.Text = media.ApplicationName + "\n" + (media.Playing ? "Играет" : "На паузе");
            FavoriteIcon.Data = (Geometry)FindResource(track != null && track.Favorite ? "IconHeartFill" : "IconHeart");
            FavoriteIcon.Fill = track != null && track.Favorite ? (Brush)FindResource("Accent") : Brushes.White;
            UpdateProgress(); UpdateCover();
            if (view != "player") RefreshList();
            if (!external && engine.Error != null) ShowNotice(engine.Error);
            ManageTimer();
        }
        async void UpdateCover()
        {
            bool external = External;
            var path = external ? "session:" + media.ArtworkVersion : engine.Current?.Path;
            if (coverPath == path) { Cover.Source = cachedCover; return; }
            coverPath = path; cachedCover = null; Cover.Source = null;
            int request = ++coverRequest;
            if (path == null) return;
            var image = external ? await media.ReadArtwork() : await Task.Run(() => CoverArt.Read(path));
            if (request == coverRequest) { cachedCover = image; if (IsVisible) Cover.Source = image; }
        }
        void UpdateProgress()
        {
            bool available = !External || media.HasTimeline;
            ProgressPanel.Visibility = available ? Visibility.Visible : Visibility.Collapsed;
            if (seeking) return;
            updating = true;
            double duration = External ? media.Duration : engine.Duration, position = External ? media.Position : engine.Position;
            PositionSlider.Maximum = Math.Max(1, duration);
            PositionSlider.Value = position; PositionSlider.IsEnabled = External ? media.CanSeek : engine.Ready;
            ElapsedText.Text = available ? Time(position) : "—:—"; DurationText.Text = available && duration > 0 ? Time(duration) : "—:—";
            updating = false;
        }
        static string Time(double seconds) { var span = TimeSpan.FromSeconds(Math.Max(0, seconds)); return ((int)span.TotalMinutes) + ":" + span.Seconds.ToString("00"); }
        public void SavePosition()
        {
            store.State.LastPath = engine.Current?.Path; store.State.LastPosition = engine.Position; store.State.Volume = engine.Volume;
            if (!store.Save() && IsVisible) ShowNotice(store.Warning);
        }
        public void ShowNotice(string message)
        {
            NoticeText.Text = message ?? ""; NoticeBox.Visibility = string.IsNullOrEmpty(message) ? Visibility.Collapsed : Visibility.Visible;
        }
        void PlayTrack(Track track)
        {
            if (External) { ShowNotice("Переключись на «Моя музыка», чтобы воспроизвести файл."); return; }
            ShowNotice(null); view = "player";
            if (engine.Current != null && engine.Playing) engine.Current.LastPlayedUtc = DateTime.UtcNow.Ticks;
            engine.Open(track); UpdateUI(); SavePosition();
        }
        void NextTrack()
        {
            var tracks = store.State.Tracks; if (tracks.Count == 0) return;
            Track next = null;
            if (store.State.SmartNext) next = Library.Recommend(tracks, engine.Current, 1).FirstOrDefault();
            if (next == null) next = tracks[(tracks.IndexOf(engine.Current) + 1) % tracks.Count];
            PlayTrack(next);
        }
        public void AddFiles()
        {
            Reveal(); modal = true;
            try
            {
                var picker = new Microsoft.Win32.OpenFileDialog { Title = "Добавить музыку в Остров", Multiselect = true, Filter = "Музыка|*.mp3;*.wav;*.m4a;*.wma;*.aac;*.flac|Все файлы|*.*" };
                if (picker.ShowDialog(this) == true) Import(picker.FileNames);
            }
            finally { modal = false; Activate(); }
        }
        public void AddFolder()
        {
            Reveal(); modal = true;
            try
            {
                using (var picker = new Forms.FolderBrowserDialog { Description = "Выбери папку с музыкой. Подпапки тоже будут добавлены.", ShowNewFolderButton = false })
                { if (picker.ShowDialog() == Forms.DialogResult.OK) Import(Library.Enumerate(picker.SelectedPath)); }
            }
            finally { modal = false; Activate(); }
        }
        async void Import(IEnumerable<string> paths)
        {
            if (importing) { ShowNotice("Уже добавляю музыку. Дождись завершения."); return; }
            importing = true; ShowNotice("Добавляю музыку…");
            try
            {
                var imported = await Library.ImportAsync(paths, store.State.Tracks.Select(t => t.Path).ToList());
                store.State.Tracks.AddRange(imported); store.Save();
                if (engine.Current == null && imported.Count > 0) engine.Open(imported[0], false);
                SetSource("local"); view = "library"; UpdateUI();
                ShowNotice(imported.Count == 0 ? "Новых аудиофайлов не найдено. Уже добавленные треки не дублируются." : "Добавлено треков: " + imported.Count + ". Нажми на трек, чтобы слушать.");
            }
            catch { ShowNotice("Не удалось прочитать часть файлов. Проверь выбранную папку."); }
            finally { importing = false; }
        }
        void RefreshList()
        {
            IEnumerable<Track> rows = store.State.Tracks;
            if (view == "similar") rows = Library.Recommend(rows, engine.Current, 50);
            else if (view == "favorites") rows = rows.Where(t => t.Favorite);
            else if (view == "queue" && engine.Current != null)
            { int index = store.State.Tracks.IndexOf(engine.Current); rows = rows.Skip(index + 1).Concat(store.State.Tracks.Take(index + 1)); }
            string query = SearchBox.Text.Trim();
            if (query.Length > 0) rows = rows.Where(t => ((t.Title ?? "") + " " + t.Subtitle).IndexOf(query, StringComparison.CurrentCultureIgnoreCase) >= 0);
            var result = rows.ToList(); TrackList.ItemsSource = result;
            ListTitle.Text = view == "similar" ? "Похожее" : view == "queue" ? "Очередь" : view == "favorites" ? "Избранное" : "Библиотека";
            ListSubtitle.Text = result.Count == 0 ? "Пока нет подходящих треков" : view == "similar" ? "Твоя коллекция · теги и привычки" : "Треков: " + result.Count;
        }
        void OpenList(string name) { SetSource("local"); view = name; SearchBox.Text = ""; ShowNotice(null); UpdateUI(); }
        void SetSource(string source)
        {
            if (source != "local" && engine.Playing) { engine.Toggle(); SavePosition(); }
            store.State.Source = source;
            media?.SetFilter(source); view = "player"; seeking = false; ShowNotice(null); store.Save(); UpdateUI();
        }
        void Source_Click(object sender, RoutedEventArgs e)
        {
            var menu = new ContextMenu();
            foreach (var pair in new[] { new[] { "now", "Сейчас играет · автоматически" }, new[] { "telegram", "Только Telegram Desktop" }, new[] { "local", "Моя музыка · локальные файлы" } })
            {
                string source = pair[0]; var item = new MenuItem { Header = pair[1], IsCheckable = true, IsChecked = store.State.Source == source };
                item.Click += (s, args) => SetSource(source); menu.Items.Add(item);
            }
            modal = true; menu.Closed += (s, args) => { modal = false; };
            menu.PlacementTarget = SourceButton; menu.IsOpen = true;
        }
        void Local_Click(object sender, RoutedEventArgs e) { SetSource("local"); }
        void Dismiss_Click(object sender, RoutedEventArgs e) { Dismiss(); }
        void Menu_Click(object sender, RoutedEventArgs e)
        {
            var menu = new ContextMenu();
            Action<string, Action> add = (title, action) => { var item = new MenuItem { Header = title }; item.Click += (s, args) => action(); menu.Items.Add(item); };
            add("Библиотека", () => OpenList("library")); add("Избранное", () => OpenList("favorites"));
            add("Добавить файлы…", AddFiles); add("Добавить папку…", AddFolder);
            var smart = new MenuItem { Header = "Подбирать следующий трек", IsCheckable = true, IsChecked = store.State.SmartNext };
            smart.Click += (s, args) => { store.State.SmartNext = smart.IsChecked; store.Save(); }; menu.Items.Add(smart);
            add("Скрыть — " + Shortcut, () => { modal = false; Dismiss(); }); add("Выход", () => Application.Current.Shutdown());
            modal = true; menu.Closed += (s, args) => { modal = false; };
            menu.PlacementTarget = sender as UIElement; menu.IsOpen = true;
        }
        async void ExternalCommand(string command, double seconds = 0)
        {
            if (commandPending || !External) return;
            commandPending = true; UpdateUI();
            try { if (!await media.Command(command, seconds)) ShowNotice("Приложение не выполнило команду. Попробуй управлять треком в его окне."); }
            finally { commandPending = false; if (IsVisible) UpdateUI(); }
        }
        void Play_Click(object sender, RoutedEventArgs e) { if (External) ExternalCommand("toggle"); else { engine.Toggle(); SavePosition(); } }
        void Next_Click(object sender, RoutedEventArgs e) { if (External) ExternalCommand("next"); else NextTrack(); }
        void Previous_Click(object sender, RoutedEventArgs e)
        {
            if (External) { ExternalCommand("previous"); return; }
            if (engine.Position > 3) { engine.Seek(0); UpdateProgress(); return; }
            var tracks = store.State.Tracks; if (tracks.Count == 0) return;
            PlayTrack(tracks[(tracks.IndexOf(engine.Current) - 1 + tracks.Count) % tracks.Count]);
        }
        void Favorite_Click(object sender, RoutedEventArgs e) { if (engine.Current == null) return; engine.Current.Favorite = !engine.Current.Favorite; store.Save(); UpdateUI(); }
        void Volume_Changed(object sender, RoutedPropertyChangedEventArgs<double> e) { if (engine == null) return; engine.Volume = e.NewValue; if (VolumeIcon != null) VolumeIcon.Data = (Geometry)FindResource(e.NewValue > 0 ? "IconSpeakerHigh" : "IconSpeakerSlash"); }
        void Mute_Click(object sender, RoutedEventArgs e) { if (engine.Volume > 0) { lastVolume = engine.Volume; VolumeSlider.Value = 0; } else VolumeSlider.Value = lastVolume; }
        void Position_Changed(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            if (updating || engine == null) return;
            if (External) { if (!seeking) ExternalCommand("seek", e.NewValue); }
            else if (engine.Ready) engine.Seek(e.NewValue);
            if (ElapsedText != null) ElapsedText.Text = Time(e.NewValue);
        }
        void Seek_Begin(object sender, MouseButtonEventArgs e) { seeking = true; }
        void Seek_End(object sender, MouseEventArgs e) { if (!seeking) return; seeking = false; if (External) ExternalCommand("seek", PositionSlider.Value); }
        void AddFiles_Click(object sender, RoutedEventArgs e) { AddFiles(); }
        void AddFolder_Click(object sender, RoutedEventArgs e) { AddFolder(); }
        void Queue_Click(object sender, RoutedEventArgs e) { OpenList("queue"); }
        void Similar_Click(object sender, RoutedEventArgs e) { OpenList("similar"); }
        void Back_Click(object sender, RoutedEventArgs e) { view = "player"; UpdateUI(); }
        void PlayItem_Click(object sender, RoutedEventArgs e) { var track = (sender as FrameworkElement)?.DataContext as Track; if (track != null) PlayTrack(track); }
        void Search_Changed(object sender, TextChangedEventArgs e) { if (search == null) return; search.Stop(); if (IsVisible) search.Start(); }
        void Window_KeyDown(object sender, KeyEventArgs e) { if (e.Key == Key.Escape) { Dismiss(); e.Handled = true; } else if (e.Key == Key.Space && !(Keyboard.FocusedElement is TextBox)) { Play_Click(sender, e); e.Handled = true; } }
        void Window_Deactivated(object sender, EventArgs e) { if (!modal) Dismiss(); }
        void Window_DragOver(object sender, DragEventArgs e) { e.Effects = e.Data.GetDataPresent(DataFormats.FileDrop) ? DragDropEffects.Copy : DragDropEffects.None; e.Handled = true; }
        void Window_Drop(object sender, DragEventArgs e)
        {
            var paths = e.Data.GetData(DataFormats.FileDrop) as string[]; if (paths == null) return;
            Import(paths.SelectMany(path => System.IO.Directory.Exists(path) ? Library.Enumerate(path) : new[] { path }));
        }
    }
}
