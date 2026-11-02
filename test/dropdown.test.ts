import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { build } from "vite";

/*
 * Dropdown: on a server, a closed one is in the HTML, its trigger wired to its list and the list hidden, its items not
 * yet mounted. In a real browser, with React running: the menu button's keys (open on the first or the last item, the
 * arrows wrapping, Home and End, a letter, a disabled item reached and not chosen, Esc, Tab), a choice closing it and
 * running after focus is back on the trigger, check and radio items that keep it open, a group named by its label, a
 * submenu (→ opens it on its first item, ← closes it back, the pointer on another item closes it, a choice in it closes
 * everything), a press outside, Esc inside a Dialog, and its place and look: the top layer, under its trigger and at
 * least as wide, at its end edge, above at the window's foot, the submenu beside its trigger, the item under focus in
 * reverse, a danger in its hue. Vite bundles a small page from src/ui/ as an app would; headless Chrome runs it and
 * prints what it found. The browser half is skipped where there is no Chrome: set CHROME to one.
 */

const ROOT = path.resolve(import.meta.dirname, "..");

function chrome(): string | undefined {
  const named = process.env.CHROME ?? process.env.CHROME_BIN;
  if (named) return named;
  const cache = path.join(process.env.HOME ?? "/root", ".cache/ms-playwright");
  const cached = existsSync(cache)
    ? readdirSync(cache)
        .filter((d) => d.startsWith("chromium-"))
        .map((d) => path.join(cache, d, "chrome-linux64/chrome"))
        .filter(existsSync)
    : [];
  const system = ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(existsSync);
  return [...cached, ...system][0];
}

