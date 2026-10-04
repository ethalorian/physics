// Restricted arithmetic parser. No eval, functions, assignments, or property access.
export function arithmetic(raw:string,variables:Record<string,number>={}):number|null{
 const normalized=raw.replaceAll('−','-').replaceAll('×','*').replaceAll('÷','/').replace(/\s/g,'');
 const tokens=normalized.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[A-Za-z][A-Za-z0-9]*|[()+*/^-]/g)||[];
 if(tokens.join('')!==normalized||tokens.length>100)return null;let i=0;
 const atom=():number=>{const t=tokens[i++];if(t==='('){const v=sum();if(tokens[i++]!==')')throw Error();return v;}if(t in variables)return variables[t];if(!t||!/^\d|^\./.test(t))throw Error();return Number(t)};
 const power=():number=>{const a=atom();if(tokens[i]==='^'){i++;return a**unary()}return a};
 const unary=():number=>{if(tokens[i]==='-'){i++;return -unary()}if(tokens[i]==='+'){i++;return unary()}return power()};
 const product=():number=>{let a=unary();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=unary();a=op==='*'?a*b:a/b}return a};
 const sum=():number=>{let a=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();a=op==='+'?a+b:a-b}return a};
 try{const v=sum();return i===tokens.length&&Number.isFinite(v)?v:null}catch{return null}
}
