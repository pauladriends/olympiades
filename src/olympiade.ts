import type { Equipe } from "./equipes";

export const matchs: Match[] = [];

export class Round {
	numero: number;
	matchs: Match[];

	constructor(numero: number, matchs: Match[] = []) {
		this.numero = numero;
		this.matchs = matchs;
	}

	simplifie(): any {
		return {
			numero: this.numero,
			matchs: this.matchs.map((match) => match.simplifie()),
		};
	}
}

export class Match {
	epreuve: Epreuve;
	equipe1: Equipe;
	equipe2: Equipe;

	constructor(epreuve: Epreuve, equipe1: Equipe, equipe2: Equipe) {
		this.epreuve = epreuve;
		this.equipe1 = equipe1;
		this.equipe2 = equipe2;
	}

	simplifie(): any {
		return {
			epreuve: this.epreuve.nom,
			equipe1: this.equipe1.simplifie(false),
			equipe2: this.equipe2.simplifie(false),
		};
	}
}

export function afficherEpreuvesParEquipe(
	matchs: Match[],
	equipes: Equipe[],
): void {
	for (const equipe of equipes) {
		const epreuvesEquipe = matchs
			.filter(
				(match) =>
					match.equipe1?.nom === equipe.nom ||
					match.equipe2?.nom === equipe.nom,
			)
			.map((match) => match.epreuve.nom);

		const totalEpreuves = new Set(epreuvesEquipe).size;
		const totalParticipations = epreuvesEquipe.length;

		console.log(
			`Équipe ${equipe.nom} a participé à ${totalParticipations} épreuve(s) distincte(s) sur un total de ${totalEpreuves} épreuve(s).`,
		);
	}
}

export class Epreuve {
	nbParRound = 1;
	nom: NomEpreuve;

	constructor(nom: NomEpreuve, nbParRound?: number) {
		this.nom = nom;
		if (nbParRound) this.nbParRound = nbParRound;
	}
}

export enum NomEpreuve {
	COURSE_SAC = "Course en sac",
	PARCOURS_COMBATTANT = "Parcours combattant",
	LANCER_POIDS = "Lancer de poids",
	BASKET = "Basket",
	TIR_ARC = "Tir à l'arc",
	PARCOURS_YEUX_BANDES = "Parcours yeux bandés",
	COURSE_2 = "Course à 2",
	BIATHLON = "Biathlon",
	CURLING = "Curling",
	LANCER_BOULES_DE_NEIGES = "Lancer de boules de neige",
	HOCKEY = "Hockey"
}

export const epreuves = [
	new Epreuve(NomEpreuve.COURSE_SAC, 2),
	new Epreuve(NomEpreuve.CURLING),
	new Epreuve(NomEpreuve.LANCER_BOULES_DE_NEIGES),
	new Epreuve(NomEpreuve.HOCKEY),
	new Epreuve(NomEpreuve.TIR_ARC, 2),
	new Epreuve(NomEpreuve.BIATHLON),
];

export function calculerIndiceSimilarite(
	equipe1: Equipe,
	equipe2: Equipe,
): number {
	const ecartMoyenneAge = Math.abs(equipe1.ageMoyen - equipe2.ageMoyen);
	const scoreMoyenneAge = Math.max(0, 100 - ecartMoyenneAge * 10);
	const agesEquipe1 = [
		equipe1.ageEnfant1,
		equipe1.ageEnfant2,
		equipe1.ageEnfant3,
	].filter(Boolean);
	const agesEquipe2 = [
		equipe2.ageEnfant1,
		equipe2.ageEnfant2,
		equipe2.ageEnfant3,
	].filter(Boolean);

	let scoreAges = 0;
	for (const age1 of agesEquipe1) {
		for (const age2 of agesEquipe2) {
			if (age1 === age2) scoreAges += 20;
			else if (
				age1 !== undefined &&
				age2 !== undefined &&
				Math.abs(age1 - age2) <= 2
			)
				scoreAges += 10;
		}
	}

	const ecartMaxEnfants =
		Math.max(...agesEquipe1.filter((age): age is number => age !== undefined)) -
		Math.min(...agesEquipe1.filter((age): age is number => age !== undefined));
	if (ecartMaxEnfants > 7) scoreAges -= 5;

	const indiceSimilarite = Math.min(
		100,
		Math.max(0, scoreMoyenneAge + scoreAges),
	);
	return Math.round(indiceSimilarite);
}

