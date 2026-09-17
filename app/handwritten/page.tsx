import type { Metadata } from "next";
import { HandwrittenTool } from "@/components/handwritten-tool";

export const metadata: Metadata = { title: "手書きの卦を読み解く — 易の余白" };

export default function HandwrittenPage() {
  return <HandwrittenTool />;
}
