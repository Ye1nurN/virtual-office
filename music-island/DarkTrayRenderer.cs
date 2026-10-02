using System.Drawing;
using System.Windows.Forms;

namespace Ostrov
{
    internal sealed class DarkTrayRenderer : ToolStripProfessionalRenderer
    {
        public DarkTrayRenderer() : base(new Palette()) { RoundedEdges = false; }
        protected override void OnRenderItemText(ToolStripItemTextRenderEventArgs e)
        {
            e.TextColor = e.Item.Enabled ? Color.FromArgb(240, 240, 242) : Color.FromArgb(133, 133, 144);
            base.OnRenderItemText(e);
        }
        protected override void OnRenderItemCheck(ToolStripItemImageRenderEventArgs e)
        {
            ControlPaint.DrawMenuGlyph(e.Graphics, e.ImageRectangle, MenuGlyph.Checkmark, Color.FromArgb(240, 240, 242), Color.Transparent);
        }
        sealed class Palette : ProfessionalColorTable
        {
            static readonly Color Surface = Color.FromArgb(23, 23, 27), Border = Color.FromArgb(56, 56, 63), Hover = Color.FromArgb(48, 48, 55);
            public Palette() { UseSystemColors = false; }
            public override Color ToolStripDropDownBackground { get { return Surface; } }
            public override Color ImageMarginGradientBegin { get { return Surface; } }
            public override Color ImageMarginGradientMiddle { get { return Surface; } }
            public override Color ImageMarginGradientEnd { get { return Surface; } }
            public override Color MenuBorder { get { return Border; } }
            public override Color MenuItemBorder { get { return Border; } }
            public override Color MenuItemSelected { get { return Hover; } }
            public override Color MenuItemSelectedGradientBegin { get { return Hover; } }
            public override Color MenuItemSelectedGradientEnd { get { return Hover; } }
            public override Color MenuItemPressedGradientBegin { get { return Hover; } }
            public override Color MenuItemPressedGradientMiddle { get { return Hover; } }
            public override Color MenuItemPressedGradientEnd { get { return Hover; } }
            public override Color CheckBackground { get { return Hover; } }
            public override Color CheckSelectedBackground { get { return Hover; } }
            public override Color CheckPressedBackground { get { return Hover; } }
            public override Color SeparatorDark { get { return Border; } }
            public override Color SeparatorLight { get { return Surface; } }
        }
    }
}
