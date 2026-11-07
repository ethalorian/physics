'use client'
import {Component,type ReactNode} from 'react'
/** A decorative portrait must never unmount a student's writing or submission controls. */
export default class FoundationAvatarBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<span role="img" aria-label="Avatar unavailable">◯</span>:this.props.children}
}
