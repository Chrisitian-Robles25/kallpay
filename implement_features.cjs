const fs = require('fs');

const file = 'game.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const globals = data.variables;
const global = name => globals.find(variable => variable.name === name);
const scene = data.layouts.find(layout => layout.name === 'Nivel1');
const trivia = data.layouts.find(layout => layout.name === 'Trivia');

const group = prefix => scene.events.find(event => event.name && event.name.startsWith(prefix));
const addVariable = (list, variable) => {
  if (!list.some(item => item.name === variable.name)) list.push(variable);
};
const addGlobal = variable => addVariable(globals, variable);
const event = (conditions = [], actions = [], events = []) => ({
  type: 'BuiltinCommonInstructions::Standard',
  conditions,
  actions,
  ...(events.length ? { events } : {}),
});
const condition = (name, parameters, inverted = false) => ({
  type: { value: name, ...(inverted ? { inverted: true } : {}) },
  parameters,
});
const action = (name, parameters) => ({ type: { value: name }, parameters });
const compare = (expression, operator, value) =>
  condition('BuiltinCommonInstructions::CompareNumbers', [expression, operator, String(value)]);
const setNumber = (name, operator, value) =>
  action('SetNumberVariable', [name, operator, String(value)]);
const setBoolean = (name, value) =>
  action('SetBooleanVariable', [name, value ? 'True' : 'False', '']);
const setObjectNumber = (object, name, operator, value) =>
  action('SetNumberObjectVariable', [object, name, operator, String(value)]);
const setText = (object, value) =>
  action('TextContainerCapability::TextContainerBehavior::SetValue', [object, 'Text', '=', value]);
const playSound = (path, volume = 70) =>
  action('PlaySound', ['', path, '', String(volume), '1']);
const or = (children, inverted = false) => ({
  type: { value: 'BuiltinCommonInstructions::Or', ...(inverted ? { inverted: true } : {}) },
  parameters: [],
  subInstructions: children,
});

const config = global('Config').children;
const addConfig = (name, value) =>
  addVariable(config, { name, type: 'number', value });

const topics = [
  'altitud', 'minga', 'idiomas', 'tupu', 'sara', 'Wiki', 'lana', 'Raymi',
  'Inti Raymi', 'pambamesa', 'yupaychani', 'achachay', 'chaki', 'sombrero', 'kallpay',
];
const entries = [
  ['Saraguro está a unos 2.500 m de altura; por eso suele hacer frío.', '¿A qué altura aproximada está Saraguro?', ['500 metros', '2.500 metros', '5.000 metros'], 2],
  ['La minga es trabajar todos juntos por el bien de la comunidad.', '¿Qué es una minga?', ['Trabajo comunitario entre todos', 'Una comida', 'Un instrumento'], 1],
  ['En Saraguro se habla kichwa y español.', '¿Qué idiomas se hablan en Saraguro?', ['Solo español', 'Kichwa y francés', 'Kichwa y español'], 3],
  ['El tupu es un prendedor tradicional que sujeta la vestimenta.', '¿Para qué sirve el tupu?', ['Para sujetar la vestimenta', 'Para sembrar maíz', 'Para tocar música'], 1],
  ['En kichwa, «sara» significa maíz.', '¿Qué significa «sara» en kichwa?', ['Agua', 'Maíz', 'Montaña'], 2],
  ['El Wiki es un personaje bromista de las fiestas de Navidad.', '¿Quién es el Wiki?', ['Un instrumento', 'Un cultivo', 'Un personaje bromista de Navidad'], 3],
  ['La ropa saraguro se teje tradicionalmente con lana de borrego.', '¿Con qué se teje tradicionalmente parte de la ropa saraguro?', ['Algodón', 'Lana de borrego', 'Paja'], 2],
  ['En Saraguro se celebran cuatro Raymi durante el año.', '¿Cuántos Raymi se celebran durante el año?', ['Cuatro', 'Dos', 'Uno'], 1],
  ['El Inti Raymi celebra al sol y se relaciona con el tiempo de cosecha.', '¿Con qué se relaciona el Inti Raymi?', ['La lluvia', 'El sol y la cosecha', 'La luna nueva'], 2],
  ['La pambamesa es una comida compartida por la comunidad.', '¿Qué es la pambamesa?', ['Un sombrero', 'Una danza', 'Una comida compartida'], 3],
  ['«Yupaychani» significa «gracias» en kichwa.', '¿Qué significa «yupaychani»?', ['Gracias', 'Buenos días', 'Hasta luego'], 1],
  ['«Achachay» expresa que se siente frío.', '¿Cuándo se dice «achachay»?', ['Cuando hay hambre', 'Cuando se siente frío', 'Cuando se tiene sueño'], 2],
  ['«Chaki» puede significar «seco» o «sediento» en kichwa.', '¿Qué significa «chaki» en esta frase?', ['Caliente', 'Rápido', 'Seco o sediento'], 3],
  ['El sombrero tradicional saraguro forma parte de la vestimenta y protege del sol.', '¿Qué prenda protege la cabeza del sol?', ['El sombrero', 'El tupu', 'La pollera'], 1],
  ['«Kallpay» significa correr; «¡kallpay!» anima a correr.', '¿Qué significa «kallpay»?', ['Compartir', 'Correr', 'Agradecer'], 2],
].map(([phrase, question, options, correct], index) => ({
  type: 'structure',
  children: [
    { name: 'Tema', type: 'string', value: topics[index] },
    { name: 'Frase', type: 'string', value: phrase },
    { name: 'Pregunta', type: 'string', value: question },
    { name: 'Opcion1', type: 'string', value: options[0] },
    { name: 'Opcion2', type: 'string', value: options[1] },
    { name: 'Opcion3', type: 'string', value: options[2] },
    { name: 'Correcta', type: 'number', value: correct },
  ],
}));

