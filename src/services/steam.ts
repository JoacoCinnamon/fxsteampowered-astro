import { load, type CheerioAPI } from "cheerio";
import { Err, formatARS, formatUSD, Ok, to } from "../utils";
import { convertDollarToARS } from "./dolar";

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
const TITLE_ID = "#appHubName";
const DESCRIPTION_CLASS = ".game_description_snippet";
const CURRENCY_META_PROPERTY = "meta[itemprop='priceCurrency']";
const PRICE_META_PROPERTY = "meta[itemprop='price']";
const IMAGE_CLASS = ".game_header_image_full";
const DIV_WITH_VIDEOS_ID = "#highlight_player_area";

export const I_HAVE_NO_MOUTH_AND_I_MUST_SCREAM_ID = 245390;

export const getGameUrl = (gameId: string) =>
	`${STORE_STEAMPOWERED_URL}/app/${gameId}`;

export async function getGameHtml(gameId: string) {
	const headers = {
		"User-Agent":
			"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
		"Accept-Language": "es-ES,es;q=0.8",
	};

	const [err, res] = await to(
		fetch(`${STORE_STEAMPOWERED_URL}/app/${gameId}`, { headers }),
	);

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

const getGameTitle = ($: CheerioAPI) => {
	const titleElement = $(TITLE_ID);
	return titleElement.text() || null;
};

const getGameDescription = ($: CheerioAPI) => {
	const descriptionElement = $(DESCRIPTION_CLASS);
	return descriptionElement.text() || null;
};

const getGamePrice = ($: CheerioAPI) => {
	const currencyElement = $(CURRENCY_META_PROPERTY).attr("content");
	const priceElement = $(PRICE_META_PROPERTY).attr("content");

	if (!currencyElement || !priceElement) return null;

	return {
		currency: currencyElement as "USD" | "ARS",
		value: priceElement ?? "0.00",
	};
};

const getGameImage = ($: CheerioAPI) => {
	const imageElement = $(IMAGE_CLASS).attr("src");
	return imageElement || null;
};

const getGameWebmVideo = ($: CheerioAPI) => {
	const videoElement = $("DIV_WITH_VIDEOS_ID");
	if (videoElement.length === 0) return null;

	const videoUrl = videoElement
		.find("[data-webm-source]")
		.first()
		.attr("data-webm-source");
	return videoUrl || null;
};

export async function getGame(gameId: string) {
	const [err, gameHtml] = await getGameHtml(gameId);
	if (err != null) {
		console.error(err);
		return Err(err);
	}

	// Load the HTML into Cheerio
	const $document = load(gameHtml);

	const gameWebmVideo = getGameWebmVideo($document);
	const steamGame: SteamGame = {
		id: gameId,
		title: getGameTitle($document) ?? "",
		description: getGameDescription($document) ?? "",
		price: getGamePrice($document) ?? null,
		imagesUrl: [getGameImage($document) ?? ""],
		videosUrl: gameWebmVideo ? [gameWebmVideo] : null,
	};

	return Ok(steamGame);
}

export async function formatDescription(steamGame: SteamGame) {
	// If is F2P or doesn't have price, return description as is
	if (!steamGame.price || steamGame.price.value === "0.00") {
		return `${steamGame.description} \r\n Free`;
	}

	const formattedGameUSDPrice = formatUSD(steamGame.price.value);

	const [err, gameARSPrice] = await convertDollarToARS(
		steamGame.price.value,
	);
	// If there was an error converting the USD price ARS, just return description + USD Price
	if (err != null) {
		console.error(err);
		return `${steamGame.description} \r\n\n ${formattedGameUSDPrice}`;
	}

	return `${steamGame.description} \r\n\n ${formattedGameUSDPrice} - ${formatARS(gameARSPrice)}`;
}
