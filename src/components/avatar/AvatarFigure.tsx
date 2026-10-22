import Avatar from "./Avatar"
import type { MeBundle } from "@/app/api/avatar/me/route"
import styles from "./avatar-figure.module.css"

/** Full painted figure uses the exact saved face, hair and wardrobe. */
export default function AvatarFigure({ portrait, pose = "standing" }: { portrait: MeBundle; pose?: "standing" | "side" | "walking" | "running" | "thinking" }) {
  return <span className={styles.figure} data-figure-pose={pose} aria-hidden="true"><Avatar traits={portrait.traits} equipped={{...portrait.equipped,background:undefined}} items={portrait.equipped_items} crop="figure" pose={pose} size={180} className={styles.body} decorative /></span>
}
