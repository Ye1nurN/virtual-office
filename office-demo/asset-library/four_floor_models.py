"""Four-floor kit, executed inside build_library.py before portable GLB export.
All numbers are design dimensions in metres, inferred from a single image.
"""
for args in [('tile_cream','E5DBC0',.86),('tile_grout','C7BEA7',.95),('ceramic','F1EDE2',.28),
             ('green_velvet','52776A',.91),('green_edge','779482',.92),('green_shadow','36584E',.94),
             ('blond','D5A34D',.9),('blond_light','E9BF70',.92),('copper_hair','9B5930',.9),
             ('cream_shirt','E4D8B9',.92),('status_green','76D9AA',.4,0,1),('water','7FB8BF',.2),
             ('wall_inset','819296',.9),('screen_white','DCECE6',.6,0,.15)]:mat(*args)

PLAN='/assets/four-floor-plan.png'
REGIONS={'shared':[22,117,616,151],'work':[833,815,308,244], 'meeting':[889,783,203,139],
         'lounge':[1150,926,135,140], 'plants':[17,227,605,317], 'service':[185,124,303,117],
         'reception':[222,278,143,85], 'tech':[35,927,122,136], 'people':[277,278,40,60]}

def start(key,title,category,description,region='work',floors=(1,2,3,4),assumption=None):
    global assets
    old=next((a for a in assets if a['id']==key),None)
    if old:
        for o in list(old['collection'].objects):bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.collections.remove(old['collection']);assets.remove(old)
    begin(key,title,category,REGIONS[region],description)
    assets[-1].update(reference=PLAN,floors=list(floors),kit='four-floor',assumption=assumption)
    root['source_reference']='four-floor-plan.png'

def rounded(name,p,s,ma,bevel=.025):
    o=box(name,p,s,ma,bevel)
    if bevel:o.modifiers[0].segments=3
    return o

def pivot(name,p,axis='Z'):
    o=group(name,p);o['motion_axis_blender']=axis;return o

def archwall(width=1.2,height=2.65):
    box('wall plaster',(0,0,height/2),(width,.18,height),'wall',.008)
    for y in [-.103,.103]:box('skirting',(0,y,.09),(width,.035,.18),'metal',.004)
    box('upper cap',(0,0,height-.03),(width,.23,.09),'metal_light',.008)

start('wall_module','Стена · 1,2 м','Архитектура','Прямой модуль 1,2 × 2,65 м. Цоколь и верхняя металлическая кромка.','shared');archwall();finish()
start('wall_half','Низкая стена','Архитектура','Модуль 1,2 × 1,15 м для открытого вида сверху.','shared');archwall(1.2,1.15);finish()
start('wall_corner','Угол стены','Архитектура','Угловое соединение двух плеч по 0,6 м, общая высота 2,65 м.','shared')
for p,s in [((0,.21,1.325),(.18,.6,2.65)),((.21,0,1.325),(.6,.18,2.65))]:
    box('corner wall',p,s,'wall',.008)
    box('corner capping',(p[0],p[1],2.62),(s[0]+.03,s[1]+.03,.09),'metal_light',.008)
    box('corner plinth',(p[0],p[1],.09),(s[0]+.025,s[1]+.025,.18),'metal',.004)
finish()

# Furniture builders keep tops and seat heights compatible across variants.
def compact_desk(width=1.25,pedestal=True):
    rounded('desktop',(0,0,.765),(width,.66,.075),'oak_top',.014)
    box('edge underside',(0,0,.718),(width-.04,.62,.02),'oak_dark',.003)
    if pedestal:drawer((-width/2+.21,.02,0),.36,.53,.68)
    for x in ([width/2-.08] if pedestal else [-width/2+.08,width/2-.08]):
        for y in [-.24,.24]:box('desk leg',(x,y,.36),(.065,.065,.72),'oak',.008)
    box('desk modesty',(0,.255,.50),(width-.17,.035,.34),'oak',.006)
    cyl('cable grommet',(width/2-.17,.23,.805),.022,.005,'metal')

