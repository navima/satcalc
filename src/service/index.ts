/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Graph, ItemRate, OutputNode, Node, Recipe, RecipeNode, Edge, Item, InputNode } from '../model';
import { items, recipes } from './data';

export default class CalculatorService {
	public constructor() {
		console.log('CalculatorService created');
	}
	items: Map<string, Item> = items;
	recipes: Recipe[] = recipes;

	public calculate(inputs: ItemRate[], outputs: ItemRate[]): Graph {
		const graph = new Graph([]);
		this.expand(graph, inputs, outputs);
		this.prune(graph);
		this.simplify(graph);
		console.log(`Created graph with ${graph.nodes.length} nodes, 
roots=[
	${graph.getRoots().map(n => n.friendlyName).join('\n    ')}
], 
leaves=[
	${graph.getLeaves().map(n => n.friendlyName).join('\n    ')}
]
intermediate=[
	${graph.nodes.filter(n => !n.isRoot && !n.isLeaf).map(n => n.friendlyName).join('\n    ')}
]`);
		return graph;
	}

	private expand(graph: Graph, inputs: ItemRate[], outputs: ItemRate[]): void {
		let iterations = 0;
		const perimeter: Node[] = [];
		for (const output of outputs) {
			const opNode = new OutputNode(output);
			perimeter.push(opNode);
			graph.nodes.push(opNode);
		}
		while (perimeter.length > 0 && iterations++ < 100) {
			console.log(perimeter.map(n => n.friendlyName));
			const node = perimeter.pop()!;
			if (node instanceof OutputNode) {
				const opNode = node as OutputNode;
				const recipesProducing = this.findRecipesProducing(opNode.item);
				if (recipesProducing.length !== 0) {
					addRecipeNodes(recipesProducing, opNode, opNode.item);
				} else {
					console.log('No recipes producing ' + opNode.item.item.name);
					addInputNodes(opNode, opNode.item);
				}
			} else if (node instanceof RecipeNode) {
				const recipeNode = node as RecipeNode;
				for (const input of recipeNode.getScaledInputs()) {
					const recipesProducing = this.findRecipesProducing(input);
					if (recipesProducing.length !== 0) {
						addRecipeNodes(recipesProducing, recipeNode, input);
					} else {
						console.log('No recipes producing ' + input.item.name);
						addInputNodes(recipeNode, input);
					}
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

		function addInputNodes(outputNode: Node, item: ItemRate) {
			const inputNode = new InputNode(item);
			console.log('Adding input node: ' + inputNode.item.item.name + ' x' + inputNode.item.rate);
			graph.nodes.push(inputNode);
			const edge = new Edge(inputNode, outputNode, item);
			inputNode.outgoingEdges.push(edge);
			outputNode.incomingEdges.push(edge);
		}
	}

	private findRecipesProducing(item: ItemRate): RecipeNode[] {
		return this.recipes
			.filter(recipe => recipe.outputs.some(output => output.item === item.item)) // TODO dictionary for caching
			.map(recipe => {
				const multiplier = item.rate / recipe.outputs.find(output => output.item === item.item)!.rate;
				return new RecipeNode(recipe, multiplier);
			});
	}


	private prune(graph: Graph): void {
		console.log('Pruning graph');
	}


	private simplify(graph: Graph): void {
		console.log('Simplifying graph');
	}
}