const out = mkdtempSync(path.join(tmpdir(), "s1lin-dropdown-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

/**
 * The part, bundled for node as an app's server would import it (its stylesheets left out), with React and its server
 * renderer imported after the build, which sets NODE_ENV: one React, in one mode.
 */
async function serverPart() {
  await build({
    configFile: false,
    root: out,
    logLevel: "silent",
    plugins: [{ name: "no-css", enforce: "pre", load: (id) => (id.endsWith(".css") ? "" : null) }, react()],
    build: { ssr: path.join(ROOT, "src/ui/dropdown.tsx"), outDir: path.join(out, "ssr"), emptyOutDir: true, rollupOptions: { output: { format: "es", entryFileNames: "dropdown.mjs" } } },
  });
  const part = await import(pathToFileURL(path.join(out, "ssr/dropdown.mjs")).href);
  const { createElement } = await import("react");
  const { renderToString } = await import("react-dom/server");
  return { ...part, h: createElement, renderToString };
}

test("Dropdown on a server: closed, the trigger is wired to a hidden menu named by it, its items not mounted; open at first, they are", async () => {
  const { Dropdown, DropdownTrigger, DropdownList, DropdownItem, h, renderToString } = await serverPart();
  const menu = (props: object) =>
    renderToString(h(Dropdown, props, h(DropdownTrigger, null, h("button", { type: "button" }, "Actions")), h(DropdownList, { align: "end" }, h(DropdownItem, { icon: h("svg"), hint: "R" }, "Rename"), h(DropdownItem, { danger: true }, "Delete"))));
  const closed = menu({});
  const button = closed.match(/<button[^>]*>/)![0];
  const list = closed.match(/<div[^>]*role="menu"[^>]*>/)![0];
  assert.match(button, /aria-haspopup="menu"/);
  assert.match(button, /aria-expanded="false"/);
  assert.equal(button.match(/aria-controls="([^"]+)"/)![1], list.match(/\sid="([^"]+)"/)![1]);
  assert.equal(list.match(/aria-labelledby="([^"]+)"/)![1], button.match(/\sid="([^"]+)"/)![1]);
  assert.match(list, /popover="manual"/);
  assert.match(list, /\shidden=""/);
  assert.doesNotMatch(closed, /Rename/, "the items wait until it opens");
  const open = menu({ defaultOpen: true });
  assert.match(open, /aria-expanded="true"/);
  assert.equal([...open.matchAll(/role="menuitem" tabindex="-1"/g)].length, 2);
  assert.match(open, /<span class="s1-dropdown__icon" aria-hidden="true"><svg><\/svg><\/span>Rename<span class="s1-dropdown__hint">R<\/span>/);
  assert.match(open, /class="s1-dropdown__item s1-dropdown__item--danger"><span class="s1-dropdown__icon" aria-hidden="true"><span class="s1-glyph s1-glyph--bad" aria-hidden="true"><\/span><\/span>Delete/);
});

const ENTRY = `
import { useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Dropdown, DropdownCheckItem, DropdownGroup, DropdownItem, DropdownLabel, DropdownList, DropdownRadioGroup, DropdownRadioItem, DropdownSeparator, DropdownSub, DropdownSubList, DropdownSubTrigger, DropdownTrigger } from ${JSON.stringify(path.join(ROOT, "src/ui/dropdown.tsx"))};
import { Dialog } from ${JSON.stringify(path.join(ROOT, "src/ui/dialog.tsx"))};

const log = [];
function Main() {
  const [pinned, setPinned] = useState(false);
  const [sort, setSort] = useState("recent");
  return (
    <Dropdown onOpenChange={(v) => log.push("open:" + v)}>
      <DropdownTrigger><button data-t="main" style={{ width: 240, height: 30 }}>Project</button></DropdownTrigger>
      <DropdownList>
        <p id="who" style={{ margin: 0 }}>ada@example.com</p>
        <DropdownItem id="rename" icon={<svg viewBox="0 0 16 16" />} hint="R" onSelect={() => log.push("rename:" + (document.activeElement.dataset.t || document.activeElement.id))}>Rename</DropdownItem>
        <DropdownSub>
          <DropdownSubTrigger>Move to</DropdownSubTrigger>
          <DropdownSubList>
            <DropdownItem id="thesis" onSelect={() => log.push("move:thesis")}>Thesis</DropdownItem>
            <DropdownItem id="work" onSelect={() => log.push("move:work")}>Work</DropdownItem>
          </DropdownSubList>
        </DropdownSub>
        <DropdownItem id="archive" disabled onSelect={() => log.push("archive")}>Archive</DropdownItem>
        <DropdownSeparator />
        <div className="row">
          <DropdownCheckItem id="pin" checked={pinned} onCheckedChange={setPinned} keepOpen>Pinned</DropdownCheckItem>
          <DropdownItem id="manage" onSelect={() => log.push("manage")}>Manage</DropdownItem>
        </div>
        <DropdownGroup>
          <DropdownLabel>Sort by</DropdownLabel>
          <DropdownRadioGroup value={sort} onValueChange={setSort} label="Sort by">
            <DropdownRadioItem value="recent" keepOpen>Most recent</DropdownRadioItem>
            <DropdownRadioItem value="name" keepOpen>Name</DropdownRadioItem>
          </DropdownRadioGroup>
        </DropdownGroup>
        <DropdownGroup><DropdownItem id="lone">Lone</DropdownItem></DropdownGroup>
        <DropdownSeparator />
        <DropdownItem id="delete" danger onSelect={() => log.push("delete")}>Delete</DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
function InDialog() {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="Settings">
      <Dropdown>
        <DropdownTrigger><button data-t="dlg-trigger">More</button></DropdownTrigger>
        <DropdownList><DropdownItem>One</DropdownItem></DropdownList>
      </Dropdown>
    </Dialog>
  );
}
const root = createRoot(document.getElementById("app"));
const mode = location.search.slice(1);
flushSync(() =>
  root.render(
    mode === "dialog" ? <InDialog /> : (
    <>
      <div style={{ position: "absolute", top: 40, left: 300 }}><Main /><span id="after" tabIndex={0}>after</span></div>
      <div style={{ position: "absolute", top: 40, right: 2 }}>
        <Dropdown><DropdownTrigger><button data-t="end" style={{ width: 40, height: 30 }}>⋯</button></DropdownTrigger><DropdownList align="end"><DropdownItem>Copy id</DropdownItem></DropdownList></Dropdown>
      </div>
      <div style={{ position: "absolute", bottom: 20, left: 40 }}>
        <Dropdown><DropdownTrigger><button data-t="foot" style={{ height: 30 }}>Foot</button></DropdownTrigger><DropdownList><DropdownItem>A</DropdownItem><DropdownItem>B</DropdownItem><DropdownItem>C</DropdownItem></DropdownList></Dropdown>
      </div>
    </>),
  ),
);

const got = { log };
const $ = (s) => document.querySelector(s.replace(/^#(main|end|foot|dlg-trigger)$/, "[data-t=$1]"));
const box = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }; };
const listOf = (id) => document.getElementById($("#" + id).getAttribute("aria-controls"));
const labelledBy = (id) => listOf(id).getAttribute("aria-labelledby") === $("#" + id).id;
const key = (k) => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const focus = () => { const el = document.activeElement; return el.dataset.t || (el.id && !el.id.endsWith("-trigger") ? el.id : el.textContent.trim()); };
const steps = [];
const step = (f) => steps.push(f);

if (mode === "dialog") {
  step(() => { $("#dlg-trigger").click(); });
  step(() => { got.dlgOpen = $("#dlg-trigger").getAttribute("aria-expanded"); key("Escape"); });
  step(() => { got.afterEsc = { menu: $("#dlg-trigger").getAttribute("aria-expanded"), dialog: document.querySelector("dialog").open, focus: focus() }; });
} else {
  step(() => { $("#main").click(); });
  step(() => {
    const m = listOf("main");
    const s = getComputedStyle(document.activeElement);
    got.opened = { named: labelledBy("main"), expanded: $("#main").getAttribute("aria-expanded"), top: m.matches(":popover-open"), focus: focus(), trigger: box($("#main")), list: box(m), focusBg: s.backgroundColor, focusColor: s.color, ink: getComputedStyle(m).color, paper: getComputedStyle(m).backgroundColor, border: [getComputedStyle(m).borderTopWidth, getComputedStyle(m).borderTopStyle], shadow: getComputedStyle(m).boxShadow, roles: [...m.querySelectorAll("[role^=menuitem]")].map((e) => e.getAttribute("role")) };
    const order = [];
    key("ArrowDown"); order.push(focus());
    key("ArrowDown"); order.push(focus());
    key("ArrowDown"); order.push(focus());
    key("End"); order.push(focus());
    key("ArrowDown"); order.push(focus());
    key("ArrowUp"); order.push(focus());
    key("Home"); order.push(focus());
    key("m"); order.push(focus());
    key("a"); order.push(focus());
    got.order = order;
  });
  step(() => {
    // a disabled item: reached, not chosen
    $("#archive").focus();
    $("#archive").click();
    got.disabled = { expanded: $("#main").getAttribute("aria-expanded"), aria: $("#archive").getAttribute("aria-disabled"), color: getComputedStyle($("#archive")).color };
    // a check item keeps it open and turns on; a radio item too
    $("#pin").click();
  });
  step(() => {
    got.check = { expanded: $("#main").getAttribute("aria-expanded"), checked: $("#pin").getAttribute("aria-checked"), tick: !!$("#pin .s1-dropdown__mark svg") };
    const name = [...document.querySelectorAll("[role=menuitemradio]")].find((e) => e.textContent === "Name");
    name.click();
  });
  step(() => {
    const radios = [...document.querySelectorAll("[role=menuitemradio]")];
    const groups = [...listOf("main").querySelectorAll(":scope > [role=group]")];
    const label = groups[0].getAttribute("aria-labelledby");
    got.radio = { expanded: $("#main").getAttribute("aria-expanded"), checked: radios.map((r) => r.getAttribute("aria-checked")), dot: !!radios[1].querySelector("svg"), group: label && document.getElementById(label).textContent, lone: groups[1].hasAttribute("aria-labelledby"), labelLook: [getComputedStyle(document.getElementById(label)).textTransform, getComputedStyle(document.getElementById(label)).fontFamily.split(",")[0]], danger: getComputedStyle($("#delete")).fontWeight };
    // the submenu: → opens it on its first item
    const sub = [...document.querySelectorAll("[aria-haspopup=menu][role=menuitem]")][0];
    sub.focus();
    key("ArrowRight");
  });
  step(() => {
    const sub = [...document.querySelectorAll("[aria-haspopup=menu][role=menuitem]")][0];
    got.sub = { expanded: sub.getAttribute("aria-expanded"), focus: focus(), trigger: box(sub), list: box(listOf("main").querySelector("[role=menu]")), top: listOf("main").querySelector("[role=menu]").matches(":popover-open") };
    key("ArrowDown");
    got.sub.down = focus();
    key("ArrowLeft");
  });
  step(() => {
    const sub = [...document.querySelectorAll("[aria-haspopup=menu][role=menuitem]")][0];
    got.subBack = { expanded: sub.getAttribute("aria-expanded"), focus: focus(), menu: $("#main").getAttribute("aria-expanded") };
    // the pointer resting on it opens it; focus moving to another item closes it
    sub.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    sub.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }));
  });
  step(() => {
    const sub = [...document.querySelectorAll("[aria-haspopup=menu][role=menuitem]")][0];
    got.hover = { expanded: sub.getAttribute("aria-expanded"), focus: focus() };
    $("#rename").focus();
  });
  step(() => {
    const sub = [...document.querySelectorAll("[aria-haspopup=menu][role=menuitem]")][0];
    got.hover.after = sub.getAttribute("aria-expanded");
    // Enter or Space on it (a click with no pointer) opens it on its first item; a choice there closes everything
    sub.click();
  });
  step(() => {
    got.subKey = focus();
    $("#work").click();
  });
  step(() => {
    got.subChoice = { menu: $("#main").getAttribute("aria-expanded"), focus: focus() };
    // ↑ on the trigger opens it on the last item
    $("#main").focus();
    key("ArrowUp");
  });
  step(() => {
    got.up = focus();
    // a choice: closed first, focus back on the trigger, then the action
    $("#rename").focus();
    $("#rename").click();
  });
  step(() => {
    got.chosen = { expanded: $("#main").getAttribute("aria-expanded"), focus: focus(), hidden: listOf("main").hidden };
    $("#main").click();
  });
  step(() => { key("Escape"); });
  step(() => {
    got.esc = { expanded: $("#main").getAttribute("aria-expanded"), focus: focus() };
    $("#main").click();
  });
  step(() => {
    // Tab: closed, and Tab moves on from the trigger's place in the page
    key("Tab");
  });
  step(() => {
    got.tab = { expanded: $("#main").getAttribute("aria-expanded"), focus: focus() };
    $("#main").click();
  });
  step(() => {
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
  step(() => {
    got.outside = $("#main").getAttribute("aria-expanded");
    $("#end").click();
  });
  step(() => {
    got.end = { trigger: box($("#end")), list: box(listOf("end")), vw: document.documentElement.clientWidth };
    key("Escape");
    $("#foot").click();
  });
  step(() => {
    got.foot = { trigger: box($("#foot")), list: box(listOf("foot")) };
    key("Escape");
  });
}

let i = 0;
const next = () => {
  if (i < steps.length) { steps[i++](); setTimeout(next, 120); }
  else document.getElementById("out").textContent = JSON.stringify(got);
};
setTimeout(next, 120);
`;

test("Dropdown in a browser: the menu button's keys, choices, check and radio items, groups, a submenu, a press outside, inside a Dialog; its place and look", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
  writeFileSync(path.join(out, "entry.jsx"), ENTRY);
  await build({
    configFile: false,
    root: out,
    logLevel: "silent",
    plugins: [react()],
    define: { "process.env.NODE_ENV": '"production"' },
    build: { outDir: path.join(out, "dist"), emptyOutDir: true, minify: false, lib: { entry: path.join(out, "entry.jsx"), formats: ["iife"], name: "Harness", fileName: () => "harness.js", cssFileName: "harness" } },
  });
  const js = readFileSync(path.join(out, "dist/harness.js"), "utf8");
  const css = readFileSync(path.join(out, "dist", readdirSync(path.join(out, "dist")).find((f) => f.endsWith(".css"))!), "utf8");
  const page = path.join(out, "page.html");
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css} body { margin: 0; background: var(--s1-paper); color: var(--s1-ink); --s1-bad: rgb(192, 38, 27); }</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);

  const run = (mode: string) => {
    let dom: string;
    try {
      dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,700", "--virtual-time-budget=15000", "--dump-dom", `${pathToFileURL(page).href}?${mode}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
    } catch (e) {
      return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
    }
    const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
    assert.ok(text, `${mode}: the page printed nothing`);
    return JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  };

  const got = run("page");
  if (!got) return;
  // opened by a click: the top layer, on the first item, under the trigger and as wide, Menu's look
  assert.equal(got.opened.expanded, "true");
  assert.equal(got.opened.named, true, "the list is named by its trigger");
  assert.equal(got.opened.top, true);
  assert.equal(got.opened.focus, "rename");
  assert.equal(got.opened.list.top, got.opened.trigger.bottom + 4);
  assert.equal(got.opened.list.left, got.opened.trigger.left);
  assert.ok(got.opened.list.width >= got.opened.trigger.width, "at least as wide as its trigger");
  assert.deepEqual(got.opened.border, ["1px", "solid"]);
  assert.match(got.opened.shadow, /6px 6px 0px -1px.*6px 6px 0px 0px/);
  // the item under focus in reverse: the list's ink as its ground, the paper as its words
  assert.equal(got.opened.focusBg, got.opened.ink);
  assert.equal(got.opened.focusColor, got.opened.paper);
  assert.deepEqual(got.opened.roles, ["menuitem", "menuitem", "menuitem", "menuitemcheckbox", "menuitem", "menuitemradio", "menuitemradio", "menuitem", "menuitem"]);
  // the arrows wrap, Home and End, a letter jumps to the next item it starts and letters typed quickly spell on
  // (the "who" row and the label are passed by)
  assert.deepEqual(got.order, ["Move to", "archive", "pin", "delete", "rename", "delete", "rename", "Move to", "manage"]);
  // a disabled item is reached and heard, not chosen
  assert.deepEqual([got.disabled.expanded, got.disabled.aria], ["true", "true"]);
  assert.ok(!got.log.includes("archive"));
  // check and radio items keep it open when asked, with a tick and a dot
  assert.deepEqual(got.check, { expanded: "true", checked: "true", tick: true });
  assert.deepEqual([got.radio.expanded, ...got.radio.checked, got.radio.dot], ["true", "false", "true", true]);
  // a group named by its label, a group without one named by nothing; the label in mono capitals; a danger heavier
  assert.equal(got.radio.group, "Sort by");
  assert.equal(got.radio.lone, false);
  assert.deepEqual(got.radio.labelLook, ["uppercase", '"JetBrains Mono"']);
  assert.equal(got.radio.danger, "600");
  // the submenu: → opens it on its first item, beside its trigger, in the top layer; ↓ moves in it; ← closes it back
  assert.deepEqual([got.sub.expanded, got.sub.focus, got.sub.top], ["true", "thesis", true]);
  assert.ok(got.sub.list.left >= got.sub.trigger.right - 4 && got.sub.list.left <= got.sub.trigger.right + 2, `beside its trigger (${got.sub.list.left} by ${got.sub.trigger.right})`);
  assert.equal(got.sub.down, "work");
  assert.deepEqual(got.subBack, { expanded: "false", focus: "Move to", menu: "true" });
  // the pointer opens it and leaves focus be; focus moving to another item closes it
  assert.deepEqual([got.hover.expanded, got.hover.after], ["true", "false"]);
  // Enter or Space opens it on its first item; a choice in it closes everything
  assert.equal(got.subKey, "thesis");
  assert.deepEqual(got.subChoice, { menu: "false", focus: "main" });
  assert.ok(got.log.includes("move:work"));
  // ↑ on the trigger opens on the last item
  assert.equal(got.up, "delete");
  // a choice: closed, focus back on the trigger before the action runs
  assert.deepEqual(got.chosen, { expanded: "false", focus: "main", hidden: true });
  assert.ok(got.log.includes("rename:main"), `the action ran with focus on the trigger: ${got.log.join(", ")}`);
  // Esc: closed, focus on the trigger; Tab: closed, focus on its way from the trigger; a press outside: closed
  assert.deepEqual(got.esc, { expanded: "false", focus: "main" });
  assert.deepEqual(got.tab, { expanded: "false", focus: "main" });
  assert.equal(got.outside, "false");
  // at the screen's end edge: lined up with the trigger's end, kept inside; at the window's foot: above its trigger
  assert.ok(got.end.list.right <= got.end.vw - 8);
  assert.equal(got.foot.list.bottom, got.foot.trigger.top - 4);

  // in a Dialog: Esc closes the menu and keeps the dialog open
  const dialog = run("dialog");
  if (!dialog) return;
  assert.equal(dialog.dlgOpen, "true");
  assert.deepEqual(dialog.afterEsc, { menu: "false", dialog: true, focus: "dlg-trigger" });
});