for (const name of ['FrasesCulturales', 'Trivia']) {
  const oldVariable = global(name);
  if (oldVariable) globals.splice(globals.indexOf(oldVariable), 1);
}
addGlobal({ name: 'BancoCultural', type: 'array', children: entries });
addGlobal({ name: 'Ronda', type: 'number', value: 0 });
addGlobal({ name: 'InicioRonda', type: 'number', value: 0 });
addGlobal({ name: 'FrasesVistas', type: 'number', value: 0 });
for (const [name, value] of [
  ['AndenMin', 13], ['AndenMax', 18], ['ProbCuriquingue', 10],
  ['CastigoCuriquingue', 80], ['ProbBotellaRecta', 40],
]) addConfig(name, value);

const texts = global('TextosUI').children;
const instructions = 'Salta con ESPACIO, ↑, W o tocando la mitad derecha. Agáchate con ↓ o S; en celular, mantén tocada la mitad izquierda. Esquiva obstáculos y recoge maíz.';
texts.find(variable => variable.name === 'Instrucciones').value = instructions;
addVariable(texts, { name: 'FraseAgacharse', type: 'string', value: '¡Agáchate! ↓' });
addVariable(texts, { name: 'TriviaRonda', type: 'string', value: 'TRIVIA DE SARAGURO — RONDA ' });

for (const variable of [
  { name: 'ProximoAnden', type: 'number', value: 13 },
  { name: 'WikiProximoSalto', type: 'number', value: 0 },
  { name: 'TipoBotella', type: 'number', value: 0 },
  { name: 'Agachada', type: 'boolean', value: false },
  { name: 'AgachateExplicado', type: 'boolean', value: false },
]) addVariable(scene.variables, variable);
addVariable(trivia.variables, { name: 'IndiceTrivia', type: 'number', value: 0 });

const player = scene.objects.find(object => object.name === 'Jugadora');
const runningFrame = player.animations.find(animation => animation.name === 'correr').directions[0].sprites[0];
if (!player.animations.some(animation => animation.name === 'agachar')) {
  player.animations.push({
    name: 'agachar',
    useMultipleDirections: false,
    directions: [{
      looping: false,
      timeBetweenFrames: 0.1,
      sprites: [{
        ...JSON.parse(JSON.stringify(runningFrame)),
        image: 'assets/sprites/jugadora/jugadora_agachar_01.png',
        hasCustomCollisionMask: true,
        customCollisionMask: [[
          { x: 24, y: 94 }, { x: 96, y: 94 }, { x: 96, y: 159 }, { x: 24, y: 159 },
        ]],
      }],
    }],
  });
}

