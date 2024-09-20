import { parseHtml } from "@/lib/dom";
import { Err, Ok, to } from "../utils";

type SteamGame = {
  id: string;
  title: string;
  description: string;
  price: GamePrice | null;
  imagesUrl: string[];
  videosUrl: string[] | null;
};
type GamePrice = {
  currency: "USD" | "ARS";
  value: string;
};

const STORE_STEAMPOWERED_URL = "https://store.steampowered.com";
const DIV_WITH_VIDEOS_ID = "highlight_player_area"

export const getGameUrl = (gameId: string) =>
  `${STORE_STEAMPOWERED_URL}/app/${gameId}`;

export async function getGameHtml(gameId: string) {
  const [err, res] = await to(fetch(`${STORE_STEAMPOWERED_URL}/app/${gameId}`));

  if (err != null) return Err(err);
  if (!res.ok) {
    return Err(
      new Error(
        `Failed to fetch game data from Steam. Status: ${res.status} ${res.statusText}. URL: ${STORE_STEAMPOWERED_URL}/app/${gameId}`,
      ),
    );
  }

  try {
    const html = await res.text();
    return Ok(html);
  } catch (error) {
    if (error instanceof Error) return Err(error);

    return Err(new Error("Unknown error while parsing Steam game HTML"));
  }
}

const getGameTitle = (document: Document) => {
  const titleElement = document.querySelector(".apphub_AppName");
  if (titleElement == null) return null;
  if (titleElement.textContent == null) return null;
  return titleElement.textContent;
};

const getGameDescription = (document: Document) => {
  const descriptionElement = document.querySelector(
    ".game_description_snippet",
  );
  if (descriptionElement == null) return null;
  if (descriptionElement.textContent == null) return null;
  return descriptionElement.textContent;
};

const getGamePrice = (document: Document) => {
  // Search this two elements
  // <meta itemprop="priceCurrency" content="USD">
  // <meta itemprop="price" content="7.99">
  const currencyElement = document.querySelector(
    "meta[itemprop='priceCurrency']",
  );
  const priceElement = document.querySelector("meta[itemprop='price']");
  if (currencyElement == null || priceElement == null) return null;
  if (currencyElement.getAttribute("content") == null) return null;
  return {
    currency: currencyElement.getAttribute("content") as "USD",
    value: priceElement.getAttribute("content") ?? "0.00",
  };
};

const getGameImage = (document: Document) => {
  const imageElement = document.querySelector(".game_header_image_full");
  if (imageElement == null) return null;
  if (imageElement.getAttribute("src") == null) return null;
  return imageElement.getAttribute("src");
};

const getGameVideo = (document: Document) => {
  // const steamCdnRegex = /https:\/\/cdn\.akamai\.steamstatic\.com\/.*?\.webm/g;
  // const videoUrls = htmlStr.match(steamCdnRegex);
  // return videoUrls && videoUrls.length > 0 ? videoUrls[0] : null;
  const videoElement = document.getElementById(DIV_WITH_VIDEOS_ID);
  if (videoElement == null) return null;

  const videoDivs = videoElement.querySelectorAll("[data-webm-source]");

  // Return the first video URL if found, otherwise return null
  if (videoDivs.length > 0) {
    const firstVideoDiv = videoDivs[0];
    const videoUrl = firstVideoDiv.getAttribute("data-webm-source");
    return videoUrl ? videoUrl : null;
  }

  return null;
};

export async function getGame(gameId: string) {
  const [err, gameHtml] = await getGameHtml(gameId);
  if (err != null) {
    console.error(err);
    return Err(err);
  }

  const { document } = parseHtml(gameHtml);

  const price = getGamePrice(document);
  const gameVideo = getGameVideo(document);
  const steamGame: SteamGame = {
    id: gameId,
    title: getGameTitle(document) ?? "",
    description: getGameDescription(document) ?? "",
    price: {
      currency: price?.currency ?? "USD",
      value: price?.value ?? "0",
    },
    imagesUrl: [getGameImage(document) ?? ""],
    videosUrl: gameVideo ? [gameVideo] : null,
  };

  return Ok(steamGame);
}
