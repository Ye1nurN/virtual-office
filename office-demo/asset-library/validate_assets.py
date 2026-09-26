"""Validate standalone GLB data, transforms, ground contact and manifest bounds."""
import json,math,struct,zipfile
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
folder=ROOT/'public/models'
manifest=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
report=[]
assert len({a['id'] for a in manifest['assets']})==len(manifest['assets']), 'Duplicate asset IDs'
required_pivots={'entrance_double_door':['hinge_left','hinge_right'],'door_interior':['hinge_left'],'glass_door':['hinge_left'],'elevator_portal':['slide_left','slide_right'],'laptop':['screen_hinge'],'employee_base':['head','arm_L','arm_R','leg_L','leg_R']}
def transform(node):
    if 'matrix' in node:return np.array(node['matrix']).reshape(4,4).T
    x,y,z,w=node.get('rotation',[0,0,0,1]);m=np.eye(4)
    m[:3,:3]=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])@np.diag(node.get('scale',[1,1,1]))
    m[:3,3]=node.get('translation',[0,0,0]);return m
for asset in manifest['assets']:
    data=(folder/asset['file']).read_bytes()
    magic,version,length=struct.unpack_from('<4sII',data)
    assert magic==b'glTF' and version==2 and length==len(data),asset['id']
    n,kind=struct.unpack_from('<II',data,12);assert kind==0x4E4F534A
    gltf=json.loads(data[20:20+n]);bstart=20+n
    bn,bkind=struct.unpack_from('<II',data,bstart);assert bkind==0x004E4942
    binary=data[bstart+8:bstart+8+bn]
    assert not any('uri' in b for b in gltf['buffers'])
    assert not gltf.get('images'), 'Unexpected external texture dependency'
    assert gltf.get('meshes') and gltf.get('materials')
    names=[node.get('name','') for node in gltf['nodes']]
    for name in required_pivots.get(asset['id'],[]):assert any(n==name or n.startswith(name+'.') for n in names),(asset['id'],'missing pivot',name)
    points=[];triangles=0
    def visit(index,parent):
        global triangles
        node=gltf['nodes'][index];matrix=parent@transform(node)
        assert np.isfinite(matrix).all()
        if 'mesh' in node:
            for primitive in gltf['meshes'][node['mesh']]['primitives']:
                a=gltf['accessors'][primitive['attributes']['POSITION']];assert a['componentType']==5126
                view=gltf['bufferViews'][a['bufferView']];offset=view.get('byteOffset',0)+a.get('byteOffset',0);stride=view.get('byteStride',12)
                vertices=np.ndarray((a['count'],3),dtype='<f4',buffer=binary,offset=offset,strides=(stride,4))
                assert np.isfinite(vertices).all()
                ia=gltf['accessors'][primitive['indices']];iv=gltf['bufferViews'][ia['bufferView']]
                dtype={5121:'u1',5123:'<u2',5125:'<u4'}[ia['componentType']]
                indices=np.frombuffer(binary,dtype=dtype,count=ia['count'],offset=iv.get('byteOffset',0)+ia.get('byteOffset',0))
                assert indices.max()<len(vertices),(asset['id'],'index out of range')
                assert primitive.get('mode',4)==4 and len(indices)%3==0
                assert 0<=primitive['material']<len(gltf['materials'])
                points.append(np.c_[vertices,np.ones(len(vertices))]@matrix.T)
                triangles+=gltf['accessors'][primitive['indices']]['count']//3
        for c in node.get('children',[]):visit(c,matrix)
    for n in gltf['scenes'][gltf.get('scene',0)]['nodes']:visit(n,np.eye(4))
    p=np.concatenate(points)[:,:3];lo=p.min(axis=0);hi=p.max(axis=0);dims=hi-lo
    assert abs(lo[1])<.003,(asset['id'],'not grounded',lo.tolist())
    expected=asset['dimensions'];actual=[dims[0],dims[2],dims[1]]
    assert all(abs(a-b)<.003 for a,b in zip(actual,expected)),(asset['id'],'bounds',actual,expected)
    assert triangles==asset['triangles'],(asset['id'],triangles,asset['triangles'])
    assert len(gltf['meshes'])==asset['renderMeshes']
    report.append({'id':asset['id'],'triangles':triangles,'meshes':len(gltf['meshes']),'minimum_y':round(float(lo[1]),6),'bytes':len(data)})
result={'assets':len(report),'triangles':sum(a['triangles'] for a in report),'bytes':sum(a['bytes'] for a in report),'checks':'GLB2 header, embedded buffers, finite transforms/vertices, valid triangle indices/materials, unique IDs, required movable nodes, metre bounds, ground origin, geometry counts','results':report}
(ROOT/'asset-library/validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
with zipfile.ZipFile(folder/'office-assets-pack.zip','w',zipfile.ZIP_DEFLATED) as z:
    for a in manifest['assets']:z.write(folder/a['file'],'models/'+a['file'])
    z.write(folder/'manifest.json','models/manifest.json')
    z.write(ROOT/'asset-library/README.md','README.md')
    if (ROOT/'asset-library/review/four-floor-coverage.md').exists():z.write(ROOT/'asset-library/review/four-floor-coverage.md','four-floor-coverage.md')
print(json.dumps({k:v for k,v in result.items() if k!='results'}))