const stone = scene.objects.find(object => object.name === 'Piedra');
const spriteFrame = path => ({
  hasCustomCollisionMask: false,
  image: path,
  points: [],
  originPoint: { name: 'origine', x: 0, y: 0 },
  centerPoint: { automatic: true, name: 'centre', x: 0, y: 0 },
  customCollisionMask: [],
});
const makeSprite = (name, animation, frames, variables = [], behaviors = []) => {
  const object = JSON.parse(JSON.stringify(stone));
  object.name = name;
  object.variables = variables;
  object.behaviors = behaviors;
  object.adaptCollisionMaskAutomatically = true;
  object.animations = [{
    name: animation,
    useMultipleDirections: false,
    directions: [{ looping: true, timeBetweenFrames: 0.12, sprites: frames }],
  }];
  return object;
};
const anden = makeSprite(
  'Anden', 'anden', [spriteFrame('assets/sprites/obstaculos/anden.png')], [], [{
    name: 'Platform',
    type: 'PlatformBehavior::PlatformBehavior',
    canBeGrabbed: false,
    platformType: 'JumpthruPlatform',
    yGrabOffset: 0,
  }],
);
const bird = makeSprite('Curiquingue', 'volar', [
  spriteFrame('assets/sprites/obstaculos/curiquingue_01.png'),
  spriteFrame('assets/sprites/obstaculos/curiquingue_02.png'),
], [{ name: 'Golpeado', type: 'boolean', value: false }]);
for (const object of [anden, bird]) {
  if (!scene.objects.some(item => item.name === object.name)) scene.objects.push(object);
}
const obstaclesGroup = scene.objectsGroups.find(item => item.name === 'Obstaculos');
for (const name of ['Anden', 'Curiquingue']) {
  if (!obstaclesGroup.objects.some(item => item.name === name)) obstaclesGroup.objects.push({ name });
}
addVariable(scene.objects.find(object => object.name === 'Maiz').variables, { name: 'BaseY', type: 'number', value: 370 });
addVariable(scene.objects.find(object => object.name === 'Botella').variables, { name: 'Recta', type: 'boolean', value: false });
for (const path of [
  'assets/sprites/obstaculos/anden.png',
  'assets/sprites/obstaculos/curiquingue_01.png',
  'assets/sprites/obstaculos/curiquingue_02.png',
]) {
  if (!data.resources.resources.some(resource => resource.name === path)) {
    data.resources.resources.push({ file: path, kind: 'image', metadata: '', name: path, smoothed: true, userAdded: true });
  }
}
const wiki = scene.objects.find(object => object.name === 'Wiki');
if (!wiki.behaviors.some(behavior => behavior.name === 'WikiPlatformer')) {
  const behavior = JSON.parse(JSON.stringify(player.behaviors[0]));
  behavior.name = 'WikiPlatformer';
  behavior.jumpSpeed = 820;
  behavior.maxSpeed = 0;
  wiki.behaviors.push(behavior);
}
for (const object of data.layouts.find(layout => layout.name === 'Menu').objects) {
  if (object.name === 'Instrucciones') object.string = instructions;
}

const startEvent = group('1.').events.find(item => (item.conditions || []).some(c => c.type && c.type.value === 'DepartScene'));
startEvent.actions.push(
  action('ReadNumberFromStorage', ['"SaraguroKallpay"', '"Progreso/Ronda"', '', 'GlobalVariable(Ronda)']),
  setNumber('GlobalVariable(Ronda)', '+', '1'),
  action('EcrireFichierExp', ['"SaraguroKallpay"', '"Progreso/Ronda"', 'Ronda']),
  setNumber('GlobalVariable(InicioRonda)', '=', '(Ronda - 1 - 3 * floor((Ronda - 1) / 3)) * 5'),
  setNumber('IndiceFrase', '=', 'InicioRonda'),
  setNumber('ProximoAnden', '=', 'TimeFromStart() + RandomFloatInRange(Config.AndenMin, Config.AndenMax)'),
  setNumber('WikiProximoSalto', '=', 'TimeFromStart() + 1'),
  setBoolean('Agachada', false),
  setBoolean('AgachateExplicado', false),
  setNumber('GlobalVariable(FrasesVistas)', '=', '0'),
);

