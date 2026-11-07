import questions from '@/data/foundations/cpa-questions.json'
import translations from '@/data/foundations/cpa-languages.json'
import {CPA_HINT,CPA_LEARN,CPA_EXIT} from './cpa'
const common: [string,string,string][] = [
 [CPA_HINT,'Sigue los pasos. Conserva el signo y la unidad. Cuando se pida, explica en una frase corta.','Siga os passos. Mantenha o sinal e a unidade. Quando pedido, explique em uma frase curta.'],
 [CPA_LEARN,'Lee las diapositivas indicadas. Resuelve cada paso en tu propia respuesta. Luego compara tus ideas con el grupo. Guarda tus propias respuestas.','Leia os slides indicados. Resolva cada passo na sua própria resposta. Depois compare suas ideias com o grupo. Guarde suas próprias respostas.'],
 [CPA_EXIT,'Trabaja por tu cuenta. Usa la ecuación o los pasos dados. Incluye unidades y una explicación corta cuando se pida.','Trabalhe sozinho. Use a equação ou os passos dados. Inclua unidades e uma explicação curta quando pedido.'],
 ['More measurements are needed. Moving toward Earth alone does not establish collision.','Se necesitan más mediciones. Moverse hacia la Tierra no basta para probar un choque.','São necessárias mais medidas. Mover-se em direção à Terra não basta para provar uma colisão.'],
 ['The cart adds 2 m each second; 4 + 2 = 6 m.','El carrito avanza 2 m cada segundo; 4 + 2 = 6 m.','O carrinho avança 2 m por segundo; 4 + 2 = 6 m.'],
 ['2 m west of the door; position does not state motion.','2 m al oeste de la puerta; la posición no dice cómo se mueve.','2 m a oeste da porta; a posição não diz como se move.'],
 ['12 m of path.','12 m de camino.','12 m de caminho.'],
 ['13 step-lengths.','13 pasos de distancia.','13 passos de distância.'],
 ['Steady positive velocity, not rest.','Velocidad positiva constante; no está quieto.','Velocidade positiva constante; não está parado.'],
 ['Slide without turning or stretching.','Desliza sin girar ni estirar.','Deslize sem girar nem esticar.'],
 ['10 N east.','10 N al este.','10 N para leste.'],
 ['Velocity changes by +2 m/s each second.','La velocidad cambia +2 m/s cada segundo.','A velocidade muda +2 m/s por segundo.'],
 ['Earth supplies gravity.','La Tierra ejerce la gravedad.','A Terra exerce a gravidade.'],
 ['Add mass to cart and leave hanger fixed.','Añade masa al carrito y deja igual la masa colgante.','Adicione massa ao carrinho e mantenha a massa pendurada.'],
 ['Transfer a weight from cart to hanger.','Transfiere una pesa del carrito al portapesas.','Transfira um peso do carrinho para o suporte pendurado.'],
]
const formulaOnly=['6 + (−2) = +4 m.','3,200,000 + 50,000 = 3,250,000 km.','(15−3)/4 = +3 m/s².','v² = v₀² + 2aΔx.']
export const CPA_LANGUAGE:Record<'es'|'pt-BR',Record<string,string>>={es:{},'pt-BR':{}}
for(const [source,es,pt] of common){CPA_LANGUAGE.es[source]=es;CPA_LANGUAGE['pt-BR'][source]=pt}
for(const source of formulaOnly){CPA_LANGUAGE.es[source]=source;CPA_LANGUAGE['pt-BR'][source]=source}
for(const id of Object.keys(questions) as (keyof typeof questions)[]){
 CPA_LANGUAGE.es[questions[id].prompt]=translations[id].es
 CPA_LANGUAGE['pt-BR'][questions[id].prompt]=translations[id]['pt-BR']
}
