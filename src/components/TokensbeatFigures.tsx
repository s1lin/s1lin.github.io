/** Tokensbeat figure: a building section of the platform, tenants upstairs and models under the foundation. */

const BAYS = [76, 232, 388, 544];
const BAY_W = 144;
const RIGHT = BAYS[3] + BAY_W;
const ROWS = { app: 48, agent: 112, gateway: 176 };
const ROW_H = 48;
const SLAB = { y: 244, h: 52 };
const GROUND = 312;
const MODELS = ["Claude", "OpenAI", "Gemini", "Grok", "Kimi", "DeepSeek", "GLM", "Qwen", "own GPUs"];

type State = "running" | "drawn";

function Room({ x, y, w = BAY_W, name, note, state }: { x: number; y: number; w?: number; name: string; note: string; state: State }) {
  return (
    <g>
      <rect className={state === "drawn" ? "pl-box pl-box--drawn" : "pl-box"} x={x} y={y} width={w} height={ROW_H} />
      <text className="pl-name" x={x + w / 2} y={y + 21}>
        {name}
      </text>
      <text className="pl-note" x={x + w / 2} y={y + 36}>
        {note}
      </text>
    </g>
  );
}

/** The links down one bay: app to agent, agent to gateway, gateway to the foundation. */
function Links({ x, state, keyed }: { x: number; state: State; keyed?: boolean }) {
  const cx = x + BAY_W / 2;
  const cls = state === "drawn" ? "pl-link pl-link--drawn" : "pl-link";
  return (
    <g>
      <path
        className={cls}
        d={`M${cx} ${ROWS.app + ROW_H} V${ROWS.agent} M${cx} ${ROWS.agent + ROW_H} V${ROWS.gateway} M${cx} ${ROWS.gateway + ROW_H} V${SLAB.y}`}
      />
      {keyed && (
        <text className="pl-key" x={cx + 6} y={ROWS.gateway + ROW_H + 14}>
          1 key
        </text>
      )}
    </g>
  );
}

/** A level mark in the margin: its height, then what stands there. */
function Level({ y, at, children }: { y: number; at: string; children: string }) {
  return (
    <g>
      <text className="pl-level" x="12" y={y - 2}>
        {at}
        <tspan className="pl-level__name" x="12" dy="11">
          {children}
        </tspan>
      </text>
      <path className="pl-lead" d={`M12 ${y + 13} H${BAYS[0] - 4}`} />
    </g>
  );
}

