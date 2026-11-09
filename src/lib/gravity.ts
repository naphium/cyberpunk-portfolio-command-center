export async function collapseElements() {
  const { Engine, Bodies, Composite } = await import("matter-js");
  const engine = Engine.create();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("#projects-content article, .portfolio-shell [role=tabpanel] h2"))
    .filter((node) => !node.closest("article"));
  // Cards are included separately so their nested headings are not detached.
  nodes.push(...document.querySelectorAll<HTMLElement>("#projects-content article"));
  const originals = nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    const style = node.getAttribute("style");
    const body = Bodies.rectangle(Math.max(20, Math.min(width - 20, rect.x + rect.width / 2)), Math.min(height / 2, rect.y + rect.height / 2), rect.width, rect.height, { restitution: 0.65, friction: 0.2 });
    Object.assign(node.style, { position: "fixed", left: "0", top: "0", width: `${rect.width}px`, height: `${rect.height}px`, margin: "0", zIndex: "75", animation: "none", transition: "none", pointerEvents: "none" });
    return { node, style, body, rect };
  });
  Composite.add(engine.world, [
    ...originals.map((item) => item.body),
    Bodies.rectangle(width / 2, height + 40, width * 3, 80, { isStatic: true }),
    Bodies.rectangle(-40, height / 2, 80, height * 3, { isStatic: true }),
    Bodies.rectangle(width + 40, height / 2, 80, height * 3, { isStatic: true }),
  ]);
  let raf = 0;
  let last = performance.now();
  const step = (now: number) => {
    Engine.update(engine, Math.min(1000 / 60, now - last));
    last = now;
    originals.forEach(({ node, body, rect }) => {
      node.style.transform = `translate(${body.position.x - rect.width / 2}px, ${body.position.y - rect.height / 2}px) rotate(${body.angle}rad)`;
    });
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => {
    cancelAnimationFrame(raf);
    originals.forEach(({ node, style }) => { if (style === null) node.removeAttribute("style"); else node.setAttribute("style", style); });
    Composite.clear(engine.world, false);
    Engine.clear(engine);
  };
}