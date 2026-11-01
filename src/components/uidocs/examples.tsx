import { useRef, useState } from "react";
import * as typewriter from "ascii.rest/pieces/typewriter";
import {
  ArrowUpRight,
  Ban,
  ChevronDown,
  Copy as CopyIcon,
  Download,
  FileDown,
  FileUp,
  LogOut,
  Moon,
  Pencil,
  PlugZap,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings,
  Sun,
  Trash2,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import * as demos from "@/components/uidocs/console";
import { DarkDemo, Tokens } from "@/components/uidocs/foundations";
import { AsciiArt } from "@/ui/ascii-art";
import { Barcode } from "@/ui/barcode";
import { Button, buttonClass } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Folio } from "@/ui/folio";
import { Kicker } from "@/ui/kicker";
import { Mark, MarkSetOut } from "@/ui/mark";
import { Plate } from "@/ui/plate";
import { Roundel } from "@/ui/roundel";
import { Screen } from "@/ui/screen";
import { SectionLabel } from "@/ui/section-label";
import { Stack } from "@/ui/stack";
import { Tex } from "@/ui/tex";
import { useDark } from "@/ui/use-dark";
import { useHydrated } from "@/ui/use-hydrated";
import { useMedia } from "@/ui/use-media";
import { useNear } from "@/ui/use-near";
import { useScale } from "@/ui/use-scale";

/*
 * A live example for each documented item, by its id: the published parts
 * themselves, from src/ui/, so what is shown is what an install gets.
 */

const PHRASES = { prefix: "parts: ", phrases: ["roundels.", "barcodes.", "registration marks.", "one ink."] };

/** An action's word and its icon, by lucide-react's name: the rule the Button's notes give. */
const VERBS: [word: string, Icon: LucideIcon, name: string][] = [
  ["Create", Plus, "Plus"],
  ["Edit", Pencil, "Pencil"],
  ["Delete", Trash2, "Trash2"],
  ["Save", Save, "Save"],
  ["Cancel", X, "X"],
  ["Copy", CopyIcon, "Copy"],
  ["Refresh", RefreshCw, "RefreshCw"],
  ["Export", FileDown, "FileDown"],
  ["Import", FileUp, "FileUp"],
  ["Upload", Upload, "Upload"],
  ["Download", Download, "Download"],
  ["Test", PlugZap, "PlugZap"],
  ["Send", Send, "Send"],
  ["Search", Search, "Search"],
  ["Revoke", Ban, "Ban"],
  ["Retry", RotateCcw, "RotateCcw"],
  ["Sign out", LogOut, "LogOut"],
  ["Settings", Settings, "Settings"],
];