const controls = group('2.');
const jump = controls.events.find(item => (item.actions || []).some(a => a.type && a.type.value === 'PlatformBehavior::SimulateJumpKey' && a.parameters[0] === 'Jugadora'));
const jumpOr = jump.conditions.find(item => item.type && item.type.value === 'BuiltinCommonInstructions::Or');
const mouseIndex = jumpOr.subInstructions.findIndex(item => item.type && item.type.value === 'MouseButtonPressed');
if (mouseIndex >= 0) {
  jumpOr.subInstructions.splice(mouseIndex, 1, {
    type: { value: 'BuiltinCommonInstructions::And' },
    parameters: [],
    subInstructions: [
      condition('MouseButtonPressed', ['', '"Left"']),
      compare('CursorX("UI")', '>', 640),
    ],
  });
}
jump.actions.unshift(
  action('SetY', ['Jugadora', '=', 'Jugadora.Y() + Jugadora.Height() - 160']),
  action('SetHeight', ['Jugadora', '=', '160']),
  setBoolean('Agachada', false),
);
const crouchInputs = [
  condition('KeyFromTextPressed', ['', '"Down"']),
  condition('KeyFromTextPressed', ['', '"s"']),
  {
    type: { value: 'BuiltinCommonInstructions::And' },
    parameters: [],
    subInstructions: [
      condition('MouseButtonPressed', ['', '"Left"']),
      compare('CursorX("UI")', '<', 640),
    ],
  },
];
controls.events.push(
  event([condition('BooleanVariable', ['Pausado', 'False', '']), or(crouchInputs)], [setBoolean('Agachada', true)]),
  event([
    condition('BooleanVariable', ['Pausado', 'False', '']),
    condition('BooleanVariable', ['Agachada', 'True', '']),
    or(crouchInputs, true),
  ], [
    action('SetY', ['Jugadora', '=', 'Jugadora.Y() + Jugadora.Height() - 160']),
    action('SetHeight', ['Jugadora', '=', '160']),
    setBoolean('Agachada', false),
  ]),
  event([condition('BooleanVariable', ['Agachada', 'True', ''])], [
    action('SetAnimationName', ['Jugadora', '"agachar"']),
    action('SetY', ['Jugadora', '=', 'Jugadora.Y() + Jugadora.Height() - 90']),
    action('SetHeight', ['Jugadora', '=', '90']),
  ]),
);

const ahead = ['Piedra', 'Charco', 'Barro', 'Borrego', 'Botella', 'Curiquingue', 'Anden'].map(name => ({
  type: { value: 'BuiltinCommonInstructions::And' },
  parameters: [],
  subInstructions: [
    condition('PosX', [name, '>', 'Wiki.X() + Wiki.Width()']),
    condition('PosX', [name, '<', 'Wiki.X() + Wiki.Width() + 220']),
  ],
}));
group('3.').events.push(event([
  condition('PlatformBehavior::IsOnFloor', ['Wiki', 'WikiPlatformer']),
  compare('TimeFromStart()', '>=', 'WikiProximoSalto'),
  or(ahead),
], [
  action('PlatformBehavior::SimulateJumpKey', ['Wiki', 'WikiPlatformer']),
  setNumber('WikiProximoSalto', '=', 'TimeFromStart() + 0.9'),
]));

