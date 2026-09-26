"""Specialist equipment, plants and articulated, unskinned character poses."""
start('reception_counter','Стойка ресепшена','Мебель','Два уровня: рабочая поверхность 0,78 м, стойка для посетителя 1,02 м. Ширина 2,1 м.','reception',(1,))
box('reception core',(0,.07,.46),(2.04,.55,.92),'oak',.014)
rounded('visitor countertop',(0,-.135,.99),(2.14,.35,.06),'oak_light',.015)
rounded('staff worktop',(0,.31,.75),(1.98,.43,.06),'oak_top',.012)
box('reception plinth',(0,.05,.055),(1.97,.53,.11),'oak_dark',.006)
box('reception panel',(0,-.218,.51),(1.91,.025,.73),'oak_top',.008)
for x in [-.68,0,.68]:box('panel joint',(x,-.233,.51),(.006,.004,.69),'oak_dark')
box('counter toe rail',(0,-.256,.19),(1.90,.045,.05),'metal_light',.006)
finish()

start('presentation_screen','Презентационный экран','Техника','Большой дисплей 1,85 × 1,10 м, две опоры и переносимая графика слайда.','meeting',(1,4))
for x in [-.66,.66]:
    box('display foot',(x,0,.045),(.11,.58,.09),'metal',.018)
    box('screen upright',(x,.04,.90),(.045,.05,1.72),'metal_light',.006)
rounded('display frame',(0,0,1.38),(1.85,.10,1.10),'metal',.025)
box('presentation image',(0,-.054,1.40),(1.72,.005,.97),'screen_white',.004)
box('slide title',(0,-.061,1.78),(1.42,.003,.045),'code_blue')
cyl('slide round graphic',(-.51,-.063,1.47),.14,.004,'sticky_yellow',24,rot=(math.pi/2,0,0))
for i in range(3):
    box('chart column',(-.15+i*.25,-.063,1.20+i*.065),(.16,.004,.18+i*.13),['sticky_blue','sticky_green','code_blue'][i])
for i in range(3):box('caption stroke',(-.50,-.063,1.19-i*.064),(.26,.003,.018),'metal_light')
finish()

start('coffee_counter','Кофейная стойка','Сервис','Кухонный модуль 1,8 м: фасады, столешница и фартук. Приборы ставятся отдельно. Верх y=0,92 м.','service')
box('pantry body',(0,0,.455),(1.80,.58,.85),'oak_dark',.010)
for x in [-.60,0,.60]:
    rounded('pantry door',(x,-.307,.48),(.575,.035,.75),'oak',.008)
    box('pantry door field',(x,-.328,.48),(.49,.008,.66),'oak_top',.004)
    rod('pantry handle',(x-.09,-.36,.78),(x+.09,-.36,.78),.009,'steel')
box('pantry plinth',(0,-.22,.06),(1.73,.06,.12),'metal',.004)
rounded('pantry worktop',(0,0,.895),(1.86,.65,.05),'stone',.012)
box('pantry backsplash',(0,.312,1.10),(1.84,.035,.36),'oak_light',.004)
finish()

def basin(p=(0,0,0),w=.47,d=.36):
    x,y,z=p
    rounded('basin exterior',(x,y,z+.045),(w,d,.09),'ceramic',.037)
    rounded('basin hollow shade',(x,y-.016,z+.092),(w-.075,d-.075,.009),'stone',.027)
    rounded('basin inside',(x,y-.010,z+.097),(w-.13,d-.13,.006),'white',.025)
    cyl('sink drain',(x,y-.01,z+.102),.025,.005,'steel',16)
    rod('faucet stem',(x,y+d/2-.025,z+.08),(x,y+d/2-.025,z+.28),.016,'steel')
    rod('faucet spout',(x,y+d/2-.025,z+.28),(x,y+.005,z+.28),.016,'steel')
    rod('faucet nozzle',(x,y+.005,z+.28),(x,y+.005,z+.25),.016,'steel')
    rod('faucet lever',(x+.055,y+d/2-.025,z+.15),(x+.055,y+d/2-.025,z+.23),.009,'steel')

