import { NextResponse } from "next/server";
import https from "https";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwBJ6JmWincwI5wpAeo9JgkYwSMyCqROByfUXzMjZdRtmssZy_PHQDWZ6C1m6gD3Uyf/exec";

function getWithParams(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          const originalParams = new URL(url).search;
          const finalUrl =
            location +
            (location.includes("?") ? "&" : "?") +
            originalParams.slice(1);
          https
            .get(finalUrl, (res2) => {
              let data = "";
              res2.on("data", (chunk) => (data += chunk));
              res2.on("end", () => resolve(data));
            })
            .on("error", reject);
        } else {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
        }
      })
      .on("error", reject);
  });
}

export async function POST(request) {
  const body = await request.json();
  const params = new URLSearchParams({
    description: body.description || "",
    reporter: body.reporter || "",
    type: body.type || "",
    page: body.page || "",
  });
  const url = `${SCRIPT_URL}?${params.toString()}`;
  const text = await getWithParams(url);
  console.log("[bug-report response]:", text);
  return NextResponse.json({ success: true });
}
