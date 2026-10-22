export const STORY_LANGUAGES = [
  ['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['pt-BR', 'Português (Brasil)'],
] as const
export type StoryLanguage = typeof STORY_LANGUAGES[number][0]
export type StorySceneId = 'frame-1' | 'speed-2' | 'velocity-3'
type Scene = {
  title: string; teacher: string; student: string; question: string
  choices: readonly [string, string, string]; investigate: string; connection: string
}
type StoryCopy = {
  title: string; intro: string; language: string; show: string; classroom: string
  you: string; sample: string; customize: string; missing: string; loading: string
  prediction: string; selected: string; test: string; asteroid: string; practice: string
  scenes: Record<StorySceneId, Scene>
}

// Story choices are invitations to investigate, separate from graded answers and reader checks.
export const READER_STORY: Record<StoryLanguage, StoryCopy> = {
  en: {
    title: 'You’re part of the story.',
    intro: 'Join Mr. Antocci in the classroom. Make a prediction, test the model, and take the idea into our fictional asteroid investigation.',
    language: 'Story language', show: 'Show story panels', classroom: 'Mr. Antocci’s physics class',
    you: 'You', sample: 'Sample student', customize: 'Change your look', missing: 'Open your avatar', loading: 'Loading your avatar…',
    prediction: 'Your prediction', selected: 'Prediction chosen. Now look for evidence.', test: 'Try the model below',
    asteroid: 'The asteroid connection', practice: 'Explore · no grade or XP',
    scenes: {
      'frame-1': {
        title: 'Same boat. Two viewpoints.',
        teacher: 'You’re at the controls. Point the boat straight across the river. What will someone on the bank see when the current flows?',
        student: 'The boat moves through the water. But the water is moving, too…',
        question: 'From the bank, which path do you predict?',
        choices: ['Straight across', 'Across and downstream', 'The boat stays still'],
        investigate: 'Keep the boat pointing straight across. Compare a current of 0 m/s with 2 m/s. Watch the path and the downstream drift. Which viewpoint explains the change?',
        connection: 'Before describing fictional asteroid 2026-XJ as “moving,” our team must name the reference: Earth, the Sun, or another observer.',
      },
      'speed-2': {
        title: 'You came back. Did nothing happen?',
        teacher: 'Walk 8 meters out and 8 meters back. You finish beside me. Does ending where you started erase the trip?',
        student: 'I definitely walked somewhere. The endpoints can’t tell the whole story.',
        question: 'On the complete round trip, what is zero?',
        choices: ['Distance traveled', 'Displacement', 'Both distance and displacement'],
        investigate: 'Set the return distance to 8 m. Compare total distance and displacement, then average speed and average velocity. Which pair uses the whole path?',
        connection: 'An asteroid’s distance traveled and its change in position answer different questions. We need time and a reference frame to describe its motion.',
      },
      'velocity-3': {
        title: 'The arrow turns. The story changes.',
        teacher: 'Imagine this arrow is your velocity. Keep its length fixed and turn it. Have you kept the same velocity?',
        student: 'Same speed… different direction. I’ll check what happens to the components.',
        question: 'When only the direction changes, what changes?',
        choices: ['Speed only', 'Velocity, but not speed', 'Neither speed nor velocity'],
        investigate: 'Keep vector magnitude at 5. Change the angle from 0° to 90°. Treat each unit as 1 m/s. Compare the arrow’s length, direction, and components.',
        connection: 'Speed alone cannot tell us where fictional asteroid 2026-XJ is heading. Direction matters, and a possible encounter still needs evidence.',
      },
    },
  },
  es: {
    title: 'Tú formas parte de la historia.',
    intro: 'Acompaña al profesor Antocci en clase. Haz una predicción, prueba el modelo y aplica la idea a nuestra investigación de un asteroide ficticio.',
    language: 'Idioma de la historia', show: 'Mostrar viñetas', classroom: 'La clase de física del profesor Antocci',
    you: 'Tú', sample: 'Estudiante de ejemplo', customize: 'Cambiar tu aspecto', missing: 'Abrir tu avatar', loading: 'Cargando tu avatar…',
    prediction: 'Tu predicción', selected: 'Predicción elegida. Ahora busca pruebas.', test: 'Prueba el modelo de abajo',
    asteroid: 'Conexión con el asteroide', practice: 'Explora · sin nota ni XP',
    scenes: {
      'frame-1': {
        title: 'El mismo bote. Dos puntos de vista.',
        teacher: 'Tú llevas el timón. Apunta el bote directamente a la otra orilla. ¿Qué verá alguien desde tierra cuando haya corriente?',
        student: 'El bote se mueve respecto al agua. Pero el agua también se mueve…',
        question: 'Desde la orilla, ¿qué trayectoria predices?',
        choices: ['Directamente al otro lado', 'Al otro lado y río abajo', 'El bote se queda quieto'],
        investigate: 'Mantén el bote apuntando directamente al otro lado. Compara corrientes de 0 m/s y 2 m/s. Observa la trayectoria y la desviación río abajo. ¿Qué punto de vista explica el cambio?',
        connection: 'Antes de decir que el asteroide ficticio 2026-XJ se mueve, debemos indicar la referencia: la Tierra, el Sol u otro observador.',
      },
      'speed-2': {
        title: 'Volviste. ¿No pasó nada?',
        teacher: 'Camina 8 metros y regresa los mismos 8 metros. Terminas a mi lado. ¿Volver al inicio borra el recorrido?',
        student: 'Mis pies sí se esforzaron. Los puntos inicial y final no cuentan toda la historia.',
        question: 'En el recorrido completo de ida y vuelta, ¿qué vale cero?',
        choices: ['La distancia recorrida', 'El desplazamiento', 'La distancia y el desplazamiento'],
        investigate: 'Ajusta la distancia de regreso a 8 m. Compara la distancia total con el desplazamiento, y la rapidez media con la velocidad media. ¿Qué par utiliza toda la trayectoria?',
        connection: 'La distancia recorrida por un asteroide y su cambio de posición responden a preguntas diferentes. Necesitamos tiempo y un sistema de referencia para describir su movimiento.',
      },
      'velocity-3': {
        title: 'La flecha gira. La historia cambia.',
        teacher: 'Imagina que esta flecha es tu velocidad. Mantén su longitud y gírala. ¿Has mantenido la misma velocidad?',
        student: 'La misma rapidez… otra dirección. Voy a observar qué pasa con las componentes.',
        question: 'Si solo cambia la dirección, ¿qué cambia?',
        choices: ['Solo la rapidez', 'La velocidad, pero no la rapidez', 'Ni la rapidez ni la velocidad'],
        investigate: 'Mantén la magnitud del vector en 5. Cambia el ángulo de 0° a 90°. Interpreta cada unidad como 1 m/s. Compara la longitud, la dirección y las componentes de la flecha.',
        connection: 'La rapidez por sí sola no indica hacia dónde va el asteroide ficticio 2026-XJ. La dirección importa, y un posible encuentro aún requiere pruebas.',
      },
    },
  },
  fr: {
    title: 'Tu fais partie de l’histoire.',
    intro: 'Rejoins M. Antocci en classe. Fais une prédiction, teste le modèle, puis applique cette idée à notre enquête sur un astéroïde fictif.',
    language: 'Langue de l’histoire', show: 'Afficher les cases', classroom: 'Le cours de physique de M. Antocci',
    you: 'Toi', sample: 'Élève de démonstration', customize: 'Changer ton apparence', missing: 'Ouvrir ton avatar', loading: 'Chargement de ton avatar…',
    prediction: 'Ta prédiction', selected: 'Prédiction choisie. Cherche maintenant des indices.', test: 'Teste le modèle ci-dessous',
    asteroid: 'Le lien avec l’astéroïde', practice: 'Explore · sans note ni XP',
    scenes: {
      'frame-1': {
        title: 'Un bateau. Deux points de vue.',
        teacher: 'Tu es aux commandes. Oriente le bateau droit vers l’autre rive. Que verra une personne sur la berge quand il y aura du courant ?',
        student: 'Le bateau se déplace par rapport à l’eau. Mais l’eau se déplace aussi…',
        question: 'Depuis la berge, quelle trajectoire prévois-tu ?',
        choices: ['Droit vers l’autre rive', 'Vers l’autre rive et vers l’aval', 'Le bateau reste immobile'],
        investigate: 'Garde le bateau orienté droit vers l’autre rive. Compare un courant de 0 m/s puis de 2 m/s. Observe la trajectoire et la dérive vers l’aval. Quel point de vue explique le changement ?',
        connection: 'Avant de dire que l’astéroïde fictif 2026-XJ bouge, notre équipe doit nommer le référentiel : la Terre, le Soleil ou un autre observateur.',
      },
      'speed-2': {
        title: 'Tu es de retour. Rien ne s’est passé ?',
        teacher: 'Marche 8 mètres, puis reviens de 8 mètres. Tu termines à côté de moi. Revenir au départ efface-t-il le trajet ?',
        student: 'Mes pieds ont fait un effort. Les points de départ et d’arrivée ne racontent pas toute l’histoire.',
        question: 'Sur cet aller-retour complet, quelle grandeur est nulle ?',
        choices: ['La distance parcourue', 'Le déplacement', 'La distance et le déplacement'],
        investigate: 'Règle la distance de retour sur 8 m. Compare distance totale et déplacement, puis vitesse moyenne scalaire et vitesse moyenne vectorielle. Quelle paire utilise tout le trajet ?',
        connection: 'La distance parcourue par un astéroïde et son changement de position répondent à des questions différentes. Il faut une durée et un référentiel pour décrire son mouvement.',
      },
      'velocity-3': {
        title: 'La flèche tourne. L’histoire change.',
        teacher: 'Imagine que cette flèche représente ta vitesse vectorielle. Garde sa longueur et fais-la tourner. Le vecteur vitesse reste-t-il identique ?',
        student: 'Même vitesse scalaire… autre direction. Je vais observer les composantes.',
        question: 'Si seule la direction change, qu’est-ce qui change ?',
        choices: ['La vitesse scalaire seulement', 'Le vecteur vitesse, pas sa norme', 'Ni la vitesse scalaire ni le vecteur vitesse'],
        investigate: 'Garde la norme du vecteur à 5. Change l’angle de 0° à 90°. Chaque unité représente 1 m/s. Compare la longueur, la direction et les composantes de la flèche.',
        connection: 'La vitesse scalaire seule ne dit pas où va l’astéroïde fictif 2026-XJ. La direction compte, et une rencontre possible demande encore des preuves.',
      },
    },
  },
  'pt-BR': {
    title: 'Você faz parte da história.',
    intro: 'Entre na sala do professor Antocci. Faça uma previsão, teste o modelo e leve a ideia para nossa investigação de um asteroide fictício.',
    language: 'Idioma da história', show: 'Mostrar quadrinhos', classroom: 'A aula de física do professor Antocci',
    you: 'Você', sample: 'Estudante de exemplo', customize: 'Mudar seu visual', missing: 'Abrir seu avatar', loading: 'Carregando seu avatar…',
    prediction: 'Sua previsão', selected: 'Previsão escolhida. Agora procure evidências.', test: 'Teste o modelo abaixo',
    asteroid: 'A conexão com o asteroide', practice: 'Explore · sem nota ou XP',
    scenes: {
      'frame-1': {
        title: 'O mesmo barco. Dois pontos de vista.',
        teacher: 'Você está no comando. Aponte o barco direto para a outra margem. O que alguém na margem verá quando houver correnteza?',
        student: 'O barco se move em relação à água. Mas a água também está se movendo…',
        question: 'Vista da margem, qual trajetória você prevê?',
        choices: ['Direto para o outro lado', 'Para o outro lado e rio abaixo', 'O barco fica parado'],
        investigate: 'Mantenha o barco apontado direto para a outra margem. Compare correntezas de 0 m/s e 2 m/s. Observe a trajetória e o desvio rio abaixo. Qual ponto de vista explica a mudança?',
        connection: 'Antes de dizer que o asteroide fictício 2026-XJ está se movendo, nossa equipe precisa indicar o referencial: a Terra, o Sol ou outro observador.',
      },
      'speed-2': {
        title: 'Você voltou. Nada aconteceu?',
        teacher: 'Caminhe 8 metros e volte os mesmos 8 metros. Você termina ao meu lado. Voltar ao início apaga o percurso?',
        student: 'Meus pés fizeram esforço. Os pontos inicial e final não contam toda a história.',
        question: 'Na ida e volta completa, o que vale zero?',
        choices: ['A distância percorrida', 'O deslocamento', 'A distância e o deslocamento'],
        investigate: 'Ajuste a distância de volta para 8 m. Compare distância total e deslocamento, depois rapidez média e velocidade média vetorial. Qual par usa todo o percurso?',
        connection: 'A distância percorrida por um asteroide e sua mudança de posição respondem a perguntas diferentes. Precisamos de tempo e de um referencial para descrever seu movimento.',
      },
      'velocity-3': {
        title: 'A seta gira. A história muda.',
        teacher: 'Imagine que esta seta é sua velocidade. Mantenha o comprimento e gire a seta. A velocidade continua igual?',
        student: 'Mesma rapidez… outra direção. Vou observar o que acontece com as componentes.',
        question: 'Quando só a direção muda, o que muda?',
        choices: ['Só a rapidez', 'A velocidade vetorial, mas não a rapidez', 'Nem a rapidez nem a velocidade vetorial'],
        investigate: 'Mantenha o módulo do vetor em 5. Mude o ângulo de 0° para 90°. Considere cada unidade como 1 m/s. Compare o comprimento, a direção e as componentes da seta.',
        connection: 'A rapidez sozinha não diz para onde vai o asteroide fictício 2026-XJ. A direção importa, e um possível encontro ainda precisa de evidências.',
      },
    },
  },
}

export function isStoryScene(id: string): id is StorySceneId {
  return Object.hasOwn(READER_STORY.en.scenes, id)
}
