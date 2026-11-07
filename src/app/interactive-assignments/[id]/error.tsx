'use client'

import {useState} from 'react'
import styles from '@/components/interactive-assignments/assignment.module.css'

/** Keep a useful diagnostic on screen; never reset or submit saved student work. */
export default function AssignmentError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 const [details]=useState(()=>typeof navigator==='undefined'?'':navigator.userAgent)
 return <main className={styles.page}>
  <h1>The assignment could not open</h1>
  <p>This screen has not changed your saved work. If you still have unsaved writing in another tab, keep that tab open.</p>
  <p>Try opening the assignment again. If it still fails, show your teacher the details below.</p>
  <button onClick={reset}>Try opening again</button>
  <details open><summary>Error details for your teacher</summary><p>Assignment recovery · November 5, 2026</p><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{error.name}: {error.message}{error.digest?'\nReference: '+error.digest:''}</pre><p style={{overflowWrap:'anywhere'}}>{details}</p></details>
  <a href="/home">Back to my assignments</a>
 </main>
}
