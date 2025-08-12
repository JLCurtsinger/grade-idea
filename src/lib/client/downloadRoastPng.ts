import * as htmlToImage from "html-to-image";

export async function downloadRoastCardPng(node: HTMLElement, filename = "roast.png") {
  const dataUrl = await htmlToImage.toPng(node, { backgroundColor: "#0a0a0b", pixelRatio: 2 });
  const a = document.createElement("a");
  a.download = filename; 
  a.href = dataUrl; 
  a.click();
}