start('sink_cabinet','Тумба с мойкой','Сервис','Компактная мойка для кофе-зоны или служебной комнаты, ширина 0,64 м.','service')
box('sink cabinet',(0,0,.415),(.60,.52,.79),'oak',.012)
rounded('sink cabinet door',(0,-.273,.42),(.55,.035,.70),'oak_top',.01)
rod('sink door handle',(-.08,-.31,.69),(.08,-.31,.69),.009,'steel')
box('sink top',(0,0,.83),(.64,.57,.04),'stone',.008)
basin((0,-.025,.85));finish()

start('coffee_machine','Кофемашина','Техника','Корпус, дисплей, два носика, решётка и верхний бункер.','service')
rounded('coffee machine body',(0,0,.205),(.29,.33,.41),'metal',.025)
rounded('coffee machine face',(0,-.173,.245),(.26,.024,.27),'steel',.012)
box('coffee screen',(0,-.19,.322),(.14,.008,.079),'screen',.004)
for x in [-.046,0,.046]:cyl('coffee control',(x,-.197,.25),.015,.01,'black',12,rot=(math.pi/2,0,0))
box('cup recess',(0,-.19,.116),(.20,.025,.12),'black',.005)
for x in [-.035,.035]:cyl('coffee nozzle',(x,-.204,.19),.012,.043,'steel')
box('drip tray',(0,-.105,.025),(.25,.32,.045),'metal_light',.009)
for x in [-.08,-.04,0,.04,.08]:box('drip groove',(x,-.18,.049),(.011,.13,.003),'black')
rounded('bean hopper',(0,.02,.44),(.22,.22,.09),'oak_dark',.012)
box('hopper lid',(0,.02,.49),(.23,.23,.025),'black',.008)
finish()

start('fridge_small','Мини-холодильник','Техника','Подстольный холодильник, отдельная створка с петлёй.','service',assumption='Небольшие приборы кофе-зоны интерпретированы по силуэту.')
rounded('fridge cabinet',(0,0,.41),(.53,.53,.82),'metal_light',.025)
saved=root;root=pivot('fridge_hinge',(-.265,-.284,.02))
rounded('fridge door',(.265,0,.40),(.53,.06,.80),'white',.024)
rod('fridge handle',(.45,-.052,.49),(.45,-.052,.70),.012,'metal');root=saved;finish()
start('kettle','Чайник','Техника','Гранёный чайник с ручкой, носиком и подставкой.','service')
cyl('kettle base',(0,0,.012),.10,.024,'black',16)
cyl('kettle body',(0,0,.117),.094,.19,'ceramic',16,.075)
cyl('kettle lid',(0,0,.221),.077,.018,'metal',16)
rod('kettle spout',(-.07,0,.13),(-.14,0,.20),.023,'ceramic')
for z in [.07,.18]:rod('kettle handle bridge',(.08,0,z),(.14,0,z),.015,'metal')
rod('kettle handle',(.14,0,.07),(.14,0,.18),.018,'metal');finish()

# Sanitary objects are interpretations of the tiny room, not measured fixtures.
start('toilet','Унитаз','Сервис','Напольная сантехника с бачком и открытым кольцом сиденья.','service',assumption='Подробности сантехники и точное количество неразличимы на плане.')
rounded('toilet pedestal',(0,.025,.17),(.25,.36,.34),'ceramic',.075)
rounded('toilet bowl body',(0,-.09,.33),(.38,.54,.19),'ceramic',.085)
rounded('bowl interior shade',(0,-.15,.427),(.27,.36,.009),'stone',.075)
rounded('bowl interior water',(0,-.15,.432),(.15,.23,.006),'water',.058)
# Actual elliptical ring, not a solid white lid.
v=[];faces=[];n=24
for z,rx,ry in [(.43,.205,.28),(.46,.205,.28),(.46,.143,.20),(.43,.143,.20)]:
    v.extend([(math.cos(i*2*math.pi/n)*rx,-.08+math.sin(i*2*math.pi/n)*ry,z) for i in range(n)])
