import { useRef, useState, type FormEvent } from "react";
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
import { Menu } from "@/ui/menu";
import { Meter } from "@/ui/meter";
import { Notice } from "@/ui/notice";
import { Pagination } from "@/ui/pagination";
import { Panel } from "@/ui/panel";
import { RadioGroup } from "@/ui/radio-group";
import { Secret } from "@/ui/secret";
import { Select } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Spinner } from "@/ui/spinner";
import { Stat, StatGroup } from "@/ui/stat";
import { Switch } from "@/ui/switch";
import { Table, type Column, type Sort } from "@/ui/table";
import { Tabs } from "@/ui/tabs";
import { Textarea } from "@/ui/textarea";
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
        <Button variant="go" type="submit">
          Check
        </Button>
        <Button
          type="button"
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
          suffix={
            <Button size="sm" onClick={() => setSaid(coupon ? "bad" : "")}>
              Apply
            </Button>
          }
        />
      </Field>
      <Field label="Base URL" disabled>
        <Input defaultValue="https://api.tokensbeat.com/v1" />
      </Field>
      <div className="ud-span2">
        <Input type="search" size="sm" aria-label="Search keys" placeholder="Search keys (sm)" />
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
      <Switch defaultChecked>Beside its label</Switch>
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
          <EmptyState size="sm" title="No keys yet" action={<Button variant="go" size="sm" onClick={() => setView("rows")}>Create key</Button>}>
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
          <Button variant="go" size="sm">
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

export function EmptyDemo() {
  return (
    <div className="ud-grid2 ud-grid2--top">
      <EmptyState title="No keys yet" action={<Button variant="go">Create key</Button>}>
        <p>A key lets an app call the models on your balance.</p>
      </EmptyState>
      <EmptyState size="sm" title="No results">
        <p>Nothing matches &ldquo;prod-old&rdquo;.</p>
      </EmptyState>
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
          onClick={() => {
            setName("");
            setError("");
            setOpen("create");
          }}
        >
          Create a key
        </Button>
        <Button onClick={() => setOpen("revoke")}>Revoke…</Button>
        <Button onClick={() => setOpen("once")}>A key shown once</Button>
      </p>
      <Dialog
        open={open === "create"}
        onClose={close}
        title="Create a key"
        description="Keys can call every model on your balance."
        actions={
          <>
            <Button onClick={close}>Cancel</Button>
            <Button variant="go" type="submit" form="ud-new-key">
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
            <Button onClick={close} data-autofocus>
              Keep it
            </Button>
            <Button
              variant="go"
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
          <Button variant="go" onClick={close}>
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
          <Button size="sm" variant="go">
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
          <Button size="sm" onClick={() => setShown(true)}>
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
          onClick={() => {
            setBusy(true);
            window.setTimeout(() => setBusy(false), 1500);
          }}
        >
          {busy && <Spinner size="sm" decorative />} {busy ? "Saving" : "Save"}
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
      <Secret value="whsec_b81f0c2d9e4a" label="Webhook secret" noCopy />
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
      <RadioGroup
        legend="Language"
        variant="segmented"
        value={lang}
        onValueChange={setLang}
        options={[
          { value: "en", label: "English" },
          { value: "zh", label: "中文" },
        ]}
      />
      <S1Words words={lang === "zh" ? ZH : {}}>
        <div className="ud-stack ud-stack--wide" lang={lang === "zh" ? "zh-CN" : "en"}>
          <Secret value={KEY} label={lang === "zh" ? "API 密钥" : "API key"} keep={[6, 4]} />
          <Pagination page={page} pageCount={8} onPageChange={setPage} />
        </div>
      </S1Words>
    </div>
  );
}
