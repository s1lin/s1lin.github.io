import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  Ban,
  BookOpen,
  Check,
  Clapperboard,
  Code as CodeIcon,
  Eraser,
  FileDown,
  Folder,
  Image as ImageIcon,
  KeyRound,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings,
  Store,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Code } from "@/ui/code";
import { Copy } from "@/ui/copy";
import { DescriptionList } from "@/ui/description-list";
import { Dialog } from "@/ui/dialog";
import { EmptyState } from "@/ui/empty-state";
import { Field, Fieldset } from "@/ui/field";
import { Glyph, type Status } from "@/ui/glyph";
import { Input } from "@/ui/input";
import { LangSwitch, type LangSwitchLinkProps } from "@/ui/lang-switch";
import { Menu } from "@/ui/menu";
import { Meter } from "@/ui/meter";
import { MetroGlyph, MetroMap, metroHue, type MetroAxis, type MetroColour, type MetroFare, type MetroInterchange, type MetroLine, type MetroStatus, type MetroZone } from "@/ui/metro-map";
import { Notice } from "@/ui/notice";
import { Pagination } from "@/ui/pagination";
import { Panel } from "@/ui/panel";
import { RadioGroup } from "@/ui/radio-group";
import { Secret } from "@/ui/secret";
import { Select } from "@/ui/select";
import { SideNav, type SideNavSection } from "@/ui/side-nav";
import { Skeleton } from "@/ui/skeleton";
import { Slider } from "@/ui/slider";
import { Spinner } from "@/ui/spinner";
import { Stat, StatGroup } from "@/ui/stat";
import { Switch } from "@/ui/switch";
import { Table, type Column, type Sort } from "@/ui/table";
import { Tabs } from "@/ui/tabs";
import { Textarea } from "@/ui/textarea";
import { Timetable, TimetableMark, TimetableRail } from "@/ui/timetable";
import { toast } from "@/ui/toast";
import { useOverflow } from "@/ui/use-overflow";
import { VisuallyHidden } from "@/ui/visually-hidden";
import { S1Words, type S1WordMap } from "@/ui/words";

/*
 * The live examples of the console's parts: forms, data, overlays, feedback,
 * text. Made-up keys and figures; nothing is sent from this page.
 */

const STATUSES: Status[] = ["neutral", "info", "ok", "warn", "bad"];
const KEY = "sk-tb-4f7c9e2a81d04b6f93a5c0e7d2b18f6a";

/** A line saying what was pressed, since nothing here goes anywhere. */
function Said({ text }: { text: string }) {
  return (
    <p className="cap ud-said" aria-live="polite">
      {text}
    </p>
  );
}

// ------------------------------------------------------------------ forms