for layer in range(4):
    for i in range(n):faces.append((layer*n+i,layer*n+(i+1)%n,((layer+1)%4)*n+(i+1)%n,((layer+1)%4)*n+i))
mesh=bpy.data.meshes.new('open toilet seat');mesh.from_pydata(v,[],faces);mesh.materials.append(M['white']);link(bpy.data.objects.new('open seat ring',mesh))
rounded('toilet tank',(0,.22,.56),(.36,.17,.42),'ceramic',.03)
rounded('tank lid',(0,.22,.78),(.38,.19,.04),'white',.016)
cyl('flush button',(0,.22,.805),.027,.007,'steel',16);finish()
start('washbasin','Раковина','Сервис','Раковина с опорой и смесителем, отдельная от зеркала.','service')
rounded('basin pedestal',(0,.07,.38),(.18,.22,.76),'ceramic',.045)
basin((0,0,.76),.53,.43);finish()
start('bathroom_mirror','Зеркало','Сервис','Рамка и отражающая металлическая поверхность. Высота монтажа задаётся при сборке.','service')
rounded('mirror frame',(0,0,.36),(.53,.045,.72),'metal_light',.012)
mirror=mat('mirror_surface','DDE6E1',.06,1)
box('mirror surface',(0,-.026,.36),(.48,.007,.67),'mirror_surface',.008);finish()
start('stall_partition','Перегородка санузла','Сервис','Боковая панель с нижним просветом и ножками.','service')
for x in [-.48,.48]:
    cyl('partition shoe',(x,0,.012),.047,.024,'steel')
    rod('partition support',(x,0,.01),(x,0,.25),.020,'metal_light')
box('stall panel',(0,0,1.055),(1.20,.035,1.75),'paper',.007)
for x in [-.60,.60]:box('partition edging',(x,0,1.055),(.025,.045,1.76),'metal_light',.003)
finish()
start('waste_bin','Корзина для мусора','Детали','Небольшая корзина с открытым верхом.','service')
cyl('bin body',(0,0,.16),.12,.32,'metal_light',16,.15)
cyl('bin rim',(0,0,.32),.154,.025,'metal',16)
cyl('bin hollow',(0,0,.333),.133,.004,'black',16);finish()
start('coat_rack','Гардеробная стойка','Мебель','Рейл с отдельными вешалками. Предположение для нижнего правого помещения первого этажа.','service',(1,),assumption='Назначение этого блока предположительно; рейл включён как опциональная модель.')
for x in [-.67,.67]:
    box('rack foot',(x,0,.04),(.08,.54,.08),'metal',.013)
    rod('rack upright',(x,0,.04),(x,0,1.65),.025,'metal')
rod('coat rail',(-.70,0,1.65),(.70,0,1.65),.026,'steel')
for i in range(7):
    x=-.48+i*.16
    rod('hanger hook',(x,0,1.65),(x,0,1.51),.008,'metal_light')
    for s in [-1,1]:rod('hanger shoulder',(x,0,1.51),(x,s*.18,1.34),.010,'oak_light')
    rod('hanger trouser bar',(x,-.18,1.34),(x,.18,1.34),.009,'oak_light')
finish()

start('server_rack','Серверная стойка','Техника','Шкаф 19-дюймового оборудования: патч-панели, серверы, вентиляция и световые индикаторы.','tech',(3,))
rounded('server chassis',(0,0,.99),(.62,.78,1.98),'black',.018)
for x in [-.29,.29]:box('rack front stile',(x,-.408,1.0),(.035,.055,1.94),'metal_light',.005)
for j in range(11):
    z=.17+j*.156
    box('rack unit',(0,-.40,z),(.53,.052,.133),'metal',.008)
    for k in range(9):box('server vent',(-.18+k*.036,-.431,z),(.014,.009,.065),'black',.002)
    for x in [.20,.235]:box('status LED',(x,-.438,z+.032),(.013,.006,.013),'status_green')
    for x in [-.25,.25]:rod('rack grip',(x,-.448,z-.03),(x,-.448,z+.03),.007,'steel')
