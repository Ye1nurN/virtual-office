"""Read-only structural audit after reopening the delivered .blend file."""
import bpy,json
from pathlib import Path
src=Path(__file__).resolve().parent
assets=json.loads((src.parent/'public/models/manifest.json').read_text(encoding='utf-8'))['assets']
for a in assets:
    root=bpy.data.objects.get(a['id']);col=bpy.data.collections.get(a['id'])
    assert root and col and root.type=='EMPTY',a['id']
    assert root.get('asset_id')==a['id']
    assert sum(o.type=='MESH' for o in col.objects)==a['parts'],a['id']
    for o in col.objects:
        if o.type=='MESH':assert o.data.materials and o.parent is not None,(a['id'],o.name)
assert not bpy.data.collections.get('EXPORT_TEMP')
result={'reopened':bpy.data.filepath,'assetCollections':len(assets),'editableMeshParts':sum(a['parts'] for a in assets),'materials':len(bpy.data.materials),'metres':bpy.context.scene.unit_settings.scale_length==1,'passed':True}
(src/'source-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=True))
