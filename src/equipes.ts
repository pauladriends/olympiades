import {
	calculerIndiceSimilarite,
	type Epreuve,
	type Match,
} from "./olympiade";

export class Equipe {
	nom: string;
	famille: string;
	adultes: number;
	ageEnfant1: number;
	ageEnfant2?: number;
	ageEnfant3?: number;
	ageMoyen: number;
	adversaires: Adversaire[] = [];

	constructor(row: any) {
		this.nom = row.nom;
		this.famille = row.famille;
		this.adultes = +row.adultes;
		this.ageEnfant1 = +row.ageEnfant1;
		if (row.ageEnfant2) this.ageEnfant2 = +row.ageEnfant2;
		if (row.ageEnfant3) this.ageEnfant3 = +row.ageEnfant3;
		this.ageMoyen = +(row.ageMoyen.replace(",", ".") || 0);
	}

	genererAdversaires(equipes: Equipe[]) {
		for (const equipe of equipes) {
			if (this.nom !== equipe.nom) {
				const indiceSimilarite = calculerIndiceSimilarite(this, equipe);
				if (indiceSimilarite >= 82)
					this.adversaires.push({ equipe, indiceSimilarite });
			}
		}
		this.adversaires.sort((a, b) => b.indiceSimilarite - a.indiceSimilarite);
	}

	simplifie(avecAdversaire: boolean): any {
		if (avecAdversaire)
			return {
				nom: this.nom,
				famille: this.famille,
				ageMoyen: this.ageMoyen,
				adversaires: this.adversaires.map((adversaire) => ({
					equipe: adversaire.equipe.simplifie(false),
					indiceSimilarite: adversaire.indiceSimilarite,
				})),
			};
		return { nom: this.nom, famille: this.famille, ageMoyen: this.ageMoyen };
	}

	nonAffronte(adversaire: Adversaire, matchs: Match[]): boolean {
		const dejaAffronte = matchs.some(
			(match) =>
				(match.equipe1.nom === this.nom &&
					match.equipe2.nom === adversaire.equipe.nom) ||
				(match.equipe2.nom === this.nom &&
					match.equipe1.nom === adversaire.equipe.nom),
		);
		return !dejaAffronte;
	}

	aFaitEpreuve(epreuve: Epreuve, matchs: Match[]): boolean {
		for (const match of matchs) {
			if (
				(match.equipe1.nom === this.nom || match.equipe2.nom === this.nom) &&
				match.epreuve === epreuve
			)
				return true;
		}
		return false;
	}
}

export interface Adversaire {
	equipe: Equipe;
	indiceSimilarite: number;
}