for x in [-.23,.23]:
    for y in [-.28,.28]:cyl('rack adjustable foot',(x,y,.026),.034,.052,'metal_light')
box('server top vent',(0,0,1.989),(.48,.51,.008),'metal',.006)
finish()
start('computer_tower','Системный блок','Техника','Фронтальные вентиляционные полосы, кнопка и разъёмы.','tech',(2,3,4))
rounded('PC case',(0,0,.22),(.20,.39,.44),'metal',.014)
box('tower face',(0,-.204,.22),(.178,.018,.40),'navy_dark',.007)
for i in range(12):box('PC ventilation',(0,-.217,.09+i*.019),(.135,.006,.006),'black')
cyl('PC power',(0,-.22,.39),.012,.006,'code_blue',12,rot=(math.pi/2,0,0))
for x in [-.048,.048]:box('USB port',(x,-.222,.352),(.025,.005,.009),'steel')
finish()
start('laptop','Ноутбук','Техника','Открытый ноутбук со слегка наклонённым экраном и отдельным шарниром.','work')
rounded('laptop base',(0,0,.015),(.32,.23,.03),'metal_light',.007)
rounded('trackpad',(0,-.065,.032),(.105,.060,.003),'steel',.005)
for row in range(4):
    for col in range(11):box('laptop key',(-.13+col*.026,.005+row*.024,.034),(.021,.019,.004),'black',.001)
saved=root;root=pivot('screen_hinge',(0,.105,.03),'X');root.rotation_euler.x=-.18
rounded('laptop screen shell',(0,0,.105),(.32,.015,.21),'metal',.007)
box('laptop screen',(0,-.009,.109),(.29,.003,.176),'screen',.002)
for i in range(6):box('laptop code',(-.04,-.011,.166-i*.020),(.13+(i%3)*.024,.001,.006),['code_blue','code_teal'][i%2])
root=saved;finish()
start('desk_phone','Настольный телефон','Техника','Кнопки, дисплей и трубка, отдельная модель для ресепшена.','reception',(1,2))
rounded('phone console',(0,0,.027),(.16,.19,.054),'metal',.011)
box('phone display',(.02,.045,.057),(.08,.054,.004),'screen',.002)
for i in range(3):
    for j in range(3):box('phone button',(-.015+i*.028,-.06+j*.025,.058),(.020,.016,.006),'metal_light',.002)
rounded('phone handset',(-.073,0,.078),(.045,.19,.039),'navy_dark',.016);finish()
start('tablet_device','Планшет для тестирования','Техника','Планшет с экраном и подставкой; дополняет оборудование тестирования.','tech',(3,),assumption='Малые устройства на столах не идентифицируются точно; предложен планшет.')
rounded('tablet shell',(0,0,.012),(.18,.25,.024),'metal',.009)
box('tablet display',(0,-.003,.026),(.154,.214,.004),'code_blue',.002)
for j in range(3):box('tablet app card',(0,.065-j*.063,.029),(.115,.045,.001),'screen_white',.002)
finish()
start('printer','Принтер','Техника','Компактный принтер, входной лоток, выход бумаги и панель управления.','work')
rounded('printer body',(0,0,.14),(.41,.34,.28),'metal_light',.026)
rounded('scanner lid',(0,.012,.287),(.39,.30,.035),'paper',.01)
box('output recess',(0,-.178,.13),(.30,.02,.07),'black',.009)
box('paper tray',(0,-.238,.11),(.32,.17,.025),'metal',.006)
box('printed paper',(0,-.23,.126),(.21,.14,.002),'white')
box('printer display',(.115,-.13,.308),(.08,.045,.005),'screen',.003)
finish()
start('document_stack','Документы и папка','Детали','Небольшая стопка документов с цветной папкой и карандашом.','work')
for i in range(5):box('paper sheet',(i*.001,0,.002+i*.002),(.21,.297,.0016),'paper')
box('folder cover',(.014,.008,.014),(.235,.307,.008),'book_teal',.001)
box('folder label',(.014,-.04,.019),(.15,.065,.002),'white')
rod('pencil',(-.07,-.11,.028),(.10,.08,.028),.004,'sticky_yellow',6);finish()
start('binder_set','Набор папок','Детали','Три вертикальные папки для шкафов и рабочих мест.','work')
for i in range(3):
    x=(i-1)*.065
    box('ring binder',(x,0,.16),(.060,.25,.32),['book_blue','book_cream','book_teal'][i],.004)
    box('spine label',(x,-.129,.205),(.039,.004,.08),'paper')
    cyl('binder finger hole',(x,-.134,.065),.011,.005,'metal',12,rot=(math.pi/2,0,0))
