export const TEAMS = [
  { id: "born-to-puck", name: "Born To Puck", players: ["TJ", "Adam"] },
  { id: "exquisite-hangers", name: "Exquisite Hangers", players: ["Fish", "Tone"] },
  { id: "puck-buddies", name: "Puck Buddies", players: ["Matt", "Tom"] },
  { id: "pucked-from-the-start", name: "Pucked From the Start", players: ["Scott H", "Steve"] },
  { id: "puck-and-cover", name: "Puck and Cover", players: ["Scott L", "Brendan"] },
  { id: "tbd", name: "TBD", players: ["Fletcher", "Will"] },
];

const BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
export const teamById = (id) => BY_ID[id] || null;