/** Every button, the actions with their icons, the same in Chinese, and the verbs' icons; pressing one only says so here. */
function Buttons() {
  const [last, setLast] = useState("");
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "zh">("en");
  const say = (what: string) => () => setLast(what);
  return (
    <div className="ud-buttons">
      {/* one size a row: every box in a row is the same height, 40px at md, 30px at sm */}
      <p className="ud-row" data-size="md">
        <Button variant="go" icon={<Plus />} onClick={say("Create key")}>
          Create key
        </Button>
        <Button icon={<Pencil />} onClick={say("Edit")}>
          Edit
        </Button>
        <Button icon={<Trash2 />} onClick={say("Delete")}>
          Delete
        </Button>
        <Button icon={<Save />} disabled>
          Save
        </Button>
        <Button variant="ghost" icon={<RefreshCw />} onClick={say("Refresh")}>
          Refresh
        </Button>
        <Button variant="chip" aria-expanded={open} iconEnd={<ChevronDown />} onClick={() => setOpen((o) => !o)}>
          qwen-3.8
        </Button>
        <Button variant="icon" icon={<Download />} aria-label="Download" title="Download" onClick={say("Download")} />
        <Button variant="link" href="#button" iconEnd={<ArrowUpRight />}>
          Docs
        </Button>
      </p>
      <p className="ud-row" data-size="sm">
        <Button variant="go" size="sm" icon={<Send />} onClick={say("Send")}>
          Send
        </Button>
        <Button size="sm" icon={<X />} onClick={say("Cancel")}>
          Cancel
        </Button>
        <Button variant="ghost" size="sm" icon={<RefreshCw />} onClick={say("Refresh")}>
          Refresh
        </Button>
        <span className={buttonClass({ variant: "chip", size: "sm" }, "ud-quiet")}>a span, as a chip</span>
        <Button variant="icon" size="sm" icon={<Download />} aria-label="Download" title="Download" onClick={say("Download")} />
        <Button variant="link" size="sm" onClick={say("Sign out")}>
          Sign out
        </Button>
      </p>
      <p className="ud-row ud-row--tight" data-size="sm">
        <span className="ud-pair" role="group" aria-label="Language">
          <Button variant="ghost" size="sm" lang="en" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            EN
          </Button>
          <Button variant="ghost" size="sm" lang="zh-CN" aria-pressed={lang === "zh"} onClick={() => setLang("zh")}>
            中文
          </Button>
        </span>
        <Button variant="ghost" size="sm" icon={<Moon />} aria-label="Dark mode" title="Dark mode" onClick={say("Dark mode")} />
      </p>
      <p className="ud-row" lang="zh-CN" data-size="md">
        <Button variant="go" icon={<Plus />} onClick={say("新建用户")}>
          新建用户
        </Button>
        <Button icon={<Pencil />} onClick={say("编辑")}>
          编辑
        </Button>
        <Button icon={<Trash2 />} onClick={say("删除")}>
          删除
        </Button>
        <Button icon={<X />} onClick={say("取消")}>
          取消
        </Button>
        <Button variant="ghost" icon={<RefreshCw />} onClick={say("刷新")}>
          刷新
        </Button>
      </p>
      <p className="ud-row" lang="zh-CN" data-size="sm">
        <Button variant="go" size="sm" icon={<Save />} onClick={say("保存")}>
          保存
        </Button>
        <Button size="sm" icon={<X />} onClick={say("取消")}>
          取消
        </Button>
        <Button variant="ghost" size="sm" icon={<RefreshCw />} onClick={say("刷新")}>
          刷新
        </Button>
        <Button variant="chip" size="sm" iconEnd={<ChevronDown />} onClick={say("模型")}>
          模型
        </Button>
      </p>
      <p className="cap" aria-live="polite">
        {last ? `Pressed ${last}: nothing is sent from this page.` : "One size a row: 40px, then 30px; the head's controls; the same in Chinese (lang=\"zh-CN\"), at 40px and at 30px. Press one; the chip opens and closes, EN and 中文 take turns."}
      </p>
      <figure className="ud-verbs">
        <figcaption className="cap">An action and its icon, by lucide-react&rsquo;s name:</figcaption>
        <ul>
          {VERBS.map(([word, Icon, name]) => (
            <li key={word}>
              <Button size="sm" icon={<Icon />} onClick={say(word)}>
                {word}
              </Button>
              <code>{name}</code>
            </li>
          ))}
        </ul>
      </figure>
    </div>
  );
}

/** A head: the brand and the controls on one row, centred on it; its own language and night, to try without the page's. */
function HeadDemo({ start }: { start: "en" | "zh" }) {
  const [lang, setLang] = useState(start);
  const [night, setNight] = useState<boolean | null>(null);
  const page = useDark();
  const dark = night ?? page;
  const zh = lang === "zh";
  const mode = dark ? (zh ? "浅色模式" : "Light mode") : zh ? "深色模式" : "Dark mode";
  return (
    <header className="ud-head" lang={zh ? "zh-CN" : "en"} data-theme={night === null ? undefined : night ? "dark" : "light"}>
      <a className="ud-head__brand" href="#head" aria-label={zh ? "TokensBeat 控制台，首页" : "TokensBeat Console, home"}>
        <Mark className="ud-head__mark" />
        <b className="ud-head__name">TokensBeat</b>
        <span className="ud-head__product">{zh ? "控制台" : "Console"}</span>
      </a>
      <span className="ud-head__now">{zh ? "API 密钥" : "API keys"}</span>
      <div className="ud-head__controls">
        <div className="ud-head__lang" role="group" aria-label={zh ? "语言" : "Language"}>
          <Button variant="ghost" size="sm" lang="en" aria-pressed={!zh} onClick={() => setLang("en")}>
            EN
          </Button>
          <Button variant="ghost" size="sm" lang="zh-CN" aria-pressed={zh} onClick={() => setLang("zh")}>
            中文
          </Button>
        </div>
        <Button variant="ghost" size="sm" icon={dark ? <Sun /> : <Moon />} aria-label={mode} title={mode} onClick={() => setNight(!dark)} />
      </div>
    </header>
  );
}

