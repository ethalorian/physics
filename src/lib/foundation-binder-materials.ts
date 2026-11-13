import type { ChoiceEdition } from './student-choice'

export function foundationBinderMaterials(day: number, edition: ChoiceEdition) {
  const root = '/foundations/unit-1'
  const dayFile = root + '/print/' + edition + '/day-' + String(day).padStart(2, '0')
  return {
    projector: root + '/projector.html?day=' + day + '&edition=' + edition,
    choiceSheet: dayFile + '-choice.pdf',
    seiPacket: dayFile + '-sei.pdf',
  }
}