finish()
start('notice_frame','Информационная рамка','Детали','Сменная табличка с условными строками; надпись можно заменить в интерфейсе.','work')
rounded('notice frame',(0,0,.19),(.29,.035,.38),'oak_light',.008)
box('notice paper',(0,-.021,.19),(.25,.004,.34),'white')
box('notice header',(0,-.025,.30),(.19,.003,.035),'code_blue')
for i in range(5):box('notice line',(0,-.025,.23-i*.029),(.17,.003,.008),'metal_light')
finish()

def lush_plant(kind='bush',scale=1,seed=2):
    rng=random.Random(seed)
    r=.17*scale;ph=.32*scale
    cyl('ceramic pot',(0,0,ph/2),r*.75,ph,'terracotta',12,r)
    cyl('pot rim',(0,0,ph-.009*scale),r*1.05,.035*scale,'pot_rim',12)
    cyl('earth',(0,0,ph+.004*scale),r*.88,.008*scale,'soil',12)
    height={'bush':.95,'slender':1.52,'broadleaf':1.19}[kind]*scale
    rod('main stem',(0,0,ph),(0,0,height*.91),.012*scale,'bark')
    count=18 if kind=='bush' else 15
    for i in range(count):
        a=i*2.399;h=ph+(height-ph)*(.12+i/count*.80)
        rad=(.18 if kind=='slender' else .24)*scale*(.65+math.sin(i/count*math.pi)*.5)
        tip=Vector((math.cos(a)*rad,math.sin(a)*rad,h+.065*scale))
        rod('leaf branch',(0,0,h-.09*scale),tip,.006*scale,'bark',6)
        for j in range(5 if kind!='broadleaf' else 3):
            aa=a+(j-2)*.40
            length=(.15 if kind!='broadleaf' else .25)*scale
            p=tip+Vector((math.cos(aa)*length*.3,math.sin(aa)*length*.3,rng.uniform(-.02,.055)*scale))
            o=rounded('faceted leaf',tuple(p),(.062*scale if kind!='broadleaf' else .13*scale,length,.027*scale),['leaf','leaf_mid','leaf_light','leaf_tip'][(i+j)%4],.013*scale)
            o.rotation_euler=(.30 if j%2 else -.25,.12,aa-math.pi/2)

for key,title,kind,scale,seed in [('plant_desk','Растение · настольное','bush',.35,3),('plant_floor','Растение · куст','bush',1,6),('plant_slender','Растение · высокое','slender',1,10),('plant_broadleaf','Растение · широкие листья','broadleaf',1,16),('plant_small_round','Растение · маленькое кашпо','bush',.23,8)]:
    start(key,title,'Растения','Плотная крона из небольших гранёных листьев, ветки, грунт и ободок кашпо.','plants');lush_plant(kind,scale,seed);finish()

