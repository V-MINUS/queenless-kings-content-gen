/**
 * QK system prompts + per-platform tuning.
 */

export const QK_SYSTEM_PROMPT = `You are a content writer for Queenless Kings, a 5-piece alternative rock band from Kerry, Ireland.

BAND FACTS (use only these — do not invent information):
- Band name: Queenless Kings
- Members: 5-piece band
- Genre: Alternative Rock
- Location: Kerry, Ireland
- Latest release: "Piece of Cake" (2024)
- Instagram: @queenlesskingsmusic

CONTENT GUIDELINES:
1. Be factual — only use the information provided above
2. Be authentic — write in a genuine, non-hyperbolic tone
3. No clickbait — avoid phrases like "YOU WON'T BELIEVE", "AMAZING", "INCREDIBLE"
4. No false claims — don't invent awards, chart positions, or achievements
5. SEO-friendly — use relevant keywords naturally
6. Platform-appropriate — respect character limits and formatting conventions
7. Professional but personable — the band is approachable and genuine

AVOID:
- Superlatives without basis ("best", "greatest", "most amazing")
- Urgency manipulation ("limited time", "act now", "don't miss out")
- False scarcity ("only X left", "selling fast")
- Invented quotes or testimonials
- Claims about streaming numbers or fan counts unless provided

OUTPUT:
Return ONLY the post content ready to paste into the platform, followed by a blank line
and then a single line of relevant hashtags (if appropriate for the platform). No headers,
no explanations, no markdown.`;

export type Platform = "facebook" | "instagram" | "tiktok" | "twitter";
export type Tone = "casual" | "excited" | "professional" | "humorous" | "heartfelt";
export type PostType =
  | "gig-announcement"
  | "music-release"
  | "behind-the-scenes"
  | "merchandise"
  | "band-update"
  | "fan-engagement";
export type HashtagStyle = "auto" | "none" | "minimal" | "heavy";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  "gig-announcement": "Gig announcement",
  "music-release": "Music release",
  "behind-the-scenes": "Behind the scenes",
  "merchandise": "Merchandise",
  "band-update": "Band update",
  "fan-engagement": "Fan engagement",
};

export const HASHTAG_INSTRUCTIONS: Record<HashtagStyle, string> = {
  auto: "Include a natural set of hashtags appropriate to the platform on a new line after the post content.",
  none: "Do not include any hashtags.",
  minimal: "Include 3-5 relevant hashtags on a new line after the post content.",
  heavy: "Include 10-15 relevant hashtags on a new line after the post content (Instagram style).",
};

export const PLATFORM_CONSTRAINTS: Record<Platform, string> = {
  instagram: "Maximum 2200 characters. Line breaks are fine. Emojis are welcome but don't overuse them.",
  facebook: "No hard character limit, aim for 100-400 words. Emojis are optional.",
  tiktok: "Short and punchy, under 150 chars. Use 3-5 trending-style hashtags.",
  twitter: "Maximum 280 characters including hashtags. Be concise.",
};

export interface PlatformConfig {
  name: string;
  charLimit: number;
  hashtagAdvice: string;
  styleNotes: string;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  twitter: "Twitter / X",
};

export const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  facebook: 2000,
  tiktok: 300,
  twitter: 280,
};

export interface PresetRequest {
  postType: PostType;
  platform: Platform;
  tone: Tone;
  hashtagStyle: HashtagStyle;
  details: string;
  cta?: string;
}

export function buildPresetUserPrompt(req: PresetRequest): string {
  const platformRule = PLATFORM_CONSTRAINTS[req.platform];
  const hashtagRule = HASHTAG_INSTRUCTIONS[req.hashtagStyle];
  const postTypeNice = req.postType.replace(/-/g, " ");
  let prompt =
    `Write a ${req.tone} ${postTypeNice} post for ${req.platform}.\n\n` +
    `Platform constraints: ${platformRule}\n` +
    `Hashtag rule: ${hashtagRule}\n\n` +
    `Content details:\n${req.details.trim()}\n`;
  if (req.cta && req.cta.trim()) {
    prompt += `\nInclude this call-to-action naturally: ${req.cta.trim()}`;
  }
  return prompt;
}

export type EditAction = "regenerate" | "shorten" | "lengthen" | "tone" | "freeform";

export interface EditRequest {
  action: EditAction;
  current: string;
  platform?: Platform;
  newTone?: Tone;
  freeformInstruction?: string;
}

export function buildEditUserPrompt(req: EditRequest): string {
  const platform = req.platform ?? "instagram";
  const limit = PLATFORM_CHAR_LIMITS[platform];
  const platformLabel = PLATFORM_LABELS[platform];
  const lines = [
    `Here is an existing social post for Queenless Kings:`,
    "---",
    req.current,
    "---",
    "",
  ];
  switch (req.action) {
    case "regenerate":
      lines.push(`Rewrite this post on the same topic with fresh phrasing. Keep length under ${limit} chars.`);
      break;
    case "shorten":
      lines.push(`Shorten this to roughly half the length while keeping the core message. Target ${platformLabel}.`);
      break;
    case "lengthen":
      lines.push(`Expand this with more detail and context, but stay under ${limit} chars. Target ${platformLabel}.`);
      break;
    case "tone":
      lines.push(`Rewrite this with a ${req.newTone ?? "casual"} tone. Keep length similar.`);
      break;
    case "freeform":
      lines.push(`Apply this instruction to the post: ${req.freeformInstruction}`);
      break;
  }
  lines.push("", "Return only the rewritten post content. No preamble.");
  return lines.join("\n");
}
