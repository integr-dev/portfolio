---
title: Osmium
tagline: Runs a fleet of headless Minecraft agents that build one large schematic together.
tier: flagship
order: 2
why: My largest system so far. One operator uploads a schematic, Osmium splits it into segments, hands each agent its slice, and a web dashboard follows every agent live.
built:
  problem: "A dump of the database should never be enough to take over the Minecraft accounts the fleet plays with."
  solution: "Osmium never holds the credentials and never performs the login. The backend only sends a host a setup command; the host signs the account in on a machine its owner controls and reports back the username and UUID. Hosts dial out to the backend instead of being connected to, and an unreachable host makes its agents' state unknown rather than offline."
stats:
  asOf: "2026-09-27"
  source: https://github.com/integr-dev/osmium
  items:
    - { label: commits, value: "352", live: "github:commits:integr-dev/osmium" }
    - { label: of them mine, value: "341", live: "github:commits-by:integr-dev/osmium@integr-dev" }
    - { label: first commit, value: "2026-08" }
stack: [TypeScript, Kotlin, Vue, Spring Boot, PostgreSQL, mineflayer]
links:
  - { label: Source, href: https://github.com/integr-dev/osmium }
visuals:
  - { kind: diagram, label: Architecture, diagram: osmium }
---
Agents sign in through a host process, walk or fly to their segment and place it course by course. The dashboard shows live 3D views, a shared map the agents chart as they move, inventories, telemetry and an audit log. Configuration is stored centrally and replayed to hosts on every reconnect.
