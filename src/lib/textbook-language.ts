import type { TextbookLanguage } from '@/data/textbook'

export const TEXTBOOK_LANGUAGE_KEY = 'textbook:language'
export function parseTextbookLanguage(value: string | null | undefined): TextbookLanguage | null {
  return value === 'en' || value === 'es' || value === 'pt' ? value : null
}
export const TEXTBOOK_LANGUAGE_NAMES: Record<TextbookLanguage, string> = { en: 'English', es: 'Español', pt: 'Português' }
export function textbookLanguageTag(language: TextbookLanguage) { return language === 'pt' ? 'pt-BR' : language }
export function textbookPdfUrl(chapter: number, language: TextbookLanguage = 'en', page?: number) {
  return `/api/textbook/${chapter}?lang=${language}${page ? `#page=${page}` : ''}`
}

const titles: Record<number, string> = {
  2: 'Equilibrio mecánico', 3: 'Primera ley de Newton: inercia', 4: 'Movimiento lineal',
  5: 'Movimiento de proyectiles', 6: 'Segunda ley de Newton: fuerza y aceleración',
  7: 'Tercera ley de Newton: acción y reacción', 8: 'Cantidad de movimiento', 9: 'Energía',
  10: 'Movimiento circular', 11: 'Equilibrio rotacional', 12: 'Movimiento rotacional',
  13: 'Gravitación universal', 14: 'Movimiento de satélites', 15: 'Relatividad especial: espacio y tiempo',
  16: 'Relatividad: cantidad de movimiento, masa, energía y gravedad', 17: 'La naturaleza atómica de la materia',
  18: 'Sólidos', 19: 'Líquidos', 20: 'Gases', 21: 'Temperatura, calor y expansión',
  22: 'Transferencia de calor', 23: 'Cambio de fase', 24: 'Termodinámica', 25: 'Vibraciones y ondas',
  26: 'Sonido', 27: 'Luz', 28: 'Color', 29: 'Reflexión y refracción', 30: 'Lentes',
  31: 'Difracción e interferencia', 32: 'Electrostática', 33: 'Campos y potencial eléctricos',
  34: 'Corriente eléctrica', 35: 'Circuitos eléctricos', 36: 'Magnetismo',
  37: 'Inducción electromagnética', 38: 'El átomo y el cuanto', 39: 'El núcleo atómico y la radiactividad',
  40: 'Fisión y fusión nucleares',
}
export function textbookChapterTitle(chapter: { n: number; title: string }, language: TextbookLanguage) {
  return language === 'es' ? titles[chapter.n] ?? chapter.title : language === 'pt' ? portugueseTitles[chapter.n] ?? chapter.title : chapter.title
}
const parts: Record<string, string> = {
  Mechanics: 'Mecánica', 'Properties of Matter': 'Propiedades de la materia', Heat: 'Calor',
  'Sound and Light': 'Sonido y luz', 'Electricity and Magnetism': 'Electricidad y magnetismo',
  'Atomic and Nuclear Physics': 'Física atómica y nuclear',
}
export function textbookPartTitle(part: string, language: TextbookLanguage) {
  return language === 'es' ? parts[part] ?? part : language === 'pt' ? portugueseParts[part] ?? part : part
}

const portugueseTitles: Record<number, string> = {
  2: 'Equilíbrio mecânico', 3: 'Primeira lei de Newton: inércia', 4: 'Movimento retilíneo',
  5: 'Movimento de projéteis', 6: 'Segunda lei de Newton: força e aceleração',
  7: 'Terceira lei de Newton: ação e reação', 8: 'Quantidade de movimento', 9: 'Energia',
  10: 'Movimento circular', 11: 'Equilíbrio rotacional', 12: 'Movimento rotacional',
  13: 'Gravitação universal', 14: 'Movimento de satélites', 15: 'Relatividade especial: espaço e tempo',
  16: 'Relatividade: quantidade de movimento, massa, energia e gravidade', 17: 'A natureza atômica da matéria',
  18: 'Sólidos', 19: 'Líquidos', 20: 'Gases', 21: 'Temperatura, calor e dilatação',
  22: 'Transferência de calor', 23: 'Mudança de fase', 24: 'Termodinâmica', 25: 'Vibrações e ondas',
  26: 'Som', 27: 'Luz', 28: 'Cor', 29: 'Reflexão e refração', 30: 'Lentes',
  31: 'Difração e interferência', 32: 'Eletrostática', 33: 'Campos e potenciais elétricos',
  34: 'Corrente elétrica', 35: 'Circuitos elétricos', 36: 'Magnetismo',
  37: 'Indução eletromagnética', 38: 'O átomo e o quantum', 39: 'O núcleo atômico e a radioatividade',
  40: 'Fissão e fusão nucleares',
}
const portugueseParts: Record<string, string> = {
  Mechanics: 'Mecânica', 'Properties of Matter': 'Propriedades da matéria', Heat: 'Calor',
  'Sound and Light': 'Som e luz', 'Electricity and Magnetism': 'Eletricidade e magnetismo',
  'Atomic and Nuclear Physics': 'Física atômica e nuclear',
}

