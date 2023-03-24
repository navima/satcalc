/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Graph, ItemRate, OutputNode, Node, Recipe, RecipeNode, Edge, Item } from '../model';

export default class CalculatorService {
	items: Map<string, Item> = new Map<string, Item>([
		['ironOre', new Item('Iron ore')],
		['ironIngot', new Item('Iron ingot')],
		['ironPlate', new Item('Iron plate')],
		['reinforcedIronPlate', new Item('Reinforced iron plate')],
		['screw', new Item('Screw')],
		['ironRod', new Item('Iron rod')]
	]);
	recipes: Recipe[] = [
		{
			name: 'Reinforced Iron Plate',
			inputs: [
				{ item: this.items.get('ironPlate')!, rate: 30 },
				{ item: this.items.get('screw')!, rate: 60 }
			],
			outputs: [
				{ item: this.items.get('reinforcedIronPlate')!, rate: 5 }
			]
		},
		{
			name: 'Iron Plate',
			inputs: [
				{ item: this.items.get('ironIngot')!, rate: 30 }
			],
			outputs: [
				{ item: this.items.get('ironPlate')!, rate: 20 }
			]
		},
		{
			name: 'Screw',
			inputs: [
				{ item: this.items.get('ironRod')!, rate: 10 }
			],
			outputs: [
				{ item: this.items.get('screw')!, rate: 40 }
			]
		},
		{
			name: 'Iron Rod',
			inputs: [
				{ item: this.items.get('ironIngot')!, rate: 15 }
			],
			outputs: [
				{ item: this.items.get('ironRod')!, rate: 15 }
			]
		}
	];

	calculate(inputs: ItemRate[], outputs: ItemRate[]): Graph {
		const graph = new Graph([]);
		this.expand(graph, inputs, outputs);
		this.prune(graph);
		this.simplify(graph);
		return graph;
	}

	expand(graph: Graph, inputs: ItemRate[], outputs: ItemRate[]): void {
		let iterations = 0;
		const perimeter: Node[] = [];
		for (const output of outputs) {
			perimeter.push(new OutputNode(output));
		}
		while (perimeter.length > 0 && iterations++ < 100) {
			console.log(perimeter);
			const node = perimeter.pop();
			console.log('Current node: ', node);
			if (node instanceof OutputNode) {
				const opNode = node as OutputNode;
				const recipesProducing = this.findRecipesProducing(opNode.item);
				addRecipeNodes(recipesProducing, opNode, opNode.item);
			} else if (node instanceof RecipeNode) {
				const recipeNode = node as RecipeNode;
				for (const input of recipeNode.getScaledInputs()) {
					const recipesProducing = this.findRecipesProducing(input);
					addRecipeNodes(recipesProducing, recipeNode, input);
				}
			}
		}

		function addRecipeNodes(recipesProducing: RecipeNode[], outputNode: Node, item: ItemRate) {
			for (const recipeNode of recipesProducing) {
				console.log('Adding recipe node: ' + recipeNode.recipe.name + ' x' + recipeNode.multiplier);
				graph.nodes.push(recipeNode);
				const edge = new Edge(recipeNode, outputNode, item);
				recipeNode.outgoingEdges.push(edge);
				outputNode.incomingEdges.push(edge);
				perimeter.push(recipeNode);
			}
		}
	}

	findRecipesProducing(item: ItemRate): RecipeNode[] {
		return this.recipes
			.filter(recipe => recipe.outputs.some(output => output.item === item.item)) // TODO dictionary for caching
			.map(recipe => {
				const multiplier = item.rate / recipe.outputs.find(output => output.item === item.item)!.rate;
				return new RecipeNode(recipe, multiplier);
			});
	}


	prune(graph: Graph): void {
		console.log('Pruning graph');
	}


	simplify(graph: Graph): void {
		console.log('Simplifying graph');
	}
}
