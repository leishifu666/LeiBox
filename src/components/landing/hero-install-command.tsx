import { CopyButton } from "@/components/docs/copy-button";
import { LEIBOX_SKILL_INSTALL_COMMAND } from "@/lib/leibox-skill";

export function HeroInstallCommand() {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 sm:mt-8">
      <code className="min-w-0 font-mono text-[11px] leading-5 tracking-tight whitespace-normal [overflow-wrap:anywhere] sm:text-[12px] sm:leading-6">
        {LEIBOX_SKILL_INSTALL_COMMAND}
      </code>
      <CopyButton text={LEIBOX_SKILL_INSTALL_COMMAND} className="shrink-0 text-white/70 hover:text-white" />
    </div>
  );
}
