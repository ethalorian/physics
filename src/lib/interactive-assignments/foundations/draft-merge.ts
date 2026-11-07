export type DiscussionDrafts=Record<string,string>
export type DraftConflicts=Record<string,{local:string;remote:string}>
/** Three-way merge: never silently choose between two edits to the same field. */
export function mergeDiscussionDrafts(base:DiscussionDrafts,local:DiscussionDrafts,remote:DiscussionDrafts){
 const drafts:DiscussionDrafts={...remote},conflicts:DraftConflicts={}
 for(const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){
  const before=base[key]??'',mine=local[key]??'',theirs=remote[key]??''
  if(mine!==before){drafts[key]=mine;if(theirs!==before&&mine!==theirs)conflicts[key]={local:mine,remote:theirs}}
 }
 return {drafts,conflicts}
}
