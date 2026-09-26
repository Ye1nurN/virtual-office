"""Render the saved source collection sheets with projection-aware framing.
blender --background office-assets.blend --python render_library.py
"""
import bpy, json, math
from pathlib import Path
from mathutils import Vector
SRC=Path(__file__).resolve().parent
catalog=json.loads((SRC.parent/'public/models/manifest.json').read_text(encoding='utf-8'))['assets']
scene=bpy.context.scene;camera=scene.camera
scene.render.resolution_x=1600;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.cycles.samples=16;scene.render.image_settings.file_format='PNG'
positions={a['id']:bpy.data.objects[a['id']].location.copy() for a in catalog}

def render_subset(items,name,step,cols):
    ids={a['id'] for a in items};rows=math.ceil(len(items)/cols)
    for a in catalog:bpy.data.collections[a['id']].hide_render=a['id'] not in ids
    for i,a in enumerate(items):bpy.data.objects[a['id']].location=((i%cols-(cols-1)/2)*step,(i//cols-(rows-1)/2)*step,0)
    bpy.context.view_layer.update()
    camera.location=(4,-10,17);camera.rotation_euler=(Vector((0,0,.4))-camera.location).to_track_quat('-Z','Y').to_euler()
    rotation=camera.rotation_euler.to_matrix();inverse=rotation.transposed();coords=[]
    for a in items:
        for o in bpy.data.collections[a['id']].objects:
            if o.type=='MESH':coords.extend(inverse@(o.matrix_world@Vector(p)-camera.location) for p in o.bound_box)
    lo=[min(p[i] for p in coords) for i in range(3)];hi=[max(p[i] for p in coords) for i in range(3)]
    camera.location+=rotation@Vector(((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,0))
    aspect=scene.render.resolution_x/scene.render.resolution_y
    camera.data.ortho_scale=max(hi[0]-lo[0],(hi[1]-lo[1])*aspect)*1.14
    scene.render.filepath=str(SRC/'renders'/name);bpy.ops.render.render(write_still=True)

render_subset(catalog,'library-overview.png',4.5,9)
for ci,category in enumerate(dict.fromkeys(a['category'] for a in catalog)):
    selected=[a for a in catalog if a['category']==category and a['kit']!='reserve']
    for page in range(math.ceil(len(selected)/12)):
        items=selected[page*12:page*12+12]
        render_subset(items,'category-%02d-%d.png'%(ci+1,page+1),4.6 if category=='Архитектура' else 3.5,min(4,len(items)))
for a in catalog:
    bpy.data.collections[a['id']].hide_render=False;bpy.data.objects[a['id']].location=positions[a['id']]
print('SHEETS_COMPLETE')
