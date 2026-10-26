import type { ReactNode } from "react";
import { Screen } from "@/components/bits";
import { LoupeShot } from "@/components/effects";
import { Feature } from "@/components/Feature";
import { HiRainFigures } from "@/components/HiRainFigures";
import { TokensbeatSection } from "@/components/TokensbeatFigures";

/** A screenshot figure: browser frame, loupe, caption. Images are 1600 × 1000. */
function Shot({ bar, src, alt, children }: { bar: string; src: string; alt: string; children: ReactNode }) {
  return (
    <figure>
      <Screen bar={bar}>
        <LoupeShot>
          <img src={src} width={1600} height={1000} loading="lazy" alt={alt} />
        </LoupeShot>
      </Screen>
      <figcaption>{children}</figcaption>
    </figure>
  );
}

const b = (lead: string, rest: string) => (
  <>
    <b>{lead}</b> {rest}
  </>
);

export function Features() {
  return (
    <>
      <Feature
        id="tokensbeat"
        num="01"
        letter="T"
        title="Tokensbeat"
        run="特集 T · Tokensbeat"
        lemma="An architect draws the foundation, and other people build on it."
        kanji={["基", "基盤", "foundation"]}
        spec={[
          ["Opened", "October 2026"],
          ["Where", <a key="where" href="https://tokensbeat.com">tokensbeat.com</a>],
          ["Role", "Architect and operator"],
          [
            "What",
            "One gateway to many models, sold two ways: Aha, an agent app, for people; and the platform itself for apps, which move in as tenants",
          ],
        ]}
        lede="“All your agents, in one orbit,” says the storefront. Underneath is the drawing I keep coming back to: one gateway to many models, sold two ways. People get Aha, an agent app. App builders get the platform itself, and move in as tenants."
        body="A tenant takes any of three pieces, never a bundle: a private gateway with its own console, users and prices, where Tokensbeat sees exactly one key; an agent instance on Pi, the runtime behind Aha, running the tenant's own agent; and, if it wants one, a managed backend. The first two tenants are the next two lines in this issue: WorkGo, whose agent is Obi, and InclusifAI, whose agent is Aria."
        built={[
          b("The foundation.", "A gateway in Go in front of Claude, OpenAI, Gemini, Grok, Kimi, DeepSeek, GLM and Qwen, and models on GPUs I run myself. One wallet, one console, and a public plaza of live health probes and prices."),
          b("Tenant instances.", "The same binary again, with its own database, white-label site, sign-in and staff gate, and exactly one key upstream. A tenant's users never appear in Tokensbeat's ledger, and a daily job reconciles the two."),
          b("Agents on Pi.", "Events, durable state, tools, skills and hosted apps. To the public it is Aha; for a tenant it runs that tenant's agent behind a flag, so going back is one setting."),
          b("A backend to move into.", "Automation stands up Postgres, auth, a REST API, storage and realtime for each project, and trusts the tenant's own sign-in. Built and tested in the lab, not yet open."),
          b("Moving house without dropping calls.", "In October the gateway and its database moved to Azure with 83 seconds of downtime, and Aha followed with 40. Every green commit now deploys itself, checks its health and rolls itself back if it must. Backups are hourly and encrypted, and a restore drill takes about two minutes."),
          b("The crew.", "Coding agents build it, one layer to a branch, and a second model reviews each layer before the next begins. I draw the plan and own the merges."),
        ]}
        stack={["Go · Gin · Ent", "PostgreSQL", "Redis", "Vue", "React 19 · Hono", "Pi", "vLLM", "Azure", "Cloudflare", "Stripe"]}
        folio="08"
        figs={
          <>
            <TokensbeatSection />
            <Shot
              bar="tokensbeat.com"
              src="/assets/img/web-tokensbeat-home.webp"
              alt="Tokensbeat home page: 'All your agents, in one orbit.' beside an ASCII-art orbit labelled API, Claude, Research, Workspaces and Video."
            >
              tokensbeat.com, launch week. The storefront for people; the section above is what apps move into.
            </Shot>
          </>
        }
      />

      <Feature
        id="workgo"
        num="02"
        letter="W"
        title="WorkGo"
        run="特集 W · WorkGo"
        lemma="Knowing when to start again from an empty lot is part of the job."
        flip
        kanji={["職", "職業", "occupation"]}
        spec={[
          ["Since", "October 2025"],
          ["Where", <a key="where" href="https://workgo.ai">workgo.ai</a>],
          ["What", "A career operating system: résumés, matching, and agents that do the legwork"],
        ]}
        lede="WorkGo started life as AI for remote jobs, and we have rebuilt it more than once since. The current version treats a career like a rail line: you choose the destination, agents lay the track, and you make the final call."
        body="I work across the whole stack. In August 2026 I started WorkGo 2.0 again from an empty repository and laid out how it stands, and most of what a user touches today came out of that branch. Before that I wrote much of the matching service and the Go backend it now runs on. WorkGo is also one of the first two tenants on Tokensbeat: Obi already works as an agent with tools and durable runs, so moving him onto Pi is a translation, not a redesign."
        built={[
          b("WorkGo 2.0 web app.", "Résumés with Obi, the in-app coach; a six-step career identity wizard; Smart Match and an application tracker."),
          b("WorkGo Connector.", "OAuth plus MCP, so ChatGPT or Claude can read your own résumés when you ask them to."),
          b("Autofill everywhere.", "A Chrome extension and a desktop app for the forms that never end."),
          b("Living personal sites.", "A generator that turns a verified profile into a page. Yes, I noticed the irony while building this one."),
          b("The engine room.", "Semantic job matching on pgvector, résumé parsing and scoring, a Go backend with Clerk and Stripe, a three-evaluator skill scorer."),
        ]}
        stack={["React", "TypeScript", "Supabase", "Clerk", "Go · Gin", "FastAPI · Celery", "pgvector", "CrewAI", "MCP"]}
        folio="12"
        figs={
          <>
            <Shot
              bar="workgo.ai"
              src="/assets/img/web-workgo-home.webp"
              alt="WorkGo home page: 'Your work is the résumé. We make it searchable.' beside a sample evidence profile card."
            >
              workgo.ai, October 2026. The persona on the card is fictional.
            </Shot>
            <div className="pair">
              <Shot
                bar="app.workgo.ai"
                src="/assets/img/web-workgo-app.webp"
                alt="WorkGo app sign-in screen with the headline 'Put Your Career on Rails.'"
              >
                The 2.0 app: “Put your career on rails.”
              </Shot>
              <Shot
                bar="workgo.ai · proof"
                src="/assets/img/web-workgo-proof.webp"
                alt="WorkGo page section 'Four levels of proof', showing verification grades L1 to L4."
              >
                Every claim on a profile carries a proof level, L1 to L4.
              </Shot>
            </div>
          </>
        }
      />

      <Feature
        id="inclusifai"
        num="03"
        letter="I"
        title="InclusifAI"
        run="特集 I · InclusifAI"
        lemma="The walls matter as much as the rooms."
        kanji={["資", "資金", "funding"]}
        spec={[
          ["Since", "October 2025"],
          [
            "Where",
            <>
              <a href="https://www.inclusifai.com">inclusifai.com</a> · Toronto
            </>,
          ],
          [
            "What",
            "Infrastructure that connects founders, especially women and underrepresented entrepreneurs, with funding and the organizations that support them",
          ],
        ]}
        lede="Applying for a grant usually means typing the same company story into forty different forms. InclusifAI gives a founder one Funding Passport and lets it do the typing, while the funders on the other side get a cleaner way to review."
        body="I have been the main engineer on the founder app since October 2025, and I also build the Partner Hub for funding organizations and the new public site. Founders and the organizations that fund them come in through separate doors, and the AI that scores applications never sees demographic fields. InclusifAI is the other first tenant on Tokensbeat, and Aria the first tenant agent drawn for Pi."
        built={[
          b("Funding Passport.", "One founder profile that fills many applications, with Smart Match for grants and investors."),
          b("Aria.", "An AI funding coach that sharpens long answers. Every edit is shown before the founder accepts it."),
          b("Funding Autofill.", "A Chrome extension that fills application forms from the Passport."),
          b("Partner Hub.", "Programs, intake, and weighted-rubric review. Aria pre-scores applications and never sees demographic fields."),
          b("Data Room.", "Share links for investors, and an org wallet that keeps the lights on."),
        ]}
        stack={["React", "TypeScript", "Supabase", "Edge functions", "Clerk", "Azure OpenAI", "Stripe"]}
        folio="16"
        figs={
          <Shot
            bar="inclusifai.com"
            src="/assets/img/web-inclusifai-home.webp"
            alt="InclusifAI home page: 'Connecting underrepresented founders to the support built for them.' Two doors below, For founders and For organizations."
          >
            The front door, with one way in for founders and one for the organizations that fund them.
          </Shot>
        }
      />

      <Feature
        id="hirain"
        num="04"
        letter="H"
        title="HiRain"
        run="特集 H · HiRain"
        lemma="Choose the right representation, and the hard part becomes geometry."
        flip
        kanji={["道", "道路", "the road"]}
        spec={[
          ["Since", "2026"],
          [
            "Where",
            <>
              <a href="https://en.hirain.com">HiRain Technologies</a> (<span lang="zh-Hans">经纬恒润</span>)
            </>,
          ],
          ["What", "Roadside perception for vehicle–road–cloud systems: cameras on poles and gantries, watching intersections"],
          ["Research", "Recursive self-improvement (RSI) on ARC-AGI-3"],
        ]}
        lede="A camera on a pole sees the world from above and at an angle, so a car's footprint is never a neat rectangle. Teach the network to place a few well-chosen points, and the footprint, the heading, and the height fall out of geometry."
        body="That idea became a point-based 2.5D detector: four ordered ground corners plus one top point per object. The fifth point is what makes cyclists and pedestrians work. Around it I designed the rest of the pipeline, from the camera to the edge chip."
        built={[
          b("The 5-point head.", "One head for YOLO and RT-DETR, decoded through a ground-frame chart so every footprint is ordered and never degenerate."),
          b("A real-time roadside pipeline.", "Camera and LiDAR in, TensorRT detection, my own 4D Kalman tracker, trajectory prediction and events out."),
          b("A teacher, then a student.", "A 7B vision foundation model fine-tuned to label in 2.5D, distilled into a YOLO small enough to ship."),
          b("Edge deployment.", "INT8 export with quantization-aware training for TI TIDL chips, on NV12 frames straight from the camera."),
          b("Agents in the lab.", "An LLM agent that schedules my training runs and hyperparameter sweeps, and a SAM 3 agent that auto-labels in 2.5D."),
          b("Research on self-improvement.", "On ARC-AGI-3, a harness that rewrites its own playbook and a 1.5B reasoning model that retrains on its own play, read layer by layer through a Jacobian lens. The harness gained 8.8 points on unseen games, short of the 10 I set as the bar."),
        ]}
        stack={["PyTorch", "YOLO", "RT-DETR", "SAM 3", "TensorRT", "CenterPoint", "ONNX · TIDL", "Optuna", "LoRA · PEFT"]}
        folio="20"
        figs={<HiRainFigures />}
      />

      <Feature
        id="awakeai"
        num="05"
        letter="A"
        title="AwakeAI"
        run="特集 A · AwakeAI"
        lemma="Decide where the data goes before you collect any."
        kanji={["介", "介護", "care"]}
        spec={[
          ["When", "December 2020 to July 2025, co-founder"],
          ["Role", "Software lead, then system architect (2023), COO from January 2025 until I left in July"],
          [
            "Where",
            <>
              <a href="https://awakeai.ca">awakeai.ca</a> · Montreal, a Mila startup
            </>,
          ],
        ]}
        lede="Care anytime, anywhere. AwakeAI watches over seniors with optical sensors instead of wearables: nothing to charge, nothing to remember to press, and the video is processed on site with identities masked."
        body="We started it in Montreal in December 2020, in partnership with Mila, and it became a company after a third-place finish at McGill's Dobson Cup. I wrote software, then drew the architecture, then ran operations as COO, until I resigned in July 2025."
        built={[
          b("2022.", "Dobson Cup, 3rd place in the Health Science track. Dobson X-1 accelerator."),
          b("2023.", "NEXT Canada, Centech, Collision, ALL IN and CELS. I take over the system architecture."),
          b("2024.", "Startup Mila status. RESI at the J.P. Morgan Healthcare Conference."),
          b("2025.", "COO from January. I also built the company website. I resigned in July."),
        ]}
        folio="24"
        figs={
          <Shot
            bar="awakeai.ca"
            src="/assets/img/web-awakeai-home.webp"
            alt="AwakeAI home page: 'Transforming Caregiving with Optical Sensors', with illustrations of seniors."
          >
            awakeai.ca, which I built.
          </Shot>
        }
      />
    </>
  );
}
