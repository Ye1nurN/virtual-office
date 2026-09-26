"""Reference-based office asset reconstruction. Blender 5.x, no external packages.
Run: blender --background --factory-startup --python asset-library/build_library.py
Metres, Z up in Blender; glTF export converts to Y up. Front is Blender -Y.
"""
import bpy, math, random, json, sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'models'
SRC = ROOT / 'asset-library'
OUT.mkdir(parents=True, exist_ok=True)
(SRC / 'renders').mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
    if c.name != 'Collection': bpy.data.collections.remove(c)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.resolution_x=1400
scene.render.resolution_y=1050
scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
scene.world.color=(.22,.27,.32)
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.56,.68,.80,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.45

def linear(x): return x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
def color(h): return tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4))+(1,)
M={}
def mat(name,h,rough=.65,metal=0,emission=0,transmission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=color(h)
    p.inputs['Roughness'].default_value=rough
    p.inputs['Metallic'].default_value=metal
    p.inputs['Transmission Weight'].default_value=transmission
    if transmission:p.inputs['IOR'].default_value=1.45
    if emission:
        p.inputs['Emission Color'].default_value=color(h)
        p.inputs['Emission Strength'].default_value=emission
    m.diffuse_color=color(h);M[name]=m;return m
for args in [
 ('oak','BC854A',.55),('oak_top','D59E58',.58),('oak_light','E1B573',.58),('oak_dark','7D5533',.7),('oak_grain','B47C40',.75),
 ('metal','344251',.4,.5),('metal_light','859595',.38,.65),('steel','BAC3BE',.3,.75),('black','17252F',.6),
 ('navy','33465F',.85),('navy_light','435B75',.8),('navy_dark','26364A',.8),('sage','71836A',.95),('sage_light','8D9A77',.9),('sage_dark','475B51',.9),
 ('stone','D7D6BE',.95),('soil','403728',1),('terracotta','917154',.95),('pot_rim','B3946B',.85),
 ('leaf_dark','355331',.95),('leaf','53722C',.95),('leaf_mid','77942F',.95),('leaf_light','A2AD37',.95),('leaf_tip','C2C64D',.9),
 ('bark','725638',1),('bark_light','967544',1),('paper','E5E4CF',.92),('white','F4EEE0',.7),('screen','123246',.35,0,.15),
 ('code_teal','63B8AF',.7,0,.3),('code_blue','5696CD',.7,0,.3),('code_amber','D6BA72',.7,0,.2),
 ('book_blue','447A8C',.9),('book_teal','54766D',.9),('book_cream','D0BD87',.9),('book_red','9C634E',.9),
 ('sticky_yellow','DFC473',.9),('sticky_blue','80AFC1',.9),('sticky_pink','C18D85',.9),('sticky_green','9DAF72',.9),
 ('skin','D6A075',.9),('skin_light','E9B787',.9),('skin_shadow','AA7255',.9),('hair','4B3327',.95),('hair_light','705039',.95),('hair_dark','312B27',.95),
 ('shirt','256990',.9),('shirt_light','3A83A7',.9),('pants','263D52',.9),('shoe','252C31',.8),('eye','19282C',.5),('warm_light','FFE0A0',.5,0,3),
 ('glass','F2F9F7',.08,0,0,1),('floor','5C6C7A',.94),('floor_light','677685',.94),('wall','526774',.92)]: mat(*args)

mesh_cache={};current=None;root=None;assets=[]
def link(obj):
    current.objects.link(obj);obj.parent=root;return obj
def cube_mesh():
    if 'cube' in mesh_cache:return mesh_cache['cube']
    m=bpy.data.meshes.new('unit_box')
    m.from_pydata([(-.5,-.5,-.5),(.5,-.5,-.5),(.5,.5,-.5),(-.5,.5,-.5),(-.5,-.5,.5),(.5,-.5,.5),(.5,.5,.5),(-.5,.5,.5)],[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    mesh_cache['cube']=m;return m
def box(name,p,s,ma='oak',bevel=0,rot=0):
    # Build at final dimensions so bevel widths stay in metres.
    mesh=cube_mesh().copy();mesh.name=name+'_mesh'
    for v in mesh.vertices:v.co.x*=s[0];v.co.y*=s[1];v.co.z*=s[2]
    mesh.materials.append(M[ma]);o=link(bpy.data.objects.new(name,mesh));o.location=p;o.rotation_euler.z=rot
    if bevel:
        mod=o.modifiers.new('small manufactured edge','BEVEL');mod.width=bevel;mod.segments=1
        mod.affect='EDGES'
        mod=o.modifiers.new('weighted face normals','WEIGHTED_NORMAL');mod.keep_sharp=True
    return o
def cyl(name,p,r,depth,ma,vertices=12,r2=None,rot=None):
    r2=r if r2 is None else r2
    v=[(math.cos(a*2*math.pi/vertices)*rr,math.sin(a*2*math.pi/vertices)*rr,z) for z,rr in [(-depth/2,r),(depth/2,r2)] for a in range(vertices)]
    f=[tuple(reversed(range(vertices))),tuple(range(vertices,vertices*2))]+[(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)]
    mesh=bpy.data.meshes.new(name+'_mesh');mesh.from_pydata(v,[],f);mesh.materials.append(M[ma])
    o=link(bpy.data.objects.new(name,mesh));o.location=p
    if rot:o.rotation_euler=rot
    return o
def rod(name,a,b,r,ma,vertices=8):
    a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,r,(b-a).length,ma,vertices);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def group(name,p=(0,0,0)):
    o=link(bpy.data.objects.new(name,None));o.location=p;return o
def begin(key,title,category,source,description):
    global current,root
    current=bpy.data.collections.new(key);scene.collection.children.link(current)
    root=bpy.data.objects.new(key,None);current.objects.link(root)
    root['asset_id']=key;root['metres']=True;root['source_reference']='approved-design.png';root['reconstruction']=True
    assets.append({'id':key,'title':title,'category':category,'sourceRect':source,'description':description,'collection':current,'root':root})
def finish():
    global root
    bpy.context.view_layer.update()
    for o in current.objects:
        if o.type=='MESH':
            o['part']=o.name
    root=None

def drawer(p,width=.40,depth=.60,height=.66):
    x,y,z=p
    box('cabinet carcass',(x,y,z+height/2),(width,depth,height),'oak',.012)
    box('cabinet plinth',(x,y,z+.035),(width-.025,depth-.025,.07),'oak_dark',.007)
    for j in range(3):
        zz=z+.12+j*(height-.08)/3
        box('separate drawer front',(x,y-depth/2-.012,zz),(width-.035,.035,(height-.10)/3-.016),'oak_top',.008)
        box('inset handle shadow',(x,y-depth/2-.032,zz+.038),(.15,.006,.025),'oak_dark',.003)
        box('brushed drawer pull',(x,y-depth/2-.049,zz+.044),(.12,.024,.019),'metal_light',.004)
def desk(width=1.68,depth=.80):
    box('thick desktop',(0,0,.76),(width,depth,.075),'oak_top',.018)
    box('underside edge',(0,0,.716),(width-.04,depth-.04,.018),'oak_dark',.004)
    for x in [-width/2+.22,width/2-.22]:drawer((x,.005,0),.39,depth-.10,.65)
    box('rear modesty panel',(0,.30,.48),(width-.75,.045,.44),'oak',.004)
    # Fine graphic grain remains real portable geometry, no baked lighting.
    rng=random.Random(19)
    for j in range(12):
        x=rng.uniform(-width/2+.08,width/2-.18);y=rng.uniform(-depth/2+.06,depth/2-.06)
        box('subtle oak grain',(x,y,.798),(rng.uniform(.05,.25),.0025,.0008),'oak_grain')
    cyl('cable grommet',(.57,.23,.800),.027,.004,'metal',12)

def monitor(p=(0,0,0)):
    x,y,z=p
    box('display base',(x,y,z+.018),(.32,.20,.036),'metal',.012)
    box('display foot bevel',(x,y,z+.041),(.24,.14,.012),'metal_light',.005)
    box('display pedestal',(x,y+.035,z+.15),(.06,.055,.23),'metal',.007)
    box('monitor shell',(x,y,z+.375),(.58,.057,.355),'black',.016)
    box('rear shell inset',(x,y+.031,z+.38),(.49,.012,.26),'navy_dark',.018)
    box('LCD glass',(x,y-.032,z+.386),(.535,.004,.298),'screen',.002)
    box('screen toolbar',(x,y-.035,z+.515),(.519,.002,.024),'navy')
    box('editor sidebar',(x-.214,y-.036,z+.376),(.065,.002,.230),'navy_dark')
    rng=random.Random(33)
    for i in range(10):
        row=z+.485-i*.023
        box('line number',(x-.174,y-.038,row),(.012,.001,.006),'metal_light')
        for k in range(2+(i%2)):
            xx=x-.14+k*.085+(i%3)*.012
            box('editor code',(xx,y-.038,row),(rng.uniform(.025,.073),.001,.007),['code_teal','code_blue','code_amber'][i%3])
    box('lower bezel',(x,y-.035,z+.214),(.555,.007,.018),'navy_dark',.002)
    cyl('power LED',(x+.24,y-.04,z+.216),.002,.003,'code_teal',8,rot=(math.pi/2,0,0))
def keyboard(p=(0,0,0)):
    x,y,z=p
    box('keyboard housing',(x,y,z+.018),(.44,.15,.036),'metal',.01)
    for row in range(4):
        for col in range(13):
            box('keycap',(x-.198+col*.031,y-.052+row*.032,z+.041),(.023,.024,.012),'metal_light' if row else 'navy_light',.002)
    box('space bar',(x,y-.056,z+.045),(.14,.026,.012),'steel',.003)
    box('mouse',(x+.33,y,z+.029),(.070,.112,.050),'navy',.018)
    box('mouse split',(x+.33,y+.023,z+.054),(.002,.051,.002),'black')
    box('scroll wheel',(x+.33,y+.015,z+.057),(.009,.025,.009),'black',.002)
def mug(p=(0,0,0)):
    x,y,z=p
    cyl('mug body',(x,y,z+.048),.042,.096,'white',12)
    cyl('mug rim',(x,y,z+.097),.045,.010,'paper',12)
    cyl('coffee surface',(x,y,z+.101),.034,.002,'oak_dark',12)
    for zz in [.025,.075]:box('handle bridge',(x+.055,y,z+zz),(.055,.022,.017),'white',.003)
    box('handle grip',(x+.078,y,z+.05),(.016,.022,.062),'white',.005)

def chair(color='navy',meeting=False):
    lighter='sage_light' if meeting else 'navy_light';dark='sage_dark' if meeting else 'navy_dark'
    for i in range(5):
        a=i*2*math.pi/5
        x,y=math.sin(a)*.28,math.cos(a)*.28
        rod('five star leg',(.0,.0,.16),(x,y,.10),.021,'metal',8)
        for s in [-1,1]:cyl('caster wheel',(x+s*.020,y,.045),.041,.023,'black',10,rot=(0,math.pi/2,0))
        box('caster fork',(x,y,.084),(.045,.035,.035),'metal',.006)
    cyl('gas lift',(0,0,.27),.022,.28,'steel',12)
    cyl('lift sleeve',(0,0,.21),.036,.15,'metal',12)
    box('seat mechanism',(0,.03,.405),(.23,.25,.06),'black',.02)
    box('seat pan',(0,0,.445),(.55,.52,.075),dark,.04)
    box('seat cushion',(0,-.015,.505),(.55,.51,.100),color,.044)
    box('seat face inset',(0,-.022,.558),(.46,.415,.007),lighter,.023)
    rod('back support left',(-.17,.16,.42),(-.17,.24,.80),.018,'metal')
    rod('back support right',(.17,.16,.42),(.17,.24,.80),.018,'metal')
    back=box('backrest frame',(0,.258,.90),(.53,.085,.60),dark,.04);back.rotation_euler.x=-.085
    back=box('backrest upholstered front',(0,.199,.91),(.47,.063,.54),color,.035);back.rotation_euler.x=-.085
    box('lumbar pad',(0,.15,.745),(.40,.036,.13),lighter,.019)
    for x in [-.316,.316]:
        rod('armrest upright',(x*.83,.075,.43),(x,.075,.71),.018,'metal')
        box('armrest pad',(x,-.017,.735),(.075,.33,.050),dark,.015)
    rod('height lever',(.10,-.02,.41),(.31,-.05,.40),.012,'metal')
    box('lever grip',(.32,-.05,.40),(.075,.035,.024),'black',.005)

def plant(p=(0,0,0),size=1,seed=1,tall=False):
    x,y,z=p;rng=random.Random(seed)
    cyl('tapered ceramic pot',(x,y,z+.18*size),.14*size,.36*size,'terracotta',8,.205*size)
    cyl('pot lip',(x,y,z+.354*size),.215*size,.055*size,'pot_rim',8)
    cyl('pot soil',(x,y,z+.379*size),.184*size,.015*size,'soil',8)
    top=1.35 if tall else .91
    rod('plant stem',(x,y,z+.37*size),(x,y,z+top*size),.018*size,'bark')
    greens=['leaf_dark','leaf','leaf_mid','leaf_light','leaf_tip']
    for branch in range(17 if tall else 11):
        a=branch*2.4;zz=.49+branch*(.047 if tall else .036);rr=.16+(branch%4)*.056
        tip=(x+math.cos(a)*rr*size,y+math.sin(a)*rr*size,z+(zz+.12)*size)
        rod('plant twig',(x,y,z+zz*size),tip,.008*size,'bark',6)
        for j in range(15):
            px=tip[0]+rng.uniform(-.075,.075)*size;py=tip[1]+rng.uniform(-.075,.075)*size;pz=tip[2]+rng.uniform(-.03,.085)*size
            box('stepped leaf',(px,py,pz),(.065*size,.105*size,.027*size),greens[(j+branch)%5],rot=a+j*.5)

def shelf():
    w=.77;depth=.37
    box('bookcase back',(0,.15,.83),(w,.065,1.63),'oak_dark',.008)
    for x in [-w/2+.035,w/2-.035]:box('bookcase upright',(x,0,.84),(.07,depth,1.68),'oak',.008)
    rng=random.Random(23)
    for j in range(5):
        z=.09+j*.383
        box('shelf board',(0,0,z),(w,depth,.052),'oak_top',.006)
        if j==4:continue
        for k in range(8):
            h=rng.uniform(.21,.30);xx=-.29+k*.078
            box('book pages',(xx,-.008,z+.038+h/2),(.052,.245,h),'paper',.001)
            box('book spine',(xx,-.14,z+.038+h/2),(.064,.02,h+.01),['book_blue','book_cream','book_teal','book_red'][k%4],.002)
            for zz in [.07,h-.025]:box('spine band',(xx,-.152,z+.038+zz),(.048,.002,.008),'oak_light')
    box('bookcase top cap',(0,0,1.68),(.81,.41,.075),'oak_top',.008)

def sofa(width=2.15,seats=3):
    for x in [-width/2+.14,width/2-.14]:
        for y in [-.25,.25]:box('sofa foot',(x,y,.055),(.09,.09,.11),'oak_dark',.014)
    box('sofa frame',(0,0,.25),(width,.79,.29),'sage_dark',.035)
    box('lower upholstery',(0,-.04,.335),(width-.04,.75,.21),'sage',.035)
    for x in [-width/2+.09,width/2-.09]:box('sofa arm',(x,0,.54),(.18,.80,.43),'sage',.038)
    inside=width-.38
    for i in range(seats):
        x=-inside/2+(i+.5)*inside/seats
        box('individual seat cushion',(x,-.085,.47),(inside/seats-.018,.60,.17),'sage_light',.037)
        box('individual back cushion',(x,.278,.71),(inside/seats-.008,.18,.47),'sage',.036)
        box('cushion top edge',(x,.264,.944),(inside/seats-.07,.13,.012),'sage_light',.006)
    box('sofa back',(0,.36,.66),(width-.16,.11,.56),'sage_dark',.025)

def table(radius=.62,height=.72):
    cyl('round oak tabletop',(0,0,height-.025),radius,.070,'oak_top',24)
    cyl('table edge',(0,0,height-.064),radius-.012,.018,'oak_dark',24)
    cyl('table pedestal',(0,0,height/2-.03),.052,height-.12,'metal',12)
    for i in range(4):
        a=i*math.pi/2+math.pi/4
        rod('table splayed foot',(0,0,.12),(math.cos(a)*radius*.67,math.sin(a)*radius*.67,.035),.028,'metal')

def whiteboard():
    box('board backing',(0,.0,1.30),(1.27,.045,.89),'stone',.009)
    box('writing surface',(0,-.027,1.30),(1.19,.01,.81),'white',.003)
    for x in [-.62,.62]:box('aluminium frame upright',(x,-.035,1.30),(.025,.028,.90),'metal_light',.004)
    for z in [.864,1.737]:box('aluminium frame rail',(0,-.035,z),(1.25,.03,.024),'steel',.004)
    box('marker tray',(0,-.077,.84),(.90,.13,.032),'metal_light',.005)
    for x,ma in [(-.25,'code_teal'),(-.13,'book_red'),(.0,'code_blue')]:rod('dry erase marker',(x,-.105,.866),(x+.085,-.105,.866),.009,ma)
    # Arranged notes, headings and chart strokes as shallow coloured inlays.
    rng=random.Random(5)
    for col in range(4):
        x=-.45+col*.29
        box('column heading',(x,-.034,1.635),(.19,.001,.025),['sticky_blue','sticky_yellow','sticky_pink','sticky_green'][col])
        for row in range(3):
            z=1.49-row*.18+rng.uniform(-.03,.03)
            box('planning card',(x+rng.uniform(-.025,.025),-.038,z),(.135,.004,.104),['sticky_yellow','sticky_blue','sticky_green','paper'][(col+row)%4],rot=0)
            for line in range(2):box('card annotation',(x-.013,-.041,z+.020-line*.026),(.075,.001,.005),'metal_light')
    for x in [-.48,.48]:
        rod('board stand',(x,.04,.12),(x,.04,.9),.017,'metal')
        box('board foot',(x,0,.075),(.065,.47,.038),'metal',.008)
        for y in [-.2,.2]:cyl('board caster',(x,y,.045),.035,.035,'black',10,rot=(0,math.pi/2,0))

def tree():
    rng=random.Random(68)
    # Segmented trunk with bark seams, root flare and branching silhouette.
    rod('trunk',(0,0,.08),(.04,.01,1.78),.12,'bark',7)
    for i in range(7):
        a=i*math.pi*2/7
        rod('root flare',(math.cos(a)*.30,math.sin(a)*.30,.045),(math.cos(a)*.045,math.sin(a)*.045,.47),.040,'bark',6)
    centres=[]
    for i in range(11):
        a=i*2.4;rr=.48+(i%3)*.14;h=1.58+(i%4)*.20
        end=(math.cos(a)*rr,math.sin(a)*rr,h)
        rod('branch fork',(.03,0,.65+(i%3)*.18),end,.038 if i%2 else .052,'bark',6)
        centres.append((end[0],end[1],end[2]+.16,.36+(i%3)*.08))
    centres.append((0,0,2.20,.55))
    # Quantized leaf masses with open pockets; avoids a single spherical canopy.
    occupied={};step=.075
    for cx,cy,cz,r in centres:
        for ix in range(math.floor((cx-r)/step),math.ceil((cx+r)/step)+1):
            for iy in range(math.floor((cy-r)/step),math.ceil((cy+r)/step)+1):
                for iz in range(math.floor((cz-r*.52)/step),math.ceil((cz+r*.68)/step)+1):
                    x,y,z=ix*step,iy*step,iz*step
                    dist=((x-cx)/r)**2+((y-cy)/r)**2+((z-cz)/(r*.68))**2
                    if dist<.96+rng.random()*.13 and rng.random()>.12:
                        occupied[(ix,iy,iz)]=True
    # Eliminate entirely hidden cubes. Shared material meshes keep exports compact.
    greens=['leaf_dark','leaf','leaf_mid','leaf_light','leaf_tip']
    buckets={m:([],[]) for m in greens}
    faces=[((-1,0,0),(0,4,7,3)),((1,0,0),(1,2,6,5)),((0,-1,0),(0,1,5,4)),((0,1,0),(3,7,6,2)),((0,0,-1),(0,3,2,1)),((0,0,1),(4,5,6,7))]
    verts=[(-.5,-.5,-.5),(.5,-.5,-.5),(.5,.5,-.5),(-.5,.5,-.5),(-.5,-.5,.5),(.5,-.5,.5),(.5,.5,.5),(-.5,.5,.5)]
    for (ix,iy,iz) in occupied:
        idx=max(0,min(4,int((iz*step-1.3)*2.3+rng.uniform(-1.5,1.5))))
        vs,fs=buckets[greens[idx]]
        for (dx,dy,dz),face in faces:
            if (ix+dx,iy+dy,iz+dz) in occupied:continue
            start=len(vs)
            vs.extend([((ix+verts[v][0])*step,(iy+verts[v][1])*step,(iz+verts[v][2])*step) for v in face])
            fs.append(tuple(range(start,start+4)))
    for ma,(vs,fs) in buckets.items():
        mesh=bpy.data.meshes.new('voxel foliage '+ma);mesh.from_pydata(vs,[],fs);mesh.materials.append(M[ma]);link(bpy.data.objects.new('leaf canopy '+ma,mesh))

def planter():
    for x in [-.78,.78]:box('stone planter side',(x,0,.31),(.14,1.68,.62),'stone',.02)
    for y in [-.78,.78]:box('stone planter end',(0,y,.31),(1.43,.14,.62),'stone',.02)
    box('recessed soil',(0,0,.51),(1.42,1.42,.045),'soil')
    rng=random.Random(82)
    for i in range(135):
        x=rng.uniform(-.66,.66);y=rng.uniform(-.66,.66)
        if abs(x)<.20 and abs(y)<.20:continue
        box('low planter foliage',(x,y,.56+rng.uniform(0,.055)),(.065,.085,.042),['leaf_dark','leaf','leaf_mid','leaf_light'][i%4],rot=rng.uniform(0,3))
    for x in [-.78,.78]:box('coping stone side',(x,0,.646),(.20,1.74,.095),'paper',.016)
    for y in [-.78,.78]:box('coping stone end',(0,y,.646),(1.4,.20,.095),'paper',.016)
    for x in [-.81,.81]:
        for y in [-.5,0,.5]:box('stone tile vertical joint',(x,y,.33),(.147,.006,.58),'metal_light')

def glass_panel(width=1.7,height=2.0):
    for x in [-width/2,width/2]:
        box('aluminium mullion',(x,0,height/2),(.065,.095,height),'metal',.008)
        for z in [.09,height-.09]:box('mullion end cap',(x,-.004,z),(.083,.11,.07),'metal_light',.007)
    for z in [.07,height-.04]:box('frame rail',(0,0,z),(width,.065,.056),'metal_light',.006)
    box('glass pane',(0,.0,height/2+.01),(width-.072,.012,height-.17),'glass',.001)
    for x in [-width/2+.065,width/2-.065]:
        for z in [.24,height-.25]:box('glass clamp',(x,-.024,z),(.055,.042,.035),'steel',.004)

begin('desk_oak','Рабочий стол','Мебель',[232,253,128,106],'Две тумбы, три выдвижных фасада, столешница с кромкой, кабельный ввод.');desk();finish()
begin('chair_task','Рабочее кресло','Мебель',[270,294,64,86],'Синяя обивка, поясничная подушка, пятилучевая база и парные ролики.');chair();finish()
begin('chair_meeting','Кресло переговорной','Мебель',[532,187,40,72],'Зелёная обивка, отдельные подлокотники и колесная база.');chair('sage',True);finish()
begin('monitor','Монитор','Техника',[265,249,66,66],'Объёмный корпус со стойкой; графика экрана — переносимые цветные элементы.');monitor();finish()
begin('keyboard_mouse','Клавиатура и мышь','Техника',[272,305,48,15],'Отдельные клавиши, пробел и колесо мыши.');keyboard();finish()
begin('coffee_mug','Кружка кофе','Детали',[340,297,13,20],'Полая по виду кромка, поверхность кофе и открытая ручка.');mug();finish()
begin('plant_desk','Настольное растение','Растения',[645,197,59,43],'Гранёное кашпо с ветвистыми пиксельными листьями.');plant(size=.36,seed=2);finish()
begin('plant_floor','Напольное растение','Растения',[470,360,67,99],'Высокое растение в восьмигранном кашпо.');plant(size=1,seed=17,tall=True);finish()
begin('bookshelf','Книжный стеллаж','Мебель',[895,162,49,102],'Четыре полки с отдельными корешками и переплётами.');shelf();finish()
begin('cabinet_drawers','Тумба','Мебель',[199,289,34,56],'Три фасада и металлические ручки.');drawer((0,0,0),.46,.53,.70);finish()
begin('sofa_three','Диван на три места','Мебель',[138,587,132,79],'Мягкие раздельные сиденья, спинки, швы и скрытая деревянная опора.');sofa();finish()
begin('sofa_module','Модуль дивана','Мебель',[544,530,186,53],'Один модуль для сборки лавки вокруг центрального дерева.');sofa(.78,1);finish()
begin('table_round','Круглый стол','Мебель',[1000,366,100,73],'Деревянная столешница, металлическая стойка и четыре лапы.');table();finish()
begin('table_coffee','Журнальный стол','Мебель',[184,632,83,73],'Низкая версия круглого стола для лаунжа.');table(.48,.43);finish()
begin('table_meeting','Стол переговорной','Мебель',[574,196,179,86],'Большая столешница из двух секций и тёмные ножки.');
box('meeting desktop',(0,0,.76),(2.5,1.1,.085),'oak_top',.02)
box('central top seam',(0,0,.804),(.004,1.06,.002),'oak_dark')
for x in [-.91,.91]:
    for y in [-.36,.36]:box('meeting table leg',(x,y,.36),(.08,.08,.72),'metal',.009)
for x in [-.9,.9]:box('underframe crossbeam',(x,0,.69),(.06,.87,.09),'metal')
finish()
begin('whiteboard','Доска планирования','Мебель',[958,162,99,86],'Карточки, алюминиевая рамка, маркеры и стойка на роликах.');whiteboard();finish()
begin('tree_atrium','Дерево атриума','Растения',[549,301,212,201],'Ветвистый ствол и объёмная ступенчатая крона; материал без запечённых теней.');tree();finish()
begin('planter_square','Каменная клумба','Архитектура',[568,462,153,74],'Каменные борта, швы и широкая верхняя кромка.');planter();finish()
begin('glass_partition','Стеклянная перегородка','Архитектура',[449,251,225,87],'Панель, зажимы и алюминиевые стойки для модульной сборки.');glass_panel();finish()
begin('glass_door','Стеклянная дверь','Архитектура',[603,657,99,97],'Дверное полотно с петлями и ручкой, отдельные редактируемые части.');glass_panel(.90,2.03)
rod('door pull',(.28,-.075,.82),(.28,-.075,1.12),.013,'steel')
for z in [.84,1.10]:rod('handle fixing',(.28,-.010,z),(.28,-.075,z),.011,'steel')
for z in [.34,1.70]:cyl('door hinge',(-.408,0,z),.021,.12,'steel',12)
finish()
begin('wall_module','Модуль стены','Архитектура',[162,443,227,74],'Низкая офисная стена с цоколем и металлической кромкой.');
box('wall core',(0,0,.72),(1.8,.13,1.44),'wall',.008)
box('wall top rail',(0,0,1.46),(1.83,.17,.075),'metal_light',.009)
box('wall base',(0,-.012,.08),(1.80,.17,.16),'metal',.006)
finish()
begin('floor_tile','Плитка ковролина','Архитектура',[448,466,67,118],'Плитка 1 × 1 метр с тонким швом и сдержанной зернистостью.');
box('carpet tile',(0,0,.015),(1,1,.03),'floor',.001)
rng=random.Random(12)
for i in range(65):box('carpet weave',(rng.uniform(-.48,.48),rng.uniform(-.48,.48),.0303),(rng.uniform(.006,.022),.004,.001),'floor_light')
finish()
begin('filing_cabinet','Металлический шкаф','Мебель',[1108,646,48,76],'Серый шкаф с тремя выдвижными ящиками и карточками.');
box('filing body',(0,0,.46),(.46,.52,.92),'metal_light',.015)
for j in range(3):
    z=.18+j*.29
    box('metal drawer',(0,-.27,z),(.412,.035,.26),'steel',.008)
    box('label holder',(-.09,-.292,z+.045),(.11,.012,.047),'metal',.003)
    box('label insert',(-.09,-.300,z+.045),(.082,.002,.028),'paper')
    box('drawer grip',(.05,-.31,z+.005),(.11,.024,.02),'metal',.003)
finish()

# Chunky stylised employee, with independently pivoted head and limbs.
begin('employee_base','Базовый сотрудник','Персонаж',[548,552,54,78],'Стилизованный персонаж с раздельными частями тела. Базовая поза, без готового рига и анимаций.');
character_root=root
for s in [-1,1]:
    limb=group('leg_L' if s<0 else 'leg_R',(s*.087,0,.39));root=limb
    box('trouser leg',(0,0,-.155),(.13,.15,.31),'pants',.009)
    box('shoe',(0,-.035,-.346),(.155,.235,.088),'shoe',.014)
    box('shoe sole',(0,-.035,-.383),(.158,.237,.018),'black',.005)
    root=character_root
box('torso',(0,0,.555),(.37,.21,.36),'shirt',.018)
box('shirt front',(0,-.110,.56),(.305,.025,.28),'shirt_light',.008)
box('shirt placket',(0,-.129,.565),(.026,.01,.27),'shirt')
for z in [.48,.54,.60,.66]:box('shirt button',(0,-.137,z),(.014,.01,.014),'paper',.002)
for s in [-1,1]:
    limb=group('arm_L' if s<0 else 'arm_R',(s*.22,0,.66));root=limb
    box('shirt sleeve',(0,0,-.077),(.14,.19,.17),'shirt',.015)
    box('forearm',(0,-.012,-.217),(.105,.13,.14),'skin',.01)
    box('hand',(0,-.024,-.308),(.12,.14,.10),'skin_light',.009)
    box('thumb',(-s*.064,-.04,-.291),(.039,.068,.061),'skin',.006)
    root=character_root
neck=cyl('neck',(0,0,.755),.067,.12,'skin',8)
head=group('head',(0,0,.88));root=head
box('face',(0,-.025,.06),(.36,.30,.34),'skin_light',.033)
box('jaw',(0,-.046,-.077),(.29,.25,.095),'skin',.015)
for s in [-1,1]:
    box('ear',(s*.194,-.01,.037),(.051,.083,.108),'skin',.009)
    box('eye white',(s*.075,-.181,.084),(.060,.014,.051),'paper',.001)
    box('pupil',(s*.074,-.192,.081),(.024,.009,.034),'eye')
    box('eyebrow',(s*.077,-.187,.130),(.076,.016,.021),'hair')
box('nose',(0,-.194,.013),(.052,.050,.053),'skin',.005)
box('mouth',(0,-.186,-.051),(.064,.008,.012),'skin_shadow')
rng=random.Random(71)
for ix in range(-4,5):
    for iy in range(-3,4):
        if (ix/4.8)**2+(iy/4.1)**2>1.3:continue
        z=.229+rng.choice([0,0,.024,.048])
        box('hair voxel',(ix*.044,iy*.045+.022,z),(.049,.051,.080),rng.choice(['hair','hair','hair_light','hair_dark']))
for ix in range(-4,5):
    box('fringe voxel',(ix*.044,-.142,.171+((ix+4)%3)*.016),(.047,.06,.10),['hair','hair_light','hair'][ix%3])
for s in [-1,1]:
    for i in range(3):box('sideburn voxel',(s*.177,.045-i*.048,.101),(.06,.053,.14-i*.02),'hair')
root=character_root
finish()

# The latest four-floor reference supersedes applicable v1 objects, retaining IDs.
exec(compile((SRC/'four_floor_models.py').read_text(encoding='utf-8'),str(SRC/'four_floor_models.py'),'exec'),globals())
exec(compile((SRC/'four_floor_details.py').read_text(encoding='utf-8'),str(SRC/'four_floor_details.py'),'exec'),globals())

# Export each object with a ground-level origin before laying out the editable library.
manifest=[]
for asset in assets:
    col=asset['collection'];r=asset['root']
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects:o.select_set(True)
    bpy.context.view_layer.objects.active=r
    bpy.context.view_layer.update()
    coords=[];deps=bpy.context.evaluated_depsgraph_get()
    for o in col.objects:
        if o.type=='MESH':
            evaluated=o.evaluated_get(deps);mesh=evaluated.to_mesh()
            coords.extend(o.matrix_world@v.co for v in mesh.vertices);evaluated.to_mesh_clear()
    low=[min(v[i] for v in coords) for i in range(3)];high=[max(v[i] for v in coords) for i in range(3)]
    # All assets are grounded; correct tiny bevel/character-origin offsets once.
    for o in col.objects:
        if o.parent==r:o.location.z-=low[2]
    bpy.context.view_layer.update()
    # Export-only batching: keep the editable source intact and retain character pivots.
    deps=bpy.context.evaluated_depsgraph_get()
    export_col=bpy.data.collections.new('EXPORT_TEMP');scene.collection.children.link(export_col)
    anchors={}
    for o in col.objects:
        if o.type=='EMPTY':
            copy=o.copy();export_col.objects.link(copy);anchors[o.name]=copy
    for o in col.objects:
        if o.type=='EMPTY' and o.parent:anchors[o.name].parent=anchors[o.parent.name]
    batches={}
    for o in col.objects:
        if o.type!='MESH':continue
        evaluated=o.evaluated_get(deps);mesh=evaluated.to_mesh();anchor=o.parent or r
        transform=anchor.matrix_world.inverted()@o.matrix_world
        used=set(poly.material_index for poly in mesh.polygons)
        for mi in used:
            material=mesh.materials[mi]
            key=(anchor.name,material.name)
            bucket=batches.setdefault(key,{'v':[],'f':[],'material':material,'parts':[]})
            offset=len(bucket['v']);bucket['v'].extend([tuple(transform@v.co) for v in mesh.vertices])
            bucket['f'].extend([tuple(offset+i for i in p.vertices) for p in mesh.polygons if p.material_index==mi]);bucket['parts'].append(o.name)
        evaluated.to_mesh_clear()
    bpy.ops.object.select_all(action='DESELECT')
    for (anchor_name,material_name),bucket in batches.items():
        mesh=bpy.data.meshes.new(asset['id']+'__'+material_name);mesh.from_pydata(bucket['v'],[],bucket['f']);mesh.materials.append(bucket['material'])
        obj=bpy.data.objects.new(mesh.name,mesh);export_col.objects.link(obj);obj.parent=anchors[anchor_name];obj['source_parts']='; '.join(bucket['parts'])
    for o in export_col.objects:o.select_set(True)
    bpy.context.view_layer.objects.active=anchors[r.name]
    bpy.ops.export_scene.gltf(filepath=str(OUT/(asset['id']+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False,export_yup=True)
    drawcalls=len(batches)
    for o in list(export_col.objects):
        mesh=o.data if o.type=='MESH' else None;bpy.data.objects.remove(o,do_unlink=True)
        if mesh:bpy.data.meshes.remove(mesh)
    bpy.data.collections.remove(export_col)
    tri=0
    for o in col.objects:
        if o.type!='MESH':continue
        mesh=o.evaluated_get(deps).to_mesh();mesh.calc_loop_triangles();tri+=len(mesh.loop_triangles);o.evaluated_get(deps).to_mesh_clear()
    manifest.append({k:v for k,v in asset.items() if k not in ['root','collection']}|{'file':asset['id']+'.glb','dimensions':[round(high[i]-low[i],3) for i in range(3)],'triangles':tri,'parts':sum(o.type=='MESH' for o in col.objects),'renderMeshes':drawcalls,'size':(OUT/(asset['id']+'.glb')).stat().st_size,'front':'+Z in glTF','origin':'ground centre','units':'metres'})
(OUT/'manifest.json').write_text(json.dumps({'version':2,'reference':'/assets/four-floor-plan.png','kind':'single-view reconstruction, not original recovered models','axes':'GLB: Y up; Blender: Z up','dimensionsOrder':['width','depth','height'],'assets':manifest},ensure_ascii=False,indent=2),encoding='utf-8')

# Editable library with separate named collections and studio preview lighting.
current=bpy.data.collections.new('STUDIO_preview_only');scene.collection.children.link(current);root=None
columns=9;rows=math.ceil(len(assets)/columns)
for i,a in enumerate(assets):
    a['root'].location=((i%columns-(columns-1)/2)*4.5,(i//columns-(rows-1)/2)*4.5,0)
floor=box('preview ground',(0,0,-.055),(60,60,.10),'stone',.025)
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def light(name,kind,p,energy,hex,size=0):
    d=bpy.data.lights.new(name,kind);d.energy=energy;d.color=color(hex)[:3]
    if kind=='AREA':d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);current.objects.link(o);o.location=p;aim(o,(0,0,0));return o
light('Daylight key','AREA',(-6,-8,13),2600,'FFE8BF',8)
light('Cool skylight fill','AREA',(8,-1,10),1600,'D9E9FF',9)
sun=light('Afternoon sun','SUN',(-5,-6,8),2.0,'FFEDC6');sun.data.angle=.12
d=bpy.data.cameras.new('Asset library overview');camera=bpy.data.objects.new('Asset library overview',d);current.objects.link(camera);camera.location=(13,-25,38);aim(camera,(0,0,.25));d.type='ORTHO';d.ortho_scale=52;scene.camera=camera
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'office-assets.blend'))
if '--skip-sheets' not in sys.argv:
    import runpy
    runpy.run_path(str(SRC/'render_library.py'),run_name='__main__')
print('ASSET_LIBRARY_COMPLETE '+json.dumps({'assets':len(manifest),'triangles':sum(a['triangles'] for a in manifest),'bytes':sum(a['size'] for a in manifest)}))