const stairs = [];
for (const [x, y] of [['CamX + 700', '510'], ['CamX + 900', '400'], ['CamX + 1100', '290']]) {
  stairs.push(
    action('Create', ['', 'Anden', x, y, '""']),
    action('SetWidth', ['Anden', '=', '220']),
    action('SetHeight', ['Anden', '=', '32']),
    action('ChangePlan', ['Anden', '=', '5']),
  );
}
stairs.push(setNumber('ProximoAnden', '=', 'TimeFromStart() + RandomFloatInRange(Config.AndenMin, Config.AndenMax)'));
const maizeOnStair = event([compare('RandomInRange(1, 2)', '=', 1)], [
  action('Create', ['', 'Maiz', 'CamX + 1200', '245', '""']),
  setObjectNumber('Maiz', 'BaseY', '=', 245),
  action('ChangePlan', ['Maiz', '=', '20']),
]);
const obstacleEvents = group('4.');
const spawn = obstacleEvents.events.find(item => (item.actions || []).some(a => a.type && a.type.value === 'SetNumberVariable' && a.parameters[0] === 'ProximoObstaculo'));
const fogIndex = spawn.events.findIndex(item => (item.actions || []).some(a => a.type && a.type.value === 'Create' && a.parameters[1] === 'Niebla'));
spawn.events.splice(fogIndex, 0, event([
  compare('Tipo', '>', 'Config.ProbPiedra + Config.ProbCharco + Config.ProbBarro + Config.ProbBorrego'),
  compare('Tipo', '<=', 'Config.ProbPiedra + Config.ProbCharco + Config.ProbBarro + Config.ProbBorrego + Config.ProbCuriquingue'),
], [
  action('Create', ['', 'Curiquingue', 'CamX + 760', '478', '""']),
  action('ChangePlan', ['Curiquingue', '=', '45']),
  playSound('assets/audio/efectos/ave.ogg'),
], [event([condition('BooleanVariable', ['AgachateExplicado', 'False', ''])], [
  setText('TextoFrase', 'TextosUI.FraseAgacharse'),
  setNumber('FraseHasta', '=', 'TimeFromStart() + Config.DuracionFrase'),
  setBoolean('AgachateExplicado', true),
  playSound('assets/audio/efectos/cuadro_aparece.ogg'),
])]));
const fog = spawn.events.find(item => (item.actions || []).some(a => a.type && a.type.value === 'Create' && a.parameters[1] === 'Niebla'));
fog.conditions.find(item => item.type && item.type.value === 'BuiltinCommonInstructions::CompareNumbers' && item.parameters[0] === 'Tipo' && item.parameters[1] === '>').parameters[2] =
  'Config.ProbPiedra + Config.ProbCharco + Config.ProbBarro + Config.ProbBorrego + Config.ProbCuriquingue';
obstacleEvents.events.push(
  event([
    compare('TimeFromStart()', '>=', 'ProximoAnden'),
    condition('BooleanVariable', ['MetaCreada', 'False', '']),
    compare('TimeFromStart()', '<', 'Config.Duracion - 4'),
  ], stairs, [maizeOnStair]),
  event([], [action('SetX', ['Curiquingue', '-', 'Config.VelocidadBorrego * TimeDelta()'])]),
);

const maizeGroup = group('6.');
const maizeCreate = maizeGroup.events.find(item => (item.actions || []).some(a => a.type && a.type.value === 'Create' && a.parameters[1] === 'Maiz'));
maizeCreate.actions.splice(2, 0, setObjectNumber('Maiz', 'BaseY', '=', 370));
const maizeFloat = maizeGroup.events.find(item => (item.actions || []).some(a => a.type && a.type.value === 'SetY' && a.parameters[0] === 'Maiz'));
maizeFloat.actions.find(a => a.type.value === 'SetY').parameters[2] = 'Maiz.Variable(BaseY) + 8 * sin(TimeFromStart() * 5)';

const bottleGroup = group('7.');
const bottleSpawn = bottleGroup.events.find(item => (item.actions || []).some(a => a.type && a.type.value === 'Create' && a.parameters[1] === 'Botella'));
bottleSpawn.actions.unshift(setNumber('TipoBotella', '=', 'RandomInRange(1, 100)'));
bottleSpawn.events.push(event([compare('TipoBotella', '<=', 'Config.ProbBotellaRecta')], [
  action('SetY', ['Botella', '=', 'Jugadora.Y() + 18']),
  setObjectNumber('Botella', 'VY', '=', 0),
  action('SetBooleanObjectVariable', ['Botella', 'Recta', 'True', '']),
], [event([condition('BooleanVariable', ['AgachateExplicado', 'False', ''])], [
  setText('TextoFrase', 'TextosUI.FraseAgacharse'),
  setNumber('FraseHasta', '=', 'TimeFromStart() + Config.DuracionFrase'),
  setBoolean('AgachateExplicado', true),
  playSound('assets/audio/efectos/cuadro_aparece.ogg'),
])]));
const bottleMove = bottleGroup.events.find(item => (item.actions || []).some(a => a.type && a.type.value === 'SetX' && a.parameters[0] === 'Botella'));
const gravityIndex = bottleMove.actions.findIndex(a => a.type && a.type.value === 'SetNumberObjectVariable' && a.parameters[1] === 'VY');
const gravityAction = bottleMove.actions.splice(gravityIndex, 1)[0];
bottleMove.events = bottleMove.events || [];
bottleMove.events.push(event([condition('BooleanObjectVariable', ['Botella', 'Recta', 'False', ''])], [gravityAction]));

