/** Authored recurring directions. Keep the original reasoning and response requirements. */
export function readingEvaluationPrompt(topic: string): string {
  return `Choose one idea about **${topic}** from the assigned reading.\n\n1. **Explain the idea** in your own words.\n2. Point to a specific example, drawing, or calculation that is actually in the reading. **Explain how it supports the idea.**\n3. Name something the idea treats as true, **or** describe a situation where it would not work. Explain why.\n4. Someone says the idea works in **every situation**. Describe a measurement or observation that could show why that statement is too broad.`
}

export function readingTransferPrompt(topic: string): string {
  return `**Create a different everyday situation** that uses the idea of **${topic}**.\n\n1. Describe your setup and the starting values or facts.\n2. Use an explanation or equation from the reading to **predict what happens**. Show a labeled sketch, calculation, or connected explanation.\n3. Choose **one thing to change**. Explain how your prediction changes.\n4. Describe a test that could check your new prediction.`
}

export function readingExtensionPrompt(question: string): string {
  return `${question}\n\n**Go further:** Name one thing your calculation or explanation treats as true. Describe a situation where it would no longer hold. Explain how your answer would change.`
}

export function misconceptionPrompt(topic: string): string {
  return `**Create a new example about ${topic}** that could reveal a common mistake.\n\n1. Describe the setup and starting facts.\n2. Give the **correct answer and reasoning**.\n3. Give an incorrect answer that someone might think is right.\n4. Explain which measurements, observations, or calculations would help you tell the two explanations apart.`
}

export function vocabularyTransferPrompt(terms: string[]): string {
  return `**Create one situation that connects all these terms:** ${terms.join(', ')}. Use each term correctly.\n\n1. Choose **one thing to change** in your situation. Predict its effect.\n2. Explain what measurement or observation would help you check your prediction.`
}
