import { Err, Ok, to } from "@/utils";

type DolarAmbitoFinancieroAPI = {
	compra: string;
	venta: string;
	valor: string;
	fecha: string;
	variacion: string;
	"class-variacion": string;
	"variacion-nombre": string;
};

export async function getLatestDolarCripto() {
	const [err, res] = await to(
		fetch("https://mercados.ambito.com/dolarcripto/variacion"),
	);
	if (err != null) {
		return Err(err);
	}

	try {
		const dolarCripto = (await res.json()) as DolarAmbitoFinancieroAPI;
		return Ok(dolarCripto);
	} catch (error) {
		if (error instanceof Error) return Err(error);
		return Err(
			new Error("Unknown error while fetching Dolar Cripto", { cause: error }),
		);
	}
}

// TODO: Generic function to accept multiple types of currency/"dolares"
export async function convertDollarToARS(dollarAmount: string) {
	const amount = Number.parseFloat(dollarAmount);
	if (Number.isNaN(amount)) {
		return Err(new Error(`Invalid dollar amount: ${dollarAmount}`));
	}

	// TODO: Fetch dolar cripto per request?
	const [err, dolarCripto] = await getLatestDolarCripto();
	if (err != null) {
		return Err(err);
	}

	const dolarCriptoValue = Number.parseFloat(dolarCripto.venta);
	if (Number.isNaN(dolarCriptoValue)) {
		return Err(new Error("Invalid exchange rate received from API"));
	}

	const convertedAmount = amount * dolarCriptoValue;
	return Ok(convertedAmount);
}