/** A key's name and scopes, checked on submit: the errors appear, and focus goes to the first. */
export function FieldDemo() {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [tried, setTried] = useState(false);
  const [said, setSaid] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const nameError = tried && !name.trim() ? "Give the key a name." : undefined;
  const scopeError = tried && scopes.length === 0 ? "Choose at least one scope." : undefined;
  const toggle = (s: string) => setScopes((v) => (v.includes(s) ? v.filter((x) => x !== s) : [...v, s]));

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!name.trim() || scopes.length === 0) {
      setSaid("");
      // after the errors render: focus the first control in error
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"], .s1-fieldset[aria-describedby] input')?.focus());
      return;
    }
    setSaid(`Checked: "${name.trim()}" with ${scopes.join(", ")}. Nothing is sent from this page.`);
  }

  return (
    <form ref={form} className="ud-form" onSubmit={submit} noValidate>
      <Field label="Key name" required hint="Shown in your list of keys." error={nameError} aside={`${name.length}/40`}>
        <Input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="prod-backend" autoComplete="off" />
      </Field>
      <Fieldset legend="Scopes" required hint="What the key may call." error={scopeError}>
        {["chat", "images", "video"].map((s) => (
          <Checkbox key={s} name="scope" value={s} checked={scopes.includes(s)} onChange={() => toggle(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </Checkbox>
        ))}
      </Fieldset>
      <Field label="Workspace" disabled hint="Keys belong to the workspace you are in.">
        <Input value="s1lin" readOnly />
      </Field>
      <p className="ud-row">
        <Button variant="go" type="submit" icon={<Check />}>
          Check
        </Button>
        <Button
          type="button"
          icon={<Eraser />}
          onClick={() => {
            setName("");
            setScopes([]);
            setTried(false);
            setSaid("");
          }}
        >
          Clear
        </Button>
      </p>
      <Said text={said || "Press Check with the form empty to see the errors."} />
    </form>
  );
}

export function InputDemo() {
  const [coupon, setCoupon] = useState("");
  const [said, setSaid] = useState("");
  return (
    <div className="ud-grid2">
      <Field label="Amount" hint="At least $5.">
        <Input type="number" inputMode="decimal" min={5} step={1} defaultValue={20} prefix="$" suffix="USD" />
      </Field>
      <Field label="Password">
        <Input type="password" defaultValue="hunter22" autoComplete="off" />
      </Field>
      <Field label="Coupon" error={said === "bad" ? "That code has expired." : undefined}>
        <Input
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
          placeholder="SPRING26"
          action={
            <Button variant="ghost" icon={<Check />} onClick={() => setSaid(coupon ? "bad" : "")}>
              Apply
            </Button>
          }
        />
      </Field>
      <Field label="Base URL" disabled>
        <Input defaultValue="https://api.tokensbeat.com/v1" />
      </Field>
      <div lang="zh-CN">
        <Field label="优惠码" hint="每个账户限用一次。">
          <Input
            placeholder="SPRING26"
            action={
              <Button variant="ghost" icon={<Check />} onClick={() => setSaid("")}>
                使用
              </Button>
            }
          />
        </Field>
      </div>
      <div>
        <Input
          type="search"
          size="sm"
          aria-label="Search keys"
          placeholder="Search keys (sm)"
          action={
            <Button variant="ghost" size="sm" icon={<Search />}>
              Search
            </Button>
          }
        />
      </div>
    </div>
  );
}

export function TextareaDemo() {
  const [note, setNote] = useState("Calls from the nightly batch job.");
  return (
    <div className="ud-grid2">
      <Field label="What is it for?" hint="It grows as you type, up to eight lines." aside={`${note.length}/280`}>
        <Textarea grow rows={2} maxRows={8} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <Field label="Notes" disabled>
        <Textarea rows={2} defaultValue="Locked while the key is revoked." />
      </Field>
    </div>
  );
}

const MODELS = ["qwen-3.8", "qwen3.8-27b-cyber", "gpt-image-2", "gemini-3.1-flash-image"];

export function SelectDemo() {
  const [model, setModel] = useState("");
  return (
    <div className="ud-grid2">
      <Field label="Model" required error={model ? undefined : "Choose the model this key may call."}>
        <Select placeholder="Choose a model" required value={model} onChange={(e) => setModel(e.target.value)}>
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Region" disabled>
        <Select defaultValue="auto">
          <option value="auto">Nearest</option>
        </Select>
      </Field>
      <div className="ud-span2 ud-row">
        <Select size="sm" aria-label="Rows a page" defaultValue="20" className="ud-narrow">
          <option value="20">20 a page</option>
          <option value="50">50 a page</option>
          <option value="100">100 a page</option>
        </Select>
      </div>
    </div>
  );
}

export function CheckboxDemo() {
  const [scopes, setScopes] = useState(["chat"]);
  const ALL = ["chat", "images", "video"];
  const all = scopes.length === ALL.length;
  return (
    <div className="ud-stack">
      <Checkbox checked={all} indeterminate={!all && scopes.length > 0} onChange={() => setScopes(all ? [] : ALL)}>
        All scopes
      </Checkbox>
      <div className="ud-indent ud-stack">
        {ALL.map((s) => (
          <Checkbox key={s} checked={scopes.includes(s)} onChange={() => setScopes((v) => (v.includes(s) ? v.filter((x) => x !== s) : [...v, s]))}>
            {s[0].toUpperCase() + s.slice(1)}
          </Checkbox>
        ))}
      </div>
      <Checkbox defaultChecked hint="A copy of each invoice goes to the account's address.">
        Email invoices
      </Checkbox>
      <Checkbox disabled>Admin (ask an owner)</Checkbox>
      <Checkbox disabled defaultChecked>
        Read usage
      </Checkbox>
    </div>
  );
}

export function RadioDemo() {
  const [amount, setAmount] = useState("20");
  return (
    <div className="ud-stack ud-stack--wide">
      <RadioGroup
        legend="Amount"
        variant="cards"
        value={amount}
        onValueChange={setAmount}
        hint="Credit never expires."
        options={[
          { value: "5", label: "$5", hint: "the least" },
          { value: "20", label: "$20", hint: "about 4M tokens" },
          { value: "50", label: "$50", hint: "about 10M tokens" },
          { value: "500", label: "$500", hint: "ask us", disabled: true },
        ]}
      />
      <RadioGroup legend="Range" variant="segmented" defaultValue="7d" options={["24h", "7d", "30d", "90d"].map((r) => ({ value: r, label: r }))} />
      <div className="ud-toolbar">
        <RadioGroup legend="Range" hideLegend variant="dots" defaultValue="7d" options={["24h", "7d", "30d", "90d"].map((r) => ({ value: r, label: r }))} />
        <span className="ud-toolbar__end">
          <Button variant="ghost" size="sm" icon={<RefreshCw />}>
            Refresh
          </Button>
          <Button variant="ghost" size="sm" icon={<FileDown />}>
            Export
          </Button>
        </span>
      </div>
      <div className="ud-toolbar" lang="zh-CN">
        <RadioGroup
          legend="时间范围"
          hideLegend
          variant="dots"
          defaultValue="7d"
          options={[
            { value: "24h", label: "24 小时" },
            { value: "7d", label: "7 天" },
            { value: "30d", label: "30 天" },
          ]}
        />
        <RadioGroup
          legend="视图"
          hideLegend
          variant="dots"
          defaultValue="chart"
          options={[
            { value: "chart", label: "图表" },
            { value: "table", label: "表格" },
          ]}
        />
      </div>
      <RadioGroup
        legend="When the budget runs out"
        error="Choose what happens at the limit."
        required
        options={[
          { value: "pause", label: "Pause the keys", hint: "Requests fail with 402 until you top up." },
          { value: "allow", label: "Keep going", hint: "Spend goes on to the card on file." },
        ]}
      />
    </div>
  );
}

export function SwitchDemo() {
  const [alerts, setAlerts] = useState(true);
  return (
    <div className="ud-settings">
      <Switch reverse checked={alerts} onChange={(e) => setAlerts(e.target.checked)} hint="When spend passes 80% of the budget.">
        Email me
      </Switch>
      <Switch reverse defaultChecked={false}>
        Log request bodies
      </Switch>
      <Switch reverse disabled hint="Owners only.">
        Allow new keys
      </Switch>
      <Switch reverse disabled defaultChecked hint="Set by the organisation.">
        Keep audit logs
      </Switch>
      <Switch defaultChecked>Beside its label</Switch>
    </div>
  );
}

/** The setting a console has it for: how dark its hairlines are, drawn live in a ledger beside it. */
export function SliderDemo() {
  const [contrast, setContrast] = useState(14);
  return (
    <div className="ud-grid2">
      <div className="ud-stack ud-stack--wide">
        <Slider
          label="Line contrast"
          min={0}
          max={60}
          step={2}
          value={contrast}
          onValueChange={setContrast}
          format={(v) => `${v}%`}
          hint="How dark the hairlines between rows are drawn."
          marks={[
            { value: 0, label: "None" },
            { value: 14, label: "Default" },
            { value: 60, label: "Strong" },
          ]}
        />
        <Slider label="Temperature" min={0} max={2} step={0.1} defaultValue={0.7} format={(v) => v.toFixed(1)} marks={[0, 1, 2]} />
        <Slider label="Warn at" min={50} max={100} step={5} defaultValue={80} format={(v) => `${v}%`} disabled hint="Owners only." />
      </div>
      <ul className="ud-ledger" style={{ "--ud-line": `${contrast}%` } as CSSProperties} aria-label="Keys, ruled at that contrast">
        {KEYS.slice(0, 4).map((k) => (
          <li key={k.id}>
            <span>{k.name}</span>
            <span className="mono">{usd(k.spend)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ data

interface Key {
  id: string;
  name: string;
  prefix: string;
  status: Status;
  state: string;
  created: string;
  spend: number;
}

const KEYS: Key[] = [
  { id: "k1", name: "prod-backend", prefix: "sk-tb-4f7c", status: "ok", state: "Active", created: "2026-09-02", spend: 41.2 },
  { id: "k2", name: "nightly-batch", prefix: "sk-tb-91ae", status: "warn", state: "90% used", created: "2026-08-17", spend: 88.04 },
  { id: "k3", name: "staging", prefix: "sk-tb-0c3d", status: "neutral", state: "Off", created: "2026-07-30", spend: 0.6 },
  { id: "k4", name: "old-laptop", prefix: "sk-tb-77b2", status: "bad", state: "Revoked", created: "2026-03-11", spend: 3.15 },
  { id: "k5", name: "eval-harness", prefix: "sk-tb-e5f0", status: "info", state: "Read only", created: "2026-10-20", spend: 12.9 },
];
const usd = (n: number) => `$${n.toFixed(2)}`;

export function TableDemo() {
  const [view, setView] = useState("rows");
  const [sort, setSort] = useState<Sort | null>({ key: "spend", dir: "desc" });
  const [page, setPage] = useState(1);
  const [said, setSaid] = useState("");
  const rows = [...KEYS].sort((a, b) => {
    if (!sort) return 0;
    const d = sort.key === "spend" ? a.spend - b.spend : a[sort.key as "name" | "created"].localeCompare(b[sort.key as "name" | "created"]);
    return sort.dir === "asc" ? d : -d;
  });
  const columns: Column<Key>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "prefix", header: "Key", cell: (k) => <Code>{`${k.prefix}…`}</Code> },
    { key: "status", header: "Status", cell: (k) => <Badge status={k.status}>{k.state}</Badge> },
    { key: "created", header: "Created", sortable: true },
    { key: "spend", header: "Spend", numeric: true, sortable: true, cell: (k) => usd(k.spend) },
  ];
  return (
    <div className="ud-stack ud-stack--wide">
      <RadioGroup
        legend="Show"
        variant="segmented"
        value={view}
        onValueChange={setView}
        options={[
          { value: "rows", label: "Rows" },
          { value: "empty", label: "Empty" },
          { value: "loading", label: "Loading" },
        ]}
      />
      <Table
        caption="API keys"
        columns={columns}
        rows={view === "rows" ? rows : []}
        rowKey="id"
        loading={view === "loading" ? 3 : false}
        sort={sort}
        onSortChange={setSort}
        empty={
          <EmptyState size="sm" title="No keys yet" action={<Button variant="go" size="sm" icon={<Plus />} onClick={() => setView("rows")}>Create key</Button>}>
            <p>A key lets an app call the models on your balance.</p>
          </EmptyState>
        }
        actions={(k) => (
          <Menu
            variant="icon"
            size="sm"
            align="end"
            label={`Actions for ${k.name}`}
            items={[
              { label: "Rename", onSelect: () => setSaid(`Rename ${k.name}`) },
              { label: "Usage", onSelect: () => setSaid(`Usage of ${k.name}`) },
              "separator",
              { label: "Revoke", danger: true, disabled: k.status === "bad", onSelect: () => setSaid(`Revoke ${k.name}`) },
            ]}
          />
        )}
      />
      <Pagination page={page} pageCount={12} onPageChange={setPage} summary={`${(page - 1) * 5 + 1}–${page * 5} of 58`} />
      <Said text={said ? `Chose ${said}: nothing is sent from this page.` : "Sort by a header, open a row's ⋯, change the page; on a phone the table scrolls in its frame."} />
    </div>
  );
}

// ------------------------------------------------------------------ metro

type Fare = [id: string, input: number, output: number];
type Family = { id: string; name: string; colour: MetroColour; fares: Fare[] };

/** Made-up prices by family, in the order an app keeps its lines (USD per 1M tokens). Output 0: priced on input. */
const FAMILIES: Family[] = [
  { id: "gpt", name: "GPT", colour: { light: "#156d8b", dark: "#4ec7dc" }, fares: [["gpt-5.5-nano", 0.05, 0.4], ["gpt-5.5-mini", 0.25, 2], ["gpt-5.5", 1.25, 10], ["gpt-5.5-codex", 1.25, 10], ["gpt-realtime-2", 4, 16]] },
  { id: "claude", name: "Claude", colour: { light: "#732c04", dark: "#f0a16a" }, fares: [["claude-haiku-5", 1, 5], ["claude-sonnet-5", 3, 15], ["claude-opus-5", 15, 75]] },
  { id: "gemini", name: "Gemini", colour: { light: "#c21919", dark: "#f44a37" }, fares: [["gemini-embedding-2", 0.15, 0], ["gemini-3.8-flash-lite", 0.1, 0.4], ["gemini-3.8-flash", 0.3, 2.5], ["gemini-3.8-pro", 2, 12]] },
  { id: "deepseek", name: "DeepSeek", colour: { light: "#0126ac", dark: "#2896f5" }, fares: [["deepseek-v4", 0.56, 1.68], ["deepseek-v4-pro", 1.1, 4.4]] },
  { id: "kimi", name: "Kimi", colour: { light: "#b0286c", dark: "#f58fc2" }, fares: [["kimi-k3", 0.6, 2.5]] },
  { id: "glm", name: "GLM", colour: { light: "#1e7424", dark: "#6ece6f" }, fares: [["glm-5", 0.6, 2.2]] },
  { id: "grok", name: "Grok", colour: { light: "#4d4d4d", dark: "#b3b3b3" }, fares: [["grok-4-3-mini", 0.3, 0.4], ["grok-4-3", 3, 15]] },
  { id: "qwen", name: "Qwen", colour: { light: "#5b48d6", dark: "#b3a4ff" }, fares: [["qwen-3.8", 0.4, 1.6], ["qwen-3.8-coder", 0.45, 1.8]] },
];

/** Two decimals, or as many as the price has: 0.05, 1.25, 0.125. */
const price = (n: number) => n.toFixed(Math.max(2, (String(n).split(".")[1] ?? "").length));
const dollars = (v: number) => `$${v < 1 ? price(v) : String(Number(v.toPrecision(3)))}`;
const ZONE_EDGES: [number | null, number | null][] = [[null, 0.5], [0.5, 2], [2, 8], [8, 20], [20, null]];

function zonesFor(zh: boolean): MetroZone[] {
  return ZONE_EDGES.map(([from, to], i) => {
    const range = from == null ? (zh ? `低于 ${dollars(to!)}` : `under ${dollars(to!)}`) : to == null ? (zh ? `${dollars(from)} 起` : `${dollars(from)} and up`) : `${dollars(from)}–${String(to)}`;
    return { id: `z${i + 1}`, from, to, name: zh ? `${i + 1} 区 · ${range}` : `Zone ${i + 1} · ${range}` };
  });
}

/**
 * Made-up last 24 hours for a station, as an app would give them: most normal; one degraded this hour, one down,
 * and one with nothing measured yet. The words are the app's, in its language.
 */
function statusOf(id: string, zh: boolean): MetroStatus {
  const hours = (bad: number[], warn: number[], none: number[]) =>
    Array.from({ length: 24 }, (_, i) => (bad.includes(i) ? "bad" : warn.includes(i) ? "warn" : none.includes(i) ? "neutral" : "ok") as Status);
  const said = (cells: Status[]) => {
    const n = (t: Status) => cells.filter((c) => c === t).length;
    return zh
      ? `过去 24 小时：${n("ok")} 小时正常，${n("warn")} 小时降级，${n("bad")} 小时中断，${n("neutral")} 小时无数据`
      : `last 24 hours: ${n("ok")} normal, ${n("warn")} degraded, ${n("bad")} down, ${n("neutral")} without data`;
  };
  if (id === "claude-sonnet-5") {
    const cells = hours([], [9, 10, 23], [0]);
    return { label: zh ? "降级" : "Degraded", tone: "warn", cells, summary: said(cells) };
  }
  if (id === "deepseek-v4-pro") {
    const cells = hours([21, 22, 23], [20], []);
    return { label: zh ? "中断" : "Down", tone: "bad", cells, summary: said(cells) };
  }
  if (id === "glm-5") return { label: zh ? "暂无状态" : "No status yet", tone: "neutral" };
  const cells = hours([], id.length % 5 === 0 ? [14] : [], id.length % 3 === 0 ? [0, 1] : []);
  return { label: zh ? "正常" : "Normal", tone: "ok", cells, summary: said(cells) };
}

function fareLines(zh: boolean, status = false): MetroLine[] {
  return FAMILIES.map((f) => ({
    id: f.id,
    name: f.name,
    colour: f.colour,
    stations: f.fares.map(([id, input, output]) => ({
      id,
      label: id,
      href: "#metro-map",
      x: output || input,
      kind: output ? ("stop" as const) : ("input" as const),
      value: `${price(input)} / ${price(output)}`,
      note: output ? (zh ? "输入 / 输出，每百万 token 美元" : "Input / output, USD per 1M tokens") : zh ? "按输入计价，输出免费" : "Priced on input; output is free",
      figures: { input, output },
      status: status ? statusOf(id, zh) : undefined,
    })),
  }));
}

/** Some stations without a price (not drawn), a line without stations (left off), fewer lines. */
const partly = (lines: MetroLine[]): MetroLine[] => [
  { ...lines[0], stations: lines[0].stations.map((s, i) => (i % 2 ? { ...s, x: null } : s)) },
  { ...lines[1], stations: [] },
  lines[3],
  lines[6],
];

const AXIS_EN: MetroAxis = { ticks: [0.1, 0.5, 1, 2, 5, 10, 20, 50], format: dollars, cue: { start: "← Cheaper", end: "Pricier →" } };
const AXIS_ZH: MetroAxis = { ...AXIS_EN, cue: { start: "← 更便宜", end: "更贵 →" } };
const fareTag = (f: MetroFare) => (f.exact ? `$${price(f.min)}` : `$${price(f.min)}–${price(f.max)}`);
const INTER_EN: MetroInterchange = { label: fareTag, tip: "Same price: change here." };
const INTER_ZH: MetroInterchange = { label: fareTag, tip: "同价，可在此换乘。", announce: (s, fare) => `同价：${s.map((x) => x.label).join("、")}，${fare}` };

/** The kit's words in Chinese for the map and the board, as an app would give them. */
const METRO_ZH: Partial<S1WordMap> = {
  sameFare: "同价",
  and: " 和 ",
  empty: "这里还没有内容。",
  loading: "加载中",
  scrollHint: "左右滑动查看更多",
  sortAscending: "升序",
  sortDescending: "降序",
  sortNone: "排序",
  expandAll: "全部展开",
  collapseAll: "全部收起",
};

/** The examples' language: a LangSwitch, the words with a dot under the one in force, as every head has it. */
function Language({ lang, onChange }: { lang: string; onChange: (v: string) => void }) {
  return (
    <LangSwitch
      label="Language"
      value={lang}
      onValueChange={onChange}
      options={[
        { value: "en", label: "EN", name: "English", lang: "en" },
        { value: "zh", label: "中文", lang: "zh-CN" },
      ]}
    />
  );
}

function MapLegend({ zh }: { zh: boolean }) {
  return zh ? (
    <>
      美元 / 每百万 token · 对数刻度 · <MetroGlyph kind="stop" />站 · <MetroGlyph kind="input" />按输入计价 · <MetroGlyph kind="interchange" />同价换乘
    </>
  ) : (
    <>
      USD per 1M tokens · log scale · <MetroGlyph kind="stop" />stop · <MetroGlyph kind="input" />priced on input · <MetroGlyph kind="interchange" />same fare
    </>
  );
}

export function MetroDemo() {
  const [lang, setLang] = useState("en");
  const [layout, setLayout] = useState("auto");
  const [show, setShow] = useState("prices");
  const [trains, setTrains] = useState(true);
  const [status, setStatus] = useState(true);
  const zh = lang === "zh";
  const lines = useMemo(() => fareLines(zh, status), [zh, status]);
  const zones = useMemo(() => zonesFor(zh), [zh]);
  const shown = show === "prices" || show === "order" ? lines : show === "partly" ? partly(lines) : [];
  const byPrice = show !== "order";
  return (
    <div className="ud-stack ud-stack--wide">
      <div className="ud-row">
        <Language lang={lang} onChange={setLang} />
        <RadioGroup
          legend="Layout"
          variant="segmented"
          value={layout}
          onValueChange={setLayout}
          options={[
            { value: "auto", label: "Auto" },
            { value: "across", label: "Across" },
            { value: "down", label: "Down" },
          ]}
        />
        <RadioGroup
          legend="Show"
          variant="segmented"
          value={show}
          onValueChange={setShow}
          options={[
            { value: "prices", label: "By price" },
            { value: "order", label: "In order" },
            { value: "partly", label: "Partly" },
            { value: "loading", label: "Loading" },
            { value: "empty", label: "Empty" },
          ]}
        />
        <Switch checked={trains} onChange={(e) => setTrains(e.target.checked)}>
          Trains
        </Switch>
        <Switch checked={status} onChange={(e) => setStatus(e.target.checked)}>
          Status
        </Switch>
      </div>
      <S1Words words={zh ? METRO_ZH : {}}>
        <div lang={zh ? "zh-CN" : "en"} className="ud-min">
          <MetroMap
            lines={shown}
            axis={byPrice ? (zh ? AXIS_ZH : AXIS_EN) : undefined}
            zones={byPrice ? zones : undefined}
            interchange={zh ? INTER_ZH : INTER_EN}
            loading={show === "loading"}
            layout={layout as "auto" | "across" | "down"}
            trains={trains}
            label={zh ? "按家族和输出价绘制的模型价格地图" : "Prices of the models, by family and output price"}
            caption={
              byPrice
                ? zh
                  ? "一个家族一条线，按输出价定位，左边便宜，右边贵。价格为示例。"
                  : "One line a family, each stop at its output price: cheaper on the left, pricier on the right. The prices are made up."
                : zh
                  ? "没有坐标轴：每条线上的站按顺序等距排列。"
                  : "No axis: each line's stations evenly spaced, in their order."
            }
            legend={byPrice && <MapLegend zh={zh} />}
          />
        </div>
      </S1Words>
      <Said text="Point at a line, a stop or an interchange, or Tab through them: each stop is a link to this entry; Esc closes a tooltip. With Status, each card ends in the station's last 24 hours (claude-sonnet-5 degraded, deepseek-v4-pro down, glm-5 not measured yet)." />
    </div>
  );
}

interface FareRow {
  family: Family;
  id: string;
  input: number;
  output: number;
}

export function TimetableDemo() {
  const [lang, setLang] = useState("en");
  const [board, setBoard] = useState(false);
  const [sort, setSort] = useState<Sort | null>({ key: "output", dir: "asc" });
  const [lit, setLit] = useState<string[] | null>(null);
  const zh = lang === "zh";
  const lines = useMemo(() => fareLines(zh), [zh]);
  const zones = useMemo(() => zonesFor(zh), [zh]);
  const cheapest = useMemo(() => new Set(FAMILIES.map((f) => [...f.fares].sort((a, b) => (a[2] || a[1]) - (b[2] || b[1]))[0][0])), []);
  const sorted = (rows: FareRow[]) =>
    sort ? [...rows].sort((a, b) => (sort.key === "model" ? a.id.localeCompare(b.id) : a[sort.key as "input" | "output"] - b[sort.key as "input" | "output"]) * (sort.dir === "asc" ? 1 : -1)) : rows;
  const columns: Column<FareRow>[] = [
    { key: "model", header: zh ? "模型" : "Model", sortable: true, cell: (r) => <a href="#timetable">{r.id}</a> },
    { key: "input", header: zh ? "输入" : "Input", numeric: true, sortable: true, cell: (r) => `$${price(r.input)}` },
    { key: "output", header: zh ? "输出" : "Output", numeric: true, sortable: true, cell: (r) => `$${price(r.output)}` },
  ];
  return (
    <div className="ud-stack ud-stack--wide">
      <div className="ud-row">
        <Language lang={lang} onChange={setLang} />
        <Switch checked={board} onChange={(e) => setBoard(e.target.checked)}>
          Board
        </Switch>
      </div>
      <S1Words words={zh ? METRO_ZH : {}}>
        <div lang={zh ? "zh-CN" : "en"} className="ud-min ud-stack ud-stack--wide">
          <MetroMap
            lines={lines.slice(0, 4)}
            axis={zh ? AXIS_ZH : AXIS_EN}
            zones={zones}
            interchange={zh ? INTER_ZH : INTER_EN}
            trains={false}
            lit={lit}
            onLit={setLit}
            details="timetable-demo"
            caption={zh ? "指向一行，地图上对应的站亮起；指向一站，表格里对应的行亮起。" : "Point at a row and its station lights up; point at a station and its rows light up."}
          />
          <Timetable<FareRow>
            id="timetable-demo"
            board={board}
            caption={zh ? "每个模型的价格，按家族" : "Prices of every model, by family"}
            columns={columns}
            rowKey="id"
            sort={sort}
            onSortChange={setSort}
            collapsible
            expandAll
            rail={(r) => <TimetableRail stop={cheapest.has(r.id) ? "here" : "ring"} />}
            rowProps={(r) => ({
              style: { "--s1-metro-hue": metroHue(r.family.colour) } as CSSProperties,
              "data-lit": lit?.includes(r.id) || undefined,
              onPointerEnter: () => setLit([r.id]),
              onPointerLeave: () => setLit(null),
              onFocus: () => setLit([r.id]),
              onBlur: () => setLit(null),
            })}
            groups={FAMILIES.slice(0, 4).map((f) => ({
              key: f.id,
              label: f.name,
              mark: <TimetableMark mark={<span className="ud-letter">{f.name[0]}</span>}>{f.name}</TimetableMark>,
              heading: <span>{zh ? `${f.name} 家族` : `The ${f.name} family`}</span>,
              meta: zh ? `${f.fares.length} 个模型` : f.fares.length === 1 ? "1 model" : `${f.fares.length} models`,
              rows: sorted(f.fares.map(([id, input, output]) => ({ family: f, id, input, output }))),
              style: { "--s1-metro-hue": metroHue(f.colour) } as CSSProperties,
            }))}
          />
        </div>
      </S1Words>
      <Said text={lit ? `Lit: ${lit.join(", ")}.` : "A filled ring is the row each line's cheapest price comes from; sort inside each band."} />
    </div>
  );
}

export function PaginationDemo() {
  const [page, setPage] = useState(6);
  return (
    <div className="ud-stack ud-stack--wide">
      <Pagination page={page} pageCount={12} onPageChange={setPage} summary={`${(page - 1) * 20 + 1}–${Math.min(page * 20, 233)} of 233`} />
      <Pagination page={1} pageCount={3} onPageChange={() => {}} label="Short list" />
      <div className="ud-narrowbox">
        <Pagination page={page} pageCount={12} onPageChange={setPage} label="In a narrow box" />
      </div>
    </div>
  );
}

export function BadgeDemo() {
  return (
    <div className="ud-stack">
      <p className="ud-row">
        <Badge>Off</Badge>
        <Badge status="info">Read only</Badge>
        <Badge status="ok">Active</Badge>
        <Badge status="warn">90% used</Badge>
        <Badge status="bad">Revoked</Badge>
        <Badge plain>Beta</Badge>
      </p>
      <p className="ud-badge-line">
        prod-backend <Badge status="ok">Active</Badge> spent $41.20 this month.
      </p>
    </div>
  );
}

export function GlyphDemo() {
  return (
    <ul className="ud-glyphs">
      {STATUSES.map((s) => (
        <li key={s}>
          <Glyph status={s} /> <span className="mono">{s}</span>
        </li>
      ))}
    </ul>
  );
}

export function StatDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="ud-stack ud-stack--wide">
      <StatGroup>
        <Stat label="Spend this month" value="$41.20" delta="+12.5%" trend="up" note="vs September" />
        <Stat label="Requests" value="128,420" delta="−3.1%" trend="down" note="vs last week" />
        <Stat label="Tokens" value="12.4" unit="M" delta="0%" trend="flat" />
        <Stat label="Balance" value="$8.80" unit="USD" loading={loading} />
      </StatGroup>
      <p className="ud-row">
        <Switch checked={loading} onChange={(e) => setLoading(e.target.checked)}>
          Balance loading
        </Switch>
      </p>
    </div>
  );
}

export function MeterDemo() {
  return (
    <div className="ud-stack ud-stack--wide">
      <Meter label="Requests this minute" value={180} max={600} valueText="180 of 600" />
      <Meter label="Spend this month" value={41.2} max={50} valueText="$41.20 of $50" hint="Hatched from 80%: keys pause at the limit." />
      <Meter label="Video seconds" value={312} max={300} valueText="312 s of 300 s: 12 s over" />
    </div>
  );
}

export function DescriptionDemo() {
  return (
    <DescriptionList
      items={[
        { label: "Order", value: <Code>ord_7Q2kT9wX</Code> },
        { label: "Placed", value: "31 October 2026, 09:14" },
        { label: "Amount", value: "$20.00, card ending 4242" },
        { label: "Status", value: <Badge status="ok">Paid</Badge> },
        { label: "Receipt", value: <a href="#description-list">Download the receipt</a> },
      ]}
    />
  );
}

export function PanelDemo() {
  return (
    <div className="ud-stack ud-stack--wide">
      <Panel
        title="API keys"
        description="Keys belong to this workspace and spend its balance."
        actions={
          <Button variant="go" size="sm" icon={<Plus />}>
            Create key
          </Button>
        }
        footer="5 keys · 2 active"
      >
        <p className="ud-p">The body: a table, a form, a list. A flush panel lets a table meet its frame.</p>
      </Panel>
      <Panel title="Balance" level={3} marks>
        <Stat label="Left" value="$8.80" unit="USD" />
      </Panel>
    </div>
  );
}

/** A sample one-colour mark, drawn in currentColor, as an app passes its own logo: three bars of a level meter. */
function SampleMark() {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
      <rect x="6" y="22" width="8" height="20" />
      <rect x="20" y="12" width="8" height="30" />
      <rect x="34" y="4" width="8" height="38" />
      <rect x="2" y="44" width="44" height="2" />
    </svg>
  );
}

export function EmptyDemo() {
  return (
    <div className="ud-stack ud-stack--wide">
      <div className="ud-grid2 ud-grid2--top">
        <EmptyState title="No keys yet" action={<Button variant="go" icon={<Plus />}>Create key</Button>}>
          <p>A key lets an app call the models on your balance.</p>
        </EmptyState>
        <EmptyState size="sm" title="No results">
          <p>Nothing matches &ldquo;prod-old&rdquo;.</p>
        </EmptyState>
        <EmptyState mark={<SampleMark />} title="No friends yet">
          <p>An app&rsquo;s own one-colour mark in place of the frame, in the second ink.</p>
        </EmptyState>
        <div lang="zh-CN">
          <EmptyState size="sm" mark={<SampleMark />} title="还没有好友" />
        </div>
      </div>
      <Table caption="Orders" columns={[{ key: "id", header: "Order" }, { key: "amount", header: "Amount", align: "end" }]} rows={[] as { id: string; amount: string }[]} rowKey="id" emptyMark={<SampleMark />} empty="No orders yet" />
    </div>
  );
}

// ------------------------------------------------------------------ navigation

/** A small index in the manner of this page's own: numbered chapters, families with a count. */
const INDEX: SideNavSection[] = [
  { id: "x-start", number: "01", title: "Getting started", items: [{ id: "x-install", label: "Install" }, { id: "x-styles", label: "Styles and Tailwind" }] },
  {
    id: "x-parts",
    number: "02",
    title: "Parts",
    sections: [
      { id: "x-editorial", title: "Editorial", count: 3, items: [{ id: "x-button", label: "Button" }, { id: "x-kicker", label: "Kicker" }, { id: "x-plate", label: "Plate" }] },
      { id: "x-forms", title: "Forms", count: 2, items: [{ id: "x-field", label: "Field" }, { id: "x-input", label: "Input" }] },
    ],
  },
  { id: "x-site", number: "03", title: "Site parts", onSelect: () => {} },
];

/** An app's sidebar: a list without a head, chats with an action, times and status marks, projects that fold, apps. */
function appSections(zh: boolean): SideNavSection[] {
  const t = (en: string, cn: string) => (zh ? cn : en);
  const add = <Button variant="ghost" size="sm" icon={<Plus />} aria-label={t("New chat", "新建对话")} title={t("New chat", "新建对话")} />;
  return [
    {
      id: "top",
      items: [
        { id: "new", label: t("New chat", "新建对话"), icon: <Plus /> },
        { id: "search", label: t("Search", "搜索"), icon: <Search />, meta: "⌘K" },
      ],
    },
    {
      id: "chats",
      title: t("Chats", "对话"),
      action: add,
      items: [
        { id: "c1", label: t("Video storyboard", "视频分镜"), icon: <Clapperboard />, meta: "2m", status: "info", statusLabel: t("running", "运行中") },
        { id: "c2", label: t("Fix the login redirect", "修复登录跳转"), icon: <CodeIcon />, meta: "1h" },
        { id: "c3", label: t("A week in Kyoto", "京都一周"), icon: <MessageSquare />, meta: t("3d", "3 天"), status: "bad", statusLabel: t("failed", "失败") },
      ],
    },
    {
      id: "projects",
      title: t("Projects", "项目"),
      count: 2,
      collapsible: true,
      items: [
        { id: "p1", label: "tokensbeat.com", icon: <Folder />, items: [{ id: "p1a", label: t("Homepage copy", "首页文案") }, { id: "p1b", label: t("Pricing", "定价") }] },
        { id: "p2", label: t("Thesis", "论文"), icon: <BookOpen /> },
      ],
    },
    {
      id: "apps",
      title: t("Apps", "应用"),
      items: [
        { id: "store", label: t("Store", "商店"), icon: <Store /> },
        { id: "draw", label: t("Draw", "绘图"), icon: <ImageIcon /> },
        { id: "settings", label: t("Settings", "设置"), icon: <Settings /> },
      ],
    },
  ];
}

function AppSideNav({ zh = false, startRail = false }: { zh?: boolean; startRail?: boolean }) {
  const [current, setCurrent] = useState("c1");
  const [rail, setRail] = useState(startRail);
  const sections = appSections(zh).map((sec) => ({ ...sec, items: sec.items?.map((i) => ({ ...i, onSelect: () => setCurrent(i.id), items: i.items?.map((n) => ({ ...n, onSelect: () => setCurrent(n.id) })) })) }));
  const fold = zh ? (rail ? "展开侧栏" : "收起侧栏") : rail ? "Unfold the sidebar" : "Fold the sidebar";
  return (
    <div className={rail ? "ud-navbox ud-navbox--rail" : "ud-navbox"} lang={zh ? "zh-CN" : "en"}>
      <SideNav
        label={zh ? "主导航" : "Main"}
        title="Aha"
        titleAction={<Button variant="ghost" size="sm" icon={rail ? <PanelLeftOpen /> : <PanelLeftClose />} aria-label={fold} title={fold} onClick={() => setRail((r) => !r)} />}
        sections={sections}
        current={current}
        rail={rail}
        footer={<p className="ud-navbox__foot">s1lin · {zh ? "免费版" : "Free"}</p>}
      />
    </div>
  );
}

/** The docs' index, an app's sidebar in English and in Chinese, folded to a rail, and the phone's bar and sheet. */
export function SideNavDemo() {
  const [at, setAt] = useState("x-button");
  const [phoneAt, setPhoneAt] = useState("c2");
  const index = INDEX.map((c) => ({
    ...c,
    onSelect: c.onSelect && (() => setAt(c.id)),
    items: c.items?.map((i) => ({ ...i, onSelect: () => setAt(i.id) })),
    sections: c.sections?.map((f) => ({ ...f, items: f.items?.map((i) => ({ ...i, onSelect: () => setAt(i.id) })) })),
  }));
  const phone = appSections(false).map((sec) => ({ ...sec, items: sec.items?.map((i) => ({ ...i, onSelect: () => setPhoneAt(i.id) })) }));
  return (
    <div className="ud-stack ud-stack--wide">
      <div className="ud-navs">
        <div className="ud-navbox">
          <SideNav label="Library (example)" title="Index" sections={index} current={at} currentType="location" />
        </div>
        <AppSideNav />
        <AppSideNav startRail />
        <AppSideNav zh />
      </div>
      <div className="ud-phone">
        <SideNav label="Main (phone)" title="Aha" sections={phone} current={phoneAt} sheet />
        <p className="ud-p">
          A phone: one bar that says where you are; press it for the tree. Esc, a choice or a tap outside closes it.
        </p>
      </div>
      <Said text="The index: chapters, families, the current item in the ink with its bar. Aha's sidebar: icons, a + at the end of Chats, times, a running chat and a failed one, Projects folding, the fold button in the title (a rail of icons, the names as tooltips); the same in Chinese." />
    </div>
  );
}

/** English and Chinese, each written in itself. */
const LANGS = [
  { value: "en", label: "EN", name: "English", lang: "en" },
  { value: "zh", label: "中文", lang: "zh-CN" },
];

/** A link that stays on this page: the example's links mark a language without leaving the docs. */
const stay = ({ onClick, ...link }: LangSwitchLinkProps) => (
  <a
    {...link}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  />
);

/** One row of the example: what it shows, in the row's own language, and the switch. */
function LangRow({ name, zh, size, links = false }: { name: [string, string]; zh?: boolean; size?: "md" | "sm" | "xs"; links?: boolean }) {
  const [lang, setLang] = useState(zh ? "zh" : "en");
  const inZh = lang === "zh";
  return (
    <div className="ud-langs" lang={inZh ? "zh-CN" : "en"}>
      <span className="ud-langs__name">{inZh ? name[1] : name[0]}</span>
      <LangSwitch
        label={inZh ? "语言" : "Language"}
        options={links ? LANGS.map((l) => ({ ...l, href: "#lang-switch" })) : LANGS}
        value={lang}
        onValueChange={setLang}
        renderLink={stay}
        size={size}
      />
    </div>
  );
}

/** The switch as buttons and as links, at its three heights, in English and in Chinese, on paper and at night. */
export function LangSwitchDemo() {
  return (
    <div className="ud-stack ud-stack--wide">
      <div className="ud-langbox">
        <LangRow name={["Buttons · a head, sm 30px", "按钮 · 页头，sm 30px"]} />
        <LangRow name={["Buttons · a head, sm 30px", "按钮 · 页头，sm 30px"]} zh />
        <LangRow name={["Links · a page in each language", "链接 · 每种语言一页"]} links />
        <LangRow name={["A phone's sheet · md 40px", "手机菜单 · md 40px"]} size="md" />
        <LangRow name={["A foot · xs 24px", "页脚 · xs 24px"]} size="xs" links />
      </div>
      <div className="ud-langbox" data-theme="dark">
        <LangRow name={["At night · sm 30px", "夜间 · sm 30px"]} />
        <LangRow name={["At night · xs 24px", "夜间 · xs 24px"]} size="xs" zh />
      </div>
      <Said text="Press a language: it takes the ink and the dot, the other goes dim. No line, box or fill round any of them, nor round the group; the pointer raises a dim one. The rows are on their own, so each keeps its language." />
    </div>
  );
}

/** One set of every switcher, live: dots for words in a head or a toolbar, filled for a picker, a filter and a switch. */
function SwitcherSet({ night = false }: { night?: boolean }) {
  const [lang, setLang] = useState("en");
  const [view, setView] = useState("chart");
  const [range, setRange] = useState("1h");
  const [platform, setPlatform] = useState("all");
  const [grid, setGrid] = useState(true);
  const [board, setBoard] = useState(true);
  return (
    <div className="ud-switchers" data-theme={night ? "dark" : undefined}>
      <section className="ud-switchers__set" aria-label={night ? "Dots, at night" : "Dots"}>
        <p className="ud-switchers__name">{night ? "Dots · at night" : "Dots · a head, a foot, a toolbar"}</p>
        <div className="ud-row">
          <LangSwitch label="Language" options={LANGS} value={lang} onValueChange={setLang} />
          <RadioGroup
            legend="View"
            hideLegend
            variant="dots"
            value={view}
            onValueChange={setView}
            options={[
              { value: "chart", label: "Chart" },
              { value: "table", label: "Table" },
            ]}
          />
        </div>
      </section>
      <section className="ud-switchers__set" aria-label={night ? "Filled, at night" : "Filled"}>
        <p className="ud-switchers__name">{night ? "Filled · at night" : "Filled · a picker, a filter, a switch"}</p>
        <RadioGroup legend="Range" hideLegend variant="segmented" value={range} onValueChange={setRange} options={["5m", "30m", "1h", "6h", "24h"].map((r) => ({ value: r, label: r }))} />
        <div className="ud-row" role="group" aria-label="Platform">
          {[
            ["all", "All"],
            ["openai", "OpenAI"],
            ["anthropic", "Anthropic"],
          ].map(([value, label]) => (
            <Button key={value} variant="chip" size="sm" aria-pressed={platform === value} onClick={() => setPlatform(value)}>
              {label}
            </Button>
          ))}
        </div>
        <div className="ud-row">
          <span className="ud-row" role="group" aria-label="Layout">
            <Button variant="ghost" size="sm" aria-pressed={grid} onClick={() => setGrid(true)}>
              Grid
            </Button>
            <Button variant="ghost" size="sm" aria-pressed={!grid} onClick={() => setGrid(false)}>
              List
            </Button>
          </span>
          <Switch checked={board} onChange={(e) => setBoard(e.target.checked)}>
            Board
          </Switch>
        </div>
      </section>
    </div>
  );
}

/** The two designs, on paper and at night. */
export function SwitchersDemo() {
  return (
    <div className="ud-stack ud-stack--wide">
      <SwitcherSet />
      <SwitcherSet night />
      <Said text="Press any of them: the chosen one takes the fill, or the ink and the dot; nothing anywhere has a line round it, round its group or between its options. Tab to one to see the focus ring, which only the keyboard brings." />
    </div>
  );
}

// ------------------------------------------------------------------ overlays

export function DialogDemo() {
  const [open, setOpen] = useState<"" | "create" | "revoke" | "once">("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const close = () => setOpen("");
  return (
    <>
      <p className="ud-row">
        <Button
          variant="go"
          icon={<Plus />}
          onClick={() => {
            setName("");
            setError("");
            setOpen("create");
          }}
        >
          Create a key
        </Button>
        <Button icon={<Ban />} onClick={() => setOpen("revoke")}>
          Revoke…
        </Button>
        <Button icon={<KeyRound />} onClick={() => setOpen("once")}>
          A key shown once
        </Button>
      </p>
      <Dialog
        open={open === "create"}
        onClose={close}
        title="Create a key"
        description="Keys can call every model on your balance."
        actions={
          <>
            <Button icon={<X />} onClick={close}>
              Cancel
            </Button>
            <Button variant="go" type="submit" form="ud-new-key" icon={<Plus />}>
              Create
            </Button>
          </>
        }
      >
        <form
          id="ud-new-key"
          className="ud-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setError("Give the key a name.");
              return;
            }
            close();
            toast({ title: `Key “${name.trim()}” created`, description: "Nothing was sent: this is the docs page.", status: "ok" });
          }}
        >
          <Field label="Name" required error={error || undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-autofocus autoComplete="off" />
          </Field>
          <Field label="Model">
            <Select defaultValue="qwen-3.8">
              {MODELS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </Field>
        </form>
      </Dialog>
      <Dialog
        open={open === "revoke"}
        onClose={close}
        size="sm"
        title="Revoke prod-backend?"
        description="Apps using it stop at once. This cannot be undone."
        actions={
          <>
            <Button icon={<X />} onClick={close} data-autofocus>
              Keep it
            </Button>
            <Button
              variant="go"
              icon={<Ban />}
              onClick={() => {
                close();
                toast({ title: "prod-backend revoked", status: "bad", action: { label: "Undo", onClick: () => toast({ title: "prod-backend restored", status: "ok" }) } });
              }}
            >
              Revoke
            </Button>
          </>
        }
      />
      <Dialog
        open={open === "once"}
        onClose={close}
        dismissible={false}
        title="Your new key"
        description="Copy it now: it is not shown again."
        actions={
          <Button variant="go" icon={<Check />} onClick={close}>
            I have copied it
          </Button>
        }
      >
        <Secret value={KEY} label="API key" defaultRevealed />
      </Dialog>
    </>
  );
}

export function MenuDemo() {
  const [said, setSaid] = useState("");
  const pick = (what: string) => () => setSaid(what);
  return (
    <>
      <p className="ud-row">
        <Menu
          items={[
            { label: "Rename", hint: "R", onSelect: pick("Rename") },
            { label: "Duplicate", onSelect: pick("Duplicate") },
            { label: "Move to a workspace", disabled: true },
            { label: "Usage", href: "#menu", onSelect: pick("Usage (a link)") },
            "separator",
            { label: "Revoke", danger: true, onSelect: pick("Revoke") },
          ]}
        >
          Actions ▾
        </Menu>
        <Menu variant="icon" align="end" label="More actions for prod-backend" items={[{ label: "Copy id", onSelect: pick("Copy id") }, { label: "Archive", onSelect: pick("Archive") }]} />
      </p>
      <Said text={said ? `Chose ${said}: nothing is sent from this page.` : "Open one with the mouse or with ↓, move with the arrows, type a letter, Esc to close."} />
    </>
  );
}

export function TabsDemo() {
  return (
    <Tabs
      label="Usage"
      tabs={[
        { id: "overview", label: "Overview", content: <MeterDemo /> },
        {
          id: "models",
          label: "By model",
          content: (
            <DescriptionList
              items={[
                { label: "qwen-3.8", value: "9.1M tokens · $28.40" },
                { label: "gpt-image-2", value: "212 images · $10.60" },
                { label: "gemini-3.1-flash-image", value: "41 images · $2.20" },
              ]}
            />
          ),
        },
        { id: "requests", label: "Requests", content: <p className="ud-p">128,420 requests this month; 0.4% failed.</p> },
        { id: "exports", label: "Exports", content: null, disabled: true },
      ]}
    />
  );
}

export function ToastDemo() {
  return (
    <p className="ud-row">
      <Button onClick={() => toast("Settings saved")}>Plain</Button>
      <Button onClick={() => toast({ title: "Key created", description: "prod-backend can call every model.", status: "ok" })}>Done</Button>
      <Button onClick={() => toast({ title: "Balance low", description: "$2.10 left.", status: "warn" })}>Warning</Button>
      <Button onClick={() => toast({ title: "Payment failed", description: "The card was declined.", status: "bad" })}>Error</Button>
      <Button onClick={() => toast({ title: "Key revoked", status: "info", action: { label: "Undo", onClick: () => toast({ title: "Key restored", status: "ok" }) } })}>
        With an action
      </Button>
      <Button
        onClick={() => {
          const id = toast({ title: "Saving…", duration: Infinity });
          window.setTimeout(() => toast({ id, title: "Saved", status: "ok" }), 1200);
        }}
      >
        Replaced in place
      </Button>
    </p>
  );
}

// ------------------------------------------------------------------ feedback

export function NoticeDemo() {
  const [shown, setShown] = useState(true);
  return (
    <div className="ud-stack ud-stack--wide">
      <Notice title="Keys moved">Keys now belong to a workspace; yours are in &ldquo;s1lin&rdquo;.</Notice>
      <Notice status="ok" title="Payment received">$20.00 was added to your balance.</Notice>
      <Notice
        status="warn"
        title="Balance low"
        action={
          <Button size="sm" variant="go" icon={<Wallet />}>
            Top up
          </Button>
        }
      >
        $2.10 left: about a day at this week&rsquo;s rate.
      </Notice>
      {shown ? (
        <Notice status="bad" title="Payment failed" onDismiss={() => setShown(false)}>
          The card was declined. Try another, or top up by bank transfer.
        </Notice>
      ) : (
        <p className="ud-row">
          <Button size="sm" icon={<RotateCcw />} onClick={() => setShown(true)}>
            Show the error again
          </Button>
        </p>
      )}
    </div>
  );
}

export function SpinnerDemo() {
  const [busy, setBusy] = useState(false);
  return (
    <div className="ud-stack">
      <p className="ud-row">
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
        <Spinner label="Loading keys" showLabel />
      </p>
      <p className="ud-row">
        <Button
          variant="go"
          disabled={busy}
          aria-busy={busy}
          icon={busy ? <Spinner size="sm" decorative /> : <Save />}
          onClick={() => {
            setBusy(true);
            window.setTimeout(() => setBusy(false), 1500);
          }}
        >
          {busy ? "Saving" : "Save"}
        </Button>
      </p>
    </div>
  );
}

export function SkeletonDemo() {
  const [ready, setReady] = useState(false);
  return (
    <div className="ud-stack ud-stack--wide">
      <div className="ud-skel" aria-busy={!ready}>
        {ready ? (
          <>
            <div className="ud-skel__dot" aria-hidden="true">
              S
            </div>
            <p className="ud-p">prod-backend spent $41.20 this month across 9.1M tokens; the busiest hour was 14:00.</p>
          </>
        ) : (
          <>
            <Skeleton shape="circle" />
            <Skeleton lines={3} />
          </>
        )}
      </div>
      <Skeleton shape="block" height="3rem" />
      <p className="ud-row">
        <Switch checked={ready} onChange={(e) => setReady(e.target.checked)}>
          Loaded
        </Switch>
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ text and keys

const CURL = `curl https://api.tokensbeat.com/v1/chat/completions \\
  -H "Authorization: Bearer $TOKENSBEAT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "qwen-3.8", "messages": [{"role": "user", "content": "Hello"}]}'`;

export function CodeDemo() {
  return (
    <div className="ud-stack ud-stack--wide">
      <p className="ud-p">
        Send <Code>Authorization: Bearer …</Code> with each request, and name the model, <Code>qwen-3.8</Code>.
      </p>
      <Code block copy label="curl">
        {CURL}
      </Code>
      <Code block>{`{ "id": "chatcmpl-9a2e", "model": "qwen-3.8" }`}</Code>
    </div>
  );
}

export function CopyDemo() {
  const [said, setSaid] = useState("");
  return (
    <>
      <p className="ud-row">
        <Copy value="https://api.tokensbeat.com/v1" label="Copy the base URL" onCopy={(ok) => setSaid(ok ? "On the clipboard: https://api.tokensbeat.com/v1" : "The clipboard refused.")} />
        <Copy value={() => new Date().toISOString()} label="Copy the time now" variant="go" size="md">
          Copy the time
        </Copy>
      </p>
      <Said text={said || "Press one; the button says Copied and a screen reader hears it."} />
    </>
  );
}

export function SecretDemo() {
  return (
    <div className="ud-stack ud-stack--wide">
      <Secret value={KEY} label="API key" keep={[6, 4]} />
      <Secret value="whsec_b81f0c2d9e4a" label="Webhook secret" size="sm" noCopy />
      <div lang="zh-CN">
        <S1Words words={ZH}>
          <Secret value={KEY} label="API 密钥" keep={[6, 4]} />
        </S1Words>
      </div>
    </div>
  );
}

export function HiddenDemo() {
  return (
    <div className="ud-stack">
      <p className="ud-row">
        <Button variant="icon">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="ud-icon">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
          <VisuallyHidden>Close the panel</VisuallyHidden>
        </Button>
        <span className="cap">A screen reader hears &ldquo;Close the panel, button&rdquo;; you see a cross.</span>
      </p>
    </div>
  );
}

export function OverflowDemo() {
  const [long, setLong] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const over = useOverflow(box);
  return (
    <div className="ud-stack ud-stack--wide">
      <div ref={box} className="ud-overflow" tabIndex={over ? 0 : undefined}>
        <span>{long ? "sk-tb-4f7c9e2a81d04b6f93a5c0e7d2b18f6a · sk-tb-91ae3b0c7d2f4e5a8b9c0d1e2f3a4b5c · sk-tb-0c3d" : "sk-tb-4f7c"}</span>
      </div>
      <dl className="ud-readout">
        <dt>useOverflow(the box above)</dt>
        <dd>{String(over)}</dd>
      </dl>
      <p className="ud-row">
        <Switch checked={long} onChange={(e) => setLong(e.target.checked)}>
          A long line
        </Switch>
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ words

/** The parts' words in Chinese, as an app would give them from its own dictionary. */
const ZH: Partial<S1WordMap> = {
  copy: "复制",
  copied: "已复制",
  copyFailed: "复制失败",
  copiedMessage: "已复制到剪贴板",
  copyFailedMessage: "无法复制：请选中文字后手动复制",
  copyName: (name) => `复制${name}`,
  pagination: "分页",
  previous: "上一页",
  next: "下一页",
  page: (n) => `第 ${n} 页`,
  pageOf: (n, count) => `第 ${n} 页，共 ${count} 页`,
  show: "显示",
  hide: "隐藏",
  hidden: "已隐藏",
};

/** The same parts in English and in Chinese: only the provider around them changes. */
export function WordsDemo() {
  const [lang, setLang] = useState("zh");
  const [page, setPage] = useState(3);
  return (
    <div className="ud-stack ud-stack--wide">
      <LangSwitch label="Language" options={LANGS} value={lang} onValueChange={setLang} size="md" />
      <S1Words words={lang === "zh" ? ZH : {}}>
        <div className="ud-stack ud-stack--wide" lang={lang === "zh" ? "zh-CN" : "en"}>
          <Secret value={KEY} label={lang === "zh" ? "API 密钥" : "API key"} keep={[6, 4]} />
          <Pagination page={page} pageCount={8} onPageChange={setPage} />
        </div>
      </S1Words>
    </div>
  );
}