const readerCopy = {
  en: {
    libraryNavigation: 'Textbook navigation', hewittTextbook: 'Hewitt textbook', honorsTextbook: 'Honors textbook',
    readingSyllabus: 'Reading syllabus', readingAssignments: 'Reading dashboard',
    syllabusDescription: 'Sequence readings, vocabulary, and quizzes in the syllabus; manage assigned work in Reading assignments.',
    chapterNavigation: 'Chapter navigation', printedPage: 'Printed page', pageLabel: 'Page', goToPage: 'Go',
    textbook: 'Textbook', title: 'Conceptual Physics', chapter: 'Chapter', chapters: 'Chapters',
    previousChapter: 'Previous chapter', nextChapter: 'Next chapter', previous: 'Prev', next: 'Next',
    newTab: 'Open in new tab', chooseChapter: 'Choose a chapter.',
    teacherDescription: 'Assign pages and questions directly, then review the class’s answers for mastery.',
    studentDescription: 'Your assigned readings, saved answers, and teacher feedback are in one place.',
    teacherReadings: 'Assign & review readings', studentReadings: 'My reading assignments',
    previousPage: 'Previous textbook page', nextPage: 'Next textbook page', bookPage: 'Book page',
    zoomOut: 'Zoom out', zoomIn: 'Zoom in', bookNewTab: 'Open textbook in a new tab',
    previewError: 'The page preview couldn’t load.', retry: 'Try again', chapterNewTab: 'Open the chapter instead',
    loading: 'Loading page…', opening: 'Opening your textbook…',
  },
  es: {
    libraryNavigation: 'Navegación de libros', hewittTextbook: 'Libro de Hewitt', honorsTextbook: 'Libro de Honors',
    readingSyllabus: 'Plan de lecturas', readingAssignments: 'Panel de lecturas',
    syllabusDescription: 'Organiza lecturas, vocabulario y cuestionarios en el plan; gestiona el trabajo en Lecturas asignadas.',
    chapterNavigation: 'Navegación de capítulos', printedPage: 'Página impresa', pageLabel: 'Página', goToPage: 'Ir',
    textbook: 'Libro de texto', title: 'Física conceptual', chapter: 'Capítulo', chapters: 'Capítulos',
    previousChapter: 'Capítulo anterior', nextChapter: 'Capítulo siguiente', previous: 'Anterior', next: 'Siguiente',
    newTab: 'Abrir en otra pestaña', chooseChapter: 'Elige un capítulo.',
    teacherDescription: 'Asigna páginas y preguntas, y luego revisa las respuestas de la clase.',
    studentDescription: 'Tus lecturas asignadas, respuestas guardadas y comentarios del profesor están en un solo lugar.',
    teacherReadings: 'Asignar y revisar lecturas', studentReadings: 'Mis lecturas asignadas',
    previousPage: 'Página anterior', nextPage: 'Página siguiente', bookPage: 'Página del libro',
    zoomOut: 'Reducir', zoomIn: 'Ampliar', bookNewTab: 'Abrir el libro en otra pestaña',
    previewError: 'No se pudo abrir la versión en español. Inténtalo de nuevo o selecciona English.',
    retry: 'Intentar de nuevo', chapterNewTab: 'Abrir el capítulo en otra pestaña',
    loading: 'Cargando página…', opening: 'Cargando página…',
  },
  pt: {
    libraryNavigation: 'Navegação dos livros', hewittTextbook: 'Livro de Hewitt', honorsTextbook: 'Livro de Honors',
    readingSyllabus: 'Plano de leituras', readingAssignments: 'Painel de leituras',
    syllabusDescription: 'Organize leituras, vocabulário e questionários no plano; gerencie o trabalho em Leituras atribuídas.',
    chapterNavigation: 'Navegação de capítulos', printedPage: 'Página impressa', pageLabel: 'Página', goToPage: 'Ir',
    textbook: 'Livro didático', title: 'Física conceitual', chapter: 'Capítulo', chapters: 'Capítulos',
    previousChapter: 'Capítulo anterior', nextChapter: 'Próximo capítulo', previous: 'Anterior', next: 'Próximo',
    newTab: 'Abrir em outra aba', chooseChapter: 'Escolha um capítulo.',
    teacherDescription: 'Atribua páginas e questões e depois revise as respostas da turma.',
    studentDescription: 'Suas leituras, respostas salvas e comentários do professor estão em um só lugar.',
    teacherReadings: 'Atribuir e revisar leituras', studentReadings: 'Minhas leituras',
    previousPage: 'Página anterior', nextPage: 'Próxima página', bookPage: 'Página',
    zoomOut: 'Diminuir zoom', zoomIn: 'Aumentar zoom', bookNewTab: 'Abrir o livro em outra aba',
    previewError: 'Não foi possível abrir a versão em português. Tente novamente ou selecione outro idioma.',
    retry: 'Tentar novamente', chapterNewTab: 'Abrir o capítulo em outra aba',
    loading: 'Carregando página…', opening: 'Abrindo seu livro…',
  },
} satisfies Record<TextbookLanguage, Record<string, string>>

export function textbookReaderCopy(language: TextbookLanguage) { return readerCopy[language] }
export function textbookPreviewLabel(language: TextbookLanguage, page: number) {
  if (language === 'pt') return `Livro didático em português, página ${page}. Abra o capítulo em outra aba para ler o PDF completo.`
  if (language === 'es') return `Libro de texto en español, página ${page}. Abre el capítulo en otra pestaña para leer el PDF completo.`
  return `Textbook preview, printed page ${page}. Open the chapter in a new tab to read the full PDF.`
}