def person(seated=False,hair='hair',shirt='shirt',longhair=False):
    global root
    saved=root
    # Seat contact = 0.52 m; shoes remain grounded. Stylised height ~1.25 m standing.
    hip=.60 if seated else .44;shoulder=hip+.28
    for s in [-1,1]:
        root=pivot('leg_L' if s<0 else 'leg_R',(s*.084,0,hip),'X')
        if seated:
            rounded('thigh',(0,-.13,-.035),(.13,.30,.13),'pants',.045)
            rounded('lower leg',(0,-.26,-.29),(.115,.135,.43),'pants',.040)
            rounded('shoe',(0,-.30,-hip+.05),(.15,.24,.10),'shoe',.035)
        else:
            rounded('trouser leg',(0,0,-.18),(.13,.15,.36),'pants',.036)
            rounded('shoe',(0,-.045,-hip+.05),(.15,.23,.10),'shoe',.032)
        root=saved
    rounded('hip',(0,0,hip),(.29,.21,.14),'pants',.037)
    rounded('torso',(0,0,hip+.19),(.32,.23,.34),shirt,.055)
    rounded('shirt collar',(0,-.095,shoulder+.045),(.18,.035,.065),'white',.015)
    for z in [hip+.12,hip+.19,hip+.26]:rounded('shirt button',(0,-.12,z),(.012,.008,.012),'paper',.003)
    for s in [-1,1]:
        root=pivot('arm_L' if s<0 else 'arm_R',(s*.20,0,shoulder),'X')
        rounded('sleeve',(0,0,-.075),(.135,.18,.19),shirt,.041)
        if seated:
            rounded('forearm',(0,-.10,-.165),(.10,.27,.10),'skin_light',.032)
            rounded('hand',(0,-.24,-.165),(.11,.11,.095),'skin_light',.031)
        else:
            rounded('forearm',(0,-.012,-.235),(.10,.13,.19),'skin',.034)
            rounded('hand',(0,-.02,-.33),(.11,.13,.105),'skin_light',.031)
        root=saved
    cyl('neck',(0,0,hip+.38),.060,.115,'skin',12)
    root=pivot('head',(0,0,hip+.46),'Z')
    rounded('head',(0,-.01,.04),(.36,.32,.36),'skin_light',.10)
    for s in [-1,1]:
        rounded('ear',(s*.18,-.003,.029),(.056,.072,.09),'skin',.022)
        rounded('eye',(s*.073,-.170,.064),(.026,.012,.038),'eye',.006)
        rounded('eyebrow',(s*.072,-.168,.111),(.058,.012,.012),hair,.003)
    rounded('nose',(0,-.180,.023),(.045,.040,.048),'skin',.014)
    rounded('smile',(0,-.167,-.039),(.052,.009,.009),'skin_shadow',.003)
    rounded('hair cap',(0,.015,.192),(.385,.34,.14),hair,.075)
    rng=random.Random(17)
    for ix in range(-2,3):
        for iy in range(-1,3):
            if abs(ix)==2 and iy==2:continue
            rounded('hair lock',(ix*.064,iy*.062+.002,.248+rng.uniform(-.009,.014)),(.105,.10,.07),hair,.026)
    for i in range(5):rounded('fringe',((i-2)*.064,-.144,.15+(i%3)*.015),(.088,.075,.11),hair,.026)
    if longhair:
        rounded('back hair',(0,.12,.012),(.33,.14,.37),hair,.063)
        for s in [-1,1]:rounded('side hair',(s*.151,.012,-.03),(.073,.17,.29),hair,.031)
    else:
        for s in [-1,1]:rounded('side hair',(s*.17,.055,.12),(.071,.19,.17),hair,.028)
    root=saved

for key,title,seated,hair,shirt,longhair in [
    ('employee_base','Сотрудник · стоит',False,'hair','shirt',False),
    ('employee_blond','Сотрудник · светлые волосы',False,'blond','cream_shirt',False),
    ('employee_longhair','Сотрудник · длинные волосы',False,'copper_hair','book_teal',True),
    ('employee_seated','Сотрудник · сидит',True,'hair','shirt',False),
    ('employee_seated_blond','Сотрудник · сидит, светлые волосы',True,'blond','cream_shirt',True)]:
    start(key,title,'Персонаж','Мягкий гранёный силуэт. Отдельные узлы головы, рук и ног; без skinning и анимационных клипов.'+(' Контакт с сиденьем y≈0,52 м.' if seated else ''),'people');person(seated,hair,shirt,longhair);finish()

for a in assets:
    if 'kit' not in a:
        a.update(reference='/assets/approved-design.png',floors=[1,2,3,4],kit='compatible-base')
    if a['id'] in ['tree_atrium','planter_square','filing_cabinet']:
        a.update(kit='reserve',floors=[])
        a['description']='Резерв предыдущего дизайна. '+a['description']