function Heads() {
  return (
    <div className="ud-heads">
      <HeadDemo start="en" />
      <HeadDemo start="zh" />
      <p className="cap">In English and in Chinese. Press EN or 中文 to switch a head, the moon for its night; the page stays as it is.</p>
    </div>
  );
}

/** One hook's answer, for this page as it is now. */
function Readout({ label, value }: { label: string; value: string }) {
  return (
    <dl className="ud-readout">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </dl>
  );
}

function NearDemo() {
  const box = useRef<HTMLDivElement>(null);
  const near = useNear(box, "0px");
  return (
    <div ref={box}>
      <Readout label={'useNear(this box, "0px")'} value={String(near)} />
    </div>
  );
}

function MediaDemo() {
  const narrow = useMedia("(max-width: 760px)");
  const mouse = useMedia("(hover: hover) and (pointer: fine)");
  return (
    <dl className="ud-readout">
      <dt>useMedia(&quot;(max-width: 760px)&quot;)</dt>
      <dd>{String(narrow)}</dd>
      <dt>useMedia(&quot;(hover: hover) and (pointer: fine)&quot;)</dt>
      <dd>{String(mouse)}</dd>
    </dl>
  );
}

function DarkHookDemo() {
  return <Readout label="useDark()" value={String(useDark())} />;
}

function HydratedDemo() {
  return <Readout label="useHydrated()" value={`${useHydrated()}: the server wrote false`} />;
}

function ScaleDemo() {
  const drawing = useRef<SVGSVGElement>(null);
  const scale = useScale(drawing, 200);
  return (
    <>
      <Readout label="useScale(the bar below, 200)" value={`${scale.toFixed(2)} px a unit`} />
      <svg ref={drawing} className="ud-scalebar" viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden="true">
        <rect width="200" height="8" />
      </svg>
    </>
  );
}

