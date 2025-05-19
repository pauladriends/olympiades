import fs from "node:fs";
import { parse } from "fast-csv";
import { Equipe } from "./equipes";
import type { Round } from "./olympiade";
import * as XLSX from "xlsx";

export async function importEquipes(path: string): Promise<Equipe[]> {
	return new Promise((resolve, reject) => {
		const equipes: Equipe[] = [];
		fs.createReadStream(path)
			.pipe(parse({ headers: true, trim: true }))
			.on("error", reject)
			.on("data", (row) => equipes.push(new Equipe(row)))
			.on("end", () => resolve(equipes));
	});
}

export async function saveJSON<T>(path: string, data: T[]): Promise<void> {
	await fs.promises.writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

export function genererFichierExcel(
	rounds: Round[],
	cheminFichier: string,
): void {
	const workbook = XLSX.utils.book_new();

	const data = rounds.flatMap((round) =>
		round.matchs.map((match) => ({
			Round: round.numero,
			Épreuve: match.epreuve.nom,
			NomEquipe1: match.equipe1.nom,
			FamilleEquipe1: match.equipe1.famille,
			RésultatEquipe1: "",
			NomEquipe2: match.equipe2.nom,
			FamilleEquipe2: match.equipe2.famille,
			RésultatEquipe2: "",
		})),
	);

	const worksheet = XLSX.utils.json_to_sheet(data);
	XLSX.utils.book_append_sheet(workbook, worksheet, "Tournoi");

	const compterMatchsEtRoundsParEquipe = (rounds: Round[]) => {
		const roundNumbers = Array.from(new Set(rounds.map((r) => r.numero))).sort(
			(a, b) => a - b,
		);

		const equipeNames = new Set<string>();
		for (const round of rounds) {
			for (const match of round.matchs) {
				equipeNames.add(match.equipe1.nom);
				equipeNames.add(match.equipe2.nom);
			}
		}

		const stats: Record<
			string,
			{
				nbMatchs: number;
				rounds: Record<
					number,
					{ adv: string; epreuve: string; resultat: string }
				>;
			}
		> = {};
		for (const nom of equipeNames) {
			stats[nom] = { nbMatchs: 0, rounds: {} };
		}

		for (const round of rounds) {
			for (const match of round.matchs) {
				stats[match.equipe1.nom].nbMatchs += 1;
				stats[match.equipe2.nom].nbMatchs += 1;
				stats[match.equipe1.nom].rounds[round.numero] = {
					adv: match.equipe2?.nom ?? null,
					epreuve: match.epreuve?.nom ?? null,
					resultat: "",
				};
				stats[match.equipe2.nom].rounds[round.numero] = {
					adv: match.equipe1?.nom ?? null,
					epreuve: match.epreuve?.nom ?? null,
					resultat: "",
				};
			}
		}

		return Object.entries(stats).map(([nom, { nbMatchs, rounds }]) => {
			const row: Record<string, string | number | null> = {
				Equipe: nom,
				NbMatchs: nbMatchs,
			};
			for (const roundNum of roundNumbers) {
				row[`Round${roundNum}`] =
					rounds[roundNum] && rounds[roundNum].adv
						? rounds[roundNum].adv
						: null;
				row[`Epreuve${roundNum}`] =
					rounds[roundNum] && rounds[roundNum].epreuve
						? rounds[roundNum].epreuve
						: null;
				row[`Resultat${roundNum}`] = "";
			}
			return row;
		});
	};

	const statsData = compterMatchsEtRoundsParEquipe(rounds);
	const statsSheet = XLSX.utils.json_to_sheet(statsData);
	XLSX.utils.book_append_sheet(workbook, statsSheet, "Stats Equipes");

	XLSX.writeFile(workbook, cheminFichier);
}
