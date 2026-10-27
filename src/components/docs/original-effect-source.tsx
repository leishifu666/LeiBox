import { T } from "@/components/common/language-provider";

/** Keep the restored local demo separate from upstream source distribution. */
export function OriginalEffectSource({slug,code=false}:{slug:string;code?:boolean}){
 return <div className="rounded-xl border border-border/60 p-4 text-sm leading-6 text-muted-foreground">
  <p><T>{code?"Source code and license are available from the original author.":"This local demo uses the original effect with LeiBox's selected background."}</T></p>
  <a href={`https://canvasui.dev/docs/components/${slug}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-foreground underline underline-offset-4"><T>Visit original author</T> ↗</a>
 </div>;
}
