export const EASTER_EGGS = [
  { command: "hello", name: "Secret handshake", hint: "A personal greeting from the node." },
  { command: "coffee", name: "Coffee machine", hint: "Brew a virtual cup." },
  { command: "fortune", name: "Fortune cookie", hint: "Draw a random developer fortune." },
  { command: "flip", name: "Quantum coin", hint: "Flip a coin." },
  { command: "roll", name: "Dungeon dice", hint: "Roll a twenty-sided die." },
  { command: "42", name: "Deep Thought", hint: "The answer to life, the universe and everything." },
  { command: "cat", name: "Terminal pet", hint: "Meet the resident ASCII cat." },
  { command: "dog", name: "Good boy", hint: "Meet the resident ASCII dog." },
  { command: "rocket", name: "Launch sequence", hint: "Launch an ASCII rocket." },
  { command: "moon", name: "Lunar clock", hint: "Show today's approximate moon phase." },
  { command: "hug", name: "Care packet", hint: "A little encouragement." },
  { command: "ping", name: "Echo chamber", hint: "Send an imaginary packet." },
  { command: "xyzzy", name: "Hidden passage", hint: "An homage to Colossal Cave Adventure." },
] as const;

export function eggOutput(command: string, handle: string, random = Math.random, now = new Date()): string | null {
  switch (command) {
    case "hello": return `Secret handshake accepted. Welcome to @${handle}'s node. 🤝`;
    case "coffee": return "☕ [██████████] 100%\nCoffee brewed. Caffeine levels nominal.";
    case "fortune": return ["Small commits. Big dreams.", "Your next bug is your next lesson.", "The best optimization is deleting work.", "Ship something kind today."][Math.floor(random() * 4)] ?? "Keep building.";
    case "flip": return random() < 0.5 ? "🪙 HEADS" : "🪙 TAILS";
    case "roll": return `🎲 d20 → ${Math.floor(random() * 20) + 1}`;
    case "42": return "Deep Thought: 42.\nNow, what was the question?";
    case "cat": return " /\_/\\\n( o.o )\n > ^ <\nmeow. your code is purr-fect.";
    case "dog": return " / \__\n(    @\\___\n /         O\n/   (_____/\nGood boy. Good commit.";
    case "rocket": return "    /\\\n   /  \\\n  | HUD|\n /|    |\\\n  /_||_\\\n    **\n3… 2… 1… liftoff! 🚀";
    case "moon": { const age = ((now.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000 % 29.53059 + 29.53059) % 29.53059; return `${["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"][Math.round(age / 29.53059 * 8) % 8]} Lunar age: ${age.toFixed(1)} days (approximate)`; }
    case "hug": return "(づ｡◕‿‿◕｡)づ\nCare packet delivered. You are doing better than you think.";
    case "ping": return "PING imagination.local\n64 imaginary bytes: time=0ms\n0% packet loss. 100% good vibes.";
    case "xyzzy": return "A hollow voice says: ‘Nothing happens.’\nYou found the hidden passage anyway. ✨";
    default: return null;
  }
}