def upholstered_chair(kind='meeting'):
    seat=.465
    for x in [-.22,.22]:
        for y in [-.20,.20]:rod('chair leg',(x*1.03,y*1.1,.025),(x,y,seat-.035),.023,'metal')
    rounded('seat shell',(0,0,seat-.03),(.51,.49,.08),'green_shadow',.04)
    rounded('seat upholstery',(0,-.01,seat+.015),(.49,.46,.08),'green_velvet',.039)
    for x in [-.20,.20]:rod('backrest support',(x,.19,.40),(x,.23,.85),.018,'metal')
    rounded('backrest shell',(0,.232,.735),(.49,.09,.41),'green_shadow',.042)
    rounded('backrest cushion',(0,.175,.747),(.435,.075,.36),'green_velvet',.037)
    if kind=='meeting':
        for x in [-.277,.277]:
            rod('arm upright',(x,.08,.42),(x,.08,.67),.016,'metal')
            rounded('arm pad',(x,-.01,.68),(.058,.31,.036),'green_edge',.014)
    if kind=='training':
        rod('tablet support',(.23,.02,.42),(.31,.02,.73),.016,'metal')
        rounded('writing tablet',(.26,-.15,.76),(.32,.40,.035),'oak_light',.024)
    for x in [-.23,.23]:rod('leg cross brace',(x,-.2,.14),(x,.2,.14),.013,'metal')

def soft_sofa(width=1.55,seats=2):
    for x in [-width/2+.13,width/2-.13]:
        for y in [-.27,.27]:cyl('sofa foot',(x,y,.045),.041,.09,'oak_dark',8)
    rounded('sofa chassis',(0,0,.23),(width,.76,.30),'green_shadow',.045)
    rounded('sofa back',(0,.28,.64),(width-.10,.23,.60),'green_shadow',.052)
    for x in [-width/2+.09,width/2-.09]:rounded('padded arm',(x,-.015,.49),(.18,.78,.37),'green_velvet',.060)
    sw=(width-.37)/seats
    for i in range(seats):
        x=(i-(seats-1)/2)*sw
        rounded('seat cushion',(x,-.065,.43),(sw-.014,.56,.17),'green_edge',.050)
        rounded('back cushion',(x,.206,.705),(sw-.014,.17,.41),'green_velvet',.046)
        rounded('cushion welt',(x,-.339,.414),(sw-.09,.008,.012),'green_velvet',.004)

def meeting_table(length=2.4,width=1.02):
    rounded('conference top',(0,0,.762),(length,width,.08),'oak_top',.035)
    rounded('dark edge',(0,0,.714),(length-.05,width-.045,.019),'oak_dark',.008)
    for x in [-length/2+.24,length/2-.24]:
        for y in [-width/2+.14,width/2-.14]:box('table leg',(x,y,.36),(.085,.085,.72),'oak',.01)
        box('table end apron',(x,0,.672),(.065,width-.14,.08),'oak_dark',.005)
    box('table spine',(0,0,.662),(length-.35,.055,.10),'oak_dark',.005)
    rounded('power cable cover',(0,0,.805),(.25,.095,.01),'metal',.004)

def bookcase_low(width=1.2,height=.92):
    depth=.36
    box('bookcase back',(0,.16,height/2),(width,.04,height),'oak_dark',.004)
    for x in [-width/2+.027,0,width/2-.027]:box('shelf upright',(x,0,height/2),(.055,depth,height),'oak',.006)
    for z in [.05,height*.52,height]:box('shelf board',(0,0,z),(width+.04,depth+.025,.055),'oak_top',.006)
    rng=random.Random(40)
    for side in [-1,1]:
        for row in range(2):
            for i in range(5):
                h=rng.uniform(.20,.31);x=side*width*.25+(i-2)*.082;z=.085+row*(height*.52-.025)
                box('book spine',(x,-.142,z+h/2),(.064,.025,h),['book_blue','book_cream','book_teal','book_red'][i%4],.002)
                box('book pages',(x,.002,z+h/2),(.056,.26,h-.008),'paper',.001)
                for dz in [.035,h-.045]:box('book spine rule',(x,-.157,z+dz),(.04,.003,.007),'oak_light')

start('desk_compact','Стол · компактный','Мебель','Стол 1,25 × 0,66 м, одна тумба. Верх y=0,8025 м.','work');compact_desk();finish()
start('desk_open','Стол · без тумбы','Мебель','Свободное подстолье и четыре ножки, 1,25 × 0,66 м.','work');compact_desk(pedestal=False);finish()
start('desk_oak','Стол · руководителя','Мебель','Стол 1,68 × 0,80 м, две тумбы, общий верх y≈0,802 м.','work');desk();finish()
start('chair_task_green','Рабочее кресло · зелёное','Мебель','Пять опор с роликами, регулируемая стойка и мягкие подушки.','work')
chair('green_velvet',True)
for o in current.objects:
    if o.type=='MESH':
        for mod in o.modifiers:
            if mod.type=='BEVEL':mod.segments=3
