// [asset ID, x, y, z, yaw]. GLB uses metres and Y up.
export const MODEL_PRESETS={
  workstation:{title:'Рабочее место',description:'Компактный стол, зелёное кресло, сидящий сотрудник, техника и вертикальная доска.',objects:[
    ['desk_compact',0,0,0],['monitor',0,.803,-.13],['keyboard_mouse',-.12,.803,.20],['coffee_mug',-.45,.803,.08],['plant_desk',.46,.803,-.19],
    ['chair_task_green',0,0,.75,Math.PI],['employee_seated',0,0,.75,Math.PI],['whiteboard_vertical',1.07,0,-.04],['plant_slender',-1.02,0,-.35]
  ]},
  reception:{title:'Ресепшен и ожидание',description:'Стойка обслуживания и компактное ожидание сбоку. Прямой проход перед стойкой свободен.',objects:[
    ['reception_counter',0,0,-.9],['monitor',.42,.782,-1.16,Math.PI],['desk_phone',-.65,1.021,-.77],['plant_desk',.82,1.021,-.79],
    ['chair_task_green',0,0,-1.83],['employee_seated',0,0,-1.83],['armchair_waiting',-1.70,0,.32,Math.PI/2],['table_side',-1.70,0,1.1],['plant_small_round',-1.70,.551,1.1],['plant_floor',1.52,0,-.9]
  ]},
  learning:{title:'Переговорная',description:'Длинный стол обучения, отдельные четырёхножные стулья, большой презентационный экран.',objects:[
    ['table_training',0,0,0],['plant_desk',0,.803,0],['laptop',-.85,.803,.25,Math.PI],['document_stack',.72,.803,-.3],
    ...[-1.1,0,1.1].flatMap(x=>[['chair_meeting',x,0,.91,Math.PI],['chair_meeting',x,0,-.91]]),
    ['presentation_screen',2.32,0,0,-Math.PI/2],['plant_floor',-2.16,0,-.45]
  ]}
};
