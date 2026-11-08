import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FaviconField } from "@/components/admin/fields";

describe("FaviconField", () => {
  it("fetches a favicon from the link URL entered in admin", () => {
    const onChange = vi.fn();
    render(<FaviconField value="" pageUrl="https://github.com/naphium/project" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Fetch favicon" }));

    expect(onChange).toHaveBeenCalledWith("https://www.google.com/s2/favicons?domain=github.com&sz=128");
  });
});
