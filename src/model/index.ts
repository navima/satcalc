export class Item {
	public name: string;
	public constructor(name: string) {
		this.name = name;
	}
}

export class SolidItem extends Item {
	public constructor(name: string) {
		super(name);
	}
}

export class LiquidItem extends Item {
	public constructor(name: string) {
		super(name);
	}
}

export class ItemRate {
	public item: Item;
	public rate: number;
	public constructor(item: Item, rate: number) {
		this.item = item;
		this.rate = rate;
	}
	public static simplify(rates: ItemRate[]): ItemRate[] {
		const rateMap = new Map<string, number>();
		for (const rate of rates) {
			const existingRate = rateMap.get(rate.item.name);
			if (existingRate) {
				rateMap.set(rate.item.name, existingRate + rate.rate);
			} else {
				rateMap.set(rate.item.name, rate.rate);
			}
		}
		const simplifiedRates: ItemRate[] = [];
		for (const [name, rate] of rateMap) {
			simplifiedRates.push(new ItemRate(new Item(name), rate));
		}
		return simplifiedRates;
	}
	public lessThan(other: ItemRate | undefined): boolean {
		return this != undefined && other != undefined && this.item.name === other.item.name && this.rate < other.rate;	// TODO: for some reason, this doesn't work with reference comparison, only name
	}
	public lessThanOrEqual(other: ItemRate | undefined): boolean {
		return this != undefined && other != undefined && this.item.name === other.item.name && this.rate <= other.rate; // TODO: for some reason, this doesn't work with reference comparison, only name
	}
	public get friendlyName(): string {
		return `${this.item.name} x ${this.rate.toFixed(2)}`;
	}
}

export class Recipe {
	public name: string;
	public alt = false;
	public machine: string;
	public inputs: ItemRate[];
	public outputs: ItemRate[];
	public constructor(name: string, machine: string, inputs: ItemRate[], outputs: ItemRate[], alt = false) {
		this.name = name;
		this.machine = machine;
		this.inputs = inputs;
		this.outputs = outputs;
		this.alt = alt;
	}
}

export class Graph {
	public nodes: Node[];
	public constructor(nodes: Node[]) {
		this.nodes = nodes;
	}
	public getRoots(): Node[] {
		return this.nodes.filter(node => node.isRoot);
	}
	public getLeaves(): Node[] {
		return this.nodes.filter(node => node.isLeaf);
	}
	public delete(node: Node): void {
		for (const child of node.children) {
			child.removeParent(node);
		}
		for (const parent of node.parents) {
			parent.removeChild(node);
		}
		this.nodes.splice(this.nodes.indexOf(node), 1);
	}
	public deleteCascadingTowardsRoot(node: Node): void {
		for (const parent of node.parents) {
			this.deleteCascadingTowardsRoot(parent);
		}
		this.delete(node);
	}
}

export abstract class Node {
	public incomingEdges: Edge[] = [];
	public outgoingEdges: Edge[] = [];
	public cost = undefined as number | undefined;
	public get isRoot(): boolean {
		return this.incomingEdges.length === 0;
	}
	public get isLeaf(): boolean {
		return this.outgoingEdges.length === 0;
	}
	public get children(): Node[] {
		return this.outgoingEdges.map(edge => edge.target);
	}
	public get parents(): Node[] {
		return this.incomingEdges.map(edge => edge.source);
	}
	public removeParent(parent: Node): void {
		const parentEdges = this.incomingEdges.filter(edge => edge.source === parent);
		for (const parentEdge of parentEdges) {
			this.incomingEdges.splice(this.incomingEdges.indexOf(parentEdge), 1);
			parent.outgoingEdges.splice(parent.outgoingEdges.indexOf(parentEdge), 1);
		}
	}
	public removeChild(child: Node): void {
		const childEdges = this.outgoingEdges.filter(edge => edge.target === child);
		for (const childEdge of childEdges) {
			this.outgoingEdges.splice(this.outgoingEdges.indexOf(childEdge), 1);
			child.incomingEdges.splice(child.incomingEdges.indexOf(childEdge), 1);
		}
	}
	public addChild(child: Node, item: ItemRate): void {
		const edge = new Edge(this, child, item);
		this.outgoingEdges.push(edge);
		child.incomingEdges.push(edge);
	}
	public addParent(parent: Node, item: ItemRate): void {
		const edge = new Edge(parent, this, item);
		this.incomingEdges.push(edge);
		parent.outgoingEdges.push(edge);
	}
	public getDistanceToLeaf(): number {
		if (this.isLeaf) {
			return 0;
		}
		return Math.min(...this.outgoingEdges.map(edge => edge.target.getDistanceToLeaf())) + 1;
	}
	public abstract get friendlyName(): string;
}

export class Edge {
	public source: Node;
	public target: Node;
	public item: ItemRate;
	public constructor(source: Node, target: Node, item: ItemRate) {
		this.source = source;
		this.target = target;
		this.item = item;
	}
	public get cost(): number | undefined {
		return this.source.cost;
	}
}

export class RecipeNode extends Node {
	public recipe: Recipe;
	public multiplier: number;
	public constructor(recipe: Recipe, multiplier: number) {
		super();
		this.recipe = recipe;
		this.multiplier = multiplier;
	}
	public getScaledInputs(): ItemRate[] {
		return this.recipe.inputs.map(input => new ItemRate(input.item, input.rate * this.multiplier));
	}
	public getScaledOutputs(): ItemRate[] {
		return this.recipe.outputs.map(output => new ItemRate(output.item, output.rate * this.multiplier));
	}
	public get friendlyName(): string {
		return 'Recipe: ' + this.recipe.name + ' x' + this.multiplier + '\t' + this.recipe.machine + '\t WP: ' + this.cost;
	}
	public isSatisfiedBy(inputs: ItemRate[]): boolean {
		return this.getScaledInputs().every(requirement => requirement.lessThanOrEqual(inputs.find(input => input.item.name === requirement.item.name))); // TODO: for some reason, this doesn't work with reference comparison, only name
	}
	public isSatisfied(): boolean {
		return this.isSatisfiedBy(ItemRate.simplify(this.incomingEdges.map(edge => edge.item)));
	}
}

export class OutputNode extends Node {
	public item: ItemRate;
	public constructor(item: ItemRate) {
		super();
		this.item = item;
	}
	public get friendlyName(): string {
		return 'Output: ' + this.item.friendlyName + '\t WP: ' + this.cost;
	}
}

export class InputNode extends Node {
	public item: ItemRate;
	public constructor(item: ItemRate) {
		super();
		this.item = item;
	}
	public get friendlyName(): string {
		return 'Input: ' + this.item.friendlyName + '\t WP: ' + this.cost;
	}
}