finish()
for key,title,kind in [('chair_meeting','Стул переговорной','meeting'),('chair_auditorium','Стул общего зала','hall'),('chair_training','Учебный стул · планшет','training')]:
    start(key,title,'Мебель','Зелёная обивка, отдельная спинка, четыре ножки.'+(' Откидная по назначению рабочая поверхность; статичная модель.' if kind=='training' else ''),'meeting',assumption='Основание стульев малоразличимо: выбрана устойчивая четырёхножная конструкция.');upholstered_chair(kind);finish()
for key,title,w,seats in [('sofa_three','Диван · три места',2.12,3),('sofa_two','Диван · два места',1.55,2),('armchair_waiting','Кресло ожидания',.86,1),('sofa_module','Диванный модуль',.77,1)]:
    start(key,title,'Мебель','Скруглённые подушки, зелёная обивка, деревянные ножки. Высота сиденья 0,515 м.','lounge');soft_sofa(w,seats);finish()
start('stool_cafe','Кофейный табурет','Мебель','Низкий круглый табурет, мягкая зелёная подушка и четыре ножки.','service')
for i in range(4):
    a=i*math.pi/2+math.pi/4;rod('stool leg',(.23*math.cos(a),.23*math.sin(a),.02),(.18*math.cos(a),.18*math.sin(a),.40),.024,'oak')
cyl('stool seat base',(0,0,.412),.25,.05,'oak_dark',24)
rounded('stool cushion',(0,0,.462),(.49,.49,.10),'green_velvet',.15)
finish()
start('pouf_round','Круглый пуф','Мебель','Мягкий охристый пуф с радиальными швами, диаметр 0,56 м.','lounge',(1,3,4))
cyl('pouf base',(0,0,.04),.24,.08,'oak_dark',24)
rounded('pouf body',(0,0,.23),(.56,.56,.43),'oak_light',.17)
for i in range(8):
    a=i*math.pi/4;rod('radial upholstery seam',(0,0,.449),(.22*math.cos(a),.22*math.sin(a),.443),.0025,'oak_top',6)
finish()
for key,title,r,h in [('table_round','Стол · круглая переговорная',.76,.74),('table_cafe','Стол · кофейный',.51,.72),('table_coffee','Стол · журнальный',.43,.43),('table_side','Столик · приставной',.25,.54)]:
    start(key,title,'Мебель','Деревянная круглая столешница с тёмной кромкой и устойчивой опорой.','meeting');table(r,h);finish()
for key,title,l,w in [('table_meeting','Стол · переговорная',2.4,1.02),('table_meeting_small','Стол · малая переговорная',1.55,.90),('table_training','Стол · обучение',3.40,1.12)]:
    start(key,title,'Мебель','Самостоятельная геометрия ножек и столешницы; рабочая поверхность y=0,802 м.','meeting');meeting_table(l,w);finish()
start('desk_classroom','Учебный стол','Мебель','Небольшой стол 0,65 × 0,48 м для отдельного стула. Альтернатива стулу с планшетом.','meeting',(4,),assumption='На плане неразличимо, столики отдельные или соединены со стульями; подготовлены оба варианта.')
rounded('student top',(0,0,.735),(.65,.48,.04),'oak_light',.017)
for x in [-.27,.27]:
    for y in [-.18,.18]:rod('desk tube',(x,y,.015),(x,y,.72),.018,'metal')
box('underdesk shelf',(0,0,.59),(.53,.35,.025),'metal_light',.006)
finish()
start('bookshelf_low','Низкий книжный стеллаж','Мебель','Два яруса и два отделения, высота 0,95 м.','work');bookcase_low();finish()
start('cabinet_low','Низкий шкаф','Мебель','Закрытое хранение с двумя дверцами, верх y=0,925 м.','work')
box('cabinet body',(0,0,.455),(1.05,.42,.87),'oak_dark',.012)
for x in [-.259,.259]:
    rounded('cabinet door',(x,-.221,.47),(.50,.035,.79),'oak',.009)
    box('cabinet door inset',(x,-.243,.47),(.42,.008,.69),'oak_top',.004)
    rod('door pull',(x+(.18 if x<0 else -.18),-.265,.41),(x+(.18 if x<0 else -.18),-.265,.55),.009,'metal_light')