function Section() {
  const [pub, wg, ifa, vacant] = BAYS;
  const pileStep = (RIGHT - pub) / MODELS.length;
  return (
    <svg viewBox="0 0 700 430" role="img" aria-labelledby="tb-t tb-d">
      <title id="tb-t">Section through Tokensbeat</title>
      <desc id="tb-d">
        A building section. The foundation is the Tokensbeat gateway: one wallet, one ledger, one key per tenant. Under
        it, piles reach down to the models: Claude, OpenAI, Gemini, Grok, Kimi, DeepSeek, GLM, Qwen and GPUs I run
        myself. Above it stand four bays, each with an app, an agent on Pi and a gateway. The public bay, Aha, is
        running. WorkGo and InclusifAI are tenants whose own gateways and agents are drawn but not yet open; WorkGo also
        takes Automation, the managed backend. The fourth bay is to let.
      </desc>

      {[
        ["PUBLIC", pub],
        ["TENANT", wg],
        ["TENANT", ifa],
        ["TENANT", vacant],
      ].map(([head, x]) => (
        <text key={x} className="pl-head" x={Number(x) + BAY_W / 2} y="34">
          {head}
        </text>
      ))}

      <Level y={ROWS.app + ROW_H / 2} at="+3">
        APP
      </Level>
      <Level y={ROWS.agent + ROW_H / 2} at="+2">
        AGENT
      </Level>
      <Level y={ROWS.gateway + ROW_H / 2} at="+1">
        GATEWAY
      </Level>
      <Level y={SLAB.y + SLAB.h / 2} at="±0">
        BASE
      </Level>
      <Level y={GROUND + 60} at="−1">
        MODELS
      </Level>

      <Links x={pub} state="running" />
      <Room x={pub} y={ROWS.app} name="Aha" note="an agent app for people" state="running" />
      <Room x={pub} y={ROWS.agent} name="Pi" note="the agent runtime" state="running" />
      <Room x={pub} y={ROWS.gateway} name="Public API" note="OpenAI-compatible" state="running" />

      <Links x={wg} state="drawn" keyed />
      <Room x={wg} y={ROWS.app} w={74} name="WorkGo" note="career OS" state="running" />
      <Room x={wg + 80} y={ROWS.app} w={BAY_W - 80} name="Backend" note="Automation" state="drawn" />
      <Room x={wg} y={ROWS.agent} name="Obi" note="on Pi, next" state="drawn" />
      <Room x={wg} y={ROWS.gateway} name="Private gateway" note="own console, own prices" state="drawn" />

      <Links x={ifa} state="drawn" keyed />
      <Room x={ifa} y={ROWS.app} name="InclusifAI" note="founder app" state="running" />
      <Room x={ifa} y={ROWS.agent} name="Aria" note="on Pi, behind a flag" state="drawn" />
      <Room x={ifa} y={ROWS.gateway} name="Private gateway" note="one key upstream" state="drawn" />

      <path className="pl-link pl-link--vacant" d={`M${vacant + BAY_W / 2} ${ROWS.gateway + ROW_H} V${SLAB.y}`} />
      <rect className="pl-box pl-box--vacant" x={vacant} y={ROWS.app} width={BAY_W} height={ROWS.gateway + ROW_H - ROWS.app} />
      <text className="pl-name" x={vacant + BAY_W / 2} y={ROWS.agent + 21}>
        To let
      </text>
      <text className="pl-note" x={vacant + BAY_W / 2} y={ROWS.agent + 36}>
        an app that isn't mine
      </text>

      <rect className="pl-slab" x={pub} y={SLAB.y} width={RIGHT - pub} height={SLAB.h} />
      <text className="pl-slab-name" x={(pub + RIGHT) / 2} y={SLAB.y + 24}>
        TOKENSBEAT
      </text>
      <text className="pl-note" x={(pub + RIGHT) / 2} y={SLAB.y + 40}>
        one gateway · one wallet · one ledger · one key per tenant
      </text>

      <path className="pl-ground" d={`M12 ${GROUND} H${RIGHT}`} />
      <path className="pl-hatch" d={Array.from({ length: 68 }, (_, i) => `M${19 + i * 10} ${GROUND} l-7 8`).join(" ")} />
      {MODELS.map((m, i) => {
        const cx = pub + pileStep * (i + 0.5);
        return (
          <g key={m}>
            <path className="pl-pile" d={`M${cx} ${SLAB.y + SLAB.h} V${GROUND + 50} m-5 0 h10`} />
            <text className="pl-model" x={cx} y={GROUND + 70}>
              {m}
            </text>
          </g>
        );
      })}

      <text className="pl-legend" x="12" y="420">
        SECTION A–A · TOKENSBEAT · 26.10.2026
      </text>
      <path className="pl-link" d="M430 416 h22" />
      <text className="pl-legend" x="458" y="420">
        running
      </text>
      <path className="pl-link pl-link--drawn" d="M516 416 h22" />
      <text className="pl-legend" x="544" y="420">
        drawn, not yet open
      </text>
    </svg>
  );
}

export function TokensbeatSection() {
  return (
    <figure>
      <div className="diagram diagram--plan">
        <Section />
      </div>
      <figcaption>
        Section through Tokensbeat, as drawn in October 2026. A tenant takes any of the rooms in its bay, not a bundle.
      </figcaption>
    </figure>
  );
}
