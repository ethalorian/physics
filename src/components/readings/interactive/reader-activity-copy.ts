import type { StoryLanguage } from './reader-story-content'

export const READER_ACTIVITY_COPY: Record<StoryLanguage, {
  enter: string; return: string; play: string; pause: string; progress: string
  atExperiment: string; reducedMotion: string; journey: string; boat: string; direction: string
}> = {
  en: { enter: 'Join the experiment', return: 'Return to your desk', play: 'Run the motion', pause: 'Pause', progress: 'Experiment progress',
    atExperiment: 'You’re in the experiment below.', reducedMotion: 'Use the progress slider to explore each moment.',
    journey: 'Your avatar follows the trip: 2 m/s out, then 1 m/s back.', boat: 'Your avatar rides the boat. Watch its path from the bank.', direction: 'Your avatar is the reference point. Turn the velocity arrow while keeping its length fixed.' },
  es: { enter: 'Entrar en el experimento', return: 'Volver a tu escritorio', play: 'Iniciar el movimiento', pause: 'Pausar', progress: 'Progreso del experimento',
    atExperiment: 'Estás en el experimento de abajo.', reducedMotion: 'Usa el control de progreso para explorar cada instante.',
    journey: 'Tu avatar recorre el trayecto: 2 m/s de ida y 1 m/s de vuelta.', boat: 'Tu avatar va en el bote. Observa su trayectoria desde la orilla.', direction: 'Tu avatar es el punto de referencia. Gira la flecha de velocidad sin cambiar su longitud.' },
  fr: { enter: 'Rejoindre l’expérience', return: 'Retourner à ton bureau', play: 'Lancer le mouvement', pause: 'Pause', progress: 'Progression de l’expérience',
    atExperiment: 'Tu participes à l’expérience ci-dessous.', reducedMotion: 'Utilise le curseur de progression pour explorer chaque instant.',
    journey: 'Ton avatar suit le trajet : 2 m/s à l’aller, puis 1 m/s au retour.', boat: 'Ton avatar est dans le bateau. Observe sa trajectoire depuis la berge.', direction: 'Ton avatar est le point de référence. Tourne la flèche de vitesse en gardant sa longueur.' },
  'pt-BR': { enter: 'Entrar no experimento', return: 'Voltar à sua carteira', play: 'Iniciar o movimento', pause: 'Pausar', progress: 'Progresso do experimento',
    atExperiment: 'Você está no experimento abaixo.', reducedMotion: 'Use o controle de progresso para explorar cada instante.',
    journey: 'Seu avatar percorre o trajeto: 2 m/s na ida e 1 m/s na volta.', boat: 'Seu avatar está no barco. Observe a trajetória da margem.', direction: 'Seu avatar é o ponto de referência. Gire a seta da velocidade mantendo seu comprimento.' },
}