box('cabinet cap',(0,0,.90),(1.09,.46,.05),'oak_top',.008)
finish()
start('wall_shelf','Настенная полка','Мебель','Двухъярусная открытая полка. Начало координат — низ модели, высота монтажа задаётся в сцене.','work')
for z in [.05,.43]:box('floating shelf',(0,0,z),(1.20,.28,.045),'oak_top',.006)
for x in [-.56,.56]:box('shelf side',(x,.012,.255),(.055,.26,.45),'oak',.007)
box('shelf backing',(0,.135,.25),(1.18,.027,.45),'oak_dark',.003)
for i in range(7):box('shelf book',(-.43+i*.075,-.02,.205),(.055,.18,.26),['book_blue','book_cream','book_teal'][i%3],.003)
finish()

start('whiteboard_vertical','Доска · вертикальная','Мебель','Узкая двусторонняя доска 0,62 × 1,70 м, заметная между рабочими группами.','work',(2,3))
for x in [-.255,.255]:
    rod('board column',(x,0,.07),(x,0,1.68),.017,'metal_light')
    box('board foot',(x,0,.065),(.055,.42,.03),'metal',.007)
    for y in [-.17,.17]:cyl('board wheel',(x,y,.033),.033,.025,'black',10,rot=(0,math.pi/2,0))
box('board frame',(0,0,1.105),(.62,.055,1.15),'oak_light',.007)
for s in [-1,1]:
    box('writing face',(0,s*.031,1.105),(.565,.008,1.09),'white',.003)
    for row in range(4):
        for col in range(2):
            x=-.145+col*.27;z=1.49-row*.24
            box('planning note',(x,s*.038,z),(.17,.005,.14),['sticky_blue','sticky_yellow','sticky_green','sticky_pink'][(row+col)%4],.001)
            for k in range(2):box('note stroke',(x,s*.042,z+.025-k*.035),(.11,.001,.009),'metal_light')
box('board pen tray',(0,-.09,.52),(.54,.18,.035),'metal_light',.005)
finish()
start('wall_pier','Простенок / колонна','Архитектура','Узкий повторяемый простенок между окнами, ширина 0,28 м.','shared')
archwall(.28)
for z in [.13,2.51]:box('pier collar',(0,0,z),(.33,.25,.13),'metal_light',.008)
finish()
start('door_portal','Дверной портал','Архитектура','Проём 0,96 × 2,20 м; внешняя ширина 1,20 м.','shared')
for x in [-.54,.54]:box('door jamb',(x,0,1.325),(.12,.20,2.65),'wall',.008)
box('wall above opening',(0,0,2.425),(.96,.18,.45),'wall',.008)
for x in [-.495,.495]:box('portal trim',(x,-.115,1.1),(.035,.04,2.2),'oak_light',.004)
box('portal header',(0,-.115,2.20),(1.03,.04,.04),'oak_light',.004)
finish()

start('window_section','Окно · двойная секция','Архитектура','Две стеклянные панели, оконный цоколь и подоконник. Шаг 1,8 м.','shared')
box('window dwarf wall',(0,0,.235),(1.8,.2,.47),'wall',.007)
box('window sill',(0,-.025,.49),(1.84,.29,.06),'stone',.007)
for x in [-.865,0,.865]:box('window mullion',(x,0,1.56),(.07,.10,2.13),'metal',.006)
for z in [.56,2.59]:box('window rail',(0,0,z),(1.8,.11,.09),'metal',.006)
for x in [-.434,.434]:box('window glass',(x,0,1.57),(.79,.014,1.94),'glass',.001)
for x in [-.065,.065]:box('window latch',(x,-.07,1.19),(.024,.035,.14),'steel',.004)
finish()

start('glass_partition','Перегородка · стекло','Архитектура','Рамная перегородка 1,2 × 2,2 м; подходит к дверному модулю.','shared');glass_panel(1.135,2.2);finish()
start('glass_corner_post','Угловая стойка стекла','Архитектура','Квадратная угловая стойка 80 × 80 мм, высота 2,2 м.','shared')
box('corner post',(0,0,1.1),(.08,.08,2.2),'metal',.006)
for z in [.08,2.12]:box('post collar',(0,0,z),(.10,.10,.07),'metal_light',.004)
finish()