const replaceDeep = (value, from, to) => {
  if (typeof value === 'string') return value.split(from).join(to);
  if (Array.isArray(value)) return value.map(item => replaceDeep(item, from, to));
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) value[key] = replaceDeep(value[key], from, to);
  }
  return value;
};
const collisionGroup = group('5.');
const stoneHit = collisionGroup.events.find(item => (item.conditions || []).some(c => c.type && c.type.value === 'CollisionNP' && c.parameters[1] === 'Piedra'));
const birdHit = replaceDeep(JSON.parse(JSON.stringify(stoneHit)), 'Piedra', 'Curiquingue');
for (const item of birdHit.actions || []) {
  if (item.type && item.type.value === 'PlaySound') {
    if (item.parameters[1].includes('/voces/')) item._remove = true;
    else item.parameters[1] = 'assets/audio/efectos/ave.ogg';
  }
}
birdHit.actions = birdHit.actions.filter(item => !item._remove);
birdHit.conditions.splice(1, 0, condition('BooleanVariable', ['Agachada', 'False', '']));
collisionGroup.events.push(birdHit, event([
  condition('CollisionNP', ['Jugadora', 'Curiquingue', '', '', '']),
  condition('BooleanVariable', ['Agachada', 'True', '']),
  condition('BooleanObjectVariable', ['Curiquingue', 'Golpeado', 'False', '']),
], [action('Delete', ['Curiquingue', ''])]));
addVariable(global('PalabrasKichwa').children, { name: 'Curiquingue', type: 'string', value: '¡Achachay!' });

const phraseGroup = group('8.');
const phraseEvent = phraseGroup.events.find(item => (item.actions || []).some(a =>
  a.type && a.type.value === 'TextContainerCapability::TextContainerBehavior::SetValue' &&
  a.parameters[0] === 'TextoFrase' && a.parameters[3] === 'FrasesCulturales[IndiceFrase]'));
if (!phraseEvent) throw new Error('No se encontró el evento de frases culturales.');
phraseEvent.actions.find(a => a.type.value === 'TextContainerCapability::TextContainerBehavior::SetValue' && a.parameters[0] === 'TextoFrase').parameters[3] =
  'BancoCultural[IndiceFrase].Frase';
phraseEvent.actions.push(setNumber('GlobalVariable(FrasesVistas)', '+', '1'));
phraseEvent.events = phraseEvent.events || [];
phraseEvent.events.push(event([compare('IndiceFrase', '>=', 15)], [setNumber('IndiceFrase', '=', 0)]));
for (const item of phraseGroup.events) replaceDeep(item, 'FrasesCulturales[IndiceFrase]', 'BancoCultural[IndiceFrase].Frase');
const bankComment = phraseGroup.events.find(item => item.type === 'BuiltinCommonInstructions::Comment');
if (bankComment) bankComment.comment = 'Cada Config.IntervaloFrases segundos se muestra la siguiente entrada de BancoCultural. Cada elemento contiene Tema, Frase, Pregunta, tres opciones y Correcta; la trivia solo usa las frases mostradas en esta ronda.';

const triviaStart = trivia.events.find(item => (item.conditions || []).some(c => c.type && c.type.value === 'DepartScene'));
triviaStart.actions.push(action('TextContainerCapability::TextContainerBehavior::SetValue', [
  'TituloTrivia', 'Text', '=', 'TextosUI.TriviaRonda + ToString(Ronda)',
]));
const questionDisplay = trivia.events.find(item => (item.actions || []).some(a =>
  a.type && a.type.value === 'TextContainerCapability::TextContainerBehavior::SetValue' &&
  a.parameters[0] === 'Pregunta' && a.parameters[3] === 'Trivia[PreguntaActual].Pregunta'));
if (!questionDisplay) throw new Error('No se encontró el evento de preguntas de trivia.');
questionDisplay.actions.unshift(setNumber(
  'IndiceTrivia', '=',
  'InicioRonda + PreguntaActual - 15 * floor((InicioRonda + PreguntaActual) / 15)',
));
for (const item of trivia.events) replaceDeep(item, 'Trivia[PreguntaActual]', 'BancoCultural[IndiceTrivia]');
for (const layout of data.layouts) {
  for (const item of layout.events || []) replaceDeep(item, 'GlobalVariableChildCount(Trivia)', 'FrasesVistas');
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('Implemented: 15-entry bank, saved rounds, ledges/Wiki jumping, crouch controls, bird and straight bottles.');
