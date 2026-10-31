/** TokensBeat figure: the plan, drawn as a building section. Apps upstairs, the foundation, the models beneath. */

const BAYS = [76, 232, 388, 544];
const BAY_W = 144;
const RIGHT = BAYS[3] + BAY_W;
const ROWS = { app: 48, agent: 104, backend: 160, gateway: 216 };
const ROW_H = 44;
const TOP = ROWS.app;
const BOTTOM = ROWS.gateway + ROW_H;
const SLAB = { y: 280, h: 50 };
const GROUND = 346;
const MODELS = ["Claude", "OpenAI", "Gemini", "Grok", "Kimi", "DeepSeek", "GLM", "Qwen", "own GPUs"];

function Room({ x, y, h = ROW_H, name, note, open }: { x: number; y: number; h?: number; name: string; note: string; open?: boolean }) {
  return (
    <g>
      <rect className={open ? "pl-box pl-box--vacant" : "pl-box"} x={x} y={y} width={BAY_W} height={h} />
      <text className="pl-name" x={x + BAY_W / 2} y={y + h / 2 - 2}>
        {name}
      </text>
      <text className="pl-note" x={x + BAY_W / 2} y={y + h / 2 + 13}>
        {note}
      </text>
    </g>
  );
}

/** A tenant's bay: its app, and the three rooms the building gives it, tied down to the foundation. */
function Tenant({ x, app, what, agent }: { x: number; app: string; what: string; agent: string }) {
  const cx = x + BAY_W / 2;
  return (
    <g>
      <path
        className="pl-link"
        d={[ROWS.app, ROWS.agent, ROWS.backend].map((y) => `M${cx} ${y + ROW_H} v${12}`).join(" ") + ` M${cx} ${BOTTOM} V${SLAB.y}`}
      />
      <Room x={x} y={ROWS.app} name={app} note={what} />
      <Room x={x} y={ROWS.agent} name={agent} note="its own agent" />
      <Room x={x} y={ROWS.backend} name="Backend" note="looked after for it" />
      <Room x={x} y={ROWS.gateway} name="Gateway" note="its own, one key up" />
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
  const [people, wg, ifa, next] = BAYS;
  const pileStep = (RIGHT - people) / MODELS.length;
  return (
    <svg viewBox="0 0 700 462" role="img" aria-labelledby="tb-t tb-d">
      <title id="tb-t">The plan for TokensBeat, as a building section</title>
      <desc id="tb-d">
        What I want TokensBeat to be. The foundation is one gateway to every model, with one wallet and one ledger; under
        it, piles reach down to Claude, OpenAI, Gemini, Grok, Kimi, DeepSeek, GLM, Qwen and GPUs I run myself. On it
        stand bays: Aha, an agent app for people; WorkGo and InclusifAI, each with its own agent (Obi, Aria), a backend
        looked after for it and its own gateway; and room for the next app.
      </desc>

      {[
        ["FOR PEOPLE", people],
        ["TENANT", wg],
        ["TENANT", ifa],
        ["NEXT", next],
      ].map(([head, x]) => (
        <text key={x} className="pl-head" x={Number(x) + BAY_W / 2} y="34">
          {head}
        </text>
      ))}

      <Level y={ROWS.app + ROW_H / 2} at="+4">
        APP
      </Level>
      <Level y={ROWS.agent + ROW_H / 2} at="+3">
        AGENT
      </Level>
      <Level y={ROWS.backend + ROW_H / 2} at="+2">
        BACKEND
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

      <path className="pl-link" d={`M${people + BAY_W / 2} ${BOTTOM} V${SLAB.y}`} />
      <Room x={people} y={TOP} h={BOTTOM - TOP} name="Aha" note="an agent app for people" />

      <Tenant x={wg} app="WorkGo" what="career OS" agent="Obi" />
      <Tenant x={ifa} app="InclusifAI" what="funding for founders" agent="Aria" />

      <path className="pl-link pl-link--vacant" d={`M${next + BAY_W / 2} ${BOTTOM} V${SLAB.y}`} />
      <Room x={next} y={TOP} h={BOTTOM - TOP} name="Next app" note="moves in the same way" open />

      <rect className="pl-slab" x={people} y={SLAB.y} width={RIGHT - people} height={SLAB.h} />
      <text className="pl-slab-name" x={(people + RIGHT) / 2} y={SLAB.y + 23}>
        TOKENSBEAT
      </text>
      <text className="pl-note" x={(people + RIGHT) / 2} y={SLAB.y + 39}>
        one gateway to every model · one wallet · one ledger
      </text>

      <path className="pl-ground" d={`M12 ${GROUND} H${RIGHT}`} />
      <path className="pl-hatch" d={Array.from({ length: 68 }, (_, i) => `M${19 + i * 10} ${GROUND} l-7 8`).join(" ")} />
      {MODELS.map((m, i) => {
        const cx = people + pileStep * (i + 0.5);
        return (
          <g key={m}>
            <path className="pl-pile" d={`M${cx} ${SLAB.y + SLAB.h} V${GROUND + 50} m-5 0 h10`} />
            <text className="pl-model" x={cx} y={GROUND + 70}>
              {m}
            </text>
          </g>
        );
      })}

      <text className="pl-legend" x="12" y="452">
        PLAN · TOKENSBEAT
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
      <p className="scroll-hint mono" aria-hidden="true">
        Drag the plan sideways for the rest of it →
      </p>
      <figcaption>
        What I want TokensBeat to be: one foundation that every model plugs into, and apps that move in on top of it, each
        with its own agent, backend and gateway. People use the same building through Aha.
      </figcaption>
    </figure>
  );
}