def door_leaf(width,height=2.12,glazed=False):
    # Local hinge is x=0, z=0. Leaf extends along +X.
    if glazed:
        box('door glazing',(width/2,0,height/2),(width-.08,.015,height-.10),'glass',.001)
        for x in [.025,width-.025]:box('leaf stile',(x,0,height/2),(.05,.055,height),'metal_light',.006)
        for z in [.03,height-.03]:box('leaf rail',(width/2,0,z),(width,.055,.06),'metal',.006)
    else:
        rounded('oak door leaf',(width/2,0,height/2),(width,.065,height),'oak_light',.01)
        rounded('door inset',(width/2,-.035,height/2),(width-.17,.015,height-.30),'paper',.008)
        box('kick plate',(width/2,-.047,.17),(width-.13,.008,.19),'steel',.005)
    for y in [-.075,.075]:
        rod('door handle',(width-.12,y,.94),(width-.12,y,1.14),.014,'steel')
        for z in [.96,1.12]:rod('handle standoff',(width-.12,0,z),(width-.12,y,z),.012,'steel')
    for z in [.24,height-.24]:cyl('door hinge',(0,0,z),.018,.10,'steel')

def doorway(double=False,glazed=False):
    global root
    total=1.86 if double else .98;w=(total-.06)/2 if double else total-.06
    for x in [-total/2,total/2]:box('outer door frame',(x,0,1.10),(.065,.105,2.2),'metal',.006)
    box('door frame lintel',(0,0,2.17),(total+.06,.105,.06),'metal',.006)
    saved=root
    root=pivot('hinge_left',(-total/2+.03,0,.02));door_leaf(w,glazed=glazed);root=saved
    if double:
        root=pivot('hinge_right',(total/2-.03,0,.02));root.rotation_euler.z=math.pi;door_leaf(w,glazed=glazed);root=saved

for key,title,double,glazed in [('door_interior','Дверь · непрозрачная',False,False),('glass_door','Дверь · стеклянная',False,True),('entrance_double_door','Вход · две створки',True,True)]:
    start(key,title,'Архитектура','Коробка и отдельные шарнирные узлы створок; можно открывать поворотом вокруг вертикальной оси.','shared');doorway(double,glazed);finish()

start('elevator_portal','Лифтовый портал','Архитектура','Две раздвижные створки, вызов и индикатор. Створки — отдельные узлы. Кабина отдельным объектом.','shared')
for x in [-.73,.73]:box('elevator pier',(x,0,1.325),(.22,.27,2.65),'wall',.015)
box('elevator lintel',(0,0,2.49),(1.67,.28,.32),'wall',.01)
box('lift recess',(0,.085,1.15),(1.24,.045,2.30),'black')
box('threshold',(0,-.04,.022),(1.4,.38,.044),'steel',.004)
saved=root
for s in [-1,1]:
    root=pivot('slide_left' if s<0 else 'slide_right',(s*.30,-.06,.03),'X')
    box('brushed steel door',(0,0,1.13),(.59,.045,2.26),'metal_light',.007)
    box('door centre inset',(0,-.025,1.15),(.49,.008,2.02),'steel',.004)
    for x in [-.16,.16]:box('vertical brushed strip',(x,-.031,1.15),(.007,.002,1.95),'metal_light')
    root=saved
box('indicator fascia',(0,-.156,2.48),(.35,.02,.14),'black',.01)
box('floor indicator',(0,-.17,2.48),(.025,.006,.087),'code_blue')
for x in [-.042,.042]:box('indicator side',(x,-.17,2.5),(.018,.006,.040),'code_blue')
box('call panel',(.74,-.151,1.13),(.10,.028,.23),'steel',.008)
for z in [1.09,1.17]:cyl('call button',(.74,-.173,z),.022,.012,'warm_light',12,rot=(math.pi/2,0,0))
finish()
start('elevator_cabin','Лифт · кабина','Архитектура','Открытая спереди кабина 1,5 × 1,5 м; потолок отдельно не закрывает вид сверху.','shared')
box('cabin floor',(0,0,.035),(1.5,1.5,.07),'tile_cream',.008)
box('cabin rear',(0,.72,1.18),(1.5,.06,2.36),'metal_light',.01)
for x in [-.72,.72]:
    box('cabin side',(x,0,1.18),(.06,1.5,2.36),'steel',.008)
    rod('cabin handrail',(x*.93,-.55,1.0),(x*.93,.55,1.0),.024,'metal')
box('cabin mirror',(0,.68,1.5),(1.15,.01,1.15),'glass',.008)
finish()

