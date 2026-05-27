import * as fs from "fs";
import * as path from "path";

export interface CanonBotState {
  mode: string;
  status: string;
  bankroll: number;
  openPositions: number;
  totalExposed: number;
  lastTick: string;
  totalTrades: number;
  totalPnL: number;
}

export interface CanonFlowEvent {
  ts: string;
  type: string;
  summary: string;
  data?: unknown;
}

const CANON_DIR = path.resolve(".canon");
const EXECUTION_DIR = path.join(CANON_DIR, "execution");
const STATE_PATH = path.join(CANON_DIR, "state.json");
const FLOW_PATH = path.join(CANON_DIR, "flow.json");

let runId: string = "";
let runJsonlPath: string = "";

export function initCanonWriter(mode: string): void {
  fs.mkdirSync(CANON_DIR, { recursive: true });
  fs.mkdirSync(EXECUTION_DIR, { recursive: true });

  const timestamp = Date.now();
  runId = `run_${timestamp}_${mode}`;
  runJsonlPath = path.join(EXECUTION_DIR, `${runId}.jsonl`);

  const initialState: CanonBotState = {
    mode,
    status: "starting",
    bankroll: 0,
    openPositions: 0,
    totalExposed: 0,
    lastTick: new Date().toISOString(),
    totalTrades: 0,
    totalPnL: 0,
  };

  fs.writeFileSync(STATE_PATH, JSON.stringify(initialState, null, 2));

  if (!fs.existsSync(FLOW_PATH)) {
    fs.writeFileSync(FLOW_PATH, JSON.stringify([], null, 2));
  }

  // Write initial JSONL entry
  const initEvent: CanonFlowEvent = {
    ts: new Date().toISOString(),
    type: "init",
    summary: `Canon writer initialised — run=${runId}`,
    data: { runId, mode },
  };
  fs.appendFileSync(runJsonlPath, JSON.stringify(initEvent) + "\n");
}

export function writeState(state: CanonBotState): void {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function pushFlowEvent(event: CanonFlowEvent): void {
  // Append to flow.json (array)
  let events: CanonFlowEvent[] = [];
  if (fs.existsSync(FLOW_PATH)) {
    try {
      events = JSON.parse(fs.readFileSync(FLOW_PATH, "utf-8"));
    } catch {
      events = [];
    }
  }
  events.push(event);
  fs.writeFileSync(FLOW_PATH, JSON.stringify(events, null, 2));

  // Append JSONL line to execution log
  if (runJsonlPath) {
    fs.appendFileSync(runJsonlPath, JSON.stringify(event) + "\n");
  }
}
