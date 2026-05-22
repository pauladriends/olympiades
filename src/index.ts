import { genererFichierExcel, importEquipes, saveJSON } from "./data";
import {
	epreuves,
	Match,
	matchs,
	organiserMatchsParRound,
	randomiserOrdreRounds,
	type Round,
} from "./olympiade";

async function main() {
	const EQUIPES_CSV = "data/equipes.csv";
	const EQUIPES_DB = "data/equipes.json";
	const MATCHS_DB = "data/matchs.json";
	const OLYMPIADE_DB = "data/olympiade.json";
	const OLYMPIADE_EXCEL = "data/olympiade.xlsx";

	console.log(`📦 Import des équipes depuis ${EQUIPES_CSV}`);
	const equipes = await importEquipes(EQUIPES_CSV);
	console.log(`✅ ${equipes.length} équipes récupérées.`);

	console.log("🤼 Generation des adversaires");
	for (const equipe of equipes) {
		console.log(`🧮 Calcul des adversaires pour ${equipe.nom}`);
		equipe.genererAdversaires(equipes);
		console.log(`🔍 ${equipe.adversaires.length} adversaires trouvés.`);
	}
	console.log(`💾 Sauvegarde des équipes dans ${EQUIPES_DB}`);
	equipes.sort((a, b) => a.adversaires.length - b.adversaires.length);
	await saveJSON(
		EQUIPES_DB,
		equipes.map((equipe) => equipe.simplifie(true)),
	);

	for (const equipe of equipes) {
		console.log(`👥 Pour l'équipe ${equipe.nom} :`);
		for (const epreuve of epreuves) {
			if (!equipe.aFaitEpreuve(epreuve, matchs)) {
				for (const adversaire of equipe.adversaires) {
					if (
						equipe.nonAffronte(adversaire, matchs) &&
						!adversaire.equipe.aFaitEpreuve(epreuve, matchs)
					) {
						const match = new Match(epreuve, equipe, adversaire.equipe);
						matchs.push(match);
						console.log(
							`-> Match généré : ${match.equipe1.nom} vs ${match.equipe2.nom} (${match.epreuve.nom})`,
						);
						break;
					}
				}
			}
		}
	}

	console.log(`💾 Sauvegarde des matchs dans ${MATCHS_DB}`);
	await saveJSON(
		MATCHS_DB,
		matchs.map((match) => match.simplifie()),
	);

	console.log("🏆 Génération des round et du tournoi");
	let rounds: Round[] = organiserMatchsParRound(matchs, epreuves);
	// rounds = randomiserOrdreRounds(rounds);
	console.log(`💾 Sauvegarde du tournoi dans ${OLYMPIADE_DB}`);
	await saveJSON(
		OLYMPIADE_DB,
		rounds.map((round) => round.simplifie()),
	);

	genererFichierExcel(rounds, OLYMPIADE_EXCEL);
	console.log(`✅ Fichier Excel généré : ${OLYMPIADE_EXCEL}`);
}

main();
