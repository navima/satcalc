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
}

export class OutputNode extends Node {
	public item: ItemRate;
	public constructor(item: ItemRate) {
		super();
		this.item = item;
	}
	public get friendlyName(): string {
		return 'Output: ' + this.item.item.name + ' x' + this.item.rate + '\t WP: ' + this.cost;
	}
}

export class InputNode extends Node {
	public item: ItemRate;
	public constructor(item: ItemRate) {
		super();
		this.item = item;
	}
	public get friendlyName(): string {
		return 'Input: ' + this.item.item.name + ' x' + this.item.rate + '\t WP: ' + this.cost;
	}
}