export function organiserMatchsParRound(
	matchs: Match[],
	epreuves: Epreuve[],
): Round[] {
	const rounds: Round[] = [];
	const epreuvesDisponiblesParRound: Record<
		number,
		Record<string, number>
	> = {};

	for (const match of matchs) {
		let roundAjoute = false;

		for (const round of rounds) {
			const roundIndex = round.numero;

			if (!epreuvesDisponiblesParRound[roundIndex]) {
				epreuvesDisponiblesParRound[roundIndex] = {};
				for (const epreuve of epreuves)
					epreuvesDisponiblesParRound[roundIndex][epreuve.nom] =
						epreuve.nbParRound;
			}

			const epreuveRestante =
				epreuvesDisponiblesParRound[roundIndex][match.epreuve.nom] || 0;

			const equipeDejaPresente = round.matchs.some(
				(m) =>
					m.equipe1.nom === match.equipe1.nom ||
					m.equipe1.nom === match.equipe2.nom ||
					m.equipe2.nom === match.equipe1.nom ||
					m.equipe2.nom === match.equipe2.nom,
			);

			if (epreuveRestante > 0 && !equipeDejaPresente) {
				round.matchs.push(match);
				epreuvesDisponiblesParRound[roundIndex][match.epreuve.nom]--;
				roundAjoute = true;
				break;
			}
		}

		if (!roundAjoute) {
			const nouveauRound = new Round(rounds.length + 1, [match]);

			rounds.push(nouveauRound);

			const roundIndex = nouveauRound.numero;
			epreuvesDisponiblesParRound[roundIndex] = {};
			for (const epreuve of epreuves)
				epreuvesDisponiblesParRound[roundIndex][epreuve.nom] =
					epreuve.nbParRound;

			epreuvesDisponiblesParRound[roundIndex][match.epreuve.nom]--;
		}
	}

	return rounds;
}

export function compterMatchsParEquipe(
	matchs: Match[],
	rounds: Round[],
): Record<string, { nombreMatchs: number; rounds: number[] }> {
	const statsParEquipe: Record<
		string,
		{ nombreMatchs: number; rounds: number[] }
	> = {};

	for (const round of rounds) {
		for (const match of round.matchs) {
			if (!statsParEquipe[match.equipe1.nom])
				statsParEquipe[match.equipe1.nom] = { nombreMatchs: 0, rounds: [] };

			statsParEquipe[match.equipe1.nom].nombreMatchs++;
			if (!statsParEquipe[match.equipe1.nom].rounds.includes(round.numero))
				statsParEquipe[match.equipe1.nom].rounds.push(round.numero);

			if (!statsParEquipe[match.equipe2.nom])
				statsParEquipe[match.equipe2.nom] = { nombreMatchs: 0, rounds: [] };

			statsParEquipe[match.equipe2.nom].nombreMatchs++;
			if (!statsParEquipe[match.equipe2.nom].rounds.includes(round.numero))
				statsParEquipe[match.equipe2.nom].rounds.push(round.numero);
		}
	}

	for (const [equipe, stats] of Object.entries(statsParEquipe))
		console.log(
			`Équipe ${equipe} a participé à ${stats.nombreMatchs} match(s) dans les rounds: ${stats.rounds.join(", ")}.`,
		);

	return statsParEquipe;
}

export function randomiserOrdreRounds(rounds: Round[]): Round[] {
	const roundsMelanges = [...rounds];
	for (let i = roundsMelanges.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[roundsMelanges[i], roundsMelanges[j]] = [
			roundsMelanges[j],
			roundsMelanges[i],
		];
	}

	roundsMelanges.forEach((round, idx) => {
		round.numero = idx + 1;
	});
	return roundsMelanges;
}