start('stair_u','Лестница · два марша','Архитектура','18 подъёмов по 0,17 м, ступени 0,28 м, ширина марша 1 м. Высота этажа 3,06 м — проектное допущение.','shared')
for flight in range(2):
    xc=-.59 if flight==0 else .59
    for i in range(9):
        y=-1.12+i*.28 if flight==0 else 1.12-i*.28
        top=(i+1)*.17+flight*1.53
        box('stair step',(xc,y,top-.085),(1.0,.28,.17),'stone',.006)
        box('nosing',(xc,y-.127 if flight==0 else y+.127,top-.007),(1,.019,.014),'metal_light',.002)
    for dx in [-.51,.51]:
        x=xc+dx
        a=(x,-1.26,.10) if flight==0 else (x,1.26,1.63)
        b=(x,1.26,1.46) if flight==0 else (x,-1.26,2.99)
        rod('stair stringer',a,b,.052,'metal',8)
        for i in range(5):
            t=i/4;y=a[1]*(1-t)+b[1]*t;z=a[2]*(1-t)+b[2]*t
            rod('baluster',(x,y,z),(x,y,z+1),.018,'metal')
        rod('sloping handrail',(x,a[1],a[2]+1),(x,b[1],b[2]+1),.027,'oak_light')
box('half landing',(0,1.90,1.455),(2.2,1.28,.15),'stone',.007)
for x in [-1.1,0,1.1]:rod('landing guard post',(x,2.49,1.53),(x,2.49,2.53),.023,'metal')
rod('landing back rail',(-1.1,2.49,2.53),(1.1,2.49,2.53),.027,'oak_light')
for x in [-1.1,1.1]:
    rod('landing outer post',(x,1.31,1.53),(x,1.31,2.53),.023,'metal')
    rod('landing side rail',(x,1.31,2.53),(x,2.49,2.53),.027,'oak_light')
finish()
start('railing_module','Ограждение · 1,2 м','Архитектура','Самостоятельное ограждение площадок высотой 1 м.','shared')
for x in [-.57,0,.57]:
    cyl('guard foot',(x,0,.012),.046,.024,'steel')
    rod('guard post',(x,0,.02),(x,0,1),.018,'metal')
for z in [.32,.63]:rod('guard crossbar',(-.6,0,z),(.6,0,z),.012,'metal_light')
rod('guard handrail',(-.6,0,1),(.6,0,1),.025,'oak_light')
finish()

for key,title,ma in [('floor_tile','Пол · синий ковролин','floor'),('floor_light_tile','Пол · светлая плитка','tile_cream')]:
    start(key,title,'Архитектура','Модуль 1 × 1 м, толщина 30 мм. Верхняя поверхность y=0,03 м в GLB.','shared')
    box('tile substrate',(0,0,.011),(1,1,.022),'tile_grout')
    box('floor face',(0,0,.026),(.995,.995,.008),ma,.001)
    if key=='floor_tile':
        rng=random.Random(5)
        for j in range(42):box('woven fleck',(rng.uniform(-.47,.47),rng.uniform(-.47,.47),.0302),(.008,.003,.0004),'floor_light')
    finish()

start('wall_lamp','Настенный светильник','Свет','Корпус, матовый рассеиватель и тёплый эмиссивный материал. Реальный источник света добавляется движком.','shared')
rounded('sconce back',(0,.02,.17),(.20,.05,.34),'metal',.015)
rounded('light diffuser',(0,-.035,.17),(.145,.07,.21),'warm_light',.018)
for z in [.05,.29]:box('lamp cap',(0,-.025,z),(.21,.12,.045),'oak_dark',.008)
finish()
start('light_strip','Световая планка','Свет','Линейный светильник длиной 0,9 м для полок и стен.','shared')
box('strip housing',(0,0,.025),(.90,.075,.05),'metal',.006)
box('strip diffuser',(0,-.040,.025),(.84,.008,.034),'warm_light',.004)
finish()
start('ceiling_light','Потолочный светильник','Свет','Плоская панель 0,6 × 0,6 м; дополнительный модуль для полноразмерной сцены.','shared',assumption='Потолок на плане снят; форма светильника предложена для комплектации.')
box('ceiling housing',(0,0,.026),(.60,.60,.052),'metal_light',.008)
box('ceiling diffuser',(0,0,.004),(.55,.55,.008),'warm_light',.006)
finish()
