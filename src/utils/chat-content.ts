import type { ChatContent, MultimodalBlock } from '../types/chat';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const MEDIA_URL_REG = /https?:\/\/[^\s<>{}]+|data:image\/[a-zA-Z0-9.+-]+;base64,[^\s<>{}]+/g;

// 去掉 URL 后面常见的句末标点，避免把标点带进媒体地址里。
function stripUrlTrailingPunctuation(url: string): string {
  return url.replace(/[.,，。!！?？;；:：)）\]]+$/g, '');
}

// 判断是否是可作为多模态图片输入的 URL，支持 http(s) 图片和 base64 图片。
function isImageUrl(value: string): boolean {
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value)) return true;

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const pathname = url.pathname.toLowerCase();
    return Array.from(IMAGE_EXTENSIONS).some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

// 判断是否是可作为多模态视频输入的 http(s) URL。
function isVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const pathname = url.pathname.toLowerCase();
    return Array.from(VIDEO_EXTENSIONS).some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

// 遍历输入文本中的媒体 URL，并用调用方传入的格式替换。
function replaceInputMediaUrls(text: string, replacer: (url: string, type: 'image' | 'video') => string): string {
  return text.replace(MEDIA_URL_REG, (rawUrl) => {
    const url = stripUrlTrailingPunctuation(rawUrl);
    const type = isImageUrl(url) ? 'image' : isVideoUrl(url) ? 'video' : null;
    if (!type) return rawUrl;

    const trailing = rawUrl.slice(url.length);
    return `${replacer(url, type)}${trailing}`;
  });
}

// 将输入框文本转换为对话接口 content：纯文本保持 string，包含媒体时转换为多模态数组。
export function parseInputContent(text: string): ChatContent {
  const blocks: MultimodalBlock[] = [];
  let hasMedia = false;
  let lastIndex = 0;

  for (const match of text.matchAll(MEDIA_URL_REG)) {
    const rawUrl = match[0];
    const url = stripUrlTrailingPunctuation(rawUrl);
    const start = match.index ?? 0;
    const end = start + url.length;

    const type = isImageUrl(url) ? 'image' : isVideoUrl(url) ? 'video' : null;
    if (!type) continue;

    const before = text.slice(lastIndex, start).trim();
    if (before) {
      blocks.push({ type: 'text', text: before });
    }
    blocks.push(type === 'image' ? { type: 'image_url', imageUrl: { url } } : { type: 'video_url', videoUrl: { url } });
    hasMedia = true;
    lastIndex = end;
  }

  if (!hasMedia) return text;

  const rest = text.slice(lastIndex).trim();
  if (rest) {
    blocks.push({ type: 'text', text: rest });
  }

  return blocks;
}

// 将历史消息中的图片标签转换为 Markdown 图片，交给 ReactMarkdown 渲染。
export function convertMsgImageUrlsToMarkdown(content: string): string {
  return content.replace(/<msg-img-url>([\s\S]*?)<\/msg-img-url>/g, (_, url: string) => {
    const imageUrl = url.trim();
    return imageUrl ? `![图片](${imageUrl})` : '';
  });
}

// 将输入框里的媒体 URL 转换为历史消息同款标签，保证本地消息和历史消息渲染一致。
export function convertInputMediaUrlsToMsgTags(content: string): string {
  return replaceInputMediaUrls(content, (url, type) => {
    return type === 'image' ? `<msg-img-url>${url}</msg-img-url>` : `<msg-video-url>${url}</msg-video-url>`;
  });
}

// 将历史消息中的视频标签转换为 Markdown 链接，再由自定义 Markdown 组件渲染为 video。
export function convertMsgVideoUrlsToMarkdown(content: string): string {
  return content.replace(/<msg-video-url>([\s\S]*?)<\/msg-video-url>/g, (_, url: string) => {
    const videoUrl = url.trim();
    return videoUrl ? `[视频](${videoUrl})` : '';
  });
}

// 统一处理历史消息中的媒体标签。
export function convertMsgMediaUrlsToMarkdown(content: string): string {
  return convertMsgVideoUrlsToMarkdown(convertMsgImageUrlsToMarkdown(content));
}