/** A live example for each entry that has one, by its id. */
export function Demo({ id }: { id: string }) {
  switch (id) {
    case "tokens":
      return <Tokens />;
    case "dark":
      return <DarkDemo />;
    case "words":
      return <demos.WordsDemo />;
    case "head":
      return <Heads />;

    case "button":
      return <Buttons />;
    case "section-label":
      return (
        <div className="ud-labels">
          <SectionLabel as="p" ja="目次">
            Contents
          </SectionLabel>
          <SectionLabel as="p" ja="草">
            On GitHub
          </SectionLabel>
        </div>
      );
    case "kicker":
      return (
        <>
          <Kicker ja="随筆">Blog · No. 03</Kicker>
          <Kicker ja="部品">UI · a library from the issue</Kicker>
        </>
      );
    case "roundel":
      return (
        <>
          <p className="ud-row ud-roundels">
            {["T", "W", "I", "H", "A", "M", "L"].map((l) => (
              <Roundel key={l}>{l}</Roundel>
            ))}
          </p>
          <p className="ud-roundel-title">
            <Roundel hidden>T</Roundel> TokensBeat
          </p>
        </>
      );
    case "folio":
      return (
        <div className="ud-folio">
          <p className="cap">The foot of a spread:</p>
          <Folio page="04" />
        </div>
      );
    case "barcode":
      return (
        <div className="ud-row ud-row--top">
          <Barcode id="9a2ebab5-7807-4f7b-9dae-fd92fb716349" />
          <Barcode id="9a2ebab5-7807-4f7b-9dae-fd92fb716349" label={false} className="ud-bars" />
        </div>
      );
    case "stack":
      return <Stack items={["React 19", "TypeScript", "Vite 8", "plain CSS", "prerendered"]} />;
    case "screen":
      return (
        <Screen bar="tokensbeat.com" className="ud-screen">
          <img src="/assets/img/web-tokensbeat-home.webp" width={1600} height={1000} loading="lazy" alt="The TokensBeat home page: one gateway to many models." />
        </Screen>
      );
    case "plate":
      return (
        <Plate as="figure" className="ud-plate-demo">
          <Kicker ja="図">Plate</Kicker>
          <p>A hairline box, and a &ldquo;+&rdquo; where its edges would cross the next sheet&rsquo;s.</p>
        </Plate>
      );
    case "mark":
      return (
        <div className="ud-row">
          <Mark className="ud-mark ud-mark--64" />
          <Mark className="ud-mark ud-mark--32" />
          <Mark className="ud-mark ud-mark--18" />
          <MarkSetOut />
        </div>
      );
    case "ascii-art":
      return (
        <div className="ud-typer">
          <AsciiArt piece={typewriter} options={PHRASES} label="A typewriter typing the names of the parts" still="parts: roundels.▌" />
        </div>
      );
    case "tex":
      return (
        <div className="ud-tex">
          <p>
            Inline: <Tex>{String.raw`P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)}`}</Tex>, in the line.
          </p>
          <Tex block>{String.raw`\int_0^1 x^2\,dx = \tfrac{1}{3}`}</Tex>
        </div>
      );

    case "field":
      return <demos.FieldDemo />;
    case "input":
      return <demos.InputDemo />;
    case "textarea":
      return <demos.TextareaDemo />;
    case "select":
      return <demos.SelectDemo />;
    case "checkbox":
      return <demos.CheckboxDemo />;
    case "radio-group":
      return <demos.RadioDemo />;
    case "switch":
      return <demos.SwitchDemo />;
    case "slider":
      return <demos.SliderDemo />;

    case "table":
      return <demos.TableDemo />;
    case "pagination":
      return <demos.PaginationDemo />;
    case "badge":
      return <demos.BadgeDemo />;
    case "glyph":
      return <demos.GlyphDemo />;
    case "stat":
      return <demos.StatDemo />;
    case "meter":
      return <demos.MeterDemo />;
    case "description-list":
      return <demos.DescriptionDemo />;
    case "panel":
      return <demos.PanelDemo />;
    case "empty-state":
      return <demos.EmptyDemo />;

    case "dialog":
      return <demos.DialogDemo />;
    case "menu":
      return <demos.MenuDemo />;
    case "side-nav":
      return <demos.SideNavDemo />;
    case "tabs":
      return <demos.TabsDemo />;
    case "toast":
      return <demos.ToastDemo />;

    case "notice":
      return <demos.NoticeDemo />;
    case "spinner":
      return <demos.SpinnerDemo />;
    case "skeleton":
      return <demos.SkeletonDemo />;

    case "code":
      return <demos.CodeDemo />;
    case "copy":
      return <demos.CopyDemo />;
    case "secret":
      return <demos.SecretDemo />;
    case "visually-hidden":
      return <demos.HiddenDemo />;

    case "use-near":
      return <NearDemo />;
    case "use-media":
      return <MediaDemo />;
    case "use-dark":
      return <DarkHookDemo />;
    case "use-hydrated":
      return <HydratedDemo />;
    case "use-scale":
      return <ScaleDemo />;
    case "use-overflow":
      return <demos.OverflowDemo />;
    case "cn":
      return <Readout label={'cn("s1-btn", false && "is-on", ["s1-btn--go"], { "s1-btn--sm": true })'} value={`"${cn("s1-btn", false, ["s1-btn--go"], { "s1-btn--sm": true })}"`} />;
    default:
      return null;
  }
}
