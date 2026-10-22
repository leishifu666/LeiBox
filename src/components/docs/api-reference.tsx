import { T as TranslatedText } from "@/components/common/language-provider";

export interface ApiProp {
  /** Property name, rendered as code. */
  name: string;
  /** Short description shown under the name. */
  description: string;
  /** Type, rendered as a code chip. */
  type: string;
  /** Default value, rendered as a code chip. Omit for none. */
  defaultValue?: string;
}

export function ApiReference({ props }: { props: ApiProp[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th className="px-4 py-2.5 text-[13px] font-medium text-muted-foreground"><TranslatedText>
                Property
              </TranslatedText></th>
              <th className="px-4 py-2.5 text-[13px] font-medium text-muted-foreground"><TranslatedText>
                Type
              </TranslatedText></th>
              <th className="px-4 py-2.5 text-[13px] font-medium text-muted-foreground"><TranslatedText>
                Default
              </TranslatedText></th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop, index) => (
              <tr
                key={prop.name}
                className={
                  index < props.length - 1
                    ? "border-b border-border/40"
                    : undefined
                }
              >
                <td className="min-w-56 px-4 py-3.5 align-top">
                  <code className="font-mono text-[13px] font-medium text-foreground">
                    {prop.name}
                  </code>
                  <p className="mt-1 max-w-md text-[13px] leading-5 text-muted-foreground">
                    <TranslatedText>{prop.description}</TranslatedText>
                  </p>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <code className="inline-block rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12px] whitespace-nowrap text-foreground/80">
                    {prop.type}
                  </code>
                </td>
                <td className="px-4 py-3.5 align-top">
                  {prop.defaultValue !== undefined ? (
                    <code className="inline-block rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12px] whitespace-nowrap text-foreground/80">
                      {prop.defaultValue}
                    </code>
                  ) : (
                    <span aria-hidden className="text-muted-foreground/50"><TranslatedText>
                      &mdash;
                    </TranslatedText></span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
