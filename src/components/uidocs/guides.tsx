import manifest from "../../../registry.json";
import { Code, Install } from "@/components/uidocs/parts";
import { REGISTRY } from "@/components/uidocs/registry";

/*
 * The getting-started entries that are steps rather than an example: how to
 * add the registry and a first part, and how the parts' stylesheets sit beside
 * an app's own, with Tailwind or without.
 */

const COMPONENTS_JSON = `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks",
    "utils": "@/lib/utils"
  },
  "registries": {
    "@s1lin": "${REGISTRY}/{name}.json"
  }
}`;

const ALIAS = `// tsconfig.json
"compilerOptions": { "paths": { "@/*": ["./src/*"] } }

// vite.config.ts
resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } }`;

function InstallGuide() {
  return (
    <ol className="ud-steps">
      <li>
        <p>
          <b>An app.</b> React 19, TypeScript or JavaScript (shadcn turns the parts into JSX for a JavaScript app), and an
          import alias for <code>src/</code>. A new Vite app needs the alias added:
        </p>
        <Code>{ALIAS}</Code>
      </li>
      <li>
        <p>
          <b>The registry.</b> Add <code>@s1lin</code> to your <code>components.json</code>, or write one like this. The
          <code>tailwind</code> block is shadcn&rsquo;s and does nothing here: no part has a Tailwind class.
        </p>
        <Code label="components.json">{COMPONENTS_JSON}</Code>
      </li>
      <li>
        <p>
          <b>A part.</b> It comes with the tokens, <code>cn</code> and the npm packages it needs:
        </p>
        <Install item="button" />
        <p className="ud-guide__p">
          A part added later may bring newer copies of what it shares with the ones you have (the tokens, Button): shadcn asks
          before it replaces a file, and <code>--overwrite</code> takes them all.
        </p>
      </li>
      <li>
        <p>
          <b>Use it.</b> The files land in <code>components/s1lin/</code> under your components alias, each part&rsquo;s
          stylesheet beside it and imported by it, so there is no CSS to wire up.
        </p>
        <Code>{`import { Button } from "@/components/s1lin/button";

export function Save() {
  return <Button variant="go" type="submit">Save</Button>;
}`}</Code>
      </li>
    </ol>
  );
}

function StylesGuide() {
  return (
    <>
      <p className="ud-guide__p">
        The tokens sit in the cascade layer <code>base</code> and the parts in <code>components</code>. In an app with
        Tailwind 4 those are Tailwind&rsquo;s own layers: preflight stays under the parts, and a utility in{" "}
        <code>className</code> wins over them.
      </p>
      <Code>{`<SectionLabel ja="草" className="mt-16">On GitHub</SectionLabel>  {/* mt-16 wins */}`}</Code>
      <p className="ud-guide__p">
        Without Tailwind, any CSS of your own that is in no layer wins over the parts, as it should. Only a rule for a bare
        element reaches them by accident (<code>button {"{ … }"}</code>, <code>h2 {"{ … }"}</code>): put such rules in a
        layer of their own, under the parts.
      </p>
      <Code>{`@layer base, components;               /* first in your stylesheet */
@layer base { button { font: inherit; } }  /* your element defaults, under the parts */`}</Code>
      <p className="ud-guide__p">
        The registry is plain JSON: <a href={`${REGISTRY}/registry.json`}>{`${REGISTRY}/registry.json`}</a> lists the{" "}
        {manifest.items.length} items, and each is at <code>{`${REGISTRY}/{name}.json`}</code> with its files inside. The
        effects on the front page are Canvas UI&rsquo;s, not this library&rsquo;s: add them from{" "}
        <a href="https://canvasui.dev">canvasui.dev</a>.
      </p>
    </>
  );
}

/** The written-out steps of an entry, by its id. */
export function Guide({ id }: { id: string }) {
  switch (id) {
    case "install":
      return <InstallGuide />;
    case "styles":
      return <StylesGuide />;
    default:
      return null;
  }
}
